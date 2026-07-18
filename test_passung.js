/* ============================================================================
 * DT-ProfiPassung · test_passung.js  (Node-Testharness, Baustein B1)
 * ----------------------------------------------------------------------------
 * Ausfuehren:  node test_passung.js
 * Prueft den ISO-286-Zahlenkern ISOLIERT, bevor irgendetwas in eine UI kommt:
 *   1) IT-Anker (publizierte Tabellenwerte, plan.md 6.1)
 *   2) Abmass-Anker Welle  (publizierte Werte)
 *   3) Abmass-Anker Bohrung (publizierte Werte, inkl. Delta-Sonderregel)
 *   4) Passungs-Anker (Spiel/Uebermass aus den Abmassen)
 *   5) Formel <-> Tabelle Quervergleich (Typo-Netz; Tabelle ist massgeblich)
 *   6) Invarianten & Property-Tests (Zufallsfaelle, deterministischer Seed)
 *   7) Fehlerpfade & Bereichsgrenzen
 * Regel (plan.md 6.3): Assertions wachsen organisch — erweitern, nie lockern.
 * ==========================================================================*/
'use strict';
/* Laeuft in Node UND im Browser (DT-ProfiPassung_Pruefstand.html): */
var isNode = (typeof module === 'object' && module.exports);
var D = isNode ? require('./daten.js')     : globalThis.DTPData;
var V = isNode ? require('./validate.js')  : globalThis.DTPValidate;
var S = isNode ? require('./solver.js')    : globalThis.DTPSolver;
var RW = isNode ? require('./rechenweg.js') : globalThis.DTPRechenweg;
var FF = isNode ? require('./freiform.js')  : globalThis.DTPFreiform;
var TH = isNode ? require('./thermik.js')   : globalThis.DTPThermik;
var SB = isNode ? require('./schaubild.js') : globalThis.DTPSchaubild;
var BR = isNode ? require('./beratung.js')  : globalThis.DTPBeratung;
var PV = isNode ? require('./pressverband.js') : globalThis.DTPPress;
var AS = isNode ? require('./assistent.js') : globalThis.DTPAssistent;
var RP = isNode ? require('./report.js') : globalThis.DTPReport;

/* --- Mini-Assert-Framework (Muster: DT-ProfiSchraube) ---------------------- */
var pass = 0, fail = 0, fails = [];
var OUT = [];
function say(t) { OUT.push(t); if (typeof console !== 'undefined') console.log(t); }
function ok(cond, msg) { if (cond) { pass++; } else { fail++; if (fails.length < 40) fails.push(msg); } }
function section(t) { say('\n  === ' + t + ' ==='); }

/* Quervergleich: bestanden, wenn Abweichung <= absTol ODER <= relTol (relativ). */
function crossOk(got, exp, absTol, relTol, msg) {
  var d = Math.abs(got - exp);
  var rel = exp !== 0 ? d / Math.abs(exp) : Infinity;
  ok(d <= absTol || rel <= relTol,
     msg + ' | Formel ' + got.toFixed(2) + ', Tabelle ' + exp + ', Abw. ' + d.toFixed(2) + ' µm');
}

/* Abmass-Anker-Helfer: exakte Gleichheit (Tabellenwerte sind ganzzahlige µm). */
function shaftIs(N, letter, grade, es, ei) {
  var r = D.shaftDeviations(N, letter, grade);
  ok(!r.code && r.es === es && r.ei === ei,
     N + ' ' + letter + grade + ' = ' + es + '/' + ei +
     (r.code ? ' | code=' + r.code : ' | got ' + r.es + '/' + r.ei));
}
function boreIs(N, letter, grade, ES, EI) {
  var r = D.boreDeviations(N, letter, grade);
  ok(!r.code && r.ES === ES && r.EI === EI,
     N + ' ' + letter + grade + ' = ' + ES + '/' + EI +
     (r.code ? ' | code=' + r.code : ' | got ' + r.ES + '/' + r.EI));
}

/* deterministischer PRNG fuer Property-Tests (mulberry32, fester Seed) */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* === 1) IT-Anker (plan.md 6.1 + quer ueber die Bereiche) =================== */
section('1) IT-Anker');
[[50, 6, 16], [50, 7, 25], [50, 8, 39], [50, 9, 62], [50, 11, 160],   // Plan-Anker Ø50
 [25, 6, 13], [25, 7, 21],
 [100, 6, 22], [100, 7, 35], [100, 8, 54],
 [10, 6, 9], [6, 7, 12], [3, 7, 10], [1, 6, 6],
 [160, 7, 40], [200, 6, 29], [300, 7, 52], [400, 7, 57], [450, 7, 63],
 [500, 16, 4000], [2, 1, 0.8], [5, 1, 1]
].forEach(function (a) {
  var got = D.itValue(a[0], a[1]);
  ok(got === a[2], 'IT' + a[1] + ' @ Ø' + a[0] + ' = ' + a[2] + ' µm | got ' + got);
});

/* === 2) Abmass-Anker Welle [µm] (publizierte Werte) ======================== */
section('2) Abmass-Anker Welle');
// Plan-Anker (Abschnitt 6.1):
shaftIs(50, 'g', 6, -9, -25);
shaftIs(50, 'f', 7, -25, -50);
shaftIs(50, 'e', 8, -50, -89);
shaftIs(50, 'k', 6, 18, 2);
shaftIs(50, 'n', 6, 33, 17);
shaftIs(50, 'p', 6, 42, 26);
shaftIs(50, 's', 6, 59, 43);
shaftIs(25, 'g', 6, -7, -20);
shaftIs(10, 'h', 6, 0, -9);
// Erweiterte Anker quer ueber Bereiche/Buchstaben:
shaftIs(8, 'f', 7, -13, -28);
shaftIs(25, 'f', 7, -20, -41);
shaftIs(30, 'd', 9, -65, -117);
shaftIs(150, 'd', 9, -145, -245);
shaftIs(100, 'e', 8, -72, -126);
shaftIs(3, 'g', 6, -2, -8);
shaftIs(200, 'g', 6, -15, -44);
shaftIs(6, 'h', 9, 0, -30);
shaftIs(12, 'k', 6, 12, 1);
shaftIs(16, 'n', 6, 23, 12);
shaftIs(80, 'p', 6, 51, 32);
shaftIs(2, 'p', 7, 16, 6);           // p(1–3) = +6 (Norm-historisch, nicht IT7+0..5!)
// s mit Zwischenstufen oberhalb 50 mm:
shaftIs(60, 's', 6, 72, 53);
shaftIs(70, 's', 6, 78, 59);
shaftIs(110, 's', 6, 101, 79);
shaftIs(300, 's', 7, 222, 170);      // s(280–315) = +170, IT7(250–315) = 52
// js symmetrisch (Plan-Anker 100 js6 = ±11):
(function () {
  var r = D.shaftDeviations(100, 'js', 6);
  ok(r.es === 11 && r.ei === -11 && r.symmetric === true, '100 js6 = ±11');
  var r2 = D.shaftDeviations(50, 'js', 7);
  ok(r2.es === 12.5 && r2.ei === -12.5, '50 js7 = ±12,5 (echtes Normverhalten bei ungeradem IT)');
})();
// k-Gradregel: Grundabmass nur IT4..IT7, sonst 0:
shaftIs(50, 'k', 8, 39, 0);
shaftIs(50, 'k', 3, 4, 0);
// Datenpass — a, b, c (es-Feinraster, publizierte Werte):
shaftIs(25, 'a', 11, -300, -430);
shaftIs(2, 'a', 9, -270, -295);
shaftIs(40, 'b', 9, -170, -232);
shaftIs(120, 'b', 10, -240, -380);
shaftIs(25, 'c', 11, -110, -240);
shaftIs(45, 'c', 11, -130, -290);
shaftIs(160, 'c', 12, -210, -610);
// Datenpass — r, t, u, v, x, y, z, za, zb, zc (ei-Feinraster):
shaftIs(30, 'r', 6, 41, 28);
shaftIs(100, 'r', 6, 73, 51);
shaftIs(160, 'r', 6, 90, 65);
shaftIs(70, 't', 6, 94, 75);
shaftIs(40, 'u', 8, 99, 60);
shaftIs(45, 'u', 8, 109, 70);
shaftIs(16, 'v', 7, 57, 39);
shaftIs(25, 'x', 8, 97, 64);
shaftIs(2, 'x', 8, 34, 20);
shaftIs(20, 'y', 7, 84, 63);
shaftIs(100, 'z', 7, 293, 258);
shaftIs(5, 'z', 7, 47, 35);
shaftIs(30, 'za', 7, 139, 118);
shaftIs(30, 'zb', 7, 181, 160);
shaftIs(30, 'zc', 7, 239, 218);
// j gepinnt (⚠ Zweitquelle ausstehend — pinnt den Datenstand gegen versehentliche Edits):
(function () {
  var r = D.shaftDeviations(50, 'j', 6);
  ok(r.es === 11 && r.ei === -5 && r.unverified === true, '50 j6 = +11/-5 (gepinnt, Zweitquelle ausstehend)');
  r = D.shaftDeviations(50, 'j', 5);
  ok(r.es === 6 && r.ei === -5, '50 j5 = +6/-5 (gepinnt)');
  r = D.shaftDeviations(30, 'j', 7);
  ok(r.es === 13 && r.ei === -8, '30 j7 = +13/-8 (gepinnt)');
  ok(D.shaftDeviations(50, 'j', 8).code === D.CODE.FD_UNDEFINED, 'j8: nicht vorgesehen -> js8 nutzen');
})();

/* === 3) Abmass-Anker Bohrung [µm] ========================================= */
section('3) Abmass-Anker Bohrung');
// Plan-Anker:
boreIs(50, 'H', 7, 25, 0);
boreIs(25, 'H', 7, 21, 0);
boreIs(100, 'H', 7, 35, 0);
boreIs(6, 'H', 7, 12, 0);
// Allgemeinregel EI = -es (A..H):
boreIs(100, 'H', 8, 54, 0);
boreIs(20, 'H', 7, 21, 0);
boreIs(40, 'G', 7, 34, 9);
boreIs(100, 'F', 8, 90, 36);
boreIs(25, 'E', 9, 92, 40);
boreIs(25, 'D', 10, 149, 65);
// Sonderregel ES = -ei + Delta (K/M/N <= IT8, P.. <= IT7) — publizierte Werte:
boreIs(5, 'K', 7, 3, -9);
boreIs(25, 'K', 7, 6, -15);
boreIs(30, 'K', 6, 2, -11);
boreIs(50, 'K', 7, 7, -18);
boreIs(80, 'K', 7, 9, -21);
boreIs(5, 'M', 7, 0, -12);
boreIs(25, 'M', 7, 0, -21);
boreIs(50, 'M', 7, 0, -25);
boreIs(100, 'M', 7, 0, -35);
boreIs(5, 'N', 7, -4, -16);
boreIs(25, 'N', 7, -7, -28);
boreIs(50, 'N', 7, -8, -33);
boreIs(100, 'N', 7, -10, -45);
boreIs(2, 'P', 7, -6, -16);
boreIs(25, 'P', 7, -14, -35);
boreIs(50, 'P', 7, -17, -42);
boreIs(100, 'P', 7, -24, -59);
boreIs(60, 'S', 7, -42, -72);
// Delta = 0 bis 3 mm (Beleg: publizierte Kleinstmass-Werte folgen der Allgemeinregel):
boreIs(2, 'K', 7, 0, -10);
boreIs(2, 'M', 7, -2, -12);
boreIs(2, 'N', 7, -4, -14);
// Norm-Ausnahme M6 ueber 250–315: ES = -9 (statt -11); Nachbarbereich normal:
boreIs(280, 'M', 6, -9, -41);
boreIs(200, 'M', 6, -8, -37);
// Oberhalb der Sonderregel gilt die Allgemeinregel ES = -ei:
boreIs(50, 'P', 8, -26, -65);
boreIs(50, 'K', 9, 0, -62);
boreIs(50, 'M', 9, -9, -71);
boreIs(50, 'N', 9, -17, -79);
// Regelableitungen an der Sonderregel-Grenze (extern gegenpruefen):
boreIs(50, 'K', 8, 14, -25);
boreIs(50, 'M', 8, 5, -34);
// JS symmetrisch:
(function () {
  var r = D.boreDeviations(50, 'JS', 7);
  ok(r.ES === 12.5 && r.EI === -12.5 && r.symmetric === true, '50 JS7 = ±12,5');
})();
// Datenpass — Allgemeinregel A/B/C (publizierte Klassiker):
boreIs(25, 'A', 11, 430, 300);
boreIs(40, 'B', 9, 232, 170);
boreIs(25, 'C', 11, 240, 110);
// Datenpass — Sonderregel auf dem Feinraster:
boreIs(30, 'R', 7, -20, -41);
boreIs(60, 'T', 7, -55, -85);
boreIs(25, 'U', 7, -40, -61);
// Allgemeinregel oberhalb IT7 (Schrumpfsitz-Klassiker):
boreIs(50, 'U', 8, -70, -109);
// Regelableitung Feinraster (extern gegenpruefen):
boreIs(50, 'ZA', 7, -171, -196);
// J gepinnt (⚠ Zweitquelle ausstehend):
(function () {
  var r = D.boreDeviations(50, 'J', 7);
  ok(r.ES === 14 && r.EI === -11 && r.unverified === true, '50 J7 = +14/-11 (gepinnt, Zweitquelle ausstehend)');
  r = D.boreDeviations(100, 'J', 6);
  ok(r.ES === 16 && r.EI === -6, '100 J6 = +16/-6 (gepinnt)');
  ok(D.boreDeviations(50, 'J', 5).code === D.CODE.FD_UNDEFINED, 'J5: nicht vorgesehen');
})();
// Norm-Fussnote: Grundabmass N oberhalb IT8 nicht bis 1 mm:
ok(D.boreDeviations(1, 'N', 9).code === D.CODE.FD_UNDEFINED, 'N9 @ 1 mm: Norm sieht das nicht vor');
boreIs(1.5, 'N', 9, -4, -29);

/* === 4) Passungs-Anker (Spiel/Uebermass aus den Abmassen) ================== */
section('4) Passungs-Anker');
function fitOf(N, holeL, holeG, shaftL, shaftG) {
  var b = D.boreDeviations(N, holeL, holeG);
  var s = D.shaftDeviations(N, shaftL, shaftG);
  return { max: b.ES - s.ei, min: b.EI - s.es };  // >0 Spiel, <0 Uebermass
}
(function () {
  var f = fitOf(50, 'H', 7, 'g', 6);
  ok(f.min === 9 && f.max === 50, '50 H7/g6 -> Spiel 9…50 µm | got ' + f.min + '…' + f.max);
  f = fitOf(50, 'H', 7, 's', 6);
  ok(f.min === -59 && f.max === -18, '50 H7/s6 -> Uebermass 18…59 µm | got ' + f.min + '…' + f.max);
  f = fitOf(25, 'H', 7, 'f', 7);
  ok(f.min === 20 && f.max === 62, '25 H7/f7 -> Spiel 20…62 µm (Preset Gleitlager)');
  f = fitOf(20, 'H', 7, 'k', 6);
  ok(f.min === -15 && f.max === 19, '20 H7/k6 -> Uebergang -15…+19 µm (Preset Passfeder)');
  f = fitOf(60, 'H', 7, 's', 6);
  ok(f.min === -72 && f.max === -23, '60 H7/s6 -> Uebermass 23…72 µm (Preset Pressverband)');
  f = fitOf(100, 'H', 8, 'e', 8);
  ok(f.min === 72 && f.max === 180, '100 H8/e8 -> Spiel 72…180 µm (Preset)');
})();

