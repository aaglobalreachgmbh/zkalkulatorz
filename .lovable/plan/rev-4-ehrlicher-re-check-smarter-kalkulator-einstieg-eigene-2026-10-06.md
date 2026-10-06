# Rev 4 – Ehrlicher Re-Check, smarter Kalkulator-Einstieg, eigene Produkte, Demo-Befüllung

Rahmen: Rechenlogik, Rechte, Kundensitzung und echte Kundendaten bleiben unverändert. Alles Neue ist frontend-seitig und mit Demo-Daten befüllt. Demo-Inhalte bleiben klar markiert und getrennt von echten Daten.

## 1. Knallharter Re-Check (zuerst, ohne Änderungen)
- Jede Rolle (Shop/POS, Händler, Direct Store, Außendienst, Hybrid, Teamleiter) einmal im Browser durchklicken: Startseite, Navigation, Kalkulator bis PDF, Kunden, Demo-Betrieb.
- Screenshots bei 1366x768 (Desktop-Ziel) und Tablet-Breite.
- Ergebnisliste in drei Spalten: "behalten", "vorher besser / von mir verwischt", "entfernen oder einklappbar".
- Ehrlich prüfen, ob die letzten Umbauten etwas verschlechtert haben (z. B. versteckte Werkzeuge unter "Weitere Werkzeuge", neue Schriften, kompakte Übersicht) und das Ergebnis vor Schritt 2 im Chat berichten.
- Marktabgleich: Herstellerangaben (MoCare, C.A.T., akviz u. a.) gezielt zum Kalkulator-Einstieg (Bundles, Vorschläge, Aktionen) ergänzen; klar als Herstellerangabe gekennzeichnet.

## 2. Kalkulator: Vorschläge sofort beim Gerät
Sobald ein Handy gewählt wird, erscheint ein schlankes Vorschlagsfeld (einklappbar, manuelle Wahl bleibt immer möglich):
- "Passt oft dazu": 2-3 Tarif-Vorschläge zum Gerät.
- "Aktionen jetzt": laufende Aktionen/Promos zum Gerät.
- "Meine Bundles": eigene und Firmen-Vorlagen mit einem Klick übernehmen.
- Vorschläge folgen dem Betreiberfokus: pro Betrieb einstellbare Fokusziele (z. B. mehr Festnetz, mehr VVL, Marge, Energie-Kreuzgeschäft) und eigene Tarifauswahl.
- "Als Vorlage speichern" direkt aus der aktuellen Auswahl.
- Händlerwerte (Marge, Provision) in Vorschlägen nur sichtbar, wenn Kundensitzung aus ist.

## 3. Eigene Tarife, Leistungen, Produkte (Import-Werkzeug)
- Neue Seite "Eigene Produkte": Liste eigener Angebote (z. B. Zubehör, Service-Pakete, Strom/Gas, Versicherungen).
- Import per XLSX/CSV mit Spaltenzuordnung, Vorschau und Fehlerhinweisen; Vorlage zum Herunterladen.
- PDF: nur als Vorschau/Platzhalter "Daten aus PDF übernehmen" mit Demo-Ergebnis, ehrlich als Simulation markiert (echtes PDF-Auslesen wäre ein eigener späterer Schritt).
- Eigene Produkte erscheinen im Kalkulator als zusätzliche Positionen und in den Vorschlägen.
- Vorhandenen Provisions-Listen-Import nicht anfassen, nur verlinken.

## 4. Darstellung und Typografie
- Einheitliche Kopfzeilen, Abstände und Kartenstil auf Startseite, Kalkulator, Demo-Seiten.
- Schriftgrößen-Skala für Zahlen (Preis/Marge groß und sofort lesbar), ruhigere Sekundärtexte.
- Leere Zustände überall durch sinnvolle Demo-Inhalte oder klare Hinweise ersetzen.

## 5. Alles mit Demo-Daten befüllen
- Demo-Firma erweitert um: Bundles, Aktionen, Fokusziele, eigene Produkte, Beispiel-Kunden mit Historie, Tagesaufgaben, Provisionsabgleich.
- Nur sichtbar bei eingeschaltetem Demo-Modus; Badge "Demo" überall dort.
- Abschluss-QA: Build, Tests, Browser-Durchlauf je Rolle, ehrlicher Abschlussbericht (was funktioniert, was simuliert ist, was offen bleibt).

## Technische Details
- Vorschlagslogik als reine Funktion (Gerät + Fokusprofil + Katalog + Bundles -> sortierte Vorschläge), testbar, ohne Eingriff in die Engine.
- Fokusziele und eigene Produkte zunächst im bestehenden, nutzerbezogenen lokalen Speicher (tenant/dept/user-Schlüssel); später optional Datenbank.
- XLSX/CSV-Parsing mit vorhandener Import-Infrastruktur wiederverwenden, sofern beim Re-Check passend.
- Keine Änderungen an Datenbank, Rechten, Edge Functions oder Rechenengine.
