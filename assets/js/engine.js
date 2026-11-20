/* In der Stadt 1 – Fahrzeuge — lógica pura (sin DOM): puntaje, marca verde, selección sin repetir, cola del Desafío sin tiempo. v1.1.1 (base: Mein Tag in der Stadt 1.0.1) */
(function (g) {
  'use strict';
  var CK = 'aleman_check_fahrzeuge', BK = 'fahrzeuge_best', TOPICS = ['art', 'wort', 'verb', 'adj', 'satz'];
  /* v1.1.0: Desafío sin tiempo. Clave propia; nunca toca CK ni BK */
  var BK_UNTIMED = 'fahrzeuge_best_untimed', UNTIMED_N = 20;
  function qualifies(score, done) { return score >= 13 && done === score; }
  function getChecks(st) { try { var v = JSON.parse(st.getItem(CK) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  /* Guarda récord y marcas. Devuelve {record, granted, checks} */
  function applyChallenge(st, topics, score, done) {
    var out = { record: false, granted: false, checks: getChecks(st) };
    var best = +(st.getItem(BK) || 0);
    if (score > best) { st.setItem(BK, String(score)); out.record = true; }
    if (qualifies(score, done)) {
      (topics || []).forEach(function (t) { if (TOPICS.indexOf(t) >= 0 && out.checks.indexOf(t) < 0) out.checks.push(t); });
      st.setItem(CK, JSON.stringify(out.checks));
      out.granted = true;
    }
    return out;
  }
  /* El Desafío usa SIEMPRE las preguntas rápidas de los 5 temas (los filtros no lo afectan; nunca queda con una sola respuesta posible).
     Practicar: solo los temas marcados. */
  function pool(items, topics, chal) {
    if (chal) return items.filter(function (it) { return it.kind === 'mc' && it.fast === true; });
    return items.filter(function (it) { return topics.indexOf(it.topic) >= 0; });
  }
  function key(given) { return Array.isArray(given) ? given.join(' ') : given; }
  function rightOf(it) { return it.kind === 'orden' ? it.a.join(' ') : it.a; }
  function isRight(it, given) {
    if (it.kind === 'orden') return it.acc.indexOf(key(given)) >= 0;
    return given === it.a;
  }
  /* Elige al azar evitando los últimos N ids y el mismo grupo (palabra/frase) dos veces seguidas */
  function makePicker(list, rng, recentN) {
    rng = rng || Math.random;
    var recent = [], lastG = null;
    var N = Math.min(recentN == null ? 12 : recentN, Math.max(0, list.length - 1));
    return function () {
      var cand = list.filter(function (x) { return recent.indexOf(x.id) < 0 && x.grp !== lastG; });
      if (!cand.length) cand = list.filter(function (x) { return x.grp !== lastG; });
      if (!cand.length) cand = list.slice();
      var pick = cand[Math.floor(rng() * cand.length)];
      recent.push(pick.id); if (recent.length > N) recent.shift();
      lastG = pick.grp;
      return pick;
    };
  }
  function shuffle(a, rng) { rng = rng || Math.random; a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* Mezcla las fichas sin dejarlas en un orden ya correcto (eso regalaría la respuesta) */
  function shuffleChunks(it, rng) {
    var s, tries = 0;
    do { s = shuffle(it.chunks, rng); tries++; } while (it.acc.indexOf(s.join(' ')) >= 0 && tries < 50);
    return s;
  }
  /* Opciones visibles. Si el ítem tiene show, se muestran la correcta + (show-1) incorrectas al azar; siempre en orden al azar */
  function optionsFor(it, rng) {
    var o = it.o;
    if (it.show && o.length > it.show) o = [it.a].concat(shuffle(o.filter(function (x) { return x !== it.a; }), rng).slice(0, it.show - 1));
    return shuffle(o, rng);
  }

  /* ---------- v1.1.0: Desafío sin tiempo ---------- */
  /* Mejor marca sin tiempo: solo enteros de 0 a max (vacío, «abc», «1e1», «999», «-3», «5.5» → 0) */
  function clampUntimedBest(v, max) {
    max = max == null ? UNTIMED_N : max;
    var s = v == null ? '' : String(v).trim();
    if (!/^\d+$/.test(s)) return 0;
    var n = Number(s);
    return Number.isInteger(n) && n >= 0 && n <= max ? n : 0;
  }
  function getUntimedBest(st) { try { return clampUntimedBest(st.getItem(BK_UNTIMED)); } catch (e) { return 0; } }
  /* Guarda solo BK_UNTIMED, solo si la ronda se completó y supera la mejor marca. Nunca toca CK ni BK. */
  function applyUntimed(st, score, goal, completed) {
    var best = getUntimedBest(st), out = { record: false, best: best, saved: false };
    if (!completed) return out;
    if (clampUntimedBest(score, goal) !== score) return out;
    if (score > best) { st.setItem(BK_UNTIMED, String(score)); out.record = true; out.best = score; out.saved = true; }
    return out;
  }
  /* Cola de la ronda sin tiempo: n preguntas ÚNICAS del mismo pozo que el Desafío 60 s.
     - Nunca la misma pregunta ni la misma palabra de la hoja (grp y wk: «der Bus» y «el bus → der Bus»; «einsteigen = subirse» y «Me subo… ¿ein?»).
     - Tampoco dos preguntas en que una ya muestra la respuesta de la otra: si la frase completa o la explicación de una
       trae la respuesta de la otra junto a la palabra de al lado del hueco («du fährst», «zu Fuß», «ist schneller», «wann kommt»…).
     - Por estratos = tipo de pregunta (der/die/das, plural, palabras, verbos, separables, formas, comparar, am …sten, frases),
       en proporción al pozo, como el sorteo parejo del 60 s. Los decimales se reparten con muestreo sistemático:
       la cantidad de cada tipo cambia de ronda en ronda y la media es la del 60 s.
       El tipo se ve en la consigna y no dice la respuesta, así que contar tipos no deja deducir nada.
     - Si el pozo tiene menos de n ítems, se usa entero. */
  function quotas(keys, sizes, total, goal, rng) {
    var q = {}, frac = [], sum = 0;
    keys.forEach(function (t) { var e = goal * sizes[t] / total; q[t] = Math.floor(e); sum += q[t]; frac.push([t, e - q[t]]); });
    var extra = goal - sum;
    if (extra > 0) {
      frac = shuffle(frac, rng);
      var u = rng(), acc = 0;
      frac.forEach(function (f) { var lo = acc; acc += f[1]; if (extra > 0 && Math.floor(acc - u + 1) - Math.floor(lo - u + 1) > 0) { q[f[0]]++; extra--; } });
      for (var i = 0; extra > 0 && i < frac.length; i++) { if (q[frac[i][0]] < sizes[frac[i][0]]) { q[frac[i][0]]++; extra--; } }
    }
    return q;
  }
  function gk(it) { return it.grp || it.id; }
  function norm(x) { return ' ' + String(x || '').replace(/<[^>]+>/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').toLowerCase().trim() + ' '; }
  /* lo que el niño ve de una pregunta (consigna, frase completa, lo que se oye, explicación) */
  function seenText(it) { if (MEMO.seen[it.id]) return MEMO.seen[it.id]; return MEMO.seen[it.id] = norm([it.q, it.de ? it.de.replace('___', Array.isArray(it.a) ? it.a.join(' ') : it.a) : '', it.say, it.e].join(' . ')); }
  /* la respuesta con la palabra de al lado del hueco (frases, verbos, separables, formas, comparar). der/die/das, plural,
     palabras ES↔DE y am …sten se cubren aparte con revealsB (v1.1.1) */
  function gapCtx(it) {
    if (!it.de || it.kind !== 'mc' || it.type === 'art' || it.type === 'plural') return [];
    var parts = it.de.split('___'), l = norm(parts[0]).trim().split(' ').filter(Boolean), r = norm(parts[1]).trim().split(' ').filter(Boolean), a = norm(it.a).trim(), out = [];
    if (l.length) out.push(l[l.length - 1] + ' ' + a); if (r.length) out.push(a + ' ' + r[0]);
    return out;
  }
  function shows(a, b) { var t = seenText(a); return gapCtx(b).some(function (x) { return t.indexOf(' ' + x + ' ') >= 0; }); }
  /* v1.1.1 (B1 del tester): también cuenta TODO lo que se ve de una pregunta, antes y después de contestar:
     consigna, frase con hueco, CADA opción, frase completa, lo que se oye y la explicación. En esos trozos:
     - der/die/das: «artículo + sustantivo» (p. ej. la opción «der Krankenwagen» revela «___ Krankenwagen»);
     - plural: la forma plural (p. ej. «Busse»);
     - palabras ES↔DE: la palabra alemana y su traducción juntas en lo que se ve (p. ej. «Der Bus …» + «el bus …»);
     - am …sten: «sustantivo ist am …sten».
     Más estricta que «una sola combinación»: basta con que aparezca la correcta, aunque también aparezca otra. */
  var MEMO = { segs: {}, seen: {} };
  function segs(it) {
    if (MEMO.segs[it.id]) return MEMO.segs[it.id];
    var out = MEMO.segs[it.id] = [];
    [it.q, it.de, it.de ? it.de.replace('___', Array.isArray(it.a) ? it.a.join(' ') : it.a) : '', Array.isArray(it.a) ? it.a.join(' ') : it.a, it.say, it.e].concat(it.o || [])
      .forEach(function (t) { String(t || '').replace(/<[^>]+>/g, ' ').split(/[.?!=—→·;:()|«»,–]+/).forEach(function (x) { x = norm(x); if (x.trim()) out.push(x); }); });
    return out;
  }
  function has(S, g) { g = ' ' + norm(g).trim() + ' '; for (var i = 0; i < S.length; i++) if (S[i].indexOf(g) >= 0) return true; return false; }
  function hasAll(S, g) { var t = ' ' + S.join(' | ') + ' '; return t.indexOf(' ' + norm(g).trim() + ' ') >= 0; }
  function revealKeys(b) {
    if (b.kind !== 'mc') return null;
    if (b.type === 'art') return { seg: [b.a + ' ' + b.de.replace('___', '').trim()] };
    if (b.type === 'plural') return { seg: [b.a] };
    if (b.type === 'sup') return { seg: [String(b.a).split(' ').slice(-1)[0] + ' ist ' + b.q.replace(/^Was ist /, '').replace('?', '')] };
    if (b.type === 'wort') { var key = (b.q.match(/«([^»]+)»/) || [])[1]; return key ? { both: [b.a, key] } : null; }
    return null;
  }
  function revealsB(a, b) {
    var k = revealKeys(b); if (!k) return false;
    var S = segs(a);
    if (k.seg) return k.seg.some(function (g) { return has(S, g); });
    return k.both.every(function (g) { return hasAll(S, g); });
  }
  function clash(a, b) {
    if (a === b || a.id === b.id || gk(a) === gk(b)) return true;
    var wa = a.wk || [], wb = b.wk || [];
    for (var i = 0; i < wa.length; i++) if (wb.indexOf(wa[i]) >= 0) return true;
    return shows(a, b) || shows(b, a) || revealsB(a, b) || revealsB(b, a);
  }
  function clashMap(items) {
    MEMO = { segs: {}, seen: {} }; /* textos de cada pregunta, una sola vez (rápido también en un teléfono) */
    var m = {}; items.forEach(function (x) { m[x.id] = {}; });
    for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) if (clash(items[i], items[j])) { m[items[i].id][items[j].id] = 1; m[items[j].id][items[i].id] = 1; }
    return m;
  }
  /* v1.1.1: pesos por pregunta (solo el Desafío sin tiempo). Una pregunta que choca con muchas (p. ej. «el bus → der Bus»:
     «der Bus» sale en muchas frases) quedaría fuera más seguido que en el 60 s; su peso la compensa para que cada pregunta salga
     casi tan seguido como en el 60 s y la mezcla de respuestas (der/die/das, ein/aus/an…) sea la misma. Pesos calculados con
     tests/calibrate_weights.mjs (se repite la ronda muchas veces y se ajusta). Una pregunta sin peso cuenta como 1. */
  var UW = {"art-0":1.12,"art-1":0.892,"art-2":0.9,"art-3":1.032,"art-4":1.049,"art-5":1.043,"art-6":1.247,"art-7":0.877,"art-8":0.89,"art-9":0.897,"art-10":0.906,"art-11":0.9,"art-12":1.091,"art-13":1.281,"art-14":0.892,"art-15":1.455,"art-16":0.919,"art-17":0.862,"art-18":0.9,"art-19":1.073,"art-20":1.057,"art-21":0.877,"pl-0":0.998,"pl-1":0.948,"pl-2":0.993,"pl-3":2.123,"pl-4":0.97,"pl-5":0.975,"pl-6":0.969,"pl-7":0.973,"pl-8":0.969,"pl-9":0.99,"pl-10":0.983,"pl-11":0.97,"pl-12":0.948,"pl-13":0.992,"pl-14":0.987,"pl-15":0.971,"pl-16":0.98,"pl-17":0.959,"pl-18":0.981,"pl-19":0.959,"pl-20":0.968,"wde-0":5.698,"wes-0":2.884,"wde-1":1.341,"wes-1":0.833,"wde-2":1.209,"wes-2":0.75,"wde-3":1.349,"wes-3":0.837,"wde-4":1.373,"wes-4":0.875,"wde-5":1.527,"wes-5":0.817,"wde-6":1.893,"wes-6":0.987,"wde-7":1.349,"wes-7":0.84,"wde-8":1.316,"wes-8":0.829,"wde-9":1.347,"wes-9":0.829,"wde-10":1.277,"wes-10":0.833,"wde-11":1.335,"wes-11":0.828,"wde-12":1.326,"wes-12":0.818,"wde-13":1.379,"wes-13":0.815,"wde-14":1.338,"wes-14":0.817,"wde-15":1.616,"wes-15":0.977,"wde-16":1.538,"wes-16":0.847,"wde-17":1.356,"wes-17":0.815,"wde-18":1.334,"wes-18":0.805,"wde-19":1.345,"wes-19":0.83,"wde-20":1.32,"wes-20":0.835,"wde-21":1.34,"wes-21":0.858,"vde-0":0.766,"ves-0":0.754,"vde-1":1.168,"ves-1":1.24,"vde-2":0.774,"ves-2":0.744,"vde-3":0.742,"ves-3":0.756,"vde-4":1.041,"ves-4":1.034,"vde-5":0.688,"ves-5":0.686,"vde-6":1.175,"ves-6":1.174,"vde-7":1.032,"ves-7":1.01,"aes-0":0.621,"aes-1":0.606,"aes-2":0.594,"aes-3":0.618,"conj-0":1.265,"conj-1":0.557,"conj-2":1.324,"conj-3":0.62,"conj-4":0.602,"conj-5":1.362,"conj-6":1.701,"conj-7":1.76,"conj-8":1.098,"conj-9":0.62,"conj-10":0.893,"conj-11":0.974,"conj-12":1.269,"conj-13":0.487,"conj-14":1.613,"conj-15":1.827,"teil-0":1.028,"teil-1":1.023,"teil-2":0.997,"teil-3":1.028,"teil-4":1.044,"teil-5":1.103,"adjf-0":1.013,"adjf-1":1.009,"adjf-2":0.99,"adjf-3":0.974,"adjf-4":1.023,"adjf-5":0.989,"adjf-6":1.006,"adjf-7":0.985,"cmp-0":1.082,"cmp-1":0.928,"cmp-2":1.068,"cmp-3":1.016,"cmp-4":0.942,"cmp-5":0.922,"cmp-6":1.101,"cmp-7":0.985,"cmp-8":1.046,"cmp-9":1.061,"cmp-10":1.074,"cmp-11":0.954,"sup-0":1.017,"sup-1":1.032,"sup-2":1.009,"sup-3":1.026,"satz-0":0.58,"satz-1":1.169,"satz-2":1.502,"satz-3":1.245,"satz-4":1.287,"satz-5":0.582,"satz-6":1.193,"satz-7":1.217};
  function setWeights(w) { UW = w || {}; }
  /* orden al azar con pesos (sin reemplazo): clave −ln(u)/peso, de menor a mayor */
  function wshuffle(list, rng) {
    return list.map(function (it) { var w = UW[it.id] || 1; return [Math.max(1e-12, -Math.log(1 - rng())) / w, it]; })
      .sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; });
  }
  var CMAP = { list: null, map: null }, STATS = { rounds: 0, attempts: 0, fallback: 0 };
  /* v1.1.1 (N3 del tester): las cantidades por tipo varían más, con la misma media que el 60 s.
     - Los tipos de adjetivo (formas, comparar, am …sten) comparten los 4 adjetivos de la hoja y nunca pueden ser más de 4:
       se quedan con la cuota sistemática (media exacta, sin topes que cambien la media).
     - El resto de la ronda (16 o 17) se reparte mitad con cuotas sistemáticas y mitad con el tipo de preguntas sacadas
       al azar de esos tipos (como el sorteo del 60 s). Así der/die/das va de 0 a 7, palabras de 4 a 13, etc. */
  var ADJ_T = { adjf: 1, adjv: 1, sup: 1 };
  function mixedQuotas(keys, sizes, items, goal, rng) {
    var q = quotas(keys, sizes, items.length, goal, rng), rest = 0, other = keys.filter(function (t) { return !ADJ_T[t]; });
    other.forEach(function (t) { rest += q[t]; q[t] = 0; });
    var tot = 0, sz = {}; other.forEach(function (t) { sz[t] = sizes[t]; tot += sizes[t]; });
    var m = Math.floor(rest / 2), q2 = quotas(other, sz, tot, rest - m, rng);
    other.forEach(function (t) { q[t] = q2[t]; });
    var pool = items.filter(function (it) { return !ADJ_T[it.type]; });
    shuffle(pool.map(function (_, i) { return i; }), rng).slice(0, m).forEach(function (i) { q[pool[i].type]++; });
    return q;
  }
  function buildUntimedQueue(items, n, rng) {
    rng = rng || Math.random; n = n == null ? UNTIMED_N : n;
    var goal = Math.min(n, items.length);
    if (!goal) return [];
    if (CMAP.list !== items) { CMAP.list = items; CMAP.map = clashMap(items); }
    var M = CMAP.map, strata = {}, keys = [];
    items.forEach(function (it) { var t = it.type; if (!strata[t]) { strata[t] = []; keys.push(t); } strata[t].push(it); });
    var sizes = {}; keys.forEach(function (t) { sizes[t] = strata[t].length; });
    /* orden de llenado: separables, am …sten y formas (los más chicos), luego der/die/das, luego frases; el resto al azar.
       Así ein/aus/an, las 4 de am …sten y der/die/das salen con la misma mezcla de respuestas que el 60 s. */
    var ORDER = ['teil', 'sup', 'adjf', 'art', 'satz'], FIRST = ORDER.filter(function (t) { return sizes[t]; }), small = [],
      big = keys.filter(function (t) { return ORDER.indexOf(t) < 0; });
    function free(it, chosen) { for (var i = 0; i < chosen.length; i++) if (M[it.id][chosen[i].id]) return false; return true; }
    var q;
    for (var attempt = 0; attempt < 400; attempt++) {
      /* misma cuota para varios intentos seguidos: si una cuota es posible, casi siempre se arma, así no se pierden las cuotas «difíciles» */
      if (attempt % 25 === 0) q = mixedQuotas(keys, sizes, items, goal, rng);
      var out = [], okAll = true; STATS.attempts++;
      /* primero los tipos chicos (separables, am …sten, formas, frases): así eligen parejo entre todas sus preguntas
         (ein/aus/an como en el 60 s); los demás tipos van en orden al azar en cada intento, para que ninguno se quede siempre con lo que sobra */
      FIRST.concat(small, shuffle(big, rng)).forEach(function (t) {
        if (!okAll) return;
        var cand = wshuffle(strata[t], rng), got = 0;
        for (var i = 0; i < cand.length && got < q[t]; i++) if (free(cand[i], out)) { out.push(cand[i]); got++; }
        if (got < q[t]) okAll = false;
      });
      if (okAll && out.length === goal) { STATS.rounds++; return shuffle(out, rng); }
    }
    STATS.fallback++;
    /* Respaldo (pozos chicos o raros; no pasa con el pozo real): primero sin choques, luego ítems únicos;
       nunca la misma pregunta dos veces y, si se puede, nunca dos de la misma palabra seguidas */
    var pool = shuffle(items, rng), res = [], rest = [];
    pool.forEach(function (it) { if (res.length < goal && free(it, res)) res.push(it); else rest.push(it); });
    while (res.length < goal && rest.length) res.push(rest.shift());
    var seq = [];
    while (res.length) {
      var last = seq.length ? gk(seq[seq.length - 1]) : null, left = {};
      res.forEach(function (it) { left[gk(it)] = (left[gk(it)] || 0) + 1; });
      var best = -1, idx = -1;
      res.forEach(function (it, k) { if (gk(it) !== last && left[gk(it)] > best) { best = left[gk(it)]; idx = k; } });
      if (idx < 0) idx = 0;
      seq.push(res.splice(idx, 1)[0]);
    }
    return seq;
  }
  g.FZ_ENGINE = { CK: CK, BK: BK, TOPICS: TOPICS, qualifies: qualifies, getChecks: getChecks, applyChallenge: applyChallenge, pool: pool, isRight: isRight, rightOf: rightOf, makePicker: makePicker, shuffle: shuffle, shuffleChunks: shuffleChunks, optionsFor: optionsFor,
    BK_UNTIMED: BK_UNTIMED, UNTIMED_N: UNTIMED_N, clampUntimedBest: clampUntimedBest, getUntimedBest: getUntimedBest, applyUntimed: applyUntimed, buildUntimedQueue: buildUntimedQueue, quotas: quotas, clash: clash, revealsB: revealsB, STATS: STATS, mixedQuotas: mixedQuotas, setWeights: setWeights, weights: function () { return UW; } };
})(typeof window !== 'undefined' ? window : globalThis);