/* === 5) Formel <-> Tabelle Quervergleich (Tabelle massgeblich) ============= */
section('5) Formel <-> Tabelle');
// 5a) IT-Stufen aus Toleranzfaktor i: IT5=7i, IT6=10i, ... IT16=1000i.
var IT_MULT = { 5: 7, 6: 10, 7: 16, 8: 25, 9: 40, 10: 64, 11: 100, 12: 160, 13: 250, 14: 400, 15: 640, 16: 1000 };
D.MAIN_MAX.forEach(function (mx, ri) {
  var i = D.toleranceFactor(D.MAIN_D[ri]);
  Object.keys(IT_MULT).forEach(function (g) {
    var exp = D.IT[g][ri];
    // Stufe 1..3 mm weicht norm-historisch staerker ab -> 16 %, sonst 2 µm / 8 %.
    crossOk(IT_MULT[g] * i, exp, ri === 0 ? 0 : 2, ri === 0 ? 0.16 : 0.08,
            'IT' + g + ' Stufe bis ' + mx);
  });
});
// 5b) Grundabmasse Welle: es-Formeln d,e,f,g und ei-Formeln n,k.
['d', 'e', 'f', 'g'].forEach(function (L) {
  D.MAIN_MAX.forEach(function (mx, ri) {
    var got = D.FORMULA_ES[L](D.MAIN_D[ri]);
    var exp = D.shaftDeviations(Math.max(1, mx - 0.5), L, 7).es;
    crossOk(got, exp, 3, 0.12, 'es(' + L + ') Stufe bis ' + mx);
  });
});
D.MAIN_MAX.forEach(function (mx, ri) {
  var N = Math.max(1, mx - 0.5);
  crossOk(D.FORMULA_EI.n(D.MAIN_D[ri]), D.shaftDeviations(N, 'n', 7).ei, 3, 0.12, 'ei(n) Stufe bis ' + mx);
  crossOk(D.FORMULA_EI.k(D.MAIN_D[ri]), D.shaftDeviations(N, 'k', 7).ei, 3, 0.12, 'ei(k) Stufe bis ' + mx);
});
// m = IT7 - IT6 (exakt ab 3 mm; Stufe 1..3 norm-historisch +2 statt +4):
D.MAIN_MAX.forEach(function (mx, ri) {
  var N = Math.max(1, mx - 0.5);
  var m = D.shaftDeviations(N, 'm', 7).ei;
  if (ri === 0) ok(m === 2, 'ei(m) Stufe bis 3 = +2 (Norm-historisch)');
  else ok(m === D.IT[7][ri] - D.IT[6][ri], 'ei(m) = IT7-IT6 Stufe bis ' + mx + ' | got ' + m);
});
// p in [IT7 .. IT7+5] (ab 3 mm; Stufe 1..3 ist p=+6 als Anker in Sektion 2 belegt):
D.MAIN_MAX.forEach(function (mx, ri) {
  if (ri === 0) return;
  var N = mx - 0.5;
  var diff = D.shaftDeviations(N, 'p', 7).ei - D.IT[7][ri];
  ok(diff >= 0 && diff <= 5, 'ei(p) = IT7 + 0..5 Stufe bis ' + mx + ' | Abstand ' + diff);
});
// s: bis 50 mm in [IT8 .. IT8+5]; darueber Formel IT7 + 0,4·D je Zwischenstufe:
[[1, 3], [3, 6], [6, 10], [10, 18], [18, 30], [30, 50]].forEach(function (st) {
  var N = st[1] - 0.25, ri = D.rangeIndex(N);
  var diff = D.shaftDeviations(N, 's', 7).ei - D.IT[8][ri];
  ok(diff >= 0 && diff <= 5, 'ei(s) = IT8 + 0..5 Stufe bis ' + st[1] + ' | Abstand ' + diff);
});
[[50, 65], [65, 80], [80, 100], [100, 120], [120, 140], [140, 160], [160, 180],
 [180, 200], [200, 225], [225, 250], [250, 280], [280, 315], [315, 355],
 [355, 400], [400, 450], [450, 500]].forEach(function (st) {
  var Dm = Math.sqrt(st[0] * st[1]);
  var got = D.itValue(st[1], 7) + 0.4 * Dm;
  var exp = D.shaftDeviations(Dm, 's', 7).ei;
  crossOk(got, exp, 2, 0.04, 'ei(s) = IT7 + 0,4·D Stufe ' + st[0] + '–' + st[1]);
});

// 5c) Feinraster-Buchstaben: a,b,c (es) und t..zc (ei) je Zwischenstufe.
// AUSREISSERLISTE: kleine Nennmasse einiger Buchstaben sind norm-historische
// Uebernahmen aus der ISA und weichen staerker von der Formel ab (z bei 1-3 mm
// bis 45 %) — dort gilt nur das Grobnetz (50 %), das Vorzeichenfehler (200 %),
// Zehnerpotenzen und Zahlendreher trotzdem sicher faengt.
var WHITELIST = { u: { 0: 1, 1: 1, 2: 1 }, x: { 0: 1, 1: 1, 2: 1 }, z: { 0: 1, 1: 1, 2: 1 },
                  za: { 0: 1, 1: 1 }, zb: { 0: 1 }, zc: { 0: 1, 1: 1 } };
var FD_LO = [1].concat(D.FD_MAX.slice(0, 24));
D.FD_MAX.forEach(function (mx, fi) {
  var lo = FD_LO[fi], Dm = Math.sqrt(lo * mx);
  var itR = function (g) { return D.itValue(Dm, g); };
  ['a', 'b', 'c'].forEach(function (L) {
    var r = D.shaftDeviations(Dm, L, 7); if (r.code) return;
    // c 10..40 mm: historische Uebernahme -> 15 % statt 12 %.
    crossOk(D.FORMULA_ES[L](Dm), r.es, 3, L === 'c' ? 0.15 : 0.12,
            'es(' + L + ') Feinstufe ' + lo + '-' + mx);
  });
  ['t', 'u', 'v', 'x', 'y', 'z', 'za', 'zb', 'zc'].forEach(function (L) {
    var r = D.shaftDeviations(Dm, L, 7); if (r.code) return;
    var rel = (WHITELIST[L] && WHITELIST[L][fi]) ? 0.50 : 0.12;
    crossOk(D.FORMULA_EI[L](Dm, itR), r.ei, 3, rel, 'ei(' + L + ') Feinstufe ' + lo + '-' + mx);
  });
  // r = geometrisches Mittel aus p und s (Norm-Regel):
  var rr = D.shaftDeviations(Dm, 'r', 7);
  var pp = D.shaftDeviations(Dm, 'p', 7), ss = D.shaftDeviations(Dm, 's', 7);
  crossOk(Math.sqrt(pp.ei * ss.ei), rr.ei, 2, 0.04, 'ei(r) = sqrt(p*s) Feinstufe ' + lo + '-' + mx);
});

/* === 6) Invarianten & Property-Tests ====================================== */
section('6) Invarianten & Properties');
var PROBES = [1, 2, 3, 3.5, 5, 6, 8, 10, 14, 18, 20, 25, 30, 40, 45, 50, 55, 63,
  70, 80, 90, 100, 110, 120, 130, 150, 170, 180, 200, 220, 250, 260, 280, 300,
  315, 350, 355, 380, 400, 420, 450, 480, 500];
var LETTERS_ALL = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p',
  'r', 's', 't', 'u', 'v', 'x', 'y', 'z', 'za', 'zb', 'zc'];
var GRADES = []; for (var g6 = 1; g6 <= 16; g6++) GRADES.push(g6);

// IT streng steigend im Grad, schwach steigend im Nennmassbereich:
for (var ri6 = 0; ri6 < 13; ri6++) {
  for (var gg = 1; gg < 16; gg++) {
    ok(D.IT[gg + 1][ri6] > D.IT[gg][ri6], 'IT' + (gg + 1) + ' > IT' + gg + ' (Stufe ' + ri6 + ')');
  }
}
GRADES.forEach(function (g) {
  for (var r = 1; r < 13; r++) ok(D.IT[g][r] >= D.IT[g][r - 1], 'IT' + g + ' waechst mit Stufe ' + r);
});

// H: EI=0, ES=IT · h: es=0 · js/JS symmetrisch · Identitaeten es-ei=IT, ES-EI=IT:
PROBES.forEach(function (N) {
  GRADES.forEach(function (g) {
    var T = D.itValue(N, g);
    var H = D.boreDeviations(N, 'H', g);
    ok(H.EI === 0 && H.ES === T, 'H: EI=0, ES=IT @ ' + N + '/' + g);
    var h = D.shaftDeviations(N, 'h', g);
    ok(h.es === 0 && h.ei === -T, 'h: es=0, ei=-IT @ ' + N + '/' + g);
    var js = D.shaftDeviations(N, 'js', g);
    ok(js.es === -js.ei && js.es * 2 === T, 'js symmetrisch @ ' + N + '/' + g);
    // Identitaet es-ei=IT bzw. ES-EI=IT. Toleranz 1e-9 µm liegt 8 Zehnerpotenzen
    // unter dem kleinsten Norm-Schritt (0,1 µm) — faengt jeden echten Fehler und
    // laesst nur den Gleitkomma-Staub der Norm-Halbwerte durch (IT1..IT3 klein,
    // Delta bei Feingraden wie M2: 0,8 µm ist binaer nicht exakt darstellbar).
    LETTERS_ALL.forEach(function (L) {
      var s = D.shaftDeviations(N, L, g);
      if (!s.code) ok(Math.abs((s.es - s.ei) - T) < 1e-9, 'es-ei=IT (' + L + g + ' @ ' + N + ')');
      var b = D.boreDeviations(N, L.toUpperCase(), g);
      if (!b.code) ok(Math.abs((b.ES - b.EI) - T) < 1e-9, 'ES-EI=IT (' + L.toUpperCase() + g + ' @ ' + N + ')');
    });
    // Allgemeinregel EI = -es fuer A..H:
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(function (L) {
      var sG = D.shaftDeviations(N, L, g), bG = D.boreDeviations(N, L.toUpperCase(), g);
      if (!sG.code && !bG.code) ok(bG.EI === -sG.es,
         'Allgemeinregel EI=-es (' + L + ' @ ' + N + '/' + g + ')');
    });
  });
});

// Sonderregel-Delta NUR K/M/N <= IT8 und P..ZC <= IT7 (oberhalb: Allgemeinregel ES=-ei):
PROBES.forEach(function (N) {
  ['k', 'm', 'n'].forEach(function (L) {
    for (var g = 9; g <= 16; g++) {
      var sD = D.shaftDeviations(N, L, g), bD = D.boreDeviations(N, L.toUpperCase(), g);
      if (!sD.code && !bD.code) ok(bD.ES === -sD.ei,
         'keine Delta oberhalb IT8 (' + L.toUpperCase() + g + ' @ ' + N + ')');
    }
  });
  ['p', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z', 'za', 'zb', 'zc'].forEach(function (L) {
    for (var g = 8; g <= 16; g++) {
      var sD = D.shaftDeviations(N, L, g), bD = D.boreDeviations(N, L.toUpperCase(), g);
      if (!sD.code && !bD.code) ok(bD.ES === -sD.ei,
         'keine Delta oberhalb IT7 (' + L.toUpperCase() + g + ' @ ' + N + ')');
    }
  });
});

// Buchstaben-Ordnung je Nennmass (Typo-Netz), volle Kette (nicht vorgesehene
// Felder werden uebersprungen; j bleibt als asymmetrisches Feld aussen vor):
PROBES.forEach(function (N) {
  var esSeq = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(function (L) {
    var r = D.shaftDeviations(N, L, 7); return r.code ? null : r.es;
  }).filter(function (v) { return v !== null; });
  for (var i2 = 1; i2 < esSeq.length; i2++) {
    ok(esSeq[i2 - 1] < esSeq[i2], 'Ordnung es a..g @ ' + N + ' Pos ' + i2);
  }
  ok(esSeq[esSeq.length - 1] < 0, 'g < 0 @ ' + N);
  var eiSeq = ['k', 'm', 'n', 'p', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z', 'za', 'zb', 'zc']
    .map(function (L) {
      var r = D.shaftDeviations(N, L, 7); return r.code ? null : r.ei;
    }).filter(function (v) { return v !== null; });
  for (var i3 = 1; i3 < eiSeq.length; i3++) {
    ok(eiSeq[i3 - 1] < eiSeq[i3], 'Ordnung ei k..zc @ ' + N + ' Pos ' + i3);
  }
  ok(eiSeq[0] >= 0, 'k >= 0 @ ' + N);
});

// Ganzzahligkeit: Kern-Abmasse sind ganzzahlige µm, ueberall wo IT ganzzahlig ist
// (Ausnahme sind allein die Norm-Halbwerte IT1..IT3 bei kleinen Nennmassen):
PROBES.forEach(function (N) {
  for (var g = 1; g <= 16; g++) {
    var T = D.itValue(N, g);
    if (!Number.isInteger(T)) continue;
    LETTERS_ALL.forEach(function (L) {
      var s = D.shaftDeviations(N, L, g);
      if (!s.code) ok(Number.isInteger(s.es) && Number.isInteger(s.ei), 'ganzzahlig ' + L + g + ' @ ' + N);
    });
  }
});

// Zufalls-Property (deterministischer Seed): Identitaeten + Wiederholbarkeit:
(function () {
  var rnd = mulberry32(20260713);
  var LETTERS = LETTERS_ALL.concat(['js']);
  for (var i = 0; i < 4000; i++) {
    var N = 1 + rnd() * 499;
    var g = 1 + Math.floor(rnd() * 16);
    var L = LETTERS[Math.floor(rnd() * LETTERS.length)];
    var T = D.itValue(N, g);
    var a = D.shaftDeviations(N, L, g);
    var b = D.shaftDeviations(N, L, g);
    ok(a.es === b.es && a.ei === b.ei && a.code === b.code,
       'deterministisch ' + L + g + ' @ ' + N.toFixed(3));
    if (!a.code) ok(Math.abs((a.es - a.ei) - T) < 1e-9, 'es-ei=IT (Zufall) ' + L + g + ' @ ' + N.toFixed(3));
    var B = D.boreDeviations(N, L.toUpperCase(), g);
    if (!B.code) ok(Math.abs((B.ES - B.EI) - T) < 1e-9, 'ES-EI=IT (Zufall) ' + L.toUpperCase() + g + ' @ ' + N.toFixed(3));
  }
})();

/* === 7) Fehlerpfade & Bereichsgrenzen ===================================== */
section('7) Fehlerpfade & Grenzen');
function mustThrow(fn, msg) { try { fn(); ok(false, msg + ' (sollte werfen)'); } catch (e) { ok(true, msg); } }
mustThrow(function () { D.itValue(0.5, 7); }, 'Nennmass 0,5 mm -> Fehler (unter 1 mm)');
mustThrow(function () { D.itValue(501, 7); }, 'Nennmass 501 mm -> Fehler (ueber 500 mm)');
mustThrow(function () { D.itValue(50, 17); }, 'IT17 -> ERR_GRADE_UNKNOWN (B1-Umfang bis IT16)');
mustThrow(function () { D.itValue(50, 0); }, 'IT0 -> ERR_GRADE_UNKNOWN');
ok(D.shaftDeviations(0.5, 'g', 6).code === D.CODE.OUT_OF_RANGE, 'Abmass unter 1 mm -> OUT_OF_RANGE');
ok(D.shaftDeviations(600, 'g', 6).code === D.CODE.OUT_OF_RANGE, 'Abmass ueber 500 mm -> OUT_OF_RANGE');
ok(D.shaftDeviations(5, 'cd', 7).code === D.CODE.FD_NOT_IN_DATASET, 'cd: V1 bewusst ohne cd/ef/fg');
ok(D.shaftDeviations(50, 'q', 7).code === D.CODE.LETTER_UNKNOWN, 'q: gibt es in ISO 286 nicht');
ok(D.boreDeviations(50, 'W', 7).code === D.CODE.LETTER_UNKNOWN, 'W: gibt es in ISO 286 nicht');

// Von der Norm nicht vorgesehene Felder -> FD_UNDEFINED (inkl. Grenzverhalten):
ok(D.shaftDeviations(24, 't', 7).code === D.CODE.FD_UNDEFINED &&
   D.shaftDeviations(24.5, 't', 7).ei === 41, 't erst ueber 24 mm (Grenze)');
ok(D.shaftDeviations(14, 'v', 7).code === D.CODE.FD_UNDEFINED &&
   D.shaftDeviations(14.5, 'v', 7).ei === 39, 'v erst ueber 14 mm (Grenze)');
ok(D.shaftDeviations(18, 'y', 7).code === D.CODE.FD_UNDEFINED &&
   D.shaftDeviations(18.5, 'y', 7).ei === 63, 'y erst ueber 18 mm (Grenze)');
ok(D.shaftDeviations(1, 'a', 7).code === D.CODE.FD_UNDEFINED &&
   D.shaftDeviations(1.5, 'a', 7).es === -270, 'a nicht bis 1 mm (Norm-Fussnote)');
ok(D.shaftDeviations(1, 'b', 7).code === D.CODE.FD_UNDEFINED, 'b nicht bis 1 mm (Norm-Fussnote)');
ok(D.shaftDeviations(1, 'c', 7).es === -60, 'c gilt auch bei 1 mm');

// Feinraster-Grenzen "ueber .. bis einschliesslich":
ok(D.shaftDeviations(40, 'u', 7).ei === 60 && D.shaftDeviations(40.5, 'u', 7).ei === 70, 'u-Feingrenze 40 mm');
ok(D.shaftDeviations(14, 'x', 7).ei === 40 && D.shaftDeviations(14.5, 'x', 7).ei === 45, 'x-Feingrenze 14 mm');
ok(D.shaftDeviations(10, 'c', 7).es === -80 && D.shaftDeviations(10.5, 'c', 7).es === -95, 'c-Feingrenze 10 mm');
ok(D.shaftDeviations(50, 'r', 7).ei === 34 && D.shaftDeviations(50.5, 'r', 7).ei === 41, 'r-Feingrenze 50 mm');

// Bereichsgrenzen "ueber .. bis einschliesslich":
ok(D.itValue(3, 7) === 10 && D.itValue(3.1, 7) === 12, 'Grenze 3 mm: 3->Stufe 1..3, 3,1->Stufe 3..6');
ok(D.itValue(6, 7) === 12 && D.itValue(6.5, 7) === 15, 'Grenze 6 mm');
ok(D.itValue(50, 6) === 16 && D.itValue(50.5, 6) === 19, 'Grenze 50 mm');
ok(D.itValue(500, 7) === 63, 'Grenze 500 mm (einschliesslich)');
ok(D.shaftDeviations(50, 's', 6).ei === 43 && D.shaftDeviations(50.5, 's', 6).ei === 53,
   's-Zwischenstufe: Grenze 50 mm');
ok(D.shaftDeviations(65, 's', 6).ei === 53 && D.shaftDeviations(66, 's', 6).ei === 59,
   's-Zwischenstufe: Grenze 65 mm');

// limits()-Fassade (Gross = Bohrung, klein = Welle):
(function () {
  var b = D.limits(50, 'H', 7);
  ok(b.hole === true && b.upper === 25 && b.lower === 0, 'limits: H7 als Bohrung erkannt');
  var s = D.limits(50, 'g', 6);
  ok(s.hole === false && s.upper === -9 && s.lower === -25, 'limits: g6 als Welle erkannt');
  ok(D.limits(50, 'JS', 7).hole === true && D.limits(50, 'js', 7).hole === false,
     'limits: JS/js korrekt unterschieden');
})();

/* === 8) Validate — Feldprüfung (harte Grenzen / Warnungen) ================ */
section('8) Validate');
function vOk(inp, msg) { var r = V.validateFit(inp); ok(r.ok, msg + (r.ok ? '' : ' | ' + r.errors.map(function (e) { return e.code; }).join(','))); return r; }
function vErr(inp, code, msg) {
  var r = V.validateFit(inp);
  ok(!r.ok && r.errors.some(function (e) { return e.code === code; }),
     msg + ' -> ' + code + (r.ok ? ' | faelschlich ok' : ' | got ' + r.errors.map(function (e) { return e.code; }).join(',')));
}
function vWarn(inp, code, msg) {
  var r = V.validateFit(inp);
  ok(r.warnings.some(function (w) { return w.code === code; }), msg + ' -> Warnung ' + code);
}
// gueltige Faelle:
vOk({ nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'g', grade: 6 } }, '50 H7/g6 gueltig');
vOk({ nominal: 1, hole: { letter: 'H', grade: 6 }, shaft: { letter: 'js', grade: 5 } }, '1 H6/js5 gueltig');
vOk({ nominal: 500, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'h', grade: 6 } }, '500 H7/h6 gueltig');
// harte Grenzen:
vErr({ nominal: 0.5, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'g', grade: 6 } }, V.CODE.OUT_OF_RANGE, 'Nennmass 0,5 mm');
vErr({ nominal: 501, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'g', grade: 6 } }, V.CODE.OUT_OF_RANGE, 'Nennmass 501 mm');
vErr({ nominal: '50', hole: { letter: 'H', grade: 7 }, shaft: { letter: 'g', grade: 6 } }, V.CODE.NOMINAL_TYPE, 'Nennmass als String');
vErr({ nominal: 50, hole: { letter: 'H', grade: 17 }, shaft: { letter: 'g', grade: 6 } }, V.CODE.GRADE_RANGE, 'IT17 ausserhalb V1');
vErr({ nominal: 50, hole: { letter: 'H', grade: 6.5 }, shaft: { letter: 'g', grade: 6 } }, V.CODE.GRADE_TYPE, 'IT 6,5 keine ganze Zahl');
vErr({ nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'g', grade: 6 }, extra: 1 } && { nominal: 50, hole: { letter: 'g', grade: 7 }, shaft: { letter: 'g', grade: 6 } }, V.CODE.LETTER_CASE, 'Bohrung mit Kleinbuchstabe');
vErr({ nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'G', grade: 6 } }, V.CODE.LETTER_CASE, 'Welle mit Grossbuchstabe');
vErr({ nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'q', grade: 6 } }, V.CODE.LETTER_UNKNOWN, 'q gibt es nicht');
vErr({ nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'cd', grade: 6 } }, V.CODE.FD_NOT_IN_DATASET, 'cd nicht im V1-Datensatz');
vErr({ nominal: 24, hole: { letter: 'H', grade: 7 }, shaft: { letter: 't', grade: 6 } }, V.CODE.FD_UNDEFINED, 't bis 24 mm nicht vorgesehen');
vErr({ nominal: 50, hole: { letter: 'H', grade: 7 } }, V.CODE.FIT_INCOMPLETE, 'Welle fehlt');
vErr({ nominal: 50, shaft: { letter: 'g', grade: 6 } }, V.CODE.FIT_INCOMPLETE, 'Bohrung fehlt');
// Warnungen (nicht blockierend):
vWarn({ nominal: 50, hole: { letter: 'H', grade: 12 }, shaft: { letter: 'd', grade: 12 } }, V.CODE.COARSE_FIT, 'IT12 sehr grob (Passfunktion fraglich)');
(function () {
  var r = V.validateFit({ nominal: 50, hole: { letter: 'H', grade: 11 }, shaft: { letter: 'c', grade: 11 } });
  ok(!r.warnings.some(function (w) { return w.code === V.CODE.COARSE_FIT; }),
     'IT11 warnt NICHT (gaengige Grob-Passung H11/c11)');
})();
vWarn({ nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'f', grade: 9 } }, V.CODE.GRADE_PAIR, 'Gradpaarung 7/9');
vWarn({ nominal: 50, hole: { letter: 'J', grade: 7 }, shaft: { letter: 'h', grade: 6 } }, V.CODE.UNVERIFIED, 'J7 Zweitquelle ausstehend');
(function () {
  var r = V.validateFit({ nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'g', grade: 6 } });
  ok(r.warnings.length === 0, '50 H7/g6 ohne Warnungen (sauberer Standardfall)');
})();

