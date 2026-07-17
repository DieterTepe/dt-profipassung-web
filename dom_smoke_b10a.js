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
  getElementById: function (id) { return byId[id] || null; },
  querySelectorAll: function (sel) { return docRoot.findAll(function (n) { return matchSel(n, sel); }); },
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

/* ------------------------------------------------- Module in Reihenfolge */
['daten.js', 'validate.js', 'solver.js', 'freiform.js', 'thermik.js',
 'rechenweg.js', 'schaubild.js', 'beratung.js', 'pressverband.js', 'ui.js'].forEach(function (f) {
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

console.log('\nDOM-Smoke B10a: ' + okCount + ' OK, ' + failCount + ' Fehler');
process.exit(failCount ? 1 : 0);
