/* In der Stadt 1 – Fahrzeuge — contenido. v1.0.0
   Fuente: hoja de vocabulario «Thema: In der Stadt 1_Fahrzeuge» (Worksheet Crafter).
   En la hoja el artículo se marca con la mano de color: azul = der, rosado/rojo = die, verde = das.
   Plurales como en la hoja, en forma estándar (ver Transcripcion_Hoja_Fahrzeuge_202611121133.md). */
(function (g) {
  'use strict';
  /* n = sustantivo, g = artículo, pl = plural (Nominativ), es = español, i = emoji, plq = entra en el juego de plural */
  var NOUNS = [
    { n: 'Bus', g: 'der', pl: 'Busse', es: 'el bus', i: '🚌', plq: true, bad: ['Buse', 'Büsse', 'Busser'] },
    { n: 'Kran', g: 'der', pl: 'Kräne', es: 'la grúa', i: '🏗️', plq: true, bad: ['Kranen', 'Kräner', 'Krans'] },
    { n: 'Krankenwagen', g: 'der', pl: 'Krankenwagen', es: 'la ambulancia', i: '🚑', plq: false,
      note: 'En el sur de Alemania y en Austria también se dice «die Krankenwägen» (así lo marca la hoja).' },
    { n: 'LKW', g: 'der', pl: 'LKWs', es: 'el camión', i: '🚛', plq: true, bad: ['LKWe', 'LKWen', 'LKWer'],
      note: 'LKW = Lastkraftwagen. También se escribe «Lkw».' },
    { n: 'Roller', g: 'der', pl: 'Roller', es: 'la patineta de pie (con manubrio)', i: '🛴', plq: true, bad: ['Rollers', 'Röller', 'Rollere'] },
    { n: 'Traktor', g: 'der', pl: 'Traktoren', es: 'el tractor', i: '🚜', plq: true, bad: ['Traktore', 'Träktoren', 'Traktorn'] },
    { n: 'Zug', g: 'der', pl: 'Züge', es: 'el tren', i: '🚆', plq: true, bad: ['Züger', 'Zugen', 'Zügs'] },
    { n: 'Fahrplan', g: 'der', pl: 'Fahrpläne', es: 'el horario (de buses o trenes)', i: '🗓️', plq: true, bad: ['Fahrplane', 'Fahrpläner', 'Fahrplanen'] },
    { n: 'Straßenbahn', g: 'die', pl: 'Straßenbahnen', es: 'el tranvía', i: '🚋', plq: true, bad: ['Straßenbahne', 'Straßenbähne', 'Straßenbahns'] },
    { n: 'U-Bahn', g: 'die', pl: 'U-Bahnen', es: 'el metro', i: '🚇', plq: true, bad: ['U-Bahne', 'U-Bähne', 'U-Bahner'] },
    { n: 'Abfahrt', g: 'die', pl: 'Abfahrten', es: 'la salida (de un bus o tren)', i: '🚆➡️', plq: true, bad: ['Abfahrte', 'Abfährte', 'Abfahrts'] },
    { n: 'Haltestelle', g: 'die', pl: 'Haltestellen', es: 'la parada', i: '🚏', plq: true, bad: ['Haltestelles', 'Haltestellern', 'Haltestelle'] },
    { n: 'Auto', g: 'das', pl: 'Autos', es: 'el carro', i: '🚗', plq: true, bad: ['Autoe', 'Auten', 'Autoen'] },
    { n: 'Fahrrad', g: 'das', pl: 'Fahrräder', es: 'la bicicleta', i: '🚲', plq: true, bad: ['Fahrrade', 'Fahrrads', 'Fahrrader'] },
    { n: 'Feuerwehrauto', g: 'das', pl: 'Feuerwehrautos', es: 'el camión de bomberos', i: '🚒', plq: true, bad: ['Feuerwehrauten', 'Feuerwehrautoe', 'Feuerwehrsautos'] },
    { n: 'Flugzeug', g: 'das', pl: 'Flugzeuge', es: 'el avión', i: '✈️', plq: true, bad: ['Flugzeuger', 'Flügzeuge', 'Flugzeugs'] },
    { n: 'Motorrad', g: 'das', pl: 'Motorräder', es: 'la moto', i: '🏍️', plq: true, bad: ['Motorrade', 'Motorrads', 'Motorrader'] },
    { n: 'Müllauto', g: 'das', pl: 'Müllautos', es: 'el camión de la basura', i: '🗑️🚚', plq: true, bad: ['Müllauten', 'Müllautoe', 'Mullautos'] },
    { n: 'Polizeiauto', g: 'das', pl: 'Polizeiautos', es: 'la patrulla (carro de policía)', i: '🚓', plq: true, bad: ['Polizeiauten', 'Polizeiautoe', 'Polizeisautos'] },
    { n: 'Schiff', g: 'das', pl: 'Schiffe', es: 'el barco', i: '🚢', plq: true, bad: ['Schiffs', 'Schiffes', 'Schüffe'] },
    { n: 'Skateboard', g: 'das', pl: 'Skateboards', es: 'el skateboard (patineta sin manubrio)', i: '🛹', plq: true, bad: ['Skateboarde', 'Skateboarden', 'Skateboardes'] },
    { n: 'Ziel', g: 'das', pl: 'Ziele', es: 'la meta / el destino', i: '🏁', plq: true, bad: ['Zieler', 'Ziels', 'Zielle'] }
  ];
  /* Grupos que se parecen en español: nunca salen juntos como opciones del juego de palabras */
  var CONFUSE = [['LKW', 'Müllauto', 'Feuerwehrauto'], ['Auto', 'Polizeiauto', 'Müllauto', 'Feuerwehrauto'], ['Zug', 'U-Bahn', 'Straßenbahn'], ['Roller', 'Skateboard'],
    ['kommen', 'ankommen'], ['fahren', 'abfahren']];
  /* Verbos de la hoja: inf, 3.ª persona (er/sie/es), ich, du, wir, sep = separable */
  var VERBS = [
    { inf: 'gehen', er: 'geht', ich: 'gehe', du: 'gehst', wir: 'gehen', es: 'ir (a pie), caminar', i: '🚶' },
    { inf: 'fahren', er: 'fährt', ich: 'fahre', du: 'fährst', wir: 'fahren', es: 'ir (en un vehículo), manejar', i: '🚗' },
    { inf: 'fliegen', er: 'fliegt', ich: 'fliege', du: 'fliegst', wir: 'fliegen', es: 'volar', i: '✈️' },
    { inf: 'abfahren', er: 'fährt ab', ich: 'fahre ab', du: 'fährst ab', wir: 'fahren ab', es: 'salir, partir (un bus, un tren)', i: '🚆➡️', sep: 'ab' },
    { inf: 'ankommen', er: 'kommt an', ich: 'komme an', du: 'kommst an', wir: 'kommen an', es: 'llegar (a un lugar)', i: '🏁', sep: 'an' },
    { inf: 'kommen', er: 'kommt', ich: 'komme', du: 'kommst', wir: 'kommen', es: 'venir', i: '👋' },
    { inf: 'einsteigen', er: 'steigt ein', ich: 'steige ein', du: 'steigst ein', wir: 'steigen ein', es: 'subirse (al bus, al tren…)', i: '⬆️🚌', sep: 'ein' },
    { inf: 'aussteigen', er: 'steigt aus', ich: 'steige aus', du: 'steigst aus', wir: 'steigen aus', es: 'bajarse (del bus, del tren…)', i: '🚌⬇️', sep: 'aus' }
  ];
  var ADJ = [
    { p: 'groß', c: 'größer', s: 'am größten', es: 'grande', i: '🐘' },
    { p: 'klein', c: 'kleiner', s: 'am kleinsten', es: 'pequeño', i: '🐭' },
    { p: 'langsam', c: 'langsamer', s: 'am langsamsten', es: 'lento', i: '🐢' },
    { p: 'schnell', c: 'schneller', s: 'am schnellsten', es: 'rápido', i: '🐆' }
  ];
  /* Frases de la hoja (Redewendungen). Los huecos de la hoja se llenan con ejemplos */
  var PHRASES = [
    { de: 'Ich gehe zu Fuß.', es: 'Voy a pie.', i: '🚶' },
    { de: 'Entschuldigung, wann kommt der Bus Nummer 5?', es: 'Disculpe, ¿cuándo viene el bus número 5?', i: '🙋' },
    { de: 'Der Bus kommt um 8 Uhr.', es: 'El bus viene a las 8.', i: '🕗' },
    { de: 'Wo fährt der Bus 12 ab?', es: '¿De dónde sale el bus 12?', i: '🚏' },
    { de: 'Er fährt an Haltestelle 3 ab.', es: 'Sale de la parada 3.', i: '3️⃣' },
    { de: 'Wann fährt der nächste Bus?', es: '¿Cuándo sale el próximo bus?', i: '⏰' }
  ];
  /* Tarjetas de Estudiar (Verben, Adjektive): f = título, b = alemán (HTML), es = ayuda, say = lo que se lee */
  var CARDS = {
    verb: [
      { f: 'gehen · fahren · fliegen', b: 'Ich <b>gehe</b> zu Fuß. · Der Bus <b>fährt</b>. · Das Flugzeug <b>fliegt</b>.', es: '<b>gehen</b> = ir a pie · <b>fahren</b> = ir en un vehículo · <b>fliegen</b> = volar. ¡Ojo! fahren → er <b>fährt</b> (con ä).', say: 'Ich gehe zu Fuß. Der Bus fährt. Das Flugzeug fliegt.' },
      { f: 'kommen · ankommen', b: 'Der Bus <b>kommt</b> um 8 Uhr. · Der Zug <b>kommt</b> um 10 Uhr in Hamburg <b>an</b>.', es: '<b>kommen</b> = venir · <b>ankommen</b> = llegar a un lugar. «an» se va al final.', say: 'Der Bus kommt um 8 Uhr. Der Zug kommt um 10 Uhr in Hamburg an.' },
      { f: 'abfahren ✂️', b: 'Der Bus <b>fährt</b> um 8 Uhr <b>ab</b>.', es: 'abfahren = salir, partir. Es un verbo separable (✂️ en la hoja): «fährt» va en 2.º lugar y «ab» al final.', say: 'Der Bus fährt um 8 Uhr ab.' },
      { f: 'einsteigen ✂️ · aussteigen ✂️', b: 'Ich <b>steige</b> in den Bus <b>ein</b>. · Wir <b>steigen</b> an der Haltestelle <b>aus</b>.', es: 'einsteigen = subirse · aussteigen = bajarse. ein / aus van al final de la frase.', say: 'Ich steige in den Bus ein. Wir steigen an der Haltestelle aus.' }
    ],
    adj: [
      { f: 'größer · kleiner', b: 'Der Bus ist <b>größer</b> als das Auto. · Das Skateboard ist <b>kleiner</b> als der Bus.', es: 'größer = más grande · kleiner = más pequeño. Para comparar: «… ist größer <b>als</b> …».', say: 'Der Bus ist größer als das Auto. Das Skateboard ist kleiner als der Bus.' },
      { f: 'schneller · langsamer', b: 'Das Flugzeug ist <b>schneller</b> als das Fahrrad. · Der Traktor ist <b>langsamer</b> als der Zug.', es: 'schneller = más rápido · langsamer = más lento.', say: 'Das Flugzeug ist schneller als das Fahrrad. Der Traktor ist langsamer als der Zug.' },
      { f: 'am größten · am schnellsten', b: 'Das Schiff ist <b>am größten</b>. · Das Flugzeug ist <b>am schnellsten</b>.', es: '«am …sten» = el más … de todos. ¡Ojo! groß → größer → am größten (con ö).', say: 'Das Schiff ist am größten. Das Flugzeug ist am schnellsten.' }
    ]
  };
  function find(n) { for (var i = 0; i < NOUNS.length; i++) if (NOUNS[i].n === n) return NOUNS[i]; return null; }
  function verb(inf) { for (var i = 0; i < VERBS.length; i++) if (VERBS[i].inf === inf) return VERBS[i]; return null; }
  g.FZ_DATA = { VERSION: '1.0.0', NOUNS: NOUNS, VERBS: VERBS, ADJ: ADJ, PHRASES: PHRASES, CARDS: CARDS, CONFUSE: CONFUSE, find: find, verb: verb };
})(typeof window !== 'undefined' ? window : globalThis);
