/* ============================================================================
 * DT-ProfiPassung · rechenweg.js  (Baustein B6 — Rechenweg)
 * ----------------------------------------------------------------------------
 * Post-hoc-Rechenweg: rekonstruiert jeden Schritt aus den Primärgrößen und
 * PRÜFT ihn gegen das Solver-Ergebnis (✓ je Schritt). Rechnet NICHT neu für die
 * Anzeige — die Tabellen-/Solver-Werte bleiben maßgeblich; der Rechenweg deckt
 * nur auf, ob alles konsistent ist. Symbole sprachneutral; Titel übersetzt ui.js.
 * DOM-frei -> ohne Browser testbar. Ladereihenfolge: … solver -> rechenweg -> … -> ui.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DTPRechenweg = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function round3(x) { return Math.round(x * 1000) / 1000; }
  function eq(a, b) { return Math.abs(a - b) < 1e-6; }

  // Standard-Formatierer (falls ui.js keine Locale-Formatierer übergibt):
  function umSignedDefault(x) { return (x > 0 ? '+' : '') + (Number.isInteger(x) ? String(x) : x.toFixed(1)); }
  function umPlainDefault(x) { return Number.isInteger(x) ? String(x) : x.toFixed(1); }
  function mmDefault(x) { return Number(x).toFixed(3); }

  /* build(res, fmt) -> { steps:[{ key, expr, ok, art? }], allOk }
   * res  = Ergebnis von DTPSolver.computeFit (res.ok === true vorausgesetzt)
   * fmt  = { um:signiert(µm), umU:vorzeichenlos(µm), mm:mm } — optional. */
  function build(res, fmt) {
    if (!res || !res.ok) return { steps: [], allOk: false };
    fmt = fmt || {};
    var um = fmt.um || umSignedDefault;   // signiert, z. B. „+25", „−9"
    var umU = fmt.umU || umPlainDefault;  // vorzeichenlos, z. B. „25"
    var mm = fmt.mm || mmDefault;

    var H = res.hole, S = res.shaft, F = res.fit, N = res.input.nominal;
    var hl = res.input.hole.letter + res.input.hole.grade;
    var sl = res.input.shaft.letter + res.input.shaft.grade;
    var steps = [];
    function step(key, expr, ok, art) { steps.push({ key: key, expr: expr, ok: ok !== false, art: art || null }); }

    // 1) IT-Grundtoleranzen aus der Norm-Tabelle
    step('rwTitleIT',
      'T_B = IT' + H.grade + ' (Ø' + N + ') = ' + umU(H.T) + ' µm' +
      '   ·   T_W = IT' + S.grade + ' (Ø' + N + ') = ' + umU(S.T) + ' µm', true);

    // 2) Grenzabmaße Bohrung — Kontrolle ES − EI = T_B
    step('rwTitleDevBore',
      hl + ':  ES = ' + um(H.upper) + ' µm ,  EI = ' + um(H.lower) + ' µm' +
      '   (ES − EI = ' + umU(H.upper - H.lower) + ' = T_B)',
      eq(H.upper - H.lower, H.T));

    // 3) Grenzabmaße Welle — Kontrolle es − ei = T_W
    step('rwTitleDevShaft',
      sl + ':  es = ' + um(S.upper) + ' µm ,  ei = ' + um(S.lower) + ' µm' +
      '   (es − ei = ' + umU(S.upper - S.lower) + ' = T_W)',
      eq(S.upper - S.lower, S.T));

    // 4) Grenzmaße Bohrung = Nennmaß + Abmaß/1000
    var GoB = N + H.upper / 1000, GuB = N + H.lower / 1000;
    step('rwTitleLimBore',
      'G_oB = ' + N + ' + (' + um(H.upper) + '/1000) = ' + mm(GoB) + ' mm   ·   ' +
      'G_uB = ' + N + ' + (' + um(H.lower) + '/1000) = ' + mm(GuB) + ' mm',
      eq(round3(GoB), H.Go) && eq(round3(GuB), H.Gu));

    // 5) Grenzmaße Welle
    var GoW = N + S.upper / 1000, GuW = N + S.lower / 1000;
    step('rwTitleLimShaft',
      'G_oW = ' + N + ' + (' + um(S.upper) + '/1000) = ' + mm(GoW) + ' mm   ·   ' +
      'G_uW = ' + N + ' + (' + um(S.lower) + '/1000) = ' + mm(GuW) + ' mm',
      eq(round3(GoW), S.Go) && eq(round3(GuW), S.Gu));

    // 6) Höchstspiel  PS_max = ES − ei
    var psmax = H.upper - S.lower;
    step('rwClearMax',
      'PS_max = ES − ei = ' + um(H.upper) + ' − (' + um(S.lower) + ') = ' + um(psmax) + ' µm',
      eq(psmax, F.PSmax));

    // 7) Mindestspiel  PS_min = EI − es
    var psmin = H.lower - S.upper;
    step('rwClearMin',
      'PS_min = EI − es = ' + um(H.lower) + ' − (' + um(S.upper) + ') = ' + um(psmin) + ' µm',
      eq(psmin, F.PSmin));

    // 8) Passtoleranz  PT = T_B + T_W  (Gegenprobe: PT = PS_max − PS_min)
    var pt = H.T + S.T;
    step('rwFitTol',
      'PT = T_B + T_W = ' + umU(H.T) + ' + ' + umU(S.T) + ' = ' + umU(pt) + ' µm' +
      '   (Gegenprobe: PS_max − PS_min = ' + umU(F.PSmax - F.PSmin) + ')',
      eq(pt, F.PT) && eq(pt, F.PSmax - F.PSmin));

    // 9) Passungsart aus der Trichotomie
    var art = psmin >= 0 ? 'SPIEL' : psmax <= 0 ? 'UEBERMASS' : 'UEBERGANG';
    var cond = psmin >= 0 ? 'PS_min = ' + um(psmin) + ' ≥ 0'
             : psmax <= 0 ? 'PS_max = ' + um(psmax) + ' ≤ 0'
             : 'PS_min = ' + um(psmin) + ' < 0 < ' + um(psmax) + ' = PS_max';
    step('rwArt', cond, art === F.art, art);

    return { steps: steps, allOk: steps.every(function (s) { return s.ok; }) };
  }

  return { build: build };
});
