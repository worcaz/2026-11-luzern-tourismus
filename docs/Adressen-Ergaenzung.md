# Adressen und Standorte der Unterkünfte ergänzen

Dieses Dokument beschreibt, wie die fehlenden Adressen und Koordinaten der Unterkünfte beschafft und in den Prototyp übernommen wurden. Es ist so geschrieben, dass der Vorgang wiederholt werden kann.

Stand: 16.11.2026. Alle Betriebe, Preise und Zahlen im Prototyp sind teils echt (Name, Adresse, Preis laut Verzeichnis), teils fiktiv (Logiernächte, Abgaben, Kapazität der Mitgliederhotels).

## Ausgangslage

| Quelle | Inhalt | Lücke |
|---|---|---|
| Mitgliederliste Luzern Hotels (PDF, Stand Oktober 2025) | 71 Betriebe mit Name, Strasse, PLZ, Ort | keine Koordinaten, keine Preise |
| Unterkunftsverzeichnis luzern.com (gespeicherte Seite, 718 Einträge) | Name, Ort, Sterne, «ab»-Preis, Kapazität, Ausstattung | keine Strasse, keine Koordinaten |

## Vorgehen

1. **Verzeichnis auslesen.** Aus der gespeicherten Seite (`.mhtml`) wurde das gerenderte HTML gelesen. Wichtig: Der Inhalt ist quoted-printable-kodiert und muss als Bytes dekodiert werden (`part.get_payload(decode=True)`). Wer ihn mit `get_content()` liest, erhält beschädigte Umlaute (`�`).
2. **Detailseiten abrufen.** Jeder Eintrag hat eine ID (32 Zeichen). Das Verzeichnis kommt von openbooking.ch, und die Detailseite `https://openbooking.ch/de/unterkuenfte/<ID>` enthält maschinenlesbare Daten (JSON-LD) mit `address` (`streetAddress`, `postalCode`, `addressLocality`) und `geo` (`latitude`, `longitude`). Das Skript `tools/crawl.py` ruft alle 718 Seiten nacheinander ab, mit 0.5 Sekunden Pause und neutraler Kennung im User-Agent. Es dauert rund 15 Minuten und ist wiederaufnehmbar (Zwischenstand und Rohdaten in `tools/crawl_out.json`, im Repository abgelegt).
3. **Daten zusammenführen.** `tools/merge.py` schreibt Adresse (`a`), Koordinaten (`lo`, `la`) und eine Qualitätsmarke (`q`) in `assets/data/unterkuenfte.json`:
   - `a` = Strassenadresse vorhanden, Koordinaten aus der Quelle
   - `p` = nur PLZ und Ort, Koordinaten aus der Quelle (meist ungefähr)
   - `o` = Ortsmitte, geschätzt (Rückfall, aktuell nicht mehr nötig; Ortsmitten stehen in `tools/geo_listing.py`)
4. **Mitgliederhotels angleichen.** `tools/apply_hotel_coords.py` ersetzt in `assets/js/hotels.js` Adresse und Kartenstandort der Mitgliederhotels durch die Angaben aus dem Verzeichnis. Die Zuordnung erfolgt über den normalisierten Namen (nur Buchstaben und Ziffern, mindestens 6 Zeichen) und die Gemeinde. Dadurch wurden 50 Hotels angepasst. Die früher von Hand geschätzten Standorte wichen um 80 bis 3000 Meter ab.
5. **Gemeinde und Dubletten bestimmen.** `tools/enrich.py` ordnet jeden Eintrag über seine Koordinaten (Punkt-in-Polygon mit den echten Gemeindegrenzen aus `assets/data/geo/gemeinden.json`) einer Gemeinde zu (Feld `gm`, 297 Einträge im Kanton Luzern) und verweist auf das passende Mitgliederhotel (Feld `lh`, 50 Einträge), damit nichts doppelt erscheint.
6. **In die App übernehmen.** Die App lädt `unterkuenfte.json` bei Bedarf (`assets/js/listing.js`): Die Kantonskarte zeigt je Gemeinde Zahl der Unterkünfte und Durchschnittspreis, die Kantons-Übersicht eine Kurzübersicht, die Seite «Unterkünfte» alle 718 Punkte. Die Stadt Luzern zeigt zusätzlich die 85 Einträge in der Stadt, die nicht zu den Mitgliederhotels gehören, im Register und auf der Stadtkarte. Kapazität und Logiernächte dieser Betriebe sind aus den Angaben des Verzeichnisses abgeleitet bzw. fiktiv, Preise stammen aus dem Verzeichnis.
7. **Datenstand anheben.** In `assets/js/data.js` wurde `v` erhöht, damit der Browser den alten Demo-Stand (localStorage) verwirft.

