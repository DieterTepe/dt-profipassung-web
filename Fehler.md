# 🐞 DT-ProfiPassung — Fehler- & Bug-Bericht

**Prüfstand:** vollständiger Code-Audit vor B16, unabhängig vom geplanten Weiterbau.
**Stand:** Basislinie **154.765 Assertions · 0 Fehler** · beide DOM-Smokes grün · `node --check`
über alle 12 Module sauber · i18n-Parität vollständig (379 STR-Keys × 3 Sprachen, 24 MSG-Codes,
alle dynamischen Key-Familien vorhanden). **Der Zahlenkern ist solide** — die Befunde unten sitzen
alle in der UI-/Ausgabe-/Anzeige-Schicht, nicht in der Rechenlogik.

Reihenfolge = Vorschlag zum Abarbeiten (nach Schwere). Jeder Punkt: **Was · Wo · Beleg · Fix-Idee**.
Nichts davon ist bereits geändert — reine Bestandsaufnahme.

---

## 🟠 F1 — Rechenweg zeigt in EN/PT deutsche Wortfetzen (Anzeige **und** Word-Export)

**Was:** `rechenweg.js` baut einige feste deutsche Wörter direkt in die `expr`-Strings ein. Sie sind
sprach**un**abhängig hartkodiert und erscheinen darum auch bei EN/PT unübersetzt — im aufklappbaren
Rechenweg wie im RTF-Bericht.

**Wo:** `rechenweg.js`
- `build` → `"(Gegenprobe: …)"`
- `buildOberflaeche` → `"Vollschmierung"`, `"Mischreibung"`, `"Spalt = …"`
- `buildPressverband` → `"(duktil, GEH)"`, `"(spröde, NH)"`, `"(Fügespiel)"`, `"→ Nabe auf … °C"`,
  `"→ Welle auf … °C"`, `"→ 0 (kein Restübermaß)"`
- Zusätzlich stehen Faktoren wie `0,8` / `0,4` **mit Komma** fest im String, auch im EN-Weg
  (dort müsste `0.8` / `0.4` stehen).

**Beleg (EN-Formatierer):**
```
build:  PT = T_B + T_W = 25 + 16 = 41 µm   (Gegenprobe: PS_max − PS_min = 41)
press:  p_zul,A = (1−Q_A²)·R_e,A/√3 = 153.72 N/mm² (duktil, GEH)
press:  S_f ≈ 1 µm/mm · D_F = 60 µm (Fügespiel)
press:  ΔT_A = … = 191.3 K → Nabe auf 211.3 °C
```

**Fix-Idee:** Die paar Wortschnipsel in kurze i18n-Keys auslagern und über den `fmt`-Kanal (oder ein
kleines Wörterbuch, das ui.js reinreicht) einsetzen — analog zum bestehenden `n`/`um`/`mm`-Muster.
„GEH/NH" und Formelsymbole bleiben sprachneutral; nur die Klartext-Zusätze wandern in DE/EN/PT.
Das Komma-Problem der Faktoren löst sich, wenn `0,8`/`0,4` über `fmt.n(0.8)` statt als Literal gehen.
**Aufwand:** mittel. **Wirkung:** betrifft den „Nachweis-Herzstück"-Anspruch in EN/PT + jeden Export.

---

## 🟠 F2 — Freiform-Modus: Word-Export (.rtf) liefert einen inhaltsleeren/falschen Bericht

**Was:** Im Freiform-Modus (ISO 2768) enthält der RTF-Bericht **weder** die Freiform-Ergebnisse
**noch** die vorher gerechnete Passung — nur Kopf + Haftungsausschluss. Ursache: `collectReportCtx()`
füllt Ergebnis-/Rechenweg-Zeilen ausschließlich im Zweig `if (mode === 'fit' …)`, und `lastResult`
wird in `renderFreiform()` gar nicht gesetzt (bleibt auf dem letzten Fit-Ergebnis stehen).

**Wo:** `ui.js` → `renderFreiform` (setzt `lastResult` nie) · `collectReportCtx` / `currentReportBase`
(nur `mode==='fit'`-Zweig befüllt Zeilen).

**Beleg (DOM-Smoke, Freiform aktiv, RTF ausgelöst):**
```
F2  Freiform-RTF: erzeugt=true  enthält_H7=false  enthält_2768=false
```
→ Datei entsteht, ist aber praktisch leer. Je nach Vorlauf kann sie auch alte Fit-Daten tragen
(irreführend). In der Testversion ist der Export ohnehin gesperrt; in der Vollversion ist es ein Bug.