/* === 9) Engine — parseFit / computeFit (Kennwerte 1.2, Passungsart) ======== */
section('9) Engine computeFit');
// Parser-Roundtrip (Property, plan.md 6.2):
[['50 H7/g6', 50, 'H', 7, 'g', 6], ['Ø50 H7 / g6', 50, 'H', 7, 'g', 6],
 ['50H7/g6', 50, 'H', 7, 'g', 6], ['50,5 H8/f7', 50.5, 'H', 8, 'f', 7],
 ['25 H7/js6', 25, 'H', 7, 'js', 6], ['50 JS7/h6', 50, 'JS', 7, 'h', 6],
 ['50 H7/zc6', 50, 'H', 7, 'zc', 6], ['120 H7/u8', 120, 'H', 7, 'u', 8],
 ['1 H7/g6', 1, 'H', 7, 'g', 6]
].forEach(function (t) {
  var p = S.parseFit(t[0]);
  ok(p.ok && p.nominal === t[1] && p.hole.letter === t[2] && p.hole.grade === t[3] &&
     p.shaft.letter === t[4] && p.shaft.grade === t[5], 'parse "' + t[0] + '"' + (p.ok ? '' : ' | ' + p.error));
  // Roundtrip: format -> parse ergibt dieselbe Struktur:
  var rt = S.parseFit(S.formatFit(p));
  ok(rt.nominal === p.nominal && rt.hole.letter === p.hole.letter && rt.hole.grade === p.hole.grade &&
     rt.shaft.letter === p.shaft.letter && rt.shaft.grade === p.shaft.grade, 'Roundtrip "' + t[0] + '"');
});
// Parser-Fehlerpfade:
['', 'abc', '50', '50 H7', '50 H7/', '50 /g6', '50 H7/g', '50 H7/gg6', 'H7/g6'].forEach(function (bad) {
  var p = S.parseFit(bad);
  ok(!p.ok, 'parse-Fehler erkannt: "' + bad + '"' + (p.ok ? ' | faelschlich ok' : ''));
});

// Abmaß-/Grenzmaß-Anker über computeFit:
(function () {
  var r = S.computeFit('50 H7/g6');
  ok(r.ok && r.hole.Go === 50.025 && r.hole.Gu === 50.000, '50 H7 Grenzmasse 50,000…50,025');
  ok(r.shaft.Go === 49.991 && r.shaft.Gu === 49.975, '50 g6 Grenzmasse 49,975…49,991');
  ok(r.fit.PSmin === 9 && r.fit.PSmax === 50 && r.fit.art === 'SPIEL', '50 H7/g6 Spiel 9…50 (Spielpassung)');
  ok(r.fit.PT === 41 && r.hole.T === 25 && r.shaft.T === 16, 'Passtoleranz 41 = 25+16');
})();
(function () {
  var r = S.computeFit('50 H7/s6');
  ok(r.fit.art === 'UEBERMASS' && r.fit.interferenceMin === 18 && r.fit.interferenceMax === 59,
     '50 H7/s6 Uebermass 18…59 (Uebermasspassung)');
  ok(r.shaft.Go === 50.059 && r.shaft.Gu === 50.043, '50 s6 Grenzmasse 50,043…50,059');
})();
(function () {
  var r = S.computeFit('20 H7/k6');
  ok(r.fit.art === 'UEBERGANG' && r.fit.PSmax === 19 && r.fit.PSmin === -15,
     '20 H7/k6 Uebergang (+19 Spiel … -15 Uebermass)');
})();
(function () {
  var r = S.computeFit('25 H7/h6');
  ok(r.fit.art === 'SPIEL' && r.fit.PSmin === 0 && r.fit.artFein === 'SPIEL_NULL',
     '25 H7/h6 Schiebesitz (Mindestspiel 0)');
})();
// describe entspricht dem Copy-Format aus plan.md:
ok(S.describe(S.computeFit('50 H7/g6')) ===
   'Ø50 H7/g6 — Bohrung 50,000…50,025 · Welle 49,975…49,991 · Spiel 9…50 µm (Spielpassung)',
   'describe == Copy-Format (plan.md Beispiel)');

// computeFit akzeptiert Objekt wie String identisch:
(function () {
  var a = S.computeFit('50 H7/g6');
  var b = S.computeFit({ nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'g', grade: 6 } });
  ok(a.fit.PSmax === b.fit.PSmax && a.fit.PSmin === b.fit.PSmin && a.fit.art === b.fit.art,
     'Objekt- und String-Eingabe liefern identisch');
})();

// Unversehrtheit: computeFit mutiert die Eingabe NIE (plan.md 6.2):
(function () {
  var inp = { nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 's', grade: 6 }, system: 'EB' };
  var snap = JSON.stringify(inp);
  S.computeFit(inp);
  ok(JSON.stringify(inp) === snap, 'computeFit mutiert Eingabe nicht');
})();

// Fehler werden strukturiert durchgereicht:
(function () {
  var r = S.computeFit('600 H7/g6');
  ok(!r.ok && r.errors[0].code === D.CODE.OUT_OF_RANGE, 'computeFit meldet OUT_OF_RANGE sauber');
  var r2 = S.computeFit('50 H7/cd6');
  ok(!r2.ok && r2.errors.some(function (e) { return e.code === D.CODE.FD_NOT_IN_DATASET; }), 'computeFit meldet FD_NOT_IN_DATASET');
})();

// Presets 1–3 rechnen (B2-DoD):
S.PRESETS.forEach(function (P) {
  var r = S.computeFit(P.fit);
  ok(r.ok && r.fit.art === P.expect, 'Preset ' + P.id + ' (' + P.fit + ') -> ' + P.expect + (r.ok ? '' : ' | FEHLER'));
});

/* Property: Passungsart-Trichotomie konsistent zu min/max, Grenzmaß- und
 * Passtoleranz-Identitäten, über viele Zufallspaarungen (Seed). */
(function () {
  var rnd = mulberry32(20260713 ^ 0x5f5e);
  var HOLE = ['H', 'G', 'F', 'K', 'M', 'N', 'JS', 'P'];
  var SH = ['h', 'g', 'f', 'e', 'js', 'k', 'm', 'n', 'p', 's', 'd'];
  var checked = 0;
  for (var i = 0; i < 6000; i++) {
    var N = 1 + rnd() * 499;
    var gH = 5 + Math.floor(rnd() * 6), gS = 5 + Math.floor(rnd() * 6);
    var hL = HOLE[Math.floor(rnd() * HOLE.length)], sL = SH[Math.floor(rnd() * SH.length)];
    var r = S.computeFit({ nominal: N, hole: { letter: hL, grade: gH }, shaft: { letter: sL, grade: gS } });
    if (!r.ok) continue;
    checked++;
    var f = r.fit;
    // Trichotomie deckungsgleich mit den Vorzeichen von PSmin/PSmax:
    var expect = f.PSmin >= 0 ? 'SPIEL' : (f.PSmax <= 0 ? 'UEBERMASS' : 'UEBERGANG');
    ok(f.art === expect, 'Trichotomie konsistent (' + hL + gH + '/' + sL + gS + ' @ ' + N.toFixed(2) + ')');
    // Passtoleranz-Identität: PT = T_B + T_W = PSmax − PSmin:
    ok(f.PT === r.hole.T + r.shaft.T && f.PT === f.PSmax - f.PSmin, 'PT-Identitaet');
    // Grenzmaß-Identitäten (auf µm genau):
    ok(Math.abs((r.hole.Go - r.hole.Gu) - r.hole.T / 1000) < 1e-9, 'Bohrung Go-Gu = T');
    ok(Math.abs((r.shaft.Go - r.shaft.Gu) - r.shaft.T / 1000) < 1e-9, 'Welle Go-Gu = T');
    ok(r.hole.Go >= r.hole.Gu && r.shaft.Go >= r.shaft.Gu, 'Go >= Gu');
    // PSmax >= PSmin immer:
    ok(f.PSmax >= f.PSmin, 'PSmax >= PSmin');
    // artFein gehört zur art:
    var feinSet = { SPIEL: /^SPIEL_/, UEBERMASS: /^PRESS_/, UEBERGANG: /^UEBERGANG_/ };
    ok(feinSet[f.art].test(f.artFein), 'artFein passt zu art (' + f.art + '/' + f.artFein + ')');
  }
  ok(checked > 3000, 'genug gueltige Zufallspaarungen geprueft (' + checked + ')');
})();

/* === 10) Parser-Roundtrip als Property (B4) =============================== *
 * parseFit ist rein syntaktisch — daher über den vollen Buchstabensatz gültig,
 * unabhängig von Datensatzlücken. Geprüft wird Idempotenz:
 *   parse(str) -> format -> parse == parse(str)   (Punkt- UND Komma-Format)
 * sowie Toleranz gegenüber Ø-Präfix und fehlenden Leerzeichen. */
