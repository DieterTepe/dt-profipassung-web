/* DOM-Smoke B10a (DEV-ONLY, wird nicht ausgeliefert)
 * Mini-DOM-Shim in Node: führt ui.js real aus und prüft die Laien-ⓘ:
 *  - Boot ohne Fehler, Ergebnis wird gerendert
 *  - 12 help-btn im Passungs-Modus, jede Sprechblase toggelt korrekt
 *  - Toggle-ⓘ ändert NICHT den Zustand der Checkbox (Thermik/Oberfläche)
 *  - Sprachwechsel DE→EN→PT: jede Sprechblase hat je Sprache eigenen Text
 *    (Paritätsnachweis: t() fällt auf DE zurück → gleicher Text = fehlender Key)
 */
'use strict';
var fs = require('fs');

/* ------------------------------------------------------------- Mini-DOM */
function ClassList(owner) { this._s = new Set(); this._o = owner; }
ClassList.prototype.add = function (c) { this._s.add(c); };
ClassList.prototype.remove = function (c) { this._s.delete(c); };
ClassList.prototype.contains = function (c) { return this._s.has(c); };
ClassList.prototype.toggle = function (c, force) {
  var has = this._s.has(c);
  var want = (force === undefined) ? !has : !!force;
  if (want) this._s.add(c); else this._s.delete(c);
  return want;
};
ClassList.prototype.toString = function () { return Array.from(this._s).join(' '); };

function Elem(tag) {
  this.tagName = String(tag).toUpperCase();
  this.children = [];
  this.parentNode = null;
  this._attrs = {};
  this._events = {};
  this._text = '';
  this.classList = new ClassList(this);
  this.style = { cssText: '' };
  this.hidden = false;
  this.value = '';
  this.disabled = false;
  this.checked = false;
  this.selected = false;
}
Object.defineProperty(Elem.prototype, 'className', {
  get: function () { return this.classList.toString(); },
  set: function (v) { this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); }
});
Object.defineProperty(Elem.prototype, 'textContent', {
  get: function () {
    var out = this._text;
    this.children.forEach(function (c) { out += c.textContent; });
    return out;
  },
  set: function (v) { this._text = String(v == null ? '' : v); this.children = []; }
});
Object.defineProperty(Elem.prototype, 'options', {
  get: function () { return this.children.filter(function (c) { return c.tagName === 'OPTION'; }); }
});
Elem.prototype.appendChild = function (c) { c.parentNode = this; this.children.push(c); return c; };
Elem.prototype.setAttribute = function (k, v) { this._attrs[k] = String(v); if (k === 'id') this.id = String(v); };
Elem.prototype.getAttribute = function (k) { return (k in this._attrs) ? this._attrs[k] : null; };
Elem.prototype.addEventListener = function (t, fn) { (this._events[t] = this._events[t] || []).push(fn); };
Elem.prototype.fire = function (t) {
  var self = this;
  (this._events[t] || []).forEach(function (fn) {
    fn.call(self, { preventDefault: function () {}, stopPropagation: function () {}, target: self });
  });
};
Elem.prototype.walk = function (fn) {
  fn(this);
  this.children.forEach(function (c) { c.walk(fn); });
};
Elem.prototype.findAll = function (pred) {
  var out = []; this.walk(function (n) { if (pred(n)) out.push(n); }); return out;
};
Elem.prototype.removeChild = function (c) {
  var i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); c.parentNode = null; } return c;
};
Elem.prototype.querySelectorAll = function (sel) {
  var parts = String(sel).split(',').map(function (s) { return s.trim(); });
  var self = this;
  return this.findAll(function (n) { return n !== self && parts.some(function (p) { return matchSel(n, p); }); });
};
Elem.prototype.querySelector = function (sel) { var r = this.querySelectorAll(sel); return r.length ? r[0] : null; };
Object.defineProperty(Elem.prototype, 'offsetWidth', { get: function () { return 100; } });
Elem.prototype.scrollIntoView = function () {};

var docRoot = new Elem('html');
var body = new Elem('body'); docRoot.appendChild(body);
var byId = {};
function mk(tag, id, cls) {
  var e = new Elem(tag);
  if (id) { e.id = id; byId[id] = e; }
  if (cls) e.className = cls;
  body.appendChild(e);
  return e;
}
mk('div', 'formHost'); mk('div', 'resultHost'); mk('div', 'vizHost');
mk('select', 'presetSel'); mk('div', 'editionBar');
mk('button', 'calcBtn'); mk('button', 'resetBtn');
mk('input', 'dtLabel'); mk('button', 'saveBtn'); mk('button', 'loadBtn'); mk('input', 'dtFile');
mk('button', 'printBtn'); mk('button', 'rtfBtn');
/* B15: Kopfzeile + Aktivierungs-Dialog (statisch wie in der Produktiv-HTML). */
var brandMark = mk('span', null, 'mark'); brandMark.textContent = 'DT-ProfiPassung';
mk('span', 'licenseLine', 'license-line');
mk('button', 'infoBtn', 'icon-btn');
var actOv = mk('div', 'activation', 'modal-overlay');
mk('input', 'licName'); mk('input', 'licKey');
mk('button', 'licActivate'); mk('button', 'licLater');
var langDe = mk('button', null, 'lang-btn'); langDe.setAttribute('data-lang', 'de');
var langEn = mk('button', null, 'lang-btn'); langEn.setAttribute('data-lang', 'en');
var langPt = mk('button', null, 'lang-btn'); langPt.setAttribute('data-lang', 'pt');

