/* ============================================================================
 * DT-ProfiPassung · freiform.js  (Baustein B7 — Freiform + ISO 2768)
 * ----------------------------------------------------------------------------
 * ISO 2768-1 Allgemeintoleranzen für Längenmaße (± in mm) als Datentabelle +
 * Freiform-Rechenlogik (Nennmaß + Klasse f/m/c/v → Abmaße/Grenzmaße/Toleranz).
 * Werte maßgeblich aus der Norm-Tabelle (nicht aus Formeln). DOM-frei → testbar.
 * Quelle: ISO 2768-1:1991, Tab. 1 (Längenmaße außer gebrochene Kanten).
 * ZWEITQUELLE (Tabellenbuch) durch Dieter gegenzuprüfen — Anker in test_passung §12.
 * Ehrliche Lücken: v < 3 mm und f > 2000 mm sind in der Norm nicht vorgesehen.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DTPFreiform = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Obere Grenzen der Nennmaßbereiche (mm); Anwendung ab LOW. „bis einschließlich".
  var RANGES = [3, 6, 30, 120, 400, 1000, 2000, 4000];
  var LOW = 0.5;

  // ± Grenzabmaße in mm je Klasse und Bereich (Index passend zu RANGES). null = nicht vorgesehen.
  var DEV = {
    f: [0.05, 0.05, 0.10, 0.15, 0.20, 0.30, 0.50, null],
    m: [0.10, 0.10, 0.20, 0.30, 0.50, 0.80, 1.20, 2.00],
    c: [0.20, 0.30, 0.50, 0.80, 1.20, 2.00, 3.00, 4.00],
    v: [null, 0.50, 1.00, 1.50, 2.50, 4.00, 6.00, 8.00]
  };
  var CLASSES = ['f', 'm', 'c', 'v'];

  var CODE = {
    OK: 'OK',
    NOMINAL_TYPE: 'FF_NOMINAL_TYPE',
    BELOW_MIN: 'FF_BELOW_MIN',
    ABOVE_MAX: 'FF_ABOVE_MAX',
    CLASS_UNKNOWN: 'FF_CLASS_UNKNOWN',
    UNDEFINED: 'FF_UNDEFINED'
  };

  function round3(x) { return Math.round(x * 1000) / 1000; }

  function rangeIndex(n) {
    for (var i = 0; i < RANGES.length; i++) { if (n <= RANGES[i]) return i; }
    return -1;
  }

  /* general(nominal, cls) -> Ergebnisobjekt (mutiert nichts).
   * nominal: Zahl oder String (Komma erlaubt). cls: 'f' | 'm' | 'c' | 'v'. */
  function general(nominal, cls) {
    var n = (typeof nominal === 'string') ? parseFloat(nominal.replace(',', '.')) : nominal;
    if (typeof n !== 'number' || isNaN(n)) return { ok: false, code: CODE.NOMINAL_TYPE };
    if (!DEV[cls]) return { ok: false, code: CODE.CLASS_UNKNOWN, cls: cls };
    if (n < LOW) return { ok: false, code: CODE.BELOW_MIN, low: LOW };
    var idx = rangeIndex(n);
    if (idx < 0) return { ok: false, code: CODE.ABOVE_MAX, max: RANGES[RANGES.length - 1] };
    var dev = DEV[cls][idx];
    if (dev == null) return { ok: false, code: CODE.UNDEFINED, cls: cls, rangeIndex: idx };

    return {
      ok: true,
      input: { nominal: n, cls: cls },
      dev: dev,                              // ± in mm
      upper: dev, lower: -dev,               // Grenzabmaße in mm
      dev_um: Math.round(dev * 1000),        // ± in µm
      tol: round3(2 * dev),                  // Toleranz in mm
      tol_um: Math.round(2 * dev * 1000),    // Toleranz in µm
      Go: round3(n + dev),                   // Höchstmaß
      Gu: round3(n - dev),                   // Mindestmaß
      rangeIndex: idx,
      range: { low: idx === 0 ? LOW : RANGES[idx - 1], high: RANGES[idx] }
    };
  }

  var PRESETS = [
    { nominal: 100, cls: 'm', label: '100 ISO 2768-m' },
    { nominal: 10, cls: 'f', label: '10 ISO 2768-f' },
    { nominal: 250, cls: 'c', label: '250 ISO 2768-c' }
  ];

  return {
    general: general,
    CLASSES: CLASSES, DEV: DEV, RANGES: RANGES, LOW: LOW, CODE: CODE, PRESETS: PRESETS,
    rangeIndex: rangeIndex
  };
});