section('10) Parser-Roundtrip (Property)');
(function () {
  var rnd = mulberry32(0x50617373 /* "Pass" */ ^ 20260713);
  var HOLE = ['H', 'G', 'F', 'E', 'D', 'C', 'JS', 'J', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', 'ZA', 'ZB', 'ZC'];
  var SH   = ['h', 'g', 'f', 'e', 'd', 'c', 'js', 'j', 'k', 'm', 'n', 'p', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z', 'za', 'zb', 'zc'];
  var NOMS = [1, 3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500, 12.5, 50.5, 33.33, 7.25];
  function structEq(a, b) {
    return a.ok && b.ok && a.nominal === b.nominal &&
      a.hole.letter === b.hole.letter && a.hole.grade === b.hole.grade &&
      a.shaft.letter === b.shaft.letter && a.shaft.grade === b.shaft.grade;
  }
  var checked = 0;
  for (var i = 0; i < 1600; i++) {
    var N  = NOMS[Math.floor(rnd() * NOMS.length)];
    var hL = HOLE[Math.floor(rnd() * HOLE.length)];
    var sL = SH[Math.floor(rnd() * SH.length)];
    var gH = 1 + Math.floor(rnd() * 16), gS = 1 + Math.floor(rnd() * 16);
    var canon = N + ' ' + hL + gH + '/' + sL + gS;
    var p = S.parseFit(canon);
    ok(p.ok && p.nominal === N && p.hole.letter === hL && p.hole.grade === gH &&
       p.shaft.letter === sL && p.shaft.grade === gS,
       'parse kanonisch "' + canon + '"' + (p.ok ? '' : ' | ' + p.error));
    if (!p.ok) continue;
    checked++;
    // Idempotenz mit Punkt-Format (intern):
    ok(structEq(p, S.parseFit(S.formatFit(p))), 'Roundtrip Punkt "' + canon + '"');
    // Idempotenz mit Komma-Format (Anzeige DE/PT):
    ok(structEq(p, S.parseFit(S.formatFit(p, ','))), 'Roundtrip Komma "' + canon + '"');
    // Ø-Präfix und fehlende Leerzeichen werden toleriert:
    ok(structEq(p, S.parseFit('Ø' + canon)), 'Roundtrip Ø-Präfix "' + canon + '"');
    ok(structEq(p, S.parseFit((N + '').replace('.', ',') + ' ' + hL + gH + '/' + sL + gS)),
       'Roundtrip Komma-Eingabe "' + canon + '"');
  }
  ok(checked === 1600, 'alle 1600 Roundtrip-Stichproben gültig (' + checked + ')');
})();

/* === 11) Rechenweg-Selbstprüfung als Property (B6) ======================== *
 * Für jede gültige Passung MUSS der post-hoc-Rechenweg 9 Schritte liefern, alle
 * mit ✓ (allOk), und die Schluss-Passungsart mit dem Solver übereinstimmen.
 * Zusätzlich Negativkontrolle: ein verfälschter Wert MUSS ein rotes Kreuz geben. */
section('11) Rechenweg-Selbstprüfung (Property)');
(function () {
  if (!RW || !RW.build) { ok(false, 'DTPRechenweg nicht geladen'); return; }
  var HOLE = ['H', 'G', 'F', 'E', 'K', 'M', 'N', 'P'];
  var SH = ['h', 'g', 'f', 'e', 'd', 's', 'k', 'm', 'n', 'p'];
  var NOMS = [1, 3, 10, 30, 50, 120, 250, 400];
  var GR = [5, 6, 7, 8, 9];
  var seen = 0;
  for (var a = 0; a < HOLE.length; a++)
    for (var b = 0; b < SH.length; b++)
      for (var n = 0; n < NOMS.length; n++)
        for (var g = 0; g < GR.length; g++) {
          var res = S.computeFit({ nominal: NOMS[n], hole: { letter: HOLE[a], grade: GR[g] }, shaft: { letter: SH[b], grade: GR[g] } });
          if (!res.ok) continue;
          seen++;
          var rw = RW.build(res);
          ok(rw.steps.length === 9, 'Rechenweg 9 Schritte ' + HOLE[a] + GR[g] + '/' + SH[b] + GR[g] + ' @' + NOMS[n]);
          ok(rw.allOk === true, 'Rechenweg allOk ' + HOLE[a] + GR[g] + '/' + SH[b] + GR[g] + ' @' + NOMS[n]);
          ok(rw.steps[8].art === res.fit.art, 'Rechenweg-Art == Solver ' + HOLE[a] + GR[g] + '/' + SH[b] + GR[g] + ' @' + NOMS[n]);
        }
  ok(seen > 500, 'ausreichend gültige Fälle geprüft (' + seen + ')');
  // Negativkontrolle:
  var neg = S.computeFit('50 H7/g6'); neg.fit.PSmin -= 7;
  var rwn = RW.build(neg);
  ok(rwn.allOk === false, 'Selbstprüfung erkennt verfälschtes PS_min');
  ok(rwn.steps[6].ok === false, 'genau der PS_min-Schritt ist rot');
})();

/* === 12) ISO 2768-1 Allgemeintoleranzen (Freiform, B7) ==================== *
 * Jede Tabellenzelle als Anker + voller Nennmaß-Sweep (dev == Tabelle je Bereich,
 * Grenzen „bis einschließlich", ehrliche Lücken v<3 / f>2000) + Bereichsränder. */
section('12) ISO 2768-1 Allgemeintoleranzen (Freiform)');
(function () {
  if (!FF || !FF.general) { ok(false, 'DTPFreiform nicht geladen'); return; }
  var r3 = function (x) { return Math.round(x * 1000) / 1000; };
  var reps = [2, 5, 20, 75, 250, 700, 1500, 3000];   // je einer strikt im Bereich i

  // 12a) Alle 4×8 Zellen als Anker:
  FF.CLASSES.forEach(function (cls) {
    for (var i = 0; i < FF.RANGES.length; i++) {
      var exp = FF.DEV[cls][i];
      var r = FF.general(reps[i], cls);
      if (exp == null) {
        ok(!r.ok && r.code === FF.CODE.UNDEFINED, 'ISO2768 ' + cls + ' Bereich#' + i + ' nicht vorgesehen');
      } else {
        ok(r.ok && r.dev === exp, 'ISO2768 ' + cls + ' @' + reps[i] + ' -> ±' + exp);
        ok(r.dev_um === Math.round(exp * 1000), 'ISO2768 ' + cls + ' @' + reps[i] + ' dev_um');
        ok(r.tol_um === Math.round(2 * exp * 1000), 'ISO2768 ' + cls + ' @' + reps[i] + ' tol_um');
        ok(r.Go === r3(reps[i] + exp) && r.Gu === r3(reps[i] - exp), 'ISO2768 ' + cls + ' @' + reps[i] + ' Grenzmaße');
      }
    }
  });

  // 12b) Voller Sweep: general() muss zur Tabelle + rangeIndex passen (auch an Grenzen).
  var noms = [];
  FF.RANGES.forEach(function (hi, i) {
    var lo = (i === 0) ? FF.LOW : FF.RANGES[i - 1];
    noms.push(lo, hi, r3((lo + hi) / 2), r3(lo + 0.001), r3(hi - 0.001));
  });
  // zusätzlich deterministische Zufallsproben:
  var rnd = mulberry32(0x32373638 /* "2768" */);
  for (var k = 0; k < 300; k++) noms.push(r3(FF.LOW + rnd() * (4000 - FF.LOW)));

  noms.forEach(function (n) {
    FF.CLASSES.forEach(function (cls) {
      var idx = FF.rangeIndex(n);
      var r = FF.general(n, cls);
      if (idx < 0) { ok(!r.ok, 'Sweep >max unmöglich @' + n); return; }
      var exp = FF.DEV[cls][idx];
      if (exp == null) ok(!r.ok && r.code === FF.CODE.UNDEFINED, 'Sweep Lücke ' + cls + ' @' + n);
      else ok(r.ok && r.dev === exp && r.Go === r3(n + exp) && r.Gu === r3(n - exp), 'Sweep ' + cls + ' @' + n + ' -> ±' + exp);
    });
  });

  // 12c) Bereichsränder exakt „bis einschließlich":
  ok(FF.general(3, 'v').ok === false, '3 mm: v weiterhin nicht vorgesehen (Bereich 0)');
  ok(FF.general(3, 'c').dev === 0.2 && FF.general(3.001, 'c').dev === 0.3, 'Grenze 3: c 3→0,2 · 3,001→0,3');
  ok(FF.general(2000, 'f').dev === 0.5 && !FF.general(2000.001, 'f').ok, 'Grenze 2000: f 0,5, danach Lücke');
  ok(FF.general(4000, 'm').dev === 2 && !FF.general(4000.001, 'm').ok, 'Grenze 4000: m 2, danach >max');

  // 12d) Fehlercodes:
  ok(FF.general(0.4, 'm').code === FF.CODE.BELOW_MIN, '< 0,5 -> BELOW_MIN');
  ok(FF.general(9e9, 'm').code === FF.CODE.ABOVE_MAX, 'riesig -> ABOVE_MAX');
  ok(FF.general(50, 'q').code === FF.CODE.CLASS_UNKNOWN, 'Klasse q -> CLASS_UNKNOWN');
  ok(FF.general(NaN, 'm').code === FF.CODE.NOMINAL_TYPE, 'NaN -> NOMINAL_TYPE');

  // 12e) Presets rechnen alle:
  FF.PRESETS.forEach(function (P) { ok(FF.general(P.nominal, P.cls).ok, 'Freiform-Preset rechnet: ' + P.label); });
})();

/* === 13) Thermik-Check (B8) ============================================== *
 * ΔS = (α_Bohrung − α_Welle)·(T−20)·D/1000 [µm]; das Fenster verschiebt sich um
 * ΔS; Passungsart kann umschlagen. Sweep über Werkstoffe × Temperaturen × Fits. */
section('13) Thermik-Check');
(function () {
  if (!TH || !TH.compute) { ok(false, 'DTPThermik nicht geladen'); return; }
  var r1 = function (x) { return Math.round(x * 10) / 10; };
  var mats = ['steel', 'alu', 'brass', 'cast_iron', 'titanium', 'pom'];
  var fits = ['50 H7/g6', '40 H7/p6', '20 H7/k6', '100 H8/f7'];
  var temps = [-40, 20, 80, 150, 250];

  fits.forEach(function (fitStr) {
    var f = S.computeFit(fitStr);
    if (!f.ok) { ok(false, 'Basisfit rechnet: ' + fitStr); return; }
    mats.forEach(function (mh) {
      mats.forEach(function (ms) {
        var ah = TH.MAT[mh].alpha, as = TH.MAT[ms].alpha;
        temps.forEach(function (T) {
          var r = TH.compute(f, { alphaHole: ah, alphaShaft: as, T: T });
          var dSraw = (ah - as) * (T - 20) * f.input.nominal / 1000;
          ok(r.ok, 'compute ok ' + fitStr + ' ' + mh + '/' + ms + ' @' + T);
          ok(r.dS === r1(dSraw), 'ΔS-Formel ' + fitStr + ' ' + mh + '/' + ms + ' @' + T);
          ok(r.PSmaxT === r1(f.fit.PSmax + dSraw) && r.PSminT === r1(f.fit.PSmin + dSraw), 'Fensterverschiebung ' + fitStr + ' @' + T);
          var artExp = (f.fit.PSmin + dSraw) >= 0 ? 'SPIEL' : (f.fit.PSmax + dSraw) <= 0 ? 'UEBERMASS' : 'UEBERGANG';
          ok(r.artT === artExp, 'artT konsistent ' + fitStr + ' ' + mh + '/' + ms + ' @' + T);
          ok(r.umschlag === (artExp !== f.fit.art), 'Umschlag-Flag ' + fitStr + ' @' + T);
          // Vorzeichenregeln:
          if (T > 20 && ah > as) ok(r.dS >= 0, 'Vorzeichen +ΔT, αh>αs -> ΔS≥0');
          if (T > 20 && ah < as) ok(r.dS <= 0, 'Vorzeichen +ΔT, αh<αs -> ΔS≤0');
          if (T === 20) ok(r.dS === 0 && !r.umschlag, 'T=20 neutral');
        });
      });
    });
  });

  // Plan-Anker: Alu-Welle in Stahl-Bohrung, Erwärmung -> Spiel sinkt.
  var fa = S.computeFit('50 H7/g6');
  ok(TH.compute(fa, { alphaHole: TH.MAT.steel.alpha, alphaShaft: TH.MAT.alu.alpha, T: 80 }).dS < 0, 'Anker: Alu-Welle in Stahl, +ΔT -> Spiel sinkt');
  // Umschlag-Demo:
  var fp = S.compute ? null : null;
  var rp = TH.compute(S.computeFit('40 H7/p6'), { alphaHole: TH.MAT.alu.alpha, alphaShaft: TH.MAT.steel.alpha, T: 80 });
  ok(rp.umschlag === true && rp.art20 === 'UEBERMASS', 'Anker: 40 H7/p6 Alu/Stahl 80 °C -> Umschlag aus Übermaß');
  // MAT-Richtwert-Anker:
  ok(TH.MAT.steel.alpha === 11.5 && TH.MAT.alu.alpha === 23 && TH.MAT.brass.alpha === 18.5, 'MAT-α-Anker Stahl/Alu/Messing');
  TH.PRESETS.forEach(function (P) { ok(S.computeFit(P.fit).ok && TH.MAT[P.hole] && TH.MAT[P.shaft], 'Thermik-Preset gültig: ' + P.label); });
})();

/* === 14) Rechenweg für Freiform + Thermik (B8.1) ========================= *
 * Jede Berechnung muss einen selbstprüfenden Rechenweg liefern (allOk). */
section('14) Rechenweg Freiform + Thermik');
(function () {
  if (!RW || !RW.buildFreiform || !RW.buildThermik) { ok(false, 'Rechenweg-Erweiterung nicht geladen'); return; }
  // Freiform:
  var noms = [1, 3, 10, 30, 50, 120, 400, 1000, 2000, 12.5, 50.5];
  FF.CLASSES.forEach(function (cls) {
    noms.forEach(function (n) {
      var ff = FF.general(n, cls);
      if (!ff.ok) return;
      var rw = RW.buildFreiform(ff);
      ok(rw.steps.length === 4, 'Freiform-Rechenweg 4 Schritte ' + n + ' ' + cls);
      ok(rw.allOk === true, 'Freiform-Rechenweg allOk ' + n + ' ' + cls);
    });
  });
  // Thermik:
  var mats = ['steel', 'alu', 'brass', 'titanium', 'pom'];
  var fits = ['50 H7/g6', '40 H7/p6', '20 H7/k6', '100 H8/f7'];
  var temps = [-40, 20, 80, 150];
  fits.forEach(function (fitStr) {
    var f = S.computeFit(fitStr); if (!f.ok) return;
    mats.forEach(function (mh) {
      mats.forEach(function (ms) {
        temps.forEach(function (T) {
          var th = TH.compute(f, { alphaHole: TH.MAT[mh].alpha, alphaShaft: TH.MAT[ms].alpha, T: T });
          var rw = RW.buildThermik(f, th);
          ok(rw.steps.length === 4, 'Thermik-Rechenweg 4 Schritte ' + fitStr + ' ' + mh + '/' + ms + ' @' + T);
          ok(rw.allOk === true, 'Thermik-Rechenweg allOk ' + fitStr + ' ' + mh + '/' + ms + ' @' + T);
          ok(rw.steps[3].art === th.artT, 'Thermik-Rechenweg Schluss-Art ' + fitStr + ' @' + T);
        });
      });
    });
  });
  // Negativkontrollen:
  var ffb = FF.general(50, 'm'); ffb.Go = ffb.Go + 1;
  ok(RW.buildFreiform(ffb).allOk === false, 'Freiform-Rechenweg erkennt verfälschtes G_o');
  var f2 = S.computeFit('40 H7/p6'); var th2 = TH.compute(f2, { alphaHole: TH.MAT.alu.alpha, alphaShaft: TH.MAT.steel.alpha, T: 80 });
  th2.PSminT = th2.PSminT + 5;
  ok(RW.buildThermik(f2, th2).allOk === false, 'Thermik-Rechenweg erkennt verfälschtes PS_min(T)');
})();

/* === 15) Thermik-Layout im Schaubild (v1.9.2, Variante C) ================ *
 * DOM-frei über SB.layout(). Prüft: Identität δ_Bohrung−δ_Welle=ΔS; ohne
 * thermal keine Ghosts (Regressionswächter, 20-°C-Bänder unangetastet);
 * mit thermal Ghost-Versatz +ΔS/2 (Bohrung) / −ΔS/2 (Welle), gleiche geteilte
 * Nulllinie, kein Abschneiden (Ghosts liegen im Plotbereich). */
section('15) Thermik-Layout Schaubild');
(function () {
  if (!SB || !SB.layout) { ok(false, 'schaubild.js nicht geladen'); return; }
  var EPS = 1e-6;
  var fits = ['50 H7/g6', '40 H7/p6', '20 H7/k6', '100 H8/f7', '10 H7/h6'];
  var mats = ['steel', 'alu', 'brass', 'titanium', 'pom', 'cast_iron'];
  var temps = [-40, 20, 60, 120, 200];
  var padT = SB.DIM.padT, botY = SB.DIM.H - SB.DIM.padB;

  // Regressionswächter: ohne thermal existieren keine Ghosts.
  var fRef = S.computeFit('50 H7/g6');
  var Lref = SB.layout(fRef);
  ok(Lref.ghostHole == null && Lref.ghostShaft == null, 'ohne thermal keine Ghost-Balken');
  ok(Lref.thermHalf === null, 'ohne thermal thermHalf=null');
  ok(Lref.y0 === 112, 'Nulllinie 50 H7/g6 unverändert (y0=112)');

  fits.forEach(function (fitStr) {
    var f = S.computeFit(fitStr); if (!f.ok) return;
    mats.forEach(function (mh) {
      mats.forEach(function (ms) {
        temps.forEach(function (T) {
          var th = TH.compute(f, { alphaHole: TH.MAT[mh].alpha, alphaShaft: TH.MAT[ms].alpha, T: T });
          if (!th.ok) return;
          var N = f.input.nominal, dT = T - 20;
          var dh = TH.MAT[mh].alpha * dT * N / 1000, ds = TH.MAT[ms].alpha * dT * N / 1000;
          // Identität: δ_Bohrung − δ_Welle == ΔS (roh).
          ok(Math.abs((dh - ds) - (TH.MAT[mh].alpha - TH.MAT[ms].alpha) * dT * N / 1000) < EPS,
             'δ-Identität ' + fitStr + ' ' + mh + '/' + ms + ' @' + T);

          var L = SB.layout(f, { dS: th.dS });
          var half = th.dS / 2;
          ok(!!L.ghostHole && !!L.ghostShaft, 'Ghosts vorhanden ' + fitStr + ' ' + mh + '/' + ms + ' @' + T);
          ok(L.thermHalf === half, 'thermHalf=ΔS/2 ' + fitStr + ' @' + T);
          // Bohrungs-Ghost um +ΔS/2, Wellen-Ghost um −ΔS/2 (gegen dieselbe Nulllinie).
          ok(Math.abs(L.ghostHole.yTop  - L.y(f.hole.upper  + half)) < EPS, 'Bohrung-Ghost +ΔS/2 ' + fitStr + ' @' + T);
          ok(Math.abs(L.ghostShaft.yTop - L.y(f.shaft.upper - half)) < EPS, 'Welle-Ghost −ΔS/2 ' + fitStr + ' @' + T);
          // Kein Abschneiden: Ghosts liegen innerhalb des Plotbereichs.
          ok(L.ghostHole.y  >= padT - EPS && L.ghostHole.yBot  <= botY + EPS, 'Bohrung-Ghost im Plot ' + fitStr + ' @' + T);
          ok(L.ghostShaft.y >= padT - EPS && L.ghostShaft.yBot <= botY + EPS, 'Welle-Ghost im Plot ' + fitStr + ' @' + T);
          // Ghosts liegen seitlich neben den Hauptbalken (Bohrung links, Welle rechts).
          ok(L.ghostHole.x + L.ghostHole.w <= L.hole.x + EPS, 'Bohrung-Ghost links vom Balken ' + fitStr + ' @' + T);
          ok(L.ghostShaft.x >= L.shaft.x + L.shaft.w - EPS, 'Welle-Ghost rechts vom Balken ' + fitStr + ' @' + T);
        });
      });
    });
  });

  // ΔS=0 (gleiche Werkstoffe): Ghost liegt exakt auf Höhe des Realbalkens.
  var f0 = S.computeFit('50 H7/g6');
  var L0 = SB.layout(f0, { dS: 0 });
  ok(Math.abs(L0.ghostHole.yTop - L0.hole.yTop) < EPS && Math.abs(L0.ghostShaft.yTop - L0.shaft.yTop) < EPS,
     'ΔS=0 → Ghosts auf Balkenhöhe (kein Versatz)');
})();

/* === 16) Beratung: Kostenampel + Messmittel (B9, v1.9.3) ================= *
 * DOM-frei. Kostenampel: Ampelstufe nach IT-Regel (≤6 rot, 7–8 gelb, ≥9 grün),
 * Verfahren↔IT-Konsistenz. Messmittel: goldene Regel U≤T/10 (ideal) bzw. ≤T/5
 * (brauchbar), Plan-Anker H7 25 µm, Monotonie, Formel-Identitäten. */
section('16) Beratung Kostenampel + Messmittel');
(function () {
  if (!BR || !BR.costTraffic) { ok(false, 'beratung.js nicht geladen'); return; }
  var EPS = 1e-9;

  // --- Kostenampel: Regel über alle IT-Güten 1..16 ---
  for (var it = 1; it <= 16; it++) {
    var c = BR.costTraffic(it);
    var exp = it <= 6 ? 'red' : (it <= 8 ? 'yellow' : 'green');
    ok(c.tier === exp, 'Kostenampel IT' + it + ' → ' + exp);
    ok(c.code === (exp === 'red' ? 'COST_RED' : exp === 'yellow' ? 'COST_YELLOW' : 'COST_GREEN'), 'Kosten-Code IT' + it);
    // jedes gemeldete Verfahren erreicht diese IT wirklich:
    c.processes.forEach(function (p) {
      ok(BR.PROC[p] && it >= BR.PROC[p][0] && it <= BR.PROC[p][1], 'Verfahren ' + p + ' erreicht IT' + it);
    });
    // Vollständigkeit: kein passendes Verfahren fehlt in der Liste:
    for (var k in BR.PROC) if (BR.PROC.hasOwnProperty(k)) {
      var inRange = it >= BR.PROC[k][0] && it <= BR.PROC[k][1];
      ok(inRange === (c.processes.indexOf(k) >= 0), 'Verfahren-Liste IT' + it + ' vollständig für ' + k);
    }
  }
  // Ampel-Grenzen scharf:
  ok(BR.costTraffic(6).tier === 'red' && BR.costTraffic(7).tier === 'yellow', 'Grenze IT6→IT7 (rot→gelb)');
  ok(BR.costTraffic(8).tier === 'yellow' && BR.costTraffic(9).tier === 'green', 'Grenze IT8→IT9 (gelb→grün)');
  // Ungültig:
  ok(BR.costTraffic(0).code === 'COST_UNDEFINED', 'Kostenampel IT0 → undefiniert');

  // --- Messmittel: Plan-Anker H7 (25 µm) ---
  var m25 = BR.measurement(25);
  ok(Math.abs(m25.uGoldenUm - 2.5) < EPS && Math.abs(m25.uWarnUm - 5) < EPS, 'H7 25 µm: golden 2,5 / warn 5');
  function inst(m, key) { return m.instruments.filter(function (x) { return x.key === key; })[0]; }
  ok(inst(m25, 'MESSSCHIEBER').suitable === false, 'H7 25 µm: Messschieber ungeeignet ✗');
  ok(inst(m25, 'MIKROMETER').suitable === true && inst(m25, 'MIKROMETER').golden === false, 'H7 25 µm: Mikrometer brauchbar ✓ (nicht ideal)');
  ok(inst(m25, 'GRENZLEHRE').suitable === true && inst(m25, 'GRENZLEHRE').golden === true, 'H7 25 µm: Grenzlehre geeignet ✓');
  ok(inst(m25, 'KMG').suitable === true, 'H7 25 µm: KMG brauchbar ✓');

  // --- Messmittel: Formel-Identitäten + Eignungslogik über T-Sweep ---
  var prev = {};
  for (var T = 4; T <= 200; T += 2) {
    var m = BR.measurement(T);
    ok(Math.abs(m.uGoldenUm - T / 10) < EPS, 'uGolden=T/10 bei T=' + T);
    ok(Math.abs(m.uWarnUm - T / 5) < EPS, 'uWarn=T/5 bei T=' + T);
    m.instruments.forEach(function (x) {
      if (x.gauge) { ok(x.suitable && x.golden, 'Grenzlehre stets geeignet (T=' + T + ')'); return; }
      ok(x.suitable === (x.uMaxUm <= T / 5 + EPS), 'Eignung ✓ konsistent ' + x.key + ' T=' + T);
      ok(x.golden === (x.uMaxUm <= T / 10 + EPS), 'ideal konsistent ' + x.key + ' T=' + T);
      // Monotonie: bei größerem T bleibt geeignet geeignet, ideal ideal.
      if (prev[x.key]) {
        if (prev[x.key].suitable) ok(x.suitable, 'Eignung monoton ' + x.key + ' bis T=' + T);
        if (prev[x.key].golden) ok(x.golden, 'ideal monoton ' + x.key + ' bis T=' + T);
      }
      prev[x.key] = x;
    });
  }
  ok(BR.measurement(0).code === 'MEAS_UNDEFINED', 'Messmittel T=0 → undefiniert');

  // --- Verzahnung mit echten Passungen: Toleranz→Messmittel, Güte→Ampel ---
  ['50 H7/g6', '25 H7/k6', '100 H8/f7', '10 H7/h6', '40 H7/p6'].forEach(function (fs) {
    var f = S.computeFit(fs); if (!f.ok) return;
    var Th = f.hole.upper - f.hole.lower, Ts = f.shaft.upper - f.shaft.lower;
    ok(Math.abs(BR.measurement(Th).uGoldenUm - Th / 10) < EPS, fs + ': Bohrung T/10-Identität');
    ok(Math.abs(BR.measurement(Ts).uGoldenUm - Ts / 10) < EPS, fs + ': Welle T/10-Identität');
    var gh = Number(f.input.hole.grade), gs = Number(f.input.shaft.grade);
    ok(BR.costTraffic(gh).tier === (gh <= 6 ? 'red' : gh <= 8 ? 'yellow' : 'green'), fs + ': Ampel Bohrung IT' + gh);
    ok(BR.costTraffic(gs).tier === (gs <= 6 ? 'red' : gs <= 8 ? 'yellow' : 'green'), fs + ': Ampel Welle IT' + gs);
  });
})();

/* === 17) Beratung: Oberfläche + Schmierspalt (B9, v1.9.4) ================ *
 * DOM-frei. Oberfläche: Rz-Stufen (T/5,T/3,T/2), Rundheit T/3, wirksames
 * Spiel/Übermaß (0,4·ΣRz bzw. 0,8·ΣRz). Schmierspalt: Stribeck-Regel ΣRz≤S_min/3,
 * nutzbarer Spalt S_min−ΣRz, nur bei Spielpassungen. */
section('17) Beratung Oberfläche + Schmierspalt');
(function () {
  if (!BR || !BR.surface || !BR.lubrication) { ok(false, 'beratung.js (surface/lubrication) fehlt'); return; }
  var EPS = 1e-9;

  // --- Rz-Stufen: Grenzen scharf über mehrere Toleranzen ---
  [10, 25, 50, 120].forEach(function (T) {
    ok(BR.surfaceStage(T / 5, T).stage === 'ok', 'Rz=T/5 → ok (T=' + T + ')');
    ok(BR.surfaceStage(T / 5 + 0.01, T).stage === 'warn', 'Rz>T/5 → warn (T=' + T + ')');
    ok(BR.surfaceStage(T / 3, T).stage === 'warn', 'Rz=T/3 → warn (T=' + T + ')');
    ok(BR.surfaceStage(T / 3 + 0.01, T).stage === 'high', 'Rz>T/3 → high (T=' + T + ')');
    ok(BR.surfaceStage(T / 2, T).stage === 'high', 'Rz=T/2 → high (T=' + T + ')');
    ok(BR.surfaceStage(T / 2 + 0.01, T).stage === 'crit', 'Rz>T/2 → crit (T=' + T + ')');
    ok(Math.abs(BR.surfaceStage(1, T).formMaxUm - T / 3) < EPS, 'Rundheit=T/3 (T=' + T + ')');
    ok(Math.abs(BR.surfaceStage(1, T).RzMaxOkUm - T / 5) < EPS, 'RzMaxOk=T/5 (T=' + T + ')');
  });
  ok(BR.surfaceStage(3, 0).code === 'SURF_UNDEFINED', 'T=0 → SURF_UNDEFINED');

  var spiel = ['50 H7/g6', '100 H8/f7', '25 H7/f7', '20 H7/g6', '40 H7/e8'];
  var press = ['40 H7/p6', '60 H7/s6', '30 H7/r6'];
  var trans = ['20 H7/k6', '25 H7/j6'];
  var rzs = [[1.6, 1.6], [3.2, 3.2], [6.3, 3.2], [12.5, 6.3], [25, 12.5]];

  function stageOf(Rz, T) { return Rz <= T / 5 + EPS ? 'ok' : Rz <= T / 3 + EPS ? 'warn' : Rz <= T / 2 + EPS ? 'high' : 'crit'; }

  spiel.concat(press, trans).forEach(function (fs) {
    var f = S.computeFit(fs); if (!f.ok) { ok(false, 'computeFit ' + fs); return; }
    var Th = f.hole.upper - f.hole.lower, Ts = f.shaft.upper - f.shaft.lower;
    rzs.forEach(function (rp) {
      var RzB = rp[0], RzW = rp[1], RzSum = RzB + RzW;
      var su = BR.surface(f, { RzB: RzB, RzW: RzW });
      // Rz-Stufen je Bauteil konsistent:
      ok(su.hole.stage === stageOf(RzB, Th), fs + ' Bohrung-Stufe Rz=' + RzB);
      ok(su.shaft.stage === stageOf(RzW, Ts), fs + ' Welle-Stufe Rz=' + RzW);
      ok(Math.abs(su.RzSumUm - RzSum) < EPS, fs + ' ΣRz Rz=' + RzB + '/' + RzW);
      // Wirksames Spiel/Übermaß nach Passungsart:
      if (f.fit.art === 'SPIEL') {
        ok(su.effective.kind === 'clearance', fs + ' eff=clearance');
        ok(Math.abs(su.effective.effUm - (f.fit.PSmin - 0.4 * RzSum)) < EPS, fs + ' S_wirk=S_min−0,4·ΣRz Rz=' + RzB);
        ok(su.effective.code === (f.fit.PSmin - 0.4 * RzSum <= 0 ? 'CLEAR_LOSS' : 'CLEAR_OK'), fs + ' clear-Code Rz=' + RzB);
      } else if (f.fit.art === 'UEBERMASS') {
        ok(su.effective.kind === 'interference', fs + ' eff=interference');
        ok(Math.abs(su.effective.effUm - (f.fit.interferenceMin - 0.8 * RzSum)) < EPS, fs + ' Ü_wirk=Ü_min−0,8·ΣRz Rz=' + RzB);
        ok(su.effective.code === (f.fit.interferenceMin - 0.8 * RzSum <= 0 ? 'PRESS_LOSS' : 'PRESS_OK'), fs + ' press-Code Rz=' + RzB);
      } else {
        ok(su.effective.code === 'EFF_NA', fs + ' Übergang → EFF_NA');
      }
      // Schmierspalt:
      var lu = BR.lubrication(f, { RzB: RzB, RzW: RzW });
      if (f.fit.art === 'SPIEL') {
        ok(lu.applies === true, fs + ' Schmierspalt gilt');
        ok(Math.abs(lu.thresholdUm - f.fit.PSmin / 3) < EPS, fs + ' Schwelle=S_min/3 Rz=' + RzB);
        ok(Math.abs(lu.gapWirkUm - (f.fit.PSmin - RzSum)) < EPS, fs + ' Spalt=S_min−ΣRz Rz=' + RzB);
        ok(lu.ok === (RzSum <= f.fit.PSmin / 3 + EPS), fs + ' Stribeck-ok Rz=' + RzB);
        ok(lu.code === (lu.ok ? 'LUBE_OK' : 'HINT_LUBRICATION'), fs + ' lube-Code Rz=' + RzB);
      } else {
        ok(lu.applies === false && lu.code === 'LUBE_NA', fs + ' kein Spiel → LUBE_NA');
      }
    });
  });

  // --- Monotonie an einer Spielpassung: mehr Rz → kleinerer Spalt, ok kippt nur einmal ---
  var fm = S.computeFit('100 H8/f7');
  var prevGap = Infinity, prevEff = Infinity, wasBad = false;
  [0, 2, 4, 6, 8, 10, 14, 20].forEach(function (r) {
    var lu = BR.lubrication(fm, { RzB: r, RzW: r });
    ok(lu.gapWirkUm <= prevGap + EPS, 'Spalt monoton fallend Rz=' + r); prevGap = lu.gapWirkUm;
    if (wasBad) ok(!lu.ok, 'Mischreibung bleibt bei größerem Rz=' + r);
    if (!lu.ok) wasBad = true;
    var su = BR.surface(fm, { RzB: r, RzW: r });
    ok(su.effective.effUm <= prevEff + EPS, 'S_wirk monoton fallend Rz=' + r); prevEff = su.effective.effUm;
  });
})();

/* === 18) Rechenweg Oberfläche + Schmierspalt (B9, v1.9.5) ================ *
 * buildOberflaeche(): jeder Schritt per Umkehrrechnung selbstgeprüft (allOk),
 * Schrittzahl passend zur Passungsart (Spiel 7 · Übermaß 4 · Übergang 3). */
section('18) Rechenweg Oberfläche + Schmierspalt');
(function () {
  if (!RW || !RW.buildOberflaeche) { ok(false, 'rechenweg.buildOberflaeche fehlt'); return; }
  var spiel = ['50 H7/g6', '100 H8/f7', '25 H7/f7', '20 H7/g6', '40 H7/e8'];
  var press = ['40 H7/p6', '60 H7/s6', '30 H7/r6'];
  var trans = ['20 H7/k6', '25 H7/j6'];
  var rzs = [[0, 0], [1.6, 1.6], [3.2, 1.6], [6.3, 3.2], [12.5, 6.3], [25, 12.5]];
  var want = { SPIEL: 7, UEBERMASS: 4, UEBERGANG: 3 };

  spiel.concat(press, trans).forEach(function (fs) {
    var f = S.computeFit(fs); if (!f.ok) { ok(false, 'computeFit ' + fs); return; }
    rzs.forEach(function (rp) {
      var rw = RW.buildOberflaeche(f, { RzB: rp[0], RzW: rp[1] });
      ok(rw.allOk === true, fs + ' Rechenweg allOk Rz=' + rp[0] + '/' + rp[1]);
      ok(rw.steps.length === want[f.fit.art], fs + ' Schrittzahl (' + f.fit.art + ') Rz=' + rp[0]);
      rw.steps.forEach(function (st, idx) {
        ok(st.ok === true, fs + ' Schritt ' + idx + ' geprüft Rz=' + rp[0]);
        ok(typeof st.expr === 'string' && /[=≤≥<>→]/.test(st.expr), fs + ' Schritt ' + idx + ' hat Formel');
      });
    });
  });

  // Robustheit: ungültige Eingabe → leer, allOk false.
  var bad = RW.buildOberflaeche(null, { RzB: 3, RzW: 3 });
  ok(bad.steps.length === 0 && bad.allOk === false, 'ungültiges res → leerer Rechenweg');
})();

/* === 19) B10b — Pressverband (DIN 7190-1, rein elastisch) ================= */
section('19) Pressverband (DIN 7190)');
(function () {
  var ST  = { E: 210000, nu: 0.30, Re: 355, alpha: 11.5 };
  var GJL = { E: 110000, nu: 0.28, Re: null, Rm: 250, brittle: true, alpha: 10 };
  var ALU = { E: 70000,  nu: 0.33, Re: 250, alpha: 23 };

  function relEq(a, b, tol, msg) {
    ok(isFinite(a) && isFinite(b) &&
       Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-300),
       msg + ' (' + a + ' vs ' + b + ')');
  }
  function withx(base, extra) {
    var o = {}, k;
    for (k in base) o[k] = base[k];
    for (k in extra) o[k] = extra[k];
    return o;
  }

  /* UNABHÄNGIGER Rechenpfad: Lamé-Konstanten A/B + Radialverschiebung u(r)
     (bewusst andere Formulierung als die K-Summenform des Moduls). */
  function lameU(pi, po, ri, ro, E, nu, r) {
    var A = (pi * ri * ri - po * ro * ro) / (ro * ro - ri * ri);
    var B = (pi - po) * ri * ri * ro * ro / (ro * ro - ri * ri);
    return ((1 - nu) / E) * A * r + ((1 + nu) / E) * B / r;
  }
  function pLame(Uw_um, DF, DAa, DIi, mA, mI) {
    var rF = DF / 2, rA = DAa / 2, rI = DIi / 2;
    var uHub = lameU(1, 0, rF, rA, mA.E, mA.nu, rF);   // je 1 N/mm² Fugendruck
    var uShaft = lameU(0, 1, rI, rF, mI.E, mI.nu, rF);
    return (Uw_um / 1000) / (2 * (uHub - uShaft));
  }

  /* --- 19.1 µ-Richtwerttabelle: Struktur, Spannen, Zugriff ---------------- */
  ok(PV.MU.length === 6 && PV.MU_ORDER.length === 6, 'µ-Tabelle: 6 Richtwert-Zeilen');
  PV.MU.forEach(function (m, i) {
    ok(typeof m.key === 'string' && m.key.length > 0, 'µ[' + i + ']: key vorhanden');
    ok(m.mu > 0 && m.mu < 1, 'µ[' + i + ']: 0 < mu < 1');
    ok(m.range[0] <= m.mu && m.mu <= m.range[1], 'µ[' + i + ']: mu innerhalb der Spanne');
    ok(PV.muByKey(m.key) === m, 'µ[' + i + ']: muByKey-Roundtrip');
    ok(PV.MU_ORDER[i] === m.key, 'µ[' + i + ']: Reihenfolge konsistent');
  });
  ok(PV.muByKey('GIBTS_NICHT') === null, 'muByKey: unbekannt → null');

  /* --- 19.2 Hand-Anker (exakt vorgerechnet; ±2 %-Band + Implementierungs-
   *     Gleichheit). A) St/St Vollwelle · B) Hohlwelle · C) GJL-Nabe (NH). -- */
  // A) Q_A=0,5, Q_I=0, U_w=60 µm: W=[(1,25/0,75)+0,3+0,7]/210000 → p=78,75 exakt.
  var a = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 60,
                       RzA_um: 0, RzI_um: 0, matA: ST, matI: ST, mu: 0.14 });
  ok(a.ok === true, 'Anker A rechnet');
  relEq(a.r.p_max, 78.75, 0.02, 'Anker A: p im ±2 %-Band');
  relEq(a.r.p_max, 78.75, 1e-9, 'Anker A: p exakt (Implementierung)');
  relEq(a.r.p_min, a.r.p_max, 1e-12, 'Anker A: U_min=U_max → p_min=p_max');
  relEq(a.r.pzulA, 266.25 / Math.sqrt(3), 1e-12, 'Anker A: p_zul,A = (1−Q²)·Re/√3');
  relEq(a.r.pzulI, 355 / Math.sqrt(3), 1e-12, 'Anker A: p_zul,I (Vollwelle, Q_I=0)');
  relEq(a.r.SF, (266.25 / Math.sqrt(3)) / 78.75, 1e-9, 'Anker A: S_F = p_zul/p_max');
  relEq(a.r.Fax_max_N, 0.14 * 78.75 * Math.PI * 60 * 45, 1e-9, 'Anker A: F_ax,max = µ·p·π·D_F·l_F');
  relEq(a.r.Mt_max_Nm, 0.14 * 78.75 * Math.PI * 60 * 45 * 0.03, 1e-9, 'Anker A: M_t,max = F_ax,max·D_F/2');
  relEq(a.r.Fe_N, a.r.Fax_max_N, 1e-12, 'Anker A: F_e = F_ax,max (p_min=p_max)');
  relEq(a.r.Sf_um, 60, 1e-12, 'Anker A: Fügespiel 1 µm/mm');
  relEq(a.r.dT_hub_K, 120000 / 690, 1e-9, 'Anker A: ΔT Nabe = (U+S_f)/(α·D_F)');
  relEq(a.r.T_hub_C, 20 + 120000 / 690, 1e-9, 'Anker A: Fügetemperatur Nabe');
  relEq(a.r.T_shaft_C, 20 - 120000 / 690, 1e-9, 'Anker A: Wellen-Kühltemperatur');
  ok(a.hints.indexOf('PV_HINT_TEMP_SHAFT_LN2') >= 0, 'Anker A: Unterkühlen braucht LN2/Trockeneis-Hinweis');
  ok(a.hints.indexOf('PV_WARN_YIELD') < 0, 'Anker A: vollelastisch (kein Fließ-Warnhinweis)');
  ok(a.hints.indexOf('PV_HINT_LF_SHORT') < 0 && a.hints.indexOf('PV_HINT_LF_LONG') < 0,
     'Anker A: l_F/D_F=0,75 ohne Längen-Hinweis');

  // B) Hohlwelle Q_I=0,5: W=(1,966667+1,366667)/210000 → p=63,00 exakt.
  var b = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 30, U_max_um: 60, U_min_um: 60,
                       matA: ST, matI: ST, mu: 0.14 });
  ok(b.ok === true, 'Anker B rechnet');
  relEq(b.r.p_max, 63.0, 0.02, 'Anker B: p (Hohlwelle) im ±2 %-Band');
  relEq(b.r.p_max, 63.0, 1e-9, 'Anker B: p exakt');
  ok(b.r.p_max < a.r.p_max, 'Anker B: Hohlwelle nachgiebiger → kleinerer Druck');
  relEq(b.r.pzulI, 0.75 * 355 / Math.sqrt(3), 1e-12, 'Anker B: p_zul,I Hohlwelle');

  // C) GJL-Nabe (spröde → NH) auf Stahl-Vollwelle: p_zul,A = 250·0,75/1,25 = 150.
  var c0 = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 60,
                        matA: GJL, matI: ST, mu: 0.10 });
  ok(c0.ok === true, 'Anker C rechnet');
  var Wc = ((1 + 0.25) / (1 - 0.25) + 0.28) / 110000 + (1 - 0.30) / 210000;
  relEq(c0.r.p_max, 0.001 / Wc, 1e-9, 'Anker C: p (GJL-Nabe) unabhängig nachgerechnet');
  relEq(c0.r.p_max, 47.55, 0.02, 'Anker C: p im ±2 %-Band um Handwert 47,55');
  relEq(c0.r.pzulA, 150, 1e-12, 'Anker C: p_zul,A = (1−Q²)/(1+Q²)·Rm (NH, spröde)');
  ok(c0.r.hypA === 'NH' && c0.r.hypI === 'GEH', 'Anker C: Hypothesen je Seite korrekt');
  ok(c0.hints.indexOf('PV_HINT_BRITTLE') >= 0, 'Anker C: Sprödbruch-Hinweis (S ≥ 2…3)');

  /* --- 19.3 Quervergleichs-Netz: Modul gegen unabhängigen Lamé-Pfad ------- */
  var DFs = [20, 60, 120, 300], QAs = [0.3, 0.5, 0.7, 0.85], QIs = [0, 0.4, 0.7];
  var mats = [[ST, ST], [GJL, ST], [ST, ALU]], Uws = [10, 60, 150];
  DFs.forEach(function (DF) {
    QAs.forEach(function (QA) {
      QIs.forEach(function (QI) {
        mats.forEach(function (pair, mi) {
          Uws.forEach(function (Uw) {
            var DAa = DF / QA, DIi = DF * QI;
            var inp = { DF: DF, lF: 0.8 * DF, DAa: DAa, DIi: DIi,
                        U_max_um: Uw, U_min_um: Uw / 2,
                        matA: pair[0], matI: pair[1], mu: 0.12 };
            var tag = 'Netz DF=' + DF + ' QA=' + QA + ' QI=' + QI + ' m' + mi + ' Uw=' + Uw;
            var r1 = PV.compute(inp);
            ok(r1.ok === true, tag + ': rechnet');
            if (!r1.ok) return;
            relEq(r1.r.p_max, pLame(Uw, DF, DAa, DIi, pair[0], pair[1]), 1e-9, tag + ': p == Lamé-Pfad');
            relEq(r1.r.p_max, 2 * r1.r.p_min, 1e-9, tag + ': p linear im Übermaß');
            var pzA = pair[0].brittle ? (1 - QA * QA) / (1 + QA * QA) * pair[0].Rm
                                      : (1 - QA * QA) * pair[0].Re / Math.sqrt(3);
            var pzI = pair[1].brittle ? (1 - QI * QI) / (1 + QI * QI) * pair[1].Rm
                                      : (1 - QI * QI) * pair[1].Re / Math.sqrt(3);
            relEq(r1.r.pzulA, pzA, 1e-12, tag + ': p_zul,A unabhängig');
            relEq(r1.r.pzulI, pzI, 1e-12, tag + ': p_zul,I unabhängig');
            relEq(r1.r.Mt_max_Nm, r1.r.Fax_max_N * DF / 2000, 1e-12, tag + ': M_t = F_ax·D_F/2');
            relEq(r1.r.Fe_N, 0.12 * r1.r.p_max * Math.PI * DF * inp.lF, 1e-12, tag + ': F_e-Umkehr');
            relEq(pair[0].alpha * DF * r1.r.dT_hub_K / 1000, Uw + DF, 1e-9, tag + ': ΔT-Umkehr Nabe');
            var r2 = PV.compute(withx(inp, { Mt_Nm: r1.r.Mt_max_Nm / 2 }));
            ok(r2.ok && Math.abs(r2.r.SH - 2) < 1e-9, tag + ': S_H=2 bei halbem M_t,max');
            var r3 = PV.compute(withx(inp, { mu: 0.24 }));
            relEq(r3.r.Fax_max_N, 2 * r1.r.Fax_max_N, 1e-12, tag + ': F_ax,max ~ µ');
          });
        });
      });
    });
  });

  /* --- 19.4 Eigenschaften & Randfälle ------------------------------------ */
  // Kontinuität Vollwelle ↔ winzige Bohrung:
  var s0 = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 30, matA: ST, matI: ST, mu: 0.12 });
  var s1 = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 1e-6, U_max_um: 60, U_min_um: 30, matA: ST, matI: ST, mu: 0.12 });
  relEq(s0.r.p_max, s1.r.p_max, 1e-6, 'Kontinuität: Vollwelle ≈ D_Ii→0');
  // Monotonie: dünnere Nabe (größeres Q_A) → kleinerer Druck:
  var prev = null;
  [0.3, 0.5, 0.7, 0.85, 0.92].forEach(function (QA) {
    var r = PV.compute({ DF: 60, lF: 45, DAa: 60 / QA, DIi: 0, U_max_um: 60, U_min_um: 30, matA: ST, matI: ST, mu: 0.12 });
    ok(r.ok === true, 'Monotonie QA=' + QA + ': rechnet');
    if (prev !== null) ok(r.r.p_max < prev, 'Monotonie QA=' + QA + ': p fällt mit dünnerer Nabe');
    prev = r.r.p_max;
  });
  // Dünnwand-Hinweis:
  var thin = PV.compute({ DF: 60, lF: 45, DAa: 65, DIi: 0, U_max_um: 60, U_min_um: 30, matA: ST, matI: ST, mu: 0.12 });
  ok(thin.hints.indexOf('PV_HINT_THIN_HUB') >= 0, 'Q_A>0,8 → Dünnwand-Hinweis');
  // Glättung 0,8·ΣRz (gleiche Konvention wie beratung.js/F6):
  var g = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 40,
                       RzA_um: 4, RzI_um: 6, matA: ST, matI: ST, mu: 0.14 });
  relEq(g.r.G_um, 8, 1e-12, 'Glättung G = 0,8·(4+6) = 8 µm');
  relEq(g.r.Uw_max_um, 52, 1e-12, 'U_w,max = 60 − 8');
  relEq(g.r.Uw_min_um, 32, 1e-12, 'U_w,min = 40 − 8');
  // U_w,min ≤ 0 → p_min=0, Warnung, keine Übertragbarkeit garantierbar:
  var w = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 5,
                       RzA_um: 4, RzI_um: 4, matA: ST, matI: ST, mu: 0.14 });
  ok(w.ok && w.hints.indexOf('PV_WARN_UWMIN') >= 0, 'U_w,min≤0 → Warnung');
  ok(w.r.p_min === 0 && w.r.Fax_max_N === 0 && w.r.Mt_max_Nm === 0, 'U_w,min≤0 → p_min=F_ax=M_t=0');
  // Fließwarnung bei überzogenem Übermaß:
  var y = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 500, U_min_um: 400, matA: ST, matI: ST, mu: 0.14 });
  ok(y.hints.indexOf('PV_WARN_YIELD') >= 0 && y.r.SF < 1, 'p_max>p_zul → Fließwarnung, S_F<1');
  // Längen-Hinweise:
  var ls = PV.compute({ DF: 60, lF: 10, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 30, matA: ST, matI: ST, mu: 0.12 });
  ok(ls.hints.indexOf('PV_HINT_LF_SHORT') >= 0, 'l_F/D_F<0,3 → Kurz-Hinweis');
  var ll = PV.compute({ DF: 60, lF: 100, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 30, matA: ST, matI: ST, mu: 0.12 });
  ok(ll.hints.indexOf('PV_HINT_LF_LONG') >= 0, 'l_F/D_F>1,5 → Lang-Hinweis');
  // Kriech-Hinweis (Alu-Seite):
  var cr = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 30, matA: ST, matI: ALU, mu: 0.05 });
  ok(cr.hints.indexOf('PV_HINT_CREEP') >= 0, 'Alu beteiligt → Kriech-/Setz-Hinweis');
  // Spröde Welle (Sonderfall) rechnet mit NH:
  var bi = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 20, U_max_um: 60, U_min_um: 30, matA: ST, matI: GJL, mu: 0.10 });
  ok(bi.ok === true && bi.r.hypI === 'NH', 'spröde Welle → NH-Grenze innen');
  // T0-Verschiebung wirkt 1:1 auf Fügetemperaturen:
  var t0 = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 60, matA: ST, matI: ST, mu: 0.14, T0_C: 30 });
  relEq(t0.r.T_hub_C - a.r.T_hub_C, 10, 1e-9, 'T0 +10 °C → Nabentemperatur +10 °C');
  // Vertauschte Übermaß-Grenzen werden normiert:
  var swp = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 30, U_min_um: 60, matA: ST, matI: ST, mu: 0.12 });
  ok(swp.ok && Math.abs(swp.r.U_max_um - 60) < 1e-12 && Math.abs(swp.r.U_min_um - 30) < 1e-12,
     'U_min>U_max → stillschweigend sortiert');
  // fromFit: Integration mit echtem Solver-Ergebnis (Ø60 H7/s6 = Presspassung):
  var fr = S.computeFit('60 H7/s6');
  var uu = PV.fromFit(fr);
  ok(fr.ok === true && uu !== null, 'fromFit: 60 H7/s6 rechnet');
  ok(uu.U_max_um === fr.fit.interferenceMax && uu.U_min_um === fr.fit.interferenceMin, 'fromFit: Felder 1:1');
  ok(uu.U_max_um > 0 && uu.U_min_um > 0, 'fromFit: H7/s6 ist echte Presspassung');
  var fc = PV.compute({ DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: uu.U_max_um, U_min_um: uu.U_min_um,
                        matA: ST, matI: ST, mu: 0.14 });
  ok(fc.ok === true && fc.r.p_max > fc.r.p_min && fc.r.p_min > 0, 'fromFit → compute: plausible Drücke');
  ok(PV.fromFit(null) === null && PV.fromFit({ ok: false }) === null, 'fromFit: ungültig → null');

  /* --- 19.5 Fehlerpfade --------------------------------------------------- */
  function err(inp, code, msg) {
    var r = PV.compute(inp);
    ok(r.ok === false && r.error === code, msg + ' → ' + code + ' (ist: ' + (r.ok ? 'ok' : r.error) + ')');
  }
  var base = { DF: 60, lF: 45, DAa: 120, DIi: 0, U_max_um: 60, U_min_um: 30, matA: ST, matI: ST, mu: 0.12 };
  err(null, 'PV_ERR_INPUT', 'null-Eingabe');
  err(withx(base, { DF: null }), 'PV_ERR_INPUT', 'D_F fehlt');
  err(withx(base, { lF: 0 }), 'PV_ERR_INPUT', 'l_F = 0');
  err(withx(base, { DAa: 60 }), 'PV_ERR_GEOM', 'D_Aa = D_F');
  err(withx(base, { DIi: 60 }), 'PV_ERR_GEOM', 'D_Ii = D_F');
  err(withx(base, { DIi: -1 }), 'PV_ERR_GEOM', 'D_Ii < 0');
  err(withx(base, { matA: { E: 210000 } }), 'PV_ERR_MAT', 'ν fehlt');
  err(withx(base, { matA: { E: 110000, nu: 0.28, brittle: true } }), 'PV_ERR_MAT', 'spröde ohne R_m');
  err(withx(base, { mu: 0 }), 'PV_ERR_MU', 'µ = 0');
  err(withx(base, { mu: 1.2 }), 'PV_ERR_MU', 'µ > 1');
  err(withx(base, { U_max_um: 0, U_min_um: 0 }), 'PV_ERR_NO_INTERFERENCE', 'kein Übermaß');
  err(withx(base, { U_max_um: 10, U_min_um: 5, RzA_um: 10, RzI_um: 10 }), 'PV_ERR_NO_INTERFERENCE', 'Glättung frisst Übermaß');
  err(withx(base, { RzA_um: -1 }), 'PV_ERR_INPUT', 'Rz < 0');
  err(withx(base, { Mt_Nm: -5 }), 'PV_ERR_INPUT', 'M_t < 0');
})();