function matchSel(n, sel) {
  if (sel.charAt(0) === '[') return n.getAttribute(sel.slice(1, -1)) != null;
  if (sel.charAt(0) === '.') return sel.slice(1).split('.').every(function (c) { return n.classList.contains(c); });
  return n.tagName === sel.toUpperCase();
}
var documentShim = {
  readyState: 'complete',
  documentElement: docRoot,
  body: body,
  createElement: function (t) { return new Elem(t); },
  createElementNS: function (_ns, t) { return new Elem(t); },
  createTextNode: function (txt) { var e = new Elem('#text'); e.textContent = txt; return e; },
  getElementById: function (id) { return byId[id] || null; },
  querySelectorAll: function (sel) { return docRoot.findAll(function (n) { return matchSel(n, sel); }); },
  querySelector: function (sel) { var r = docRoot.findAll(function (n) { return matchSel(n, sel); }); return r.length ? r[0] : null; },
  addEventListener: function () {}
};
var lsMap = {};
var localStorageShim = {
  getItem: function (k) { return (k in lsMap) ? lsMap[k] : null; },
  setItem: function (k, v) { lsMap[k] = String(v); },
  removeItem: function (k) { delete lsMap[k]; }
};

global.window = global;
global.document = documentShim;
global.localStorage = localStorageShim;

/* B14: minimale Browser-APIs für die Ausgabe-Leiste. */
global.__clip = null;
try {
  Object.defineProperty(global, 'navigator', { value: { clipboard: { writeText: function (s) { global.__clip = s; return { then: function (ok) { ok(); return { then: function () {} }; } }; } } }, configurable: true, writable: true });
} catch (e) {
  global.window.navigator = { clipboard: { writeText: function (s) { global.__clip = s; return { then: function (ok) { ok(); return { then: function () {} }; } }; } } };
}
global.Blob = function (parts) { this.parts = parts; };
global.URL = { createObjectURL: function () { return 'blob:x'; }, revokeObjectURL: function () {} };
global.__lastSavedText = null;
documentShim.execCommand = function () { return true; };
global.window.print = function () { global.__printed = true; };
// createElement('a').click() / textarea select — no-ops via Elem:
Elem.prototype.click = function () { this.fire('click'); if (this.download && global.__pendingSaveText != null) { global.__lastSavedText = global.__pendingSaveText; } };
Elem.prototype.select = function () {};
// FileReader-Stub: liefert den zuletzt „geladenen" Text.
global.FileReader = function () { this.onload = null; };
global.FileReader.prototype.readAsText = function () { var self = this; global.__lastReader = self; if (self.onload) self.onload(); };

/* ------------------------------------------------- Module in Reihenfolge */
['daten.js', 'validate.js', 'solver.js', 'freiform.js', 'thermik.js',
 'rechenweg.js', 'schaubild.js', 'beratung.js', 'pressverband.js', 'assistent.js', 'report.js', 'ui.js'].forEach(function (f) {
  (0, eval)(fs.readFileSync(__dirname + '/' + f, 'utf8') + '\n//# sourceURL=' + f);
});

/* --------------------------------------------------------------- Checks */
var okCount = 0, failCount = 0;
function ok(cond, label) {
  if (cond) { okCount++; }
  else { failCount++; console.log('  FEHLER: ' + label); }
}

var formHost = byId.formHost;
ok(formHost.children.length > 0, 'formHost gefüllt (Boot ohne Fehler)');
ok(byId.resultHost.children.length > 0, 'resultHost gefüllt (50 H7/g6 gerechnet)');

function helpBtns() { return formHost.findAll(function (n) { return n.classList.contains('help-btn'); }); }
function bubbles() { return formHost.findAll(function (n) { return n.classList.contains('field-help'); }); }

var N_FIT = 23; // B10a: 12 · B10c: +11 (Pressverband: Toggle, 2×Werkstoff, 2×eigene Werte, µ, l_F, D_Aa, D_Ii, M_t, F_ax)
var btns = helpBtns(), bubs = bubbles();
ok(btns.length === N_FIT, 'Passungs-Modus: ' + N_FIT + ' ⓘ-Knöpfe (ist: ' + btns.length + ')');
ok(bubs.length === N_FIT, 'Passungs-Modus: ' + N_FIT + ' Sprechblasen (ist: ' + bubs.length + ')');
ok(bubs.every(function (b) { return b.hidden === true; }), 'Alle Sprechblasen anfangs verborgen');
ok(bubs.every(function (b) { return b.getAttribute('data-i18n') && b.textContent.length > 40; }), 'Jede Sprechblase mit data-i18n + ausführlichem Text');
ok(btns.every(function (b) { return b.getAttribute('data-i18n-aria') && b.getAttribute('aria-label'); }), 'Jeder ⓘ-Knopf mit aria-Label (übersetzbar)');

/* Toggle-Verhalten je Knopf: auf → zu, aria-expanded folgt. */
var toggleOk = true;
btns.forEach(function (b) {
  b.fire('click');
  var open = bubbles().filter(function (x) { return !x.hidden; });
  if (open.length !== 1 || b.getAttribute('aria-expanded') !== 'true') toggleOk = false;
  b.fire('click');
  if (bubbles().some(function (x) { return !x.hidden; }) || b.getAttribute('aria-expanded') !== 'false') toggleOk = false;
});
ok(toggleOk, 'Jeder ⓘ-Knopf öffnet/schließt seine Sprechblase (aria-expanded folgt)');

