/* In der Stadt 1 – Fahrzeuge — interfaz. v1.0.0 (base: Mein Tag in der Stadt 1.0.1) */
(function () {
  'use strict';
  var D = window.FZ_DATA, B = window.FZ_BANK, E = window.FZ_ENGINE, SP = window.FzSpeech;
  var $ = function (id) { return document.getElementById(id); };
  /* La etiqueta solo dice el tipo de actividad: nunca la respuesta */
  var TYPE = { art: '🏷️ der, die o das', plural: '🔢 Plural', wort: '🌍 Palabras', verb: '🏃 Verbos', teil: '✂️ Verbos separables',
    adjf: '📏 Formas del adjetivo', adjv: '📏 Comparar con «als»', sup: '🏆 am …sten', satz: '💬 Frases de la hoja', cual: '💬 Pregunta y respuesta',
    hor: '🎧 Escucha y elige', orden: '🧩 Ordena la frase' };
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show(id) { ['home', 'study', 'play', 'sum'].forEach(function (x) { $(x).classList.toggle('hid', x !== id); }); window.scrollTo(0, 0); }
  function store() { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; } catch (e) { var m = {}; return { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } }; } }
  var ST = store();
  function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600); }
  var NOVOICE = '🔇 Este navegador no tiene voz en alemán. Toca 🆘 Ayuda para leer la frase.';
  function speak(text) {
    try {
      /* speech.js espera a que carguen las voces; solo usa voz alemana (de), nunca inglesa */
      if (!SP) { toast(NOVOICE); return; }
      SP.speak(String(text), {
        rate: 0.85,
        onNoVoice: function () { toast(NOVOICE); },
        onError: function (e) { var c = e && (e.error || e.message); if (c === 'interrupted' || c === 'canceled') return; toast('🔇 No se pudo reproducir el audio. Toca 🆘 Ayuda para leer la frase.'); }
      });
    } catch (e) { toast('🔇 No se pudo reproducir el audio.'); }
  }
  function stopSpeak() { try { SP && SP.cancel(); } catch (e) {} }
  function revealAbove(el, bar) {
    try {
      if (!el || el.classList.contains('hid')) return;
      var h = bar && bar.classList.contains('stick') ? bar.offsetHeight : 0;
      var r = el.getBoundingClientRect(), limit = window.innerHeight - h - 12;
      if (r.bottom > limit) {
        var dy = r.bottom - limit, top = $('msg').getBoundingClientRect().top;
        if (el.id === 'exp' && top - dy < 8) dy = Math.max(0, top - 8);
        window.scrollBy(0, dy);
      }
    } catch (e) {}
  }
  function drawCk() { var c = E.getChecks(ST); document.querySelectorAll('.chk').forEach(function (e) { e.classList.toggle('no', c.indexOf(e.dataset.t) < 0); }); }
  function home() { stopTimer(); stopSpeak(); chal = false; drawCk(); $('best').textContent = ST.getItem(E.BK) || 0; document.querySelectorAll('.nm').forEach(function (e) { e.textContent = window.NM(); }); show('home'); }
  document.querySelectorAll('[data-home]').forEach(function (b) { b.onclick = home; });

  /* ---------------- ESTUDIAR ---------------- */
  var STABS = [['sub', '🚗 Substantive'], ['verb', '🏃 Verben'], ['adj', '📏 Adjektive'], ['satz', '💬 Frases']];
  var TITLES = { sub: '🚗 Substantive (sustantivos)', verb: '🏃 Verben (verbos)', adj: '📏 Adjektive (adjetivos)', satz: '💬 Redewendungen (frases)' };
  var GN = { der: '🔵 der (mano azul)', die: '🔴 die (mano rosada)', das: '🟢 das (mano verde)' };
  var stTab = 'sub', stHelp = false;
  function row(em, de, es, say) {
    return '<div class="storyl"><span class="em" aria-hidden="true">' + em + '</span><span class="tx" lang="de">' + de +
      (stHelp ? '<span class="es" lang="es">' + esc(es) + '</span>' : '') + '</span><button class="say" data-say="' + esc(say) + '" aria-label="Escuchar">🔊</button></div>';
  }
  function sayList() {
    if (stTab === 'sub') return D.NOUNS.map(function (p) { return p.g + ' ' + p.n + ', die ' + p.pl; });
    if (stTab === 'verb') return D.VERBS.map(function (v) { return v.inf + ', er ' + v.er; });
    if (stTab === 'adj') return D.ADJ.map(function (j) { return j.p + ', ' + j.c + ', ' + j.s; });
    return D.PHRASES.map(function (f) { return f.de; });
  }
  function showStudy() { drawStudy(); show('study'); }
  function drawStudy() {
    $('stTabs').innerHTML = STABS.map(function (t) { return '<button class="btn ' + (t[0] === stTab ? 'g' : 'gray') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    $('stTabs').querySelectorAll('button').forEach(function (b) { b.onclick = function () { stTab = b.dataset.tab; stopSpeak(); drawStudy(); }; });
    $('stTitle').textContent = TITLES[stTab];
    var html = '';
    if (stTab === 'sub') {
      html = ['der', 'die', 'das'].map(function (gg) {
        return '<h3 class="gn gn-' + gg + '">' + GN[gg] + '</h3>' + D.NOUNS.filter(function (p) { return p.g === gg; }).map(function (p) {
          return row(p.i, '<b>' + p.g + ' ' + esc(p.n) + '</b> <span class="pl">· die ' + esc(p.pl) + '</span>', p.es + (p.note ? ' — ' + p.note : ''), p.g + ' ' + p.n + ', die ' + p.pl);
        }).join('');
      }).join('') + '<p class="hint">El plural siempre lleva <b lang="de">die</b>. En la hoja: «Bus, se» = die Busse · «Zug, ¨e» = die Züge (¨ = diéresis).</p>';
    } else if (stTab === 'verb') {
      html = D.VERBS.map(function (v) { return row(v.i, '<b>' + v.inf + '</b> <span class="pl">· er/sie/es ' + v.er + '</span>' + (v.sep ? ' ✂️' : ''), v.es, v.inf + ', er ' + v.er); }).join('') +
        D.CARDS.verb.map(card('verb')).join('');
    } else if (stTab === 'adj') {
      html = D.ADJ.map(function (j) { return row(j.i, '<b>' + j.p + '</b> – ' + j.c + ' – ' + j.s, j.es + ' – más ' + j.es + ' – el más ' + j.es, j.p + ', ' + j.c + ', ' + j.s); }).join('') +
        D.CARDS.adj.map(card('adj')).join('');
    } else {
      html = D.PHRASES.map(function (f) { return row(f.i, esc(f.de), f.es, f.de); }).join('') +
        '<p class="hint">En la hoja los números y la hora están en blanco: aquí usamos ejemplos (Bus Nummer 5, um 8 Uhr, Haltestelle 3).</p>';
    }
    $('stBody').innerHTML = html;
    $('stBody').querySelectorAll('[data-say]').forEach(function (b) { b.onclick = function () { speak(b.dataset.say); }; });
    $('stBody').querySelectorAll('[data-card]').forEach(function (b) { var c = b.dataset.card.split(':'); b.onclick = function () { speak(D.CARDS[c[0]][+c[1]].say); }; });
    $('stHelp').textContent = stHelp ? '🙈 Ocultar ayuda' : '🆘 Ayuda';
  }
  function card(k) {
    return function (c, i) {
      return '<div class="tipc"><h3 lang="de">' + c.f + '</h3><div class="de" lang="de">' + c.b + '</div>' + (stHelp ? '<p class="es">' + c.es + '</p>' : '') +
        '<button class="say" data-card="' + k + ':' + i + '" aria-label="Escuchar">🔊 Escuchar</button></div>';
    };
  }
  $('stHelp').onclick = function () { stHelp = !stHelp; drawStudy(); };
  $('stSayAll').onclick = function () { speak(sayList().join('. ')); };
  $('bStudy').onclick = showStudy;

  /* ---------------- PRACTICAR / DESAFÍO ---------------- */
  var cur = null, score = 0, streak = 0, done = 0, missed = [], answered = false, chal = false, timer = null, left = 0, chalT = [], repeatQ = [], picker = null;
  function sel() { var s = [].slice.call(document.querySelectorAll('#topics input:checked')).map(function (i) { return i.value; }); return s.length ? s : E.TOPICS.slice(); }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function begin(topics, isChal) {
    score = 0; streak = 0; done = 0; missed = []; chal = isChal; finished = false;
    picker = E.makePicker(E.pool(B.items, topics, isChal));
    $('sc').textContent = 0; $('st').textContent = 0; show('play'); stopTimer();
    $('bHelp').classList.toggle('hid', isChal);
    if (chal) {
      left = 60; $('tm').classList.remove('hid'); $('tm').textContent = '⏱️ 60';
      timer = setInterval(function () { left--; $('tm').textContent = '⏱️ ' + left; if (left <= 0) finish(); }, 1000);
    } else $('tm').classList.add('hid');
    next();
  }
  /* La frase con hueco: el hueco está vacío (no muestra letras ni colores de la respuesta) */
  function drawSen(filled) {
    var parts = String(cur.de).split('___');
    $('sen').innerHTML = esc(parts[0]) + (filled ? '<span class="gap ok">' + esc(cur.a) + '</span>' : '<span class="gap" aria-label="hueco">&nbsp;</span>') + esc(parts[1] || '');
  }
  function next() {
    stopSpeak();
    cur = repeatQ.length ? repeatQ.shift() : picker();
    answered = false;
    $('tg').textContent = TYPE[cur.type];
    $('qt').textContent = cur.q;
    $('pic').textContent = cur.pic || ''; $('pic').classList.toggle('hid', !cur.pic);
    if (cur.de) drawSen(false); else $('sen').innerHTML = ''; $('sen').classList.toggle('hid', !cur.de);
    $('listen').classList.toggle('hid', !cur.listen);
    $('cnt').textContent = 'Preguntas: ' + done;
    $('opts').innerHTML = ''; $('opts').className = ''; $('ordBox').innerHTML = ''; $('ordBox').classList.add('hid');
    $('msg').textContent = ''; $('exp').classList.add('hid'); $('nx').classList.add('hid'); $('pAct').classList.remove('stick');
    $('pHelp').classList.add('hid'); $('pHelp').textContent = '🆘 ' + (cur.help || '');
    $('bHelp').textContent = '🆘 Ayuda';
    if (cur.kind === 'orden') return drawOrd();
    var shown = E.optionsFor(cur), short = cur.o.every(function (o) { return o.length <= 8; });
    $('opts').className = cur.stack ? 'stack' : (short ? (shown.length === 4 ? 'two' : 'three') : '');
    shown.forEach(function (o) {
      var b = document.createElement('button'); b.className = 'btn opt'; b.textContent = o; b.lang = 'de'; b.dataset.v = o;
      b.onclick = function () { answer(o, b); }; $('opts').appendChild(b);
    });
    if (cur.listen) speak(cur.say);
  }
  /* Ordenar: toca las fichas en orden; toca una ficha de la línea para devolverla. Al poner todas se revisa. */
  function drawOrd() {
    var box = $('ordBox'); box.classList.remove('hid');
    var L = cur.long ? ' long' : '';
    var chunks = E.shuffleChunks(cur), placed = [];
    box.innerHTML = '<div class="line' + L + '" id="ordLine"><span class="ph">Toca las fichas en orden 👇</span></div><div class="chips' + L + '" id="ordChips"></div><button class="btn gray" id="ordReset">↩️ Borrar</button>';
    var line = $('ordLine'), pool = $('ordChips');
    chunks.forEach(function (c, i) {
      var b = document.createElement('button'); b.className = 'chip'; b.lang = 'de'; b.textContent = c; b.dataset.i = i;
      b.onclick = function () {
        if (answered) return;
        if (b.parentNode === pool) { placed.push(b); line.appendChild(b); }
        else { placed.splice(placed.indexOf(b), 1); pool.appendChild(b); }
        refresh();
        if (placed.length === chunks.length) answer(placed.map(function (x) { return x.textContent; }), null);
      };
      pool.appendChild(b);
    });
    function refresh() { line.querySelector('.ph').classList.toggle('hid', placed.length > 0); pool.classList.toggle('hid', !pool.children.length); }
    $('ordReset').onclick = function () { if (answered) return; placed.slice().forEach(function (x) { pool.appendChild(x); }); placed = []; refresh(); };
  }
  var GOOD = ['¡Muy bien! 🎉', '¡Excelente! ⭐', '¡Correcto! 👏', '¡Lo hiciste genial! 🚀', '¡Súper! 💪', 'Sehr gut! 🇩🇪'];
  function answer(given, el) {
    if (answered) return; answered = true; done++;
    var ok = E.isRight(cur, given), right = E.rightOf(cur);
    if (cur.kind === 'orden') {
      $('ordLine').classList.add(ok ? 'ok' : 'bad'); $('ordReset').classList.add('hid');
      $('ordLine').querySelectorAll('.chip').forEach(function (c) { c.disabled = true; });
    } else {
      [].forEach.call($('opts').children, function (x) { x.disabled = true; if (x.dataset.v === right) x.classList.add('ok'); else if (x !== el) x.classList.add('dim'); });
      if (cur.de) drawSen(true);
    }
    if (ok) { score++; streak++; $('msg').textContent = rnd(GOOD) + (streak >= 3 ? ' ¡Racha de ' + streak + '! 🔥' : ''); }
    else { if (el) el.classList.add('bad'); streak = 0; missed.push(cur); $('msg').textContent = '¡Casi! Mira la respuesta correcta 💡'; }
    $('sc').textContent = score; $('st').textContent = streak; $('cnt').textContent = 'Preguntas: ' + done;
    if (chal) { setTimeout(function () { if (chal && left > 0) next(); }, ok ? 600 : 1800); return; }
    $('exp').innerHTML = 'ℹ️ ' + cur.e + (cur.say ? ' <button class="say" id="expSay" aria-label="Escuchar">🔊 Escuchar</button>' : '');
    if ($('expSay')) $('expSay').onclick = function () { speak(cur.say); };
    $('exp').classList.remove('hid'); $('nx').classList.remove('hid'); $('pAct').classList.add('stick');
    revealAbove($('exp'), $('pAct'));
  }
  var lock = 0;
  $('nx').onclick = function () { if (Date.now() - lock < 400) return; lock = Date.now(); next(); };
  $('bHelp').onclick = function () { var h = $('pHelp'); h.classList.toggle('hid'); $('bHelp').textContent = h.classList.contains('hid') ? '🆘 Ayuda' : '🙈 Ocultar ayuda'; revealAbove(h, $('pAct')); };
  $('listen').onclick = function () { if (cur) speak(cur.say); };
  function rightText(q) {
    if (q.kind === 'orden') return '<span lang="de">' + esc(q.a.join(' ')) + '</span>';
    return '<span lang="de">' + esc(q.de ? q.de.replace('___', q.a) : q.a) + '</span>';
  }
  /* finish() es idempotente: una segunda llamada (temporizador + Terminar) no sobrescribe el mensaje de marca verde o récord */
  var finished = true;
  function finish() {
    if (finished) return; finished = true;
    stopTimer(); stopSpeak(); var wasChal = chal; chal = false; var t = '¡Buen trabajo, ' + window.NM() + '! 🌟';
    if (wasChal) {
      var res = E.applyChallenge(ST, chalT, score, done);
      if (res.record) t = '🏆 ¡Nuevo récord: ' + score + '!';
      if (res.granted) { drawCk(); t = '✅ ¡Marca verde! ' + score + ' sin errores. ¡Bravo, ' + window.NM() + '!'; }
    }
    $('sumT').textContent = t; $('sumP').textContent = 'Respondiste bien ' + score + ' de ' + done + ' preguntas.' + (wasChal && !E.qualifies(score, done) ? ' Para la marca verde: 13 o más y sin errores.' : '');
    $('sumL').innerHTML = missed.length ? '<h3>Para repasar:</h3><ul>' + missed.map(function (q) { return '<li><b>' + esc(q.q) + '</b><br>✔️ ' + rightText(q) + '</li>'; }).join('') + '</ul>' : '<p>¡No tuviste errores! 🎉</p>';
    $('rep').classList.toggle('hid', !missed.length); show('sum');
  }
  $('bFinish').onclick = finish;
  $('bPractice').onclick = function () { repeatQ = []; begin(sel(), false); };
  $('bChal').onclick = function () { repeatQ = []; chalT = E.TOPICS.slice(); begin(chalT, true); };
  $('rep').onclick = function () { repeatQ = missed.slice(); begin(E.TOPICS.slice(), false); };

  /* ---------------- INICIO ---------------- */
  drawCk(); $('best').textContent = ST.getItem(E.BK) || 0;
  /* Gancho de pruebas: solo existe con ?test=1 en la URL (apagado por defecto) */
  var TEST = false; try { TEST = new URLSearchParams(location.search).get('test') === '1'; } catch (e) {}
  if (TEST) window.__TEST__ = function () {
    return { cur: cur, score: score, done: done, chal: chal, left: left, missed: missed, finish: finish, CK: E.CK, BK: E.BK, getCk: function () { return E.getChecks(ST); },
      setScore: function (s, d) { score = s; done = d; $('sc').textContent = s; $('cnt').textContent = 'Preguntas: ' + d; },
      items: B.items, force: function (id) { var it = B.items.filter(function (x) { return x.id === id; })[0]; if (it) { repeatQ = [it]; next(); } return !!it; } };
  };
})();
