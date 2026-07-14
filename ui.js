/* ============================================================================
 * DT-ProfiPassung · ui.js  (Baustein B3 — UI-Basis)
 * ----------------------------------------------------------------------------
 * Formular „Passung" + Ergebnis-Kacheln, verdrahtet mit DTPSolver.computeFit.
 * Dreisprachig (DE/EN/PT), Theme dunkel/hell, alles offline, Handy zuerst.
 * KEINE ES-Imports — klassisches Skript; Ladereihenfolge daten->validate->solver->ui.
 * Noch NICHT hier (spätere Bausteine): Parser-Feld (B4), Toleranzfeld-Grafik (B5),
 * Rechenweg (B6), Ausgaben/.dtp (B14), Registrierung (B15).
 * ==========================================================================*/
(function () {
  'use strict';

  var D = window.DTPData, V = window.DTPValidate, S = window.DTPSolver;

  /* ======================================================================= *
   * 1) i18n — Bedien- und Ergebnistexte
   * ======================================================================= */
  var STR = {
    de: {
      tagline: 'Toleranzen & Passungen nach ISO 286',
      loadExample: 'Beispiel laden', examplePick: '— Beispiel wählen —',
      calc: 'Berechnen', reset: 'Leeren',
      inputTitle: 'Eingabe', resultTitle: 'Ergebnis', vizTitle: 'Toleranzfeld',
      vizSoon: 'Toleranzfeld-Grafik', vizSoon2: 'Die maßstäbliche Live-Zeichnung folgt im nächsten Schritt.',
      resultIdle: 'Werte eingeben — das Ergebnis erscheint sofort.',
      themeTitle: 'Hell / Dunkel', infoTitle: 'Info',
      editionFull: 'Vollversion', editionTest: 'Testversion',
      footNote: 'Engine v0.1.0 · Berechnung ohne Gewähr, vor Produktivnutzung gegen die Originalnorm prüfen.',
      /* Formular */
      fNominal: 'Nennmaß', fSystem: 'Passsystem', fHole: 'Bohrung', fShaft: 'Welle',
      fLetter: 'Grundabmaß', fGrade: 'IT-Grad',
      sysEB: 'Einheitsbohrung (H)', sysEW: 'Einheitswelle (h)', sysFree: 'frei',
      hintNominal: 'Durchmesser bzw. Nennmaß, 1–500 mm.',
      hintSystem: 'Einheitsbohrung ist der Standard (Bohrung = H).',
      /* Ergebnis */
      rArt: 'Passungsart', rFitTol: 'Passtoleranz',
      rClearMax: 'Höchstspiel', rClearMin: 'Mindestspiel',
      rInterMax: 'Größtübermaß', rInterMin: 'Kleinstübermaß',
      rPlayMax: 'Größtspiel',
      rUpperDev: 'oberes Abmaß', rLowerDev: 'unteres Abmaß',
      rMaxSize: 'Höchstmaß', rMinSize: 'Mindestmaß', rTol: 'Toleranz',
      artSPIEL: 'Spielpassung', artUEBERGANG: 'Übergangspassung', artUEBERMASS: 'Übermaßpassung',
      artSPIEL_note: 'Die Welle ist immer kleiner als die Bohrung — es bleibt stets ein Spalt.',
      artUEBERGANG_note: 'Je nach Istmaß entsteht ein kleines Spiel oder ein leichtes Übermaß.',
      artUEBERMASS_note: 'Die Welle ist immer größer als die Bohrung — fester Sitz, Presskraft nötig.',
      feinSPIEL_NULL: 'Schiebesitz (Mindestspiel null)', feinSPIEL_GLEIT: 'enger Gleitsitz',
      feinSPIEL_LAUF: 'Laufsitz', feinSPIEL_WEIT: 'weiter Laufsitz',
      feinPRESS_LEICHT: 'leichter Presssitz', feinPRESS_MITTEL: 'mittlerer Presssitz', feinPRESS_SCHWER: 'schwerer Presssitz',
      feinUEBERGANG_SPIEL: 'überwiegend Spiel', feinUEBERGANG_PRESS: 'überwiegend Übermaß',
      unit_um: 'µm', unit_mm: 'mm'
    },
    en: {
      tagline: 'Tolerances & fits to ISO 286',
      loadExample: 'Load example', examplePick: '— choose example —',
      calc: 'Calculate', reset: 'Clear',
      inputTitle: 'Input', resultTitle: 'Result', vizTitle: 'Tolerance zone',
      vizSoon: 'Tolerance-zone graphic', vizSoon2: 'The scaled live drawing follows in the next step.',
      resultIdle: 'Enter values — the result appears instantly.',
      themeTitle: 'Light / Dark', infoTitle: 'Info',
      editionFull: 'Full version', editionTest: 'Test version',
      footNote: 'Engine v0.1.0 · Results without warranty; verify against the original standard before production use.',
      fNominal: 'Nominal size', fSystem: 'Fit system', fHole: 'Hole', fShaft: 'Shaft',
      fLetter: 'Fundamental deviation', fGrade: 'IT grade',
      sysEB: 'Basic hole (H)', sysEW: 'Basic shaft (h)', sysFree: 'free',
      hintNominal: 'Diameter or nominal size, 1–500 mm.',
      hintSystem: 'Basic-hole system is the default (hole = H).',
      rArt: 'Type of fit', rFitTol: 'Fit tolerance',
      rClearMax: 'Maximum clearance', rClearMin: 'Minimum clearance',
      rInterMax: 'Maximum interference', rInterMin: 'Minimum interference',
      rPlayMax: 'Maximum clearance',
      rUpperDev: 'upper deviation', rLowerDev: 'lower deviation',
      rMaxSize: 'Maximum size', rMinSize: 'Minimum size', rTol: 'Tolerance',
      artSPIEL: 'Clearance fit', artUEBERGANG: 'Transition fit', artUEBERMASS: 'Interference fit',
      artSPIEL_note: 'The shaft is always smaller than the hole — a gap always remains.',
      artUEBERGANG_note: 'Depending on the actual sizes, a small clearance or slight interference results.',
      artUEBERMASS_note: 'The shaft is always larger than the hole — firm seat, pressing force required.',
      feinSPIEL_NULL: 'Sliding fit (zero minimum clearance)', feinSPIEL_GLEIT: 'close sliding fit',
      feinSPIEL_LAUF: 'running fit', feinSPIEL_WEIT: 'loose running fit',
      feinPRESS_LEICHT: 'light press fit', feinPRESS_MITTEL: 'medium press fit', feinPRESS_SCHWER: 'heavy press fit',
      feinUEBERGANG_SPIEL: 'mostly clearance', feinUEBERGANG_PRESS: 'mostly interference',
      unit_um: 'µm', unit_mm: 'mm'
    },
    pt: {
      tagline: 'Tolerâncias e ajustes conforme ISO 286',
      loadExample: 'Carregar exemplo', examplePick: '— escolher exemplo —',
      calc: 'Calcular', reset: 'Limpar',
      inputTitle: 'Entrada', resultTitle: 'Resultado', vizTitle: 'Campo de tolerância',
      vizSoon: 'Gráfico do campo de tolerância', vizSoon2: 'O desenho ao vivo em escala vem no próximo passo.',
      resultIdle: 'Insira os valores — o resultado aparece na hora.',
      themeTitle: 'Claro / Escuro', infoTitle: 'Info',
      editionFull: 'Versão completa', editionTest: 'Versão de teste',
      footNote: 'Motor v0.1.0 · Resultados sem garantia; verifique com a norma original antes do uso em produção.',
      fNominal: 'Dimensão nominal', fSystem: 'Sistema de ajuste', fHole: 'Furo', fShaft: 'Eixo',
      fLetter: 'Desvio fundamental', fGrade: 'Grau IT',
      sysEB: 'Furo-base (H)', sysEW: 'Eixo-base (h)', sysFree: 'livre',
      hintNominal: 'Diâmetro ou dimensão nominal, 1–500 mm.',
      hintSystem: 'O sistema furo-base é o padrão (furo = H).',
      rArt: 'Tipo de ajuste', rFitTol: 'Tolerância do ajuste',
      rClearMax: 'Folga máxima', rClearMin: 'Folga mínima',
      rInterMax: 'Interferência máxima', rInterMin: 'Interferência mínima',
      rPlayMax: 'Folga máxima',
      rUpperDev: 'desvio superior', rLowerDev: 'desvio inferior',
      rMaxSize: 'Dimensão máxima', rMinSize: 'Dimensão mínima', rTol: 'Tolerância',
      artSPIEL: 'Ajuste com folga', artUEBERGANG: 'Ajuste incerto', artUEBERMASS: 'Ajuste com interferência',
      artSPIEL_note: 'O eixo é sempre menor que o furo — sempre resta uma folga.',
      artUEBERGANG_note: 'Conforme as dimensões reais, resulta pequena folga ou leve interferência.',
      artUEBERMASS_note: 'O eixo é sempre maior que o furo — encaixe firme, força de prensagem necessária.',
      feinSPIEL_NULL: 'Ajuste deslizante (folga mínima zero)', feinSPIEL_GLEIT: 'ajuste deslizante justo',
      feinSPIEL_LAUF: 'ajuste rotativo', feinSPIEL_WEIT: 'ajuste rotativo folgado',
      feinPRESS_LEICHT: 'interferência leve', feinPRESS_MITTEL: 'interferência média', feinPRESS_SCHWER: 'interferência forte',
      feinUEBERGANG_SPIEL: 'predominância de folga', feinUEBERGANG_PRESS: 'predominância de interferência',
      unit_um: 'µm', unit_mm: 'mm'
    }
  };

  /* Meldungstexte zu den Prüf-/Hinweis-Codes (Platzhalter {n}=Nennmaß, {l}=Buchstabe, {g}=Grad). */
  var MSG = {
    ERR_NOMINAL_TYPE:   { de: 'Nennmaß muss eine Zahl sein.', en: 'Nominal size must be a number.', pt: 'A dimensão nominal deve ser um número.' },
    ERR_OUT_OF_RANGE:   { de: 'Nennmaß außerhalb 1–500 mm.', en: 'Nominal size outside 1–500 mm.', pt: 'Dimensão nominal fora de 1–500 mm.' },
    ERR_GRADE_TYPE:     { de: 'IT-Grad muss ganzzahlig sein.', en: 'IT grade must be an integer.', pt: 'O grau IT deve ser inteiro.' },
    ERR_GRADE_RANGE:    { de: 'IT-Grad außerhalb IT1–IT16.', en: 'IT grade outside IT1–IT16.', pt: 'Grau IT fora de IT1–IT16.' },
    ERR_GRADE_UNKNOWN:  { de: 'IT-Grad unbekannt.', en: 'IT grade unknown.', pt: 'Grau IT desconhecido.' },
    ERR_LETTER_MISSING: { de: 'Grundabmaß fehlt.', en: 'Fundamental deviation missing.', pt: 'Falta o desvio fundamental.' },
    ERR_LETTER_UNKNOWN: { de: 'Buchstabe „{letter}" gibt es in ISO 286 nicht.', en: 'Letter “{letter}” does not exist in ISO 286.', pt: 'A letra “{letter}” não existe na ISO 286.' },
    ERR_LETTER_CASE:    { de: 'Bohrung braucht Groß-, Welle Kleinbuchstaben.', en: 'Hole needs upper-case, shaft lower-case letters.', pt: 'Furo exige maiúsculas; eixo, minúsculas.' },
    FD_NOT_IN_DATASET:  { de: 'Buchstabe „{letter}" ist in dieser Version nicht enthalten.', en: 'Letter “{letter}” is not included in this version.', pt: 'A letra “{letter}” não está incluída nesta versão.' },
    FD_UNDEFINED:       { de: 'Für „{letter}{grade}" bei Ø{nominal} mm sieht die Norm kein Feld vor.', en: 'The standard defines no field for “{letter}{grade}” at Ø{nominal} mm.', pt: 'A norma não define campo para “{letter}{grade}” em Ø{nominal} mm.' },
    ERR_FIT_INCOMPLETE: { de: 'Bohrung und Welle angeben.', en: 'Specify both hole and shaft.', pt: 'Especifique furo e eixo.' },
    WARN_GRADE_PAIR:    { de: 'Ungewöhnliche Gradpaarung (Bohrung IT{hole}, Welle IT{shaft}).', en: 'Unusual grade pairing (hole IT{hole}, shaft IT{shaft}).', pt: 'Combinação de graus incomum (furo IT{hole}, eixo IT{shaft}).' },
    WARN_COARSE_FIT:    { de: 'Sehr grobe Toleranz (IT{grade}) — Passfunktion fraglich.', en: 'Very coarse tolerance (IT{grade}) — fit function doubtful.', pt: 'Tolerância muito grosseira (IT{grade}) — função de ajuste duvidosa.' },
    WARN_UNVERIFIED:    { de: 'Wert aus Erstquelle — Zweitquelle noch offen (j/J).', en: 'Value from primary source — second source pending (j/J).', pt: 'Valor de fonte primária — segunda fonte pendente (j/J).' },
    WARN_SYSTEM_MISMATCH: { de: 'Passsystem passt nicht zum Grundbuchstaben.', en: 'Fit system does not match the basic letter.', pt: 'O sistema de ajuste não corresponde à letra básica.' }
  };

  /* --- B4-Ergänzungen: Parser-Feld, Parser-Fehler, Erklär-Sprechblasen ------ */
  (function () {
    var s = {
      de: {
        fFit: 'Kurzeingabe', fFitPh: 'z. B. Ø50 H7/g6', fFitHint: 'Passung direkt eintippen — Felder unten folgen automatisch.',
        help_rClearMax: 'Größtes Spiel: lockerster Fall (Bohrung max, Welle min).',
        help_rClearMin: 'Kleinstes Spiel: engster Fall — bleibt bei Spielpassung > 0.',
        help_rInterMax: 'Größtes Übermaß: fester Fall (Welle max, Bohrung min).',
        help_rInterMin: 'Kleinstes Übermaß: schwächster Presssitz-Fall.',
        help_rPlayMax: 'Größtes mögliches Spiel dieser Übergangspassung.',
        help_rFitTol: 'Passtoleranz = Summe beider IT-Toleranzen (Bohrung + Welle).'
      },
      en: {
        fFit: 'Quick entry', fFitPh: 'e.g. Ø50 H7/g6', fFitHint: 'Type the fit directly — the fields below follow automatically.',
        help_rClearMax: 'Largest clearance: loosest case (hole max, shaft min).',
        help_rClearMin: 'Smallest clearance: tightest case — stays > 0 for a clearance fit.',
        help_rInterMax: 'Largest interference: tightest case (shaft max, hole min).',
        help_rInterMin: 'Smallest interference: weakest press-fit case.',
        help_rPlayMax: 'Largest possible clearance of this transition fit.',
        help_rFitTol: 'Fit tolerance = sum of both IT tolerances (hole + shaft).'
      },
      pt: {
        fFit: 'Entrada rápida', fFitPh: 'ex. Ø50 H7/g6', fFitHint: 'Digite o ajuste direto — os campos abaixo seguem automaticamente.',
        help_rClearMax: 'Maior folga: caso mais frouxo (furo máx., eixo mín.).',
        help_rClearMin: 'Menor folga: caso mais justo — permanece > 0 no ajuste com folga.',
        help_rInterMax: 'Maior interferência: caso mais justo (eixo máx., furo mín.).',
        help_rInterMin: 'Menor interferência: caso de prensagem mais fraco.',
        help_rPlayMax: 'Maior folga possível deste ajuste incerto.',
        help_rFitTol: 'Tolerância do ajuste = soma das duas tolerâncias IT (furo + eixo).'
      }
    };
    var m = {
      ERR_PARSE_EMPTY:    { de: 'Bitte eine Passung eingeben.', en: 'Please enter a fit.', pt: 'Insira um ajuste.' },
      ERR_PARSE_NOMINAL:  { de: 'Nennmaß am Anfang fehlt (z. B. „50 …").', en: 'Nominal size at the start is missing (e.g. “50 …”).', pt: 'Falta a dimensão nominal no início (ex. “50 …”).' },
      ERR_PARSE_NO_FIELDS:{ de: 'Toleranzfeld fehlt (z. B. „H7/g6").', en: 'Tolerance field missing (e.g. “H7/g6”).', pt: 'Falta o campo de tolerância (ex. “H7/g6”).' },
      ERR_PARSE_FIELD:    { de: 'Toleranzfeld nicht lesbar — Format „H7/g6".', en: 'Tolerance field unreadable — format “H7/g6”.', pt: 'Campo de tolerância ilegível — formato “H7/g6”.' }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
    for (var c in m) MSG[c] = m[c];
  })();

  /* --- B5-Ergänzungen: Toleranzfeld-Grafik (Legende + Erklärchips) --------- */
  (function () {
    var s = {
      de: {
        vizLegend: 'Legende', vizZero: 'Nulllinie = Nennmaß',
        vizBore: 'Bohrung', vizShaft: 'Welle',
        vizBoreHelp: 'Grün = Bohrung. Der Balken zeigt das Toleranzfeld über/an der Nulllinie.',
        vizShaftHelp: 'Blau = Welle. Liegt das Feld unter der Bohrung, entsteht Spiel; darüber Übermaß.',
        vizFitHelp: 'Lage der beiden Felder zueinander ergibt die Passungsart.',
        vizPlaceholder: 'Grafik erscheint nach gültiger Eingabe.'
      },
      en: {
        vizLegend: 'Legend', vizZero: 'Zero line = nominal size',
        vizBore: 'Hole', vizShaft: 'Shaft',
        vizBoreHelp: 'Green = hole. The bar shows the tolerance zone above/at the zero line.',
        vizShaftHelp: 'Blue = shaft. Below the hole gives clearance; above it gives interference.',
        vizFitHelp: 'The relative position of both zones gives the type of fit.',
        vizPlaceholder: 'The graphic appears after a valid entry.'
      },
      pt: {
        vizLegend: 'Legenda', vizZero: 'Linha zero = dimensão nominal',
        vizBore: 'Furo', vizShaft: 'Eixo',
        vizBoreHelp: 'Verde = furo. A barra mostra o campo de tolerância acima/na linha zero.',
        vizShaftHelp: 'Azul = eixo. Abaixo do furo gera folga; acima, interferência.',
        vizFitHelp: 'A posição relativa dos dois campos define o tipo de ajuste.',
        vizPlaceholder: 'O gráfico aparece após uma entrada válida.'
      }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* --- B6-Ergänzungen: Rechenweg (Panel + Schritt-Titel) ------------------- */
  (function () {
    var s = {
      de: {
        rwHeading: 'Rechenweg', rwAllOk: 'alle Schritte geprüft', rwFail: 'Prüfung fehlgeschlagen',
        rwTitleIT: 'IT-Grundtoleranzen', rwTitleDevBore: 'Grenzabmaße Bohrung', rwTitleDevShaft: 'Grenzabmaße Welle',
        rwTitleLimBore: 'Grenzmaße Bohrung', rwTitleLimShaft: 'Grenzmaße Welle',
        rwClearMax: 'Höchstspiel', rwClearMin: 'Mindestspiel', rwFitTol: 'Passtoleranz', rwArt: 'Passungsart'
      },
      en: {
        rwHeading: 'Calculation', rwAllOk: 'all steps verified', rwFail: 'verification failed',
        rwTitleIT: 'Fundamental tolerances', rwTitleDevBore: 'Limit deviations, hole', rwTitleDevShaft: 'Limit deviations, shaft',
        rwTitleLimBore: 'Limits, hole', rwTitleLimShaft: 'Limits, shaft',
        rwClearMax: 'Maximum clearance', rwClearMin: 'Minimum clearance', rwFitTol: 'Fit tolerance', rwArt: 'Type of fit'
      },
      pt: {
        rwHeading: 'Cálculo', rwAllOk: 'todos os passos verificados', rwFail: 'verificação falhou',
        rwTitleIT: 'Tolerâncias fundamentais', rwTitleDevBore: 'Desvios-limite, furo', rwTitleDevShaft: 'Desvios-limite, eixo',
        rwTitleLimBore: 'Dimensões-limite, furo', rwTitleLimShaft: 'Dimensões-limite, eixo',
        rwClearMax: 'Folga máxima', rwClearMin: 'Folga mínima', rwFitTol: 'Tolerância do ajuste', rwArt: 'Tipo de ajuste'
      }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* --- B6.1: Hinweis bei unvollständiger Eingabe --------------------------- */
  (function () {
    var s = {
      de: { hintIncomplete: 'Bitte ausfüllen:' },
      en: { hintIncomplete: 'Please complete:' },
      pt: { hintIncomplete: 'Preencha:' }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* ======================================================================= *
   * 2) Zustand + kleine Helfer
   * ======================================================================= */
  var lang = localStorage.getItem('dtp-lang') || 'de';
  var edition = (window.DT_EDITION === 'test') ? 'test' : 'full';

  // Auffindbarkeit der ⓘ-Sprechblasen: einmaliger, begrenzter Puls; endet dauerhaft,
  // sobald der Nutzer erstmals eine Sprechblase antippt (in localStorage gemerkt).
  var tipsSeen = localStorage.getItem('dtp-tips-seen') === '1';
  var pulseDone = false;   // Puls nur bei der ersten Ergebnis-Anzeige je Sitzung
  var armPulse = false;    // wird pro Render gesetzt
  function markTipsSeen() {
    if (tipsSeen) return;
    tipsSeen = true;
    try { localStorage.setItem('dtp-tips-seen', '1'); } catch (e) {}
    var qs = document.querySelectorAll('.sc-q.pulse');
    qs.forEach(function (q) { q.classList.remove('pulse'); });
  }

  function t(k) { return (STR[lang] && STR[lang][k]) || STR.de[k] || k; }
  function interp(s, vars) { return s.replace(/\{(\w+)\}/g, function (_, k) { return (vars && vars[k] != null) ? vars[k] : '{' + k + '}'; }); }
  function msgOf(entry) {
    var m = MSG[entry.code];
    var base = m ? (m[lang] || m.de) : entry.code;
    return interp(base, entry);
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function decComma(s) { return lang === 'en' ? s : s.replace('.', ','); }
  function fmtMm(x) { return decComma(Number(x).toFixed(3)); }
  function fmtUm(x) { return decComma(Number.isInteger(x) ? String(x) : Number(x).toFixed(1)); }
  function sgn(x) { return (x > 0 ? '+' : '') + fmtUm(x); }

  /* ======================================================================= *
   * 3) Buchstaben-/Grad-Listen (häufige zuerst)
   * ======================================================================= */
  var HOLE_LETTERS  = ['H', 'G', 'F', 'E', 'JS', 'J', 'D', 'C', 'B', 'A', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', 'ZA', 'ZB', 'ZC'];
  var SHAFT_LETTERS = ['h', 'g', 'f', 'e', 'js', 'j', 'd', 'c', 'b', 'a', 'k', 'm', 'n', 'p', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z', 'za', 'zb', 'zc'];
  var GRADES = []; for (var gi = 1; gi <= 16; gi++) GRADES.push(gi);

  /* ======================================================================= *
   * 4) Formular aufbauen
   * ======================================================================= */
  var host, resultHost, vizHost;
  var elNominal, elSystem, elHoleL, elHoleG, elShaftL, elShaftG, elFit, elFitMsg;

  function selectFrom(list, mapLabel, placeholder) {
    var sel = el('select');
    if (placeholder) { var ph = el('option', null, '—'); ph.value = ''; sel.appendChild(ph); }
    list.forEach(function (v) {
      var o = el('option', null, mapLabel ? mapLabel(v) : String(v));
      o.value = String(v);
      sel.appendChild(o);
    });
    return sel;
  }

  function labeledField(labelKey, unitKey, control, hintKey) {
    var f = el('div', 'field');
    var lab = el('div', 'field-label');
    var lb = el('label'); lb.setAttribute('data-i18n', labelKey); lb.textContent = t(labelKey);
    lab.appendChild(lb);
    if (unitKey) { var u = el('span', 'unit'); u.setAttribute('data-i18n', unitKey); u.textContent = t(unitKey); lab.appendChild(u); }
    f.appendChild(lab);
    f.appendChild(control);
    if (hintKey) { var h = el('div', 'field-hint'); h.setAttribute('data-i18n', hintKey); h.textContent = t(hintKey); f.appendChild(h); }
    return f;
  }

  function pairControl(letterSel, gradeSel) {
    var row = el('div'); row.style.cssText = 'display:flex;gap:8px';
    letterSel.style.flex = '1 1 60%'; gradeSel.style.flex = '1 1 40%';
    row.appendChild(letterSel); row.appendChild(gradeSel);
    return row;
  }

  function buildForm() {
    host.textContent = '';

    // Kurzeingabe (Parser): „Ø50 H7/g6" direkt tippen
    elFit = el('input'); elFit.type = 'text'; elFit.className = 'num fit-input';
    elFit.setAttribute('autocapitalize', 'characters'); elFit.setAttribute('spellcheck', 'false');
    elFit.setAttribute('data-i18n-ph', 'fFitPh'); elFit.placeholder = t('fFitPh');
    var gf = el('div', 'group-fields');
    var ff = labeledField('fFit', null, elFit, 'fFitHint');
    elFitMsg = el('div', 'field-msg error'); elFitMsg.hidden = true; ff.appendChild(elFitMsg);
    gf.appendChild(ff);
    host.appendChild(gf);
    elFit.addEventListener('input', onFitInput);

    // Nennmaß + System
    elNominal = el('input'); elNominal.type = 'number'; elNominal.className = 'num';
    elNominal.min = '1'; elNominal.max = '500'; elNominal.step = 'any'; elNominal.value = '50';
    elSystem = selectFrom(['EB', 'EW', 'FREE'], function (v) { return v === 'EB' ? t('sysEB') : v === 'EW' ? t('sysEW') : t('sysFree'); });

    var g1 = el('div', 'group-fields');
    g1.appendChild(labeledField('fNominal', 'unit_mm', elNominal, 'hintNominal'));
    g1.appendChild(labeledField('fSystem', null, elSystem, 'hintSystem'));
    host.appendChild(g1);

    // Bohrung/Welle-Legende
    var leg = el('div', 'tf-legend');
    var d1 = el('span', 'dot bore'); var s1 = el('span', null, t('fHole')); s1.setAttribute('data-i18n', 'fHole'); d1.appendChild(s1);
    var d2 = el('span', 'dot shaft'); var s2 = el('span', null, t('fShaft')); s2.setAttribute('data-i18n', 'fShaft'); d2.appendChild(s2);
    leg.appendChild(d1); leg.appendChild(d2);
    host.appendChild(leg);

    // Bohrung + Welle (Buchstabe + Grad)
    elHoleL = selectFrom(HOLE_LETTERS, null, true); elHoleL.value = 'H';
    elHoleG = selectFrom(GRADES, function (g) { return 'IT' + g; }, true); elHoleG.value = '7';
    elShaftL = selectFrom(SHAFT_LETTERS, null, true); elShaftL.value = 'g';
    elShaftG = selectFrom(GRADES, function (g) { return 'IT' + g; }, true); elShaftG.value = '6';

    var g2 = el('div', 'group-fields');
    g2.appendChild(labeledField('fHole', null, pairControl(elHoleL, elHoleG)));
    g2.appendChild(labeledField('fShaft', null, pairControl(elShaftL, elShaftG)));
    host.appendChild(g2);

    // Verdrahtung: jede Änderung rechnet live UND spiegelt in die Kurzeingabe.
    [elNominal, elHoleL, elHoleG, elShaftL, elShaftG].forEach(function (c) {
      c.addEventListener('input', recalc); c.addEventListener('change', recalc);
    });
    elSystem.addEventListener('change', function () {
      if (elSystem.value === 'EB') elHoleL.value = 'H';
      else if (elSystem.value === 'EW') elShaftL.value = 'h';
      recalc();
    });
  }

  /* Kurzeingabe -> diskrete Felder (kein Zurückschreiben, damit das Tippen bleibt). */
  function onFitInput() {
    var raw = String(elFit.value || '').trim();
    if (raw === '') { elFitMsg.hidden = true; return; }
    var p = S.parseFit(raw);
    if (!p.ok) { elFitMsg.textContent = msgOf({ code: p.error || 'ERR_PARSE_FIELD' }); elFitMsg.hidden = false; return; }
    elFitMsg.hidden = true;
    elNominal.value = String(p.nominal);
    if (HOLE_LETTERS.indexOf(p.hole.letter) >= 0) elHoleL.value = p.hole.letter;
    if (GRADES.indexOf(p.hole.grade) >= 0) elHoleG.value = String(p.hole.grade);
    if (SHAFT_LETTERS.indexOf(p.shaft.letter) >= 0) elShaftL.value = p.shaft.letter;
    if (GRADES.indexOf(p.shaft.grade) >= 0) elShaftG.value = String(p.shaft.grade);
    elSystem.value = p.system || 'FREE';
    run(); // rendern, aber elFit NICHT überschreiben (Nutzer tippt gerade)
  }

  /* Kurzeingabe aus den diskreten Feldern neu schreiben (kanonisch, Locale-Komma). */
  function refreshFitField() {
    if (!elFit) return;
    var inp = readInput();
    if (isNaN(inp.nominal) || !inp.hole.letter || isNaN(inp.hole.grade) || !inp.shaft.letter || isNaN(inp.shaft.grade)) return;
    elFit.value = S.formatFit({ nominal: inp.nominal, hole: inp.hole, shaft: inp.shaft }, lang === 'en' ? '.' : ',');
    elFitMsg.hidden = true;
  }

  /* Rechnen + Kurzeingabe spiegeln (für diskrete Änderungen, Reset, Preset, Sprache). */
  function recalc() { run(); refreshFitField(); }

  function readInput() {
    return {
      nominal: parseFloat(String(elNominal.value).replace(',', '.')),
      system: elSystem.value,
      hole: { letter: elHoleL.value, grade: parseInt(elHoleG.value, 10) },
      shaft: { letter: elShaftL.value, grade: parseInt(elShaftG.value, 10) }
    };
  }

  /* ======================================================================= *
   * 5) Rechnen + Rendern
   * ======================================================================= */
  function run() {
    if (!S) { resultHost.textContent = 'DTPSolver nicht geladen.'; return; }
    var inp = readInput();
    var missing = [];
    if (isNaN(inp.nominal)) missing.push('fNominal');
    if (!inp.hole.letter || isNaN(inp.hole.grade)) missing.push('fHole');
    if (!inp.shaft.letter || isNaN(inp.shaft.grade)) missing.push('fShaft');
    if (missing.length) { renderIncomplete(missing); return; }
    var res = S.computeFit(inp);
    if (res.ok) renderResult(res); else renderErrors(res.errors);
  }

  /* Unvollständige Eingabe: neutraler Hinweis, welche Felder noch fehlen. */
  function renderIncomplete(missing) {
    resultHost.textContent = '';
    var b = el('div', 'status-banner idle');
    b.textContent = t('hintIncomplete') + ' ' + missing.map(function (k) { return t(k); }).join(', ');
    resultHost.appendChild(b);
    clearViz();
  }

  function card(nameKey, valueStr, unitKey, tone) {
    var c = el('div', 'safety-card' + (tone ? ' ' + tone : ''));
    var nm = el('div', 'sc-name'); var s = el('span'); s.setAttribute('data-i18n', nameKey); s.textContent = t(nameKey); nm.appendChild(s);
    var help = t('help_' + nameKey);
    var hp = null;
    if (help && help !== 'help_' + nameKey) {
      var q = el('button', 'sc-q', 'ⓘ'); q.type = 'button'; q.setAttribute('aria-label', help); q.title = help;
      if (armPulse) q.classList.add('pulse');
      nm.appendChild(q);
      hp = el('div', 'sc-help', help); hp.hidden = true;
      q.addEventListener('click', function () { markTipsSeen(); hp.hidden = !hp.hidden; });
    }
    c.appendChild(nm);
    var val = el('div', 'sc-val', valueStr);
    if (unitKey) { var u = el('span'); u.style.cssText = 'font-size:13px;color:var(--faint);margin-left:4px'; u.textContent = t(unitKey); val.appendChild(u); }
    c.appendChild(val);
    c.appendChild(el('span', 'sc-dot'));
    if (hp) c.appendChild(hp);
    return c;
  }

  function limitsTable(captionKey, captionCls, upperKey, lowerKey, field) {
    var tbl = el('table', 'kv-table');
    var cap = el('caption', captionCls); cap.setAttribute('data-i18n', captionKey); cap.textContent = t(captionKey); tbl.appendChild(cap);
    function row(k, valNode) {
      var tr = el('tr');
      var td1 = el('td', 'k'); td1.setAttribute('data-i18n', k); td1.textContent = t(k); tr.appendChild(td1);
      var td2 = el('td', 'v'); td2.appendChild(valNode); tr.appendChild(td2);
      return tr;
    }
    function um(x) { var n = el('span'); n.textContent = sgn(x); var u = el('span', 'u'); u.textContent = 'µm'; n.appendChild(u); return n; }
    function mm(x) { var n = el('span'); n.textContent = fmtMm(x); var u = el('span', 'u'); u.textContent = 'mm'; n.appendChild(u); return n; }
    tbl.appendChild(row(upperKey, um(field.upper)));
    tbl.appendChild(row(lowerKey, um(field.lower)));
    tbl.appendChild(row('rMaxSize', mm(field.Go)));
    tbl.appendChild(row('rMinSize', mm(field.Gu)));
    var trTol = el('tr');
    var k = el('td', 'k'); k.setAttribute('data-i18n', 'rTol'); k.textContent = t('rTol'); trTol.appendChild(k);
    var vv = el('td', 'v'); var sp = el('span'); sp.textContent = 'IT' + field.grade + ' = ' + fmtUm(field.T); var u2 = el('span', 'u'); u2.textContent = 'µm'; sp.appendChild(u2); vv.appendChild(sp); trTol.appendChild(vv);
    tbl.appendChild(trTol);
    return tbl;
  }

  function renderResult(res) {
    resultHost.textContent = '';
    var f = res.fit, i = res.input;

    // Kurzform „Ø50 H7/g6" + System
    var echo = el('div', 'fit-echo');
    echo.textContent = 'Ø' + (Number.isInteger(i.nominal) ? i.nominal : fmtMm(i.nominal)) + ' ' +
      i.hole.letter + i.hole.grade + '/' + i.shaft.letter + i.shaft.grade;
    if (res.system) { var sy = el('span', 'sys', res.system === 'EB' ? 'H' : res.system === 'EW' ? 'h' : ''); echo.appendChild(sy); }
    echo.style.marginBottom = '12px';
    resultHost.appendChild(echo);

    // Passungsart-Banner
    var artClass = f.art === 'SPIEL' ? 'pa-spiel' : f.art === 'UEBERGANG' ? 'pa-uebergang' : 'pa-uebermass';
    var banner = el('div', 'verdict-banner ' + artClass);
    banner.appendChild(el('span', 'vb-dot', f.art === 'SPIEL' ? '◔' : f.art === 'UEBERGANG' ? '◑' : '●'));
    var body = el('div', 'vb-body');
    var txt = el('span', 'vb-text', t('art' + f.art));
    var fein = t('fein' + f.artFein); if (fein && fein !== 'fein' + f.artFein) txt.textContent += ' · ' + fein;
    body.appendChild(txt);
    body.appendChild(el('span', 'vb-note', t('art' + f.art + '_note')));
    banner.appendChild(body);
    resultHost.appendChild(banner);

    // Kennwert-Kacheln
    armPulse = (!tipsSeen && !pulseDone);
    var grid = el('div', 'safety-grid');
    if (f.art === 'SPIEL') {
      grid.appendChild(card('rClearMin', fmtUm(f.PSmin), 'unit_um', f.PSmin > 0 ? 'ok' : 'warn'));
      grid.appendChild(card('rClearMax', fmtUm(f.PSmax), 'unit_um', 'ok'));
    } else if (f.art === 'UEBERMASS') {
      grid.appendChild(card('rInterMin', fmtUm(f.interferenceMin), 'unit_um', 'warn'));
      grid.appendChild(card('rInterMax', fmtUm(f.interferenceMax), 'unit_um', 'warn'));
    } else {
      grid.appendChild(card('rPlayMax', fmtUm(f.PSmax), 'unit_um', 'ok'));
      grid.appendChild(card('rInterMax', fmtUm(f.interferenceMax), 'unit_um', 'warn'));
    }
    grid.appendChild(card('rFitTol', fmtUm(f.PT), 'unit_um'));
    resultHost.appendChild(grid);
    if (armPulse) { pulseDone = true; armPulse = false; }

    // Grenzmaße Bohrung | Welle
    var lg = el('div', 'limits-grid'); lg.style.marginTop = '8px';
    lg.appendChild(limitsTable('fHole', 'bore', 'rUpperDev', 'rLowerDev', res.hole));
    lg.appendChild(limitsTable('fShaft', 'shaft', 'rUpperDev', 'rLowerDev', res.shaft));
    resultHost.appendChild(lg);

    // Hinweise (Warnungen + Notes)
    var all = (res.warnings || []).concat(res.notes || []);
    if (all.length) {
      var box = el('div', 'notes');
      all.forEach(function (w) {
        var line = el('div', 'note-line warning');
        line.appendChild(el('span', 'tag', (w.code || '').replace(/^WARN_/, '').slice(0, 6) || 'i'));
        line.appendChild(el('span', null, msgOf(w)));
        box.appendChild(line);
      });
      resultHost.appendChild(box);
    }

    renderRechenweg(res);
    renderViz(res);
  }

  /* Aufklappbarer, selbstprüfender Rechenweg (B6). */
  function renderRechenweg(res) {
    var RWm = window.DTPRechenweg;
    if (!RWm || !RWm.build) return;
    var data = RWm.build(res, { um: sgn, umU: fmtUm, mm: fmtMm });

    var wrap = el('div', 'rechenweg');
    var btn = el('button', 'rw-toggle'); btn.type = 'button';
    var chev = el('span', 'rw-chev', '▸');
    var cap = el('span', 'rw-cap', t('rwHeading'));
    var badge = el('span', 'rw-allok' + (data.allOk ? '' : ' bad'), data.allOk ? '✓ ' + t('rwAllOk') : '✗ ' + t('rwFail'));
    btn.appendChild(chev); btn.appendChild(cap); btn.appendChild(badge);

    var body = el('div', 'rw-body collapsed');
    data.steps.forEach(function (st, idx) {
      var row = el('div', 'rw-step' + (st.ok ? '' : ' bad'));
      row.appendChild(el('span', 'rw-num', String(idx + 1)));
      var main = el('div', 'rw-main');
      main.appendChild(el('div', 'rw-title', t(st.key) + (st.art ? ' — ' + t('art' + st.art) : '')));
      main.appendChild(el('div', 'rw-expr', st.expr));
      row.appendChild(main);
      row.appendChild(el('span', 'rw-check' + (st.ok ? '' : ' bad'), st.ok ? '✓' : '✗'));
      body.appendChild(row);
    });

    btn.addEventListener('click', function () {
      var collapsed = body.classList.toggle('collapsed');
      chev.textContent = collapsed ? '▸' : '▾';
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
    btn.setAttribute('aria-expanded', 'false');
    wrap.appendChild(btn); wrap.appendChild(body);
    resultHost.appendChild(wrap);
  }

  /* Toleranzfeld-Grafik (B5): SVG aus schaubild.js + HTML-Legende mit Farb-Chips. */
  function renderViz(res) {
    if (!vizHost) return;
    vizHost.textContent = '';
    var SB = window.DTPSchaubild;
    if (!SB) { clearViz(); return; }
    var i = res.input;
    vizHost.appendChild(SB.svg(res, {
      hole: i.hole.letter + i.hole.grade,
      shaft: i.shaft.letter + i.shaft.grade,
      unit: t('unit_um')
    }));

    var leg = el('div', 'viz-legend');
    function chip(cls, name, sub, helpKey) {
      var c = el('div', 'viz-chip');
      var head = el('div', 'vc-head');
      head.appendChild(el('span', 'vc-swatch ' + cls));
      head.appendChild(el('span', 'vc-name', name));
      c.appendChild(head);
      if (sub) c.appendChild(el('span', 'vc-sub', sub));
      var help = t(helpKey);
      if (help && help !== helpKey) {
        var hp = el('div', 'vc-help', help); hp.hidden = true;
        c.appendChild(hp);
        c.setAttribute('role', 'button'); c.setAttribute('tabindex', '0'); c.title = help;
        c.addEventListener('click', function () { markTipsSeen(); hp.hidden = !hp.hidden; });
      }
      return c;
    }
    leg.appendChild(chip('bore', t('vizBore') + ' ' + i.hole.letter + i.hole.grade,
      'ES ' + sgn(res.hole.upper) + ' · EI ' + sgn(res.hole.lower) + ' µm', 'vizBoreHelp'));
    leg.appendChild(chip('shaft', t('vizShaft') + ' ' + i.shaft.letter + i.shaft.grade,
      'es ' + sgn(res.shaft.upper) + ' · ei ' + sgn(res.shaft.lower) + ' µm', 'vizShaftHelp'));
    vizHost.appendChild(leg);
    vizHost.appendChild(el('div', 'viz-zero-note', t('vizZero')));
  }

  function clearViz() {
    if (!vizHost) return;
    vizHost.textContent = '';
    var ph = el('div', 'viz-placeholder');
    ph.appendChild(el('div', 'big', t('vizSoon')));
    ph.appendChild(el('div', null, t('vizPlaceholder')));
    vizHost.appendChild(ph);
  }

  function renderErrors(errors) {
    resultHost.textContent = '';
    var banner = el('div', 'verdict-banner bad');
    banner.appendChild(el('span', 'vb-dot', '✕'));
    var body = el('div', 'vb-body');
    body.appendChild(el('span', 'vb-text', msgOf(errors[0])));
    if (errors.length > 1) body.appendChild(el('span', 'vb-note', errors.slice(1).map(msgOf).join(' · ')));
    banner.appendChild(body);
    resultHost.appendChild(banner);
    clearViz();
  }

  /* ======================================================================= *
   * 6) Beispiele (Presets aus solver.js)
   * ======================================================================= */
  function fillPresets(sel) {
    sel.textContent = '';
    var first = el('option', null, t('examplePick')); first.value = ''; sel.appendChild(first);
    (S.PRESETS || []).forEach(function (P) {
      var o = el('option', null, P.fit); o.value = P.fit; sel.appendChild(o);
    });
  }
  function applyPreset(str) {
    var p = S.parseFit(str);
    if (!p || !p.ok) return;
    elNominal.value = String(p.nominal);
    elHoleL.value = p.hole.letter; elHoleG.value = String(p.hole.grade);
    elShaftL.value = p.shaft.letter; elShaftG.value = String(p.shaft.grade);
    elSystem.value = p.system || 'FREE';
    recalc();
  }

  /* ======================================================================= *
   * 7) i18n/Theme/Edition anwenden
   * ======================================================================= */
  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (n) { n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph'))); });
    document.querySelectorAll('[data-i18n-title]').forEach(function (n) { n.setAttribute('title', t(n.getAttribute('data-i18n-title'))); });
    // dynamische Selektoren (System-Optionen, Beispielliste):
    if (elSystem && elSystem.options.length >= 3) {
      elSystem.options[0].textContent = t('sysEB');
      elSystem.options[1].textContent = t('sysEW');
      elSystem.options[2].textContent = t('sysFree');
    }
    var ps = document.getElementById('presetSel'); if (ps && ps.options[0]) ps.options[0].textContent = t('examplePick');
    document.querySelectorAll('.lang-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-lang') === lang); });
  }
  function setLang(l) {
    lang = l; localStorage.setItem('dtp-lang', l); applyI18n();
    if (elFit && String(elFit.value || '').trim() !== '' && !elFitMsg.hidden) onFitInput(); // Fehlertext in neuer Sprache
    recalc();
  }
  function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('dtp-theme', theme); }

  function applyEdition() {
    var bar = document.getElementById('editionBar');
    if (!bar) return;
    if (edition === 'test') {
      // Testversion: dezenter gelber Hinweisbalken oben.
      bar.hidden = false;
      bar.className = 'edition-bar test';
      bar.textContent = t('editionTest');
    } else {
      // Vollversion: kein Balken oben. Die dezente Kennzeichnung (mit Käufername)
      // folgt in B15 (Registrierung), wie bei DT-ProfiSchraube.
      bar.hidden = true;
      bar.className = 'edition-bar full';
      bar.textContent = '';
    }
  }

  /* ======================================================================= *
   * 8) Start
   * ======================================================================= */
  function on(id, ev, fn) { var e = document.getElementById(id); if (e) e.addEventListener(ev, fn); }

  function init() {
    host = document.getElementById('formHost');
    resultHost = document.getElementById('resultHost');
    vizHost = document.getElementById('vizHost');
    if (!host || !resultHost) return;

    applyTheme(localStorage.getItem('dtp-theme') || 'dark');
    buildForm();

    var ps = document.getElementById('presetSel');
    if (ps) { fillPresets(ps); ps.addEventListener('change', function () { if (ps.value) applyPreset(ps.value); }); }

    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
    on('themeBtn', 'click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
    on('calcBtn', 'click', recalc);
    on('resetBtn', 'click', function () {
      elNominal.value = ''; elSystem.value = 'FREE';
      elHoleL.value = ''; elHoleG.value = ''; elShaftL.value = ''; elShaftG.value = '';
      if (elFit) elFit.value = '';
      if (elFitMsg) elFitMsg.hidden = true;
      run(); // zeigt „Bitte ausfüllen: …" — schreibt nichts zurück
    });

    applyEdition();
    applyI18n();
    recalc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