/* Toggle-ⓘ (Thermik/Oberfläche) darf die Checkbox NICHT umschalten. */
var boxes = formHost.findAll(function (n) { return n.classList.contains('thermik-box'); });
ok(boxes.length === 3, 'Drei optionale Bereiche (Thermik + Oberfläche + Pressverband)');
var cbStable = true;
boxes.forEach(function (bx) {
  var cb = bx.findAll(function (n) { return n.tagName === 'INPUT' && n.type === undefined ? false : n._attrs && false; });
  var chk = bx.findAll(function (n) { return n.tagName === 'INPUT'; }).filter(function (n) { return n.type === 'checkbox'; })[0]
        || bx.findAll(function (n) { return n.tagName === 'INPUT'; })[0];
  var hb = bx.findAll(function (n) { return n.classList.contains('help-btn'); })[0];
  if (!chk || !hb) { cbStable = false; return; }
  var before = chk.checked;
  hb.fire('click'); hb.fire('click');
  if (chk.checked !== before) cbStable = false;
});
ok(cbStable, 'ⓘ am Bereichs-Schalter lässt die Checkbox unangetastet');

/* Sprachwechsel: Texte je Sprache verschieden (Paritätsnachweis über Fallback). */
function snapshotTexts() {
  return bubbles().map(function (b) { return b.textContent; });
}
var txDe = snapshotTexts();
langEn.fire('click');
var txEn = snapshotTexts();
langPt.fire('click');
var txPt = snapshotTexts();
langDe.fire('click');
var txDe2 = snapshotTexts();
ok(txDe.length === N_FIT && txEn.length === N_FIT && txPt.length === N_FIT, 'Sprechblasen über Sprachwechsel stabil (' + N_FIT + '×3)');
var parity = true;
for (var i = 0; i < txDe.length; i++) {
  if (!txDe[i] || !txEn[i] || !txPt[i]) parity = false;
  if (txDe[i] === txEn[i] || txDe[i] === txPt[i] || txEn[i] === txPt[i]) parity = false;
}
ok(parity, 'i18n-Parität: alle ' + N_FIT + ' Feldhilfen in DE/EN/PT eigenständig übersetzt');
ok(txDe.join('|') === txDe2.join('|'), 'Rückschalten auf DE stellt Originaltexte wieder her');

/* B10c: Pressverband-Bereich — einschalten, Standardfall 25 H7/f7 (Spiel) → Hinweis;
   dann Welle auf „s“ → Übermaßpassung → Ergebnis-Panel mit Kennzeilen. */
function pvResults() { return byId.resultHost.findAll(function (n) { return n.classList.contains('pv-result'); }); }
var pvBox = boxes[2];
var pvChk = pvBox.findAll(function (n) { return n.tagName === 'INPUT'; }).filter(function (n) { return n.type === 'checkbox'; })[0];
ok(!!pvChk, 'Pressverband-Schalter vorhanden');
pvChk.checked = true; pvChk.fire('change');
var pr = pvResults();
ok(pr.length === 1, 'Pressverband-Panel erscheint nach Aktivierung');
var noteN = pr.length ? pr[0].findAll(function (n) { return n.getAttribute('data-i18n') === 'pvNoInter'; }) : [];
ok(noteN.length === 1, '25 H7/f7 (Spiel) → verständlicher Kein-Übermaß-Hinweis');
var sels = formHost.findAll(function (n) { return n.tagName === 'SELECT'; });
var shaftSel = sels[3]; // Reihenfolge: System, Bohr-Buchstabe, Bohr-Grad, Wellen-Buchstabe, ...
shaftSel.value = 's'; shaftSel.fire('change');
pr = pvResults();
var rows = pr.length ? pr[0].findAll(function (n) { return n.classList.contains('pv-row'); }) : [];
ok(pr.length === 1 && rows.length >= 8, '25 H7/s7 → Panel mit Kennzeilen (ist: ' + rows.length + ')');
var noHint = pr.length ? pr[0].findAll(function (n) { return n.getAttribute('data-i18n') === 'pvNoInter'; }) : [1];
ok(noHint.length === 0, 'Übermaßpassung → kein Kein-Übermaß-Hinweis mehr');
shaftSel.value = 'f'; shaftSel.fire('change');
pvChk.checked = false; pvChk.fire('change');
ok(pvResults().length === 0, 'Pressverband deaktiviert → Panel verschwindet');

/* B10d: Preset aus dem Lade-Menü anwenden → füllt Passung, Oberfläche und
   Pressverband, zeigt Panel + PV-Rechenwegschritte. */
var presetSel = byId.presetSel;
// Menü füllen lassen (fillPresets läuft beim Boot; hier Optionen prüfen):
var pvOpts = presetSel.findAll(function (n) { return n.tagName === 'OPTION' && String(n.value || '').indexOf('PV|') === 0; });
ok(pvOpts.length === 3, 'Lade-Menü: 3 Pressverband-Beispiele (ist: ' + pvOpts.length + ')');
// Erstes PV-Preset anwenden über den change-Handler:
presetSel.value = pvOpts[0].value;
presetSel.fire('change');
var prP = byId.resultHost.findAll(function (n) { return n.classList.contains('pv-result'); });
ok(prP.length === 1, 'Preset: Pressverband-Panel erscheint');
var pRows = prP.length ? prP[0].findAll(function (n) { return n.classList.contains('pv-row'); }) : [];
ok(pRows.length >= 8, 'Preset: Panel mit Kennzeilen (ist: ' + pRows.length + ')');
// Oberfläche (Rz) wurde durchs Preset aktiviert (Box nach Rebuild frisch holen):
var freshBoxes = formHost.findAll(function (n) { return n.classList.contains('thermik-box'); });
var oaChk = freshBoxes[1].findAll(function (n) { return n.tagName === 'INPUT'; }).filter(function (n) { return n.type === 'checkbox'; })[0];
ok(oaChk && oaChk.checked === true, 'Preset: Oberfläche (Rz) mitaktiviert');
// PV-Rechenweg sichtbar: die Kern-Formeln erscheinen als rw-expr-Klartext:
var rwExprs = byId.resultHost.findAll(function (n) { return n.classList.contains('rw-expr'); })
  .map(function (n) { return n.textContent; });
