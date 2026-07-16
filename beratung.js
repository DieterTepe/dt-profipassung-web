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

  return {
    PROC: PROC,
    INSTR: INSTR,
    processesForIT: processesForIT,
    costTraffic: costTraffic,
    measurement: measurement
  };
});
