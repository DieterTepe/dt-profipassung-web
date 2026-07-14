# 🔧 DT-ProfiPassung — Bauplan (plan.md)

## Interaktiver Toleranz- & Passungsassistent nach ISO 286 — mit Pressverband (DIN 7190), Toleranzketten (WC/RSS/Monte-Carlo), ISO 2768 und ANSI B4.1 — dreisprachig (DE/EN/PT), offline, Handy zuerst

═══════════════════════════════════════════════════════════════════════════
Plan-Version : 1.7.1 · Stand 2026-07-13 · Status: **B6 (Rechenweg) gebaut & grün — Handy-Test-Fixes eingearbeitet, Re-Test offen** · B5 bestätigt
Basislinie   : **131.765 Assertions, 0 Fehler** — prüfbar per `node test_passung.js`
               ODER am Handy über **DT-ProfiPassung_Pruefstand.html** (GitHub Pages).
Produktname  : **DT-ProfiPassung** (Arbeitstitel — vor Markteintritt Marke/Domain prüfen,
               analog Naming-Caveat der Schraube). Produktversion startet bei v0.1.0.
Modell       : Einmalkauf (Vollversion) + kostenlose Testversion — **Testversion hat den
               VOLLEN Funktionsumfang, aber ALLE Kopier-/Export-/Speicherfunktionen sind
               gesperrt** (Vorgabe des Anwenders). Vertrieb Digistore24.
Sprachen     : DE · EN · PT — vollständig (Bedienung, Feldtexte, Laien-Hilfe, Meldungen,
               Rechenweg inkl. aller Formel-/Werte-Beschriftungen). Symbole sprachneutral.
Referenz     : Schwesterprojekt **DT-ProfiSchraube** — Arbeitsweise, Architektur, Design
               und Code-Muster werden 1:1 übernommen (Startpaket siehe Abschnitt 7).
Deployment   : GitHub Pages — https://dietertepe.github.io/dt-profipassung-web/
               (Repo `dt-profipassung-web`; dort liegen alle Dateien inkl. der
               Produkt-HTML. Alles bleibt offline-fähig wie gehabt.)
Zielgruppe   : Konstrukteure, Fertigung/QS, Ausbildung — Laie bis Profi. Preisidee 80–120 €.
Marktlücke   : vorhandene Passungsrechner sind alt, unvollständig oder Teil teurer
               CAD/PLM-Systeme; kaum eines rechnet Pressverband-Mechanik, Thermik,
               Toleranzketten und Fertigungs-/Messberatung offline in einem Werkzeug.
═══════════════════════════════════════════════════════════════════════════

---

## 0. Zuerst lesen — Wiederanknüpfen & Arbeitsweise (bewährt aus DT-ProfiSchraube)

### 0.1 Was gebaut wird
Der Nutzer gibt z. B. **„50 H7/g6"** ein und erhält sofort: farbige Toleranzfeld-Grafik
(Bohrung/Welle an der Nulllinie), Grenzmaße, Höchst-/Mindestspiel bzw. -übermaß,
Passungsart in Klartext, Fertigungs- und Montagehinweise — plus auf Wunsch die komplette
**Pressverband-Mechanik nach DIN 7190** (Fugendruck, übertragbares Moment/Axialkraft,
Fügekraft, thermisches Fügen), **Thermik-Check** (Passung bei Betriebstemperatur),
**Oberflächen-/Mess-/Kostenberatung**, **Passungs-Assistent** (Anwendung → Vorschlag mit
Begründung) und **Toleranzketten** (Worst-Case/RSS/Monte-Carlo mit Histogramm). Alles mit
selbstprüfendem, dreisprachigem Rechenweg — „ähnlich komplex wie die Schraubenberechnung".

### 0.2 ► ALLERERSTE AUFGABE IM ERSTEN CHAT
1. Diesen Plan vollständig lesen. Arbeitsordner `/home/claude/dtp/` anlegen; Projektdateien
   (Startpaket, Abschnitt 7) dorthin kopieren.
2. **Baustein B1 bauen** (Abschnitt 5): `daten.js` mit dem ISO-286-Zahlenkern +
   `test_passung.js` mit Anker-Sektion. **Es gibt noch keine Grün-Basislinie — B1 erzeugt
   sie.** Ab dann gilt die Grün-Pflicht vor jeder Änderung (0.3).
3. Kein UI in B1 — reiner Node-Baustein. Bausteine ohne UI bestätigt Dieter anhand der
   Testausgabe; UI-Bausteine testet er am Handy.
Plan/Umfang je Session vorher kurz in Worten abstimmen (0.4) — die **Reihenfolge** der
Bausteine steht fest, der Zuschnitt pro Session ist flexibel (Token-Haushalt!).

### 0.3 Recovery-Protokoll (nach Absturz/Neustart)
1. **Projekt-Ordner ist die Wahrheit** (Dieter pflegt die aktuellen Dateien dort; GitHub
   gespiegelt). Dateien nach `/home/claude/dtp/` kopieren, dort arbeiten. Container wird
   zwischen Sessions zurückgesetzt → **nach jeder Änderung ausliefern** (outputs).
2. **Grün-Basislinie:** `node test_passung.js` → aktuelle Assertion-Zahl aus diesem Plan
   (wird nach jedem Baustein hier fortgeschrieben), **0 Fehler**. Erst dann weiterbauen.
   Dieter prüft **am Handy ohne Node** über **DT-ProfiPassung_Pruefstand.html** (auf GitHub
   Pages) — grünes Banner = weiterbauen erlaubt, rotes Banner = stopp + Befund melden.
   Diese Prüfung ist Pflicht vor jedem Weiterbau.
3. **Dateikonvention `_s`:** Dateien mit Suffix `_s` (z. B. `style_s.css`, `solver_s.js`,
   `daten_s.js`, `validate_s.js`) sind die **Vorlagen aus DT-ProfiSchraube** — nur zum
   Nachschlagen/Portieren, NIE als Passungs-Datei überschreiben. Ohne `_s` = aktive
   DT-ProfiPassung-Datei. (Dieter kennzeichnet Schrauben-Uploads so.)
4. Plan + 0.2 lesen, nächstes Ziel bestätigen, dann coden.

### 0.4 Standard-Arbeitsablauf je Aufgabe
Plan in Worten (Deutsch) kurz abstimmen → Datei für Datei (minimale Diffs) →
`node test_passung.js` **grün** → geänderte Dateien nach `/mnt/user-data/outputs/` →
`present_files` → **knappe deutsche Zusammenfassung**, welche Dateien zu überschreiben
sind. Dieter prüft (Handy bzw. Testausgabe) und bestätigt vor dem nächsten Schritt.
**Nach jedem bestätigten Baustein:** Plan-Kopf (Status/Basislinie) + eine knappe
Changelog-Zeile aktualisieren. Plan schlank halten — Historie gehört in Git.

### 0.5 Arbeitsprinzipien (nicht verhandelbar — aus der Schraube übernommen + passungsspezifisch)
- **Korrektheit vor Umfang.** Jede Formel/jeder Tabellenwert wird **vor** der Integration
  im Node-Harness verifiziert. Tests werden **erweitert, nie gelockert**.
- **Tabellenwerte sind maßgeblich.** ISO 286 ist eine Tabellennorm mit Rundungsregeln —
  bei Abweichung Formel↔publizierte Tabelle gilt die Tabelle (Datenstrategie 2.5).
- **Einheiten-Ehrlichkeit.** Abmaße intern als **ganzzahlige µm** (ANSI: ganzzahlige
  0,0001 in), Nennmaße in mm. Jede Anzeige trägt die Einheit explizit; mm↔µm-Verwechslung
  ist in der Fertigung fatal.