var rwJoined = rwExprs.join(' || ');
ok(/W = K_A\/E_A \+ K_I\/E_I/.test(rwJoined), 'Preset: PV-Rechenweg zeigt W-Formel im Klartext');
ok(/p_max = \(U_w,max\/D_F\)\/W/.test(rwJoined), 'Preset: PV-Rechenweg zeigt p_max-Formel');
ok(/S_F = p_zul \/ p_max/.test(rwJoined), 'Preset: PV-Rechenweg zeigt S_F-Formel');
var pvStepTitles = byId.resultHost.findAll(function (n) { return n.classList.contains('rw-title'); })
  .map(function (n) { return n.textContent; })
  .filter(function (tx) { return /Q_A|Q_I|p_max|p_min|S_F|A_F|W|K_A/.test(tx); });
ok(pvStepTitles.length >= 8, 'Preset: PV-Rechenweg mit vielen Schritten (ist: ' + pvStepTitles.length + ')');
// Preset zurücksetzen für die folgenden Tests:
presetSel.value = ''; 

/* B11-UI: Passungs-Assistent — Button vorhanden, Overlay öffnet, 4-Fragen-Flow,
   Vorschlagskarten, „Übernehmen" setzt Passung + rechnet. setTimeout wird für
   den Test sofort ausgeführt (Transitions überspringen). */
(function () {
  // setTimeout synchronisieren, damit Schrittwechsel im Test sofort greifen:
  var _realST = global.setTimeout;
  global.setTimeout = function (fn) { if (typeof fn === 'function') fn(); return 0; };

  var asBtn = formHost.findAll(function (n) { return n.classList.contains('assist-btn'); })[0];
  ok(!!asBtn, 'Assistent-Button im Formularkopf vorhanden');

  function overlay() { return body.findAll(function (n) { return n.classList.contains('assist-overlay'); })[0]; }
  asBtn.fire('click');
  var ov = overlay();
  ok(!!ov, 'Klick öffnet das Assistent-Overlay');
  ok(ov && ov.classList.contains('open'), 'Overlay ist geöffnet (open)');

  function stepOpts() { return ov.findAll(function (n) { return n.classList.contains('assist-opt'); }); }
  function progressText() { var p = ov.findAll(function (n) { return n.classList.contains('assist-progress-text'); })[0]; return p ? p.textContent : ''; }
  function qText() { var q = ov.findAll(function (n) { return n.classList.contains('assist-q'); })[0]; return q ? q.textContent : ''; }

  // Frage 1: Nennmaß-Feld + purpose-Optionen (3 Stück).
  var nomIn = ov.findAll(function (n) { return n.tagName === 'INPUT'; })[0];
  ok(!!nomIn, 'Frage 1 zeigt Nennmaß-Feld');
  ok(stepOpts().length === 3, 'Frage 1 (Zweck) hat 3 Antworten (ist: ' + stepOpts().length + ')');
  ok(/1/.test(progressText()) && /4/.test(progressText()), 'Fortschritt „1 von 4"');

  // Pfad FIXED wählen → 4. Frage muss Werkstoff (hubMat) sein.
  nomIn.value = '60'; nomIn.fire('input');
  // purpose = FIXED (3. Option)
  stepOpts()[2].fire('click');
  ok(/2/.test(progressText()), 'nach Zweckwahl → Frage 2');
  // demount = NEVER (3. Option)
  stepOpts()[2].fire('click');
  ok(/3/.test(progressText()), 'nach Demontage → Frage 3');
  // precision = NORMAL (1. Option)
  stepOpts()[0].fire('click');
  // Frage 4 = hubMat (FIXED-Zweig)
  ok(stepOpts().length === 3, 'FIXED → 4. Frage mit 3 Werkstoff-Optionen');
  var q4 = qText();
  // hubMat = STEEL (1. Option) → Ergebnisse
  stepOpts()[0].fire('click');

  function cards() { return ov.findAll(function (n) { return n.classList.contains('assist-card'); }); }
  ok(cards().length >= 1 && cards().length <= 3, 'Ergebnis: 1–3 Vorschlagskarten (ist: ' + cards().length + ')');
  var fitTexts = ov.findAll(function (n) { return n.classList.contains('assist-card-fit'); }).map(function (n) { return n.textContent; });
  ok(fitTexts.indexOf('H7/s6') >= 0, 'FIXED/NEVER → Presssitz H7/s6 unter den Vorschlägen');
  var hints = ov.findAll(function (n) { return n.classList.contains('assist-card-hint'); });
  ok(hints.length >= 1, 'Presssitz-Vorschlag zeigt Pressverband-Hinweis');

  // „Übernehmen" auf der ersten Karte → Overlay zu, Passung im Formular, Ergebnis da.
  var applyBtns = ov.findAll(function (n) { return n.classList.contains('assist-apply'); });
  ok(applyBtns.length >= 1, 'jede Karte hat einen Übernehmen-Knopf');
  applyBtns[0].fire('click');
  ok(!overlay() || !overlay().classList.contains('open'), 'nach Übernehmen ist das Overlay geschlossen');
  // Passungsfelder gesetzt (Nennmaß 60, erste Vorschlagspassung):
  var sels2 = formHost.findAll(function (n) { return n.tagName === 'SELECT'; });
  var nomAfter = formHost.findAll(function (n) { return n.tagName === 'INPUT' && n.type === 'number'; })[0];
  ok(nomAfter && String(nomAfter.value) === '60', 'Übernehmen setzt Nennmaß 60 (ist: ' + (nomAfter && nomAfter.value) + ')');
  ok(byId.resultHost.children.length > 0, 'nach Übernehmen ist ein Ergebnis gerechnet');

  // i18n: Overlay erneut öffnen, Sprache wechseln, Fragetext ändert sich.
  asBtn.fire('click'); ov = overlay();
  var qDe = qText();
  langEn.fire('click');
  // Overlay wird durch Sprachwechsel nicht neu gerendert; erneut öffnen:
  if (overlay()) { overlay().classList.remove('open'); }
  asBtn.fire('click'); ov = overlay();
  var qEn = qText();
  ok(qDe && qEn && qDe !== qEn, 'Assistent-Fragen folgen dem Sprachwechsel (DE≠EN)');
  langDe.fire('click');
  if (overlay()) overlay().classList.remove('open');

  global.setTimeout = _realST;
})();