## Ergebnis

- 718 von 718 Einträgen haben Adresse (mindestens PLZ und Ort) und Koordinaten.
- 319 Einträge haben eine Strassenadresse: alle Hotels, B&B, Hostels und Gruppenunterkünfte sowie 30 Ferienwohnungen.
- 399 Einträge (fast nur Ferienwohnungen) haben nur PLZ und Ort. Die Quelle gibt hier absichtlich ungefähre Koordinaten an.
- Keine Koordinate liegt ausserhalb von Zentralschweiz und Umgebung.

## Was nicht funktioniert hat (und warum)

- **Direkter Abruf von `luzern.com/de/informieren/unterkuenfte`:** lieferte Serverfehler (500/502). Die Liste wird im Browser nachgeladen. Deshalb wurde die im Browser gespeicherte Seite verwendet.
- **Websuche je Betrieb:** liefert bei Hotels volle Adressen, bei Ferienwohnungen nur PLZ und Ort, und wäre für 718 Betriebe sehr aufwendig gewesen. Wurde nicht eingesetzt, weil die Detailseiten dieselben Daten direkt liefern.
- **Geokodierung über OpenStreetMap (Nominatim):** funktioniert technisch (Test mit «Seestrasse 52, 6353 Weggis»), war aber nicht nötig, weil die Quelle die Koordinaten mitliefert. Wenn Adressen ohne Koordinaten dazukommen, ist Nominatim der nächste Schritt (höchstens 1 Anfrage pro Sekunde, eigene Kennung im User-Agent, Nutzungsbedingungen beachten).

## Wiederholen oder ergänzen

```bash
# 1. Detailseiten abrufen (schreibt tools/crawl_out.json; vorhandene Einträge werden übersprungen)
python3 tools/crawl.py
# 2. Ergebnisse in unterkuenfte.json übernehmen
python3 tools/merge.py
# 3. Mitgliederhotels angleichen
python3 tools/apply_hotel_coords.py
# 4. Gemeinde und Dubletten bestimmen
python3 tools/enrich.py
```

Die Skripte finden das Projektverzeichnis selbst. Für neue Betriebe müssen sie zuerst mit ID, Name und Ort in `assets/data/unterkuenfte.json` stehen.

## Rechtliches und Qualität

- Die Rohdaten (`tools/crawl_out.json`) enthalten nur Adresse und Koordinaten je ID.
- Die Adressen sind auf den öffentlichen Detailseiten der Quelle veröffentlicht. Vor einer Nutzung ausserhalb dieses Prototyps die Nutzungsrechte bei Luzern Tourismus klären.
- Bei Ferienwohnungen mit nur PLZ und Ort die Position nicht als Adresse behandeln.
- Die Zuordnung der Mitgliederhotels über den Namen kann einzelne Fehler enthalten. Die Namen lassen sich in `tools/apply_hotel_coords.py` mit der Liste abgleichen, bevor Standorte weiterverwendet werden.
- Kartengrundlagen (Gemeindegrenzen, Seen) siehe README, Abschnitt «Kartengrundlagen».
