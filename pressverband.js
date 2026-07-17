/* ============================================================================
 * DT-ProfiPassung · pressverband.js · Modul DTPPress (Baustein B10b)
 * ----------------------------------------------------------------------------
 * Zylindrischer Pressverband nach DIN 7190-1 — REIN ELASTISCHE Auslegung:
 *   • Glättung (Übermaßverlust beim Fügen)  G = 0,8·(Rz_A + Rz_I)
 *     (gleiche Konvention wie beratung.js/F6 „wirksames Kleinstübermaß“)
 *   • Fugendruck p aus dem wirksamen Übermaß (Lamé, dickwandige Zylinder,
 *     ebener Spannungszustand):
 *       Q_A = D_F/D_Aa · Q_I = D_Ii/D_F
 *       K_A = (1+Q_A²)/(1−Q_A²) + ν_A · K_I = (1+Q_I²)/(1−Q_I²) − ν_I
 *       W   = K_A/E_A + K_I/E_I          p = (U_w/D_F)/W
 *   • Elastische Grenz-Fugendrücke (vollelastisch, DIN-7190-GEH-Näherung):
 *       duktil:  p_zul = (1−Q²)·R_e/√3   (Vollwelle: Q_I = 0 einsetzen)
 *       spröde Nabe (GJL, NH gegen Bruch): p_zul = (1−Q_A²)/(1+Q_A²)·R_m
 *         → Hinweis-Code: erforderliche Sicherheit S ≥ 2…3 gegen Bruch!
 *   • Übertragbarkeit (Kraftschluss, Haftbeiwert µ, beim KLEINSTEN Druck p_min):
 *       F_ax,max = µ·p_min·π·D_F·l_F     M_t,max = F_ax,max·D_F/2
 *       Rutschsicherheit S_H = µ·p_min·π·D_F·l_F / √(F_ax² + (2·M_t/D_F)²)
 *   • Fügen: Einpresskraft (längs, bei p_max)  F_e = µ·p_max·π·D_F·l_F
 *       Erwärmen der Nabe / Unterkühlen der Welle über das GRÖSSTE Ist-Übermaß
 *       U_max (ungeglättet!) + Fügespiel S_f ≈ 1 µm je mm Fugendurchmesser:
 *       ΔT = (U_max + S_f) / (α · D_F)   (α in 1e-6/K → Faktor 1000 s. Code)
 *
 * MODELLGRENZEN (ehrlich, als Hinweis-Codes gemeldet, nicht stillschweigend):
 *   elastisch (keine elastisch-plastische Auslegung n. DIN 7190 Anh. A),
 *   gleich lange Fuge (Kantenpressung an Nabenkanten NICHT erfasst),
 *   glatter zylindrischer Sitz, ruhende/quasistatische Last.
 *
 * µ-Tabelle: RICHTWERTE nach DIN 7190-1/Literatur — die Spannen sind real groß;
 * deshalb liefert jede Zeile mu (vorsichtiger Rechenwert) + range [min,max].
 * Werkstoffkennwerte (E, ν, R_e, R_m, α) kommen aus thermik.js MAT (dort seit
 * B8 final angelegt: „E/nu/Re werden erst in B10 gebraucht“).
 *
 * DOM-frei/Node-testbar. Rückgaben sind sprachneutrale CODES + Zahlen;
 * alle Texte (DE/EN/PT) liegen in ui.js (B10c/d). Klassisches UMD.
 * ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DTPPress = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SQRT3 = Math.sqrt(3);

  /* ------------------------------------------------------------------------
   * Haftbeiwerte µ (Rutschbeiwerte, Umfangs-/Längsrichtung) — RICHTWERTE.
   * mu = vorsichtiger Rechenwert · range = publizierte Spanne (Literatur/DIN).
   * key ist sprachneutral; Beschriftung übernimmt ui.js in B10c.
   * ---------------------------------------------------------------------- */
  var MU = [
    { key: 'STST_DRY',  mu: 0.14, range: [0.10, 0.20] },  // Stahl–Stahl, trocken entfettet (Schrumpf/quer)
    { key: 'STST_OIL',  mu: 0.08, range: [0.05, 0.12] },  // Stahl–Stahl, geölt (längs eingepresst)
    { key: 'STGJL_DRY', mu: 0.10, range: [0.08, 0.12] },  // Stahl–Grauguss, trocken
    { key: 'STGJL_OIL', mu: 0.06, range: [0.04, 0.08] },  // Stahl–Grauguss, geölt
    { key: 'STALU',     mu: 0.05, range: [0.03, 0.07] },  // Stahl–Aluminium
    { key: 'STCU',      mu: 0.06, range: [0.05, 0.10] }   // Stahl–Kupferlegierung (Ms/Bz)
  ];
  var MU_ORDER = MU.map(function (m) { return m.key; });
  function muByKey(key) {
    for (var i = 0; i < MU.length; i++) if (MU[i].key === key) return MU[i];
    return null;
  }

  /* ------------------------------------------------------------------------
   * Kleine Rechenbausteine (einzeln exportiert → im Harness direkt prüfbar)
   * ---------------------------------------------------------------------- */

  /* Übermaße (µm) aus einem solver.js-Ergebnis ziehen (Vorzeichen-Konvention:
   * fit.PSmax/PSmin sind SPIELE; Übermaß = negatives Spiel; solver liefert unter
   * res.fit bereits interferenceMax = max(0, −PSmin) und interferenceMin = max(0, −PSmax)). */
  function fromFit(res) {
    if (!res || !res.ok || !res.fit) return null;
    return { U_max_um: res.fit.interferenceMax, U_min_um: res.fit.interferenceMin };
  }

  /* Nachgiebigkeitssumme W in mm²/N (Lamé, ebener Spannungszustand). */
  function compliance(QA, QI, matA, matI) {
    var KA = (1 + QA * QA) / (1 - QA * QA) + matA.nu;
    var KI = (1 + QI * QI) / (1 - QI * QI) - matI.nu;
    return { KA: KA, KI: KI, W: KA / matA.E + KI / matI.E };
  }

  /* Fugendruck (N/mm²) aus wirksamem Übermaß (µm). */
  function pressure(Uw_um, DF, W) {
    if (Uw_um <= 0) return 0;
    return (Uw_um / 1000) / (DF * W);
  }

  /* Vollelastischer Grenz-Fugendruck EINER Seite.
   * duktil (Re): DIN-7190-GEH-Näherung · spröde (brittle, Rm): Normalspannungs-
   * hypothese an der Nabenbohrung (σ_t,max = p·(1+Q²)/(1−Q²) ≤ R_m). */
  function limitPressure(Q, mat) {
    if (mat.brittle) {
      if (!(mat.Rm > 0)) return null;
      return (1 - Q * Q) / (1 + Q * Q) * mat.Rm;
    }
    if (!(mat.Re > 0)) return null;
    return (1 - Q * Q) * mat.Re / SQRT3;
  }

  /* ------------------------------------------------------------------------
   * Hauptrechnung
   * inp = {
   *   DF, lF, DAa, DIi,            Geometrie in mm (DIi = 0 → Vollwelle)
   *   U_max_um, U_min_um,          Ist-Übermaße der Passung in µm (>0 = Übermaß)
   *   RzA_um, RzI_um,              Rautiefen Bohrung(Außenteil)/Welle in µm
   *   matA, matI,                  { E, nu, Re, Rm?, brittle?, alpha? }
   *   mu,                          Haftbeiwert (Zahl) — Tabelle: MU/muByKey
   *   Mt_Nm, Fax_N,                geforderte Last (optional, für S_H)
   *   T0_C                         Bezugstemperatur (Standard 20 °C)
   * }
   * Rückgabe: { ok:true, r:{...}, hints:[CODE,...] } | { ok:false, error:CODE }
   * ---------------------------------------------------------------------- */
  function compute(inp) {
    if (!inp) return { ok: false, error: 'PV_ERR_INPUT' };
    var DF = num(inp.DF), lF = num(inp.lF), DAa = num(inp.DAa);
    var DIi = (inp.DIi == null || inp.DIi === '') ? 0 : num(inp.DIi);
    var Umax = num(inp.U_max_um), Umin = num(inp.U_min_um);
    var RzA = (inp.RzA_um == null) ? 0 : num(inp.RzA_um);
    var RzI = (inp.RzI_um == null) ? 0 : num(inp.RzI_um);
    var mu = num(inp.mu);
    var T0 = (inp.T0_C == null) ? 20 : num(inp.T0_C);

    if (!(DF > 0) || !(lF > 0) || !(DAa > 0) || isNaN(DIi) || isNaN(Umax) || isNaN(Umin)) {
      return { ok: false, error: 'PV_ERR_INPUT' };
    }
    if (!(DAa > DF) || DIi < 0 || !(DIi < DF)) return { ok: false, error: 'PV_ERR_GEOM' };
    var matA = inp.matA, matI = inp.matI;
    if (!matOk(matA) || !matOk(matI)) return { ok: false, error: 'PV_ERR_MAT' };
    if (!(mu > 0) || mu > 1) return { ok: false, error: 'PV_ERR_MU' };
    if (RzA < 0 || RzI < 0) return { ok: false, error: 'PV_ERR_INPUT' };

    // Übermaß-Grenzen normieren (U_max = größeres Übermaß).
    if (Umin > Umax) { var tmp = Umax; Umax = Umin; Umin = tmp; }
    if (!(Umax > 0)) return { ok: false, error: 'PV_ERR_NO_INTERFERENCE' };

    var hints = [];

    // 1) Glättung → wirksame Übermaße.
    var G = 0.8 * (RzA + RzI);
    var UwMax = Umax - G;
    var UwMin = Umin - G;
    if (!(UwMax > 0)) return { ok: false, error: 'PV_ERR_NO_INTERFERENCE' };
    var UwMinEff = UwMin;
    if (UwMin <= 0) { UwMinEff = 0; hints.push('PV_WARN_UWMIN'); }

    // 2) Geometrieverhältnisse + Nachgiebigkeit.
    var QA = DF / DAa, QI = DIi / DF;
    var c = compliance(QA, QI, matA, matI);

    // 3) Fugendrücke.
    var pMax = pressure(UwMax, DF, c.W);
    var pMin = pressure(UwMinEff, DF, c.W);

    // 4) Elastische Grenzen + Sicherheit gegen Fließen/Bruch (bei p_max).
    var pzulA = limitPressure(QA, matA);
    var pzulI = limitPressure(QI, matI);
    if (pzulA == null || pzulI == null) return { ok: false, error: 'PV_ERR_MAT' };
    var pzul = Math.min(pzulA, pzulI);
    var SF = pzul / pMax;
    if (pMax > pzul) hints.push('PV_WARN_YIELD');
    if (matA.brittle || matI.brittle) hints.push('PV_HINT_BRITTLE');

    // 5) Übertragbarkeit (beim kleinsten Druck) + Rutschsicherheit gegen Last.
    var AF = Math.PI * DF * lF;                 // Fugenfläche mm²
    var FaxMax = mu * pMin * AF;                // N
    var MtMax = FaxMax * DF / 2000;             // Nm
    var Mt = (inp.Mt_Nm == null) ? 0 : num(inp.Mt_Nm);
    var Fax = (inp.Fax_N == null) ? 0 : num(inp.Fax_N);
    if (isNaN(Mt) || Mt < 0 || isNaN(Fax) || Fax < 0) return { ok: false, error: 'PV_ERR_INPUT' };
    var Ft = (Mt > 0) ? 2000 * Mt / DF : 0;     // N (Umfangskraft aus M_t)
    var Fres = Math.sqrt(Fax * Fax + Ft * Ft);  // N
    var SH = (Fres > 0) ? (mu * pMin * AF) / Fres : null;
    if (SH !== null && SH < 1) hints.push('PV_WARN_SLIP');

    // 6) Fügen: Einpresskraft (längs) · Erwärmen/Unterkühlen (quer).
    var Fe = mu * pMax * AF;                    // N
    var Sf = DF;                                // µm (≈ 1 µm je mm D_F)
    var dTh = null, Th = null, dTs = null, Ts = null;
    if (matA.alpha > 0) {
      dTh = (Umax + Sf) * 1000 / (matA.alpha * DF);   // K
      Th = T0 + dTh;                                  // °C (Nabe erwärmen)
      if (Th > 350) hints.push('PV_HINT_TEMP_HUB');
    }
    if (matI.alpha > 0) {
      dTs = (Umax + Sf) * 1000 / (matI.alpha * DF);   // K
      Ts = T0 - dTs;                                  // °C (Welle unterkühlen)
      if (Ts < -196) hints.push('PV_WARN_TEMP_SHAFT');
      else if (Ts < -78) hints.push('PV_HINT_TEMP_SHAFT_LN2');
    }

    // 7) Geometrie-/Werkstoff-Hinweise (Modellgrenzen ehrlich melden).
    if (QA > 0.8) hints.push('PV_HINT_THIN_HUB');
    if (lF / DF < 0.3) hints.push('PV_HINT_LF_SHORT');
    if (lF / DF > 1.5) hints.push('PV_HINT_LF_LONG');
    if ((matA.E <= 75000 && !matA.brittle) || (matI.E <= 75000 && !matI.brittle)) {
      hints.push('PV_HINT_CREEP');                    // Alu/Mg/Kunststoff: Setzen/Kriechen
    }

    return {
      ok: true,
      hints: hints,
      r: {
        DF: DF, lF: lF, DAa: DAa, DIi: DIi,
        QA: QA, QI: QI, KA: c.KA, KI: c.KI, W: c.W,
        G_um: G, Uw_max_um: UwMax, Uw_min_um: UwMinEff, Uw_min_raw_um: UwMin,
        U_max_um: Umax, U_min_um: Umin,
        p_max: pMax, p_min: pMin,
        pzulA: pzulA, pzulI: pzulI, pzul: pzul, SF: SF,
        hypA: matA.brittle ? 'NH' : 'GEH', hypI: matI.brittle ? 'NH' : 'GEH',
        mu: mu, AF_mm2: AF,
        Fax_max_N: FaxMax, Mt_max_Nm: MtMax,
        Mt_Nm: Mt, Fax_N: Fax, Ft_N: Ft, Fres_N: Fres, SH: SH,
        Fe_N: Fe,
        Sf_um: Sf, dT_hub_K: dTh, T_hub_C: Th, dT_shaft_K: dTs, T_shaft_C: Ts,
        T0_C: T0
      }
    };
  }

  /* -------------------------------------------------------------- Helfer */
  function num(x) { return (typeof x === 'number') ? x : parseFloat(String(x).replace(',', '.')); }
  function matOk(m) {
    return !!m && m.E > 0 && typeof m.nu === 'number' && m.nu > 0 && m.nu < 0.5;
  }

  return {
    MU: MU,
    MU_ORDER: MU_ORDER,
    muByKey: muByKey,
    fromFit: fromFit,
    compliance: compliance,
    pressure: pressure,
    limitPressure: limitPressure,
    compute: compute
  };
});