/* B14 (überarbeitet): Speichern/Öffnen oben in der Aktionsleiste (saveBtn/
   loadBtn), Bezeichnungsfeld #dtLabel, .dtp-Round-Trip über die Report-API. */
(function () {
  var _realST2 = global.setTimeout;
  global.setTimeout = function (fn) { if (typeof fn === 'function') fn(); return 0; };

  // Untere Ausgabe-Leiste existiert NICHT mehr.
  var oldBar = byId.resultHost.findAll(function (n) { return n.classList.contains('output-bar'); });
  ok(oldBar.length === 0, 'keine untere Ausgabe-Leiste mehr (Buttons sind oben)');

  // Obere Buttons vorhanden und verdrahtet.
  ok(!!byId.saveBtn && !!byId.loadBtn, 'Speichern/Öffnen-Buttons oben vorhanden');
  ok(!!byId.printBtn && !!byId.rtfBtn, 'Drucken/PDF + Word(.rtf)-Buttons oben vorhanden');
  ok(!!byId.dtLabel, 'Bezeichnungsfeld #dtLabel vorhanden');
  ok((byId.saveBtn._events.click || []).length > 0, 'Speichern-Button ist verdrahtet');
  ok((byId.loadBtn._events.click || []).length > 0, 'Öffnen-Button ist verdrahtet');
  ok((byId.printBtn._events.click || []).length > 0, 'Drucken-Button ist verdrahtet');
  ok((byId.rtfBtn._events.click || []).length > 0, 'RTF-Button ist verdrahtet');

  // Drucken in der Vollversion ruft window.print (kein Sperr-Overlay).
  global.__printed = false;
  byId.printBtn.fire('click');
  ok(global.__printed === true, 'Vollversion: Drucken ruft window.print');
  ok(body.findAll(function (n) { return n.classList.contains('locked-overlay'); }).length === 0, 'Vollversion: Drucken ohne Sperr-Overlay');

  // RTF-Export in der Vollversion (Datei-Anker wird geklickt, kein Overlay).
  byId.rtfBtn.fire('click');
  ok(body.findAll(function (n) { return n.classList.contains('locked-overlay'); }).length === 0, 'Vollversion: RTF ohne Sperr-Overlay');
  // RTF-Inhalt direkt über die Report-API prüfen:
  var RPmod = global.DTPReport;
  var rtfTxt = RPmod.buildRTF({ lang: 'de', headline: 'Ø50 H7/g6', resultLines: [{ label: 'x', value: '1', unit: 'µm' }], steps: [{ title: 'S', expr: 'a=b' }] });
  ok(rtfTxt.indexOf('{\\rtf1') === 0 && rtfTxt.slice(-1) === '}', 'RTF wohlgeformt ({\\rtf1…})');

  // .dtp-Round-Trip über die Report-API mit realistischem UI-State.
  var uiState = { mode: 'fit', fit: { nominal: 60, system: 'EB', hole: { letter: 'H', grade: 7 }, shaft: { letter: 's', grade: 6 } },
                  press: { on: true, matA: 'steel', matI: 'steel', muKey: 'STST_DRY', lF: 50, DAa: 120, DIi: 0, Mt: 250, Fax: 0 } };
  var dtpText = RPmod.toDtp({ state: uiState, designation: 'Smoke-Test', now: '2026-07-18T09:00:00Z' });
  var parsed = RPmod.fromDtp(dtpText);
  ok(parsed.ok && parsed.state.fit.shaft.letter === 's', 'UI-State .dtp Round-Trip trägt Passung');
  ok(parsed.state.press.on === true && parsed.state.press.Mt === 250, 'UI-State .dtp Round-Trip trägt Pressverband');
  // Dateiname enthält Datum.
  ok(RPmod.dtpFilename('Test', '2026-07-18T09:00:00Z') === 'Test_2026-07-18.dtp', 'Dateiname trägt Bezeichnung + Datum');

  global.setTimeout = _realST2;
})();

