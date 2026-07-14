/* ============================================================================
 * DT-ProfiPassung · thermik.js  (Baustein B8 — Thermik-Check)
 * ----------------------------------------------------------------------------
 * DIN EN ISO 1: alle Toleranzen gelten bei 20 °C. Bei Betriebstemperatur T
 * verschiebt sich das Spiel um   ΔS = (α_Bohrungsteil − α_Wellenteil)·(T−20)·D
 * (lineares Modell; α in 1e-6/K, D in mm, ΔS in µm über /1000). Das ganze
 * Passungsfenster (PS_max und PS_min) verschiebt sich um ΔS; die Passungsart
 * kann umschlagen (Warnung). Enthält die Werkstoffbibliothek MAT (Richtwerte).
 * DOM-frei → ohne Browser testbar. Ladereihenfolge: … solver -> thermik -> … -> ui.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DTPThermik = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Werkstoff-RICHTWERTE (legierungsabhängig!). alpha in 1e-6/K, E in N/mm²,
   * nu = Querkontraktion, Re = Streckgrenze in N/mm² (spröde: null → Rm nutzen).
   * E/nu/Re werden erst in B10 (Pressverband) gebraucht, hier zählt alpha.
   * Für konkrete Werkstoffe gegen Datenblatt/Tabellenbuch prüfen. */
  var MAT = {
    steel:      { label: { de: 'Stahl', en: 'Steel', pt: 'Aço' }, alpha: 11.5, E: 210000, nu: 0.30, Re: 355 },
    stainless:  { label: { de: 'Nichtrost. Stahl (A2)', en: 'Stainless steel (A2)', pt: 'Aço inox (A2)' }, alpha: 16, E: 200000, nu: 0.30, Re: 210 },
    cast_iron:  { label: { de: 'Grauguss (GJL)', en: 'Grey cast iron', pt: 'Ferro fundido (GJL)' }, alpha: 10, E: 110000, nu: 0.28, Re: null, brittle: true },
    alu:        { label: { de: 'Aluminium', en: 'Aluminium', pt: 'Alumínio' }, alpha: 23, E: 70000, nu: 0.33, Re: 250 },
    brass:      { label: { de: 'Messing', en: 'Brass', pt: 'Latão' }, alpha: 18.5, E: 100000, nu: 0.35, Re: 200 },
    bronze:     { label: { de: 'Bronze', en: 'Bronze', pt: 'Bronze' }, alpha: 18, E: 110000, nu: 0.34, Re: 150 },
    copper:     { label: { de: 'Kupfer', en: 'Copper', pt: 'Cobre' }, alpha: 16.5, E: 125000, nu: 0.34, Re: 60 },
    titanium:   { label: { de: 'Titan', en: 'Titanium', pt: 'Titânio' }, alpha: 8.6, E: 110000, nu: 0.34, Re: 350 },
    magnesium:  { label: { de: 'Magnesium', en: 'Magnesium', pt: 'Magnésio' }, alpha: 26, E: 45000, nu: 0.35, Re: 150 },
    pom:        { label: { de: 'Kunststoff (POM)', en: 'Plastic (POM)', pt: 'Plástico (POM)' }, alpha: 110, E: 3000, nu: 0.35, Re: 65 }
  };
  var MAT_ORDER = ['steel', 'stainless', 'cast_iron', 'alu', 'brass', 'bronze', 'copper', 'titanium', 'magnesium', 'pom'];
  var T0_DEFAULT = 20;
  var CODE = { OK: 'OK', TEMP: 'TH_TEMP', ALPHA: 'TH_ALPHA', NO_FIT: 'TH_NO_FIT' };

  function round1(x) { return Math.round(x * 10) / 10; }

  /* compute(fit, opts)
   * fit  = Ergebnis von DTPSolver.computeFit (fit.ok === true)
   * opts = { alphaHole, alphaShaft, T, T0 } — α in 1e-6/K, T/T0 in °C. */
  function compute(fit, opts) {
    if (!fit || !fit.ok) return { ok: false, code: CODE.NO_FIT };
    opts = opts || {};
    var T0 = (opts.T0 == null) ? T0_DEFAULT : opts.T0;
    var T = opts.T;
    if (typeof T !== 'number' || isNaN(T)) return { ok: false, code: CODE.TEMP };
    var ah = opts.alphaHole, as = opts.alphaShaft;
    if (typeof ah !== 'number' || typeof as !== 'number' || isNaN(ah) || isNaN(as)) return { ok: false, code: CODE.ALPHA };

    var N = fit.input.nominal;
    var dT = T - T0;
    var dS = (ah - as) * dT * N / 1000;          // µm (roh, für Logik)
    var PSmax20 = fit.fit.PSmax, PSmin20 = fit.fit.PSmin;
    var PSmaxT = PSmax20 + dS, PSminT = PSmin20 + dS;
    var artT = PSminT >= 0 ? 'SPIEL' : PSmaxT <= 0 ? 'UEBERMASS' : 'UEBERGANG';

    return {
      ok: true,
      T: T, T0: T0, dT: dT, nominal: N,
      alphaHole: ah, alphaShaft: as,
      dS: round1(dS),
      PSmax20: PSmax20, PSmin20: PSmin20,
      PSmaxT: round1(PSmaxT), PSminT: round1(PSminT),
      art20: fit.fit.art, artT: artT,
      umschlag: artT !== fit.fit.art
    };
  }

  var PRESETS = [
    { label: '40 H7/p6 · Stahl in Alu · 80 °C', fit: '40 H7/p6', hole: 'alu', shaft: 'steel', T: 80 }
  ];

  return { MAT: MAT, MAT_ORDER: MAT_ORDER, compute: compute, T0_DEFAULT: T0_DEFAULT, CODE: CODE, PRESETS: PRESETS };
});
