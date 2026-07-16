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
