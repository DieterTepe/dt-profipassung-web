/* ============================================================================
 * DT-ProfiPassung · assistent.js · Modul DTPAssistent (Baustein B11)
 * ----------------------------------------------------------------------------
 * Passungs-Assistent: führt den Nutzer über einen kurzen Frage-Dialog zur
 * passenden Passung. REIN LOGISCH und DOM-frei (Node-testbar) — der Dialog
 * selbst (Overlay) sitzt in ui.js. Alles sprachneutral über Codes; die Texte
 * (Fragen, Antworten, Begründungen) übersetzt ui.js.
 *
 * Ablauf (vom UI gesteuert):
 *   1) firstQuestion()            → erste Frage (immer 'purpose')
 *   2) optionsFor(id, answers)    → Antwort-Codes einer Frage
 *   3) nextQuestion(answers)      → nächste Frage-ID oder null (fertig)
 *   4) recommend(answers)         → bis zu 3 Vorschläge (Codes + fit-String)
 *
 * Die 4 Fragen (Freimaß bewusst RAUS — selbsterklärend):
 *   Q1 purpose   : SLIDE (gleiten/drehen) · HANDFIT (fügen/lösen) · FIXED (fest & Moment)
 *   Q2 demount   : OFTEN · SELDOM · NEVER
 *   Q3 precision : NORMAL · HIGH · LOW
 *   Q4 kontextabhängig:
 *        bei FIXED  → hubMat : STEEL · CAST · LIGHT   (Nabenwerkstoff)
 *        sonst      → temp   : NORMAL · HOT           (Betriebstemperatur)
 *
 * Jeder Vorschlag: { fit, reasonCode, hBasisAlt?, hintCode? }
 *   fit        z. B. '50 H7/g6' (Nennmaß wird vom UI aus dem Formular gesetzt;
 *              hier nur das Toleranz-Kurzzeichen relevant → 'H7/g6')
 *   reasonCode Laien-Begründung (ui.js: STR['asR_'+code])
 *   hBasisAlt  optionaler h-System-Alternativvorschlag (Kurzzeichen)
 *   hintCode   optionaler Warn-/Verweis-Hinweis (z. B. Pressverband/Thermik)
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DTPAssistent = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var QUESTIONS = {
    purpose:  ['SLIDE', 'HANDFIT', 'FIXED'],
    demount:  ['OFTEN', 'SELDOM', 'NEVER'],
    precision:['NORMAL', 'HIGH', 'LOW'],
    hubMat:   ['STEEL', 'CAST', 'LIGHT'],
    temp:     ['NORMAL', 'HOT']
  };

  function firstQuestion() { return 'purpose'; }

  function optionsFor(id) { return QUESTIONS[id] ? QUESTIONS[id].slice() : []; }

  /* Reihenfolge: purpose → demount → precision → (hubMat | temp). Die vierte
   * Frage hängt von purpose ab. null = Dialog fertig. */
  function nextQuestion(a) {
    a = a || {};
    if (!a.purpose)   return 'purpose';
    if (!a.demount)   return 'demount';
    if (!a.precision) return 'precision';
    var fourth = (a.purpose === 'FIXED') ? 'hubMat' : 'temp';
    if (!a[fourth])   return fourth;
    return null;
  }

  function isValidAnswer(id, val) {
    return !!QUESTIONS[id] && QUESTIONS[id].indexOf(val) >= 0;
  }

  /* Kern: Antworten → bis zu 3 Vorschläge. Reine Funktion. */
  function recommend(a) {
    a = a || {};
    if (!a.purpose) return { ok: false, error: 'AS_ERR_INCOMPLETE' };

    var out = [];
    function push(fit, reason, hAlt, hint) {
      out.push({ fit: fit, reasonCode: reason, hBasisAlt: hAlt || null, hintCode: hint || null });
    }

    if (a.purpose === 'SLIDE') {
      // Gleiten/drehen — Führung dreht, Schmierfilm gewünscht.
      if (a.precision === 'HIGH') {
        push('H7/g6', 'AS_R_G6', 'G7/h6');
        push('H6/g5', 'AS_R_G5_PREC', null);
        push('H7/f7', 'AS_R_F7', null);
      } else if (a.precision === 'LOW') {
        push('H8/e8', 'AS_R_E8', null);
        push('H8/f7', 'AS_R_F7_LOOSE', null);
        push('H7/f7', 'AS_R_F7', null);
      } else {
        push('H7/f7', 'AS_R_F7', 'F8/h7');
        push('H8/e8', 'AS_R_E8', null);
        push('H7/g6', 'AS_R_G6', null);
      }
      if (a.temp === 'HOT') out.forEach(function (r) { if (!r.hintCode) r.hintCode = 'AS_HINT_TEMP'; });
    } else if (a.purpose === 'HANDFIT') {
      // Von Hand fügen/lösen — Schiebesitz bis wackelfreie Zentrierung.
      if (a.precision === 'HIGH') {
        push('H7/js6', 'AS_R_JS6', 'JS7/h6');
        push('H7/h6', 'AS_R_H6', null);
        push('H7/k6', 'AS_R_K6_LIGHT', null);
      } else {
        push('H7/h6', 'AS_R_H6', 'H8/h7');
        push('H7/js6', 'AS_R_JS6', null);
        push('H8/h8', 'AS_R_H8_LOOSE', null);
      }
      // Häufig demontiert → engen Übergang (k6) meiden, lockereres zuerst.
      if (a.demount === 'OFTEN') {
        out.sort(function (x, y) { return score(y, 'loose') - score(x, 'loose'); });
      }
      if (a.temp === 'HOT') out.forEach(function (r) { if (!r.hintCode) r.hintCode = 'AS_HINT_TEMP'; });
    } else if (a.purpose === 'FIXED') {
      // Fest sitzen & Moment übertragen — Übergang bis Presssitz.
      var light = (a.hubMat === 'LIGHT'), cast = (a.hubMat === 'CAST');
      if (a.demount === 'NEVER') {
        // quasi unlösbar → Pressverband
        push('H7/s6', 'AS_R_S6', null, 'AS_HINT_PRESS');
        push('H7/r6', 'AS_R_R6', null, 'AS_HINT_PRESS');
        push('H8/u8', 'AS_R_U8', null, 'AS_HINT_SHRINK');
      } else if (a.demount === 'OFTEN') {
        // noch demontierbar → fester Übergang statt Presssitz
        push('H7/n6', 'AS_R_N6', null);
        push('H7/k6', 'AS_R_K6', null);
        push('H7/m6', 'AS_R_M6', null);
      } else {
        // selten → fester Sitz, mit Presse fügbar
        push('H7/n6', 'AS_R_N6', null);
        push('H7/p6', 'AS_R_P6', null, 'AS_HINT_PRESS');
        push('H7/s6', 'AS_R_S6', null, 'AS_HINT_PRESS');
      }
      // Werkstoff-Warnungen haben Vorrang vor Temperatur.
      if (light) out.forEach(function (r) { r.hintCode = 'AS_HINT_LIGHT_HUB'; });
      else if (cast) out.forEach(function (r) { if (!r.hintCode || r.hintCode === 'AS_HINT_PRESS') r.hintCode = 'AS_HINT_CAST_HUB'; });
    }

    return { ok: true, suggestions: out.slice(0, 3), answers: cloneAnswers(a) };
  }

  /* Grobe „Lockerheit" für die Umsortierung bei häufiger Demontage. */
  function score(rec, mode) {
    var shaft = rec.fit.split('/')[1] || '';
    var looseOrder = { h8: 5, h7: 4, h6: 3, js6: 2, k6: 1, m6: 0, n6: -1 };
    var v = looseOrder[shaft];
    if (v === undefined) v = 0;
    return mode === 'loose' ? v : -v;
  }

  function cloneAnswers(a) {
    var o = {}; for (var k in a) if (a.hasOwnProperty(k)) o[k] = a[k]; return o;
  }

  return {
    QUESTIONS: QUESTIONS,
    firstQuestion: firstQuestion,
    optionsFor: optionsFor,
    nextQuestion: nextQuestion,
    isValidAnswer: isValidAnswer,
    recommend: recommend
  };
});
