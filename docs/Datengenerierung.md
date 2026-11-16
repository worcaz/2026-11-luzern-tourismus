# Realistische Betriebs- und Zeitreihendaten (fiktiv)

Alle Zahlen zu Logiernächten, Belegung, Umsatz und Abgaben sind **erzeugt**, nicht gemessen. Sie sind so gebaut, dass sie untereinander stimmig sind und an reale Muster der Zentralschweiz angelehnt bleiben. Echt sind nur Name, Ort, Adresse, Sterne, Ausstattung, Kapazität (bei Ferienwohnungen) und «ab»-Preis aus dem Verzeichnis von Luzern Tourismus.

Stand: 16.11.2026. Skripte: `tools/generate.py` (Betriebe), `assets/js/timeseries.js` (Vergangenheit). Wiederholen: `python3 tools/generate.py` (nach `tools/enrich.py`), danach in `assets/js/data.js` die Version `v` erhöhen.

## 1. Betriebsmodell (`tools/generate.py`)

Je Betrieb werden aus den bekannten Angaben berechnet: Zimmer (`rm`), Betten (`bt`), Ø Zimmerpreis (`ad`), mittlere Belegung (`oc`), Logiernächte je Monat (`m`, Personen) und Beherbergungsumsatz je Monat (`rv`, CHF) für Januar bis Oktober 2026.

| Grösse | Ableitung |
|---|---|
| Preis | «ab»-Preis des Verzeichnisses (Doppelzimmer je Nacht bzw. Woche geteilt durch 7). Fehlt er, wird er nach Sternen und Gebiet geschätzt (5★ 380, 4★ 230, 3★ 165, 2★ 125 CHF). Der Ø Zimmerpreis liegt 22 % über dem «ab»-Preis (Hotels) bzw. 8 % (Ferienwohnungen). |
| Kapazität | Ferienwohnungen und Gruppenunterkünfte: Angaben der Quelle (Personen, Schlafzimmer). Hotels: nach Sternen und Gebiet (5★ ≈ 95, 4★ ≈ 75, 3★ ≈ 45 Zimmer, im Berggebiet kleiner). Hostel, B&B und Camping nach Art. |
| Belegung | Basis je Gebiet und Art (Stadt-Hotel 58 %, See 52 %, Berg 47 %, Land 42 %, Ferienwohnung 36–50 %). Zuschläge für Restaurant, Schwimmbad und Parkplatz, Abschlag für Preise über dem Gebietsmittel, betriebsindividuelle Streuung ±12 % und Monatsrauschen ±5 % (über den Hash der ID, also reproduzierbar). |
| Saison | Nachfrageprofil je Gebiet: Stadt (Sommer-Spitze Juli/August), See (stark Sommer), Berg (Winter und Sommer, Flaute im Frühling und Herbst), Land. |
| Logiernächte | belegte Zimmer × Tage × Personen je Zimmer (Stadt 1.7–2.0, übrige 2.0–2.25; Hostel 1.0; Ferienwohnung 70 % der Personen). |
| Umsatz | belegte Zimmer × Ø Zimmerpreis × Saisonpreisindex je Gebiet. |
| Kalibrierung | Die Stadt Luzern wird so skaliert, dass das Verzeichnis 95 % der Logiernächte Januar–Oktober 2026 abdeckt (Anker 1.17 Mio. wie in der App). Belegung höchstens 95 %. |

Die Mitgliederhotels (`assets/js/hotels.js`) übernehmen die Werte ihres Verzeichniseintrags (Verweis `lh` in `unterkuenfte.json`). Ohne Eintrag werden sie mit demselben Modell und ihrer Kapazität gerechnet.

## 2. Gemeinden und Kanton

- Jeder Betrieb gehört über seine Koordinaten zu einer Gemeinde (`gm`, Punkt-in-Polygon mit den swisstopo-Grenzen, Uferlagen über die nächste Gemeinde bis 1.5 km).
- Die Logiernächte einer Gemeinde ergeben sich aus der Summe der Betriebe, geteilt durch den Deckungsgrad des Verzeichnisses (Stadt Luzern 95 %, übrige 55 %), mindestens aber der frühere Richtwert. Regionen und Kanton sind Summen der Gemeinden. Die Kennzahlen der Kantons-Übersicht (Logiernächte, Ertrag der kantonalen Abgabe) sind damit berechnet und nicht mehr fest eingetragen.
- Kantonale Abgabe: Logiernächte × CHF 1.10 (Tarif der App, unverändert seit 2020 angenommen).
- Aufenthaltsdauer: nach Art (Hotel 1.9, B&B 1.8, Hostel 1.6, Ferienwohnung 4.8, Gruppe 2.5, Camping 3.0 Nächte), gewichtet mit den Logiernächten. Bettenauslastung: Logiernächte ÷ (Betten × 304 Tage).

## 3. Vergangenheit ab 1.1.2020 (`assets/js/timeseries.js`)

Die Monatswerte 2020 bis 2025 entstehen aus den Werten 2026 mit einem Faktor je Gebiet, Jahr und Monat (Nachfrage relativ zu 2019, dann auf 2026 umgerechnet):

- **2020:** normale Monate Januar/Februar, Einbruch ab März (Lockdown), im April nur 3–10 % der Normalnachfrage, Sommer mit Inlandgästen bei 60–95 %, Herbst/Winter erneut schwach.
- **2021:** Winter schwach (Stadt 14 %, Berggebiet 50–60 % wegen offener Skigebiete), Sommer 78–95 %.
- **2022:** Erholung. Die Stadt bleibt wegen fehlender Gäste aus Asien und den USA etwas darunter, Berg- und Seegebiete erreichen Vorkrisenniveau.
- **2023–2025:** Normalisierung mit leichtem Wachstum. Der Vorjahresvergleich 2025 → 2026 entspricht je Region der Veränderung auf der Kantons-Übersicht (+5.7 %, +3.1 %, +1.2 %, −2.4 %, +8.9 %).
- **2026:** Januar bis Oktober aus dem Betriebsmodell, November bis 16.11. anteilig (Verhältnis zum Oktober je Gebietsform), Dezember leer.
- **Preise:** Zimmerpreisindex je Jahr (2020 0.90, 2021 0.88, 2022 0.95, 2023 1.00, 2024 1.04, 2025 1.07, 2026 1.10); der Beherbergungsumsatz folgt Nachfrage × Preis.
- **Herkunft:** Anteile der Gäste nach Jahr verschieben sich 2020/21 stark zu Schweiz und Deutschland (Faktoren je Herkunft in `views/insights.js`), Asien und USA kehren ab 2022 zurück.

Wo in der App sichtbar: Karten (Jahresauswahl 2020–2026, Monat/Quartal/Jahr), Karte «Entwicklung seit 2020» auf den Übersichten von Kanton und Stadt, «Herkunft nach Jahr» unter Analysen.

## 4. Grenzen und Vorsicht

- Die Werte sind plausibel, aber nicht belegt. Sie eignen sich für den Prototyp, nicht für Auswertungen oder Aussagen über einzelne Betriebe.
- Zu echten Hotels gehören hier erfundene Zahlen (Zimmer, Belegung, Umsatz). Bei einer Weitergabe darauf hinweisen, dass sie fiktiv sind.
- Rechnungen, Auffälligkeiten und Meldescheine der Demo (Betriebe H1–H6) bleiben die ursprünglichen Demodaten.
