/* ============================================================================
 * DT-ProfiPassung · solver.js  (Baustein B2 — Engine-Kern)
 * ----------------------------------------------------------------------------
 * Reine Rechenlogik, ohne DOM, in Node testbar. UMD. Global: DTPSolver
 * Orchestrator computeFit: validiert zuerst (DTPValidate), rechnet dann die
 * Passungskennwerte nach plan.md 1.2. Bedingte Module (Thermik, Pressverband,
 * Oberfläche, Messung, Schmierspalt) folgen in B8..B10 und hängen sich über
 * `notes` ein — der Kern bleibt schlank und stabil.
 *
 * Konvention Vorzeichen: Spiel positiv, Übermaß negativ (durchgängig in µm).
 *   PS_max = ES − ei   (Höchstspiel)
 *   PS_min = EI − es   (Mindestspiel; negativ ⇒ Übermaß)
 *   PT     = T_B + T_W = PS_max − PS_min  (Passtoleranz)
 *   Passungsart: Spiel (PS_min ≥ 0) · Übermaß (PS_max ≤ 0) · Übergang (sonst)
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./daten.js'), require('./validate.js'));
  } else {
    root.DTPSolver = factory(root.DTPData, root.DTPValidate);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (DTPData, DTPValidate) {
  'use strict';

  var D = DTPData, V = DTPValidate;

  /* =========================================================================
   * 1) Parser: "Ø50 H7/g6" · "50H7/g6" · "50,5 H7 / g6" · "50 H7/js6" ...
   *    Rückgabe: { nominal, hole:{letter,grade}|null, shaft:{letter,grade}|null,
   *               system, raw, ok, error? }.  Reiner Textparser, wirft nie.
   * =======================================================================*/
  var TOK = /^(js|JS|Js|cd|CD|ef|EF|fg|FG|z[abc]|Z[ABC]|[A-Za-z])\s*(\d{1,2})$/;

  function parseSpec(tok) {
    if (tok == null) return null;
    var m = String(tok).trim().match(TOK);
    if (!m) return { error: true };
    return { letter: m[1], grade: parseInt(m[2], 10) };
  }

  function parseFit(str) {
    var out = { nominal: null, hole: null, shaft: null, system: null, raw: String(str == null ? '' : str), ok: false };
    if (str == null) { out.error = 'ERR_PARSE_EMPTY'; return out; }
    var s = String(str).trim().replace(/^[Ø⌀\s]+/, '');
    // Nennmaß am Anfang (Komma oder Punkt als Dezimaltrenner):
    var mN = s.match(/^([0-9]+(?:[.,][0-9]+)?)\s*/);
    if (!mN) { out.error = 'ERR_PARSE_NOMINAL'; return out; }
    out.nominal = parseFloat(mN[1].replace(',', '.'));
    var rest = s.slice(mN[0].length).trim();
    if (rest === '') { out.error = 'ERR_PARSE_NO_FIELDS'; return out; }

    // Ein oder zwei Toleranzfelder, getrennt durch '/':
    var parts = rest.split('/').map(function (p) { return p.trim(); }).filter(function (p) { return p !== ''; });
    var specs = parts.map(parseSpec);
    if (specs.some(function (sp) { return sp && sp.error; })) { out.error = 'ERR_PARSE_FIELD'; return out; }

    if (specs.length === 2) {
      // Reihenfolge nach Groß-/Kleinschreibung sortieren (Bohrung = groß):
      specs.forEach(function (sp) {
        var up = /^[A-Z]/.test(sp.letter) && sp.letter.toLowerCase() !== 'js' ? true
               : (sp.letter === 'JS' || sp.letter === 'Js');
        if (up) out.hole = sp; else out.shaft = sp;
      });
      // Falls beide gleich groß/klein geschrieben: erste = Bohrung, zweite = Welle (Rohreihenfolge).
      if (!out.hole || !out.shaft) { out.hole = specs[0]; out.shaft = specs[1]; }
    } else if (specs.length === 1) {
      var sp = specs[0];
      var up = (/^[A-Z]/.test(sp.letter) && sp.letter.toLowerCase() !== 'js') || sp.letter === 'JS' || sp.letter === 'Js';
      if (up) out.hole = sp; else out.shaft = sp;
    } else {
      out.error = 'ERR_PARSE_FIELD'; return out;
    }

    // System herleiten (informativ):
    if (out.hole && String(out.hole.letter).toUpperCase() === 'H') out.system = 'EB';
    else if (out.shaft && String(out.shaft.letter).toLowerCase() === 'h') out.system = 'EW';

    out.ok = !!(out.hole && out.shaft);
    return out;
  }

  /* Kanonische Kurzform für Roundtrip/Anzeige/Copy. numFmt: '.' (intern) | ',' (Anzeige) */
  function formatFit(fit, numFmt) {
    var n = fit.nominal;
    var nStr = Number.isInteger(n) ? String(n) : String(n);
    if (numFmt === ',') nStr = nStr.replace('.', ',');
    var h = fit.hole ? fit.hole.letter + fit.hole.grade : '';
    var s = fit.shaft ? fit.shaft.letter + fit.shaft.grade : '';
    return nStr + ' ' + h + '/' + s;
  }

  /* =========================================================================
   * 2) Grenzmaße/Abmaße eines Toleranzfelds einsammeln (aus daten.js).
   *    Rückgabe µm-Abmaße (ganzzahlig) + mm-Grenzmaße (auf µm gerundet).
   * =======================================================================*/
  function round3(x) { return Math.round(x * 1000) / 1000; }

  function fieldOf(nominal, letter, grade, isHole) {
    var dev = isHole
      ? D.boreDeviations(nominal, String(letter).toUpperCase(), grade)
      : D.shaftDeviations(nominal, String(letter).toLowerCase(), grade);
    if (dev.code) return { code: dev.code };
    var upper = isHole ? dev.ES : dev.es;   // oberes Abmaß [µm]
    var lower = isHole ? dev.EI : dev.ei;   // unteres Abmaß [µm]
    return {
      letter: letter, grade: grade,
      upper: upper, lower: lower,
      T: upper - lower,                     // Toleranz [µm]
      Go: round3(nominal + upper / 1000),   // Höchstmaß [mm]
      Gu: round3(nominal + lower / 1000),   // Mindestmaß [mm]
      symmetric: !!dev.symmetric,
      unverified: !!dev.unverified
    };
  }

  /* =========================================================================
   * 3) Passungsart bestimmen (Trichotomie + heuristische Feinstufe).
   *    Feinstufen-Schwellen sind Richtwerte (µm); die Norm kennt hier keine
   *    festen Grenzen — sie werden in B11 mit der Empfehlungsmatrix geschärft.
   * =======================================================================*/
  function classify(PSmax, PSmin) {
    if (PSmin >= 0) {
      // Spielpassung:
      var fein = PSmin === 0 ? 'SPIEL_NULL'      // Mindestspiel = 0 (Schiebe-/Haftgrenze)
               : PSmin <= 10 ? 'SPIEL_GLEIT'     // enger Gleitsitz
               : PSmin <= 40 ? 'SPIEL_LAUF'      // Laufsitz
               : 'SPIEL_WEIT';                   // weiter Laufsitz
      return { art: 'SPIEL', artFein: fein };
    }
    if (PSmax <= 0) {
      // Übermaßpassung (Größtübermaß = −PSmin):
      var U = -PSmin;
      var feinU = U <= 20 ? 'PRESS_LEICHT'
                : U <= 60 ? 'PRESS_MITTEL'
                : 'PRESS_SCHWER';
      return { art: 'UEBERMASS', artFein: feinU };
    }
    // Übergangspassung (kann Spiel ODER Übermaß ergeben):
    var feinT = (PSmax >= -PSmin) ? 'UEBERGANG_SPIEL' : 'UEBERGANG_PRESS'; // Schwerpunkt
    return { art: 'UEBERGANG', artFein: feinT };
  }

  /* =========================================================================
   * 4) computeFit — Orchestrator. Validiert zuerst, rechnet dann.
   *    Akzeptiert Objekt ODER String (dann intern geparst). Mutiert input NIE.
   * =======================================================================*/
  function normalizeInput(input) {
    if (typeof input === 'string') {
      var p = parseFit(input);
      return { nominal: p.nominal, hole: p.hole, shaft: p.shaft, system: p.system, _parse: p };
    }
    // tiefe, entkoppelte Kopie der relevanten Felder (Unversehrtheit des Originals):
    return {
      nominal: input && typeof input.nominal === 'number' ? input.nominal : input && input.nominal,
      hole: input && input.hole ? { letter: input.hole.letter, grade: input.hole.grade } : null,
      shaft: input && input.shaft ? { letter: input.shaft.letter, grade: input.shaft.grade } : null,
      system: input && input.system ? input.system : null
    };
  }

  function computeFit(input) {
    var inp = normalizeInput(input);

    // Parser-Fehler früh und klar melden:
    if (inp._parse && inp._parse.error) {
      return { ok: false, errors: [{ code: inp._parse.error, field: 'raw' }], warnings: [], input: publicInput(inp) };
    }

    var v = V.validateFit(inp);
    if (!v.ok) {
      return { ok: false, errors: v.errors, warnings: v.warnings, input: publicInput(inp) };
    }

    var N = inp.nominal;
    var hole = fieldOf(N, inp.hole.letter, inp.hole.grade, true);
    var shaft = fieldOf(N, inp.shaft.letter, inp.shaft.grade, false);
    // Sollte durch validate abgedeckt sein — als Gürtel-und-Hosenträger dennoch prüfen:
    if (hole.code || shaft.code) {
      return { ok: false, errors: [{ code: hole.code || shaft.code }], warnings: v.warnings, input: publicInput(inp) };
    }

    var PSmax = hole.upper - shaft.lower;   // ES − ei
    var PSmin = hole.lower - shaft.upper;   // EI − es
    var PT = hole.T + shaft.T;
    var cls = classify(PSmax, PSmin);

    var fit = {
      PSmax: PSmax, PSmin: PSmin, PT: PT,
      art: cls.art, artFein: cls.artFein,
      // bequeme, vorzeichenrichtige Zusatzwerte:
      clearanceMax: Math.max(0, PSmax),
      clearanceMin: Math.max(0, PSmin),
      interferenceMax: Math.max(0, -PSmin),   // Größtübermaß
      interferenceMin: Math.max(0, -PSmax)    // Kleinstübermaß
    };

    var notes = [];
    if (hole.unverified) notes.push({ code: V.CODE.UNVERIFIED, field: 'hole' });
    if (shaft.unverified) notes.push({ code: V.CODE.UNVERIFIED, field: 'shaft' });

    return {
      ok: true,
      input: publicInput(inp),
      system: inp.system || (String(inp.hole.letter).toUpperCase() === 'H' ? 'EB'
              : String(inp.shaft.letter).toLowerCase() === 'h' ? 'EW' : null),
      hole: hole, shaft: shaft, fit: fit,
      warnings: v.warnings, notes: notes
    };
  }

  function publicInput(inp) {
    return {
      nominal: inp.nominal,
      hole: inp.hole ? { letter: inp.hole.letter, grade: inp.hole.grade } : null,
      shaft: inp.shaft ? { letter: inp.shaft.letter, grade: inp.shaft.grade } : null,
      system: inp.system || null
    };
  }

  /* Convenience: direkt aus Text rechnen. */
  function solveString(str) { return computeFit(str); }

  /* =========================================================================
   * 5) describe — deutscher Klartext (für Copy/Harness; UI nutzt i18n-Codes).
   * =======================================================================*/
  var ART_TEXT = { SPIEL: 'Spielpassung', UEBERGANG: 'Übergangspassung', UEBERMASS: 'Übermaßpassung' };
  function mm(x) { return x.toFixed(3).replace('.', ','); }

  function describe(res) {
    if (!res || !res.ok) return '—';
    var f = res.fit, i = res.input;
    var head = 'Ø' + (Number.isInteger(i.nominal) ? i.nominal : mm(i.nominal)) + ' ' +
               i.hole.letter + i.hole.grade + '/' + i.shaft.letter + i.shaft.grade;
    var sizes = 'Bohrung ' + mm(res.hole.Gu) + '…' + mm(res.hole.Go) +
                ' · Welle ' + mm(res.shaft.Gu) + '…' + mm(res.shaft.Go);
    var kv;
    if (f.art === 'SPIEL') kv = 'Spiel ' + f.PSmin + '…' + f.PSmax + ' µm (' + ART_TEXT.SPIEL + ')';
    else if (f.art === 'UEBERMASS') kv = 'Übermaß ' + f.interferenceMin + '…' + f.interferenceMax + ' µm (' + ART_TEXT.UEBERMASS + ')';
    else kv = 'Übergang: max. Spiel ' + f.PSmax + ' µm / max. Übermaß ' + f.interferenceMax + ' µm (' + ART_TEXT.UEBERGANG + ')';
    return head + ' — ' + sizes + ' · ' + kv;
  }

  /* =========================================================================
   * 6) Presets (Startsatz; wandert in B11/B16 vollständig nach daten.js/MAT).
   *    Für B2 genügen die ersten drei Empfehlungszeilen zum Durchrechnen.
   * =======================================================================*/
  var PRESETS = [
    { id: 'gleitlager_f7', fit: '25 H7/f7', expect: 'SPIEL' },
    { id: 'fuehrung_g6',   fit: '25 H7/g6', expect: 'SPIEL' },
    { id: 'schiebe_h6',    fit: '25 H7/h6', expect: 'SPIEL' }
  ];

  return {
    VERSION: '0.1.0',
    parseFit: parseFit,
    parseSpec: parseSpec,
    formatFit: formatFit,
    fieldOf: fieldOf,
    classify: classify,
    computeFit: computeFit,
    solveString: solveString,
    describe: describe,
    PRESETS: PRESETS
  };
});
