# 🔧 DT-ProfiPassung — Bauplan (plan3.md · AKTUELLER Plan)

## Interaktiver Toleranz- & Passungsassistent nach ISO 286 — mit Pressverband (DIN 7190), ISO 2768, ANSI B4.1 und (als Update) Toleranzketten — dreisprachig (DE/EN/PT), offline, Handy zuerst

> plan3.md löst plan2.md ab (Reihenfolge der Restbausteine neu geordnet; erledigte Teile
> eingedampft). plan2.md/plan.md bleiben als Sicherungskopien im Projektordner.

═══════════════════════════════════════════════════════════════════════════
🚀 KICKOFF — LIES DIES ZUERST (für frische Claude-Instanz / neuer Chat)
═══════════════════════════════════════════════════════════════════════════
Du bist Claude und arbeitest an DT-ProfiPassung weiter. Dieser Chat ist neu; die
komplette Wahrheit steht in diesem Plan und in den Projektdateien. So steigst du ein:

1) KOMMUNIKATION: **immer Deutsch**. Dieter arbeitet am **Handy**; jeder Baustein wird erst
   nach seiner **Handy-Bestätigung** als „bestätigt" markiert (harte Regel, nicht vorgreifen).

2) ARBEITSORDNER WIEDERHERSTELLEN (Container ist zwischen Sessions leer):
   `rm -rf /home/claude/dtp && mkdir -p /home/claude/dtp && cp /mnt/project/* /home/claude/dtp/`
   Dann Basislinie prüfen: `cd /home/claude/dtp && node test_passung.js`
   → muss **exakt die Basislinie unten** zeigen, 0 Fehler. Wenn ja: Stand ist intakt.
   (Dieter hält /mnt/project + GitHub nach jedem Schritt aktuell = Source of Truth.)

3) TOKEN-PAUSEN: Ein großer Umbau kann die 4-h-Tokens sprengen. Dieter stoppt bei ~90 %
   („Rechteck im Chat-Eingabefeld"). Vor der Pause den genauen Stand nennen; Wiedereinstieg
   mit Stichwort „weiter mit <Baustein>". WICHTIG: Container-Reset löscht Zwischenstände —
   nach jeder Änderung ausliefern; nach Pause zuerst prüfen, was in /mnt/project schon
   angekommen ist, und Verlorenes identisch wieder einspielen.

4) NÄCHSTE AUFGABE: **B14 Ausgaben — weiter mit UI-Verdrahtung + Copy.** Etappe 1 (report.js:
   Datenmodell buildModel, .dtp toDtp/fromDtp, Gating) ist gebaut, grün & eingebunden. Offene
   Etappen: (2) UI — Ausgabe-Leiste + echter .dtp-Download/-Upload + Copy-Text + CAD-Snippet;
   (3) Druck→PDF; (4) RTF + CSV. ALLES läuft durch guard() — Testversion sperrt jede Ausgabe
   (Dieters Vorgabe: nichts verlässt das Programm; auch der Datei-Import wird blockiert).
   Danach B15 → B13 → B16 (V1). Toleranzkette (B12) im **V1.1-Update**.

5) ARBEITSWEISE JE BAUSTEIN (Fließband, minimale Diffs):
   bauen → `node --check` alle JS → i18n-Paritätsprüfung (alle Keys in DE/EN/PT vollständig)
   → **DOM-Smoke** (Mini-DOM-Shim in Node, führt ui.js real aus; Muster: dom_smoke_b10a.js)
   → Harness `node test_passung.js` grün (Basislinie nur ERWEITERN, nie Assertions lockern)
   → Dateien nach `/mnt/user-data/outputs/` → `present_files` → knappe deutsche Zusammenfassung,
   welche Dateien zu überschreiben sind → Dieter bestätigt am Handy → erst dann nächster Schritt.
   Danach Plan-Kopf (Version/Status/Basislinie) + eine knappe Changelog-Zeile pflegen.

6) STEHENDE REGELN:
   • JEDE Berechnung liefert einen **selbstprüfenden Rechenweg** (Formel + eingesetzte Werte + ✓)
     via rechenweg.js `build*`; ui.js sammelt sie als Gruppen. Nachweis-Herzstück!
   • **Laien-ⓘ an jedem Feld** (rechtsbündiger help-btn → Sprechblase: Was ist das · Bereich ·
     empfohlene Werte). Muster: `attachFieldHelp`/`labeledField(..., helpKey)` in ui.js.
   • **Auswahl-Listen + „eigener Wert"-Haken** für alle Tabellenwerte (Vorbelegen+Sperren
     oder frei per Haken) — Muster `fillFromMaterial` der Schraube.
   • Normtabellenwerte sind maßgeblich (nicht Formeln); **≥2 Quellen**; ehrliche Lücken statt
     Falschwerten (sichtbarer „Schätzwert/Faustregel"-Vermerk). Meldungen als stabile Codes.
   • Offline hart (kein CDN/fetch/ES-Import), klassische Skripte, UMD/IIFE, DOM-freie Kernlogik
     wo möglich (Node-testbar). i18n DE/EN/PT von Anfang an, Parität Pflicht.
   • `_s`-Dateien in /mnt/project = Vorlagen aus DT-ProfiSchraube, **nur lesen, nie ausliefern**.

7) MODULKARTE (Ist-Stand, Abschnitt 2) + Ladereihenfolge stehen in Abschnitt 2.1.
═══════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════
Plan-Version : 3.3 · Stand 2026-07-18 · Status: **B1–B11 bestätigt · B14 Ausgaben ETAPPE 1
               (report.js: Datenmodell + .dtp Save/Load + Gating) gebaut, grün & ausgeliefert —
               UI-Verdrahtung folgt.** Nächste Etappe: B14-Copy (Copy-Text + CAD-Snippet + UI).
