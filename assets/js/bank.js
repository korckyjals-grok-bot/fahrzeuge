/* In der Stadt 1 – Fahrzeuge — banco de práctica (determinista). v1.1.0
   Temas: art (der/die/das + plural), wort (palabras ES↔DE), verb (conjugación, verbos separables, ordena),
          adj (groß/klein/langsam/schnell: formas, comparar, am …sten), satz (frases de la hoja).
   Regla de oro: cada pregunta tiene exactamente una opción correcta (las otras son incorrectas en alemán). */
(function (g) {
  'use strict';
  var D = g.FZ_DATA, items = [];
  function add(it) { items.push(it); }
  function fill(de, a) { return de.replace('___', a); }
  /* Generador determinista (mismo banco siempre) */
  var seed = 20261112;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  function pickN(list, n) { var a = list.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; }
  function confusable(x, y) { return D.CONFUSE.some(function (gr) { return gr.indexOf(x) >= 0 && gr.indexOf(y) >= 0; }); }
  function art(p) { return p.g + ' ' + p.n; }

  /* v1.1.0: wk = la palabra de la hoja que se practica (n: sustantivo, v: verbo, j: adjetivo). El Desafío sin tiempo no repite
     la misma palabra en una ronda (ni «der Bus» y «el bus → der Bus», ni «einsteigen = subirse» y «Me subo… ¿ein?»). */
  /* ---- 1. der / die / das ---- */
  D.NOUNS.forEach(function (p, k) {
    add({ id: 'art-' + k, kind: 'mc', type: 'art', topic: 'art', grp: p.n, wk: ['n:' + p.n], fast: true, pic: p.i,
      q: '¿der, die o das?', de: '___ ' + p.n, o: ['der', 'die', 'das'], a: p.g, say: art(p),
      help: p.n + ' = ' + p.es + '. Piensa en la mano de color de tu hoja (azul, rosada o verde).',
      e: '<b>' + art(p) + '</b> — ' + p.es + '. 💡 En la hoja: ' + ({ der: 'mano azul = der', die: 'mano rosada = die', das: 'mano verde = das' })[p.g] + '.' + (p.note ? ' ' + p.note : '') });
  });

  /* ---- 2. Plural ---- (Krankenwagen no entra: la hoja marca la forma regional «Krankenwägen») */
  D.NOUNS.filter(function (p) { return p.plq; }).forEach(function (p, k) {
    add({ id: 'pl-' + k, kind: 'mc', type: 'plural', topic: 'art', grp: p.n, wk: ['n:' + p.n], fast: true, pic: p.i,
      q: '¿Cuál es el plural?', de: p.n + ' → die ___', o: [p.pl].concat(p.bad), a: p.pl, say: art(p) + ', die ' + p.pl,
      help: p.n + ' = ' + p.es + '. En la hoja el plural está después de la coma (¨ = la vocal lleva diéresis).',
      e: '<b>' + art(p) + ' → die ' + p.pl + '</b>.' + (p.note ? ' ' + p.note : '') });
  });

  /* ---- 3. Palabras ---- */
  D.NOUNS.forEach(function (p, k) {
    var others = D.NOUNS.filter(function (x) { return x !== p && !confusable(x.n, p.n); });
    var d = pickN(others, 3);
    add({ id: 'wde-' + k, kind: 'mc', type: 'wort', topic: 'wort', grp: p.n, wk: ['n:' + p.n], fast: true, pic: p.i,
      q: '¿Cómo se dice «' + p.es + '» en alemán?', o: [art(p)].concat(d.map(art)), a: art(p), say: art(p),
      help: 'Mira el dibujo y piensa en la hoja de vocabulario.', e: '<b>' + art(p) + '</b> = ' + p.es + '.' });
    var d2 = pickN(others, 3);
    add({ id: 'wes-' + k, kind: 'mc', type: 'wort', topic: 'wort', grp: p.n, wk: ['n:' + p.n], fast: true, stack: true,
      q: '¿Qué significa «' + art(p) + '»?', o: [p.es].concat(d2.map(function (x) { return x.es; })), a: p.es, say: art(p),
      help: 'Lee la palabra en voz alta. ¿Dónde la viste en la hoja?', e: '<b>' + art(p) + '</b> = ' + p.es + ' ' + p.i });
  });
  D.VERBS.forEach(function (v, k) {
    var others = D.VERBS.filter(function (x) { return x !== v && !confusable(x.inf, v.inf); });
    add({ id: 'vde-' + k, kind: 'mc', type: 'wort', topic: 'wort', grp: v.inf, wk: ['v:' + v.inf], fast: true, pic: v.i,
      q: '¿Cómo se dice «' + v.es + '» en alemán?', o: [v.inf].concat(pickN(others, 3).map(function (x) { return x.inf; })), a: v.inf, say: v.inf,
      help: 'Es un verbo de la hoja.', e: '<b>' + v.inf + '</b> (er/sie/es ' + v.er + ') = ' + v.es + '.' });
    add({ id: 'ves-' + k, kind: 'mc', type: 'wort', topic: 'wort', grp: v.inf, wk: ['v:' + v.inf], fast: true, stack: true,
      q: '¿Qué significa «' + v.inf + '»?', o: [v.es].concat(pickN(others, 3).map(function (x) { return x.es; })), a: v.es, say: v.inf,
      help: 'Es un verbo de la hoja.', e: '<b>' + v.inf + '</b> = ' + v.es + '.' });
  });
  D.ADJ.forEach(function (j, k) {
    add({ id: 'aes-' + k, kind: 'mc', type: 'wort', topic: 'wort', grp: j.p, wk: ['js:' + j.p], /* el significado (schnell = rápido) no sale en las preguntas de formas, ni al revés */ fast: true,
      q: '¿Qué significa «' + j.p + '»?', o: D.ADJ.map(function (x) { return x.es; }), a: j.es, say: j.p,
      help: 'Es un adjetivo de la hoja.', e: '<b>' + j.p + '</b> = ' + j.es + ' ' + j.i });
  });

  /* ---- 4. Verbos: conjugación (s = frase, inf, forma correcta, distractores) ---- */
  var CONJ = [
    ['Der Bus ___ um 8 Uhr ab.', 'abfahren', 'fährt', ['fahrt', 'fahren', 'fahre']],
    ['Das Flugzeug ___ nach Berlin.', 'fliegen', 'fliegt', ['fliegst', 'fliegen', 'fliege']],
    ['Der Zug ___ um 10 Uhr in Hamburg an.', 'ankommen', 'kommt', ['kommst', 'kommen', 'komme']],
    ['Mama ___ zu Fuß.', 'gehen', 'geht', ['gehst', 'gehen', 'gehe']],
    ['Ich ___ zu Fuß.', 'gehen', 'gehe', ['geht', 'gehst', 'gehen']],
    ['Papa ___ mit dem Auto.', 'fahren', 'fährt', ['fahrt', 'fährst', 'fahren']],
    ['Du ___ mit dem Fahrrad.', 'fahren', 'fährst', ['fährt', 'fahrst', 'fahren']],
    ['Wir ___ mit der U-Bahn.', 'fahren', 'fahren', ['fährt', 'fährst', 'fahre']],
    ['Lena ___ in die Straßenbahn ein.', 'einsteigen', 'steigt', ['steigst', 'steigen', 'steige']],
    ['Wir ___ an der Haltestelle aus.', 'aussteigen', 'steigen', ['steigt', 'steigst', 'steige']],
    ['Ich ___ in den Bus ein.', 'einsteigen', 'steige', ['steigt', 'steigen', 'steigst']],
    ['Das Schiff ___ um 9 Uhr ab.', 'abfahren', 'fährt', ['fahrt', 'fahren', 'fährst']],
    ['Der Bus ___ um 8 Uhr.', 'kommen', 'kommt', ['kommen', 'kommst', 'komme']],
    ['Du ___ mit dem Flugzeug nach Spanien.', 'fliegen', 'fliegst', ['fliegt', 'fliegen', 'fliege']],
    ['Der Krankenwagen ___ schnell.', 'fahren', 'fährt', ['fahrt', 'fahren', 'fahre']],
    ['Ich ___ mit dem Roller zur Schule.', 'fahren', 'fahre', ['fährt', 'fährst', 'fahren']]
  ];
  CONJ.forEach(function (r, k) {
    var v = D.verb(r[1]);
    add({ id: 'conj-' + k, kind: 'mc', type: 'verb', topic: 'verb', grp: 'conj-' + k, wk: ['v:' + r[1]], fast: true,
      q: 'Elige la forma correcta del verbo:', de: r[0], o: [r[2]].concat(r[3]), a: r[2], say: fill(r[0], r[2]),
      help: 'El verbo significa «' + v.es + '». Mira quién hace la acción: ich, du, er/sie/es (una persona o cosa) o wir.',
      e: '<b>' + fill(r[0], r[2]) + '</b> (' + r[1] + ')' + (r[1] === 'fahren' || r[1] === 'abfahren' ? ' 💡 er/sie/es <b>fährt</b>, du <b>fährst</b> (con ä); ich <b>fahre</b>, wir <b>fahren</b> (sin ä).' : '') + (v.sep ? ' ✂️ «' + v.sep + '» va al final.' : '') });
  });
  /* Verbos separables: ¿qué parte va al final? (solo frases donde una sola opción es correcta) */
  var TEIL = [
    ['Me subo al bus.', 'Ich steige an der Haltestelle ___.', 'ein'], ['Nos bajamos del tren.', 'Wir steigen am Bahnhof ___.', 'aus'],
    ['El tren llega a Hamburgo a las 10.', 'Der Zug kommt um 10 Uhr in Hamburg ___.', 'an'], ['Lena se sube al metro.', 'Lena steigt schnell ___.', 'ein'],
    ['Papá se baja del carro.', 'Papa steigt vor der Schule ___.', 'aus'], ['El avión llega a Berlín a las 12.', 'Das Flugzeug kommt um 12 Uhr in Berlin ___.', 'an']
  ];
  TEIL.forEach(function (r, k) {
    add({ id: 'teil-' + k, kind: 'mc', type: 'teil', topic: 'verb', grp: 'teil-' + k, wk: ['v:' + ({ ein: 'einsteigen', aus: 'aussteigen', an: 'ankommen' })[r[2]]], fast: true,
      q: '«' + r[0] + '» ¿Qué va al final?', de: r[1], o: ['ein', 'aus', 'an', 'ab'], a: r[2], say: r[1].replace('___', r[2]),
      /* v1.1.0: antes la Ayuda era «einsteigen = subirse · aussteigen = bajarse · ankommen = llegar · abfahren = salir.»: con la consigna en español
         («Me subo…») daba la partícula. Ahora explica cómo funciona sin nombrar ningún verbo completo. */
      help: 'Es un verbo de dos partes: la segunda parte va al final de la frase. Lee otra vez la frase en español y piensa en el verbo completo.',
      e: '<b>' + r[1].replace('___', r[2]) + '</b> ✂️ (' + ({ ein: 'einsteigen', aus: 'aussteigen', an: 'ankommen' })[r[2]] + ')' });
  });

  /* ---- 5. Adjetivos ---- */
  var FORMS = [
    ['groß – ___ – am größten', 'größer', ['großer', 'gröser', 'mehr groß']],
    ['groß – größer – ___', 'am größten', ['am großten', 'am größsten', 'am größesten']],
    ['klein – ___ – am kleinsten', 'kleiner', ['kleinter', 'kleinner', 'mehr klein']],
    ['klein – kleiner – ___', 'am kleinsten', ['am kleinesten', 'am kleinersten', 'am kleinst']],
    ['langsam – ___ – am langsamsten', 'langsamer', ['langsammer', 'langsämer', 'mehr langsam']],
    ['langsam – langsamer – ___', 'am langsamsten', ['am langsamesten', 'am langsammsten', 'am langsamersten']],
    ['schnell – ___ – am schnellsten', 'schneller', ['schneler', 'schnellter', 'mehr schnell']],
    ['schnell – schneller – ___', 'am schnellsten', ['am schnellesten', 'am schnelsten', 'am schnellersten']]
  ];
  FORMS.forEach(function (r, k) {
    add({ id: 'adjf-' + k, kind: 'mc', type: 'adjf', topic: 'adj', grp: 'adjf-' + r[0].split(' ')[0], wk: ['j:' + r[0].split(' ')[0]], fast: true,
      q: 'Completa la fila:', de: r[0], o: [r[1]].concat(r[2]), a: r[1], say: fill(r[0], r[1]).replace(/ – /g, ', '),
      help: 'Más … = …er. El más … de todos = am …sten. ¡Ojo con groß!',
      e: '<b>' + fill(r[0], r[1]) + '</b>' + (r[0].indexOf('groß') === 0 ? ' 💡 groß lleva <b>ö</b> en größer y am größten.' : '') });
  });
  var SPEED = ['schneller', 'langsamer', 'schnell', 'langsam'], SIZE = ['größer', 'kleiner', 'groß', 'klein'];
  var ADJBASE = { schneller: 'schnell', langsamer: 'langsam', größer: 'groß', kleiner: 'klein' };
  var CMP = [
    ['Das Flugzeug ist ___ als das Fahrrad.', '✈️ 🚲', 'schneller', SPEED],
    ['Das Fahrrad ist ___ als das Auto.', '🚲 🚗', 'langsamer', SPEED],
    ['Der Bus ist ___ als das Auto.', '🚌 🚗', 'größer', SIZE],
    ['Das Skateboard ist ___ als der Bus.', '🛹 🚌', 'kleiner', SIZE],
    ['Der Traktor ist ___ als der Zug.', '🚜 🚆', 'langsamer', SPEED],
    ['Das Schiff ist ___ als das Motorrad.', '🚢 🏍️', 'größer', SIZE],
    ['Der Zug ist ___ als der Roller.', '🚆 🛴', 'schneller', SPEED],
    ['Das Fahrrad ist ___ als der LKW.', '🚲 🚛', 'kleiner', SIZE],
    ['Das Motorrad ist ___ als das Fahrrad.', '🏍️ 🚲', 'schneller', SPEED],
    ['Der Kran ist ___ als das Auto.', '🏗️ 🚗', 'größer', SIZE],
    ['Der Roller ist ___ als das Motorrad.', '🛴 🏍️', 'langsamer', SPEED],
    ['Das Auto ist ___ als das Flugzeug.', '🚗 ✈️', 'kleiner', SIZE]
  ];
  CMP.forEach(function (r, k) {
    add({ id: 'cmp-' + k, kind: 'mc', type: 'adjv', topic: 'adj', grp: 'cmp-' + k, wk: ['j:' + ADJBASE[r[2]]], fast: true, pic: r[1],
      q: 'Compara: ¿qué palabra va?', de: r[0], o: r[3], a: r[2], say: fill(r[0], r[2]),
      help: 'Mira los dibujos: ¿cuál es más rápido, más lento, más grande o más pequeño? Después de la palabra viene «als».',
      e: '<b>' + fill(r[0], r[2]) + '</b> 💡 Con <b>als</b> va la forma con <b>-er</b>.' });
  });
  var SUP = [
    ['Was ist am schnellsten?', '¿Qué es lo más rápido?', 'das Flugzeug', ['das Fahrrad', 'der Roller']],
    ['Was ist am langsamsten?', '¿Qué es lo más lento?', 'der Traktor', ['der Zug', 'das Flugzeug']],
    ['Was ist am größten?', '¿Qué es lo más grande?', 'das Schiff', ['das Auto', 'das Fahrrad']],
    ['Was ist am kleinsten?', '¿Qué es lo más pequeño?', 'das Skateboard', ['der Bus', 'der LKW']]
  ];
  SUP.forEach(function (r, k) {
    add({ id: 'sup-' + k, kind: 'mc', type: 'sup', topic: 'adj', grp: 'sup-' + k, wk: ['j:' + ['schnell', 'langsam', 'groß', 'klein'][k]], fast: true,
      q: r[0], o: [r[2]].concat(r[3]), a: r[2], say: r[0] + ' ' + r[2].charAt(0).toUpperCase() + r[2].slice(1) + ' ist ' + r[0].replace('Was ist ', '').replace('?', '') + '.',
      help: r[1], e: '<b>' + r[2].charAt(0).toUpperCase() + r[2].slice(1) + ' ist ' + r[0].replace('Was ist ', '').replace('?', '') + '.</b>' });
  });

  /* ---- 6. Frases de la hoja ---- */
  var SATZ = [
    ['Ich gehe ___ Fuß.', 'zu', ['mit', 'auf', 'an'], 'Voy a pie.'],
    ['Entschuldigung, wann ___ der Bus Nummer 5?', 'kommt', ['kommen', 'kommst', 'komme'], 'Disculpe, ¿cuándo viene el bus número 5?'],
    ['Der Bus kommt ___ 8 Uhr.', 'um', ['an', 'in', 'zu'], 'El bus viene a las 8.'],
    ['Wann fährt der ___ Bus?', 'nächste', ['nächster', 'nächsten', 'nächstes'], '¿Cuándo sale el próximo bus?'],
    ['Wo ___ der Bus 12 ab?', 'fährt', ['fahrt', 'fahren', 'fährst'], '¿De dónde sale el bus 12?'],
    ['Er fährt ___ Haltestelle 3 ab.', 'an', ['in', 'zu', 'um'], 'Sale de la parada 3.'],
    ['Entschuldigung, ___ kommt der Bus Nummer 7?', 'wann', ['wo', 'was', 'wer'], 'Disculpe, ¿cuándo viene el bus número 7?', 'Quieres saber «cuándo» viene el bus. Completa:'],
    ['___ fährt der Bus 4 ab?', 'Wo', ['Wann', 'Was', 'Wer'], '¿De dónde sale el bus 4?', 'Quieres saber «de dónde» sale el bus. Completa:']
  ];
  SATZ.forEach(function (r, k) {
    add({ id: 'satz-' + k, kind: 'mc', type: 'satz', topic: 'satz', grp: 'satz-' + k, fast: true,
      q: r[4] || 'Completa la frase:', de: r[0], o: [r[1]].concat(r[2]), a: r[1], say: fill(r[0], r[1]),
      help: 'En español: ' + r[3], e: '<b>' + fill(r[0], r[1]) + '</b> = ' + r[3] });
  });
  var CUAL = [
    ['Wann kommt der Bus Nummer 7?', 'Der Bus kommt um 9 Uhr.', ['Er fährt an Haltestelle 2 ab.', 'Ich gehe zu Fuß.'], '¿Cuándo viene el bus número 7?'],
    ['Wo fährt der Bus 4 ab?', 'Er fährt an Haltestelle 2 ab.', ['Der Bus kommt um 9 Uhr.', 'Ich gehe zu Fuß.'], '¿De dónde sale el bus 4?'],
    ['Wann fährt der nächste Bus?', 'Der nächste Bus fährt um 10 Uhr.', ['Er fährt an Haltestelle 1 ab.', 'Ich gehe zu Fuß.'], '¿Cuándo sale el próximo bus?'],
    ['Fährst du mit dem Bus?', 'Nein, ich gehe zu Fuß.', ['Der Bus kommt um 9 Uhr.', 'Er fährt an Haltestelle 1 ab.'], '¿Vas en bus?']
  ];
  CUAL.forEach(function (r, k) {
    add({ id: 'cual-' + k, kind: 'mc', type: 'cual', topic: 'satz', grp: 'cual-' + k, fast: false, stack: true,
      q: '«' + r[0] + '» — ¿Qué respuesta va?', o: [r[1]].concat(r[2]), a: r[1], say: r[0] + ' ' + r[1],
      help: 'La pregunta en español: ' + r[3], e: '<b>' + r[0] + '</b> → <b>' + r[1] + '</b>' });
  });
  /* Escucha y elige: las tres frases son correctas. v1.1.0: la Ayuda ya NO muestra la frase (era la respuesta): la vuelve a decir más despacio. */
  var HOR = [
    ['Ich gehe zu Fuß.', ['Wann fährt der nächste Bus?', 'Der Bus kommt um 8 Uhr.']],
    ['Wann fährt der nächste Bus?', ['Ich gehe zu Fuß.', 'Wo fährt der Bus 12 ab?']],
    ['Wo fährt der Bus 12 ab?', ['Wann fährt der nächste Bus?', 'Er fährt an Haltestelle 3 ab.']],
    ['Der Bus kommt um 8 Uhr.', ['Ich gehe zu Fuß.', 'Er fährt an Haltestelle 3 ab.']],
    ['Er fährt an Haltestelle 3 ab.', ['Der Bus kommt um 8 Uhr.', 'Wo fährt der Bus 12 ab?']],
    ['Das Flugzeug ist schneller als das Fahrrad.', ['Der Bus ist größer als das Auto.', 'Der Traktor ist langsamer als der Zug.']]
  ];
  HOR.forEach(function (r, k) {
    add({ id: 'hor-' + k, kind: 'mc', type: 'hor', topic: 'satz', grp: 'hor-' + k, fast: false, listen: true, stack: true,
      q: 'Escucha 🔊 y elige la frase que oíste:', o: [r[0]].concat(r[1]), a: r[0], say: r[0],
      help: 'Escúchala otra vez, más despacio. Fíjate en la primera palabra y en el verbo.', e: '<b>' + r[0] + '</b>' });
  });
  /* Ordena la frase: la mayúscula marca el inicio y el signo final el final; acc = órdenes aceptados */
  var ORD = [
    ['verb', ['Der Bus', 'fährt', 'um 8 Uhr', 'ab.'], 'El bus sale a las 8.'],
    ['verb', ['Ich', 'steige', 'in den Bus', 'ein.'], 'Me subo al bus.'],
    ['verb', ['Wir', 'steigen', 'an der Haltestelle', 'aus.'], 'Nos bajamos en la parada.'],
    ['verb', ['Der Zug', 'kommt', 'um 10 Uhr', 'in Hamburg', 'an.'], 'El tren llega a Hamburgo a las 10.'],
    ['satz', ['Ich', 'gehe', 'zu', 'Fuß.'], 'Voy a pie.'],
    ['satz', ['Entschuldigung,', 'wann', 'kommt', 'der Bus', 'Nummer 5?'], 'Disculpe, ¿cuándo viene el bus número 5?'],
    ['satz', ['Wo', 'fährt', 'der Bus 12', 'ab?'], '¿De dónde sale el bus 12?'],
    ['satz', ['Er', 'fährt', 'an Haltestelle 3', 'ab.'], 'Sale de la parada 3.'],
    ['satz', ['Wann', 'fährt', 'der nächste', 'Bus?'], '¿Cuándo sale el próximo bus?'],
    ['adj', ['Das Flugzeug', 'ist', 'schneller', 'als', 'das Fahrrad.'], 'El avión es más rápido que la bicicleta.']
  ];
  /* Órdenes alternativos correctos con estas fichas */
  var ALT = { 3: ['Der Zug kommt in Hamburg um 10 Uhr an.'] };
  ORD.forEach(function (r, k) {
    var s = r[1].join(' ');
    add({ id: 'orden-' + k, kind: 'orden', type: 'orden', topic: r[0], grp: 'orden-' + k, fast: false,
      q: 'Ordena la frase:', chunks: r[1], a: r[1], acc: [s].concat(ALT[k] || []), say: s,
      help: 'En español: ' + r[2] + ' 💡 El verbo va en 2.º lugar.', e: '<b>' + s + '</b> = ' + r[2] + (ALT[k] ? ' (También vale: ' + ALT[k].join(' · ') + ')' : '') });
  });
  g.FZ_BANK = { items: items };
})(typeof window !== 'undefined' ? window : globalThis);
