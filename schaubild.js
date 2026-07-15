/* ============================================================================
 * DT-ProfiPassung · schaubild.js  (Baustein B5 — Toleranzfeld-Grafik)
 * ----------------------------------------------------------------------------
 * Zeichnet das maßstäbliche Toleranzfeld als Live-SVG:
 *   Nulllinie (= Nennmaß) · Bohrung GRÜN · Welle BLAU · µm-Achse ·
 *   dezente Spiel-/Übermaßzone. ALLE Zahlen stehen in der HTML-Legende (ui.js),
 *   nicht im SVG — Merksatz der Schraube (Zahlen in die Legende, Farb-Chips).
 * Rechenlogik (layout) ist DOM-frei und damit ohne Browser testbar.
 * Klassisches Skript; Ladereihenfolge: … solver -> schaubild -> ui.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DTPSchaubild = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  // Zeichenmaße (viewBox-Einheiten; per CSS auf 100% Breite skaliert).
  var DIM = { W: 320, H: 220, padL: 44, padR: 14, padT: 20, padB: 16 };

  /* ---- reine Layout-Mathematik (kein DOM) -------------------------------- *
   * Erwartet res.hole/res.shaft mit { upper, lower } in µm (ES/EI bzw. es/ei).
   * Liefert die vertikale µm→Pixel-Abbildung, Balken-Rechtecke und Achsen-Ticks.
   */
  /* therm (optional) = { dS, artT } — thermische Verschiebung des Passungsfensters
   * bei Betriebstemperatur T. Die Toleranzfelder (Balken) selbst bleiben bei 20 °C
   * (DIN EN ISO 1); zusätzlich wird die Welle als „Geist" um −dS verschoben und die
   * Spiel-/Übermaßzone bei T ermittelt. dS in µm; Vorzeichen: dS>0 ⇒ Spiel wächst. */
  function layout(res, therm) {
    var Hf = res.hole, Sf = res.shaft;
    var hasT = !!(therm && isFinite(therm.dS) && Math.abs(therm.dS) >= 0.05);
    var gU, gL;
    var vals = [0, Hf.upper, Hf.lower, Sf.upper, Sf.lower];
    if (hasT) {
      // Spiel = Bohrung − Welle; +dS (Spiel wächst) ⇔ Welle relativ um −dS verschoben.
      gU = Sf.upper - therm.dS; gL = Sf.lower - therm.dS;
      vals = vals.concat([gU, gL]);           // Skala weiten, damit der Geist nie abschneidet
    }
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var raw = hi - lo || 1;
    var pad = Math.max(raw * 0.15, 3);       // etwas Luft ober-/unterhalb
    lo -= pad; hi += pad;
    var span = hi - lo;

    var plotW = DIM.W - DIM.padL - DIM.padR;
    var plotH = DIM.H - DIM.padT - DIM.padB;
    function y(um) { return DIM.padT + (hi - um) / span * plotH; }

    var colW = plotW * 0.30;
    var holeX = DIM.padL + plotW * 0.12;
    var shaftX = DIM.padL + plotW * 0.58;
    function barRect(x, upper, lower) {
      var yt = y(upper), yb = y(lower);
      return { x: x, y: yt, w: colW, h: Math.max(yb - yt, 1.5), yTop: yt, yBot: yb };
    }

    // Spiel-/Übermaßzone bei 20 °C (nur eindeutige Fälle): Höhe = Mindestspiel bzw. Kleinstübermaß.
    var band = null;
    if (res.fit) {
      if (res.fit.art === 'SPIEL') {
        // zwischen Wellen-Oberkante (es) und Bohrungs-Unterkante (EI)
        band = { yTop: y(Hf.lower), yBot: y(Sf.upper), kind: 'spiel' };
      } else if (res.fit.art === 'UEBERMASS') {
        // Überlappung: zwischen Bohrungs-Oberkante (ES) und Wellen-Unterkante (ei)
        band = { yTop: y(Hf.upper), yBot: y(Sf.lower), kind: 'uebermass' };
      }
      if (band && Math.abs(band.yBot - band.yTop) < 0.6) band = null; // zu dünn -> weglassen
    }

    // Thermik-Zusatz: Wellen-„Geist" bei T + verschobene Spiel-/Übermaßzone bei T.
    var ghost = null, bandT = null;
    if (hasT) {
      ghost = barRect(shaftX, gU, gL);
      if (therm.artT === 'SPIEL') {
        // zwischen Bohrungs-Unterkante (EI) und Wellen-Geist-Oberkante (es − dS)
        bandT = { yTop: y(Hf.lower), yBot: y(gU), kind: 'spiel' };
      } else if (therm.artT === 'UEBERMASS') {
        // zwischen Bohrungs-Oberkante (ES) und Wellen-Geist-Unterkante (ei − dS)
        bandT = { yTop: y(Hf.upper), yBot: y(gL), kind: 'uebermass' };
      }
      if (bandT && Math.abs(bandT.yBot - bandT.yTop) < 0.6) bandT = null; // zu dünn -> weglassen
    }

    return {
      dim: DIM, lo: lo, hi: hi, span: span, y: y, y0: y(0),
      hole: barRect(holeX, Hf.upper, Hf.lower),
      shaft: barRect(shaftX, Sf.upper, Sf.lower),
      band: band, ghost: ghost, bandT: bandT, dS: hasT ? therm.dS : 0,
      ticks: [hi, 0, lo],
      cols: { holeCx: holeX + colW / 2, shaftCx: shaftX + colW / 2 }
    };
  }

  /* ---- SVG-Erzeugung ------------------------------------------------------ */
  function elNS(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function num(x) { return Math.round(x * 100) / 100; }

  /* Baut das SVG. labels = { hole:'H7', shaft:'g6', unit:'µm' } (sprachneutral). */
  function svg(res, labels, therm) {
    labels = labels || {};
    var L = layout(res, therm);
    var s = elNS('svg', {
      viewBox: '0 0 ' + DIM.W + ' ' + DIM.H, class: 'viz-svg',
      role: 'img', preserveAspectRatio: 'xMidYMid meet'
    });

    // Hatch-Muster für die Zone:
    var defs = elNS('defs');
    var pat = elNS('pattern', { id: 'tfHatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pat.appendChild(elNS('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'tf-hatch-line' }));
    defs.appendChild(pat); s.appendChild(defs);

    // Zone (hinter den Balken):
    if (L.band) {
      var by = Math.min(L.band.yTop, L.band.yBot), bh = Math.abs(L.band.yBot - L.band.yTop);
      s.appendChild(elNS('rect', {
        x: DIM.padL, y: by, width: DIM.W - DIM.padL - DIM.padR, height: bh,
        fill: 'url(#tfHatch)', class: 'tf-band tf-band-' + L.band.kind
      }));
    }

    // Nulllinie:
    s.appendChild(elNS('line', { x1: DIM.padL, y1: num(L.y0), x2: DIM.W - DIM.padR, y2: num(L.y0), class: 'tf-zero' }));

    // µm-Achse (Ticks hi/0/lo, sprachneutrale Zahlen):
    L.ticks.forEach(function (v) {
      var yy = num(L.y(v));
      s.appendChild(elNS('line', { x1: DIM.padL - 3, y1: yy, x2: DIM.padL, y2: yy, class: 'tf-tickmark' }));
      var tx = elNS('text', { x: DIM.padL - 6, y: yy + 3, class: 'tf-tick', 'text-anchor': 'end' });
      tx.textContent = (v > 0 ? '+' : '') + Math.round(v);
      s.appendChild(tx);
    });
    // Achsen-Einheit oben links:
    var un = elNS('text', { x: DIM.padL - 6, y: DIM.padT - 8, class: 'tf-axunit', 'text-anchor': 'end' });
    un.textContent = labels.unit || 'µm'; s.appendChild(un);

    // Balken:
    function bar(r, cls) { return elNS('rect', { x: num(r.x), y: num(r.y), width: num(r.w), height: num(r.h), rx: 2, class: cls }); }
    s.appendChild(bar(L.hole, 'tf-bar tf-bore'));
    s.appendChild(bar(L.shaft, 'tf-bar tf-shaft'));

    // Spaltenüberschriften (Buchstabe+Grad), farbig, oben:
    function col(cx, txt, cls) {
      var t = elNS('text', { x: num(cx), y: DIM.padT - 8, class: 'tf-collabel ' + cls, 'text-anchor': 'middle' });
      t.textContent = txt || ''; return t;
    }
    if (labels.hole) s.appendChild(col(L.cols.holeCx, labels.hole, 'tf-bore-fg'));
    if (labels.shaft) s.appendChild(col(L.cols.shaftCx, labels.shaft, 'tf-shaft-fg'));

    // Thermik-Overlay (dezent, gestrichelt, vor den Balken): Wellen-„Geist" bei T,
    // Spiel-/Übermaßzone bei T und ein sprachneutraler Temperatur-Tag „T °C".
    if (L.ghost) {
      var g = L.ghost;
      if (L.bandT) {
        var ty = Math.min(L.bandT.yTop, L.bandT.yBot), th = Math.abs(L.bandT.yBot - L.bandT.yTop);
        s.appendChild(elNS('rect', {
          x: DIM.padL, y: num(ty), width: DIM.W - DIM.padL - DIM.padR, height: num(th),
          class: 'tf-band-t tf-band-t-' + L.bandT.kind
        }));
      }
      s.appendChild(elNS('rect', { x: num(g.x), y: num(g.y), width: num(g.w), height: num(g.h), rx: 2, class: 'tf-ghost-shaft' }));
      if (labels.tLabel) {
        var tl = elNS('text', { x: DIM.W - DIM.padR, y: num(Math.max(g.yTop - 3, DIM.padT + 7)), class: 'tf-tlabel', 'text-anchor': 'end' });
        tl.textContent = labels.tLabel; s.appendChild(tl);
      }
    }

    return s;
  }

  /* Freiform/ISO-2768: symmetrisches ±-Band um die Nulllinie. */
  function svgGeneral(res, labels) {
    labels = labels || {};
    var dev = res.dev_um;                       // ± in µm
    var hi = dev * 1.4, lo = -dev * 1.4;
    if (hi - lo < 1) { hi = 10; lo = -10; }
    var span = hi - lo;
    var plotW = DIM.W - DIM.padL - DIM.padR, plotH = DIM.H - DIM.padT - DIM.padB;
    function y(um) { return DIM.padT + (hi - um) / span * plotH; }
    var s = elNS('svg', { viewBox: '0 0 ' + DIM.W + ' ' + DIM.H, class: 'viz-svg', role: 'img', preserveAspectRatio: 'xMidYMid meet' });
    var x = DIM.padL + plotW * 0.30, w = plotW * 0.40;
    s.appendChild(elNS('rect', { x: num(x), y: num(y(dev)), width: num(w), height: num(y(-dev) - y(dev)), rx: 2, class: 'tf-bar tf-bore' }));
    s.appendChild(elNS('line', { x1: DIM.padL, y1: num(y(0)), x2: DIM.W - DIM.padR, y2: num(y(0)), class: 'tf-zero' }));
    [dev, 0, -dev].forEach(function (v) {
      var yy = num(y(v));
      s.appendChild(elNS('line', { x1: DIM.padL - 3, y1: yy, x2: DIM.padL, y2: yy, class: 'tf-tickmark' }));
      var tx = elNS('text', { x: DIM.padL - 6, y: yy + 3, class: 'tf-tick', 'text-anchor': 'end' });
      tx.textContent = (v > 0 ? '+' : '') + Math.round(v); s.appendChild(tx);
    });
    var un = elNS('text', { x: DIM.padL - 6, y: DIM.padT - 8, class: 'tf-axunit', 'text-anchor': 'end' });
    un.textContent = labels.unit || 'µm'; s.appendChild(un);
    if (labels.label) {
      var t2 = elNS('text', { x: num(x + w / 2), y: DIM.padT - 8, class: 'tf-collabel tf-bore-fg', 'text-anchor': 'middle' });
      t2.textContent = labels.label; s.appendChild(t2);
    }
    return s;
  }

  return { layout: layout, svg: svg, svgGeneral: svgGeneral, DIM: DIM };
});
