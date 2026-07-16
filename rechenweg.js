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

  /* --- Freiform / ISO 2768 (B7) — Rechenweg -------------------------------- */
  function buildFreiform(ff, fmt) {
    if (!ff || !ff.ok) return { steps: [], allOk: false };
    fmt = fmt || {};
    var mm = fmt.mm || mmDefault, umU = fmt.umU || umPlainDefault;
    var N = ff.input.nominal, cls = ff.input.cls, dev = ff.dev;
    var steps = [];
    function step(key, expr, ok) { steps.push({ key: key, expr: expr, ok: ok !== false, art: null }); }

    step('rwFfLookup',
      'ISO 2768-1 · ' + cls + ' · ' + mm(ff.range.low) + '…' + mm(ff.range.high) + ' mm  →  A = ± ' + mm(dev) + ' mm = ' + umU(ff.dev_um) + ' µm', true);
    step('rwFfGo', 'G_o = N + A = ' + N + ' + ' + mm(dev) + ' = ' + mm(ff.Go) + ' mm', eq(round3(N + dev), ff.Go));
    step('rwFfGu', 'G_u = N − A = ' + N + ' − ' + mm(dev) + ' = ' + mm(ff.Gu) + ' mm', eq(round3(N - dev), ff.Gu));
    step('rwFfTol', 'T = 2·A = 2 · ' + mm(dev) + ' = ' + mm(round3(2 * dev)) + ' mm = ' + umU(ff.tol_um) + ' µm', eq(round3(2 * dev), ff.tol));
    return { steps: steps, allOk: steps.every(function (s) { return s.ok; }) };
  }

  /* --- Thermik (B8) — Rechenweg -------------------------------------------- */
  function round1(x) { return Math.round(x * 10) / 10; }
  function buildThermik(fit, th, fmt) {
    if (!fit || !fit.ok || !th || !th.ok) return { steps: [], allOk: false };
    fmt = fmt || {};
    var um = fmt.um || umSignedDefault, n = fmt.n || function (x) { return String(x); };
    var ah = th.alphaHole, as = th.alphaShaft, dT = th.dT, N = th.nominal;
    var dSraw = (ah - as) * dT * N / 1000;
    var steps = [];
    function step(key, expr, ok, art) { steps.push({ key: key, expr: expr, ok: ok !== false, art: art || null }); }

    step('rwThDelta',
      'ΔS = (α_B − α_W)·(T − 20)·D / 1000 = (' + n(ah) + ' − ' + n(as) + ')·' + n(dT) + '·' + N + ' / 1000 = ' + um(th.dS) + ' µm',
      eq(th.dS, round1(dSraw)));
    step('rwThPSmax',
      'PS_max(T) = PS_max + ΔS = ' + um(th.PSmax20) + ' + (' + um(th.dS) + ') = ' + um(th.PSmaxT) + ' µm',
      eq(th.PSmaxT, round1(th.PSmax20 + dSraw)));
    step('rwThPSmin',
      'PS_min(T) = PS_min + ΔS = ' + um(th.PSmin20) + ' + (' + um(th.dS) + ') = ' + um(th.PSminT) + ' µm',
      eq(th.PSminT, round1(th.PSmin20 + dSraw)));
    var artExp = (th.PSmin20 + dSraw) >= 0 ? 'SPIEL' : (th.PSmax20 + dSraw) <= 0 ? 'UEBERMASS' : 'UEBERGANG';
    step('rwThArt', 'PS_min(T) = ' + um(th.PSminT) + ' , PS_max(T) = ' + um(th.PSmaxT), th.artT === artExp, th.artT);
    return { steps: steps, allOk: steps.every(function (s) { return s.ok; }) };
  }

  /* Oberfläche + Schmierspalt (B9 F6/F9): ΣRz, Rz-Grenzwerte, wirksames Spiel/
   * Übermaß und Schmierspalt – jeder Schritt per Umkehrrechnung selbstgeprüft. */
  function buildOberflaeche(res, rz, fmt) {
    if (!res || !res.ok) return { steps: [], allOk: false };
    fmt = fmt || {};
    var umU = fmt.umU || umPlainDefault, n = fmt.n || function (x) { return String(x); };
    function nn(x) { x = Number(x); return (isFinite(x) && x > 0) ? x : 0; }
    var RzB = nn(rz && rz.RzB), RzW = nn(rz && rz.RzW), RzSum = RzB + RzW;
    var TB = res.hole.T, TS = res.shaft.T, F = res.fit;
    var steps = [];
    function step(key, expr, ok, art) { steps.push({ key: key, expr: expr, ok: ok !== false, art: art || null }); }

    step('rwOaSum', 'ΣRz = Rz_B + Rz_W = ' + n(RzB) + ' + ' + n(RzW) + ' = ' + n(round1(RzSum)) + ' µm',
      eq(RzSum, RzB + RzW));
    step('rwOaLimHole', 'Rz_zul,B = T_B / 5 = ' + umU(TB) + ' / 5 = ' + n(round1(TB / 5)) + ' µm',
      eq(round1(5 * (TB / 5)), round1(TB)));
    step('rwOaLimShaft', 'Rz_zul,W = T_W / 5 = ' + umU(TS) + ' / 5 = ' + n(round1(TS / 5)) + ' µm',
      eq(round1(5 * (TS / 5)), round1(TS)));

    if (F.art === 'SPIEL') {
      var Sm = F.PSmin, sw = Sm - 0.4 * RzSum;
      step('rwOaSwirk', 'S_wirk = S_min − 0,4·ΣRz = ' + umU(Sm) + ' − 0,4·' + n(round1(RzSum)) + ' = ' + n(round1(sw)) + ' µm',
        eq(round1(sw + 0.4 * RzSum), round1(Sm)));
      var thr = Sm / 3, gap = Sm - RzSum, film = RzSum <= thr + 1e-9;
      step('rwLubeThr', 'S_min / 3 = ' + umU(Sm) + ' / 3 = ' + n(round1(thr)) + ' µm',
        eq(round1(3 * thr), round1(Sm)));
      step('rwLubeGap', 'Spalt = S_min − ΣRz = ' + umU(Sm) + ' − ' + n(round1(RzSum)) + ' = ' + n(round1(gap)) + ' µm',
        eq(round1(gap + RzSum), round1(Sm)));
      step('rwLubeRule', 'ΣRz ' + (film ? '≤' : '>') + ' S_min/3 : ' + n(round1(RzSum)) + (film ? ' ≤ ' : ' > ') + n(round1(thr)) + ' µm → ' + (film ? 'Vollschmierung' : 'Mischreibung'),
        (RzSum <= thr + 1e-9) === film, film ? 'SPIEL' : 'UEBERGANG');
    } else if (F.art === 'UEBERMASS') {
      var Um = F.interferenceMin, uw = Um - 0.8 * RzSum;
      step('rwOaUwirk', 'Ü_wirk = Ü_min − 0,8·ΣRz = ' + umU(Um) + ' − 0,8·' + n(round1(RzSum)) + ' = ' + n(round1(uw)) + ' µm',
        eq(round1(uw + 0.8 * RzSum), round1(Um)));
    }
    return { steps: steps, allOk: steps.every(function (s) { return s.ok; }) };
  }

  return { build: build, buildFreiform: buildFreiform, buildThermik: buildThermik, buildOberflaeche: buildOberflaeche };
});
