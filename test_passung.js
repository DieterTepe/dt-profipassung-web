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
var D = (typeof module === 'object' && module.exports)
  ? require('./daten.js')
  : globalThis.DTPData;

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