**Fix-Idee:** Zwei Teile — (a) `renderFreiform` soll `lastResult` konsistent setzen bzw. einen
Freiform-Ergebniszustand hinterlegen; (b) `currentReportBase`/`collectReportCtx` um einen
Freiform-Zweig ergänzen (Ergebniszeilen ±A, Go/Gu, Toleranz + `buildFreiform`-Rechenweg). Alternativ,
falls Freiform-Export in V1 gar nicht gewollt ist: die Ausgabeknöpfe im Freiform-Modus sichtbar
deaktivieren, damit kein leerer Bericht möglich ist. **Aufwand:** mittel. **Wirkung:** Datenqualität
des Exports; sonst riskiert der Nutzer einen scheinbar gültigen, aber inhaltsleeren Beleg.

---

## 🟠 F3 — Kurzeingabe akzeptiert falsche Groß-/Kleinschreibung und rechnet still etwas anderes

**Was:** Tippt man in die Kurzeingabe eine Passung mit „falscher" Schreibweise, übernimmt `onFitInput`
nur die Buchstaben, die exakt in `HOLE_LETTERS`/`SHAFT_LETTERS` stehen — die anderen Felder bleiben
unverändert. Es erscheint **keine** Fehlermeldung, aber gerechnet/angezeigt wird die **alte** Feldbelegung.
Anzeige und tatsächlich getippte Eingabe laufen auseinander.

**Wo:** `ui.js` → `onFitInput` (Zeilen mit `HOLE_LETTERS.indexOf(...) >= 0` usw.: Felder werden nur
bei Treffer gesetzt; `run()` läuft trotzdem).

**Beleg (DOM-Smoke):**
```
parseFit("50 h7/g6"): hole=h7  shaft=g6           ← Einheitswelle, Bohrung = h
UI-Felder danach:     Hole=H   Shaft=g            ← 'h7' nicht in HOLE_LETTERS → Bohrungsfeld bleibt „H"
Banner: „Spielpassung · enger Gleitsitz"          ← es wird 50 H7/g6 gerechnet, nicht 50 h7/g6

"50 H7/G6": Echo=Ø50 H7/g6 · MsgHidden=true        ← 'G6' still zu 'g6' verschluckt, keine Warnung
```
→ Der Nutzer tippt eine gültig aussehende Passung, bekommt aber kommentarlos eine andere gerechnet.

**Fix-Idee:** In `onFitInput` bei erfolgreichem Parse die Groß-/Kleinschreibung gegen die Rolle prüfen
(Bohrung = Groß, Welle = klein bzw. `js/JS`). Passt sie nicht in die Auswahllisten, entweder
normalisieren (Rolle aus der Position bestimmen und Feld korrekt setzen) **oder** eine klare
Fehlermeldung anzeigen (`ERR_LETTER_CASE` gibt es schon in MSG). Wichtig: kein stilles `run()` mit
veralteten Feldern. **Aufwand:** klein–mittel. **Wirkung:** verhindert falsche Ergebnisse ohne Warnung
— das ist der gefährlichste der UI-Befunde, weil er falsch rechnet statt zu meckern.

---

## 🟡 F4 — Sprachwechsel verwirft eine gerade fehlerhafte Kurzeingabe

**Was:** Hat der Nutzer eine ungültige Kurzeingabe stehen (Fehlermeldung sichtbar) und schaltet die
Sprache um, wird sein Text durch die letzte **gültige** Passung überschrieben. Die Eingabe geht verloren.

**Wo:** `ui.js` → `setLang` ruft am Ende `recalc()`, das über `refreshFitField()` die Kurzeingabe
kanonisch neu schreibt.

**Beleg (DOM-Smoke):**
```
F4  Kurzeingabe vor Sprachwechsel="50 XYZ"  nach EN-Wechsel="50 H7/g6"  (überschrieben=true)
```

**Fix-Idee:** In `setLang` nicht bedingungslos `recalc()`; wenn eine Kurzeingabe-Fehlermeldung aktiv
ist, nur `applyI18n()` + `run()` (Anzeige) laufen lassen und das Kurzeingabefeld **nicht** überschreiben
(so wie es `onFitInput` beim Tippen bewusst auch nicht tut). **Aufwand:** klein. **Wirkung:** kleiner
Komfort-/Datenverlust-Fix.

---

## 🟡 F5 — Symmetrische Felder (JS/js) werden in mm um 0,5 µm falsch gerundet

**Was:** Grenzmaße werden auf **3 Nachkommastellen** (= 1 µm) gerundet. Bei ungeraden IT-Toleranzen mit
symmetrischem Feld (JS/js) ist das halbe Abmaß „,5 µm" — die mm-Anzeige rundet dann sichtbar daneben.

**Wo:** `solver.js` → `fieldOf` (`round3`) · Anzeige `fmtMm` (3 Nachkommastellen).

**Beleg:**
```
50 JS7:  ES = +12,5 µm  →  Go(intern) = 50,013 mm  (mathematisch exakt 50,0125 mm)
                           Gu(intern) = 49,988 mm  (exakt 49,9875 mm)
```
→ Die µm-Werte (ES/EI = ±12,5) stimmen; nur die **mm-Grenzmaße** zeigen eine gerundete Stelle zu wenig.
Rein kosmetisch, aber bei einem Präzisionswerkzeug fällt es Fachleuten auf.