/* B15: Registrierung + Editionszeile + Info (Vollversion). */
(function () {
  // Erststart ohne hinterlegten Namen → Aktivierungsdialog ist offen.
  ok(byId.activation.classList.contains('open'), 'Erststart (Voll, ohne Name): Aktivierungsdialog offen');

  // Aktivieren erst möglich, wenn BEIDE Felder gefüllt sind.
  byId.licName.value = 'Dieter'; byId.licName.fire('input');
  ok(byId.licActivate.disabled === true, 'nur Name → Aktivieren noch gesperrt');
  byId.licKey.value = 'DS24-XYZ'; byId.licKey.fire('input');
  ok(byId.licActivate.disabled === false, 'Name + Schlüssel → Aktivieren frei (kein Formatcheck)');
  byId.licActivate.fire('click');
  ok(!byId.activation.classList.contains('open'), 'Aktivieren schließt den Dialog');
  ok(global.localStorage.getItem('dtp-licensee') === 'Dieter', 'Name in localStorage gespeichert');
  ok(global.localStorage.getItem('dtp-license-key') === 'DS24-XYZ', 'Schlüssel unverändert gespeichert');
  var line = byId.licenseLine;
  ok(line.hidden === false && line.textContent.indexOf('Dieter') > 0, 'Kopfzeile: „Vollversion · lizenziert für Dieter"');

  // Lizenznehmer fließt in den Berichtskopf (RTF) ein.
  var RPx = global.DTPReport;
  var mdl = RPx.buildModel({ lang: 'de', licensee: global.localStorage.getItem('dtp-licensee') });
  ok(mdl.licensee && mdl.licensee.value === 'Dieter', 'Lizenznehmer erscheint im Berichtskopf');

  // 10-s-Long-Press auf der Marke löscht Name + Schlüssel (setTimeout sync).
  var _st3 = global.setTimeout;
  global.setTimeout = function (fn) { if (typeof fn === 'function') fn(); return 0; };
  var markEl = docRoot.findAll(function (n) { return n.classList.contains('mark'); })[0];
  ok(!!markEl && (markEl._events.mousedown || []).length > 0, 'Long-Press auf der Marke ist verdrahtet');
  markEl.fire('mousedown');
  ok(global.localStorage.getItem('dtp-licensee') === null, 'Long-Press löscht den Namen');
  ok(global.localStorage.getItem('dtp-license-key') === null, 'Long-Press löscht den Schlüssel');
  ok(byId.licenseLine.textContent.indexOf('Dieter') < 0, 'Kopfzeile fällt auf „Vollversion" zurück');
  global.setTimeout = _st3;

  // Info-Overlay (ⓘ): Beschreibung Passung + Impressum + Link.
  byId.infoBtn.fire('click');
  var infoOv = body.findAll(function (n) { return n.classList.contains('locked-overlay'); }).pop();
  ok(!!infoOv, 'Info-Overlay öffnet');
  var infoTxt = infoOv ? infoOv.textContent : '';
  ok(infoTxt.indexOf('ISO 286') >= 0 && infoTxt.indexOf('Schraube') < 0, 'Info beschreibt die PASSUNG (nicht Schraube)');
  ok(infoTxt.indexOf('Dieter Tepe') >= 0 && infoTxt.indexOf('Dreierwalde') >= 0, 'Info nennt Entwickler + Anschrift');
  ok(infoTxt.indexOf('Dieter.Tepe@live.de') >= 0, 'Info nennt E-Mail');
  var link = infoOv.findAll(function (n) { return n.tagName === 'A' && String(n.href || '').indexOf('dt-profidreieck') >= 0; })[0];
  ok(!!link, 'Info verlinkt www.dt-profidreieck.de');
  // schließen
  infoOv.findAll(function (n) { return n.classList.contains('close'); })[0].fire('click');
})();

/* Freiform-Modus: dort 2 ⓘ (Nennmaß + Klasse). */
var modeBtns = formHost.findAll(function (n) { return n.tagName === 'BUTTON' && n.getAttribute('data-i18n') === 'modeFreiform'; });
ok(modeBtns.length === 1, 'Freiform-Umschalter vorhanden');
if (modeBtns.length === 1) {
  modeBtns[0].fire('click');
  var b2 = helpBtns(), h2 = bubbles();
  ok(b2.length === 2 && h2.length === 2, 'Freiform-Modus: 2 ⓘ-Knöpfe + 2 Sprechblasen (ist: ' + b2.length + '/' + h2.length + ')');
  var ffTexts = h2.map(function (x) { return x.textContent; });
  ok(ffTexts[0] !== txDe[1], 'Freiform-Nennmaß hat EIGENE Hilfe (nicht die ISO-286-Hilfe)');
}

/* ---------------------------------------------------------------------------
 * F3 (2026-07): Kurzeingabe darf bei falscher Schreibweise/Grad NICHT still
 * ein anderes als das getippte Feld rechnen — Fehlermeldung + kein stiller run.
 * ------------------------------------------------------------------------- */
(function () {
  var fitBackMode = formHost.findAll(function (n) { return n.tagName === 'BUTTON' && n.getAttribute('data-i18n') === 'modeFit'; });
  if (fitBackMode.length) fitBackMode[0].fire('click');   // zurück in den Passungsmodus
  function sels() { return formHost.findAll(function (n) { return n.tagName === 'SELECT'; }); }
  function fitEl() { return formHost.findAll(function (n) { return n.classList.contains('fit-input'); })[0]; }
  function msgEl() { return formHost.findAll(function (n) { return n.classList.contains('field-msg'); })[0]; }
  var s = sels(); var hL = s[1], hG = s[2], sL = s[3], sG = s[4];
  var fi = fitEl(), msg = msgEl();
  if (!fi || !msg || !hL || !sL) { ok(false, 'F3: Kurzeingabe/Felder auffindbar'); return; }

  function type(v) { fi.value = v; fi.fire('input'); }

  type('50 H7/g6');
  ok(hL.value === 'H' && sL.value === 'g' && msg.hidden === true, 'F3: gültig 50 H7/g6 → Felder H/g, keine Meldung');

  type('50 h7/g6');
  ok(msg.hidden === false, 'F3: "50 h7/g6" (zwei klein) → Fehlermeldung sichtbar');
  ok(!(hL.value === 'H' && sL.value === 'g' && msg.hidden), 'F3: "50 h7/g6" → KEINE stille H7/g6-Rechnung');

  type('50 H7/g6'); type('50 H7/G6');
  ok(msg.hidden === false, 'F3: "50 H7/G6" (zwei groß) → Fehlermeldung sichtbar');

  type('50 H7/g6'); type('50 H17/g6');
  ok(msg.hidden === false && hG.value !== '17', 'F3: "50 H17/g6" (Grad>16) → Meldung, Feld nicht 17');

  type('50 H7/n6');
  ok(msg.hidden === true && hL.value === 'H' && sL.value === 'n' && hG.value === '7' && sG.value === '6', 'F3: "50 H7/n6" → gültig, Felder korrekt');

  type('50 H7/js6');
  ok(msg.hidden === true && sL.value === 'js', 'F3: "50 H7/js6" → gültig, Welle js');
  type('50 JS7/h6');
  ok(msg.hidden === true && hL.value === 'JS' && sL.value === 'h', 'F3: "50 JS7/h6" → gültig, Bohrung JS');

  type('50 g6/H7');
  ok(msg.hidden === true && hL.value === 'H' && sL.value === 'g', 'F3: "50 g6/H7" → korrekt sortiert H7/g6');
})();

