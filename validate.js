/* ============================================================================
 * DT-ProfiPassung · validate.js  (Baustein B2 — Eingabeprüfung)
 * ----------------------------------------------------------------------------
 * Reine Prüf-Logik, ohne DOM, in Node testbar. UMD. Global: DTPValidate
 * Läuft VOR solver.computeFit (Ladereihenfolge daten -> validate -> solver).
 *
 * Zweistufig (plan.md Architektur):
 *   - harte Grenzen  -> errors[]  (computeFit rechnet dann NICHT)
 *   - Warnbereiche   -> warnings[] (Rechnung läuft, UI zeigt Hinweis)
 * Alle Meldungen sind stabile CODES (String); die UI übersetzt sie dreisprachig.
 * Validate liest den Buchstaben-/Bereichsstatus direkt aus daten.js — eine
 * einzige Wahrheit, keine doppelte Tabelle.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(require('./daten.js')); }
  else { root.DTPValidate = factory(root.DTPData); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (DTPData) {
  'use strict';

  var D = DTPData;

  /* --- Meldungscodes (erweitern die daten.js-Codes) ------------------------ */
  var CODE = {
    // hart (errors):
    NOMINAL_TYPE:      'ERR_NOMINAL_TYPE',      // Nennmaß keine Zahl
    OUT_OF_RANGE:      'ERR_OUT_OF_RANGE',      // Nennmaß < 1 oder > 500 mm (V1-Tabelle)
    GRADE_TYPE:        'ERR_GRADE_TYPE',        // IT-Grad keine ganze Zahl
    GRADE_RANGE:       'ERR_GRADE_RANGE',       // IT-Grad außerhalb 1..16 (V1)
    GRADE_UNKNOWN:     'ERR_GRADE_UNKNOWN',
    LETTER_MISSING:    'ERR_LETTER_MISSING',    // Buchstabe fehlt/leer
    LETTER_UNKNOWN:    'ERR_LETTER_UNKNOWN',    // gibt es in ISO 286 nicht
    LETTER_CASE:       'ERR_LETTER_CASE',       // Bohrung braucht Groß-, Welle Kleinbuchstaben
    FD_NOT_IN_DATASET: 'FD_NOT_IN_DATASET',     // Buchstabe im V1-Datensatz nicht enthalten (cd/ef/fg)
    FD_UNDEFINED:      'FD_UNDEFINED',          // Norm sieht dieses Feld hier nicht vor
    FIT_INCOMPLETE:    'ERR_FIT_INCOMPLETE',    // Bohrung oder Welle fehlt
    // weich (warnings):
    GRADE_PAIR:        'WARN_GRADE_PAIR',       // ungewöhnliche Gradpaarung (Diff > 1)
    COARSE_FIT:        'WARN_COARSE_FIT',       // sehr grobe Toleranz (IT > 11) — Passfunktion fraglich
    UNVERIFIED:        'WARN_UNVERIFIED',       // Wert aus Erstquelle, Zweitquelle ausstehend (j/J)
    SYSTEM_MISMATCH:   'WARN_SYSTEM_MISMATCH'   // Systemwahl passt nicht zum Grundbuchstaben
  };

  /* --- Feldschema (Metadaten; UI hängt Labels/Einheiten dreisprachig an) ---- */
  var FIELDS = {
    nominal: { unit: 'mm', min: 1, max: 500, kind: 'number' },
    grade:   { min: 1, max: 16, kind: 'int' },
    letter:  { kind: 'iso286' }
  };

  function mk(code, field, extra) {
    var o = { code: code };
    if (field) o.field = field;
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }

  /* Ein Toleranzfeld (Bohrung ODER Welle) prüfen. isHole steuert die Groß-/
   * Kleinschreib-Erwartung. push* sammeln in errors/warnings. */
  function checkSpec(spec, isHole, nominal, errors, warnings, tag) {
    if (!spec || spec.letter == null || spec.letter === '') {
      errors.push(mk(CODE.LETTER_MISSING, tag)); return;
    }
    var letter = String(spec.letter);
    var grade = spec.grade;

    // Grad-Typ und -Bereich:
    if (typeof grade !== 'number' || !isFinite(grade) || Math.floor(grade) !== grade) {
      errors.push(mk(CODE.GRADE_TYPE, tag)); return;
    }
    if (grade < FIELDS.grade.min || grade > FIELDS.grade.max) {
      errors.push(mk(CODE.GRADE_RANGE, tag, { value: grade })); return;
    }

    // Groß-/Kleinschreibung passend zu Bohrung/Welle:
    var isJs = letter.toLowerCase() === 'js';
    var lower = letter.toLowerCase();
    if (!isJs) {
      var firstUpper = /^[A-Z]/.test(letter);
      if (isHole && !firstUpper) { errors.push(mk(CODE.LETTER_CASE, tag, { expected: 'upper' })); return; }
      if (!isHole && firstUpper) { errors.push(mk(CODE.LETTER_CASE, tag, { expected: 'lower' })); return; }
    }

    // Existiert der Buchstabe in ISO 286 überhaupt?
    if (!D.LETTERS_ISO[lower]) { errors.push(mk(CODE.LETTER_UNKNOWN, tag, { letter: letter })); return; }

    // Endgültige Prüfung über den echten Datenkern (fängt Bereich/Datensatz/Norm-Lücken):
    var res = isHole
      ? D.boreDeviations(nominal, letter.toUpperCase(), grade)
      : D.shaftDeviations(nominal, lower, grade);
    if (res.code) { errors.push(mk(res.code, tag, { letter: letter, grade: grade, nominal: nominal })); return; }

    // Weiche Hinweise:
    if (res.unverified) warnings.push(mk(CODE.UNVERIFIED, tag, { letter: letter, grade: grade }));
    if (grade > 11) warnings.push(mk(CODE.COARSE_FIT, tag, { grade: grade }));
  }

  /* Hauptfunktion: prüft eine vollständige Passung.
   * input = { nominal, hole:{letter,grade}, shaft:{letter,grade}, system? }
   * Rückgabe: { ok, errors:[{code,field,...}], warnings:[...] }  (mutiert input nie). */
  function validateFit(input) {
    var errors = [], warnings = [];
    if (!input || typeof input !== 'object') {
      return { ok: false, errors: [mk(CODE.FIT_INCOMPLETE)], warnings: warnings };
    }

    // Nennmaß:
    var N = input.nominal;
    if (typeof N !== 'number' || !isFinite(N)) {
      errors.push(mk(CODE.NOMINAL_TYPE, 'nominal'));
    } else if (N < FIELDS.nominal.min || N > FIELDS.nominal.max) {
      errors.push(mk(CODE.OUT_OF_RANGE, 'nominal', { value: N }));
    }

    var hasHole = input.hole && input.hole.letter != null && input.hole.letter !== '';
    var hasShaft = input.shaft && input.shaft.letter != null && input.shaft.letter !== '';
    if (!hasHole || !hasShaft) errors.push(mk(CODE.FIT_INCOMPLETE, !hasHole ? 'hole' : 'shaft'));

    // Nur weiterprüfen, wenn Nennmaß nutzbar (sonst liefert der Kern OUT_OF_RANGE doppelt):
    var nOk = typeof N === 'number' && isFinite(N) && N >= FIELDS.nominal.min && N <= FIELDS.nominal.max;
    if (nOk) {
      if (hasHole) checkSpec(input.hole, true, N, errors, warnings, 'hole');
      if (hasShaft) checkSpec(input.shaft, false, N, errors, warnings, 'shaft');
    }

    // Cross-Validation: Gradpaarung (nur wenn beide Grade sauber vorliegen):
    if (hasHole && hasShaft &&
        typeof input.hole.grade === 'number' && typeof input.shaft.grade === 'number') {
      var diff = Math.abs(input.hole.grade - input.shaft.grade);
      if (diff > 1) warnings.push(mk(CODE.GRADE_PAIR, 'shaft',
        { hole: input.hole.grade, shaft: input.shaft.grade, diff: diff }));
    }

    // Cross-Validation: Systemwahl vs. Grundbuchstabe (informativ):
    if (input.system && hasHole && hasShaft) {
      if (input.system === 'EB' && String(input.hole.letter).toUpperCase() !== 'H')
        warnings.push(mk(CODE.SYSTEM_MISMATCH, 'hole', { system: 'EB' }));
      if (input.system === 'EW' && String(input.shaft.letter).toLowerCase() !== 'h')
        warnings.push(mk(CODE.SYSTEM_MISMATCH, 'shaft', { system: 'EW' }));
    }

    return { ok: errors.length === 0, errors: errors, warnings: warnings };
  }

  return {
    VERSION: '0.1.0',
    CODE: CODE,
    FIELDS: FIELDS,
    validateFit: validateFit,
    checkSpec: checkSpec
  };
});
