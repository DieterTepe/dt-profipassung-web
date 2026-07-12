/* ============================================================================
 * DT-ProfiPassung · daten.js  (Baustein B1 — ISO-286-Zahlenkern)
 * ----------------------------------------------------------------------------
 * Reiner Datenkern + Grundabmaß-Nachschlag. UMD, ohne DOM, in Node testbar.
 * Global: DTPData
 *
 * Datenstrategie (plan.md 2.5): daten.js enthaelt die FERTIGEN, tabellierten
 * Normwerte (ganzzahlige µm). Die Engine liest NUR diese Tabelle -> null
 * Formeldrift. Der Formelsatz lebt ausschliesslich im Harness als Quervergleich
 * (z. B. 50 e8: Formel -49,3 -> die Norm rundet auf -50; Tabelle ist massgeblich).
 *
 * Umfang B1 (bewusst eng, plan.md 0.4 — Zuschnitt je Session flexibel):
 *   - Nennmaess 1..500 mm, 13 Hauptstufen.
 *   - IT1..IT16 vollstaendig (publiziert).
 *   - Welle: d,e,f,g,h (es) · k,m,n,p (ei) · s (ei, inkl. Zwischenstufen >50) · js.
 *   - Bohrung: Allgemeinregel + Sonderregel (Delta) fuer K,M,N (<=IT8) und
 *     P..ZC (<=IT7).
 *   - Noch NICHT im Datensatz (sauber markiert, kein Falschwert): a,b,c sowie die
 *     feinen Zwischenstufen von r,t,u,v,x,y,z,za,zb,zc  ->  Code FD_NOT_IN_DATASET.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.DTPData = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION   = '0.1.0';
  var DATA_STD  = 'ISO 286-1:2019 / -2:2020';

  /* ---- Hilfscode-Konstanten (stabile Meldungscodes; UI uebersetzt) -------- */
  var CODE = {
    OUT_OF_RANGE:       'ERR_OUT_OF_RANGE',        // Nennmass ausserhalb 1..500
    FD_NOT_IN_DATASET:  'FD_NOT_IN_DATASET',       // Buchstabe/Bereich noch nicht tabelliert
    GRADE_UNKNOWN:      'ERR_GRADE_UNKNOWN',       // IT-Grad unbekannt
    LETTER_UNKNOWN:     'ERR_LETTER_UNKNOWN'       // Toleranzfeld-Buchstabe unbekannt
  };

  /* =========================================================================
   * 1) Nennmassbereiche (Hauptstufen bis 500 mm) + geometrisches Mittel D
   *    Konvention: "ueber min bis einschliesslich max". Erste Stufe: 1..3.
   * =======================================================================*/
  var MAIN_MAX = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];
  var MAIN_MIN = [1, 3,  6, 10, 18, 30, 50,  80, 120, 180, 250, 315, 400];

  // geometrisches Mittel je Hauptstufe (fuer den Formel-Quervergleich im Harness)
  var MAIN_D = MAIN_MAX.map(function (mx, i) { return Math.sqrt(MAIN_MIN[i] * mx); });

  /* rangeIndex: liefert Index 0..12 oder -1 (ausserhalb 1..500).
   * Grenzen inklusiv oben: 6 -> Stufe 3..6 (Index 1), 50 -> 30..50 (Index 5). */
  function rangeIndex(nominal) {
    if (!(nominal >= 1) || nominal > 500) return -1;   // Plan-Umfang: 1..500 mm
    for (var i = 0; i < MAIN_MAX.length; i++) {
      if (nominal <= MAIN_MAX[i]) return i;
    }
    return -1;
  }

  /* =========================================================================
   * 2) IT-Grundtoleranzen IT1..IT16 [µm], 13 Hauptstufen (publizierte Tabelle).
   *    Kleine Stufen tragen norm-uebliche Halbwerte (IT1/IT2) — sie sind fuer
   *    Passungen selten, aber vollstaendig hinterlegt.
   * =======================================================================*/
  var IT = {
    1:  [0.8, 1,   1,   1.2, 1.5, 1.5, 2,   2.5, 3.5, 4.5, 6,   7,   8],
    2:  [1.2, 1.5, 1.5, 2,   2.5, 2.5, 3,   4,   5,   7,   8,   9,   10],
    3:  [2,   2.5, 2.5, 3,   4,   4,   5,   6,   8,   10,  12,  13,  15],
    4:  [3,   4,   4,   5,   6,   7,   8,   10,  12,  14,  16,  18,  20],
    5:  [4,   5,   6,   8,   9,   11,  13,  15,  18,  20,  23,  25,  27],
    6:  [6,   8,   9,   11,  13,  16,  19,  22,  25,  29,  32,  36,  40],
    7:  [10,  12,  15,  18,  21,  25,  30,  35,  40,  46,  52,  57,  63],
    8:  [14,  18,  22,  27,  33,  39,  46,  54,  63,  72,  81,  89,  97],
    9:  [25,  30,  36,  43,  52,  62,  74,  87,  100, 115, 130, 140, 155],
    10: [40,  48,  58,  70,  84,  100, 120, 140, 160, 185, 210, 230, 250],
    11: [60,  75,  90,  110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
    12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
    13: [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890, 970],
    14: [250, 300, 360, 430, 520, 620, 740, 870, 1000,1150,1300,1400,1550],
    15: [400, 480, 580, 700, 840, 1000,1200,1400,1600,1850,2100,2300,2500],
    16: [600, 750, 900, 1100,1300,1600,1900,2200,2500,2900,3200,3600,4000]
  };

  /* IT-Wert [µm] fuer Nennmass + Grad (1..16). Wirft bei unbekanntem Grad. */
  function itValue(nominal, grade) {
    var ri = rangeIndex(nominal);
    if (ri < 0) throw new Error(CODE.OUT_OF_RANGE);
    var row = IT[grade];
    if (!row) throw new Error(CODE.GRADE_UNKNOWN);
    return row[ri];
  }

  /* =========================================================================
   * 3) Grundabmasse WELLE (tabelliert, ganzzahlige µm), 13 Hauptstufen.
   *    Obere Buchstaben d..h : Wert = es (<=0), Fundamentalabmass ist oben.
   *    Untere Buchstaben k..p: Wert = ei (>=0), Fundamentalabmass ist unten.
   *    'k' ist gradabhaengig: ei nur fuer IT4..IT7, sonst 0.
   * =======================================================================*/
  var ES_SHAFT = {           // es <= 0
    d: [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230],
    e: [-14, -20, -25, -32, -40, -50, -60,  -72,  -85,  -100, -110, -125, -135],
    f: [-6,  -10, -13, -16, -20, -25, -30,  -36,  -43,  -50,  -56,  -62,  -68],
    g: [-2,  -4,  -5,  -6,  -7,  -9,  -10,  -12,  -14,  -15,  -17,  -18,  -20],
    h: [0,   0,   0,   0,   0,   0,   0,    0,    0,    0,    0,    0,    0]
  };
  var EI_SHAFT = {           // ei >= 0
    k: [0,   1,   1,   1,   2,   2,   2,    3,    3,    4,    4,    4,    5],   // nur IT4..IT7
    m: [2,   4,   6,   7,   8,   9,   11,   13,   15,   17,   20,   21,   23],
    n: [4,   8,   10,  12,  15,  17,  20,   23,   27,   31,   34,   37,   40],
    p: [6,   12,  15,  18,  22,  26,  32,   37,   43,   50,   56,   62,   68]
  };

  /* 's' hat oberhalb 50 mm feinere Zwischenstufen -> eigener Bereichs-Satz. */
  var S_MAX = [3,6,10,18,30,50,65,80,100,120,140,160,180,200,225,250,280,315,355,400,450,500];
  var EI_SHAFT_S = [14,19,23,28,35,43,53,59,71,79,92,100,108,122,130,140,158,170,190,208,232,252];
  function sRangeIndex(nominal) {
    if (!(nominal >= 1) || nominal > 500) return -1;
    for (var i = 0; i < S_MAX.length; i++) { if (nominal <= S_MAX[i]) return i; }
    return -1;
  }

  /* Buchstaben, die in B1 tabelliert sind (alles andere -> FD_NOT_IN_DATASET). */
  var SHAFT_UPPER = { d:1, e:1, f:1, g:1, h:1 };            // Fundamental = es
  var SHAFT_LOWER = { k:1, m:1, n:1, p:1, s:1 };            // Fundamental = ei
  var SPECIAL_KMN = { k:1, m:1, n:1 };                      // Sonderregel <= IT8
  var SPECIAL_PZC = { p:1, r:1, s:1, t:1, u:1, v:1, x:1, y:1, z:1, za:1, zb:1, zc:1 }; // <= IT7

  /* Fundamentalabmass Welle [µm]. Rueckgabe: { es, ei, code? }.
   * code gesetzt (String) => Buchstabe/Bereich (noch) nicht im Datensatz. */
  function shaftDeviations(nominal, letter, grade) {
    var ri = rangeIndex(nominal);
    if (ri < 0) return { code: CODE.OUT_OF_RANGE };
    var it = IT[grade];
    if (!it) return { code: CODE.GRADE_UNKNOWN };
    var T = it[ri];
    letter = String(letter);

    if (letter === 'h') return { es: 0, ei: -T };
    if (letter === 'js') { var half = T / 2; return { es: half, ei: -half, symmetric: true }; }

    if (SHAFT_UPPER[letter]) {                 // es tabelliert, ei = es - IT
      var es = ES_SHAFT[letter][ri];
      return { es: es, ei: es - T };
    }
    if (letter === 's') {                       // eigener Bereichs-Satz
      var si = sRangeIndex(nominal);
      var eiS = EI_SHAFT_S[si];
      return { ei: eiS, es: eiS + T };
    }
    if (SHAFT_LOWER[letter]) {                   // ei tabelliert, es = ei + IT
      var ei = EI_SHAFT[letter][ri];
      if (letter === 'k' && !(grade >= 4 && grade <= 7)) ei = 0;  // k-Sonderfall
      return { ei: ei, es: ei + T };
    }
    if (LETTERS_ISO[letter]) return { code: CODE.FD_NOT_IN_DATASET }; // a,b,c,j,r,t,u,... spaeter
    return { code: CODE.LETTER_UNKNOWN };        // gibt es in ISO 286 nicht (i, l, o, q, w, ...)
  }

  /* Alle Toleranzfeld-Buchstaben, die ISO 286 kennt (V1-Umfang, ohne cd/ef/fg). */
  var LETTERS_ISO = { a:1, b:1, c:1, d:1, e:1, f:1, g:1, h:1, j:1, js:1, k:1, m:1,
                      n:1, p:1, r:1, s:1, t:1, u:1, v:1, x:1, y:1, z:1, za:1, zb:1, zc:1 };

  /* =========================================================================
   * 4) Grundabmasse BOHRUNG aus der Welle abgeleitet:
   *    - Allgemeinregel: A..H -> EI = -es ; J..ZC -> ES = -ei.
   *    - Sonderregel:    K,M,N (<=IT8), P..ZC (<=IT7): ES = -ei + Delta,
   *      Delta = IT(n) - IT(n-1).
   *    Beispielprobe @50: H7 +25/0 · F7 +50/+25 · G7 +34/+9 · K7 +7/-18 ·
   *    N7 -8/-33 · P7 -17/-42  (im Harness verifiziert).
   * =======================================================================*/
  function deltaFor(nominal, grade) {
    if (rangeIndex(nominal) === 0) return 0;     // Norm: bis 3 mm gilt Delta = 0
    if (grade < 2) return 0;                     // IT1 hat keinen sinnvollen Vorgaenger hier
    return itValue(nominal, grade) - itValue(nominal, grade - 1);
  }

  function boreDeviations(nominal, letterUpper, grade) {
    var ri = rangeIndex(nominal);
    if (ri < 0) return { code: CODE.OUT_OF_RANGE };
    var it = IT[grade];
    if (!it) return { code: CODE.GRADE_UNKNOWN };
    var T = it[ri];
    var LU = String(letterUpper);
    var lower = LU.toLowerCase();

    if (LU === 'H') return { EI: 0, ES: T };
    if (LU === 'JS') { var half = T / 2; return { ES: half, EI: -half, symmetric: true }; }

    var sh = shaftDeviations(nominal, lower, grade);
    if (sh.code) return { code: sh.code };

    // A..H (obere Buchstaben der Welle): EI = -es
    if (SHAFT_UPPER[lower]) {
      var EI = -sh.es;
      return { EI: EI, ES: EI + T };
    }
    // J..ZC: ES = -ei (+ Delta bei Sonderregel)
    var special = (SPECIAL_KMN[lower] && grade <= 8) || (SPECIAL_PZC[lower] && grade <= 7);
    var ES = -sh.ei + (special ? deltaFor(nominal, grade) : 0);
    // Norm-Ausnahme (ISO 286-1, Fussnote): M6 ueber 250 bis 315 -> ES = -9 (statt -11)
    if (lower === 'm' && grade === 6 && ri === 10) ES = -9;
    return { ES: ES, EI: ES - T };
  }

  /* =========================================================================
   * 5) Einheitliche Fassade: limits(system,nominal,letter,grade)
   *    Rueckgabe { hole:bool, upper, lower, symmetric?, code? } in µm.
   *    Grossbuchstabe => Bohrung, Kleinbuchstabe => Welle. 'js'/'JS' korrekt.
   * =======================================================================*/
  function limits(nominal, letter, grade) {
    var raw = String(letter);
    var isHole = /^[A-Z]/.test(raw) && raw.toUpperCase() === raw; // erster Buchstabe gross
    // 'JS'/'js' Sonderschreibung
    if (raw.toLowerCase() === 'js') isHole = (raw === 'JS' || raw === 'Js');
    var g = Number(grade);

    if (isHole) {
      var b = boreDeviations(nominal, raw.toUpperCase(), g);
      if (b.code) return { hole: true, code: b.code };
      return { hole: true, upper: b.ES, lower: b.EI, symmetric: !!b.symmetric };
    } else {
      var s = shaftDeviations(nominal, raw.toLowerCase(), g);
      if (s.code) return { hole: false, code: s.code };
      return { hole: false, upper: s.es, lower: s.ei, symmetric: !!s.symmetric };
    }
  }

  /* =========================================================================
   * 6) Formel-Quervergleich (NUR fuer den Harness — nicht fuer die Engine!).
   *    Grundabmass-Formeln der Welle je geom. Mittel D (plan.md 1.1).
   * =======================================================================*/
  var FORMULA_ES = {   // liefert es-Naeherung [µm] (vor Norm-Rundung)
    d: function (D) { return -16 * Math.pow(D, 0.44); },
    e: function (D) { return -11 * Math.pow(D, 0.41); },
    f: function (D) { return -5.5 * Math.pow(D, 0.41); },
    g: function (D) { return -2.5 * Math.pow(D, 0.34); },
    h: function ()  { return 0; }
  };
  var FORMULA_EI = {   // liefert ei-Naeherung [µm]
    m: function (D, itR) { return itR(7) - itR(6); },
    n: function (D)      { return 5 * Math.pow(D, 0.34); },
    k: function (D)      { return 0.6 * Math.cbrt(D); }   // nur IT4..IT7
  };

  /* Toleranzfaktor i [µm] (D<=500) — Beleg fuer die IT-Stufung im Harness. */
  function toleranceFactor(D) { return 0.45 * Math.cbrt(D) + 0.001 * D; }

  /* =========================================================================
   * Oeffentliche Schnittstelle
   * =======================================================================*/
  return {
    VERSION: VERSION,
    DATA_STD: DATA_STD,
    CODE: CODE,

    MAIN_MIN: MAIN_MIN,
    MAIN_MAX: MAIN_MAX,
    MAIN_D: MAIN_D,
    rangeIndex: rangeIndex,

    IT: IT,
    itValue: itValue,
    LETTERS_ISO: LETTERS_ISO,

    shaftDeviations: shaftDeviations,
    boreDeviations: boreDeviations,
    deltaFor: deltaFor,
    limits: limits,

    // Harness-Helfer (Quervergleich Formel <-> Tabelle):
    FORMULA_ES: FORMULA_ES,
    FORMULA_EI: FORMULA_EI,
    toleranceFactor: toleranceFactor
  };
});
