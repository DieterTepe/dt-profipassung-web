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

  var D = window.DTPData, V = window.DTPValidate, S = window.DTPSolver, FF = window.DTPFreiform, TH = window.DTPThermik;

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

  /* --- B7: Freiform + ISO 2768 -------------------------------------------- */
  (function () {
    var s = {
      de: {
        modeFit: 'Passung', modeFreiform: 'Freiform',
        ffClass: 'Toleranzklasse', rFfDev: '± Abmaß', ffRange: 'Bereich',
        ffClass_f: 'fein', ffClass_m: 'mittel', ffClass_c: 'grob', ffClass_v: 'sehr grob',
        hintFfNominal: 'Nennmaß 0,5–4000 mm.', hintFfClass: 'ISO-2768-Allgemeintoleranz (f fein … v sehr grob).'
      },
      en: {
        modeFit: 'Fit', modeFreiform: 'General',
        ffClass: 'Tolerance class', rFfDev: '± deviation', ffRange: 'Range',
        ffClass_f: 'fine', ffClass_m: 'medium', ffClass_c: 'coarse', ffClass_v: 'very coarse',
        hintFfNominal: 'Nominal size 0.5–4000 mm.', hintFfClass: 'ISO 2768 general tolerance (f fine … v very coarse).'
      },
      pt: {
        modeFit: 'Ajuste', modeFreiform: 'Geral',
        ffClass: 'Classe de tolerância', rFfDev: '± desvio', ffRange: 'Faixa',
        ffClass_f: 'fina', ffClass_m: 'média', ffClass_c: 'grosseira', ffClass_v: 'muito grosseira',
        hintFfNominal: 'Dimensão nominal 0,5–4000 mm.', hintFfClass: 'Tolerância geral ISO 2768 (f fina … v muito grosseira).'
      }
    };
    var m = {
      FF_NOMINAL_TYPE: { de: 'Nennmaß muss eine Zahl sein.', en: 'Nominal size must be a number.', pt: 'A dimensão nominal deve ser um número.' },
      FF_BELOW_MIN: { de: 'ISO 2768 gilt erst ab 0,5 mm.', en: 'ISO 2768 applies from 0.5 mm.', pt: 'ISO 2768 aplica-se a partir de 0,5 mm.' },
      FF_ABOVE_MAX: { de: 'Über 4000 mm nicht in ISO 2768-1.', en: 'Above 4000 mm not in ISO 2768-1.', pt: 'Acima de 4000 mm não consta na ISO 2768-1.' },
      FF_CLASS_UNKNOWN: { de: 'Toleranzklasse unbekannt (f/m/c/v).', en: 'Unknown tolerance class (f/m/c/v).', pt: 'Classe de tolerância desconhecida (f/m/c/v).' },
      FF_UNDEFINED: { de: 'Für „{cls}" ist dieser Nennmaßbereich in ISO 2768-1 nicht vorgesehen.', en: 'For “{cls}” this size range is not defined in ISO 2768-1.', pt: 'Para “{cls}” esta faixa não está definida na ISO 2768-1.' }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
    for (var c in m) MSG[c] = m[c];
  })();

  /* --- B8: Thermik-Check --------------------------------------------------- */
  (function () {
    var s = {
      de: {
        thEnable: 'Passung bei Betriebstemperatur prüfen', thTemp: 'Betriebstemperatur',
        thMatHole: 'Werkstoff Bohrung', thMatShaft: 'Werkstoff Welle',
        thHeading: 'Thermik', thAt: 'bei', thUmschlag: 'Passungsumschlag', thVs20: 'gegenüber 20 °C',
        unit_c: '°C'
      },
      en: {
        thEnable: 'Check fit at operating temperature', thTemp: 'Operating temperature',
        thMatHole: 'Hole material', thMatShaft: 'Shaft material',
        thHeading: 'Thermal', thAt: 'at', thUmschlag: 'Fit type changes', thVs20: 'vs. 20 °C',
        unit_c: '°C'
      },
      pt: {
        thEnable: 'Verificar ajuste na temperatura de operação', thTemp: 'Temperatura de operação',
        thMatHole: 'Material do furo', thMatShaft: 'Material do eixo',
        thHeading: 'Térmico', thAt: 'a', thUmschlag: 'Mudança do tipo de ajuste', thVs20: 'em relação a 20 °C',
        unit_c: '°C'
      }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* --- B8.1: Rechenweg-Titel für Freiform + Thermik ----------------------- */
  (function () {
    var s = {
      de: {
        rwFfLookup: 'Tabellenwert (ISO 2768-1)', rwFfGo: 'Höchstmaß', rwFfGu: 'Mindestmaß', rwFfTol: 'Toleranz',
        rwThDelta: 'Spielverschiebung ΔS', rwThPSmax: 'Höchstspiel bei Betriebstemperatur',
        rwThPSmin: 'Mindestspiel bei Betriebstemperatur', rwThArt: 'Passungsart bei Betriebstemperatur'
      },
      en: {
        rwFfLookup: 'Table value (ISO 2768-1)', rwFfGo: 'Maximum size', rwFfGu: 'Minimum size', rwFfTol: 'Tolerance',
        rwThDelta: 'Clearance shift ΔS', rwThPSmax: 'Max. clearance at operating temp.',
        rwThPSmin: 'Min. clearance at operating temp.', rwThArt: 'Type of fit at operating temp.'
      },
      pt: {
        rwFfLookup: 'Valor da tabela (ISO 2768-1)', rwFfGo: 'Dimensão máxima', rwFfGu: 'Dimensão mínima', rwFfTol: 'Tolerância',
        rwThDelta: 'Deslocamento da folga ΔS', rwThPSmax: 'Folga máx. na temp. de operação',
        rwThPSmin: 'Folga mín. na temp. de operação', rwThArt: 'Tipo de ajuste na temp. de operação'
      }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* --- v1.9.2: Thermik-Visualisierung im Schaubild (Ghost-Chips) ---------- */
  (function () {
    var s = {
      de: {
        vizThermBoreHelp: 'Gestrichelt = Bohrung bei Betriebstemperatur. Verschoben um ΔS/2 gegen die Nulllinie; die gemeinsame Wärmedehnung ist herausgerechnet, δ ist die reale Einzeldehnung.',
        vizThermShaftHelp: 'Gestrichelt = Welle bei Betriebstemperatur. Der Höhenversatz zwischen beiden Ghosts ist ΔS – so viel ändert sich Spiel/Übermaß gegenüber 20 °C.'
      },
      en: {
        vizThermBoreHelp: 'Dashed = hole at operating temperature. Shifted by ΔS/2 vs. the zero line; the common thermal expansion is removed, δ is the real individual expansion.',
        vizThermShaftHelp: 'Dashed = shaft at operating temperature. The height offset between both ghosts is ΔS – that is how much clearance/interference changes vs. 20 °C.'
      },
      pt: {
        vizThermBoreHelp: 'Tracejado = furo na temperatura de operação. Deslocado em ΔS/2 em relação à linha zero; a dilatação térmica comum foi removida, δ é a dilatação individual real.',
        vizThermShaftHelp: 'Tracejado = eixo na temperatura de operação. O desnível entre os dois ghosts é ΔS – o quanto a folga/interferência muda em relação a 20 °C.'
      }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* --- B9: Beratung (Kostenampel + Messmittel) --------------------------- */
  (function () {
    var s = {
      de: {
        brHeading: 'Fertigung & Messtechnik', brCostTitle: 'Kostenampel',
        brMeasTitle: 'Messmittel · goldene Regel U ≤ T/10', brProcesses: 'Verfahren',
        brIdeal: 'ideal (U ≤ T/10)',
        costRED: 'teuer · Schleifen/Honen, Ausschussrisiko',
        costYELLOW: 'mittel · Feindrehen/Reiben', costGREEN: 'günstig · Standard-Drehen',
        procLAEPPEN: 'Läppen', procHONEN: 'Honen', procRUNDSCHLEIFEN: 'Rundschleifen',
        procREIBEN: 'Reiben', procFEINDREHEN: 'Feindrehen', procDREHEN: 'Drehen',
        procRAEUMEN: 'Räumen', procFRAESEN: 'Fräsen', procBOHREN: 'Bohren',
        instrMESSSCHIEBER: 'Messschieber', instrMIKROMETER: 'Bügelmessschraube',
        instrINNENMIKRO_3P: '3-Punkt-Innenmessschraube', instrMESSUHR: 'Messuhr',
        instrKMG: 'KMG', instrGRENZLEHRE: 'Grenzlehre'
      },
      en: {
        brHeading: 'Manufacturing & metrology', brCostTitle: 'Cost indicator',
        brMeasTitle: 'Gauges · golden rule U ≤ T/10', brProcesses: 'Processes',
        brIdeal: 'ideal (U ≤ T/10)',
        costRED: 'expensive · grinding/honing, scrap risk',
        costYELLOW: 'medium · fine turning/reaming', costGREEN: 'low cost · standard turning',
        procLAEPPEN: 'Lapping', procHONEN: 'Honing', procRUNDSCHLEIFEN: 'Cylindrical grinding',
        procREIBEN: 'Reaming', procFEINDREHEN: 'Fine turning', procDREHEN: 'Turning',
        procRAEUMEN: 'Broaching', procFRAESEN: 'Milling', procBOHREN: 'Drilling',
        instrMESSSCHIEBER: 'Caliper', instrMIKROMETER: 'Micrometer',
        instrINNENMIKRO_3P: '3-point bore micrometer', instrMESSUHR: 'Dial indicator',
        instrKMG: 'CMM', instrGRENZLEHRE: 'Limit gauge'
      },
      pt: {
        brHeading: 'Fabricação & metrologia', brCostTitle: 'Indicador de custo',
        brMeasTitle: 'Instrumentos · regra de ouro U ≤ T/10', brProcesses: 'Processos',
        brIdeal: 'ideal (U ≤ T/10)',
        costRED: 'caro · retificação/brunimento, risco de refugo',
        costYELLOW: 'médio · torneamento fino/alargamento', costGREEN: 'econômico · torneamento padrão',
        procLAEPPEN: 'Lapidação', procHONEN: 'Brunimento', procRUNDSCHLEIFEN: 'Retificação cilíndrica',
        procREIBEN: 'Alargamento', procFEINDREHEN: 'Torneamento fino', procDREHEN: 'Torneamento',
        procRAEUMEN: 'Brochamento', procFRAESEN: 'Fresamento', procBOHREN: 'Furação',
        instrMESSSCHIEBER: 'Paquímetro', instrMIKROMETER: 'Micrômetro',
        instrINNENMIKRO_3P: 'Micrômetro interno 3 pontos', instrMESSUHR: 'Relógio comparador',
        instrKMG: 'MMC', instrGRENZLEHRE: 'Calibrador de limites'
      }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* --- B9 Stufe 3b: Oberfläche (Rz) + Schmierspalt ----------------------- */
  (function () {
    var s = {
      de: {
        oaEnable: 'Oberfläche berücksichtigen (Rz)', oaRzHole: 'Rz Bohrung', oaRzShaft: 'Rz Welle',
        brSurfTitle: 'Oberfläche · Rz', brLubeTitle: 'Schmierspalt',
        surfOK: 'ok', surfWARN: 'grenzwertig', surfHIGH: 'zu hoch', surfCRIT: 'kritisch',
        brIdealMax: 'ideal ≤', brForm: 'Rundheit ≤',
        brSwirk: 'Wirksames Spiel', brUwirk: 'Wirksames Übermaß',
        CLEAR_LOSS: 'Spiel durch Rauheit fast aufgebraucht',
        PRESS_LOSS: 'Übermaß durch Glättung aufgebraucht — Presssitz gefährdet',
        brGap: 'nutzbarer Spalt', brLubeOk: 'Vollschmierung plausibel',
        HINT_LUBRICATION: 'Mischreibungsrisiko (ΣRz > S_min/3)', brLubeNA: 'nur bei Spielpassungen'
      },
      en: {
        oaEnable: 'Consider surface (Rz)', oaRzHole: 'Rz hole', oaRzShaft: 'Rz shaft',
        brSurfTitle: 'Surface · Rz', brLubeTitle: 'Lubrication gap',
        surfOK: 'ok', surfWARN: 'borderline', surfHIGH: 'too high', surfCRIT: 'critical',
        brIdealMax: 'ideal ≤', brForm: 'roundness ≤',
        brSwirk: 'Effective clearance', brUwirk: 'Effective interference',
        CLEAR_LOSS: 'clearance nearly consumed by roughness',
        PRESS_LOSS: 'interference lost to smoothing — press fit at risk',
        brGap: 'usable gap', brLubeOk: 'full-film feasible',
        HINT_LUBRICATION: 'mixed-friction risk (ΣRz > S_min/3)', brLubeNA: 'clearance fits only'
      },
      pt: {
        oaEnable: 'Considerar superfície (Rz)', oaRzHole: 'Rz furo', oaRzShaft: 'Rz eixo',
        brSurfTitle: 'Superfície · Rz', brLubeTitle: 'Folga de lubrificação',
        surfOK: 'ok', surfWARN: 'limítrofe', surfHIGH: 'alto demais', surfCRIT: 'crítico',
        brIdealMax: 'ideal ≤', brForm: 'circularidade ≤',
        brSwirk: 'Folga efetiva', brUwirk: 'Interferência efetiva',
        CLEAR_LOSS: 'folga quase consumida pela rugosidade',
        PRESS_LOSS: 'interferência perdida pelo alisamento — ajuste prensado em risco',
        brGap: 'folga utilizável', brLubeOk: 'película completa viável',
        HINT_LUBRICATION: 'risco de atrito misto (ΣRz > S_min/3)', brLubeNA: 'apenas ajustes com folga'
      }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* --- B9 Stufe 3b: Rechenweg-Labels Oberfläche + Schmierspalt ----------- */
  (function () {
    var s = {
      de: {
        brSurfLubeHeading: 'Oberfläche & Schmierspalt', rwOaSum: 'Summe der Rautiefen',
        rwOaLimHole: 'Rz-Grenzwert Bohrung', rwOaLimShaft: 'Rz-Grenzwert Welle',
        rwOaSwirk: 'Wirksames Kleinstspiel', rwOaUwirk: 'Wirksames Kleinstübermaß',
        rwLubeThr: 'Schmierspalt-Schwelle', rwLubeGap: 'Nutzbarer Schmierspalt', rwLubeRule: 'Reibungszustand'
      },
      en: {
        brSurfLubeHeading: 'Surface & lubrication', rwOaSum: 'Sum of roughness',
        rwOaLimHole: 'Rz limit hole', rwOaLimShaft: 'Rz limit shaft',
        rwOaSwirk: 'Effective min clearance', rwOaUwirk: 'Effective min interference',
        rwLubeThr: 'Lubrication threshold', rwLubeGap: 'Usable lubrication gap', rwLubeRule: 'Friction regime'
      },
      pt: {
        brSurfLubeHeading: 'Superfície & lubrificação', rwOaSum: 'Soma das rugosidades',
        rwOaLimHole: 'Limite Rz furo', rwOaLimShaft: 'Limite Rz eixo',
        rwOaSwirk: 'Folga mínima efetiva', rwOaUwirk: 'Interferência mínima efetiva',
        rwLubeThr: 'Limiar de lubrificação', rwLubeGap: 'Folga de lubrificação utilizável', rwLubeRule: 'Regime de atrito'
      }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* B10a — Laien-ⓘ je Eingabefeld: ausführliche Sprechblasen-Hilfen (DE/EN/PT).
     Aufbau je Text: Was ist das? · Bereich · empfohlene Werte mit Begründung. */
  (function () {
    var s = {
      de: {
        fh_fFit: 'Komplette Passung in einem Rutsch eintippen — z. B. „50 H7/g6“, „Ø50 H7-g6“ oder nur „50 H7“. Großbuchstabe = Bohrung, Kleinbuchstabe = Welle. Die Felder darunter stellen sich automatisch ein und bleiben mit diesem Feld synchron.\nBereich: Nennmaß 1–500 mm (ISO-286-Tabelle).\nTipp: „50 H7/g6“ ist ein bewährtes Beispiel zum Ausprobieren — eine leichtgängige Führung.',
        fh_fNominal: 'Gemeinsames Ausgangsmaß von Bohrung und Welle — die Zahl vor dem Toleranzkurzzeichen auf der Zeichnung (die 50 in „Ø50 H7/g6“). Von diesem Maß aus werden die erlaubten Abweichungen gerechnet.\nBereich: 1–500 mm (tabellierte ISO-286-Werte).\nGut zu wissen: Je größer das Nennmaß, desto größer die Toleranz desselben IT-Grades — das sieht die Norm bewusst so vor.',
        fh_fSystem: 'Legt fest, welches Teil die feste „Null-Lage“ bekommt:\n• Einheitsbohrung — Bohrung immer H, die Passung wird über die Welle gesteuert. Standard im Maschinenbau, weil Bohrwerkzeuge (z. B. Reibahlen) feste Maße haben.\n• Einheitswelle — Welle immer h; sinnvoll z. B. bei blankgezogenem Wellenmaterial, auf das mehrere Teile kommen.\n• Frei — beide Seiten beliebig wählbar (Sonderfälle).\nEmpfehlung: Im Zweifel Einheitsbohrung — so arbeitet der größte Teil des Maschinenbaus.',
        fh_fHole: 'Toleranzklasse der Bohrung. Der Buchstabe bestimmt die Lage des Toleranzfelds zur Nulllinie (H beginnt genau an der Nulllinie — deshalb ist H die übliche Wahl), die IT-Zahl die Größe des Felds: kleinere Zahl = enger = genauer = teurer.\nÜbliche Werte: H7 für normale Passbohrungen (gerieben/feingebohrt) · H8 für Gleitlager · H6 für hochgenaue Führungen.\nEmpfehlung: H7 wählen und den Passungscharakter über die Welle steuern.',
        fh_fShaft: 'Toleranzklasse der Welle. Kleinbuchstabe = Lage zur Nulllinie (h endet genau an der Nulllinie; Richtung a wird es lockerer, Richtung z fester), IT-Zahl = Größe des Toleranzfelds.\nTypische Partner zu H7: g6 leichtgängige Führung · h6 Schiebesitz · js6/k6 wackelfreie Zentrierung · n6/p6 fester Sitz · s6 Pressverband.\nFaustregel: Welle einen IT-Grad genauer als die Bohrung (H7 + g6) — Außenflächen lassen sich leichter genau fertigen als Bohrungen.',
        fh_ffNominal: 'Länge oder Durchmesser des Maßes, für das die Allgemeintoleranz nach ISO 2768 gelten soll — also ein Maß ohne eigene Toleranzangabe auf der Zeichnung.\nBereich: 0,5–4000 mm (Tabellenbereiche der Norm).\nHinweis: Für Maße unter 0,5 mm verlangt die Norm eine direkte Toleranzangabe am Maß selbst.',
        fh_ffClass: 'Toleranzklasse der Allgemeintoleranzen nach ISO 2768-1 — gilt pauschal für alle Maße ohne eigene Toleranzangabe:\n• f (fein) — Feinmechanik, geschliffene Teile\n• m (mittel) — normaler Maschinenbau, Standard auf den meisten Zeichnungen\n• c (grob) — Schweißkonstruktionen, Brennteile\n• v (sehr grob) — Guss- und Schmiederohteile\nEmpfehlung: „m“, wenn das Zeichnungs-Schriftfeld nichts anderes sagt (üblich: „ISO 2768-m“).',
        fh_thEnable: 'Alle ISO-Toleranzen gelten bei 20 °C (DIN EN ISO 1). Läuft die Paarung wärmer oder kälter, dehnen sich Bohrungsteil und Welle unterschiedlich stark aus — das Spiel kann wachsen, schrumpfen oder sogar umschlagen (aus Spiel wird Klemmung).\nEinschalten, wenn die Betriebstemperatur deutlich von 20 °C abweicht — als Faustregel ab etwa ±20 K, bei Werkstoffmix (z. B. Stahl-Welle im Alu-Gehäuse) schon früher.',
        fh_thTemp: 'Gemeinsame Betriebstemperatur beider Teile im eingeschwungenen (stationären) Zustand.\nTypische Werte: Getriebe 60–90 °C · Elektromotor-Gehäuse 40–80 °C · Motorumfeld 100–150 °C · Außeneinsatz/Kühlung bis −40 °C.\nHinweis: Bei schnellen Temperaturwechseln (schneller als ca. 10 K/min) sind die Übergangszustände kritischer als der hier gerechnete Dauerzustand.',
        fh_thMatHole: 'Werkstoff des Teils mit der Bohrung (Gehäuse, Nabe, Buchse) — er bestimmt, wie stark sich die Bohrung mit der Temperatur weitet.\nDaumenwerte α (10⁻⁶/K): Stahl ≈ 11,5 · Grauguss ≈ 10 · Alu ≈ 23 · Messing ≈ 19.\nEntscheidend ist der Unterschied zur Welle: ein Alu-Gehäuse um eine Stahl-Welle vergrößert das Spiel beim Erwärmen deutlich.',
        fh_thMatShaft: 'Werkstoff der Welle bzw. des Innenteils — bestimmt dessen Wärmeausdehnung.\nDaumenwerte α (10⁻⁶/K): Stahl ≈ 11,5 · austenitischer Edelstahl ≈ 16 · Alu ≈ 23.\nDehnt sich die Welle stärker als das Bohrungsteil (z. B. Alu-Welle in Stahlbuchse), wird das Spiel beim Erwärmen kleiner — Klemmgefahr prüfen.',
        fh_oaEnable: 'Berücksichtigt die Rautiefe Rz beider Oberflächen:\n• Spielpassung: Rauspitzen zehren am nutzbaren Spiel → wirksames Kleinstspiel und Schmierspalt-Prüfung.\n• Presspassung: Rauspitzen werden beim Fügen eingeebnet → Übermaßverlust (wichtig für den Pressverband).\nEinschalten, wenn diese Praxis-Effekte mitgerechnet werden sollen — für eine Pressverband-Rechnung ohnehin empfohlen.',
        fh_oaRzHole: 'Gemittelte Rautiefe Rz der Bohrungsfläche in µm — steht als Oberflächenangabe auf der Zeichnung.\nTypisch je Verfahren: Schleifen/Honen 1–4 · Reiben 4–10 · Feinbohren 6,3–16 · Bohren/Drehen 16–63.\nFaustregel: Rz höchstens T/5 der Maßtoleranz — bei H7 an Ø50 (25 µm) also Rz ≤ 5 µm → Feinbearbeitung nötig.',
        fh_oaRzShaft: 'Gemittelte Rautiefe Rz der Wellenfläche in µm — steht als Oberflächenangabe auf der Zeichnung.\nTypisch je Verfahren: Schleifen 1–4 · Feindrehen 6,3–16 · Drehen 16–63.\nFaustregel: Rz höchstens T/5 der Maßtoleranz — bei g6 an Ø50 (16 µm) also Rz ≈ 3 µm → meist Schleifen.'
      },
      en: {
        fh_fFit: 'Type the complete fit in one go — e.g. "50 H7/g6", "Ø50 H7-g6" or just "50 H7". Capital letter = hole, lower-case = shaft. The fields below follow automatically and stay in sync with this field.\nRange: nominal size 1–500 mm (ISO 286 table).\nTip: "50 H7/g6" is a proven example to try — an easy-running fit.',
        fh_fNominal: 'Common starting size of hole and shaft — the number before the tolerance code on the drawing (the 50 in "Ø50 H7/g6"). All permitted deviations are measured from this size.\nRange: 1–500 mm (tabulated ISO 286 values).\nGood to know: the larger the nominal size, the larger the tolerance of the same IT grade — the standard intends this.',
        fh_fSystem: 'Defines which part gets the fixed "zero position":\n• Hole basis — hole is always H, the fit is controlled via the shaft. Standard in mechanical engineering because hole tools (e.g. reamers) come in fixed sizes.\n• Shaft basis — shaft is always h; useful e.g. for bright-drawn shaft material carrying several parts.\n• Free — both sides freely selectable (special cases).\nRecommendation: when in doubt, hole basis — most of mechanical engineering works this way.',
        fh_fHole: 'Tolerance class of the hole. The letter sets the position of the tolerance zone relative to the zero line (H starts exactly at the zero line — that is why H is the usual choice), the IT number sets its size: smaller number = tighter = more precise = more expensive.\nCommon values: H7 for normal fit bores (reamed/fine-bored) · H8 for plain bearings · H6 for high-precision guides.\nRecommendation: choose H7 and control the fit character via the shaft.',
        fh_fShaft: 'Tolerance class of the shaft. Lower-case letter = position relative to the zero line (h ends exactly at the zero line; towards a it gets looser, towards z tighter), IT number = size of the tolerance zone.\nTypical partners for H7: g6 easy-running guide · h6 sliding fit · js6/k6 play-free location · n6/p6 tight fit · s6 press fit.\nRule of thumb: shaft one IT grade finer than the hole (H7 + g6) — outer surfaces are easier to machine precisely than bores.',
        fh_ffNominal: 'Length or diameter of the dimension the ISO 2768 general tolerance shall apply to — i.e. a dimension without its own tolerance on the drawing.\nRange: 0.5–4000 mm (table ranges of the standard).\nNote: for dimensions below 0.5 mm the standard requires a direct tolerance at the dimension itself.',
        fh_ffClass: 'Tolerance class of the ISO 2768-1 general tolerances — applies globally to all dimensions without their own tolerance:\n• f (fine) — precision mechanics, ground parts\n• m (medium) — normal mechanical engineering, standard on most drawings\n• c (coarse) — welded structures, flame-cut parts\n• v (very coarse) — cast and forged blanks\nRecommendation: "m" unless the drawing title block says otherwise (common entry: "ISO 2768-m").',
        fh_thEnable: 'All ISO tolerances apply at 20 °C (DIN EN ISO 1). If the pairing runs hotter or colder, hole part and shaft expand differently — the clearance can grow, shrink or even flip (clearance becomes jamming).\nSwitch on if the operating temperature clearly differs from 20 °C — as a rule of thumb from about ±20 K, with mixed materials (e.g. steel shaft in aluminium housing) even earlier.',
        fh_thTemp: 'Common operating temperature of both parts in the settled (steady) state.\nTypical values: gearbox 60–90 °C · electric-motor housing 40–80 °C · engine environment 100–150 °C · outdoor/refrigeration down to −40 °C.\nNote: with fast temperature changes (faster than about 10 K/min) the transient states are more critical than the steady state calculated here.',
        fh_thMatHole: 'Material of the part containing the hole (housing, hub, bushing) — it determines how much the bore widens with temperature.\nRule-of-thumb α (10⁻⁶/K): steel ≈ 11.5 · grey cast iron ≈ 10 · aluminium ≈ 23 · brass ≈ 19.\nWhat matters is the difference to the shaft: an aluminium housing around a steel shaft clearly increases the clearance when heated.',
        fh_thMatShaft: 'Material of the shaft or inner part — determines its thermal expansion.\nRule-of-thumb α (10⁻⁶/K): steel ≈ 11.5 · austenitic stainless steel ≈ 16 · aluminium ≈ 23.\nIf the shaft expands more than the hole part (e.g. aluminium shaft in a steel bushing), the clearance shrinks when heated — check for jamming.',
        fh_oaEnable: 'Takes the surface roughness Rz of both surfaces into account:\n• Clearance fit: roughness peaks eat into the usable clearance → effective minimum clearance and lubrication-gap check.\n• Interference fit: roughness peaks are flattened during joining → loss of interference (important for the press fit).\nSwitch on if these practical effects shall be included — recommended anyway for a press-fit calculation.',
        fh_oaRzHole: 'Mean roughness depth Rz of the bore surface in µm — given as the surface symbol on the drawing.\nTypical per process: grinding/honing 1–4 · reaming 4–10 · fine boring 6.3–16 · drilling/turning 16–63.\nRule of thumb: Rz at most T/5 of the size tolerance — for H7 at Ø50 (25 µm) that means Rz ≤ 5 µm → fine machining required.',
        fh_oaRzShaft: 'Mean roughness depth Rz of the shaft surface in µm — given as the surface symbol on the drawing.\nTypical per process: grinding 1–4 · fine turning 6.3–16 · turning 16–63.\nRule of thumb: Rz at most T/5 of the size tolerance — for g6 at Ø50 (16 µm) that means Rz ≈ 3 µm → usually grinding.'
      },
      pt: {
        fh_fFit: 'Digite o ajuste completo de uma vez — p. ex. "50 H7/g6", "Ø50 H7-g6" ou só "50 H7". Letra maiúscula = furo, minúscula = eixo. Os campos abaixo se ajustam automaticamente e ficam sincronizados com este campo.\nFaixa: dimensão nominal 1–500 mm (tabela ISO 286).\nDica: "50 H7/g6" é um exemplo consagrado para experimentar — uma guia de giro leve.',
        fh_fNominal: 'Dimensão de partida comum de furo e eixo — o número antes do código de tolerância no desenho (o 50 em "Ø50 H7/g6"). Os desvios permitidos são contados a partir desta dimensão.\nFaixa: 1–500 mm (valores tabelados da ISO 286).\nBom saber: quanto maior a dimensão nominal, maior a tolerância do mesmo grau IT — a norma prevê isso de propósito.',
        fh_fSystem: 'Define qual peça recebe a "posição zero" fixa:\n• Furo-base — furo sempre H, o ajuste é controlado pelo eixo. Padrão na mecânica, pois ferramentas de furo (p. ex. alargadores) têm medidas fixas.\n• Eixo-base — eixo sempre h; útil p. ex. com material de eixo trefilado que recebe várias peças.\n• Livre — ambos os lados livres (casos especiais).\nRecomendação: na dúvida, furo-base — a maior parte da mecânica trabalha assim.',
        fh_fHole: 'Classe de tolerância do furo. A letra define a posição do campo de tolerância em relação à linha zero (H começa exatamente na linha zero — por isso H é a escolha usual), o número IT define o tamanho: número menor = mais estreito = mais preciso = mais caro.\nValores usuais: H7 para furos de ajuste normais (alargados/mandrilados finos) · H8 para mancais de deslizamento · H6 para guias de alta precisão.\nRecomendação: escolher H7 e controlar o caráter do ajuste pelo eixo.',
        fh_fShaft: 'Classe de tolerância do eixo. Letra minúscula = posição em relação à linha zero (h termina exatamente na linha zero; em direção a “a” fica mais folgado, em direção a “z” mais apertado), número IT = tamanho do campo.\nParceiros típicos do H7: g6 guia de giro leve · h6 ajuste deslizante · js6/k6 centragem sem folga · n6/p6 assento firme · s6 ajuste prensado.\nRegra prática: eixo um grau IT mais fino que o furo (H7 + g6) — superfícies externas são mais fáceis de usinar com precisão do que furos.',
        fh_ffNominal: 'Comprimento ou diâmetro da cota à qual a tolerância geral ISO 2768 deve se aplicar — ou seja, uma cota sem tolerância própria no desenho.\nFaixa: 0,5–4000 mm (faixas da tabela da norma).\nNota: para cotas abaixo de 0,5 mm a norma exige tolerância indicada diretamente na cota.',
        fh_ffClass: 'Classe de tolerância das tolerâncias gerais ISO 2768-1 — vale globalmente para todas as cotas sem tolerância própria:\n• f (fina) — mecânica de precisão, peças retificadas\n• m (média) — mecânica normal, padrão na maioria dos desenhos\n• c (grosseira) — estruturas soldadas, peças oxicortadas\n• v (muito grosseira) — brutos fundidos e forjados\nRecomendação: "m", se a legenda do desenho não disser outra coisa (usual: "ISO 2768-m").',
        fh_thEnable: 'Todas as tolerâncias ISO valem a 20 °C (DIN EN ISO 1). Se o par trabalha mais quente ou mais frio, a peça do furo e o eixo dilatam de forma diferente — a folga pode crescer, encolher ou até inverter (folga vira travamento).\nAtivar quando a temperatura de operação difere claramente de 20 °C — como regra a partir de ±20 K; com mistura de materiais (p. ex. eixo de aço em carcaça de alumínio) ainda antes.',
        fh_thTemp: 'Temperatura de operação comum das duas peças em regime permanente (estacionário).\nValores típicos: redutor 60–90 °C · carcaça de motor elétrico 40–80 °C · ambiente de motor 100–150 °C · uso externo/refrigeração até −40 °C.\nNota: com mudanças rápidas de temperatura (mais rápidas que ~10 K/min) os estados transitórios são mais críticos que o regime aqui calculado.',
        fh_thMatHole: 'Material da peça com o furo (carcaça, cubo, bucha) — determina quanto o furo se alarga com a temperatura.\nValores de bolso α (10⁻⁶/K): aço ≈ 11,5 · ferro fundido cinzento ≈ 10 · alumínio ≈ 23 · latão ≈ 19.\nDecisivo é a diferença para o eixo: carcaça de alumínio em volta de eixo de aço aumenta bem a folga ao aquecer.',
        fh_thMatShaft: 'Material do eixo ou da peça interna — determina sua dilatação térmica.\nValores de bolso α (10⁻⁶/K): aço ≈ 11,5 · inox austenítico ≈ 16 · alumínio ≈ 23.\nSe o eixo dilata mais que a peça do furo (p. ex. eixo de alumínio em bucha de aço), a folga diminui ao aquecer — verificar risco de travamento.',
        fh_oaEnable: 'Considera a rugosidade Rz das duas superfícies:\n• Ajuste com folga: os picos de rugosidade consomem parte da folga útil → folga mínima efetiva e verificação da fresta de lubrificação.\n• Ajuste prensado: os picos são aplainados na montagem → perda de interferência (importante para o ajuste prensado).\nAtivar quando esses efeitos práticos devem entrar no cálculo — de todo modo recomendado para cálculo de ajuste prensado.',
        fh_oaRzHole: 'Rugosidade média Rz da superfície do furo em µm — consta como símbolo de superfície no desenho.\nTípico por processo: retífica/brunimento 1–4 · alargamento 4–10 · mandrilamento fino 6,3–16 · furação/torneamento 16–63.\nRegra prática: Rz no máximo T/5 da tolerância — para H7 em Ø50 (25 µm) isso dá Rz ≤ 5 µm → exige acabamento fino.',
        fh_oaRzShaft: 'Rugosidade média Rz da superfície do eixo em µm — consta como símbolo de superfície no desenho.\nTípico por processo: retífica 1–4 · torneamento fino 6,3–16 · torneamento 16–63.\nRegra prática: Rz no máximo T/5 da tolerância — para g6 em Ø50 (16 µm) isso dá Rz ≈ 3 µm → geralmente retífica.'
      }
    };
    ['de', 'en', 'pt'].forEach(function (l) { for (var k in s[l]) STR[l][k] = s[l][k]; });
  })();

  /* ======================================================================= *
   * 2) Zustand + kleine Helfer
   * ======================================================================= */
  var lang = localStorage.getItem('dtp-lang') || 'de';
  var mode = localStorage.getItem('dtp-mode') || 'fit';   // 'fit' | 'freiform'
  var thEnabled = localStorage.getItem('dtp-th-on') === '1';
  var thT = parseFloat(localStorage.getItem('dtp-th-t'));  if (isNaN(thT)) thT = 80;
  var thHole = localStorage.getItem('dtp-th-hole') || 'steel';
  var thShaft = localStorage.getItem('dtp-th-shaft') || 'alu';
  var oaEnabled = localStorage.getItem('dtp-oa-on') === '1';
  var rzHole = parseFloat(localStorage.getItem('dtp-oa-rzh'));  if (isNaN(rzHole)) rzHole = 3.2;
  var rzShaft = parseFloat(localStorage.getItem('dtp-oa-rzs')); if (isNaN(rzShaft)) rzShaft = 1.6;
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
  function fmtNum(x) { return decComma(String(x)); }

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
  var elFfNominal, elFfClass;
  var elThEnable, elThT, elThHole, elThShaft, elThBox;
  var FFCLASSES = ['f', 'm', 'c', 'v'];

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

  /* B10a — rechtsbündiger Laien-ⓘ-Knopf + aufklappbare Sprechblase je Feld
     (Muster von DT-ProfiSchraube: help-btn in der Labelzeile, Text darunter).
     labelRow: Zeile, in der der Knopf rechts sitzt · container: erhält die Sprechblase. */
  function attachFieldHelp(labelRow, container, helpKey, labelKey) {
    if (!helpKey) return;
    var hb = el('button', 'help-btn', 'i'); hb.type = 'button';
    hb.setAttribute('data-i18n-aria', labelKey || helpKey);
    hb.setAttribute('aria-label', t(labelKey || helpKey));
    hb.setAttribute('aria-expanded', 'false');
    var bub = el('div', 'field-help'); bub.hidden = true;
    bub.setAttribute('data-i18n', helpKey); bub.textContent = t(helpKey);
    hb.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      markTipsSeen();
      bub.hidden = !bub.hidden;
      hb.setAttribute('aria-expanded', bub.hidden ? 'false' : 'true');
    });
    labelRow.appendChild(hb);
    container.appendChild(bub);
  }

  function labeledField(labelKey, unitKey, control, hintKey, helpKey) {
    var f = el('div', 'field');
    var lab = el('div', 'field-label');
    var lb = el('label'); lb.setAttribute('data-i18n', labelKey); lb.textContent = t(labelKey);
    lab.appendChild(lb);
    if (unitKey) { var u = el('span', 'unit'); u.setAttribute('data-i18n', unitKey); u.textContent = t(unitKey); lab.appendChild(u); }
    f.appendChild(lab);
    f.appendChild(control);
    if (hintKey) { var h = el('div', 'field-hint'); h.setAttribute('data-i18n', hintKey); h.textContent = t(hintKey); f.appendChild(h); }
    attachFieldHelp(lab, f, helpKey, labelKey);
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
    host.appendChild(buildModeSwitch());
    if (mode === 'freiform') { buildFreiformFormInner(); return; }
    buildFitFormInner();
  }

  function buildModeSwitch() {
    var seg = el('div', 'mode-switch'); seg.setAttribute('role', 'tablist');
    [['fit', 'modeFit'], ['freiform', 'modeFreiform']].forEach(function (pair) {
      var b = el('button', 'mode-btn' + (mode === pair[0] ? ' active' : ''), t(pair[1]));
      b.type = 'button'; b.setAttribute('data-mode', pair[0]);
      b.setAttribute('data-i18n', pair[1]); b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', mode === pair[0] ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (mode === pair[0]) return;
        mode = pair[0];
        try { localStorage.setItem('dtp-mode', mode); } catch (e) {}
        buildForm();
        var psx = document.getElementById('presetSel'); if (psx) fillPresets(psx);
        run();
      });
      seg.appendChild(b);
    });
    return seg;
  }

  function buildFitFormInner() {
    // Kurzeingabe (Parser): „Ø50 H7/g6" direkt tippen
    elFit = el('input'); elFit.type = 'text'; elFit.className = 'num fit-input';
    elFit.setAttribute('autocapitalize', 'characters'); elFit.setAttribute('spellcheck', 'false');
    elFit.setAttribute('data-i18n-ph', 'fFitPh'); elFit.placeholder = t('fFitPh');
    var gf = el('div', 'group-fields');
    var ff = labeledField('fFit', null, elFit, 'fFitHint', 'fh_fFit');
    elFitMsg = el('div', 'field-msg error'); elFitMsg.hidden = true; ff.appendChild(elFitMsg);
    gf.appendChild(ff);
    host.appendChild(gf);
    elFit.addEventListener('input', onFitInput);

    // Nennmaß + System
    elNominal = el('input'); elNominal.type = 'number'; elNominal.className = 'num';
    elNominal.min = '1'; elNominal.max = '500'; elNominal.step = 'any'; elNominal.value = '50';
    elSystem = selectFrom(['EB', 'EW', 'FREE'], function (v) { return v === 'EB' ? t('sysEB') : v === 'EW' ? t('sysEW') : t('sysFree'); });

    var g1 = el('div', 'group-fields');
    g1.appendChild(labeledField('fNominal', 'unit_mm', elNominal, 'hintNominal', 'fh_fNominal'));
    g1.appendChild(labeledField('fSystem', null, elSystem, 'hintSystem', 'fh_fSystem'));
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
    g2.appendChild(labeledField('fHole', null, pairControl(elHoleL, elHoleG), null, 'fh_fHole'));
    g2.appendChild(labeledField('fShaft', null, pairControl(elShaftL, elShaftG), null, 'fh_fShaft'));
    host.appendChild(g2);

    host.appendChild(buildThermikSection());
    host.appendChild(buildOberflaecheSection());

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

  function buildFreiformFormInner() {
    elFfNominal = el('input'); elFfNominal.type = 'number'; elFfNominal.className = 'num';
    elFfNominal.min = '0.5'; elFfNominal.max = '4000'; elFfNominal.step = 'any'; elFfNominal.value = '50';
    elFfClass = selectFrom(FFCLASSES, function (c) { return c + ' – ' + t('ffClass_' + c); });
    elFfClass.value = 'm';
    var g = el('div', 'group-fields');
    g.appendChild(labeledField('fNominal', 'unit_mm', elFfNominal, 'hintFfNominal', 'fh_ffNominal'));
    g.appendChild(labeledField('ffClass', null, elFfClass, 'hintFfClass', 'fh_ffClass'));
    host.appendChild(g);
    [elFfNominal, elFfClass].forEach(function (c) { c.addEventListener('input', run); c.addEventListener('change', run); });
  }

  function matSelect(value) {
    var sel = el('select');
    (TH ? TH.MAT_ORDER : []).forEach(function (key) {
      var o = el('option', null, TH.MAT[key].label[lang] || TH.MAT[key].label.de);
      o.value = key; sel.appendChild(o);
    });
    sel.value = value;
    return sel;
  }

  function persistThermik() {
    try {
      localStorage.setItem('dtp-th-on', thEnabled ? '1' : '0');
      localStorage.setItem('dtp-th-t', String(thT));
      localStorage.setItem('dtp-th-hole', thHole);
      localStorage.setItem('dtp-th-shaft', thShaft);
    } catch (e) {}
  }

  /* Optionaler „Betrieb (Thermik)"-Bereich: Betriebstemperatur + Werkstoffe. */
  function buildThermikSection() {
    var box = el('div', 'thermik-box');
    var headRow = el('div', 'thermik-head-row');
    var head = el('label', 'thermik-head');
    elThEnable = el('input'); elThEnable.type = 'checkbox'; elThEnable.checked = thEnabled;
    head.appendChild(elThEnable);
    var ht = el('span'); ht.setAttribute('data-i18n', 'thEnable'); ht.textContent = t('thEnable'); head.appendChild(ht);
    headRow.appendChild(head);
    box.appendChild(headRow);
    attachFieldHelp(headRow, box, 'fh_thEnable', 'thEnable');

    elThBox = el('div', 'thermik-fields'); elThBox.hidden = !thEnabled;
    elThT = el('input'); elThT.type = 'number'; elThT.className = 'num'; elThT.step = 'any'; elThT.value = String(thT);
    elThHole = matSelect(thHole);
    elThShaft = matSelect(thShaft);
    var g = el('div', 'group-fields');
    g.appendChild(labeledField('thTemp', 'unit_c', elThT, null, 'fh_thTemp'));
    elThBox.appendChild(g);
    var g2 = el('div', 'group-fields');
    g2.appendChild(labeledField('thMatHole', null, elThHole, null, 'fh_thMatHole'));
    g2.appendChild(labeledField('thMatShaft', null, elThShaft, null, 'fh_thMatShaft'));
    elThBox.appendChild(g2);
    box.appendChild(elThBox);

    elThEnable.addEventListener('change', function () {
      thEnabled = elThEnable.checked; elThBox.hidden = !thEnabled; persistThermik(); recalc();
    });
    elThT.addEventListener('input', function () { var v = parseFloat(String(elThT.value).replace(',', '.')); if (!isNaN(v)) thT = v; persistThermik(); recalc(); });
    elThHole.addEventListener('change', function () { thHole = elThHole.value; persistThermik(); recalc(); });
    elThShaft.addEventListener('change', function () { thShaft = elThShaft.value; persistThermik(); recalc(); });
    return box;
  }

  function persistOberflaeche() {
    try {
      localStorage.setItem('dtp-oa-on', oaEnabled ? '1' : '0');
      localStorage.setItem('dtp-oa-rzh', String(rzHole));
      localStorage.setItem('dtp-oa-rzs', String(rzShaft));
    } catch (e) {}
  }

  /* Optionaler „Oberfläche (Rz)"-Bereich: Rautiefe Bohrung/Welle für F6/F9. */
  function buildOberflaecheSection() {
    var elOaEnable, elOaBox, elRzHole, elRzShaft;
    var box = el('div', 'thermik-box');
    var headRow = el('div', 'thermik-head-row');
    var head = el('label', 'thermik-head');
    elOaEnable = el('input'); elOaEnable.type = 'checkbox'; elOaEnable.checked = oaEnabled;
    head.appendChild(elOaEnable);
    var ht = el('span'); ht.setAttribute('data-i18n', 'oaEnable'); ht.textContent = t('oaEnable'); head.appendChild(ht);
    headRow.appendChild(head);
    box.appendChild(headRow);
    attachFieldHelp(headRow, box, 'fh_oaEnable', 'oaEnable');

    elOaBox = el('div', 'thermik-fields'); elOaBox.hidden = !oaEnabled;
    elRzHole = el('input'); elRzHole.type = 'number'; elRzHole.className = 'num'; elRzHole.step = 'any'; elRzHole.min = '0'; elRzHole.value = String(rzHole);
    elRzShaft = el('input'); elRzShaft.type = 'number'; elRzShaft.className = 'num'; elRzShaft.step = 'any'; elRzShaft.min = '0'; elRzShaft.value = String(rzShaft);
    var g = el('div', 'group-fields');
    g.appendChild(labeledField('oaRzHole', 'unit_um', elRzHole, null, 'fh_oaRzHole'));
    g.appendChild(labeledField('oaRzShaft', 'unit_um', elRzShaft, null, 'fh_oaRzShaft'));
    elOaBox.appendChild(g);
    box.appendChild(elOaBox);

    elOaEnable.addEventListener('change', function () {
      oaEnabled = elOaEnable.checked; elOaBox.hidden = !oaEnabled; persistOberflaeche(); recalc();
    });
    elRzHole.addEventListener('input', function () { var v = parseFloat(String(elRzHole.value).replace(',', '.')); if (!isNaN(v) && v >= 0) rzHole = v; persistOberflaeche(); recalc(); });
    elRzShaft.addEventListener('input', function () { var v = parseFloat(String(elRzShaft.value).replace(',', '.')); if (!isNaN(v) && v >= 0) rzShaft = v; persistOberflaeche(); recalc(); });
    return box;
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
    if (mode !== 'fit' || !elFit) return;
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
    if (mode === 'freiform') return runFreiform();
    return runFit();
  }

  function runFit() {
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

  function runFreiform() {
    if (!FF) { resultHost.textContent = 'DTPFreiform nicht geladen.'; return; }
    var n = parseFloat(String(elFfNominal.value).replace(',', '.'));
    if (isNaN(n)) { renderIncomplete(['fNominal']); return; }
    var res = FF.general(n, elFfClass.value);
    if (res.ok) renderFreiform(res); else renderFreiformError(res);
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

    renderThermik(res);
    renderBeratung(res);
    // Rechenweg als Nachweis: Passung (+ Thermik, falls aktiv).
    var groups = [{ data: window.DTPRechenweg.build(res, rwFmt()) }];
    if (thEnabled && TH && TH.MAT[thHole] && TH.MAT[thShaft]) {
      var thr = TH.compute(res, { alphaHole: TH.MAT[thHole].alpha, alphaShaft: TH.MAT[thShaft].alpha, T: thT });
      if (thr.ok) { groups[0].titleKey = 'modeFit'; groups.push({ titleKey: 'thHeading', data: window.DTPRechenweg.buildThermik(res, thr, rwFmt()) }); }
    }
    if (oaEnabled && window.DTPRechenweg.buildOberflaeche) {
      if (!groups[0].titleKey) groups[0].titleKey = 'modeFit';
      groups.push({ titleKey: 'brSurfLubeHeading', data: window.DTPRechenweg.buildOberflaeche(res, { RzB: rzHole, RzW: rzShaft }, rwFmt()) });
    }
    renderRechenweg(groups);
    renderViz(res);
  }

  /* Thermik-Ergebnis (B8): Passung bei Betriebstemperatur + Umschlag-Warnung. */
  function renderThermik(res) {
    if (!thEnabled || !TH || !TH.compute) return;
    var mh = TH.MAT[thHole], ms = TH.MAT[thShaft];
    if (!mh || !ms) return;
    var r = TH.compute(res, { alphaHole: mh.alpha, alphaShaft: ms.alpha, T: thT });
    if (!r.ok) return;

    var box = el('div', 'thermik-result');
    var head = el('div', 'th-head');
    head.appendChild(el('span', 'th-title', t('thHeading')));
    head.appendChild(el('span', 'th-at', t('thAt') + ' ' + fmtNum(r.T) + ' °C'));
    box.appendChild(head);

    // Umschlag-Warnung (falls Passungsart wechselt):
    if (r.umschlag) {
      var w = el('div', 'th-umschlag');
      w.appendChild(el('span', 'th-uic', '⚠'));
      w.appendChild(el('span', null, t('thUmschlag') + ': ' + t('art' + r.art20) + ' → ' + t('art' + r.artT)));
      box.appendChild(w);
    }

    // Spiel/Übermaß bei T als Bereich:
    var line = el('div', 'th-line');
    var label = r.artT === 'UEBERMASS' ? t('rInterMax') : t('rClearMax');
    // Bereich PSminT … PSmaxT (µm), vorzeichenrichtig:
    line.appendChild(el('span', 'th-k', t('art' + r.artT)));
    var v = el('span', 'th-v'); v.textContent = sgn(r.PSminT) + ' … ' + sgn(r.PSmaxT) + ' µm'; line.appendChild(v);
    box.appendChild(line);

    // ΔS-Zeile:
    var ds = el('div', 'th-ds');
    ds.textContent = 'ΔS = ' + sgn(r.dS) + ' µm  ·  ' + t('thVs20') + '  ·  '
      + mh.label[lang] + ' (α ' + fmtNum(mh.alpha) + ') / ' + ms.label[lang] + ' (α ' + fmtNum(ms.alpha) + ')';
    box.appendChild(ds);

    resultHost.appendChild(box);
  }

  /* Beratung (B9): Kostenampel + Messmittel-Empfehlung (Richtwerte, sprachneutrale
   * Codes aus beratung.js → hier übersetzt). Erscheint im Passungs-Ergebnis. */
  function renderBeratung(res) {
    var BR = window.DTPBeratung;
    if (!BR || !BR.costTraffic) return;
    var i = res.input;
    var box = el('div', 'beratung-result');
    box.appendChild(el('div', 'br-title', t('brHeading')));

    // — Kostenampel (Verfahren ↔ IT) —
    box.appendChild(el('div', 'br-sub', t('brCostTitle')));
    [['fHole', i.hole], ['fShaft', i.shaft]].forEach(function (p) {
      var c = BR.costTraffic(p[1].grade);
      var row = el('div', 'br-cost-row');
      row.appendChild(el('span', 'br-dot ' + (c.tier || ''), ''));
      row.appendChild(el('span', 'br-part', t(p[0]) + ' ' + p[1].letter + p[1].grade));
      row.appendChild(el('span', 'br-cost-txt', t('cost' + String(c.tier || '').toUpperCase())));
      box.appendChild(row);
      if (c.processes.length) {
        box.appendChild(el('div', 'br-proc',
          t('brProcesses') + ': ' + c.processes.map(function (k) { return t('proc' + k); }).join(', ')));
      }
    });

    // — Messmittel (goldene Regel U ≤ T/10) —
    box.appendChild(el('div', 'br-sub', t('brMeasTitle')));
    [['fHole', res.hole], ['fShaft', res.shaft]].forEach(function (p) {
      var T = p[1].upper - p[1].lower;
      var m = BR.measurement(T);
      box.appendChild(el('div', 'br-meas-head',
        t(p[0]) + ': T = ' + fmtNum(T) + ' µm  →  U ≤ ' + fmtNum(Math.round(m.uGoldenUm * 10) / 10) + ' µm'));
      var chips = el('div', 'br-instr');
      m.instruments.forEach(function (x) {
        var cls = 'br-chip ' + (x.suitable ? (x.golden ? 'ok ideal' : 'ok') : 'no');
        var mark = x.suitable ? (x.golden ? ' ✓★' : ' ✓') : ' ✗';
        var chip = el('span', cls, t('instr' + x.key) + mark);
        if (x.golden) chip.title = t('brIdeal');
        chips.appendChild(chip);
      });
      box.appendChild(chips);
    });

    // — Oberfläche (F6) + Schmierspalt (F9): nur wenn Rz-Sektion aktiviert —
    if (oaEnabled && BR.surface) renderSurfaceLube(box, res);

    resultHost.appendChild(box);
  }

  /* Oberflächen- + Schmierspalt-Panel (F6/F9) mit transparenten Faustformeln. */
  function renderSurfaceLube(box, res) {
    function r1(x) { return Math.round(x * 10) / 10; }
    var BR = window.DTPBeratung;
    var su = BR.surface(res, { RzB: rzHole, RzW: rzShaft });

    box.appendChild(el('div', 'br-sub', t('brSurfTitle')));
    [['fHole', su.hole, rzHole], ['fShaft', su.shaft, rzShaft]].forEach(function (p) {
      var st = p[1].stage;
      var row = el('div', 'br-surf-row');
      row.appendChild(el('span', 'br-badge surf-' + st, t('surf' + st.toUpperCase())));
      row.appendChild(el('span', 'br-part', t(p[0]) + ': Rz ' + fmtNum(p[2]) + ' µm'));
      row.appendChild(el('span', 'br-surf-txt', t('brIdealMax') + ' ' + fmtNum(r1(p[1].RzMaxOkUm))
        + ' µm · ' + t('brForm') + ' ' + fmtNum(r1(p[1].formMaxUm)) + ' µm'));
      box.appendChild(row);
    });

    var e = su.effective;
    if (e.kind !== 'none') {
      var lbl = e.kind === 'clearance' ? t('brSwirk') : t('brUwirk');
      box.appendChild(el('div', 'br-eff',
        lbl + ' ≈ ' + fmtNum(e.baseUm) + ' − ' + fmtNum(e.factor) + '·ΣRz = ' + fmtNum(r1(e.effUm)) + ' µm'));
      if (e.code === 'CLEAR_LOSS' || e.code === 'PRESS_LOSS') box.appendChild(el('div', 'br-warn', '⚠ ' + t(e.code)));
    }

    box.appendChild(el('div', 'br-sub', t('brLubeTitle')));
    var lu = BR.lubrication(res, { RzB: rzHole, RzW: rzShaft });
    if (lu.applies) {
      box.appendChild(el('div', 'br-lube',
        'ΣRz ' + fmtNum(r1(lu.RzSumUm)) + ' µm ' + (lu.ok ? '≤' : '>') + ' S_min/3 ' + fmtNum(r1(lu.thresholdUm))
        + ' µm · ' + t('brGap') + ' ≈ ' + fmtNum(r1(lu.gapWirkUm)) + ' µm'));
      box.appendChild(el('div', lu.ok ? 'br-ok' : 'br-warn', (lu.ok ? '✓ ' + t('brLubeOk') : '⚠ ' + t('HINT_LUBRICATION'))));
    } else {
      box.appendChild(el('div', 'br-lube na', t('brLubeNA')));
    }
  }

  /* Aufklappbarer, selbstprüfender Rechenweg (B6). */
  function rwFmt() { return { um: sgn, umU: fmtUm, mm: fmtMm, n: fmtNum }; }

  /* Aufklappbarer, selbstprüfender Rechenweg — nimmt eine oder mehrere Gruppen
   * [{ titleKey?, data:{steps,allOk} }]. So erscheint JEDE Berechnung als Nachweis. */
  function renderRechenweg(groups) {
    var RWm = window.DTPRechenweg;
    if (!RWm) return;
    groups = (groups || []).filter(function (g) { return g && g.data && g.data.steps && g.data.steps.length; });
    if (!groups.length) return;
    var allOk = groups.every(function (g) { return g.data.allOk; });
    var multi = groups.length > 1;

    var wrap = el('div', 'rechenweg');
    var btn = el('button', 'rw-toggle'); btn.type = 'button';
    var chev = el('span', 'rw-chev', '▸');
    var cap = el('span', 'rw-cap', t('rwHeading'));
    var badge = el('span', 'rw-allok' + (allOk ? '' : ' bad'), allOk ? '✓ ' + t('rwAllOk') : '✗ ' + t('rwFail'));
    btn.appendChild(chev); btn.appendChild(cap); btn.appendChild(badge);

    var body = el('div', 'rw-body collapsed');
    var idx = 0;
    groups.forEach(function (g) {
      if (multi && g.titleKey) body.appendChild(el('div', 'rw-subhead', t(g.titleKey)));
      g.data.steps.forEach(function (st) {
        idx++;
        var row = el('div', 'rw-step' + (st.ok ? '' : ' bad'));
        row.appendChild(el('span', 'rw-num', String(idx)));
        var main = el('div', 'rw-main');
        main.appendChild(el('div', 'rw-title', t(st.key) + (st.art ? ' — ' + t('art' + st.art) : '')));
        main.appendChild(el('div', 'rw-expr', st.expr));
        row.appendChild(main);
        row.appendChild(el('span', 'rw-check' + (st.ok ? '' : ' bad'), st.ok ? '✓' : '✗'));
        body.appendChild(row);
      });
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

    // Thermik (v1.9.2): Ghost-Lage „bei T °C" berechnen, falls Thermik aktiv.
    var thermal = null, tr = null, dHole = 0, dShaft = 0;
    if (thEnabled && TH && TH.compute && TH.MAT[thHole] && TH.MAT[thShaft]) {
      var mh = TH.MAT[thHole], ms = TH.MAT[thShaft];
      var trc = TH.compute(res, { alphaHole: mh.alpha, alphaShaft: ms.alpha, T: thT });
      if (trc.ok) {
        tr = trc;
        dHole  = Math.round(mh.alpha * tr.dT * tr.nominal / 1000 * 10) / 10;
        dShaft = Math.round(ms.alpha * tr.dT * tr.nominal / 1000 * 10) / 10;
        thermal = { dS: tr.dS };
      }
    }

    vizHost.appendChild(SB.svg(res, {
      hole: i.hole.letter + i.hole.grade,
      shaft: i.shaft.letter + i.shaft.grade,
      unit: t('unit_um')
    }, thermal));

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
    // Thermik-Chips (v1.9.2): gleiche Farben wie die Ghosts; δ je Bauteil.
    if (thermal && tr) {
      leg.appendChild(chip('therm-bore', t('vizBore') + ' ' + t('thAt') + ' ' + fmtNum(tr.T) + ' °C',
        'δ ' + sgn(dHole) + ' µm', 'vizThermBoreHelp'));
      leg.appendChild(chip('therm-shaft', t('vizShaft') + ' ' + t('thAt') + ' ' + fmtNum(tr.T) + ' °C',
        'δ ' + sgn(dShaft) + ' µm', 'vizThermShaftHelp'));
    }
    vizHost.appendChild(leg);
    vizHost.appendChild(el('div', 'viz-zero-note', t('vizZero')));
    // Thermik-Notiz: ΔS gegenüber 20 °C, plus Umschlag-Hinweis falls zutreffend.
    if (thermal && tr) {
      var tn = 'ΔS = ' + sgn(tr.dS) + ' µm · ' + t('thVs20');
      if (tr.umschlag) tn += ' · ' + t('thUmschlag') + ': ' + t('art' + tr.art20) + ' → ' + t('art' + tr.artT);
      vizHost.appendChild(el('div', 'viz-therm-note', tn));
    }
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

  /* Freiform (ISO 2768) — Ergebnisanzeige. */
  function renderFreiform(res) {
    resultHost.textContent = '';
    var i = res.input;
    var echo = el('div', 'fit-echo');
    echo.textContent = 'Ø' + (Number.isInteger(i.nominal) ? i.nominal : fmtMm(i.nominal)) + ' ISO 2768-' + i.cls;
    echo.style.marginBottom = '12px';
    resultHost.appendChild(echo);

    var banner = el('div', 'verdict-banner pa-spiel');
    banner.appendChild(el('span', 'vb-dot', '▬'));
    var body = el('div', 'vb-body');
    body.appendChild(el('span', 'vb-text', t('ffClass_' + i.cls) + ' (ISO 2768-' + i.cls + ')'));
    body.appendChild(el('span', 'vb-note', t('ffRange') + ' ' + fmtMm(res.range.low) + '…' + fmtMm(res.range.high) + ' mm'));
    banner.appendChild(body);
    resultHost.appendChild(banner);

    var grid = el('div', 'safety-grid');
    grid.appendChild(card('rFfDev', '±' + fmtMm(res.dev), 'unit_mm', 'ok'));
    grid.appendChild(card('rTol', fmtMm(res.tol), 'unit_mm'));
    resultHost.appendChild(grid);

    var tbl = el('table', 'kv-table'); tbl.style.marginTop = '8px';
    var cap = el('caption'); cap.textContent = 'ISO 2768-' + i.cls; tbl.appendChild(cap);
    function row(k, valStr, unit) {
      var tr = el('tr');
      var a = el('td', 'k'); a.setAttribute('data-i18n', k); a.textContent = t(k); tr.appendChild(a);
      var b = el('td', 'v'); var sp = el('span'); sp.textContent = valStr; var u = el('span', 'u'); u.textContent = unit; sp.appendChild(u); b.appendChild(sp); tr.appendChild(b);
      return tr;
    }
    tbl.appendChild(row('rUpperDev', '+' + fmtMm(res.dev), 'mm'));
    tbl.appendChild(row('rLowerDev', fmtMm(res.lower), 'mm'));
    tbl.appendChild(row('rMaxSize', fmtMm(res.Go), 'mm'));
    tbl.appendChild(row('rMinSize', fmtMm(res.Gu), 'mm'));
    tbl.appendChild(row('rTol', fmtMm(res.tol) + ' (' + res.tol_um + ' µm)', 'mm'));
    resultHost.appendChild(tbl);

    renderFreiformViz(res);
    if (window.DTPRechenweg && window.DTPRechenweg.buildFreiform)
      renderRechenweg([{ data: window.DTPRechenweg.buildFreiform(res, rwFmt()) }]);
  }

  function renderFreiformError(res) {
    resultHost.textContent = '';
    var banner = el('div', 'verdict-banner bad');
    banner.appendChild(el('span', 'vb-dot', '✕'));
    var b = el('div', 'vb-body');
    b.appendChild(el('span', 'vb-text', msgOf(res)));
    banner.appendChild(b);
    resultHost.appendChild(banner);
    clearViz();
  }

  function renderFreiformViz(res) {
    if (!vizHost) return;
    vizHost.textContent = '';
    var SB = window.DTPSchaubild;
    if (!SB || !SB.svgGeneral) { clearViz(); return; }
    vizHost.appendChild(SB.svgGeneral(res, { label: 'ISO 2768-' + res.input.cls, unit: t('unit_um') }));
    vizHost.appendChild(el('div', 'viz-zero-note', t('vizZero')));
  }

  /* ======================================================================= *
   * 6) Beispiele (Presets aus solver.js)
   * ======================================================================= */
  function fillPresets(sel) {
    sel.textContent = '';
    var first = el('option', null, t('examplePick')); first.value = ''; sel.appendChild(first);
    if (mode === 'freiform') {
      (FF && FF.PRESETS || []).forEach(function (P) {
        var o = el('option', null, P.label || (P.nominal + ' ISO 2768-' + P.cls));
        o.value = 'FF|' + P.nominal + '|' + P.cls; sel.appendChild(o);
      });
    } else {
      (S.PRESETS || []).forEach(function (P) {
        var o = el('option', null, P.fit); o.value = P.fit; sel.appendChild(o);
      });
      (TH && TH.PRESETS || []).forEach(function (P, idx) {
        var o = el('option', null, P.label); o.value = 'TH|' + idx; sel.appendChild(o);
      });
    }
  }
  function applyPreset(str) {
    if (str.indexOf('FF|') === 0) {
      var parts = str.split('|');
      if (mode !== 'freiform') { mode = 'freiform'; try { localStorage.setItem('dtp-mode', mode); } catch (e) {} buildForm(); }
      elFfNominal.value = parts[1]; elFfClass.value = parts[2];
      run(); return;
    }
    if (str.indexOf('TH|') === 0) {
      var P = TH && TH.PRESETS[parseInt(str.split('|')[1], 10)];
      var pt = P && S.parseFit(P.fit); if (!P || !pt || !pt.ok) return;
      if (mode !== 'fit') { mode = 'fit'; try { localStorage.setItem('dtp-mode', mode); } catch (e) {} }
      thEnabled = true; thHole = P.hole; thShaft = P.shaft; thT = P.T; persistThermik();
      buildForm();
      elNominal.value = String(pt.nominal);
      elHoleL.value = pt.hole.letter; elHoleG.value = String(pt.hole.grade);
      elShaftL.value = pt.shaft.letter; elShaftG.value = String(pt.shaft.grade);
      elSystem.value = pt.system || 'FREE';
      recalc(); return;
    }
    var p = S.parseFit(str);
    if (!p || !p.ok) return;
    if (mode !== 'fit') { mode = 'fit'; try { localStorage.setItem('dtp-mode', mode); } catch (e) {} buildForm(); }
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
    document.querySelectorAll('[data-i18n-aria]').forEach(function (n) { n.setAttribute('aria-label', t(n.getAttribute('data-i18n-aria'))); });
    // dynamische Selektoren (System-Optionen, Beispielliste):
    if (elSystem && elSystem.options.length >= 3) {
      elSystem.options[0].textContent = t('sysEB');
      elSystem.options[1].textContent = t('sysEW');
      elSystem.options[2].textContent = t('sysFree');
    }
    if (mode === 'freiform' && elFfClass && elFfClass.options.length >= 4) {
      FFCLASSES.forEach(function (c, i) { if (elFfClass.options[i]) elFfClass.options[i].textContent = c + ' – ' + t('ffClass_' + c); });
    }
    if (mode === 'fit' && elThHole && TH) {
      TH.MAT_ORDER.forEach(function (key, i) {
        var lab = TH.MAT[key].label[lang] || TH.MAT[key].label.de;
        if (elThHole.options[i]) elThHole.options[i].textContent = lab;
        if (elThShaft.options[i]) elThShaft.options[i].textContent = lab;
      });
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
      if (mode === 'freiform') {
        if (elFfNominal) elFfNominal.value = '';
        run();
        return;
      }
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