- **Post-hoc-Rechenweg, strikt getrennt:** `rechenweg.js` rechnet jeden nachrechenbaren
  Wert unabhängig neu und prüft gegen die Engine (✓ „gegen Engine geprüft"). Kein
  Formel-Duplikat über Module (single source of truth).
- **Richtwerte ehrlich kennzeichnen.** Faustregeln (Kostenampel, Messmittel, Schmierspalt,
  Kriechen, µ-Werte …) sind **Hinweis-Module**, sichtbar als „Richtwert/Faustregel" mit
  Quelle markiert — nie als Normergebnis ausgegeben (wie „Schätzwert Magnesium" bei der Schraube).
- **Erst besprechen, dann coden.** Immer dreisprachig. Ausgiebige Laien-ⓘ an jedem Feld.
  Immer vollständige Rechenwege in der Ausgabe.
- **Auswahl-Listen + „eigener Wert"-Haken** für alle Tabellenwerte (Muster
  `fillFromMaterial` der Schraube): vorbelegt+gesperrt (readOnly, mit Herkunftshinweis)
  oder per Haken frei.
- **Privacy-first/DSGVO hart:** kein CDN, keine Fonts, keine Fremd-Skripte, kein fetch.
- **Meldungen/Hinweise als stabile Codes** (UI übersetzt; DE-Text als Fallback).
- **Obfuskierung zuletzt** (nach dem Bündeln). Zusammenarbeit auf Deutsch; Dieter arbeitet
  ausschließlich am Handy.

### 0.6 Technische Leitplanken (Projektstruktur)
- **Ein Ordner, keine Unterordner**, relative Pfade. Startdatei trägt den Programmnamen,
  **nie `index`**: `DT-ProfiPassung-x-x-x.html` (Dev, `DT_EDITION='full'`) und
  `DT-ProfiPassung_Test.html` (`DT_EDITION='test'`) — **Unterschied ist NUR diese eine Zeile.**
- **Offline hart:** CSS via `<link>`, JS via klassische `<script src>` in
  Abhängigkeitsreihenfolge, Daten als **JS-Globals (UMD)**. Kein fetch/JSON-Laden,
  kein ES-import (bricht über `file://`).
- **`<html lang="de" translate="no">` + notranslate-Meta** Pflicht.
- **Modular entwickeln → eine Datei ausliefern** (Build inlinet alle Module; dann Obfuskierung;
  Test und Voll als zwei Builds). Module bleiben **gating-frei** — nur `'test'` schränkt ein,
  alles andere = Voll (sichere Voreinstellung), reine Gating-Logik in `report.js`.
- **UMD-Guard-Muster:** reine Funktionen VOR `if (typeof window === 'undefined') return;`
  → in Node testbar, kein Test-Duplikat.

### 0.7 Scope V1 & bereits Entschiedenes (damit es nicht wiederkehrt)
**In V1 (alles aus den Ideen-Notizen, verbindlich):** F1–F18 aus Abschnitt 4.
**Entschieden:**
- **Kein jsPDF** — Druck→PDF + RTF decken „PDF/Word" ab (bewährter Schrauben-Beschluss).
- **Kein DXF/STEP-Export in V1** — eine Passung hat kein sinnvolles Geometrie-Artefakt;
  das „CAD-Feature" ist der **Text-Snippet für Zeichnungsnotizen** (F14). Später prüfbar.
- **Keine Hover-/Zoom-Interaktion IN der Zeichnung** (Messinstrument, kein Spielzeug):
  Erklärungen laufen über **antippbare Legenden-Chips unter dem SVG** und den
  Passungs-Explorer. Merksatz der Schraube gilt: **Zahlenwerte in die HTML-Legende,
  nie in die Zeichnung.**
- **Toleranzkette = eigener Bereich in derselben App** (eigene Formulargruppe mit
  Maßliste), mit Brücke „aktuelle Passung als Kettenglied übernehmen" — so ist sie
  „innerhalb der Passungsberechnung" UND sauber strukturiert.
- **ANSI B4.1 ist fest in V1** (eigener Baustein B13, vorziehbar).
- **Testversion:** volle Rechnung/Anzeige, gesperrt sind Copy-Text, CAD-Snippet,
  `.dtp`-Speichern/Laden, Druck, RTF, CSV (gemeinsames Info-Overlay wie bei der Schraube);
  gelber „Testversion"-Balken. Kein PNG-Export in V1 (Druck deckt die Grafik ab; später
  optional mit Wasserzeichen nachrüstbar).
- **Registrierung = Personalisierung, KEIN Kopierschutz** (wie Schraube v4.9.4): Dialog
  Name + Lizenzschlüssel nur in der Vollversion, keine Schlüsselprüfung, keine Sperre,
  Long-Press-Reset, Lizenznehmer in Berichts-Köpfen.
- **Monte-Carlo:** Default N = 20.000 (Handy-tauglich), max 200.000; Verteilung je Glied
  wählbar Normal (σ = T/6) / Rechteck; **deterministischer Seed (mulberry32)** — Pflicht
  für reproduzierbare Tests.
- **Später (nicht V1):** Formtoleranz-Vollmodul (GD&T-Rechner; V1 hat nur die
  1/3-Hinweisregel), PNG-Export, DXF-Notizblock, weitere Normsysteme (JIS), Presslängs-
  Kraftverlauf-Diagramm.

---

## 1. Normfundament — Kurzreferenz (zum Nachschlagen ohne Code)