/* ---------------------------------------------------------------------------
 * F2 (2026-07): Freiform-Export enthält echte Freiform-Daten; nach Fehler/leer
 * kein stiller Alt-Export. (Deckt zugleich F7 ab: flashToast muss definiert sein
 * — der outNoCalc-Pfad wird durch lastResult=null erst erreichbar.)
 * ------------------------------------------------------------------------- */
(function () {
  function modeBtn(key) { return formHost.findAll(function (n) { return n.tagName === 'BUTTON' && n.getAttribute('data-i18n') === key; })[0]; }
  function fitInput() { return formHost.findAll(function (n) { return n.classList.contains('fit-input'); })[0]; }
  // Echten Export-Inhalt abgreifen (Blob speichert seinen ersten Teil), danach wiederherstellen.
  var savedBlob = global.Blob, blobText = null;
  global.Blob = function (parts) { blobText = (parts && parts[0] != null) ? String(parts[0]) : ''; this.parts = parts; };
  function grab(fireFn) { blobText = null; fireFn(); return blobText || ''; }

  var mFit = modeBtn('modeFit'); if (mFit) mFit.fire('click');
  var fi = fitInput();
  if (!fi || !byId.rtfBtn) { ok(false, 'F2: Fit-Feld/RTF-Button auffindbar'); global.Blob = savedBlob; return; }
  fi.value = '50 H7/g6'; fi.fire('input');

  var mFf = modeBtn('modeFreiform'); ok(!!mFf, 'F2: Freiform-Umschalter vorhanden'); mFf.fire('click');
  var ffN = formHost.findAll(function (n) { return n.tagName === 'INPUT' && n.type === 'number'; })[0];
  ok(!!ffN, 'F2: Freiform-Nennmaßfeld vorhanden'); ffN.value = '250'; ffN.fire('input');

  var txt = grab(function () { byId.rtfBtn.fire('click'); });
  ok(txt.length > 0, 'F2: Freiform-RTF wird erzeugt (Inhalt vorhanden)');
  ok(txt.indexOf('ISO 2768-') >= 0, 'F2: RTF enthält ISO-2768-Inhalt (Kopf/Datenstand)');
  ok(txt.indexOf('H7') < 0, 'F2: RTF enthält KEINE alte Passung (H7)');
  ok(txt.indexOf('250') >= 0, 'F2: RTF enthält das Freiform-Nennmaß 250');
  ok(txt.indexOf('ISO 2768-1') >= 0, 'F2: RTF enthält Freiform-Rechenweg/Datenstand');

  ffN.value = ''; ffN.fire('input');
  var txt0 = grab(function () { byId.rtfBtn.fire('click'); });
  ok(txt0 === '', 'F2: leeres Nennmaß → KEIN Export (outNoCalc, kein Crash)');

  if (mFit) modeBtn('modeFit').fire('click');
  fitInput().value = '40 H7/p6'; fitInput().fire('input');
  var txt2 = grab(function () { byId.rtfBtn.fire('click'); });
  ok(txt2.indexOf('H7') >= 0 && txt2.indexOf('p6') >= 0, 'F2: Fit-Export wieder korrekt (40 H7/p6)');
  ok(txt2.indexOf('ISO 2768-') < 0, 'F2: Fit-Export ohne Freiform-Reste (nur Disclaimer nennt 2768)');

  global.Blob = savedBlob;
})();

/* ---------------------------------------------------------------------------
 * F1 (2026-07): Rechenweg-Wörter übersetzbar (fmt.w). EN/PT dürfen keine
 * deutschen Wörter mehr zeigen; DE bleibt Fallback. Zugleich Regressionsschutz
 * für die Namenskollision 'W' (Nachgiebigkeit) in buildPressverband.
 * ------------------------------------------------------------------------- */
