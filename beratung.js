/* ============================================================================
 * DT-ProfiPassung · beratung.js · Modul DTPBeratung
 * Beratungs-Module B9 (Richtwerte, ehrlich gekennzeichnet):
 *   • F7 Fertigungs-/Kostenampel  — Verfahren ↔ erreichbare IT (1.7)
 *   • F8 Messmittel-Empfehlung     — „goldene Regel" U ≤ T/10 (VDI/VDE 2617, 1.8)
 * DOM-frei/Node-testbar. Rückgaben sind sprachneutrale CODES + Zahlen;
 * die Texte (DE/EN/PT) liegen in ui.js. Klassisches UMD (kein ES-Modul).
 * ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DTPBeratung = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Verfahren ↔ erreichbare IT (Richtwerte, 1.7). [IT_min, IT_max] einschließlich. */
  var PROC = {
    LAEPPEN:       [3, 5],
    HONEN:         [4, 6],
    RUNDSCHLEIFEN: [5, 7],
    REIBEN:        [6, 8],
    FEINDREHEN:    [6, 8],
    DREHEN:        [7, 11],
    RAEUMEN:       [7, 8],
    FRAESEN:       [8, 11],
    BOHREN:        [11, 13]
  };

  /* Messmittel-Richtwerttabelle (1.8). Unsicherheit U in µm; für die Eignung
   * wird konservativ der ungünstigste Wert uMax herangezogen. Grenzlehren sind
   * Lehren (prüfen die Taylor-Hüllbedingung direkt) → keine U, stets geeignet. */
  var INSTR = [
    { key: 'MESSSCHIEBER',  uMin: 30,  uMax: 50 },  // Messschieber digital ±0,03–0,05 mm
    { key: 'MIKROMETER',    uMin: 4,   uMax: 4  },  // Bügelmessschraube ±4 µm
    { key: 'INNENMIKRO_3P', uMin: 4,   uMax: 6  },  // 3-Punkt-Innenmessschraube ±4–6 µm
    { key: 'MESSUHR',       uMin: 5,   uMax: 10 },  // Feinzeiger/Messuhr ±5–10 µm
    { key: 'KMG',           uMin: 1.5, uMax: 3  },  // Koordinatenmessgerät ±1,5–3 µm
    { key: 'GRENZLEHRE',    gauge: true }           // Grenzlehrdorn/-ring (Taylor direkt)
  ];

  var EPS = 1e-9;

  /* Welche Verfahren erreichen eine gegebene IT-Güte? → Liste von PROC-Keys. */
  function processesForIT(it) {
    var out = [];
    for (var k in PROC) if (PROC.hasOwnProperty(k)) {
      if (it >= PROC[k][0] && it <= PROC[k][1]) out.push(k);
    }
    return out;
  }

  /* Kostenampel aus der IT-Güte (1.7):
   *   ≤ IT6 → rot (Schleifen/Honen, teuer, Ausschussrisiko)
   *   IT7–IT8 → gelb (Feindrehen/Reiben, mittel)
   *   ≥ IT9 → grün (Standard-Drehen, günstig)
   * Rückgabe: { it, tier:'red|yellow|green', code, processes:[erreichbare Verfahren] } */
  function costTraffic(it) {
    it = Number(it);
    if (!isFinite(it) || it <= 0) return { it: it, tier: null, code: 'COST_UNDEFINED', processes: [] };
    var tier = it <= 6 ? 'red' : (it <= 8 ? 'yellow' : 'green');
    var code = tier === 'red' ? 'COST_RED' : (tier === 'yellow' ? 'COST_YELLOW' : 'COST_GREEN');
    return { it: it, tier: tier, code: code, processes: processesForIT(it) };
  }

  /* Messmittel-Empfehlung zur „goldenen Regel" (1.8):
   *   ideal (golden)  : U ≤ T/10
   *   brauchbar (✓)   : U ≤ T/5   (Warnstufe — geeignet, aber nicht ideal)
   *   ungeeignet (✗)  : U > T/5
   * tolUm = Maßtoleranz T in µm. Rückgabe mit Flags je Messmittel. */
  function measurement(tolUm) {
    tolUm = Number(tolUm);
    if (!isFinite(tolUm) || tolUm <= 0) {
      return { tolUm: tolUm, uGoldenUm: null, uWarnUm: null, code: 'MEAS_UNDEFINED', instruments: [] };
    }
    var uGolden = tolUm / 10, uWarn = tolUm / 5;
    var list = INSTR.map(function (m) {
      if (m.gauge) return { key: m.key, gauge: true, suitable: true, golden: true };
      var u = m.uMax;
      return {
        key: m.key, uMaxUm: u,
        suitable: u <= uWarn + EPS,   // ✓ erfüllt mindestens die Warnstufe
        golden:   u <= uGolden + EPS   // erfüllt die ideale 1/10-Regel
      };
    });
    return { tolUm: tolUm, uGoldenUm: uGolden, uWarnUm: uWarn, code: 'MEAS_OK', instruments: list };
  }

  function num0(x) { x = Number(x); return (isFinite(x) && x > 0) ? x : 0; }

  /* Rz-Bewertung gegen Maßtoleranz T (1.7): ideal Rz ≤ T/5; Warnstufen T/3, T/2.
   * → { stage:'ok|warn|high|crit', code, RzMaxOkUm:T/5, formMaxUm:T/3 } (1.9). */
  function surfaceStage(Rz, T) {
    if (!(T > 0)) return { stage: null, code: 'SURF_UNDEFINED', RzUm: Rz, RzMaxOkUm: null, formMaxUm: null };
    var stage, code;
    if (Rz <= T / 5 + EPS) { stage = 'ok';   code = 'SURF_OK'; }
    else if (Rz <= T / 3 + EPS) { stage = 'warn'; code = 'SURF_WARN'; }
    else if (Rz <= T / 2 + EPS) { stage = 'high'; code = 'SURF_HIGH'; }
    else { stage = 'crit'; code = 'SURF_CRIT'; }
    return { stage: stage, code: code, RzUm: Rz, RzMaxOkUm: T / 5, formMaxUm: T / 3 };
  }

  /* Oberflächen-Check (F6, Richtwerte 1.7/1.9). rz = { RzB, RzW } in µm.
   * Liefert je Bauteil die Rz-Stufe + Rundheits-Richtwert (T/3) und – je nach
   * Passungsart – das „wirksame" Kleinstspiel bzw. Kleinstübermaß nach Glättung:
   *   Spiel   : S_wirk ≈ S_min − 0,4·ΣRz
   *   Übermaß : Ü_wirk ≈ Ü_min − 0,8·ΣRz  (Glättung mindert das Übermaß) */
  function surface(res, rz) {
    rz = rz || {};
    var RzB = num0(rz.RzB), RzW = num0(rz.RzW), RzSum = RzB + RzW;
    var Th = res.hole.upper - res.hole.lower, Ts = res.shaft.upper - res.shaft.lower;
    var hole = surfaceStage(RzB, Th), shaft = surfaceStage(RzW, Ts);
    hole.T = Th; shaft.T = Ts;
    var art = res.fit.art, eff;
    if (art === 'SPIEL') {
      var base = res.fit.PSmin, e = base - 0.4 * RzSum;
      eff = { kind: 'clearance', baseUm: base, factor: 0.4, deductUm: 0.4 * RzSum, effUm: e, code: (e <= 0 ? 'CLEAR_LOSS' : 'CLEAR_OK') };
    } else if (art === 'UEBERMASS') {
      var pb = res.fit.interferenceMin, pe = pb - 0.8 * RzSum;
      eff = { kind: 'interference', baseUm: pb, factor: 0.8, deductUm: 0.8 * RzSum, effUm: pe, code: (pe <= 0 ? 'PRESS_LOSS' : 'PRESS_OK') };
    } else {
      eff = { kind: 'none', code: 'EFF_NA' };
    }
    return { hole: hole, shaft: shaft, RzSumUm: RzSum, effective: eff };
  }

  /* Schmierspalt-Richtwert (F9, 1.10) – nur bei Spielpassungen.
   * Stribeck-Faustregel: Vollschmierung plausibel, wenn ΣRz ≤ S_min/3, sonst
   * Mischreibungs-Warnung. Nutzbarer Spalt konservativ ≈ S_min − ΣRz. */
  function lubrication(res, rz) {
    rz = rz || {};
    var RzB = num0(rz.RzB), RzW = num0(rz.RzW), RzSum = RzB + RzW;
    var Smin = res.fit.PSmin;
    if (res.fit.art !== 'SPIEL' || !(Smin > 0)) {
      return { applies: false, code: 'LUBE_NA', SminUm: Smin, RzSumUm: RzSum };
    }
    var thr = Smin / 3, gap = Smin - RzSum, okFilm = RzSum <= thr + EPS;
    return {
      applies: true, SminUm: Smin, RzSumUm: RzSum, thresholdUm: thr,
      gapWirkUm: gap, ratio: RzSum / Smin, ok: okFilm,
      code: okFilm ? 'LUBE_OK' : 'HINT_LUBRICATION'
    };
  }

  return {
    PROC: PROC,
    INSTR: INSTR,
    processesForIT: processesForIT,
    costTraffic: costTraffic,
    measurement: measurement,
    surfaceStage: surfaceStage,
    surface: surface,
    lubrication: lubrication
  };
});
