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

  /* Sprachabhängige Wort-Schnipsel im Rechenweg. Standard = Deutsch; ui.js
   * reicht über fmt.w die Übersetzungen (DE/EN/PT) durch. So bleibt rechenweg.js
   * DOM-frei/Node-testbar (ohne fmt.w = deutsche Ausgabe wie bisher). */
  var RW_DEFAULT_WORDS = {
    crosscheck: 'Gegenprobe', fullfilm: 'Vollschmierung', mixedfilm: 'Mischreibung',
    gap: 'Spalt', ductile: 'duktil', brittle: 'spröde', joinplay: 'Fügespiel',
    hubto: 'Nabe auf', shaftto: 'Welle auf', noresidual: 'kein Restübermaß'
  };
  function wordsOf(fmt) {
    var w = (fmt && fmt.w) || {}, o = {};
    for (var k in RW_DEFAULT_WORDS) o[k] = (w[k] != null) ? w[k] : RW_DEFAULT_WORDS[k];
    return o;
  }

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
    var W = wordsOf(fmt);

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
      '   (' + W.crosscheck + ': PS_max − PS_min = ' + umU(F.PSmax - F.PSmin) + ')',
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
    var W = wordsOf(fmt);
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
      step('rwOaSwirk', 'S_wirk = S_min − ' + n(0.4) + '·ΣRz = ' + umU(Sm) + ' − ' + n(0.4) + '·' + n(round1(RzSum)) + ' = ' + n(round1(sw)) + ' µm',
        eq(round1(sw + 0.4 * RzSum), round1(Sm)));
      var thr = Sm / 3, gap = Sm - RzSum, film = RzSum <= thr + 1e-9;
      step('rwLubeThr', 'S_min / 3 = ' + umU(Sm) + ' / 3 = ' + n(round1(thr)) + ' µm',
        eq(round1(3 * thr), round1(Sm)));
      step('rwLubeGap', W.gap + ' = S_min − ΣRz = ' + umU(Sm) + ' − ' + n(round1(RzSum)) + ' = ' + n(round1(gap)) + ' µm',
        eq(round1(gap + RzSum), round1(Sm)));
      step('rwLubeRule', 'ΣRz ' + (film ? '≤' : '>') + ' S_min/3 : ' + n(round1(RzSum)) + (film ? ' ≤ ' : ' > ') + n(round1(thr)) + ' µm → ' + (film ? W.fullfilm : W.mixedfilm),
        (RzSum <= thr + 1e-9) === film, film ? 'SPIEL' : 'UEBERGANG');
    } else if (F.art === 'UEBERMASS') {
      var Um = F.interferenceMin, uw = Um - 0.8 * RzSum;
      step('rwOaUwirk', 'Ü_wirk = Ü_min − ' + n(0.8) + '·ΣRz = ' + umU(Um) + ' − ' + n(0.8) + '·' + n(round1(RzSum)) + ' = ' + n(round1(uw)) + ' µm',
        eq(round1(uw + 0.8 * RzSum), round1(Um)));
    }
    return { steps: steps, allOk: steps.every(function (s) { return s.ok; }) };
  }

  /* ===================================================================== *
   * B10d — Rechenweg Pressverband (DIN 7190). Rekonstruiert jeden Schritt
   * aus den Primärgrößen und PRÜFT ihn gegen das compute()-Ergebnis (v).
   * Anzeige-Werte bleiben die des Kerns; hier wird nur Konsistenz gezeigt.
   * pv  = { DF, lF, DAa, DIi, Umax, Umin, RzA, RzI, matA, matI, mu, Mt, Fax }
   * v   = Ergebnisobjekt r aus DTPPress.compute(...).r
   * ---------------------------------------------------------------------- */
  function buildPressverband(pv, v, fmt) {
    if (!pv || !v) return { steps: [], allOk: false };
    fmt = fmt || {};
    var umU = fmt.umU || umPlainDefault;
    var n = fmt.n || function (x) { return String(x); };
    var WORDS = wordsOf(fmt);   // eigener Name: 'W' ist hier die Nachgiebigkeit (s. u.)
    function p2(x) { return n(round2(x)); }         // N/mm², Nm: 2 Nachkommastellen
    function p1(x) { return n(round1(x)); }
    function mm(x) { return n(round2(x)); }
    var steps = [];
    function step(key, expr, ok, art) { steps.push({ key: key, expr: expr, ok: ok !== false, art: art || null }); }

    var DF = pv.DF, lF = pv.lF, DAa = pv.DAa, DIi = pv.DIi || 0;
    var mA = pv.matA, mI = pv.matI, mu = pv.mu;

    // 1) Glättung → wirksame Übermaße.
    var RzA = pv.RzA || 0, RzI = pv.RzI || 0, G = 0.8 * (RzA + RzI);
    step('rwPvSmooth', 'G = ' + n(0.8) + '·(Rz_A + Rz_I) = ' + n(0.8) + '·(' + umU(RzA) + ' + ' + umU(RzI) + ') = ' + umU(round2(G)) + ' µm',
      eq(round3(G), round3(v.G_um)));
    step('rwPvUwMax', 'U_w,max = U_max − G = ' + umU(pv.Umax) + ' − ' + umU(round2(G)) + ' = ' + umU(round2(pv.Umax - G)) + ' µm',
      eq(round3(pv.Umax - G), round3(v.Uw_max_um)));
    var uwminRaw = pv.Umin - G;
    step('rwPvUwMin', 'U_w,min = U_min − G = ' + umU(pv.Umin) + ' − ' + umU(round2(G)) + ' = ' + umU(round2(uwminRaw)) + ' µm' + (uwminRaw <= 0 ? ' → 0 (' + WORDS.noresidual + ')' : ''),
      eq(round3(Math.max(0, uwminRaw)), round3(v.Uw_min_um)));

    // 2) Geometrieverhältnisse.
    step('rwPvQA', 'Q_A = D_F / D_Aa = ' + mm(DF) + ' / ' + mm(DAa) + ' = ' + n(round3(DF / DAa)),
      eq(round3(DF / DAa), round3(v.QA)));
    step('rwPvQI', 'Q_I = D_Ii / D_F = ' + mm(DIi) + ' / ' + mm(DF) + ' = ' + n(round3(DIi / DF)),
      eq(round3(DIi / DF), round3(v.QI)));

    // 3) Nachgiebigkeit (Lamé, ebener Spannungszustand).
    var QA = v.QA, QI = v.QI;
    var KA = (1 + QA * QA) / (1 - QA * QA) + mA.nu;
    var KI = (1 + QI * QI) / (1 - QI * QI) - mI.nu;
    step('rwPvKA', 'K_A = (1+Q_A²)/(1−Q_A²) + ν_A = ' + n(round3(KA)),
      eq(round3(KA), round3(v.KA)));
    step('rwPvKI', 'K_I = (1+Q_I²)/(1−Q_I²) − ν_I = ' + n(round3(KI)),
      eq(round3(KI), round3(v.KI)));
    var W = KA / mA.E + KI / mI.E;
    step('rwPvW', 'W = K_A/E_A + K_I/E_I = ' + n(round3(KA)) + '/' + n(mA.E) + ' + ' + n(round3(KI)) + '/' + n(mI.E) + ' = ' + n(sci(W)) + ' mm²/N',
      relEqRW(W, v.W));

    // 4) Fugendrücke p = (U_w/D_F)/W  (U_w in mm = µm/1000).
    var pMax = (v.Uw_max_um / 1000) / (DF * W);
    step('rwPvPmax', 'p_max = (U_w,max/D_F)/W = (' + umU(round2(v.Uw_max_um)) + '/1000 / ' + mm(DF) + ') / W = ' + p2(pMax) + ' N/mm²',
      relEqRW(pMax, v.p_max));
    var pMin = (v.Uw_min_um / 1000) / (DF * W);
    step('rwPvPmin', 'p_min = (U_w,min/D_F)/W = ' + p2(pMin) + ' N/mm²',
      relEqRW(pMin, v.p_min));

    // 5) Elastische Grenze + Fließsicherheit (bei p_max).
    var hypA = mA.brittle ? 'NH' : 'GEH';
    if (mA.brittle) {
      var pzA = (1 - QA * QA) / (1 + QA * QA) * mA.Rm;
      step('rwPvPzulA', 'p_zul,A = (1−Q_A²)/(1+Q_A²)·R_m,A = ' + p2(pzA) + ' N/mm² (' + WORDS.brittle + ', NH)',
        relEqRW(pzA, v.pzulA), 'brittle');
    } else {
      var pzA2 = (1 - QA * QA) * mA.Re / Math.sqrt(3);
      step('rwPvPzulA', 'p_zul,A = (1−Q_A²)·R_e,A/√3 = ' + p2(pzA2) + ' N/mm² (' + WORDS.ductile + ', GEH)',
        relEqRW(pzA2, v.pzulA));
    }
    if (mI.brittle) {
      var pzI = (1 - QI * QI) / (1 + QI * QI) * mI.Rm;
      step('rwPvPzulI', 'p_zul,I = (1−Q_I²)/(1+Q_I²)·R_m,I = ' + p2(pzI) + ' N/mm² (' + WORDS.brittle + ', NH)',
        relEqRW(pzI, v.pzulI), 'brittle');
    } else {
      var pzI2 = (1 - QI * QI) * mI.Re / Math.sqrt(3);
      step('rwPvPzulI', 'p_zul,I = (1−Q_I²)·R_e,I/√3 = ' + p2(pzI2) + ' N/mm² (' + WORDS.ductile + ', GEH)',
        relEqRW(pzI2, v.pzulI));
    }
    step('rwPvPzul', 'p_zul = min(p_zul,A ; p_zul,I) = ' + p2(v.pzul) + ' N/mm²',
      eq(round3(Math.min(v.pzulA, v.pzulI)), round3(v.pzul)));
    step('rwPvSF', 'S_F = p_zul / p_max = ' + p2(v.pzul) + ' / ' + p2(v.p_max) + ' = ' + p2(v.pzul / v.p_max),
      relEqRW(v.pzul / v.p_max, v.SF), v.SF < 1 ? 'crit' : (v.SF < 1.2 ? 'warn' : 'ok'));

    // 6) Übertragbarkeit (bei p_min) + Rutschsicherheit gegen Last.
    var AF = Math.PI * DF * lF;
    step('rwPvAF', 'A_F = π·D_F·l_F = π·' + mm(DF) + '·' + mm(lF) + ' = ' + n(round1(AF)) + ' mm²',
      relEqRW(AF, v.AF_mm2));
    var FaxMax = mu * v.p_min * AF;
    step('rwPvFax', 'F_ax,max = µ·p_min·A_F = ' + n(mu) + '·' + p2(v.p_min) + '·' + n(round1(AF)) + ' = ' + n(round0(FaxMax)) + ' N',
      relEqRW(FaxMax, v.Fax_max_N));
    var MtMax = FaxMax * DF / 2000;
    step('rwPvMt', 'M_t,max = F_ax,max·D_F/2 = ' + n(round0(FaxMax)) + '·' + mm(DF) + '/2 = ' + p2(MtMax) + ' Nm',
      relEqRW(MtMax, v.Mt_max_Nm));
    if (v.SH !== null && v.SH !== undefined) {
      var Ft = (pv.Mt > 0) ? 2000 * pv.Mt / DF : 0;
      var Fres = Math.sqrt((pv.Fax || 0) * (pv.Fax || 0) + Ft * Ft);
      step('rwPvFres', 'F_res = √(F_ax² + (2·M_t/D_F)²) = ' + n(round0(Fres)) + ' N',
        relEqRW(Fres, v.Fres_N));
      step('rwPvSH', 'S_H = µ·p_min·A_F / F_res = ' + n(round0(v.mu * v.p_min * AF)) + ' / ' + n(round0(Fres)) + ' = ' + p2(v.SH),
        relEqRW((v.mu * v.p_min * AF) / Fres, v.SH), v.SH < 1 ? 'crit' : (v.SH < 1.5 ? 'warn' : 'ok'));
    }

    // 7) Fügen: Einpresskraft (bei p_max) + thermisches Fügen.
    var Fe = mu * v.p_max * AF;
    step('rwPvFe', 'F_e = µ·p_max·A_F = ' + n(mu) + '·' + p2(v.p_max) + '·' + n(round1(AF)) + ' = ' + n(round0(Fe)) + ' N',
      relEqRW(Fe, v.Fe_N));
    step('rwPvSf', 'S_f ≈ 1 µm/mm · D_F = ' + umU(round1(v.Sf_um)) + ' µm (' + WORDS.joinplay + ')',
      eq(round3(DF), round3(v.Sf_um)));
    if (v.T_hub_C !== null && v.T_hub_C !== undefined && mA.alpha > 0) {
      var dTh = (pv.Umax + v.Sf_um) * 1000 / (mA.alpha * DF);
      step('rwPvTHub', 'ΔT_A = (U_max + S_f)/(α_A·D_F) = (' + umU(pv.Umax) + '+' + umU(round1(v.Sf_um)) + ')/(' + n(mA.alpha) + '·' + mm(DF) + ') = ' + p1(dTh) + ' K → ' + WORDS.hubto + ' ' + p1(v.T0_C + dTh) + ' °C',
        relEqRW(dTh, v.dT_hub_K));
    }
    if (v.T_shaft_C !== null && v.T_shaft_C !== undefined && mI.alpha > 0) {
      var dTs = (pv.Umax + v.Sf_um) * 1000 / (mI.alpha * DF);
      step('rwPvTShaft', 'ΔT_I = (U_max + S_f)/(α_I·D_F) = ' + p1(dTs) + ' K → ' + WORDS.shaftto + ' ' + p1(v.T0_C - dTs) + ' °C',
        relEqRW(dTs, v.dT_shaft_K));
    }

    return { steps: steps, allOk: steps.every(function (s) { return s.ok; }) };
  }

  function round2(x) { return Math.round(x * 100) / 100; }
  function round0(x) { return Math.round(x); }
  function sci(x) { return x.toExponential(3); }
  function relEqRW(a, b) {
    return isFinite(a) && isFinite(b) &&
      Math.abs(a - b) <= 1e-4 * Math.max(Math.abs(a), Math.abs(b), 1e-300);
  }

  return { build: build, buildFreiform: buildFreiform, buildThermik: buildThermik, buildOberflaeche: buildOberflaeche, buildPressverband: buildPressverband };
});
