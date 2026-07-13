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

  /* ======================================================================= *
   * 2) Zustand + kleine Helfer
   * ======================================================================= */
  var lang = localStorage.getItem('dtp-lang') || 'de';
  var edition = (window.DT_EDITION === 'test') ? 'test' : 'full';

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
  var host, resultHost;
  var elNominal, elSystem, elHoleL, elHoleG, elShaftL, elShaftG;

  function selectFrom(list, mapLabel) {
    var sel = el('select');
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
    elHoleL = selectFrom(HOLE_LETTERS); elHoleL.value = 'H';
    elHoleG = selectFrom(GRADES, function (g) { return 'IT' + g; }); elHoleG.value = '7';
    elShaftL = selectFrom(SHAFT_LETTERS); elShaftL.value = 'g';
    elShaftG = selectFrom(GRADES, function (g) { return 'IT' + g; }); elShaftG.value = '6';

    var g2 = el('div', 'group-fields');
    g2.appendChild(labeledField('fHole', null, pairControl(elHoleL, elHoleG)));
    g2.appendChild(labeledField('fShaft', null, pairControl(elShaftL, elShaftG)));
    host.appendChild(g2);

    // Verdrahtung: jede Änderung rechnet live; System setzt Grundbuchstaben.
    [elNominal, elHoleL, elHoleG, elShaftL, elShaftG].forEach(function (c) {
      c.addEventListener('input', run); c.addEventListener('change', run);
    });
    elSystem.addEventListener('change', function () {
      if (elSystem.value === 'EB') elHoleL.value = 'H';
      else if (elSystem.value === 'EW') elShaftL.value = 'h';
      run();
    });
  }

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
    if (isNaN(inp.nominal)) { renderErrors([{ code: 'ERR_NOMINAL_TYPE', field: 'nominal' }]); return; }
    var res = S.computeFit(inp);
    if (res.ok) renderResult(res); else renderErrors(res.errors);
  }

  function card(nameKey, valueStr, unitKey, tone) {
    var c = el('div', 'safety-card' + (tone ? ' ' + tone : ''));
    var nm = el('div', 'sc-name'); var s = el('span'); s.setAttribute('data-i18n', nameKey); s.textContent = t(nameKey); nm.appendChild(s);
    c.appendChild(nm);
    var val = el('div', 'sc-val', valueStr);
    if (unitKey) { var u = el('span'); u.style.cssText = 'font-size:13px;color:var(--faint);margin-left:4px'; u.textContent = t(unitKey); val.appendChild(u); }
    c.appendChild(val);
    c.appendChild(el('span', 'sc-dot'));
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
    run();
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
  function setLang(l) { lang = l; localStorage.setItem('dtp-lang', l); applyI18n(); run(); }
  function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('dtp-theme', theme); }

  function applyEdition() {
    var bar = document.getElementById('editionBar');
    if (!bar) return;
    bar.hidden = false;
    bar.className = 'edition-bar ' + (edition === 'test' ? 'test' : 'full');
    bar.textContent = edition === 'test' ? t('editionTest') : t('editionFull');
  }

  /* ======================================================================= *
   * 8) Start
   * ======================================================================= */
  function on(id, ev, fn) { var e = document.getElementById(id); if (e) e.addEventListener(ev, fn); }

  function init() {
    host = document.getElementById('formHost');
    resultHost = document.getElementById('resultHost');
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
    on('calcBtn', 'click', run);
    on('resetBtn', 'click', function () {
      elNominal.value = '50'; elSystem.value = 'EB';
      elHoleL.value = 'H'; elHoleG.value = '7'; elShaftL.value = 'g'; elShaftG.value = '6';
      run();
    });

    applyEdition();
    applyI18n();
    run();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