/* === 20) B10d — Rechenweg Pressverband + Presets ========================== */
section('20) Rechenweg Pressverband + Presets');
(function () {
  if (!RW || !RW.buildPressverband) { ok(false, 'RW.buildPressverband nicht geladen'); return; }
  if (!PV || !PV.PRESETS) { ok(false, 'PV.PRESETS nicht geladen'); return; }

  var ST  = { E: 210000, nu: 0.30, Re: 355, alpha: 11.5 };
  var GJL = { E: 110000, nu: 0.28, Re: null, Rm: 250, brittle: true, alpha: 10 };
  var ALU = { E: 70000,  nu: 0.33, Re: 250, alpha: 23 };
  var mats = [[ST, ST], [GJL, ST], [ST, ALU], [ST, GJL]];

  function mkPv(DF, lF, DAa, DIi, Umax, Umin, RzA, RzI, pair, mu, Mt, Fax) {
    return { DF: DF, lF: lF, DAa: DAa, DIi: DIi, Umax: Umax, Umin: Umin,
             RzA: RzA, RzI: RzI, matA: pair[0], matI: pair[1], mu: mu, Mt: Mt, Fax: Fax };
  }
  function computeFrom(pv) {
    return PV.compute({ DF: pv.DF, lF: pv.lF, DAa: pv.DAa, DIi: pv.DIi,
      U_max_um: pv.Umax, U_min_um: pv.Umin, RzA_um: pv.RzA, RzI_um: pv.RzI,
      matA: pv.matA, matI: pv.matI, mu: pv.mu, Mt_Nm: pv.Mt, Fax_N: pv.Fax });
  }

  /* --- 20.1 Selbstprüfung über breites Kombinationsnetz ------------------- */
  var DFs = [20, 60, 120, 300], QAs = [0.4, 0.6, 0.8], QIs = [0, 0.5];
  var Us = [[80, 40], [60, 60], [120, 30]], Rzs = [[0, 0], [4, 1.6], [10, 4]];
  var loads = [[0, 0], [200, 0], [150, 3000]], mus = [0.08, 0.14];
  var netCount = 0, netBad = 0, stepMin = 999, stepMax = 0;
  DFs.forEach(function (DF) {
    QAs.forEach(function (QA) {
      QIs.forEach(function (QI) {
        mats.forEach(function (pair) {
          Us.forEach(function (U) {
            Rzs.forEach(function (Rz) {
              var li = (DF + QA * 10 + QI * 3) | 0;
              var load = loads[li % loads.length], mu = mus[li % mus.length];
              var pv = mkPv(DF, 0.8 * DF, DF / QA, DF * QI, U[0], U[1], Rz[0], Rz[1], pair, mu, load[0], load[1]);
              var c = computeFrom(pv);
              if (!c.ok) return;  // z. B. Glättung frisst Übermaß → im Randfall-Block separat geprüft
              netCount++;
              var rw = RW.buildPressverband(pv, c.r);
              if (rw.steps.length < stepMin) stepMin = rw.steps.length;
              if (rw.steps.length > stepMax) stepMax = rw.steps.length;
              if (rw.allOk !== true) { netBad++; if (netBad <= 3) console.log('  RW-bad:', JSON.stringify(pv)); }
            });
          });
        });
      });
    });
  });
  ok(netCount > 200, 'PV-Rechenweg: großes Netz durchgerechnet (n=' + netCount + ')');
  ok(netBad === 0, 'PV-Rechenweg: jede Formel prüft sich grün (' + netBad + ' Fehler)');
  ok(stepMin >= 15, 'PV-Rechenweg: mind. 15 Schritte je Fall (min=' + stepMin + ')');
  ok(stepMax <= 24, 'PV-Rechenweg: Schrittzahl plausibel (max=' + stepMax + ')');

  /* --- 20.2 Schritt-Präsenz: enthält die Kern-Formeln als Klartext -------- */
  var pvA = mkPv(60, 45, 120, 0, 60, 60, 4, 1.6, [ST, ST], 0.14, 250, 0);
  var cA = computeFrom(pvA); ok(cA.ok, '20.2 Referenzfall rechnet');
  var rwA = RW.buildPressverband(pvA, cA.r);
  function hasKey(rw, k) { return rw.steps.some(function (s) { return s.key === k; }); }
  ['rwPvSmooth','rwPvUwMax','rwPvUwMin','rwPvQA','rwPvQI','rwPvKA','rwPvKI','rwPvW',
   'rwPvPmax','rwPvPmin','rwPvPzulA','rwPvPzulI','rwPvPzul','rwPvSF','rwPvAF',
   'rwPvFax','rwPvMt','rwPvFe','rwPvSf'].forEach(function (k) {
    ok(hasKey(rwA, k), '20.2 Schritt vorhanden: ' + k);
  });
  // Formeln erscheinen als Text (Nachvollziehbarkeit für den Nutzer):
  var joined = rwA.steps.map(function (s) { return s.expr; }).join(' || ');
  ok(/W = K_A\/E_A \+ K_I\/E_I/.test(joined), '20.2 Formel W im Klartext');
  ok(/p_max = \(U_w,max\/D_F\)\/W/.test(joined), '20.2 Formel p_max im Klartext');
  ok(/S_F = p_zul \/ p_max/.test(joined), '20.2 Formel S_F im Klartext');
  ok(/M_t,max = F_ax,max·D_F\/2/.test(joined), '20.2 Formel M_t,max im Klartext');
  ok(/√3/.test(joined), '20.2 GEH-√3 sichtbar');
  // Mt=250 gefordert → S_H-Schritt vorhanden; Fax=0 & Mt=0 → kein S_H:
  ok(hasKey(rwA, 'rwPvSH') && hasKey(rwA, 'rwPvFres'), '20.2 Lastfall zeigt S_H + F_res');
  var pvNo = mkPv(60, 45, 120, 0, 60, 60, 0, 0, [ST, ST], 0.14, 0, 0);
  var rwNo = RW.buildPressverband(pvNo, computeFrom(pvNo).r);
  ok(!hasKey(rwNo, 'rwPvSH'), '20.2 ohne Last kein S_H-Schritt');
  // GJL-Nabe → NH-Kennzeichnung im p_zul,A-Schritt:
  var pvG = mkPv(50, 45, 110, 0, 59, 18, 10, 4, [GJL, ST], 0.10, 80, 0);
  var rwG = RW.buildPressverband(pvG, computeFrom(pvG).r);
  var sA = rwG.steps.filter(function (s) { return s.key === 'rwPvPzulA'; })[0];
  ok(sA && /NH/.test(sA.expr) && sA.art === 'brittle', '20.2 GJL-Nabe: NH-Grenze markiert');

  /* --- 20.3 Negativkontrollen: verfälschtes v muss auffallen -------------- */
  function tamper(field, delta) {
    var c = computeFrom(pvA); var v = {}; for (var k in c.r) v[k] = c.r[k];
    v[field] = v[field] + delta;
    return RW.buildPressverband(pvA, v).allOk;
  }
  ok(tamper('p_max', 0.5) === false, '20.3 verfälschtes p_max erkannt');
  ok(tamper('W', 1e-8) === false, '20.3 verfälschtes W erkannt');
  ok(tamper('pzul', 5) === false, '20.3 verfälschtes p_zul erkannt');
  ok(tamper('SF', 0.2) === false, '20.3 verfälschtes S_F erkannt');
  ok(tamper('Fax_max_N', 100) === false, '20.3 verfälschtes F_ax,max erkannt');
  ok(tamper('Mt_max_Nm', 5) === false, '20.3 verfälschtes M_t,max erkannt');
  ok(tamper('dT_hub_K', 5) === false, '20.3 verfälschtes ΔT_Nabe erkannt');
  ok(RW.buildPressverband(null, null).allOk === false, '20.3 leere Eingabe → allOk=false');

  /* --- 20.4 UWMIN-Randfall: p_min=0 wird sauber abgebildet ---------------- */
  var pvW = mkPv(60, 45, 120, 0, 60, 5, 4, 4, [ST, ST], 0.14, 0, 0);
  var cW = computeFrom(pvW); ok(cW.ok && cW.r.p_min === 0, '20.4 Randfall: p_min=0');
  var rwW = RW.buildPressverband(pvW, cW.r);
  ok(rwW.allOk === true, '20.4 Rechenweg bleibt konsistent bei p_min=0');
  var sUwMin = rwW.steps.filter(function (s) { return s.key === 'rwPvUwMin'; })[0];
  ok(sUwMin && /→ 0/.test(sUwMin.expr), '20.4 U_w,min-Schritt weist 0 aus');

  /* --- 20.5 Presets: genau 3, füllen grün und zeigen je eine Facette ------ */
  ok(PV.PRESETS.length === 3, 'Presets: genau 3 Beispiele');
  var facetSlip = false, facetBrittle = false, facetHollow = false;
  PV.PRESETS.forEach(function (P, i) {
    ok(typeof P.label === 'string' && P.label.length > 5, 'Preset ' + i + ': Label vorhanden');
    var fr = S.computeFit(P.fit);
    ok(fr.ok === true, 'Preset ' + i + ': Passung „' + P.fit + '\" parst');
    ok(fr.fit.art === 'UEBERMASS', 'Preset ' + i + ': ist echte Übermaßpassung');
    ok(!!PV.muByKey(P.muKey), 'Preset ' + i + ': µ-Key gültig (' + P.muKey + ')');
    ok(!!TH.MAT[P.matA] && !!TH.MAT[P.matI], 'Preset ' + i + ': Werkstoffe existieren');
    ok(P.DAa > P.fit.split(' ')[0] * 1 && P.lF > 0, 'Preset ' + i + ': Geometrie plausibel');
    var uu = PV.fromFit(fr);
    var c = PV.compute({ DF: fr.input.nominal, lF: P.lF, DAa: P.DAa, DIi: P.DIi,
      U_max_um: uu.U_max_um, U_min_um: uu.U_min_um, RzA_um: P.rz[0], RzI_um: P.rz[1],
      matA: TH.MAT[P.matA], matI: TH.MAT[P.matI], mu: PV.muByKey(P.muKey).mu,
      Mt_Nm: P.Mt, Fax_N: P.Fax });
    ok(c.ok === true, 'Preset ' + i + ': rechnet ohne Fehler');
    if (!c.ok) return;
    ok(c.r.p_max > 0 && c.r.p_min >= 0, 'Preset ' + i + ': Drücke ≥ 0');
    ok(c.r.SF >= 1, 'Preset ' + i + ': elastisch (S_F ≥ 1, ist ' + c.r.SF.toFixed(2) + ')');
    if (P.Mt > 0) ok(c.r.SH >= 1, 'Preset ' + i + ': hält gefordertes M_t (S_H ≥ 1, ist ' + (c.r.SH||0).toFixed(2) + ')');
    // Rechenweg des Presets ist grün:
    var pvp = { DF: fr.input.nominal, lF: P.lF, DAa: P.DAa, DIi: P.DIi, Umax: uu.U_max_um, Umin: uu.U_min_um,
                RzA: P.rz[0], RzI: P.rz[1], matA: TH.MAT[P.matA], matI: TH.MAT[P.matI],
                mu: PV.muByKey(P.muKey).mu, Mt: P.Mt, Fax: P.Fax };
    ok(RW.buildPressverband(pvp, c.r).allOk === true, 'Preset ' + i + ': Rechenweg grün');
    if (P.DIi > 0) facetHollow = true;
    if (TH.MAT[P.matA].brittle || TH.MAT[P.matI].brittle) facetBrittle = true;
    if (c.hints.indexOf('PV_HINT_BRITTLE') >= 0) facetBrittle = true;
  });
  ok(facetHollow, 'Presets: ein Beispiel deckt die Hohlwelle ab');
  ok(facetBrittle, 'Presets: ein Beispiel deckt die spröde Nabe (GJL) ab');
})();

