/* In der Stadt 1 – Fahrzeuge — lógica pura (sin DOM): puntaje, marca verde, selección sin repetir, cola del Desafío sin tiempo. v1.1.0 (base: Mein Tag in der Stadt 1.0.1) */
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
  function seenText(it) { return norm([it.q, it.de ? it.de.replace('___', Array.isArray(it.a) ? it.a.join(' ') : it.a) : '', it.say, it.e].join(' . ')); }
  /* la respuesta con la palabra de al lado del hueco (sin der/die/das ni plural: el artículo de cada vehículo sale en muchas frases) */
  function gapCtx(it) {
    if (!it.de || it.kind !== 'mc' || it.type === 'art' || it.type === 'plural') return [];
    var parts = it.de.split('___'), l = norm(parts[0]).trim().split(' ').filter(Boolean), r = norm(parts[1]).trim().split(' ').filter(Boolean), a = norm(it.a).trim(), out = [];
    if (l.length) out.push(l[l.length - 1] + ' ' + a); if (r.length) out.push(a + ' ' + r[0]);
    return out;
  }
  function shows(a, b) { var t = seenText(a); return gapCtx(b).some(function (x) { return t.indexOf(' ' + x + ' ') >= 0; }); }
  function clash(a, b) {
    if (a === b || a.id === b.id || gk(a) === gk(b)) return true;
    var wa = a.wk || [], wb = b.wk || [];
    for (var i = 0; i < wa.length; i++) if (wb.indexOf(wa[i]) >= 0) return true;
    return shows(a, b) || shows(b, a);
  }
  function clashMap(items) {
    var m = {}; items.forEach(function (x) { m[x.id] = {}; });
    for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) if (clash(items[i], items[j])) { m[items[i].id][items[j].id] = 1; m[items[j].id][items[i].id] = 1; }
    return m;
  }
  var CMAP = { list: null, map: null };
  function buildUntimedQueue(items, n, rng) {
    rng = rng || Math.random; n = n == null ? UNTIMED_N : n;
    var goal = Math.min(n, items.length);
    if (!goal) return [];
    if (CMAP.list !== items) { CMAP.list = items; CMAP.map = clashMap(items); }
    var M = CMAP.map, strata = {}, keys = [];
    items.forEach(function (it) { var t = it.type; if (!strata[t]) { strata[t] = []; keys.push(t); } strata[t].push(it); });
    var sizes = {}; keys.forEach(function (t) { sizes[t] = strata[t].length; });
    var small = keys.filter(function (t) { return sizes[t] <= 8; }).sort(function (x, y) { return sizes[x] - sizes[y] || (x < y ? -1 : 1); }), big = keys.filter(function (t) { return sizes[t] > 8; });
    function free(it, chosen) { for (var i = 0; i < chosen.length; i++) if (M[it.id][chosen[i].id]) return false; return true; }
    for (var attempt = 0; attempt < 400; attempt++) {
      var q = quotas(keys, sizes, items.length, goal, rng), out = [], okAll = true;
      /* primero los tipos chicos (separables, am …sten, formas, frases): así eligen parejo entre todas sus preguntas
         (ein/aus/an como en el 60 s); los demás tipos van en orden al azar en cada intento, para que ninguno se quede siempre con lo que sobra */
      small.concat(shuffle(big, rng)).forEach(function (t) {
        if (!okAll) return;
        var cand = shuffle(strata[t], rng), got = 0;
        for (var i = 0; i < cand.length && got < q[t]; i++) if (free(cand[i], out)) { out.push(cand[i]); got++; }
        if (got < q[t]) okAll = false;
      });
      if (okAll && out.length === goal) return shuffle(out, rng);
    }
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
    BK_UNTIMED: BK_UNTIMED, UNTIMED_N: UNTIMED_N, clampUntimedBest: clampUntimedBest, getUntimedBest: getUntimedBest, applyUntimed: applyUntimed, buildUntimedQueue: buildUntimedQueue, quotas: quotas, clash: clash };
})(typeof window !== 'undefined' ? window : globalThis);