Basislinie   : **154.752 Assertions, 0 Fehler** — prüfbar per `node test_passung.js`,
               am Handy über **DT-ProfiPassung_Pruefstand.html** (grünes Banner = weiterbauen).
Produktname  : **DT-ProfiPassung** (Arbeitstitel — vor Markteintritt Marke/Domain prüfen).
               Produktversion startet bei v0.1.0.
Modell       : Einmalkauf (Vollversion) + kostenlose Testversion — **Testversion hat vollen
               Funktionsumfang, aber ALLE Kopier-/Export-/Speicherfunktionen gesperrt**.
               Vertrieb Digistore24.
Sprachen     : DE · EN · PT — vollständig (Bedienung, Feldtexte, Laien-Hilfe, Meldungen,
               Rechenweg inkl. aller Formel-/Werte-Beschriftungen). Symbole sprachneutral.
Referenz     : Schwesterprojekt **DT-ProfiSchraube** — Arbeitsweise, Architektur, Design und
               Code-Muster 1:1 übernommen. `_s`-Vorlagen im Projektordner.
Deployment   : GitHub Pages — https://dietertepe.github.io/dt-profipassung-web/
               (Repo `dt-profipassung-web`, alle Dateien inkl. Produkt-HTML, offline-fähig).
Zielgruppe   : Konstrukteure, Fertigung/QS, Ausbildung — Laie bis Profi. Preisidee 80–120 €.
═══════════════════════════════════════════════════════════════════════════

---

## 1. Reihenfolge-Entscheidung (Kern von plan3)

**V1 — verkaufbare erste Version, in dieser Reihenfolge:**
1. **B11 Passungs-Assistent** ✓ KOMPLETT (Handy-Bestätigung ausstehend) — Frage-Dialog → bis
   zu 3 begründete Passungsvorschläge, Übernahme per Tipp. Größter Mehrwert (Laienführung =
   Alleinstellungsmerkmal), nutzt die vorhandene Empfehlungsmatrix.
2. **B14 Ausgaben** — Copy-Text, CAD-Notiz-Snippet, `.dtp` speichern/laden, Druck→PDF, RTF,
   CSV. Schließt die größte spürbare Lücke (Nutzer kann Ergebnisse mitnehmen). Port `report.js`.
3. **B15 Edition/Registrierung/Impressum** — Test/Voll-Trennung + Sperren der Ausgaben in der
   Testversion (gehört unmittelbar zu B14), Registrierung als Personalisierung, Impressum-ⓘ.
4. **B13 ANSI B4.1** — zöllige Passungsklassen (RC/LC/LT/LN/FN), gleiche Pipeline wie ISO.
   Wichtig für Export-/US-Markt, sauber abgrenzbar.
5. **B16 Feinschliff** — Passungs-Explorer/Wissens-Basis komplett, restliche Presets (≥15),
   Code-Audit, Build- und Obfuskierungs-Vorbereitung (Test- + Voll-Build).

