/* In der Stadt 1 – Fahrzeuge — lógica pura (sin DOM): puntaje, marca verde, selección sin repetir, cola del Desafío sin tiempo. v1.1.2 (base: Mein Tag in der Stadt 1.0.1) */
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
  /* Mejor marca sin tiempo: solo enteros de 0 a max escritos tal cual (vacío, «abc», «1e1», «999», «-3», «5.5» → 0;
     v1.1.2 (N5): también « 7 » y «07» → 0, porque la app solo guarda String(entero)) */
  function clampUntimedBest(v, max) {
    max = max == null ? UNTIMED_N : max;
    var s = v == null ? '' : String(v);
    if (!/^(0|[1-9]\d*)$/.test(s)) return 0;
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
  var MEMO = { segs: {}, seen: {}, raw: {} };
  function segs(it) {
    if (MEMO.segs[it.id]) return MEMO.segs[it.id];
    var out = MEMO.segs[it.id] = [];
    [it.q, it.de, it.de ? it.de.replace('___', Array.isArray(it.a) ? it.a.join(' ') : it.a) : '', Array.isArray(it.a) ? it.a.join(' ') : it.a, it.say, it.e, it.help /* v1.1.2: la Ayuda también se ve */].concat(it.o || [])
      .forEach(function (t) { String(t || '').replace(/<[^>]+>/g, ' ').split(/[.?!=—→·;:()|«»,–]+/).forEach(function (x) { x = norm(x); if (x.trim()) out.push(x); }); });
    return out;
  }
  function has(S, g) { g = ' ' + norm(g).trim() + ' '; for (var i = 0; i < S.length; i++) if (S[i].indexOf(g) >= 0) return true; return false; }
  function hasAll(S, g) { var t = ' ' + S.join(' | ') + ' '; return t.indexOf(' ' + norm(g).trim() + ' ') >= 0; }
  /* v1.1.2 (B1 y B2 del tester sobre v1.1.1 + auditoría general de pares):
     - Formas (Completa la fila): la forma correcta en cualquier texto visible (p. ej. la opción «kleiner» de un Compara).
     - Verbos (conjugación y frases con verbo): «pronombre + forma» (ich fahre, du fährst, wir fahren) en lo visible;
       con er/sie/es (persona o cosa), la forma de 3.ª persona en la consigna, la frase completa, lo que se oye o la explicación
       (p. ej. «Der Bus fährt um 8 Uhr ab» o «er/sie/es fährt» revela «Papa ___ mit dem Auto»). */
  var PRON = { ich: 1, du: 1, wir: 1, ihr: 1 };
  function verbKey(b) {
    if (!b.de || typeof b.a !== 'string' || b.a.indexOf(' ') >= 0) return null;
    if (b.type !== 'verb' && !(b.type === 'satz' && b.vf)) return null;
    var l = norm(b.de.split('___')[0]).trim().split(' ').filter(Boolean), w = l[l.length - 1];
    return PRON[w] ? { seg: [w + ' ' + b.a] } : { seen: [b.a] };
  }
  function revealKeys(b) {
    if (b.kind !== 'mc') return null;
    if (b.type === 'art') return { seg: [b.a + ' ' + b.de.replace('___', '').trim()] };
    if (b.type === 'plural' || b.type === 'adjf') return { seg: [b.a] };
    if (b.type === 'sup') return { seg: [String(b.a).split(' ').slice(-1)[0] + ' ist ' + b.q.replace(/^Was ist /, '').replace('?', '')] };
    if (b.type === 'wort') { var key = (b.q.match(/«([^»]+)»/) || [])[1]; return key ? { both: [b.a, key] } : null; }
    return verbKey(b);
  }
  /* v1.1.2: lo que se ve con mayúsculas (para reconocer el sustantivo alemán, no «al bus» en español) */
  function rawText(it) { if (MEMO.raw[it.id]) return MEMO.raw[it.id]; return MEMO.raw[it.id] = ' ' + [it.q, it.de ? it.de.replace('___', Array.isArray(it.a) ? it.a.join(' ') : it.a) : '', it.say, it.e].concat(it.o || []).join(' . ').replace(/<[^>]+>/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ') + ' '; }
  /* v1.1.2 (B2): el dibujo junto al sustantivo alemán revela «¿Cómo se dice…?» y «¿Qué significa…?» de ese sustantivo
     (🏍️ + «…als das Motorrad» → «la moto = das Motorrad»). em = dibujo del sustantivo (wde: pic; wes: em). */
  function picNoun(a, b) {
    if (b.type !== 'wort' || !a.pic || !b.noun || !b.em) return false;
    return a.pic.indexOf(b.em) >= 0 && rawText(a).indexOf(' ' + b.noun + ' ') >= 0;
  }
  /* v1.1.2: el significado del adjetivo (aes «¿Qué significa schnell?») se deduce de un Compara con dibujos o de un
     «am …sten» ya resuelto con esa misma palabra (✈️ 🚲 «Das Flugzeug ist schneller als das Fahrrad» → schnell = rápido). */
  function adjMeaning(a, b) {
    if (!b.wk || (a.type !== 'adjv' && a.type !== 'sup')) return false;
    return (a.wk || []).some(function (k) { return k.indexOf('j:') === 0 && b.wk.indexOf('js:' + k.slice(2)) >= 0; });
  }
  function revealsB(a, b) {
    if (picNoun(a, b) || adjMeaning(a, b)) return true;
    var k = revealKeys(b); if (!k) return false;
    if (k.seen) return k.seen.some(function (g) { return seenText(a).indexOf(' ' + norm(g).trim() + ' ') >= 0; });
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
    MEMO = { segs: {}, seen: {}, raw: {} }; /* textos de cada pregunta, una sola vez (rápido también en un teléfono) */
    var m = {}; items.forEach(function (x) { m[x.id] = {}; });
    for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) if (clash(items[i], items[j])) { m[items[i].id][items[j].id] = 1; m[items[j].id][items[i].id] = 1; }
    return m;
  }
  /* v1.1.1: pesos por pregunta (solo el Desafío sin tiempo). Una pregunta que choca con muchas (p. ej. «el bus → der Bus»:
     «der Bus» sale en muchas frases) quedaría fuera más seguido que en el 60 s; su peso la compensa para que cada pregunta salga
     casi tan seguido como en el 60 s y la mezcla de respuestas (der/die/das, ein/aus/an…) sea la misma. Pesos calculados con
     tests/calibrate_weights.mjs (se repite la ronda muchas veces y se ajusta). Una pregunta sin peso cuenta como 1.
     v1.1.2: recalculados con la regla ampliada (node calibrate_weights.mjs 20000 30 300 0.01; mejor iteración 28). */
  var UW = {"art-0":1.117,"art-1":0.889,"art-2":0.86,"art-3":1.02,"art-4":1.058,"art-5":1.048,"art-6":1.295,"art-7":0.852,"art-8":0.875,"art-9":0.886,"art-10":0.873,"art-11":0.882,"art-12":1.154,"art-13":1.374,"art-14":0.89,"art-15":1.476,"art-16":0.959,"art-17":0.839,"art-18":0.848,"art-19":1.071,"art-20":1.069,"art-21":0.85,"pl-0":0.985,"pl-1":0.958,"pl-2":0.962,"pl-3":2.264,"pl-4":0.968,"pl-5":0.973,"pl-6":0.97,"pl-7":0.978,"pl-8":0.948,"pl-9":0.958,"pl-10":0.962,"pl-11":0.983,"pl-12":0.963,"pl-13":0.951,"pl-14":0.952,"pl-15":0.975,"pl-16":0.952,"pl-17":0.952,"pl-18":0.96,"pl-19":0.941,"pl-20":0.961,"wde-0":12.926,"wes-0":5.199,"wde-1":1.147,"wes-1":0.726,"wde-2":0.886,"wes-2":0.547,"wde-3":1.195,"wes-3":0.731,"wde-4":1.649,"wes-4":0.997,"wde-5":1.357,"wes-5":0.73,"wde-6":2.541,"wes-6":1.21,"wde-7":0.986,"wes-7":0.611,"wde-8":0.991,"wes-8":0.603,"wde-9":0.994,"wes-9":0.609,"wde-10":1.222,"wes-10":0.627,"wde-11":0.978,"wes-11":0.614,"wde-12":2.495,"wes-12":1.489,"wde-13":2.652,"wes-13":1.522,"wde-14":0.991,"wes-14":0.607,"wde-15":1.908,"wes-15":1.107,"wde-16":2.251,"wes-16":1.113,"wde-17":1.008,"wes-17":0.619,"wde-18":0.996,"wes-18":0.603,"wde-19":1.134,"wes-19":0.722,"wde-20":1.208,"wes-20":0.722,"wde-21":0.988,"wes-21":0.604,"vde-0":0.605,"ves-0":0.603,"vde-1":2.155,"ves-1":0.899,"vde-2":0.621,"ves-2":0.608,"vde-3":0.974,"ves-3":0.59,"vde-4":1.32,"ves-4":0.795,"vde-5":0.748,"ves-5":0.534,"vde-6":1.007,"ves-6":1,"vde-7":0.892,"ves-7":0.784,"aes-0":1.408,"aes-1":1.413,"aes-2":1.41,"aes-3":1.391,"conj-0":207.339,"conj-1":0.037,"conj-2":1.182,"conj-3":0.042,"conj-4":0.041,"conj-5":149.106,"conj-6":13.453,"conj-7":13.181,"conj-8":0.122,"conj-9":0.036,"conj-10":0.069,"conj-11":161.193,"conj-12":1.288,"conj-13":0.03,"conj-14":178.611,"conj-15":14.654,"teil-0":1.185,"teil-1":1.155,"teil-2":1.123,"teil-3":1.152,"teil-4":1.161,"teil-5":1.149,"adjf-0":1.149,"adjf-1":0.887,"adjf-2":1.171,"adjf-3":0.916,"adjf-4":1.149,"adjf-5":0.901,"adjf-6":1.136,"adjf-7":0.88,"cmp-0":1.203,"cmp-1":0.991,"cmp-2":1.139,"cmp-3":0.893,"cmp-4":0.846,"cmp-5":0.8,"cmp-6":1.031,"cmp-7":0.961,"cmp-8":1.2,"cmp-9":1.114,"cmp-10":1.044,"cmp-11":0.93,"sup-0":0.962,"sup-1":0.994,"sup-2":0.963,"sup-3":1.024,"satz-0":0.51,"satz-1":1.873,"satz-2":1.711,"satz-3":1.022,"satz-4":1.321,"satz-5":0.536,"satz-6":1.013,"satz-7":1.012};
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