> Normtexte sind geschützt; Formeln/Werte stammen aus seriösen frei publizierten
> Sekundärquellen und werden eigenständig implementiert. **Produkt-Disclaimer Pflicht**
> („unverbindliche Unterstützung; Verantwortung beim Anwender; Normblätter maßgeblich").
> Normstände im Tool ausweisen: ISO 286-1:2019 / -2:2020 · DIN EN ISO 1 (20 °C) ·
> ISO 2768-1:1991 · DIN 7190-1:2017 · VDI/VDE 2617 · ASME B4.1.

### 1.1 ISO-286-System
- **Nennmaßbereiche** (Hauptstufen bis 500 mm): 1–3, 3–6, 6–10, 10–18, 18–30, 30–50,
  50–80, 80–120, 120–180, 180–250, 250–315, 315–400, 400–500. Für viele Grundabmaße
  gelten **Zwischenstufen** (z. B. 30–40/40–50). D = √(D₁·D₂) (geometrisches Mittel).
- **Toleranzfaktor:** i [µm] = 0,45·∛D + 0,001·D (D ≤ 500 mm);
  großer Bereich 500–3150 mm: I [µm] = 0,004·D + 2,1.
- **Grundtoleranzgrade:** IT5=7i · IT6=10i · IT7=16i · IT8=25i · IT9=40i · IT10=64i ·
  IT11=100i · IT12=160i · IT13=250i · IT14=400i · IT15=640i · IT16=1000i · IT17=1600i ·
  IT18=2500i (je 5 Grade Faktor 10). IT01=0,3+0,008·D; IT0=0,5+0,012·D; IT1=0,8+0,020·D;
  IT2–IT4 geometrisch gestuft zwischen IT1 und IT5. **Normwerte sind gerundet — Tabelle
  maßgeblich (2.5).**
- **Grundabmaße Welle** (es/ei in µm; Auszug der Formeln, B1 verifiziert alle gegen Tabellen):
  a: es=−(265+1,3·D) [D≤120] bzw. −3,5·D · b: es=−(140+0,85·D) [D≤160] bzw. −1,8·D ·
  c: es=−52·D^0,2 [D≤40] bzw. −(95+0,8·D) · d: es=−16·D^0,44 · e: es=−11·D^0,41 ·
  f: es=−5,5·D^0,41 · g: es=−2,5·D^0,34 · h: es=0 · js: ±IT/2 · j: tabelliert (IT5–8) ·
  k: ei=+0,6·∛D (IT4–IT7, sonst 0) · m: ei=+(IT7−IT6) · n: ei=+5·D^0,34 ·
  p: ei=IT7+(0…5) · r: geometr. Mittel aus p und s · s: ei=IT8+(1…4) [D≤50] bzw.
  IT7+0,4·D · t: ei=IT7+0,63·D · u: ei=IT7+D · v/x/y/z/za/zb/zc: IT7+1,25D / +1,6D /
  +2D / +2,5D / IT8+3,15D / IT9+4D / IT10+5D.
- **Grundabmaße Bohrung:** Allgemeinregel **EI = −es** (gleicher Buchstabe);
  **Sonderregel** für K, M, N (≤ IT8) und P…ZC (≤ IT7): **ES = −ei + Δ**, Δ = ITₙ − ITₙ₋₁.
- **Systeme:** Einheitsbohrung (H-Basis, Standard) und Einheitswelle (h-Basis) — beide anzeigen können.
- **Scope V1:** Nennmaß 1–500 mm tabelliert (Buchstaben a…zc ohne cd/ef/fg, IT1–IT16);
  500–3150 mm per Formelsatz mit Hinweis-Code `ASSUME_FORMULA_RANGE`; außerhalb → klare
  Meldung „außerhalb ISO 286 — Freiform-Eingabe nutzen" (kein Absturz).

### 1.2 Passungskennwerte
Grenzmaße: G_o = N + ES/es, G_u = N + EI/ei. **Höchstspiel** PS_max = ES − ei;
**Mindestspiel** PS_min = EI − es (negativ = Übermaß). **Passtoleranz** PT = T_B + T_W.
**Passungsart:** Spiel (PS_min ≥ 0) · Übermaß (PS_max ≤ 0) · Übergang (sonst) — als
Klartext + Feinabstufung („leichter Presssitz" …) über Schwellen aus der Empfehlungsmatrix.

### 1.3 ISO 2768-1 Allgemeintoleranzen (Längenmaße, ± in mm — B7 gegen Quelle verifizieren)
| Klasse | 0,5–3 | 3–6 | 6–30 | 30–120 | 120–400 | 400–1000 | 1000–2000 | 2000–4000 |
|---|---|---|---|---|---|---|---|---|
| f (fein) | 0,05 | 0,05 | 0,1 | 0,15 | 0,2 | 0,3 | 0,5 | — |
| m (mittel) | 0,1 | 0,1 | 0,2 | 0,3 | 0,5 | 0,8 | 1,2 | 2 |
| c (grob) | 0,2 | 0,3 | 0,5 | 0,8 | 1,2 | 2 | 3 | 4 |
| v (sehr grob) | — | 0,5 | 1 | 1,5 | 2,5 | 4 | 6 | 8 |

### 1.4 ANSI/ASME B4.1 (zöllig)
Passungsklassen **RC1–RC9** (running/sliding), **LC** (locational clearance), **LT**
(transition), **LN** (interference), **FN1–FN5** (force/shrink) — reine **Tabellennorm**
(Abmaße in 0,001 in über Nennmaßbereiche). Umsetzung als Datentabellen in `daten.js`,
interne Speicherung ganzzahlig in 0,0001 in, Anzeige in/mm umschaltbar. Gleiche
Rechen-/Anzeige-Pipeline wie ISO (Kennwerte, Grafik, Rechenweg).

### 1.5 Pressverband nach DIN 7190 (elastische Auslegung, zylindrisch)
Kette (für U_min und U_max getrennt rechnen):
1. **Glättungsverlust:** ΔU = 0,8·(Rz_Bohrung + Rz_Welle) → wirksames Übermaß U_w = U − ΔU.
2. **Durchmesserverhältnisse:** Q_A = D_F/D_Aa (Nabe), Q_I = d_Ii/D_F (Welle; Vollwelle Q_I=0).
3. **Fugendruck:** p = U_w / ( D_F · [ (1/E_A)·((1+Q_A²)/(1−Q_A²) + ν_A)
   + (1/E_I)·((1+Q_I²)/(1−Q_I²) − ν_I) ] ).
4. **Elastische Grenzen** (vollelastisch): p_zul der Nabe ~ R_eL,A·(1−Q_A²)/√3 (GEH-Form),
   Vollwelle p_zul ~ R_eL,I·2/√3 bzw. nach Schubspannungshypothese der Norm — **exakte
   Beiwerte (SH vs. GEH) in B10 gegen DIN-7190-Quelle/HEXAGON-WN1-Beispiel festnageln**;
   GJL gesondert behandeln (spröde: Grenze aus R_m mit Sicherheit, als Richtwert markiert).
5. **Übertragbarkeit (Rutschgrenze):** F_ax = π·D_F·l_F·p·µ; M_t = p·π·D_F²·l_F·µ/2;
   Sicherheiten S = vorhanden/erforderlich gegen geforderte Last.
6. **Fügen:** Einpresskraft F_e ≈ π·D_F·l_F·p_max·µ_e; **thermisch:**
   ΔT_Nabe = (U_max + S_Füge)/(α_A·D_F) mit Fügespiel-Richtwert S_Füge ≈ D_F/1000
   (alternativ Welle unterkühlen); Warnhinweis Anlasstemperatur vergüteter Naben (~250 °C+).
7. **Kriechen (Richtwert-Hinweis):** Alu/Mg-Naben verlieren über Jahre Pressung
   (Faustwert ~10–20 %/10 a) → Warncode `HINT_CREEP`, Sicherheitszuschlag empfehlen.
8. **Kantenpressung/kurze Fugen:** Hinweis bei l_F/D_F < 0,5 bzw. > 1,5 (Richtwertgrenzen).
µ-Richtwerte (trocken/geölt, Stahl/Stahl, Stahl/GJL, Stahl/Alu) als kleine Tabelle in
`daten.js`, Quelle DIN 7190/Sekundärliteratur, editierbar per Haken.

### 1.6 Thermik (DIN EN ISO 1: alle Toleranzen gelten bei 20 °C)
Spieländerung bei Betriebstemperatur T: **ΔS = (α_Bohrungsteil − α_Wellenteil)·(T − 20 °C)·D_F**
(positiv = Spiel wächst). Ausgabe: Passung bei T (min/max), Warnung bei
**Passungsumschlag** (Spiel→Klemmung oder Presssitz→locker), Hinweis auf instationäre
Gradienten (> ~10 K/min → stationäre Werte kritisch prüfen, `HINT_GRADIENT`).

### 1.7 Oberfläche & Fertigung
- **Rz↔Toleranz-Richtwert:** Rz ≤ T/5 (Warnstufen T/3, T/2). Bei Spielpassungen reduziert
  Rauheit den nutzbaren Spalt (Hinweis „wirksames Kleinstspiel ≈ S_min − 0,4·(Rz_B+Rz_W)",
  Faustwert); bei Presspassungen wirkt die Glättung 0,8·ΣRz übermaßmindernd (1.5).
- **Verfahren ↔ erreichbare IT (Richtwerte):** Läppen IT3–5 · Honen IT4–6 · Rundschleifen
  IT5–7 · Reiben IT6–8 · Feindrehen IT6–8 · Drehen IT7–11 · Räumen IT7–8 · Fräsen IT8–11 ·
  Bohren IT11–13.
- **Kostenampel:** ≤ IT6 → rot „Schleifen/Honen, teuer, Ausschussrisiko" · IT7–IT8 → gelb
  „Feindrehen/Reiben, mittel" · ≥ IT9 → grün „Standard-Drehen, günstig". Psychologisches
  Kern-Feature: wer H6 wählt, sieht sofort die Kostenfolge.

### 1.8 Messtechnik (VDI/VDE 2617 — „goldene Regel")
Messunsicherheit U ≤ T/10 (Warnstufe T/5). Messmittel-Richtwerttabelle in `daten.js`:
Messschieber digital U≈±0,03–0,05 mm · Bügelmessschraube ±4 µm · 3-Punkt-Innenmessschraube
±4–6 µm · Feinzeiger/Messuhr ±5–10 µm · Grenzlehrdorn/-ring (prüft Taylor direkt) ·
KMG ±1,5–3 µm. Ausgabe: konkrete Geeignet/Ungeeignet-Liste je Toleranz („H7 (25 µm):
Messschieber ✗, Mikrometer ✓, Grenzlehrdorn ✓").

### 1.9 Form & Lage (Taylor)
**Taylor-Prinzip/Hüllbedingung** im Explorer erklären (Gutseite = Vollform, Ausschussseite =
Einzelmaß). **Richtregel:** Formtoleranz (Rundheit/Zylindrizität) ≤ **1/3 der Maßtoleranz**
→ automatischer Hinweis („H7-Bohrung 25 µm → Rundheit ≤ 8 µm anstreben"). V1 nur Hinweis,
kein GD&T-Rechner.

### 1.10 Schmierspalt (Gleitpassungen H7/f7, H7/e8 …)
Richtwert-Modul: minimal nutzbarer Schmierspalt aus Mindestspiel abzüglich Rauheitsanteile;
Regel **Rz_gesamt ≤ 1/3 des Mindestspalts** (Stribeck-Grundsatz als Faustregel) →
sonst Mischreibungs-Warnung `HINT_LUBRICATION`.

### 1.11 Toleranzketten
Schließmaß M₀ = Σ aᵢ·Cᵢ (aᵢ = ±1 Richtungsfaktor, Cᵢ Mittenmaß).
- **Worst-Case:** T₀ = Σ|aᵢ|·Tᵢ (Grenzlagen entsprechend) — garantiert, konservativ.
- **RSS:** T₀ = √(Σ Tᵢ²) (um Mittenmaße symmetriert) — statistisch, Standardannahme.
- **Monte-Carlo:** je Glied Verteilung (Normal σ=T/6 oder Rechteck), N Stichproben
  (Default 20.000, Seed deterministisch) → Histogramm (SVG), Quantile, und — falls
  Schließmaß-Grenzen angegeben — **Ausschussanteil** in ppm/%.
Invariante: WC-Spanne ≥ RSS-Spanne; MC-Mittel ≈ analytisches Mittel (Testanker).

### 1.12 Empfehlungsmatrix des Passungs-Assistenten (Frage-Dialog → Vorschläge)
Dialogfragen: Funktion (drehbar/fest), Demontierbarkeit, Momentübertrag über Sitz?,
Führungsgenauigkeit, Temperaturbereich, Werkstoffe. Ergebnis: **bis zu 3 Vorschläge mit
je einem Begründungssatz** (auch für Laien), H-Basis (h-Basis-Alternative anzeigbar):
| Anwendung | Vorschläge | Kernbegründung |
|---|---|---|
| Gleitlager, Schmierfilm, Welle dreht | H8/e8 · H7/f7 | sicherer Ölspalt |
| Präzise drehbare Führung | H7/g6 (· H6/g5) | minimales Spiel, leichtgängig |
| Schiebesitz, von Hand fügbar | H7/h6 | Spiel gegen null, verschiebbar |
| Zentrierung, oft demontiert | H7/js6 · H7/j6 | wackelfrei, leicht lösbar |
| Passfeder-Nabe, gut zentriert | H7/k6 · H7/m6 | leichter Übergang, Presse/Schläge klein |
| Fester Sitz, selten demontiert | H7/n6 · H7/p6 | Presse nötig, noch lösbar |
| Reibschluss-Moment, quasi unlösbar | H7/s6 · H7/r6 | Pressverband → Mechanik-Modul rechnen! |
| Hoher Schrumpfsitz, große Momente | H8/u8 (· x8/z8) | thermisch fügen |
| Dünnwandige/Leichtmetall-Nabe | erst p_zul prüfen | Gefahr Plastifizieren → B10-Modul |
| Freimaß/Werkzeugbau | Freiform · ISO 2768 | keine Passfunktion |
Assistent verlinkt direkt: Vorschlag antippen → Felder werden gesetzt, Rechnung läuft.

### 1.13 Werkstofftabelle (`daten.js` → `MAT`, single source of truth)
Je Werkstoff: `label{de,en,pt}`, `E` [N/mm²], `nu` (ν), `alpha` [1e-6/K],
`ReDefault` [N/mm²] (editierbar per Haken), `creep`-Flag, `src`. Startumfang
(**Richtwerte — B10 setzt die finalen Zahlen mit Quellen**): Stahl (210000 · 0,30 · 11,5 ·
355) · Stahl austenitisch (200000 · 0,30 · 16 · 230) · GJL (110000 · 0,25 · 10 · Sonderfall
spröde) · GJS (170000 · 0,28 · 12,5 · 250) · Alu-Knet (70000 · 0,33 · 23 · 240 · creep) ·
Alu-Guss (75000 · 0,33 · 21 · 180 · creep) · Mg-Guss (45000 · 0,29 · 26 · 140 · creep ·
Schätzwert) · CuSn-Bronze (110000 · 0,34 · 18 · 240) · CuZn-Messing (100000 · 0,35 · 19 · 200).

### 1.14 Validierungsanker & Quellen
- **ISO 286:** klassische Lehrbuch-/Tabellenwerte, gegen **≥ 2 unabhängige publizierte
  Quellen** prüfen (Anker-Tabelle in Abschnitt 6).
- **DIN 7190:** frei publizierte durchgerechnete Beispiele (Sekundärliteratur/Ruoss —
  **HEXAGON WN1** ist die Validierungsreferenz, analog SR1 bei der Schraube).
- **ISO 2768 / ANSI B4.1 / Messmittel / Verfahren-IT:** publizierte Tabellen, je markiert.
- Es gilt: **fehlender Beleg → sichtbarer „Schätzwert/Faustregel"-Vermerk.**

---

## 2. Architektur & Module (Spiegel der Schraube)

### 2.1 Modul-Landkarte (ein Ordner, flache Dateien + Dev-Harness)
```
DT-ProfiPassung/
├── DT-ProfiPassung-x-x-x.html / _Test.html → Gerüst; Unterschied NUR window.DT_EDITION
├── style.css          → Design-Tokens/Look 1:1 von der Schraube übernommen & angepasst
├── daten.js   (DTPData)      → ISO-286-Zahlenkern (IT + Grundabmaße, ganzzahlige µm),
│                                ISO-2768-, ANSI-B4.1-, Messmittel-, Verfahren/IT-,
│                                µ-Tabellen, Werkstoffe MAT, Empfehlungsmatrix, PRESETS
├── validate.js (DTPValidate) → Feldschema (dreisprachig) + zweistufige Prüfung
│                                (harte Grenzen / Warnbereiche), Cross-Validationen
├── solver.js  (DTPSolver)    → Rechenlogik + Orchestrator computeFit (validiert zuerst;
│                                bedingte Module: Thermik, Pressverband, Oberfläche,
│                                Messung, Schmierspalt; Codes in notes.*)
├── kette.js   (DTPKette)     → Toleranzkette WC/RSS/Monte-Carlo (mulberry32-Seed),
│                                Histogramm-Daten (reine Funktionen, Node-testbar)
├── rechenweg.js (DTPRechenweg) → dokumentierter, SELBSTPRÜFENDER Rechenweg (post-hoc)
├── schaubild.js (DTPSchaubild) → Toleranzfeld-Grafik + Kette-Histogramm als Live-SVG
├── report.js  (DTPReport)    → RTF/CSV, Copy-Text, CAD-Snippet, Gating-/Lizenz-Logik
│                                (Port von der Schraube: isFeatureAllowed, licensee*)
├── ui.js                     → Formular, Parser-Feld, Live-Prüfung, Ergebnis, Rechenweg,
│                                Grafik-Einbindung, Assistent-Dialog, i18n, Theme,
│                                .dtp-Speichern/Laden, Registrierung, Impressum-ⓘ
└── test_passung.js (DEV-ONLY) → Node-Harness (ok()-Zähler, Sektionen) — nie ausgeliefert
```
**Ladereihenfolge:** `daten → validate → solver → kette → rechenweg → schaubild → report → ui`.
UMD überall; keine externen Abhängigkeiten.

### 2.2 Muster-Ports aus der Schraube (verbindlich)
`fillFromMaterial`-Analogon (Vorbelegen+Sperren+Haken) · `LT(de,en,pt)` für
Formel-Beschriftungen · `enumValues` direkt aus den Datentabellen (kein Drift) ·
Presets tragen Engine-Rohdaten **plus** optionale UI-Vorbelege · Meldungs-/Hinweis-Codes ·
`guard()`-Wrapper für gesperrte Aktionen · Modal/Overlay-Muster · Escape/Backdrop-Verhalten ·
`on()`-nullsichere Event-Bindung · Focus-Trap · Print-CSS mit erzwungenen Ampelfarben ·
Editions-Balken-/Lizenzzeilen-Mechanik · Aktivierungsdialog + 10-s-Long-Press-Reset ·
Impressum-ⓘ (Dieter Tepe, Mühlenstraße 2, 48477 Dreierwalde, Dieter.Tepe@live.de,
Link www.dt-profidreieck.de bis eine eigene Seite existiert).

### 2.3 Parser-Spezifikation („Smart-Eingabe")
Akzeptiert u. a.: `50 H7/g6` · `50H7/g6` · `Ø50 H7-g6` · `H7/g6 50` · `50 H7` (nur
Bohrung) · `50 h6` (nur Welle) · Groß-/Kleinschreibung: Großbuchstabe = Bohrung,
Kleinbuchstabe = Welle; wenn uneindeutig → Reihenfolge Bohrung/Welle + Hinweis.
`js`/`JS` korrekt. Komma/Punkt-Dezimal. Unbekannter Buchstabe/Grad → freundliche Meldung
mit Vorschlagsliste, **nie** Absturz. Parser ist eine **reine, Node-getestete Funktion**
(Roundtrip-Property: format(parse(x)) ≡ normalisiert). Nach dem Parsen „rasten" die
strukturierten Felder ein und bleiben editierbar (Hybrid-Prinzip); Sprechblasen-Hinweis je
Toleranzfeld („H7: übliche Bohrungspassung … gängige Partner: g6/k6/n6/s6").

### 2.4 Edition, Registrierung, Recht
Wie Schraube: `DT_EDITION` build-fest; Voll degradiert **nie**; Registrierung nur
Personalisierung (Name+Schlüssel, localStorage `dtp-licensee`/`dtp-license-key`, keine
Prüfung, Long-Press-Reset, Lizenznehmer in Copy-Text-/RTF-/CSV-/Druck-Köpfen).
**Disclaimer** im Footer + in jedem Export; **Versionszeile** (Produkt- + Datenstand,
z. B. „v1.2.0 · ISO 286:2019-Datensatz") klein in Ecke und Export — Rückfragen brauchen
den Datenstand. Theme/Sprache in localStorage (`dtp-theme`/`dtp-lang`), sonst nichts
(Privacy; Eingaben-Autosave nur je als bewusstes Opt-in).

### 2.5 Datenstrategie ISO 286 (Kernentscheidung)
`daten.js` enthält die **fertigen tabellierten Zahlenwerte** (ganzzahlige µm, kompakte
Arrays je Buchstabe×Grad×Bereich, 1–500 mm). Sie werden einmalig per Hilfsskript aus den
Normformeln + Rundungsregeln **erzeugt** und im Harness gegen **externe publizierte
Tabellenanker** verifiziert (≥ 30 Stützwerte quer über Bereiche/Buchstaben, ≥ 2 Quellen).
Die Engine liest **nur** die Tabelle → null Formeldrift im Produkt. Formelsatz bleibt im
Harness als Quervergleich und dient live nur für 500–3150 mm (mit `ASSUME_FORMULA_RANGE`).

---

## 3. UI/UX — das 3-Ebenen-Interface (Profi-Look der Schraube)

**Leitidee unverändert: Messinstrument, keine App.** Graphit dunkel Standard, Stahl-Cyan
für Interaktives, Bernstein für Wärme/Moment, Grün/Gelb/Rot nur für Bewertungen (immer
Icon + Text), Design-Tokens als CSS-Variablen, hell/dunkel, Tabellenziffern,
`prefers-reduced-motion`, Print-Stylesheet. Handy einspaltig (Akkordeon), Desktop
mehrspaltig (Eingabe · Grafik · Ergebnis).

**Ebene 1 — Smart-Eingabe (oben):** Parserfeld + strukturierte Feldgruppen:
- **Passung:** Nennmaß · System (ISO 286 / ANSI B4.1 / ISO 2768 / Freiform) · Bohrung
  (Buchstabe+Grad bzw. ES/EI frei) · Welle (dito) · Basis-Umschalter H-/h-System.
- **Betrieb (optional):** Betriebstemperatur · α-Auswahl je Teil aus MAT (+Haken).
- **Oberfläche & Fertigung (optional):** Rz Bohrung/Welle (Auswahl 1,6/6,3/16/25 + frei) ·
  geplantes Verfahren.
- **Pressverband (aktivierbar, `dependsOn`):** Fugenlänge l_F · Nabenaußen-Ø D_Aa ·
  Wellen-Innen-Ø d_Ii (0 = Vollwelle) · Werkstoff Nabe/Welle (MAT, Haken für E/ν/α/R_e) ·
  µ (Richtwert-Auswahl + Haken) · geforderte Last (M_t und/oder F_ax) · Fügeart
  (Einpressen/thermisch).
- **Messung (optional):** vorhandenes Messmittel → Eignungs-Check.
- **Toleranzkette (eigener Bereich):** Maßliste (Nennmaß, ±T oder ISO-Kurzzeichen,
  Richtung ±) · Schließmaß-Grenzen (optional) · Methode WC/RSS/MC · Button „aktuelle
  Passung als Glied übernehmen".
- **Assistent:** Start-Button → Frage-Dialog (1.12).
Jedes Feld mit großem rechtsbündigem **ⓘ** (Titel · ausführliche Laien-Hilfe · Bereich ·
Auswahl); Pflichtfelder pulsen orange; Live-Prüfung in Klartext, dreisprachig.

**Ebene 2 — Live-Visualisierung (Mitte):** Nulllinie, Toleranzfelder als farbige Balken
(Bohrung grün, Welle blau — konsistent zur Ideen-Notiz), Spiel-/Übermaßzone schraffiert,
dezente Einblend-Animation (reduced-motion-fähig). **Alle Zahlen in der HTML-Legende mit
Farb-Chips unter dem SVG** (Merksatz!); Legenden-Chips antippbar → kurze Erklärzeile
(ersetzt Hover). Im Ketten-Modus: Histogramm mit Schließmaßgrenzen und ±3σ.

**Ebene 3 — Ergebnis & Rechenweg (unten):**
- **Kennwert-Kacheln:** Höchst-/Mindestspiel bzw. -übermaß · Passungsart (Klartext-Banner) ·
  Passtoleranz · bei Pressverband zusätzlich p_min/p_max, S_Rutschen, S_Nabe/S_Welle.
- **Beratungs-Panels:** Kostenampel (1.7) · Messmittel-Empfehlung (1.8) · Montagehinweis
  (Fügekraft in kN bzw. ΔT fürs Erwärmen) · Thermik-Ergebnis („bei 80 °C: Spiel 2…41 µm —
  Passungsumschlag!") · Oberflächen-/Schmierspalt-/Form-Hinweise. Alles mit Begründungssatz.
- **Aufklappbarer Rechenweg** (selbstprüfend, ✓ je Schritt, dreisprachig, mobil scrollbar).
- **Passungs-Explorer** (Wissens-Basis, aufklappbar): „Was & Warum" (warum nicht einfach
  50,000 fertigen) · Passungs-Typologie-Tabelle (Spiel/Übergang/Press mit Alltagsbildern) ·
  Taylor/Hüllbedingung · Verfahren↔IT-Übersicht · Montage-Tipps (thermisches Fügen).
- **Ausgabe-Leiste:** Copy-Text · CAD-Notiz-Snippet · `.dtp` speichern/laden · Drucken ·
  Word (.rtf) · CSV. (Testversion: alle sechs gesperrt → gemeinsames Info-Overlay.)
Copy-Format-Beispiel: `Ø50 H7/g6 — Bohrung 50,000…50,025 · Welle 49,975…49,991 ·
Spiel 9…50 µm (Spielpassung) · Fertigung: Feindrehen/Reiben · DT-ProfiPassung v1.0`.

---

## 4. Funktionsumfang V1 (verbindliche Feature-Liste)
F1 **ISO-286-Kern:** Grenzabmaße/-maße, Spiel/Übermaß min/max, Passtoleranz, Passungsart;
   H-/h-Basis; 1–500 mm Tabelle, 500–3150 mm Formel+Hinweis.
F2 **Hybrid-Eingabe + Parser** (2.3) inkl. Sprechblasen-Empfehlungen und Freiform
   (ES/EI bzw. es/ei direkt in µm — Werkzeugbau-Modus).
F3 **Live-Toleranzfeld-Grafik** (Ebene 2) inkl. Legenden-Erklärchips.
F4 **Pressverband DIN 7190** komplett (1.5): p, Grenzen, S-Werte, F_ax/M_t gegen geforderte
   Last, Einpresskraft, thermisches Fügen (ΔT + Fügespiel), Hohlwelle/Nabengeometrie,
   µ- und Werkstoff-DB, Glättung aus Rz, Kriech- und Kantenpressungs-Hinweise.
F5 **Thermik-Check** (1.6) mit Passungsumschlag-Warnung.
F6 **Oberflächen-Check** (1.7): Rz-Regeln, wirksames Spiel, 1/3-Formtoleranz-Hinweis (1.9).
F7 **Fertigungs-/Kostenampel** + Verfahren↔IT.
F8 **Messmittel-Empfehlung** (10-%-Regel, Geeignet-Liste).
F9 **Schmierspalt-Richtwert** bei Spielpassungen (1.10).
F10 **Passungs-Assistent** (Frage-Dialog + Matrix 1.12, bis 3 begründete Vorschläge,
    Übernahme per Tipp).
F11 **Toleranzkette** WC/RSS/Monte-Carlo mit Histogramm, Quantilen, Ausschuss (1.11),
    Brücke „Passung als Glied".
F12 **ISO 2768** (f/m/c/v) als Norm-Option.
F13 **ANSI B4.1** (RC/LC/LT/LN/FN, in/mm-Anzeige).
F14 **Ausgaben:** Copy-Text, CAD-Notiz-Snippet, `.dtp`-JSON speichern/laden (Round-Trip,
    Fehlercodes bei defekter Datei), Druck→PDF, RTF, CSV (Trenner/Dezimal sprachgekoppelt,
    BOM) — Kopf mit Bezeichnung/Datum/Norm-Datenstand/Lizenznehmer/Version.
F15 **Dreisprachigkeit vollständig** + Passungs-Explorer/Wissens-Basis + Laien-ⓘ überall.
F16 **Validierung/Plausibilität:** harte Grenzen + Warnbereiche, „außerhalb Normbereich →
    Freiform", physikalisch unsinnige Eingaben (z. B. Spiel > Bauteil) orange/rot, Einheiten
    immer explizit, kein Absturz bei irgendeiner Eingabe.
F17 **Edition Test/Voll + Registrierung + Impressum-ⓘ** (2.4).
F18 **≥ 15 Presets** zum Direktladen, u. a.: 50 H7/g6 (Lehrbuch-Anker) · 20 H7/k6
    Passfeder · 25 H7/f7 Gleitlager · 60 H7/s6 Pressverband Stahl/Stahl mit Lastnachweis ·
    40 H7/p6 Stahlbuchse in Alu-Gehäuse + 80 °C-Thermik (Umschlag-Demo) · 100 H8/e8 ·
    Hohlwellen-Pressverband · thermisches Fügen (Schrumpfsitz u8) · Alu-Nabe Kriech-Fall ·
    Freiform Werkzeugbau · ISO-2768-m-Beispiel · ANSI RC4 · Messmittel-Grenzfall H6 ·
    Toleranzkette 4 Glieder (WC vs. RSS vs. MC) · dünnwandige Nabe (p_zul-Warnung).
    Illustrative Beispiele tragen „(nicht normvalidiert)".

---

## 5. Umsetzungs-Roadmap — Bausteine (Reihenfolge fix, Zuschnitt je Session flexibel)
Jeder Baustein: Grün-Basislinie → bauen → volle Suite grün → ausliefern → Dieter bestätigt
→ Plan-Kopf/Changelog fortschreiben. **DoD = Definition of Done.**

**B1 — ISO-286-Zahlenkern (ALLERERSTE AUFGABE).** `daten.js` (IT-Tabelle + Grundabmaße
Welle/Bohrung inkl. Sonderregel-Δ, ganzzahlige µm, 1–500 mm) + `test_passung.js`-Gerüst.
DoD: alle Anker aus Abschnitt 6 grün; Formel↔Tabelle-Quervergleich grün; `node --check`.
**B2 — Engine-Kern.** `solver.js` `computeFit` (Kennwerte 1.2, Passungsart) +
`validate.js` Kernfelder. DoD: Property-Tests (6.2) + Presets 1–3 rechnen.
**B3 — UI-Basis.** HTML×2, `style.css`-Port, Formular Gruppe „Passung", Ergebnis-Kacheln,
i18n-Gerüst DE/EN/PT, Theme/Sprache. DoD: erster Handy-Test Dieter. — **✓ bestätigt (v1.4.1): beide HTML fehlerfrei am Handy, Projektordner + GitHub aktuell.**
**B4 — Parser + Sprechblasen** (2.3). DoD: Roundtrip-Property + Handy-Test. — **✓ bestätigt (v1.5.1).**
**B5 — Toleranzfeld-Grafik** `schaubild.js` + Legende/Chips. DoD: Handy-Test, Merksatz erfüllt. — **✓ bestätigt (v1.6.1).**
**B6 — Rechenweg** `rechenweg.js` selbstprüfend für die ISO-Kette. DoD: Selbstprüfung über
alle bisherigen Presets × 3 Sprachen. — **Code gebaut & grün (v1.7); Handy-Test offen.**
**B7 — Freiform + ISO 2768.** DoD: Anker ISO-2768-Tabelle, Freiform-Presets.
**B8 — Thermik-Check** (F5). DoD: Vorzeichen-/Umschlag-Tests, Preset 80 °C.
**B9 — Beratungs-Module** (F6–F9: Oberfläche, Kostenampel, Messmittel, Schmierspalt).
DoD: Regel-Tests, alle Hinweise als Codes dreisprachig.
**B10 — Pressverband DIN 7190** (F4, größter Physik-Baustein; ggf. 2 Sessions:
p/Grenzen → Übertragbarkeit/Fügen). DoD: externer Validierungsanker (WN1/Literaturbeispiel)
±2 %, Rechenweg-Schritte, MAT final belegt.
**B11 — Passungs-Assistent** (F10). DoD: Matrix-Tests (jede Zeile → korrekte Vorschläge),
Dialog am Handy.
**B12 — Toleranzkette** `kette.js` (F11; WC/RSS zuerst, dann MC + Histogramm).
DoD: WC≥RSS-Invariante, MC-Determinismus (Seed), MC≈analytisch-Anker.
**B13 — ANSI B4.1** (F13; vorziehbar, wenn gewünscht). DoD: Tabellen-Anker, in/mm-Anzeige.
**B14 — Ausgaben** (F14; `report.js`-Port: RTF/CSV/Copy/Snippet/.dtp/Druck).
DoD: RTF-Rahmen/Escaping über alle Presets × 3 Sprachen, `.dtp`-Round-Trip, CSV-Logik.
**B15 — Edition/Registrierung/Impressum** (F17; Port). DoD: Gating-Sektion, beide Builds.
  → Enthält die **dezente Vollversions-Kennzeichnung mit Käufername** (tiefer platziert, wie
  bei DT-ProfiSchraube); bis dahin zeigt die Vollversion oben bewusst keinen Balken.
**B16 — Feinschliff:** Explorer-Inhalte komplett, restliche Presets, Code-Audit
(wie Schraube v4.8.1), Backlog leeren, Build-/Obfuskierungs-Vorbereitung.

---

## 6. Teststrategie (`test_passung.js`, DEV-ONLY — Muster der Schraube)
### 6.1 Anker (extern verifizieren, ≥ 2 unabhängige Quellen; Tabelle maßgeblich)
Ø50 (30–50): IT6=16 · IT7=25 · IT8=39 · IT9=62 · IT11=160 µm. Abmaße [µm]:
50 H7 = +25/0 · 50 g6 = −9/−25 · 50 f7 = −25/−50 · 50 e8 = −50/−89 · 50 k6 = +18/+2 ·
50 n6 = +33/+17 · 50 p6 = +42/+26 · 50 s6 = +59/+43 · 25 H7 = +21/0 · 25 g6 = −7/−20 ·
100 H7 = +35/0 · 100 js6 = ±11 · 10 h6 = 0/−9 · 6 H7 = +12/0.
Passungen: 50 H7/g6 → Spiel 9…50 µm · 50 H7/s6 → Übermaß 18…59 µm.
Dazu: ISO-2768-Tabelle (1.3) · je ein ANSI-B4.1-Anker pro Klasse · DIN-7190-Beispiel
(p, F_ax, M_t gegen publizierte Rechnung, ±2 %).
### 6.2 Property-/Invarianten-Tests (Zufallsfälle in großer Zahl)
T(ITn+1) > T(ITn) · T wächst mit Nennmaßbereich · H: EI=0, ES=IT · h: es=0 · js symmetrisch ·
Allgemeinregel EI=−es konsistent · Sonderregel-Δ nur K/M/N≤IT8, P…ZC≤IT7 ·
Passungsart-Trichotomie konsistent zu min/max · Parser-Roundtrip · Grenzmaß-Identitäten ·
Thermik-Vorzeichen (Alu-Welle in Stahl bei Erwärmung → Spiel sinkt) · Pressverband:
p linear in U_w; F_ax/M_t linear in p, µ, l_F; Q_A→1 ⇒ p→0; Vollwelle-Grenzfall ·
Kette: WC ≥ RSS; MC deterministisch bei Seed; MC-Mittel ≈ Σ aᵢ·Cᵢ ·
`.dtp`-Round-Trip bit-identisch · `inp`-Unversehrtheit (computeFit mutiert nie) ·
Gating streng auf `'test'` · Rechenweg-Selbstprüfung über **alle Presets × 3 Sprachen**.
### 6.3 Betrieb
`ok()`-Zähler + Sektionen wie gewohnt; Assertion-Zahl wächst organisch (Basislinie steht
im Plan-Kopf und wird fortgeschrieben). Regel: **erweitern, nie lockern.**

---

## 7. Startpaket — Dateien für den neuen Projektordner
**Pflicht:** `plan.md` (diese Datei — die Quelle der Wahrheit).
**Empfohlen als Vorlagen/Referenz (read-only, werden portiert, nicht 1:1 übernommen):**
`style.css` · `ui.js` · `report.js` · `DT-ProfiSchraube-x-x-x.html` · `test_solver.js`
(alle aus dem Schrauben-Projekt: Design-Tokens, UMD-/i18n-/Gating-/Registrierungs-/
Report-/Harness-Muster). **Nicht nötig:** Schrauben-Masterplan, Ideen-Notizen (dieser Plan
konsolidiert sie), übrige Schrauben-Module.

## 8. Offene Entscheidungen für Session 1 (klein, vorab mit Dieter klären)
1. Produktname bestätigen: **DT-ProfiPassung**? (Dateinamen hängen daran.)
2. Dateiendung fürs Speichern: **`.dtp`** ok?
3. ANSI-Baustein B13 in der Reihenfolge belassen oder vorziehen?

---

## Changelog des Plans (knapp halten — Historie in Git)
**v1.0 (2026-07-12):** Erstfassung — konsolidiert aus Dieters Ideen-Notizen inkl. seiner
Antworten (Kette integriert mit eigenem Bereich + Brücke; ANSI direkt in V1; Assistent ja).
**v1.1 (2026-07-13):** B1 bestätigt. ISO-286-Zahlenkern: IT1–IT16 (1–500 mm) · Welle
d e f g h · k m n p s · js (s mit Zwischenstufen > 50 mm) · Bohrung über Allgemein-/
Sonderregel-Δ inkl. Norm-Feinheiten (Δ=0 bis 3 mm · M6-Ausnahme 250–315: ES=−9 ·
k-Grundabmaß nur IT4–IT7). Basislinie 39.035. **Nächster Schritt (Datenpass vor B2):**
Buchstaben a b c · j · r t u v x y z za zb zc mit Zwischenstufen nachtragen — bis dahin
liefert der Kern dort ehrlich `FD_NOT_IN_DATASET`, nie Falschwerte. Entscheidungen
Session 1: Name **DT-ProfiPassung** ✓ · Endung **`.dtp`** ✓ · B13 (ANSI) bleibt an
Position 13.
**v1.2 (2026-07-13):** Datenpass bestätigt — voller V1-Buchstabensatz: a b c (Feinraster,
25 Zwischenstufen) · r t u v x y z za zb zc · j5–j7 / J6–J8 · Norm-Fußnoten (a/b und
N>IT8 nicht bis 1 mm). Basislinie **72.127**. Neu: **DT-ProfiPassung_Pruefstand.html** —
kompletter Harness im Browser, Dieter prüft am Handy ohne Node (Grün-Banner = weiterbauen
erlaubt). Deployment-Zeile GitHub Pages im Kopf ergänzt. **Offen:** Tabellenbuch-Stichproben
(2. Quelle) + j/J-Zeilen — diese Werte tragen bis dahin das Flag `unverified`.
**v1.3 (2026-07-13):** B2 (Engine-Kern) bestätigt. Neu: **validate.js** (DTPValidate —
Feldschema, zweistufig: harte Grenzen/Warnungen, Cross-Checks Gradpaarung/System/
unverified) und **solver.js** (DTPSolver — parseFit inkl. Ø/Komma/js/za-zc/cd-Kombis,
formatFit-Roundtrip, computeFit nach 1.2: Grenzmaße, PS_max/PS_min, PT, Passungsart-
Trichotomie + heuristische Feinstufe, describe = Copy-Format). computeFit mutiert die
Eingabe nie, akzeptiert String wie Objekt. Presets 1–3 rechnen. Prüfstand lädt jetzt
daten→validate→solver→test. Basislinie **114.191**. **Nächster Schritt: B3 (UI-Basis)** —
HTML×2, style.css-Port, Formular „Passung", Ergebnis-Kacheln, i18n-Gerüst DE/EN/PT.
**v1.3.1 (2026-07-13):** Redaktionell (kein Code): Recovery-Protokoll 0.3 ergänzt um die
Handy-Prüfpflicht via Prüfstand und die `_s`-Dateikonvention (Schrauben-Vorlagen). B3-Sprachen:
alle drei (DE/EN/PT) von Anfang an aufsetzen (Entscheidung Dieter).
**v1.4 (2026-07-13):** B3 (UI-Basis) gebaut & grün. Neu/portiert: **style.css**
(1:1-Port aus style_s.css — Look „Messinstrument" unverändert; Passungs-Ergänzungen:
Bohrung grün / Welle blau, Passungsart-Banner pa-spiel/-uebergang/-uebermass,
Grenzmaß-Grid), **ui.js** (neu geschrieben, ersetzt die alte Schrauben-Referenz:
i18n DE/EN/PT — 56 STR-Keys × 3 + 15 Meldungs-Codes × 3, Formular Nennmaß/System/
Bohrung/Welle mit Live-Rechnung über DTPSolver.computeFit, Ergebnis = Kurzform +
Passungsart-Banner + 3 Kennwert-Kacheln + 2 Grenzmaß-Tabellen + Hinweiszeilen,
Theme/Sprache in localStorage `dtp-lang`/`dtp-theme`, DE/PT-Komma), **DT-ProfiPassung.html**
(Vollversion) + **DT-ProfiPassung_Test.html** (`DT_EDITION='test'`, Ladereihenfolge
daten→validate→solver→ui). Verifikation: node --check aller JS · i18n-Paritätsprüfung ·
DOM-Smoke 18/18 (Spiel/Übergang/Übermaß, 3 Sprachen, Theme, Fehlerbanner, unverified-
Hinweis) · Basislinie **114.191** unverändert. daten/validate/solver/test_passung unverändert.
**Nächster Schritt: B4 (Parser-Feld + Sprechblasen)** — Roundtrip-Property + Handy-Test.
**v1.4.1 (2026-07-13):** Redaktionell (kein Code): B3-DoD bestätigt — Dieter hat beide
HTML (Voll + Test) am Handy fehlerfrei gesichtet; Projektordner und GitHub aktuell.
Freigabe für **B4**.
**v1.5 (2026-07-13):** B4 (Parser + Sprechblasen) gebaut & grün. **ui.js**: Kurzeingabe-
Feld oben im Formular („Ø50 H7/g6" direkt tippen) — bidirektionaler Sync über
DTPSolver.parseFit/formatFit (Tippen → diskrete Felder + Ergebnis; diskrete Änderung/
Preset/Reset/Sprache → kanonische Kurzform zurückgeschrieben, DE/PT-Komma, kein Loop),
Parser-Fehler als Inline-Hinweis (4 neue Codes, DE/EN/PT); Erklär-Sprechblasen („?"-Tap)
an allen Kennwert-Kacheln (Höchst-/Mindestspiel, Größt-/Kleinstübermaß, Größtspiel,
Passtoleranz), dreisprachig. **style.css**: .fit-input, .sc-q, .sc-help ergänzt.
**test_passung.js**: Abschnitt 10 — 1.600er Parser-Roundtrip-Property-Sweep (Idempotenz
Punkt/Komma, Ø-Präfix, Komma-Eingabe) → **Basislinie 114.191 → 122.192** (+8.001).
Verifikation: node --check · i18n-Parität 65×3 + 19×3 · DOM-Smoke B3+B4 14/14.
HTML unverändert (Formular wird in ui.js gebaut); daten/validate/solver unverändert.
**Nächster Schritt: B5 (Toleranzfeld-Grafik `schaubild.js`)** — Handy-Test, Merksatz erfüllt.
**v1.5.1 (2026-07-13):** Redaktionell: B4-DoD bestätigt — Dieter hat die Kurzeingabe/
Sprechblasen am Handy fehlerfrei geprüft; Projektordner + GitHub aktuell.
**v1.6 (2026-07-13):** B5 (Toleranzfeld-Grafik) gebaut & grün. Neu: **schaubild.js**
(DTPSchaubild) — maßstäbliches Live-SVG: Nulllinie (= Nennmaß), Bohrung GRÜN / Welle BLAU
als Balken, µm-Achse (Ticks hi/0/lo), Spiel-/Übermaßzone schraffiert (nur eindeutige Fälle),
dezente Einblendung (reduced-motion-fähig). Rechenlogik `layout()` ist DOM-frei und getestet.
**ui.js**: `renderViz` bindet das SVG in `#vizHost` ein + HTML-Legende mit Farb-Chips
(alle Zahlen ES/EI/es/ei — Merksatz!), Chips antippbar → Erklärzeile (DE/EN/PT);
Fehlerfall zeigt Platzhalter statt SVG. **style.css**: viz-svg/tf-*/viz-legend/viz-chip +
Animation. **HTML×2**: `schaubild.js` vor `ui.js` eingebunden (daten→validate→solver→
schaubild→ui). Verifikation: node --check · Layout-Mathematik 13/13 · i18n-Parität 73×3 +
19×3 · DOM-Smoke B5 15/15 (SVG, 2 Balken, Nulllinie, Zonen, Legendenzahlen, Chip-Taps,
Fehler-Platzhalter). Basislinie **122.192** unverändert. daten/validate/solver/test_passung
unverändert. **Nächster Schritt: B6 (Rechenweg `rechenweg.js`)** — aufklappbar, selbstprüfend, dreisprachig.
**v1.6.1 (2026-07-13):** Redaktionell: B5-DoD bestätigt — Toleranzfeld-Grafik am Handy grün;
Projektordner + GitHub aktuell.
**v1.7 (2026-07-13):** B6 (Rechenweg) gebaut & grün. Neu: **rechenweg.js** (DTPRechenweg) —
post-hoc, SELBSTPRÜFENDER Rechenweg: rekonstruiert 9 Schritte (IT-Grundtoleranzen →
Grenzabmaße B/W → Grenzmaße B/W → PS_max → PS_min → Passtoleranz mit Gegenprobe →
Passungsart) aus den Primärgrößen und prüft jeden gegen das Solver-Ergebnis (✓/✗). Rechnet
nichts für die Anzeige neu — Solver bleibt maßgeblich. Symbole sprachneutral, DOM-frei,
separat getestet (inkl. Negativkontrolle: verfälschter Wert erzeugt rotes Kreuz). **ui.js**:
`renderRechenweg` — aufklappbares Panel unter dem Ergebnis, Schritt-Titel dreisprachig,
Formelzeilen mobil scrollbar, „alle Schritte geprüft"-Badge; Fehlerfall zeigt kein Panel.
**style.css**: .rechenweg/.rw-*. **HTML×2 + Prüfstand**: `rechenweg.js` nach solver.js
eingebunden (daten→validate→solver→rechenweg→schaubild→ui). **test_passung.js**: Abschnitt 11
— Rechenweg-Property-Sweep (>500 gültige Fälle: 9 Schritte, allOk, Art==Solver) + Negativ-
kontrolle → **Basislinie 122.192 → 131.765** (+9.573). Verifikation: node --check ·
Rechenweg-Logik 23/23 · i18n-Parität 85×3 + 19×3 · DOM-Smoke B6 14/14. daten/validate/
solver/schaubild unverändert. **Nächster Schritt: B7 (Freiform + ISO 2768)**.
**v1.7.1 (2026-07-13):** Fixes aus Dieters B6-Handy-Test (nur ui.js + style.css):
(1) **Rechenweg klappte nicht** — Ursache: mitportierter Schrauben-Rechenweg-CSS-Block
enthielt `.rw-body{display:flex}`, das das `[hidden]` überschrieb (offen beim Start,
Toggle wirkungslos). Toter/kollidierender Schrauben-Block entfernt; Auf-/Zuklappen jetzt
über `.rw-body.collapsed{display:none}` + `classList.toggle` (robust). Druck-CSS erzwingt
`.rw-body.collapsed` sichtbar. (2) **Vollversion** zeigt keinen grünen Editionsbalken mehr
(nur Testversion behält den gelben oben); die dezente Kennzeichnung der Vollversion mit
**Käufername** folgt in **B15 (Registrierung)** — Notiz dort verankert. (3) **„Leeren"**
leert nun wirklich alle Eingabefelder (Nennmaß, Kurzeingabe, Bohrung/Welle via „—"-Platzhalter)
statt 50 H7/g6 zu setzen. (4) **Unvollständige Eingabe** zeigt einen neutralen Hinweis
„Bitte ausfüllen: …" mit den fehlenden Feldern (dreisprachig), statt rotem Fehler/Default;
Grafik → Platzhalter. Verifikation: node --check · DOM-Smoke 14/14 · i18n-Parität 86×3 + 19×3 ·
Basislinie **131.765** unverändert. rechenweg.js/HTML/Kern unverändert.

═══════════════════════════════════════════════════════════════════════════
Ende plan.md · DT-ProfiPassung · Plan v1.0
═══════════════════════════════════════════════════════════════════════════