(function () {
  function langBtn(l) { return body.findAll(function (n) { return n.classList.contains('lang-btn') && n.getAttribute('data-lang') === l; })[0]; }
  function fitInput() { return formHost.findAll(function (n) { return n.classList.contains('fit-input'); })[0]; }
  function rwText() { return byId.resultHost.findAll(function (n) { return n.classList.contains('rw-expr'); }).map(function (n) { return n.textContent; }).join(' '); }
  var mFit = formHost.findAll(function (n) { return n.tagName === 'BUTTON' && n.getAttribute('data-i18n') === 'modeFit'; })[0];
  if (mFit) mFit.fire('click');

  if (langBtn('de')) langBtn('de').fire('click');
  fitInput().value = '50 H7/g6'; fitInput().fire('input');
  ok(/Gegenprobe/.test(rwText()), 'F1: DE-Rechenweg zeigt „Gegenprobe“');

  if (langBtn('en')) langBtn('en').fire('click');
  fitInput().value = '50 H7/g6'; fitInput().fire('input');
  var enTxt = rwText();
  ok(/cross-check/.test(enTxt) && !/Gegenprobe/.test(enTxt), 'F1: EN-Rechenweg zeigt „cross-check“ statt „Gegenprobe“');
  if (langBtn('de')) langBtn('de').fire('click');

  // Direkter Modultest: Pressverband-Rechenweg mit EN-Wörtern, ohne deutsche Reste,
  // Nachgiebigkeit W (Formel) unversehrt.
  var RW = window.DTPRechenweg, S = window.DTPSolver, TH = window.DTPThermik, PV = window.DTPPress;
  if (RW && S && TH && PV) {
    var rP = S.computeFit('60 H7/s6');
    var pvArgs = { DF: 60, lF: 50, DAa: 120, DIi: 0, Umax: rP.fit.interferenceMax, Umin: rP.fit.interferenceMin, RzA: 4, RzI: 1.6, matA: TH.MAT.steel, matI: TH.MAT.steel, mu: 0.14, Mt: 250, Fax: 0 };
    var pc = PV.compute({ DF: 60, lF: 50, DAa: 120, DIi: 0, U_max_um: rP.fit.interferenceMax, U_min_um: rP.fit.interferenceMin, RzA_um: 4, RzI_um: 1.6, matA: TH.MAT.steel, matI: TH.MAT.steel, mu: 0.14, Mt_Nm: 250, Fax_N: 0 });
    var enW = { um: function (x) { return (x > 0 ? '+' : '') + x; }, umU: function (x) { return String(x); }, mm: function (x) { return Number(x).toFixed(3); }, n: function (x) { return String(x); },
      w: { crosscheck: 'cross-check', fullfilm: 'full-film lubrication', mixedfilm: 'mixed friction', gap: 'gap', ductile: 'ductile', brittle: 'brittle', joinplay: 'joining clearance', hubto: 'hub to', shaftto: 'shaft to', noresidual: 'no residual interference' } };
    var joined = RW.buildPressverband(pvArgs, pc.r, enW).steps.map(function (s) { return s.expr; }).join(' ');
    ok(!/duktil|spröde|Fügespiel|Nabe auf|Welle auf|Restübermaß/.test(joined), 'F1: EN-Pressverband ohne deutsche Wörter');
    ok(/ductile|joining clearance|hub to/.test(joined), 'F1: EN-Pressverband trägt übersetzte Wörter');
    ok(/W = K_A\/E_A \+ K_I\/E_I/.test(joined), 'F1: Nachgiebigkeit W (Formel) unversehrt trotz WORDS-Umbenennung');
    // DE-Fallback (ohne fmt.w) bleibt deutsch:
    var joinedDe = RW.buildPressverband(pvArgs, pc.r).steps.map(function (s) { return s.expr; }).join(' ');
    ok(/duktil/.test(joinedDe) && /Fügespiel/.test(joinedDe), 'F1: DE-Fallback ohne fmt bleibt deutsch');
  } else {
    ok(false, 'F1: Module für Pressverband-Rechenweg verfügbar');
  }
})();

/* ---------------------------------------------------------------------------
 * F4 (2026-07): Sprachwechsel überschreibt eine fehlerhafte Kurzeingabe nicht.
 * F5 (2026-07): symmetrische Felder (JS/js) zeigen bis 0,1 µm (4 Nachkommast.).
 * ------------------------------------------------------------------------- */
(function () {
  function langBtn(l) { return body.findAll(function (n) { return n.classList.contains('lang-btn') && n.getAttribute('data-lang') === l; })[0]; }
  function fitInput() { return formHost.findAll(function (n) { return n.classList.contains('fit-input'); })[0]; }
  function fitMsg() { return formHost.findAll(function (n) { return n.classList.contains('field-msg'); })[0]; }
  function resText() { return byId.resultHost.findAll(function (n) { return true; }).map(function (n) { return n.textContent || ''; }).join(' '); }
  var mFit = formHost.findAll(function (n) { return n.tagName === 'BUTTON' && n.getAttribute('data-i18n') === 'modeFit'; })[0];
  if (mFit) mFit.fire('click');

  // F4: fehlerhafte Kurzeingabe überlebt Sprachwechsel
  if (langBtn('de')) langBtn('de').fire('click');
  fitInput().value = '50 H7/g6'; fitInput().fire('input');
  fitInput().value = '50 XYZ'; fitInput().fire('input');
  ok(fitMsg().hidden === false, 'F4: ungültige Kurzeingabe zeigt Fehlermeldung');
  if (langBtn('en')) langBtn('en').fire('click');
  ok(fitInput().value === '50 XYZ', 'F4: „50 XYZ" bleibt nach Sprachwechsel erhalten (ist: „' + fitInput().value + '")');
  ok(fitMsg().hidden === false, 'F4: Fehlermeldung nach Sprachwechsel weiter sichtbar');
  // gültige Eingabe wird nach Sprachwechsel weiterhin korrekt geführt
  if (langBtn('de')) langBtn('de').fire('click');
  fitInput().value = '50 H7/g6'; fitInput().fire('input');
  if (langBtn('en')) langBtn('en').fire('click');
  ok(/H7\/g6/.test(fitInput().value) && fitMsg().hidden === true, 'F4: gültige Kurzeingabe bleibt korrekt (H7/g6)');
  if (langBtn('de')) langBtn('de').fire('click');

  // F5: JS/js zeigt 4 Nachkommastellen, Normalfall bleibt 3-stellig
  fitInput().value = '50 JS7/js6'; fitInput().fire('input');
  var rt = resText();
  ok(/50,0125/.test(rt) && /49,9875/.test(rt), 'F5: JS7 zeigt 50,0125 / 49,9875');
  ok(!/50,013/.test(rt) && !/49,988/.test(rt), 'F5: keine falsch gerundeten 50,013 / 49,988');
  fitInput().value = '50 H7/g6'; fitInput().fire('input');
  var rt2 = resText();
  ok(/50,025/.test(rt2) && !/50,0250/.test(rt2), 'F5: Normalfall 50 H7 bleibt „50,025" (3 Stellen)');
})();

console.log('\nDOM-Smoke B10a: ' + okCount + ' OK, ' + failCount + ' Fehler');
process.exit(failCount ? 1 : 0);
