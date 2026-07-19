/* DOM-Smoke B14-Testversion (DEV-ONLY, nicht ausgeliefert)
 * Lädt ui.js mit DT_EDITION='test' und weist nach, dass in der Testversion
 * JEDE Ausgabe gesperrt ist: Buttons tragen .locked, ein Klick öffnet das
 * Locked-Overlay statt die Aktion auszuführen, und die Zwischenablage bleibt
 * leer. Wiederverwendet denselben Mini-DOM-Shim wie dom_smoke_b10a.js.
 */
'use strict';
var fs = require('fs');

function ClassList() { this._s = new Set(); }
ClassList.prototype.add = function (c) { this._s.add(c); };
ClassList.prototype.remove = function (c) { this._s.delete(c); };
ClassList.prototype.contains = function (c) { return this._s.has(c); };
ClassList.prototype.toggle = function (c, f) { var w = f === undefined ? !this._s.has(c) : !!f; if (w) this._s.add(c); else this._s.delete(c); return w; };
ClassList.prototype.toString = function () { return Array.from(this._s).join(' '); };

function Elem(tag) {
  this.tagName = String(tag).toUpperCase(); this.children = []; this.parentNode = null;
  this._attrs = {}; this._events = {}; this._text = ''; this.classList = new ClassList();
  this.style = {}; this.hidden = false; this.value = ''; this.checked = false; this.disabled = false;
}
Object.defineProperty(Elem.prototype, 'className', { get: function () { return this.classList.toString(); }, set: function (v) { this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); } });
Object.defineProperty(Elem.prototype, 'textContent', { get: function () { var o = this._text; this.children.forEach(function (c) { o += c.textContent; }); return o; }, set: function (v) { this._text = String(v == null ? '' : v); this.children = []; } });
Object.defineProperty(Elem.prototype, 'options', { get: function () { return this.children.filter(function (c) { return c.tagName === 'OPTION'; }); } });
Object.defineProperty(Elem.prototype, 'offsetWidth', { get: function () { return 100; } });
Elem.prototype.appendChild = function (c) { c.parentNode = this; this.children.push(c); return c; };
Elem.prototype.removeChild = function (c) { var i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); c.parentNode = null; } return c; };
Elem.prototype.setAttribute = function (k, v) { this._attrs[k] = String(v); if (k === 'id') this.id = String(v); };
Elem.prototype.getAttribute = function (k) { return (k in this._attrs) ? this._attrs[k] : null; };
Elem.prototype.addEventListener = function (t, fn) { (this._events[t] = this._events[t] || []).push(fn); };
Elem.prototype.fire = function (t) { var self = this; (this._events[t] || []).forEach(function (fn) { fn.call(self, { preventDefault: function () {}, stopPropagation: function () {}, target: self }); }); };
Elem.prototype.click = function () { this.fire('click'); };
Elem.prototype.select = function () {};
Elem.prototype.scrollIntoView = function () {};
Elem.prototype.walk = function (fn) { fn(this); this.children.forEach(function (c) { c.walk(fn); }); };
Elem.prototype.findAll = function (pred) { var out = []; this.walk(function (n) { if (pred(n)) out.push(n); }); return out; };
function matchSel(n, sel) {
  if (sel.charAt(0) === '[') return n.getAttribute(sel.slice(1, -1)) != null;
  if (sel.charAt(0) === '.') return sel.slice(1).split('.').every(function (c) { return n.classList.contains(c); });
  return n.tagName === sel.toUpperCase();
}
Elem.prototype.querySelectorAll = function (sel) { var parts = String(sel).split(',').map(function (s) { return s.trim(); }); var self = this; return this.findAll(function (n) { return n !== self && parts.some(function (p) { return matchSel(n, p); }); }); };
Elem.prototype.querySelector = function (sel) { var r = this.querySelectorAll(sel); return r.length ? r[0] : null; };

var docRoot = new Elem('html'); var body = new Elem('body'); docRoot.appendChild(body);
var byId = {};
function mk(tag, id, cls) { var e = new Elem(tag); if (id) { e.id = id; byId[id] = e; } if (cls) e.className = cls; body.appendChild(e); return e; }
mk('div', 'formHost'); mk('div', 'resultHost'); mk('div', 'vizHost'); mk('select', 'presetSel'); mk('div', 'editionBar');
mk('button', 'calcBtn'); mk('button', 'resetBtn');
mk('input', 'dtLabel'); mk('button', 'saveBtn'); mk('button', 'loadBtn'); mk('input', 'dtFile');
mk('button', 'printBtn'); mk('button', 'rtfBtn');
var brandMark = mk('span', null, 'mark');
mk('span', 'licenseLine', 'license-line');
mk('button', 'infoBtn', 'icon-btn');
mk('div', 'activation', 'modal-overlay');
mk('input', 'licName'); mk('input', 'licKey');
mk('button', 'licActivate'); mk('button', 'licLater');
['de', 'en', 'pt'].forEach(function (l) { var b = mk('button', null, 'lang-btn'); b.setAttribute('data-lang', l); });

