/* ============================================================================
 * DT-ProfiPassung · report.js · Modul DTPReport (Baustein B14)
 * ----------------------------------------------------------------------------
 * Ausgaben & Datei-Austausch. DOM-frei/Node-testbar; das eigentliche
 * Herunterladen/Drucken/Kopieren macht ui.js, hier liegen die REINEN,
 * prüfbaren Bausteine:
 *   • buildModel(ctx)      -> sprachneutrales Datenmodell (Grundlage aller Exporte)
 *   • toDtp(ctx) / fromDtp(text) -> .dtp-Datei (JSON) schreiben/lesen (Round-Trip)
 *   • Gating Test/Voll     -> isFeatureAllowed / GATED_FEATURES
 *   • Lizenznehmer-/Editionszeilen (wie DT-ProfiSchraube)
 * Copy-Text, CAD-Snippet, RTF und CSV folgen in den naechsten B14-Etappen.
 *
 * WICHTIG (Dieters Vorgabe): In der Testversion ist JEDE Ausgabe gesperrt --
 * Speichern, Laden/Oeffnen, Drucken, Copy-Text, CAD-Snippet, RTF, CSV. Der
 * Nutzer kann voll rechnen und alles sehen, aber KEINE Daten uebernehmen. Sichere
 * Voreinstellung: unbekannte/fehlende Edition = Vollversion (erlaubt alles).
 *
 * .dtp-Format: reines JSON mit Kennung + Schema-Version. Enthaelt NUR die
 * Eingaben (Passung/Freiform + aktive Zusatzbereiche) -- die Ergebnisse werden
 * beim Laden neu gerechnet (kein Drift zwischen gespeichertem und gerechnetem
 * Stand). So ist eine .dtp klein, stabil und versionssicher.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(require('./validate.js')); }
  else { root.DTPReport = factory(root.DTPValidate); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (VALID) {
  'use strict';

  var VERSION = '1.0.0-report';
  var DTP_MAGIC = 'DT-ProfiPassung';
  var DTP_SCHEMA = 1;

  function pick(o, lang) { return (o && (o[lang] || o.de)) || ''; }

  var T = {
    appTitle:  { de: 'DT-ProfiPassung', en: 'DT-ProfiPassung', pt: 'DT-ProfiPassung' },
    subtitle:  { de: 'Berechnungsbericht \u2014 Passung & Toleranz nach ISO 286',
                 en: 'Calculation report \u2014 fit & tolerance per ISO 286',
                 pt: 'Relat\u00f3rio de c\u00e1lculo \u2014 ajuste & toler\u00e2ncia conforme ISO 286' },
    labelCap:  { de: 'Bezeichnung', en: 'Designation', pt: 'Designa\u00e7\u00e3o' },
    dateCap:   { de: 'Datum', en: 'Date', pt: 'Data' },
    engineCap: { de: 'Datenstand', en: 'Data version', pt: 'Vers\u00e3o dos dados' },
    licCap:    { de: 'Lizenznehmer', en: 'Licensee', pt: 'Licenciado' },
    licFor:    { de: 'lizenziert f\u00fcr', en: 'licensed to', pt: 'licenciado para' },
    secInput:  { de: 'Eingaben', en: 'Inputs', pt: 'Dados de entrada' },
    secResult: { de: 'Ergebnis', en: 'Result', pt: 'Resultado' },
    secKeyval: { de: 'Kennwerte', en: 'Key values', pt: 'Valores caracter\u00edsticos' },
    secWeg:    { de: 'Rechenweg', en: 'Calculation steps', pt: 'Mem\u00f3ria de c\u00e1lculo' },
    secExtra:  { de: 'Zusatzbereiche', en: 'Additional sections', pt: 'Se\u00e7\u00f5es adicionais' },
    colQty:    { de: 'Gr\u00f6\u00dfe', en: 'Quantity', pt: 'Grandeza' },
    colValue:  { de: 'Wert', en: 'Value', pt: 'Valor' },
    colUnit:   { de: 'Einheit', en: 'Unit', pt: 'Unidade' },
    disclaimer:{ de: 'Berechnung ohne Gew\u00e4hr. Vor Produktivnutzung gegen die Originalnormen (ISO 286, ISO 2768, DIN 7190) pr\u00fcfen. Dieses Dokument ersetzt keine fachtechnische Pr\u00fcfung.',
                 en: 'Calculation without warranty. Verify against the original standards (ISO 286, ISO 2768, DIN 7190) before production use. This document does not replace expert review.',
                 pt: 'C\u00e1lculo sem garantia. Verifique com as normas originais (ISO 286, ISO 2768, DIN 7190) antes de uso produtivo. Este documento n\u00e3o substitui uma an\u00e1lise t\u00e9cnica.' }
  };

  function licenseeName(name) { return name == null ? '' : String(name).replace(/\s+/g, ' ').trim(); }
  function licenseePhrase(name, lang) { var n = licenseeName(name); return n ? (pick(T.licFor, lang) + ' ' + n) : ''; }
  function licenseeField(name, lang) { var n = licenseeName(name); return n ? { label: pick(T.licCap, lang), value: n } : null; }
  function editionLicenseeLine(editionLabel, name, lang) {
    var phrase = licenseePhrase(name, lang);
    return phrase ? ((editionLabel || '') + ' \u00b7 ' + phrase) : (editionLabel || '');
  }

  var WATERMARK = {
    de: 'DT-ProfiPassung \u2013 Testversion \u2013 nicht f\u00fcr Produktivnutzung',
    en: 'DT-ProfiPassung \u2013 Test version \u2013 not for production use',
    pt: 'DT-ProfiPassung \u2013 Vers\u00e3o de teste \u2013 n\u00e3o usar em produ\u00e7\u00e3o'
  };
  function watermarkText(lang) { return pick(WATERMARK, lang); }
  function shouldWatermark(edition) { return edition === 'test'; }

  var GATED_FEATURES = ['save', 'load', 'print', 'copy', 'cad', 'rtf', 'csv'];
  function isFeatureAllowed(feature, edition) {
    if (edition === 'test') return false;
    return true;
  }

  function num(x, lang, dec) {
    if (x == null || typeof x !== 'number' || !isFinite(x)) return '';
    var s = Number(x).toFixed(dec == null ? 2 : dec);
    if (lang !== 'en') s = s.replace('.', ',');
    return s;
  }
  function sgnUm(x, lang) {
    if (x == null || !isFinite(x)) return '';
    var s = (x > 0 ? '+' : '') + (Number.isInteger(x) ? String(x) : Number(x).toFixed(1));
    return lang !== 'en' ? s.replace('.', ',') : s;
  }

  function toDtp(ctx) {
    ctx = ctx || {};
    var payload = {
      magic: DTP_MAGIC,
      schema: DTP_SCHEMA,
      app: 'DT-ProfiPassung',
      created: ctx.now || new Date().toISOString(),
      designation: (ctx.designation == null ? '' : String(ctx.designation)),
      state: ctx.state || {}
    };
    return JSON.stringify(payload, null, 2);
  }

  function fromDtp(text) {
    if (text == null || String(text).trim() === '') return { ok: false, error: 'RP_ERR_EMPTY' };
    var obj;
    try { obj = JSON.parse(String(text)); }
    catch (e) { return { ok: false, error: 'RP_ERR_JSON' }; }
    if (!obj || typeof obj !== 'object' || obj.magic !== DTP_MAGIC || !obj.state || typeof obj.state !== 'object') {
      return { ok: false, error: 'RP_ERR_FORMAT' };
    }
    if (typeof obj.schema !== 'number' || obj.schema > DTP_SCHEMA) {
      return { ok: false, error: 'RP_ERR_SCHEMA' };
    }
    return {
      ok: true,
      state: obj.state,
      designation: (obj.designation == null ? '' : String(obj.designation)),
      created: (obj.created == null ? '' : String(obj.created)),
      schema: obj.schema
    };
  }

  function dtpFilename(designation, dateStr) {
    var base = licenseeName(designation) || 'Passung';
    base = base.replace(/[^\w\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df .\-]/g, '').replace(/\s+/g, '_').slice(0, 60) || 'Passung';
    var d = '';
    if (dateStr) { d = '_' + String(dateStr).slice(0, 10); }
    return base + d + '.dtp';
  }

  function buildModel(ctx) {
    ctx = ctx || {};
    var lang = ctx.lang || 'de';
    var lic = licenseeField(ctx.licensee, lang);
    function rows(list) {
      return (list || []).map(function (r) {
        return { label: String(r.label == null ? '' : r.label),
                 value: String(r.value == null ? '' : r.value),
                 unit: String(r.unit == null ? '' : r.unit) };
      });
    }
    return {
      lang: lang,
      title: pick(T.appTitle, lang),
      subtitle: pick(T.subtitle, lang),
      designation: (ctx.designation == null ? '' : String(ctx.designation)),
      headline: (ctx.headline == null ? '' : String(ctx.headline)),
      date: (ctx.now || new Date().toISOString()).slice(0, 10),
      dataVersion: (ctx.dataVersion == null ? '' : String(ctx.dataVersion)),
      licensee: lic,
      caps: {
        designation: pick(T.labelCap, lang), date: pick(T.dateCap, lang),
        engine: pick(T.engineCap, lang),
        secResult: pick(T.secResult, lang), secInput: pick(T.secInput, lang),
        secExtra: pick(T.secExtra, lang), secWeg: pick(T.secWeg, lang),
        colQty: pick(T.colQty, lang), colValue: pick(T.colValue, lang), colUnit: pick(T.colUnit, lang)
      },
      result: rows(ctx.resultLines),
      inputs: rows(ctx.inputLines),
      extras: (ctx.extraSections || []).map(function (s) {
        return { title: String(s.title == null ? '' : s.title), rows: rows(s.rows) };
      }),
      steps: (ctx.steps || []).map(function (s) {
        return { title: String(s.title == null ? '' : s.title),
                 expr: String(s.expr == null ? '' : s.expr),
                 ok: s.ok !== false };
      }),
      disclaimer: pick(T.disclaimer, lang)
    };
  }

  return {
    VERSION: VERSION,
    DTP_MAGIC: DTP_MAGIC, DTP_SCHEMA: DTP_SCHEMA,
    toDtp: toDtp, fromDtp: fromDtp, dtpFilename: dtpFilename,
    buildModel: buildModel,
    isFeatureAllowed: isFeatureAllowed, GATED_FEATURES: GATED_FEATURES,
    watermarkText: watermarkText, shouldWatermark: shouldWatermark,
    licenseeName: licenseeName, licenseePhrase: licenseePhrase,
    licenseeField: licenseeField, editionLicenseeLine: editionLicenseeLine,
    num: num, sgnUm: sgnUm
  };
});