**Fix-Idee:** Für mm-Grenzmaße eine Nachkommastelle mehr zulassen (4 Stellen = 0,1 µm), wenn das Abmaß
nicht ganzzahlig ist — oder generell 4 Stellen in der mm-Spalte. `round3` im Kern kann bleiben (µm sind
ganzzahlig/halb), betroffen ist nur die mm-Ableitung/Anzeige. Testanker (`test_passung.js`) mitziehen.
**Aufwand:** klein. **Wirkung:** kosmetisch, aber sichtbar bei allen …/js…-Passungen.

---

## 🟢 F6 — Kleinkram / Politur (niedrige Priorität)

Einzeln je klein; gesammelt der Vollständigkeit halber.

- **F6a — RTF-Unicode bei Zeichen > U+FFFF (Emoji in „Bezeichnung"):** `rtfEsc` gibt pro JS-Codeeinheit
  `\uNNNN?` aus. Für Zeichen jenseits der BMP (Surrogatpaare, z. B. ein Emoji im Bezeichnungsfeld)
  entstehen zwei Codes > 32767 (`\u55357?\u56832?`), was RTF nicht sauber darstellt. Beleg:
  `RTF u-codes: … \u55357? \u56832? …`. Fix: Surrogatpaare erkennen und in eine gültige RTF-Sequenz
  (oder ein Ersatzzeichen) umsetzen. Betrifft nur exotische Eingaben.

- **F6b — `dataVersion` fest verdrahtet:** In `collectReportCtx`/`currentReportBase` steht der
  Norm-Datenstand hart als `'ISO 286-2:2020'` — auch im Freiform-Bericht (dort wäre ISO 2768) und im
  Pressverband-Kontext (dort zusätzlich DIN 7190). Fix: den Datenstand je nach aktivem Modus/Bereich
  setzen (mind. ISO 2768 im Freiform-Fall).

- **F6c — Totes Markup:** In `DT-ProfiPassung.html` gibt es ein `<input type="file" id="dtFile" hidden>`
  aus einer früheren Ausgabe-Variante; das Öffnen läuft heute über einen dynamisch erzeugten Datei-Input
  (`doLoadDtp`). `#dtFile` wird nirgends verdrahtet → ersatzlos entfernbar (beide HTMLs).

- **F6d — Assistent prüft Nennmaß nur auf „> 0":** `renderAssistantStep` blockt nur `nv > 0`. Werte
  außerhalb 1–500 mm rutschen durch und liefern erst nach „Übernehmen" den regulären Bereichsfehler.
  Freundlicher: schon im Dialog auf 1–500 prüfen (die vorhandene `asNoNominal`-Warnung nutzen).

- **F6e — Overlays ohne Escape/Fokusfalle:** Das Info-Overlay (`openInfo`) und das Sperr-Overlay
  (`showLockedOverlay`) schließen per Backdrop-Klick und ✕, aber nicht per `Esc` und halten den Fokus
  nicht (der Assistent- und Aktivierungsdialog machen beides). Für einheitliche Bedienung/Barrierefreiheit
  denselben Escape-Listener + Fokusfalle ergänzen.

---

## ✅ Ausdrücklich geprüft und **in Ordnung** (kein Handlungsbedarf)

- **ISO-286-Zahlenkern (daten.js):** Bohrungs-Sonderregel (Δ), M6-Norm-Ausnahme (250–315 → ES −9),
  N>IT8-Fußnote, K/N oberhalb IT8 (allgemeine Regel, kein Δ) — alle gegen publizierte Tabellenanker
  korrekt (50 H7 +25/0, 50 K7 +7/−18, 50 N7 −8/−33, 50 P7 −17/−42, 300 M6 −9/−41 …).
- **i18n-Parität:** DE/EN/PT durchgängig vollständig; keine fehlenden Keys in irgendeiner
  Schritt-/Meldungs-/Hinweisfamilie. Einziger „DE==EN==PT"-Treffer ist `brIdeal` = „ideal (U ≤ T/10)"
  — bewusst sprachneutral, kein Fehler.
- **Pressverband (pressverband.js):** zweipfadig gegengerechnet, Grenz-/Sicherheits-/Fügelogik
  konsistent; Testnetz grün.
- **Testversion-Sperre (report.js/guard):** DOM-Smoke B14 bestätigt, dass jede Ausgabe in der
  Testedition blockiert wird.

---

### Vorschlag fürs Abarbeiten
Reihenfolge nach Risiko: **F3** (rechnet still falsch) → **F2** (leerer Export) → **F1** (EN/PT-Nachweis)
→ **F4/F5** → **F6a–e**. Jeder Punkt ist klein genug für den üblichen Fließband-Schritt
(Fix → `node --check` → i18n-Parität → DOM-Smoke → `node test_passung.js` grün → ausliefern → Handy-Test).
Sag einfach, mit welchem Punkt wir anfangen.
