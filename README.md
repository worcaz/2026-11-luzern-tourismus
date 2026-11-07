# LUMA – Prototyp Soll-Prozess Gästemeldung und Tourismusabgaben

Interaktiver Klick-Prototyp für die gemeinsame elektronische Plattform zur Erhebung der Tourismusabgaben und für das Gästemeldewesen im Kanton Luzern. «LUMA» ist ein Arbeitstitel.

**Live:** https://worcaz.github.io/2026-11-luzern-tourismus/

> Prototyp mit fiktiven Daten. Alle Betriebe, Personen, Nummern und Beträge sind erfunden. Es werden keine Daten übertragen; Eingaben bleiben im Browser (localStorage) und lassen sich über «Demo → Demo zurücksetzen» löschen. Keine offiziellen Logos oder Wappen.

## So nutzen Sie den Prototyp

1. Startseite öffnen und **«Geführte Demo starten»** wählen. Die Tour führt in 10 Schritten durch alle Rollen und folgt der Buchung B-24017 von Claire Martin.
2. Oder direkt eine Ansicht wählen: Gast, Gastgeber, Gemeinde, Polizei, Kanton & LTAG.
3. Oben rechts: Sprache (DE, FR, IT, EN) und Demo-Menü (Tour, Gast-Link, Zurücksetzen).

Jede Rollenansicht zeigt unter dem Titel eine schlanke **Prozesslinie** (Etappe x von 6, Klick führt zum Soll-Prozess). Auf den Übersichten steht zusätzlich die Karte **«Ihr nächster Schritt»** – bewusst nur eine Handlung pro Seite.

## Abdeckung Soll-Prozess (13 Aufgaben)

| Nr. | Aufgabe | Akteur | Art | Ansicht im Prototyp |
|---|---|---|---|---|
| 1 | Objekt einmalig registrieren | Gastgeber | manuell | `#/registrierung` |
| 2 | Register mit Plattform- und Gemeindedaten abgleichen (§ 21a) | Plattform, Gemeinde | teilautomatisch | Registrierung (Abschluss), `#/gemeinde/auffaelligkeiten` |
| 3 | Pre-Check-in-Link an den Gast senden | Plattform | automatisch | `#/gastgeber/ankuenfte` (Status, Erinnerung) |
| 4 | Gästedaten online erfassen, Ausweis scannen | Gast | Self-Service | `#/gast/B-24017` |
| 5 | Ausweis prüfen und Meldung bestätigen | Gastgeber | manuell | `#/gastgeber/ankuenfte` → Check-in |
| 6 | Meldeschein erzeugen, Abgaben berechnen, Gästekarte ausstellen | Plattform | automatisch | Systemprotokoll, `#/gastgeber/meldungen`, Gastansicht |
| 7 | Meldedaten für die Polizei bereitstellen | Plattform, Polizei | automatisch | `#/polizei/suche` |
| 8 | Monatsabrechnung erstellen (QR-Rechnung / eBill) | Plattform | automatisch | `#/gastgeber/abrechnungen` |
| 9 | Abrechnung prüfen und bezahlen | Gastgeber | manuell | `#/gastgeber/abrechnungen` |
| 10 | Zahlungen überwachen, Ausnahmen klären | Gemeinde | teilautomatisch | `#/gemeinde`, `#/gemeinde/abrechnungen`, `#/gemeinde/auffaelligkeiten` |
| 11 | Anteile verteilen | Plattform | automatisch | `#/gemeinde/verteilung` |
| 12 | Aggregierte Kennzahlen | Kanton / LTAG | automatisch | `#/kanton` |
| 13 | Daten nach Ablauf der Fristen löschen | Plattform | automatisch | Systemprotokoll auf `#/prozess` |

## Zusätzliche Funktionen (Annahmen)

- **Mein Konto** je Rolle: Profil, Benutzer und Rechte, Zahlungsverbindung, Benachrichtigungen, Anmeldung (Passkey bzw. AGOV)
- **Am Empfang erfassen** für Gäste ohne Online-Check-in, **Gruppen** mit Teilnehmerliste
- **Korrektur melden** zur Monatsabrechnung, **Einsprache** mit Veranlagungsentscheid
- **Tarife und Befreiungen** zentral pro Gemeinde konfigurierbar
- **Airbnb-Sammelabrechnung** gemäss bestehender Vereinbarung
- **Zugriffsprotokoll** der Polizei, Zweck und Aktenzeichen sind Pflicht
- **Berichte** für Kanton/LTAG (Monatsbericht, Rapport Mittelverwendung, Open Data)

## Annahmen im Prototyp

- Elektronische Meldung ohne Unterschrift; Beherbergende prüfen den Ausweis (VZAE-Vorentwurf 2026).
- Eine Familie auf einem Meldeschein; Ausweisdaten nur der meldenden Person.
- Beherbergende ziehen die Abgaben weiterhin beim Gast ein und zahlen monatlich.
- Polizei- und Abgabedaten getrennt berechtigt (Zweckbindung § 21b TG).
- Tarife sind Beispielwerte; Verteilschlüssel gemäss Reglement der Gemeinde.
- Anbindung an EasyGov ist eine Variante, die im Konzept zu entscheiden ist.

## Technik

Statische Web-App ohne Build-Schritt (HTML, CSS, JavaScript-Module), ausgeliefert über GitHub Pages. Keine externen Bibliotheken, Schriften oder Tracker. Responsiv für Handy, Tablet und Desktop.

```
index.html
assets/css/styles.css
assets/js/app.js            Router, Layout, Ereignisse
assets/js/i18n.js           Übersetzungen DE/FR/IT/EN
assets/js/data.js           fiktive Demodaten
assets/js/store.js          Zustand, Berechnungen
assets/js/process.js        Etappen, Aufgaben, Prozess-Navigator
assets/js/tour.js           geführte Demo
assets/js/views/*.js        Ansichten je Rolle
```

Lokal starten: `python3 -m http.server` im Repository und `http://localhost:8000` öffnen.

---
Wiesionell · Mike Hächler · November 2026