var documentShim = {
  readyState: 'complete', documentElement: docRoot, body: body,
  createElement: function (t) { return new Elem(t); }, createElementNS: function (_n, t) { return new Elem(t); },
  createTextNode: function (txt) { var e = new Elem('#text'); e.textContent = txt; return e; },
  getElementById: function (id) { return byId[id] || null; },
  querySelectorAll: function (sel) { return docRoot.findAll(function (n) { return matchSel(n, sel); }); },
  querySelector: function (sel) { var r = docRoot.findAll(function (n) { return matchSel(n, sel); }); return r.length ? r[0] : null; },
  addEventListener: function () {}, execCommand: function () { return true; }
};
var lsMap = {};
global.window = global;
global.document = documentShim;
global.localStorage = { getItem: function (k) { return (k in lsMap) ? lsMap[k] : null; }, setItem: function (k, v) { lsMap[k] = String(v); }, removeItem: function (k) { delete lsMap[k]; } };
global.__clip = null;
try { Object.defineProperty(global, 'navigator', { value: { clipboard: { writeText: function (s) { global.__clip = s; return { then: function (ok) { ok(); return { then: function () {} }; } }; } } }, configurable: true, writable: true }); }
catch (e) { global.window.navigator = { clipboard: { writeText: function (s) { global.__clip = s; return { then: function (ok) { ok(); } }; } } }; }
global.Blob = function () {}; global.URL = { createObjectURL: function () { return 'blob:x'; }, revokeObjectURL: function () {} };
global.window.print = function () { global.__printed = true; };
global.FileReader = function () {}; global.FileReader.prototype.readAsText = function () {};

// >>> Der entscheidende Unterschied: Testversion einstellen, BEVOR ui.js lädt.
global.DT_EDITION = 'test';

['daten.js', 'validate.js', 'solver.js', 'freiform.js', 'thermik.js', 'rechenweg.js',
 'schaubild.js', 'beratung.js', 'pressverband.js', 'assistent.js', 'report.js', 'ui.js'].forEach(function (f) {
  (0, eval)(fs.readFileSync(__dirname + '/' + f, 'utf8') + '\n//# sourceURL=' + f);
});

var okCount = 0, failCount = 0;
function ok(c, l) { if (c) okCount++; else { failCount++; console.log('  FEHLER: ' + l); } }

var _st = global.setTimeout; global.setTimeout = function (fn) { if (typeof fn === 'function') fn(); return 0; };

var formHost = byId.formHost;
ok(formHost.children.length > 0, 'Testversion bootet (Formular gebaut)');
ok(byId.resultHost.children.length > 0, 'Testversion rechnet (Ergebnis da)');

var oldBar = byId.resultHost.findAll(function (n) { return n.classList.contains('output-bar'); });
ok(oldBar.length === 0, 'keine untere Ausgabe-Leiste (Buttons sind oben)');
ok(!!byId.saveBtn && !!byId.loadBtn, 'Speichern/Öffnen-Buttons oben vorhanden');

function lockedOverlays() { return body.findAll(function (n) { return n.classList.contains('locked-overlay'); }); }

// Speichern anklicken → KEIN Download, stattdessen Sperr-Overlay.
global.__clip = null; global.__printed = false;
byId.saveBtn.fire('click');
ok(lockedOverlays().length === 1, 'Testversion: Speichern öffnet das „Nur in der Vollversion"-Overlay');
var ov = lockedOverlays()[0];
ov.findAll(function (n) { return n.classList.contains('locked-ok'); })[0].fire('click');
ok(lockedOverlays().length === 0, 'Overlay lässt sich schließen');

// Öffnen anklicken → ebenfalls gesperrt (Datei-Import bleibt dicht).
byId.loadBtn.fire('click');
ok(lockedOverlays().length === 1, 'Testversion: Öffnen öffnet das Sperr-Overlay (Import blockiert)');
lockedOverlays()[0].findAll(function (n) { return n.classList.contains('locked-ok'); })[0].fire('click');
ok(lockedOverlays().length === 0, 'zweites Overlay geschlossen');

// Drucken anklicken → gesperrt, window.print NICHT gerufen.
byId.printBtn.fire('click');
ok(global.__printed === false, 'Testversion: Drucken wird geblockt (window.print NICHT gerufen)');
ok(lockedOverlays().length === 1, 'Testversion: Drucken öffnet das Sperr-Overlay');
lockedOverlays()[0].findAll(function (n) { return n.classList.contains('locked-ok'); })[0].fire('click');

// RTF anklicken → gesperrt.
byId.rtfBtn.fire('click');
ok(lockedOverlays().length === 1, 'Testversion: RTF-Export öffnet das Sperr-Overlay');
lockedOverlays()[0].findAll(function (n) { return n.classList.contains('locked-ok'); })[0].fire('click');

// Direkte Gating-Kontrolle: report.js sperrt in der Testversion jede Ausgabe.
var RP = global.DTPReport;
ok(['save', 'load', 'print', 'rtf', 'csv'].every(function (f) { return RP.isFeatureAllowed(f, 'test') === false; }),
   'Testversion: report.js sperrt save/load/print/rtf/csv');

/* B15: Editionsverhalten der Testversion. */
ok(byId.editionBar.hidden === false && byId.editionBar.classList.contains('test'),
   'Testversion: gelber „Testversion"-Balken sichtbar');
ok(byId.editionBar.textContent.length > 3, 'Balken trägt Editionstext');
ok(!byId.activation.classList.contains('open'), 'Testversion: KEIN Aktivierungsdialog beim Start');
ok(byId.licenseLine.hidden === true, 'Testversion: keine Lizenzzeile in der Kopfzeile');
// Info-Overlay funktioniert auch in der Testversion (identischer Inhalt).
byId.infoBtn.fire('click');
var infoOv = body.findAll(function (n) { return n.classList.contains('locked-overlay'); }).pop();
ok(!!infoOv && infoOv.textContent.indexOf('Dreierwalde') >= 0, 'Testversion: Info-Overlay mit Impressum');

global.setTimeout = _st;
console.log('\nDOM-Smoke B14-Test: ' + okCount + ' OK, ' + failCount + ' Fehler');
process.exit(failCount ? 1 : 0);