/* === 21) B11 — Passungs-Assistent ========================================= */
section('21) Passungs-Assistent');
(function () {
  if (!AS || !AS.recommend) { ok(false, 'DTPAssistent nicht geladen'); return; }

  // 21.1 Dialogfluss: erste Frage, Fragenreihenfolge, kontextabhängige 4. Frage.
  ok(AS.firstQuestion() === 'purpose', 'erste Frage ist purpose');
  ok(AS.nextQuestion({}) === 'purpose', 'leer → purpose');
  ok(AS.nextQuestion({ purpose: 'SLIDE' }) === 'demount', 'nach purpose → demount');
  ok(AS.nextQuestion({ purpose: 'SLIDE', demount: 'OFTEN' }) === 'precision', 'nach demount → precision');
  ok(AS.nextQuestion({ purpose: 'FIXED', demount: 'NEVER', precision: 'HIGH' }) === 'hubMat',
     'FIXED → 4. Frage ist hubMat');
  ok(AS.nextQuestion({ purpose: 'SLIDE', demount: 'SELDOM', precision: 'HIGH' }) === 'temp',
     'nicht-FIXED → 4. Frage ist temp');
  ok(AS.nextQuestion({ purpose: 'HANDFIT', demount: 'OFTEN', precision: 'NORMAL' }) === 'temp',
     'HANDFIT → 4. Frage ist temp');
  ok(AS.nextQuestion({ purpose: 'FIXED', demount: 'NEVER', precision: 'HIGH', hubMat: 'STEEL' }) === null,
     'FIXED vollständig → fertig (null)');
  ok(AS.nextQuestion({ purpose: 'SLIDE', demount: 'SELDOM', precision: 'HIGH', temp: 'NORMAL' }) === null,
     'SLIDE vollständig → fertig (null)');

  // 21.2 Optionen je Frage vorhanden; Freimaß NICHT enthalten (bewusst raus).
  ok(AS.optionsFor('purpose').length === 3, 'purpose hat 3 Optionen');
  ok(AS.optionsFor('purpose').indexOf('FREEFORM') < 0 && AS.optionsFor('purpose').indexOf('LOOSE') < 0,
     'purpose enthält kein Freimaß');
  ['purpose', 'demount', 'precision', 'hubMat', 'temp'].forEach(function (q) {
    ok(AS.optionsFor(q).length >= 2, 'Frage ' + q + ' hat ≥2 Optionen');
  });
  ok(AS.isValidAnswer('purpose', 'FIXED') && !AS.isValidAnswer('purpose', 'XXX'), 'isValidAnswer prüft korrekt');

  // 21.3 Unvollständig → Fehler; vollständig → 1..3 Vorschläge, jeder wohlgeformt.
  ok(AS.recommend({}).ok === false, 'ohne purpose → Fehler');
  ok(AS.recommend({}).error === 'AS_ERR_INCOMPLETE', 'Fehlercode AS_ERR_INCOMPLETE');

  var purposes = ['SLIDE', 'HANDFIT', 'FIXED'];
  var demounts = ['OFTEN', 'SELDOM', 'NEVER'];
  var precs    = ['NORMAL', 'HIGH', 'LOW'];
  var hubs     = ['STEEL', 'CAST', 'LIGHT'];
  var temps    = ['NORMAL', 'HOT'];
  var fitRe = /^H\d\/[a-z]+\d$|^H\d[A-Z]?\/[a-z]+\d$|^[A-Z]+\d\/[a-z]+\d$/; // grob: X#/y#
  var combos = 0, reasonCodes = {}, allFitsParse = true, badShape = 0;
  purposes.forEach(function (p) {
    demounts.forEach(function (d) {
      precs.forEach(function (pr) {
        var fourths = (p === 'FIXED') ? hubs : temps;
        fourths.forEach(function (f) {
          var a = { purpose: p, demount: d, precision: pr };
          a[(p === 'FIXED') ? 'hubMat' : 'temp'] = f;
          var r = AS.recommend(a);
          combos++;
          if (!r.ok) { badShape++; return; }
          if (r.suggestions.length < 1 || r.suggestions.length > 3) badShape++;
          r.suggestions.forEach(function (s) {
            if (!s.fit || typeof s.reasonCode !== 'string' || s.reasonCode.indexOf('AS_R_') !== 0) badShape++;
            reasonCodes[s.reasonCode] = true;
            // Jeder Vorschlag muss vom echten Solver parsebar sein (mit Nennmaß):
            var pf = S.parseFit('50 ' + s.fit);
            if (!pf || !pf.ok) { allFitsParse = false; if (badShape < 3) console.log('  UNPARSEBAR:', s.fit); }
          });
          // answers werden unverändert zurückgegeben (für UI-Zustand):
          if (r.answers.purpose !== p) badShape++;
        });
      });
    });
  });
  ok(combos === (3 * 3 * 3) + (2 * 3 * 3 * 2), 'alle Antwort-Kombinationen durchgespielt (n=' + combos + ')'); // FIXED:27 + nicht-FIXED:36
  ok(badShape === 0, 'jeder Vorschlag wohlgeformt (fit + AS_R_-reasonCode, 1..3 Stück)');
  ok(allFitsParse === true, 'jeder vorgeschlagene fit ist vom Solver parsebar');

  // 21.4 Fachliche Kernaussagen (Stichproben gegen die Empfehlungsmatrix).
  function fits(a) { return AS.recommend(a).suggestions.map(function (s) { return s.fit; }); }
  function hints(a) { return AS.recommend(a).suggestions.map(function (s) { return s.hintCode; }); }
  ok(fits({ purpose: 'SLIDE', demount: 'SELDOM', precision: 'HIGH', temp: 'NORMAL' })[0] === 'H7/g6',
     'Gleiten + hochpräzise → H7/g6 zuerst');
  ok(fits({ purpose: 'SLIDE', demount: 'SELDOM', precision: 'LOW', temp: 'NORMAL' })[0] === 'H8/e8',
     'Gleiten + unkritisch → H8/e8 (großzügiger Ölspalt)');
  ok(fits({ purpose: 'HANDFIT', demount: 'SELDOM', precision: 'NORMAL', temp: 'NORMAL' })[0] === 'H7/h6',
     'Fügen/lösen normal → H7/h6 (Schiebesitz) zuerst');
  ok(fits({ purpose: 'FIXED', demount: 'NEVER', precision: 'NORMAL', hubMat: 'STEEL' }).indexOf('H7/s6') >= 0,
     'Fest + nie demontiert → Presssitz H7/s6 dabei');
  // Presssitz-Vorschläge verweisen auf den Pressverband-Rechner:
  var fixedNever = AS.recommend({ purpose: 'FIXED', demount: 'NEVER', precision: 'NORMAL', hubMat: 'STEEL' });
  ok(fixedNever.suggestions.some(function (s) { return s.hintCode === 'AS_HINT_PRESS' || s.hintCode === 'AS_HINT_SHRINK'; }),
     'Presssitz verweist auf Pressverband/Schrumpf');
  // Leichtmetall-Nabe → p_zul-Warnung auf ALLEN Vorschlägen:
  ok(hints({ purpose: 'FIXED', demount: 'NEVER', precision: 'NORMAL', hubMat: 'LIGHT' })
       .every(function (h) { return h === 'AS_HINT_LIGHT_HUB'; }),
     'Leichtmetall-Nabe → p_zul-Warnung überall');
  // Guss-Nabe → Guss-Hinweis (spröde):
  ok(hints({ purpose: 'FIXED', demount: 'SELDOM', precision: 'NORMAL', hubMat: 'CAST' })
       .some(function (h) { return h === 'AS_HINT_CAST_HUB'; }),
     'Guss-Nabe → Sprödbruch-Hinweis');
  // Heißbetrieb (nicht-FIXED) → Thermik-Hinweis:
  ok(hints({ purpose: 'SLIDE', demount: 'SELDOM', precision: 'NORMAL', temp: 'HOT' })
       .some(function (h) { return h === 'AS_HINT_TEMP'; }),
     'Heißbetrieb → Thermik-Hinweis');

  // 21.5 h-Basis-Alternative wird bei mindestens einem Standardfall angeboten.
  var slideNorm = AS.recommend({ purpose: 'SLIDE', demount: 'SELDOM', precision: 'NORMAL', temp: 'NORMAL' });
  ok(slideNorm.suggestions.some(function (s) { return !!s.hBasisAlt; }), 'h-Basis-Alternative wird angeboten');

  // 21.6 Reinheit: recommend mutiert die Eingabe nicht.
  var inp = { purpose: 'FIXED', demount: 'NEVER', precision: 'HIGH', hubMat: 'CAST' };
  var snap = JSON.stringify(inp);
  AS.recommend(inp);
  ok(JSON.stringify(inp) === snap, 'recommend mutiert die Antworten nicht');
})();