**V1.1 — geplantes Update nach Launch:**
- **B12 Toleranzkette** (WC/RSS/Monte-Carlo, Histogramm, Ausschuss in ppm/%, eigenes
  `kette.js`, eigener Formularbereich mit Maßliste, Brücke „aktuelle Passung als Kettenglied
  übernehmen"). Bewusst als eigenständiges großes Feature-Update ausgegliedert — entlastet V1
  und liefert ein starkes Argument für Bestandskunden. Fachbasis steht bereits in Abschnitt 4.

Begründung der Reihenfolge: Nach **B11+B14+B15** ist das Produkt technisch auslieferbar
(rechnet alles Wesentliche, führt Laien, kann exportieren, hat Test/Voll-Trennung). B13 und
B16 runden V1 ab. Die Toleranzkette ist das aufwändigste, in sich geschlossene Restmodul und
eignet sich perfekt als Post-Launch-Update.

---

## 2. Ist-Stand: Architektur & Module

### 2.1 Modul-Landkarte (real vorhanden) + Ladereihenfolge
```
DT-ProfiPassung/
├── DT-ProfiPassung.html         → Produkt-HTML (Vollversion)
├── DT-ProfiPassung_Test.html    → Testedition (Unterschied: nur window.DT_EDITION)
├── DT-ProfiPassung_Pruefstand.html → Handy-Testkonsole (lädt Module + test_passung.js)
├── style.css                    → Design-Tokens/Look (von der Schraube portiert)
├── daten.js       (DTPData)     → ISO-286-Zahlenkern (IT + Grundabmaße, ganzzahlige µm)
├── validate.js    (DTPValidate) → Feldschema (dreisprachig) + zweistufige Prüfung
├── solver.js      (DTPSolver)   → computeFit/parseFit/formatFit, PRESETS (Orchestrator)
├── rechenweg.js   (DTPRechenweg)→ selbstprüfender Rechenweg: build · buildFreiform ·
│                                   buildThermik · buildOberflaeche · buildPressverband
├── freiform.js    (DTPFreiform) → ISO 2768 (Allgemeintoleranzen) + Presets
├── thermik.js     (DTPThermik)  → Werkstoffe MAT (E/ν/α/Re/Rm) + Thermik-Rechnung + Presets
├── schaubild.js   (DTPSchaubild)→ Toleranzfeld-SVG (svg + svgGeneral), Thermik-Ghosts
├── beratung.js    (DTPBeratung) → Kostenampel · Messmittel · Oberfläche · Schmierspalt
├── pressverband.js(DTPPress)    → DIN 7190: p, Grenzen, S-Werte, Fügen, µ-Tabelle, PRESETS
├── ui.js                        → Formular, Modi (Passung/Freiform), Zusatzbereiche
│                                   (Thermik/Oberfläche/Pressverband), i18n, Theme, Rechenweg,
│                                   Grafik, Lade-Menü/Presets, Laien-ⓘ
├── test_passung.js (DEV-ONLY)   → Node-Harness (21 Abschnitte, ok()-Zähler) — nie ausgeliefert
└── dom_smoke_b10a.js (DEV-ONLY) → Mini-DOM-Shim, führt ui.js real aus (ⓘ/Presets/Panels)
```
**Ladereihenfolge (in allen HTMLs):**
`daten → validate → solver → rechenweg → freiform → thermik → schaubild → beratung →
pressverband → ui`. Im Prüfstand zusätzlich `test_passung.js` zuletzt.

**Noch zu portieren (für V1):**
`report.js` (liegt als Schrauben-Vorlage im Ordner, noch NICHT eingebunden) → B14.
`kette.js` (existiert noch nicht) → B12/V1.1-Update.
`_s`-Vorlagen (daten_s, validate_s, solver_s, rechenweg_s, report_s, schaubild_s, ui_s,
style_s) = read-only Referenzen aus der Schraube.

### 2.2 Muster-Ports aus der Schraube (verbindlich)
`fillFromMaterial`-Analogon (Vorbelegen+Sperren+Haken) · Formel-Beschriftungen dreisprachig ·
`enumValues` direkt aus den Datentabellen (kein Drift) · Presets tragen Engine-Rohdaten plus
optionale UI-Vorbelege · Meldungs-/Hinweis-Codes · `guard()`-Wrapper für gesperrte Aktionen ·
Modal/Overlay + Escape/Backdrop · `on()`-nullsichere Event-Bindung · Focus-Trap · Print-CSS mit
erzwungenen Ampelfarben · Editions-Balken-/Lizenzzeilen-Mechanik · Aktivierungsdialog +
10-s-Long-Press-Reset · Impressum-ⓘ (Dieter Tepe, Mühlenstraße 2, 48477 Dreierwalde,
Dieter.Tepe@live.de, Link www.dt-profidreieck.de bis eine eigene Seite existiert).

### 2.3 Technische Leitplanken
- Ein Ordner, keine Unterordner, relative Pfade. Startdatei trägt den Programmnamen, nie
  `index`. Voll- und Test-HTML unterscheiden sich NUR in `window.DT_EDITION`.
- Offline hart: CSS via `<link>`, JS via klassische `<script src>` in Abhängigkeitsreihenfolge,
  Daten als JS-Globals (UMD). Kein fetch/JSON-Laden, kein ES-import (bricht über `file://`).
- `<html lang="de" translate="no">` + notranslate-Meta Pflicht.
- Modular entwickeln → später eine Datei bündeln (Build inlinet Module; dann Obfuskierung;
  Test + Voll als zwei Builds). Gating-Logik gehört gebündelt in report.js; Module bleiben
  gating-frei (nur `'test'` schränkt ein, alles andere = Voll).
- Abmaße intern als ganzzahlige µm (ANSI: 0,0001 in), Nennmaße in mm; jede Anzeige mit Einheit.

### 2.4 Datenstrategie ISO 286
`daten.js` enthält die fertigen tabellierten Zahlenwerte (ganzzahlige µm, 1–500 mm), einmalig
aus Normformeln + Rundungsregeln erzeugt und im Harness gegen ≥2 publizierte Tabellenanker
verifiziert. Engine liest NUR die Tabelle → null Formeldrift. Formelsatz bleibt im Harness als
Quervergleich und live nur für 500–3150 mm (Hinweis-Code `ASSUME_FORMULA_RANGE`).

---

## 3. Erledigte Bausteine B1–B10 (bestätigt — Kurzfassung)

Alle am Handy bestätigt; Details im Git-Verlauf und im Changelog von plan2.md.

- **B1 ISO-286-Zahlenkern** (daten.js: IT + Grundabmaße Welle/Bohrung inkl. Sonderregel-Δ,
  ganzzahlige µm, 1–500 mm; Anker gegen publizierte Tabellen). ✓
- **B2 Engine-Kern** (solver.js computeFit/Kennwerte/Passungsart + validate.js). ✓
- **B3 UI-Basis** (HTML×2, style.css-Port, Formular „Passung", Ergebnis-Kacheln, i18n-Gerüst,
  Theme/Sprache; erster Handy-Test). ✓ (v1.4.1)
- **B4 Parser + Sprechblasen** (Hybrid-Eingabe „Ø50 H7/g6", Roundtrip-Property). ✓ (v1.5.1)
- **B5 Toleranzfeld-Grafik** (schaubild.js: SVG + Legende/Chips, Zahlen nur in HTML-Legende). ✓ (v1.6.1)
- **B6 Rechenweg** (rechenweg.js: selbstprüfend, ISO-Kette, alle Presets ×3 Sprachen). ✓ (v1.7.2)
- **B7 Freiform + ISO 2768** (freiform.js: f/m/c/v, Werkzeugbau-Freiform ES/EI/es/ei in µm). ✓ (v1.8.1)
- **B8 Thermik-Check** (thermik.js: MAT + Passung bei Betriebstemperatur, Umschlag-Warnung;
  Thermik-Ghosts im Schaubild, Variante C). ✓ (v1.9–1.9.2)
- **B9 Beratungs-Module** (beratung.js: F7 Kostenampel · F8 Messmittel/10-%-Regel · F6
  Oberfläche/Rz · F9 Schmierspalt/Stribeck; Panels + Rechenweg buildOberflaeche). ✓ (v1.9.3–1.9.5)
- **B10 Pressverband DIN 7190** (pressverband.js DOM-frei: Glättung, Fugendruck p_min/p_max,
  elastische Grenzen inkl. GJL-Sonderfall/NH, F_ax/M_t, Rutsch-/Fließsicherheit, Einpresskraft,
  thermisches Fügen ΔT; µ-Richtwerttabelle; Formulargruppe mit Auswahlmenüs + „eigener Wert"-
  Haken + Laien-ⓘ; Ergebnis-Panel; selbstprüfender Rechenweg buildPressverband 15–24 Schritte;
  3 Lade-Presets). Verifiziert zweipfadig (Modul vs. unabhängiger Lamé-Pfad, 432-Kombi-Netz). ✓ (v1.9.6–1.9.9)
  Laien-ⓘ (B10a) wurde dabei auf ALLE bestehenden Felder gezogen; V1-weites ⓘ-Muster steht.

**Offener ehrlicher Punkt aus B10b:** externer Literatur-Anker (publiziertes DIN-7190-Beispiel,
±2 %) noch nicht formal hinterlegt — der Kern ist zweipfadig gegengerechnet. Bei Gelegenheit in
B16 nachtragen (Hand-Anker: Ø60, D_Aa 120, Vollwelle, U_w 60 µm, Stahl/Stahl → p ≈ 78,75 N/mm²).

---

## 4. Restbausteine — Spezifikation

### B11 — Passungs-Assistent (NÄCHSTE AUFGABE, F10)
Frage-Dialog → bis zu 3 begründete Vorschläge, Übernahme per Tipp (setzt Felder, rechnet).
Dialogfragen: Funktion (drehbar/fest) · Demontierbarkeit · Momentübertrag über den Sitz? ·
Führungsgenauigkeit · Temperaturbereich · Werkstoffe. Empfehlungsmatrix (H-Basis, h-Basis
als Alternative anzeigbar):
| Anwendung | Vorschläge | Kernbegründung |
|---|---|---|
| Gleitlager, Schmierfilm, Welle dreht | H8/e8 · H7/f7 | sicherer Ölspalt |
| Präzise drehbare Führung | H7/g6 (· H6/g5) | minimales Spiel, leichtgängig |
| Schiebesitz, von Hand fügbar | H7/h6 | Spiel gegen null, verschiebbar |
| Zentrierung, oft demontiert | H7/js6 · H7/j6 | wackelfrei, leicht lösbar |
| Passfeder-Nabe, gut zentriert | H7/k6 · H7/m6 | leichter Übergang |
| Fester Sitz, selten demontiert | H7/n6 · H7/p6 | Presse nötig, noch lösbar |
| Reibschluss-Moment, quasi unlösbar | H7/s6 · H7/r6 | Pressverband → B10-Modul rechnen! |
| Hoher Schrumpfsitz, große Momente | H8/u8 (· x8/z8) | thermisch fügen |
| Dünnwandige/Leichtmetall-Nabe | erst p_zul prüfen | Gefahr Plastifizieren → B10 |
| Freimaß/Werkzeugbau | Freiform · ISO 2768 | keine Passfunktion |
Umsetzung: Empfehlungslogik als DOM-freie, Node-testbare Funktion (jede Matrixzeile → korrekte
Vorschläge, im Harness geprüft). Dialog als Overlay (Muster der Schraube), dreisprachig, jedes
Frage-Feld mit ⓘ. „Vorschlag übernehmen" → bestehende recalc-Pipeline. Kein neuer Rechenweg
nötig (verweist auf die reguläre Passungsrechnung). DoD: Matrix-Tests grün, Dialog am Handy.

### B14 — Ausgaben (F14)
Port `report.js` (Schrauben-Vorlage im Ordner) → `DTPReport` für DT-ProfiPassung:
Copy-Text · CAD-Notiz-Snippet · `.dtp`-JSON speichern/laden (Round-Trip, Fehlercodes bei
defekter Datei) · Druck→PDF · RTF (Word) · CSV (Trenner/Dezimal sprachgekoppelt, BOM).
Kopf jedes Exports: Bezeichnung · Datum · Norm-Datenstand · Lizenznehmer · Version. Kein jsPDF
(Druck→PDF deckt es ab). DoD: RTF-Rahmen/Escaping über alle Presets ×3 Sprachen, `.dtp`-
Round-Trip bit-identisch, CSV-Logik; report.js in alle HTMLs eingebunden + Harness-Abschnitt.

### B15 — Edition/Registrierung/Impressum (F17)
`DT_EDITION` build-fest; Voll degradiert nie. Testversion: volle Rechnung/Anzeige, gesperrt sind
Copy-Text, CAD-Snippet, `.dtp`-Speichern/Laden, Druck, RTF, CSV (gemeinsames Info-Overlay);
gelber „Testversion"-Balken. Registrierung = reine Personalisierung (Name + Lizenzschlüssel in
localStorage, keine Prüfung, keine Sperre, 10-s-Long-Press-Reset auf der Marke links oben,
Lizenznehmer in Export-Köpfen). Vollversion zeigt dezente Kennzeichnung „Vollversion" bzw.
„Vollversion – <Name>" (Stil wie DT-ProfiSchraube, Referenzbild `1000020291.png` im Ordner);
bis B15 zeigt die Vollversion oben bewusst keinen Balken. Impressum-ⓘ (Daten s. 2.2).
DoD: Gating-Sektion im Harness (streng auf `'test'`), beide Builds fehlerfrei.

### B13 — ANSI B4.1 (F13)
Zöllige Passungsklassen RC1–RC9 · LC · LT · LN · FN1–FN5 als Datentabellen in daten.js (intern
ganzzahlig 0,0001 in), in/mm-Anzeige umschaltbar, gleiche Rechen-/Anzeige-/Rechenweg-Pipeline
wie ISO. DoD: je ein Tabellen-Anker pro Klasse, in/mm-Anzeige, Rechenweg dreisprachig.

### B16 — Feinschliff
Passungs-Explorer/Wissens-Basis komplett (Was & Warum · Passungs-Typologie · Taylor/Hülle ·
Verfahren↔IT · Montage-Tipps) · restliche Presets auf ≥15 (Liste F18) · DIN-7190-Literatur-Anker
nachtragen (offener Punkt aus B10b) · Code-Audit · Build-/Obfuskierungs-Vorbereitung.

### B12 — Toleranzkette (V1.1-UPDATE, nach Launch, F11)
Neues `kette.js` (DOM-frei): Schließmaß M₀ = Σ aᵢ·Cᵢ. Worst-Case T₀ = Σ|aᵢ|·Tᵢ · RSS
T₀ = √(ΣTᵢ²) · Monte-Carlo (Verteilung je Glied Normal σ=T/6 oder Rechteck, Default N=20.000,
max 200.000, deterministischer Seed mulberry32) → Histogramm-SVG, Quantile, Ausschuss in ppm/%
falls Schließmaßgrenzen angegeben. Eigener Formularbereich mit Maßliste, Brücke „aktuelle
Passung als Kettenglied übernehmen", eigener selbstprüfender Rechenweg. Invarianten: WC-Spanne
≥ RSS-Spanne · MC-Mittel ≈ analytisches Mittel · MC deterministisch bei Seed (Testanker).
DoD: WC≥RSS-Invariante, MC-Determinismus, MC≈analytisch, Histogramm am Handy.

---

## 5. Normfundament — Kurzreferenz (Nachschlagen ohne Code)

> Normtexte sind geschützt; Formeln/Werte aus seriösen frei publizierten Sekundärquellen,
> eigenständig implementiert. **Produkt-Disclaimer Pflicht.** Normstände im Tool ausweisen:
> ISO 286-1:2019 / -2:2020 · DIN EN ISO 1 (20 °C) · ISO 2768-1:1991 · DIN 7190-1:2017 ·
> VDI/VDE 2617 · ASME B4.1.

**ISO 286:** i[µm]=0,45·∛D+0,001·D (D≤500). IT5=7i · IT6=10i · IT7=16i · IT8=25i · IT9=40i ·
IT10=64i · IT11=100i … (je 5 Grade ×10). Grundabmaß Bohrung: EI=−es (Allgemeinregel);
Sonderregel ES=−ei+Δ für K/M/N (≤IT8) und P…ZC (≤IT7), Δ=ITₙ−ITₙ₋₁. Systeme: Einheitsbohrung
(H-Basis, Standard) / Einheitswelle (h-Basis). Kennwerte: G_o=N+ES/es · G_u=N+EI/ei ·
PS_max=ES−ei · PS_min=EI−es (neg.=Übermaß) · PT=T_B+T_W. Art: Spiel (PS_min≥0) / Übermaß
(PS_max≤0) / Übergang.

**ISO 2768-1** (±mm): f 0,05/0,05/0,1/0,15/0,2/0,3/0,5 · m 0,1/0,1/0,2/0,3/0,5/0,8/1,2/2 ·
c 0,2/0,3/0,5/0,8/1,2/2/3/4 · v –/0,5/1/1,5/2,5/4/6/8 (Stufen 0,5–3 … 2000–4000 mm).

**ANSI/ASME B4.1:** RC1–RC9 · LC · LT · LN · FN1–FN5 — reine Tabellennorm (0,001 in über
Nennmaßbereiche).

**Pressverband DIN 7190** (elastisch, zylindrisch; für U_min & U_max getrennt):
Glättung ΔU=0,8·(Rz_B+Rz_W) → U_w=U−ΔU · Q_A=D_F/D_Aa, Q_I=D_Ii/D_F ·
K_A=(1+Q_A²)/(1−Q_A²)+ν_A, K_I=(1+Q_I²)/(1−Q_I²)−ν_I · W=K_A/E_A+K_I/E_I · p=(U_w/D_F)/W ·
p_zul duktil (1−Q²)·Re/√3, spröde Nabe NH (1−Q²)/(1+Q²)·Rm (S≥2…3 gegen Bruch!) ·
F_ax,max=µ·p_min·π·D_F·l_F, M_t,max=F_ax·D_F/2 · S_H=µ·p_min·A_F/√(F_ax²+(2M_t/D_F)²) ·
F_e=µ·p_max·A_F · ΔT=(U_max+S_f)/(α·D_F), S_f≈1 µm/mm. (Modell: elastisch, gleich lange Fuge,
ruhende Last — Grenzen als Hinweis-Codes gemeldet.)

**Werkstoffe** (thermik.js MAT, single source of truth): Stahl (210000·0,30·11,5·Re355) ·
austenit. Stahl (200000·0,30·16·230) · GJL (110000·0,28·10·Rm250 spröde) · Alu-Knet
(70000·0,33·23·250 creep) u. a. E[N/mm²]·ν·α[1e-6/K]·Festigkeit.

**Toleranzkette** (für B12/V1.1): M₀=Σaᵢ·Cᵢ · WC T₀=Σ|aᵢ|·Tᵢ · RSS T₀=√(ΣTᵢ²) · MC (σ=T/6
oder Rechteck, Seed). Invariante WC≥RSS.

---

## 6. Teststrategie (`test_passung.js`, DEV-ONLY)

**Anker** (extern, ≥2 Quellen, Tabelle maßgeblich): Ø50 IT6=16/IT7=25/IT8=39/IT9=62 ·
50 H7=+25/0 · 50 g6=−9/−25 · 50 s6=+59/+43 · 25 H7=+21/0 · 100 js6=±11 · 50 H7/g6 Spiel 9…50 ·
50 H7/s6 Übermaß 18…59; ISO-2768-Tabelle; ANSI-B4.1 je Klasse; DIN-7190-Beispiel ±2 %.
**Property/Invarianten:** T(ITn+1)>T(ITn) · H:EI=0,ES=IT · js symmetrisch · EI=−es · Sonderregel-Δ
nur K/M/N≤IT8, P…ZC≤IT7 · Parser-Roundtrip · Thermik-Vorzeichen · Pressverband (p linear in U_w;
Q_A→1⇒p→0; Vollwelle-Grenzfall; Modul vs. Lamé-Pfad) · `.dtp`-Round-Trip · computeFit mutiert
`inp` nie · Gating streng auf `'test'` · **Rechenweg-Selbstprüfung über alle Presets ×3 Sprachen.**
**Betrieb:** `ok()`-Zähler + Sektionen (aktuell 21); Basislinie im Kopf, **erweitern nie lockern**.
Handy-Prüfung über `DT-ProfiPassung_Pruefstand.html` (grünes Banner = weiterbauen).

---

## 7. Entschieden & abgehakt (damit es nicht wiederkehrt)
- Kein jsPDF (Druck→PDF + RTF decken „PDF/Word" ab) · kein DXF/STEP in V1 (CAD-Feature = Text-
  Snippet F14) · keine Hover-/Zoom-Interaktion in der Zeichnung (Erklärungen über antippbare
  Legenden-Chips; Zahlen nur in der HTML-Legende) · Monte-Carlo Default N=20.000, Seed Pflicht.
- Testversion sperrt Copy/Snippet/.dtp/Druck/RTF/CSV; Registrierung = Personalisierung ohne
  Kopierschutz (Long-Press-Reset). ANSI B4.1 fest in V1 (B13).
- **Später (nicht V1):** Formtoleranz-Vollmodul (GD&T; V1 hat nur die 1/3-Hinweisregel),
  PNG-Export, DXF-Notizblock, weitere Normsysteme (JIS). **Toleranzkette = V1.1-Update (B12).**

## 8. Startpaket (Projektordner)
Pflicht: dieser Plan (plan3.md). Vorlagen/Referenz (read-only, `_s`): style_s.css · ui_s.js ·
report_s.js · solver_s.js · daten_s.js · validate_s.js · rechenweg_s.js · schaubild_s.js ·
DT-ProfiSchraube-HTMLs. Aktive Dateien s. Modulkarte 2.1.

═══════════════════════════════════════════════════════════════════════════
Changelog (knapp — Historie in Git; ältere Details in plan2.md)
═══════════════════════════════════════════════════════════════════════════
**v3.0 (2026-07-17):** plan3 löst plan2 ab. B1–B10 komplett & bestätigt (Pressverband DIN 7190
inkl. Rechenweg + 3 Presets, Basislinie 154.644/0). **Restbausteine neu geordnet:** V1 =
B11 Assistent → B14 Ausgaben → B15 Edition → B13 ANSI B4.1 → B16 Feinschliff; **Toleranzkette
(B12) ins V1.1-Update verschoben** (eigenständiges großes Feature nach Launch). Erledigte
Bausteine auf Kurzzeilen eingedampft (Abschnitt 3), Modulkarte auf realen Ist-Stand gebracht
(pressverband.js ergänzt, korrekte Ladereihenfolge, report.js als „noch zu portieren"
markiert). **Nächste Aufgabe: B11 Passungs-Assistent.**
**v3.1 (2026-07-17) · B11 Passungs-Assistent — KERN (gebaut & ausgeliefert; UI + Handy-
Bestätigung offen):** Neues DOM-freies Modul **assistent.js** (`DTPAssistent`, UMD, Node-
testbar, sprachneutrale Codes). Mit Dieter abgestimmter Dialog: **4 Fragen, Freimaß bewusst
raus** (selbsterklärend). Q1 purpose (SLIDE/HANDFIT/FIXED) · Q2 demount (OFTEN/SELDOM/NEVER) ·
Q3 precision (NORMAL/HIGH/LOW) · Q4 KONTEXTABHÄNGIG: bei FIXED → hubMat (STEEL/CAST/LIGHT),
sonst → temp (NORMAL/HOT). API: firstQuestion · optionsFor · nextQuestion(answers) (steuert
die kontextabhängige 4. Frage) · isValidAnswer · recommend(answers) → bis zu 3 Vorschläge
{fit, reasonCode 'AS_R_*', hBasisAlt?, hintCode?}. Hinweis-Codes verknüpfen mit bestehenden
Modulen: AS_HINT_PRESS/SHRINK (→ Pressverband B10), AS_HINT_LIGHT_HUB/CAST_HUB (p_zul/Spröd-
bruch), AS_HINT_TEMP (→ Thermik). Jeder vorgeschlagene fit ist vom echten Solver parsebar.
Einbindung in alle drei HTMLs (nach pressverband.js, vor ui.js). **test_passung.js Abschnitt 21**:
Dialogfluss (Reihenfolge + kontextabhängige 4. Frage), alle **63 Antwort-Kombinationen**
wohlgeformt, jeder fit parsebar, fachliche Stichproben gegen die Matrix, h-Basis-Alternative,
Reinheit (recommend mutiert nicht) → **Basislinie 154.644 → 154.676 (+32)**. NUR neues Modul +
Harness + HTML-Einbindung; kein bestehendes Modul geändert. **OFFEN (nächste Session, frische
Tokens): B11-UI in ui.js** — Button-Overlay-Dialog, i18n-Texte (Fragen/Antworten/Begründungen
AS_R_*/AS_HINT_* ×3 Sprachen), Vorschlagskarten mit „Übernehmen" → setzt Nennmaß+Passung und
ruft recalc. Muster: bestehende Overlays + labeledField/attachFieldHelp. **Wiedereinstieg mit
„weiter mit B11-UI".**

**v3.2 (2026-07-18) · B11 Passungs-Assistent KOMPLETT (Overlay-Dialog; Handy-Bestätigung
ausstehend):** UI-Teil in **ui.js** auf dem DOM-freien Kern (assistent.js) aufgesetzt.
**Assistent-Button** („✦ Passung finden", Messing-Pill mit Funkel-Animation) rechts in der
Formularkopfzeile (neue .form-top-Leiste). **Overlay-Dialog** (nutzt das .modal-Muster, sanft
ein-/ausgeblendet): kleines **Nennmaß-Feld** (Dieters Wunsch, Pflicht vor Weiter, mit Shake-
Warnung), 4 Fragen als große Antwort-Kacheln mit Sub-Text, **automatisches Weitergleiten** beim
Tippen (rein-von-rechts/raus-nach-links-Animation), Fortschrittsbalken + „Frage n von 4",
„Zurück" (nimmt Antwort zurück; bei purpose-Reset auch die kontextabhängige 4. Antwort).
Ergebnis: bis zu **3 Vorschlagskarten** (Passung groß in Akzentfarbe, ★ auf dem Top-Treffer,
Laien-Begründung, optional h-Basis-Alternative + Hinweis, „Übernehmen"-Button). „Übernehmen"
setzt Nennmaß+Passung, wechselt in den Passungsmodus, ruft recalc und scrollt zum Ergebnis.
**67 i18n-Keys ×3 Sprachen** (Button, Fragen asQ_*, Antworten asA_*+_sub, Begründungen AS_R_*,
Hinweise AS_HINT_*) — Parität 0 Fehler. **style.css**: vollständiges .assist-*-Set mit
Animationen, respektiert prefers-reduced-motion, Print blendet aus. **dom_smoke_b10a.js**:
Shim um querySelector/querySelectorAll/removeChild/offsetWidth/scrollIntoView erweitert;
Assistent-Flow-Test (Button→Overlay→FIXED/NEVER/STEEL-Pfad→H7/s6-Vorschlag+Pressverband-
Hinweis→Übernehmen setzt Nennmaß 60+rechnet→Sprachwechsel) → **47 OK, 0 Fehler**. Harness-
Basislinie unverändert **154.676** (reiner UI-Schritt). Geändert: ui.js, style.css,
dom_smoke_b10a.js, plan3.md. **Nächster Schritt: Handy-Bestätigung B11 → dann B14 Ausgaben.**

**v3.3 (2026-07-18) · B14 Ausgaben — ETAPPE 1: Datenmodell + .dtp + Gating (gebaut &
ausgeliefert; UI folgt):** Alte Schrauben-report.js im Ordner durch die Passungs-Version
ersetzt. Neues **report.js** (`DTPReport`, UMD, DOM-frei): **buildModel(ctx)** = sprachneutrales
Datenmodell (Titel, Headline, Ergebnis-/Eingabezeilen, Zusatzbereiche, Rechenweg-Schritte,
Disclaimer mit ISO 286/2768/DIN 7190) als Grundlage aller Text-Exporte. **.dtp Save/Load**:
toDtp → JSON mit Kennung „DT-ProfiPassung" + Schema 1, enthält NUR Eingaben (state); fromDtp
liest robust zurück mit eigenen Fehlercodes (RP_ERR_EMPTY/JSON/FORMAT/SCHEMA) — Ergebnisse
werden beim Laden neu gerechnet (kein Drift). dtpFilename säubert Bezeichnung. **Gating**
(Dieters Vorgabe): GATED_FEATURES = save/load/print/copy/cad/rtf/csv; isFeatureAllowed → in der
**Testversion ist JEDE Ausgabe gesperrt**, Vollversion/unbekannte Edition = alles erlaubt
(sichere Voreinstellung). Lizenznehmer-/Editionszeilen + Wasserzeichentext ×3 wie Schraube.
Einbindung in alle drei HTMLs (nach assistent.js). **test_passung.js Abschnitt 22** (Gating
je Feature × Edition, .dtp Round-Trip bit-identisch + Idempotenz, 9 Fehlerpfade, Dateiname,
Lizenznehmer, buildModel ×3 Sprachen, Formatierung) → **Basislinie 154.676 → 154.752 (+76)**.
NUR neues Modul + Harness + HTML-Einbindung. **Nächste Etappe: B14-UI (Ausgabe-Leiste, echter
.dtp-Download/-Upload durch guard(), Copy-Text, CAD-Snippet). Wiedereinstieg „weiter mit B14-UI".**

═══════════════════════════════════════════════════════════════════════════
Ende plan3.md · DT-ProfiPassung
═══════════════════════════════════════════════════════════════════════════