/* === 22) B14 — Ausgaben: .dtp Save/Load, Gating, Datenmodell =============== */
section('22) Ausgaben (report.js)');
(function () {
  if (!RP) { ok(false, 'DTPReport nicht geladen'); return; }

  // 22.1 Gating Test/Voll — Testversion sperrt JEDE Ausgabe (Dieters Vorgabe).
  ok(RP.GATED_FEATURES.length === 7, 'GATED_FEATURES: 7 Ausgabewege gelistet');
  ['save', 'load', 'print', 'copy', 'cad', 'rtf', 'csv'].forEach(function (f) {
    ok(RP.GATED_FEATURES.indexOf(f) >= 0, 'GATED enthält ' + f);
    ok(RP.isFeatureAllowed(f, 'test') === false, 'Testversion sperrt ' + f);
    ok(RP.isFeatureAllowed(f, 'full') === true, 'Vollversion erlaubt ' + f);
    ok(RP.isFeatureAllowed(f, undefined) === true, 'unbekannte Edition erlaubt ' + f + ' (sichere Voreinstellung)');
    ok(RP.isFeatureAllowed(f, 'irgendwas') === true, 'fremde Kennung erlaubt ' + f);
  });
  ok(RP.shouldWatermark('test') === true && RP.shouldWatermark('full') === false, 'Wasserzeichen nur in Testversion');
  ['de', 'en', 'pt'].forEach(function (l) { ok(RP.watermarkText(l).length > 10, 'Wasserzeichentext ' + l); });

  // 22.2 .dtp Round-Trip: state bleibt bit-identisch (Eingaben, keine Ergebnisse).
  var state1 = {
    mode: 'fit', nominal: 50, hole: { letter: 'H', grade: 7 }, shaft: { letter: 'g', grade: 6 },
    system: 'EB',
    thermik: { on: true, T: 80, matHole: 'steel', matShaft: 'aluminum' },
    oberflaeche: { on: true, rzHole: 4, rzShaft: 1.6 },
    press: { on: true, matA: 'steel', matI: 'steel', muKey: 'STST_DRY', lF: 50, DAa: 120, DIi: 0, Mt: 250, Fax: 0 }
  };
  var text1 = RP.toDtp({ state: state1, designation: 'Getriebe-Lagersitz', now: '2026-07-18T10:00:00.000Z' });
  ok(typeof text1 === 'string' && text1.indexOf('DT-ProfiPassung') >= 0, '.dtp ist JSON mit Kennung');
  var back = RP.fromDtp(text1);
  ok(back.ok === true, '.dtp lädt fehlerfrei zurück');
  ok(JSON.stringify(back.state) === JSON.stringify(state1), '.dtp Round-Trip: state bit-identisch');
  ok(back.designation === 'Getriebe-Lagersitz', '.dtp Round-Trip: Bezeichnung erhalten');
  ok(back.created === '2026-07-18T10:00:00.000Z', '.dtp Round-Trip: Datum erhalten');
  ok(back.schema === RP.DTP_SCHEMA, '.dtp Round-Trip: Schema-Version');

  // Doppelter Round-Trip ist stabil (Idempotenz).
  var text2 = RP.toDtp({ state: back.state, designation: back.designation, now: back.created });
  ok(text2 === text1, '.dtp doppelter Round-Trip identisch');

  // 22.3 Robust gegen fremde/defekte Dateien — je eigener Fehlercode.
  ok(RP.fromDtp('').error === 'RP_ERR_EMPTY', 'leere Datei → RP_ERR_EMPTY');
  ok(RP.fromDtp('   ').error === 'RP_ERR_EMPTY', 'nur Whitespace → RP_ERR_EMPTY');
  ok(RP.fromDtp('{kein json').error === 'RP_ERR_JSON', 'kaputtes JSON → RP_ERR_JSON');
  ok(RP.fromDtp('{"foo":1}').error === 'RP_ERR_FORMAT', 'fremdes JSON → RP_ERR_FORMAT');
  ok(RP.fromDtp(JSON.stringify({ magic: 'DT-ProfiPassung' })).error === 'RP_ERR_FORMAT', 'Kennung ohne state → RP_ERR_FORMAT');
  ok(RP.fromDtp(JSON.stringify({ magic: 'FALSCH', schema: 1, state: {} })).error === 'RP_ERR_FORMAT', 'falsche Kennung → RP_ERR_FORMAT');
  ok(RP.fromDtp(JSON.stringify({ magic: 'DT-ProfiPassung', schema: 99, state: {} })).error === 'RP_ERR_SCHEMA', 'zu neues Schema → RP_ERR_SCHEMA');
  ok(RP.fromDtp('null').error === 'RP_ERR_FORMAT', 'JSON null → RP_ERR_FORMAT');
  ok(RP.fromDtp('[]').error === 'RP_ERR_FORMAT', 'JSON-Array → RP_ERR_FORMAT');

  // 22.4 Dateiname aus Bezeichnung (sicher, ohne Sonderzeichen).
  ok(RP.dtpFilename('Getriebe-Lagersitz') === 'Getriebe-Lagersitz.dtp', 'Dateiname aus Bezeichnung');
  ok(RP.dtpFilename('') === 'Passung.dtp', 'leere Bezeichnung → Passung.dtp');
  ok(RP.dtpFilename('a/b:c*?') === 'abc.dtp', 'Sonderzeichen entfernt');
  ok(RP.dtpFilename('Ø50 H7/g6').indexOf('.dtp') > 0, 'Umlaute/Sonderzeichen tolerant, Endung .dtp');
  ok(/\.dtp$/.test(RP.dtpFilename('Test Name')), 'Leerzeichen → Unterstrich, Endung .dtp');
  ok(RP.dtpFilename('Lagersitz', '2026-07-18T09:00:00Z') === 'Lagersitz_2026-07-18.dtp', 'Dateiname mit Datum');
  ok(RP.dtpFilename('', '2026-07-18T09:00:00Z') === 'Passung_2026-07-18.dtp', 'leere Bezeichnung + Datum');

  // 22.5 Lizenznehmer / Editionszeile (Muster der Schraube).
  ok(RP.licenseeName('  Max   Muster ') === 'Max Muster', 'licenseeName normalisiert Whitespace');
  ok(RP.licenseeName(null) === '', 'licenseeName(null) → leer');
  ok(RP.editionLicenseeLine('Vollversion', 'Max Muster', 'de').indexOf('Max Muster') > 0, 'Editionszeile mit Name');
  ok(RP.editionLicenseeLine('Vollversion', '', 'de') === 'Vollversion', 'Editionszeile ohne Name = nur Edition');
  ok(RP.licenseeField('Max', 'de') && RP.licenseeField('', 'de') === null, 'licenseeField nur bei Name');

  // 22.6 buildModel — sprachneutrales Datenmodell (Grundlage der Text-Exporte).
  var m = RP.buildModel({
    lang: 'de', designation: 'Lagersitz', headline: '\u00d850 H7/g6', now: '2026-07-18T00:00:00Z',
    dataVersion: 'ISO 286-2:2020', licensee: 'Max Muster',
    resultLines: [{ label: 'Kleinstspiel', value: '+9', unit: '\u00b5m' }, { label: 'Gr\u00f6\u00dftspiel', value: '+50', unit: '\u00b5m' }],
    inputLines: [{ label: 'Nennma\u00df', value: '50', unit: 'mm' }],
    extraSections: [{ title: 'Thermik', rows: [{ label: 'Temperatur', value: '80', unit: '\u00b0C' }] }],
    steps: [{ title: 'Kleinstspiel', expr: 'EI \u2212 es = 0 \u2212 (\u22129) = +9 \u00b5m', ok: true }]
  });
  ok(m.title === 'DT-ProfiPassung' && m.headline === '\u00d850 H7/g6', 'buildModel: Titel + Headline');
  ok(m.date === '2026-07-18', 'buildModel: Datum aus ISO-Zeitstempel');
  ok(m.result.length === 2 && m.inputs.length === 1, 'buildModel: Ergebnis-/Eingabezeilen');
  ok(m.extras.length === 1 && m.extras[0].rows.length === 1, 'buildModel: Zusatzbereiche');
  ok(m.steps.length === 1 && m.steps[0].ok === true, 'buildModel: Rechenweg-Schritte');
  ok(m.licensee && m.licensee.value === 'Max Muster', 'buildModel: Lizenznehmer');
  ok(m.disclaimer.indexOf('ISO 286') >= 0, 'buildModel: Disclaimer nennt Normen');
  var mEn = RP.buildModel({ lang: 'en' }), mPt = RP.buildModel({ lang: 'pt' });
  ok(mEn.caps.secResult !== m.caps.secResult && mPt.caps.secResult !== m.caps.secResult, 'buildModel: Überschriften je Sprache verschieden');

  // 22.7 num/sgnUm Formatierung locale-korrekt.
  ok(RP.num(1234.5, 'de', 1) === '1234,5' && RP.num(1234.5, 'en', 1) === '1234.5', 'num: Dezimaltrenner je Sprache');
  ok(RP.sgnUm(9, 'de') === '+9' && RP.sgnUm(-25, 'de') === '-25', 'sgnUm: Vorzeichen');

  // 22.8 RTF-Export (Word): wohlgeformt, enthält Kopf/Ergebnis/Zusatz/Rechenweg.
  var rtf = RP.buildRTF({
    lang: 'de', designation: 'Lagersitz', headline: '\u00d850 H7/g6', dataVersion: 'ISO 286-2:2020',
    resultLines: [{ label: 'Kleinstspiel', value: '+9', unit: '\u00b5m' }],
    inputLines: [{ label: 'Nennma\u00df', value: '50', unit: 'mm' }],
    extraSections: [{ title: 'Thermik', rows: [{ label: 'Temperatur', value: '80', unit: '\u00b0C' }] }],
    steps: [{ title: 'Kleinstspiel', expr: 'EI \u2212 es = +9 \u00b5m', ok: true }]
  });
  ok(rtf.indexOf('{\\rtf1') === 0, 'RTF beginnt mit {\\rtf1');
  ok(rtf.slice(-1) === '}', 'RTF endet mit }');
  ok(rtf.indexOf('Lagersitz') >= 0, 'RTF enthält Bezeichnung');
  ok(rtf.indexOf('Thermik') >= 0, 'RTF enthält Zusatzbereich');
  ok(rtf.indexOf('ISO 286') >= 0, 'RTF enthält Disclaimer/Norm');
  // Umlaute/Sonderzeichen als \uNNNN? escaped:
  ok(/\\u\d+\?/.test(rtf), 'RTF escapt Unicode-Zeichen');
  // RTF-Sonderzeichen im Text werden escaped (kein rohes { } \ aus Nutzertext):
  var rtf2 = RP.buildRTF({ lang: 'de', designation: 'a{b}c\\d', resultLines: [], steps: [] });
  ok(rtf2.indexOf('a\\{b\\}c\\\\d') >= 0, 'RTF escapt { } \\ aus Nutzertext');
  ok(RP.rtfFilename('Teil', '2026-07-18T09:00:00Z') === 'Teil_2026-07-18.rtf', 'rtfFilename mit Datum');
  ['de', 'en', 'pt'].forEach(function (l) {
    var rr = RP.buildRTF({ lang: l, resultLines: [{ label: 'x', value: '1', unit: 'µm' }], steps: [] });
    ok(rr.indexOf('{\\rtf1') === 0 && rr.slice(-1) === '}', 'RTF wohlgeformt (' + l + ')');
  });
})();

/* === Zusammenfassung ====================================================== */
say('\n  ========================================');
say('  Assertions gesamt : ' + (pass + fail));
say('  bestanden         : ' + pass);
say('  fehlgeschlagen    : ' + fail);
say('  ========================================');
if (fail > 0) {
  say('\n  FEHLER:');
  fails.forEach(function (m) { say('   - ' + m); });
} else {
  say('\n  ALLE TESTS BESTANDEN — Zahlenkern steht.');
}
/* Browser-Pruefstand abholen lassen; Exit-Code nur unter Node setzen: */
if (typeof window !== 'undefined' && typeof window.DTP_TEST_DONE === 'function') {
  window.DTP_TEST_DONE(pass, fail, fails, OUT.join('\n'));
}
if (fail > 0 && typeof process !== 'undefined' && process.exit) process.exit(1);
