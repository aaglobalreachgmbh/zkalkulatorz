# Ehrliche Ist-Prüfung (Rev 5) und Korrekturplan

## Was getestet wurde (heute, echt)
- Automatische Tests: 40 bestanden, 3 übersprungen, keine Laufzeitfehler.
- Browser-Durchlauf im Testmodus (1366x768) auf 15 Seiten: Start, Kalkulator, Bundles, Kunden, Angebote, Eigene Produkte, Demo-Betrieb, Kreuzgeschäft, Kampagnen, Provisionskontrolle, Kasse, Außendienst-Tag, VVL, Auswertungen, Arbeitsplatz-Einstellungen. Keine Abstürze.
- Nicht getestet: echter Login mit gespeicherten Daten, PDF-Ausgabe bis zum Ende, KI-Erklärung live, Tablet.

## Bewertung: praktisch vs. nur theoretisch

Praktisch stark (behalten):
- Kalkulator-Kern mit Kunden-/Händleransicht und Kundensitzung — das ist der echte Wert, getestet und stabil.
- Vorschläge nach Gerätewahl — sinnvoll und schnell.
- Testmodus — löst dein Login-Problem in der Vorschau.

Nur theoretisch gut (ehrlich):
- Startseite zeigt beim ersten Öffnen nur „Wie arbeiten Sie?" plus Demo-Knopf — wirkt leer, kein direkter Weg zum Kalkulator.
- Kunden, Angebote, Verträge, Auswertungen sind ohne Login leer, obwohl der Demo-Modus existiert. Die Demo-Firma erscheint nur auf zwei Seiten — genau dort, wo man sie sehen will (Kunden/Angebote), fehlt sie.
- Provisionskontrolle, Kampagnen, Kasse: Seite ist fast leer bis man einen Knopf drückt; wirkt unfertig.
- Eigene Produkte landen nicht im Angebot — Funktion endet in einer Sackgasse.
- PDF-Import bei eigenen Produkten ist Attrappe.
- Zu viele Seiten (57) und Routen (61) für die Zielgruppe; mehrere überschneiden sich (Reporting/Reports, Provisions/Provision-Check, Wizard/Calculator, VVL-Tracker leitet auf Verträge).
- Seitenleiste eingeklappt zeigt nur Symbole ohne Beschriftung — für wenig technikaffine Verkäufer schwer.

Was vorher besser war:
- Klare Startseite mit direktem Kalkulator-Einstieg. Das Rollen-Auswahlfenster hat das verdrängt.

## Korrekturplan (max. 5 Schritte, nur Oberfläche, Rechenlogik unverändert)
1. Startseite: großer „Neues Angebot"-Knopf immer oben; Rollenwahl als kleine Zeile darunter, einmal gewählt verschwindet sie.
2. Demo-Firma sichtbar machen: Bei aktivem Demo-Modus zeigen Kunden, Angebote, Verträge und Auswertungen klar markierte Beispiel-Listen (eigener Bereich „Beispieldaten", nie mit echten vermischt). Leere Zustände bieten „Beispieldaten anzeigen" an.
3. Simulationsseiten (Provisionskontrolle, Kampagnen, Kasse) öffnen direkt mit geladenem Beispiel statt leerer Karte.
4. Eigene Produkte als Position ins Angebot übernehmen (Zusatzzeile im Angebotskorb, nur Kundenpreis in Kundenansicht). PDF-Import-Attrappe entfernen oder als „kommt später" kennzeichnen.
5. Aufräumen: doppelte Seiten in der Navigation zusammenlegen (Reports, Provisionen, Wizard), Seitenleiste standardmäßig mit Beschriftung; danach erneuter Durchlauf mit Screenshots aller Seiten inkl. Tablet.

## Technische Details
- Demo-Listen über `useDemoMode` + `workspace/demoDataset.ts`, gerendert als separate Sektion, echte Query-Hooks bleiben unberührt (AGENTS.md-Regel wird entsprechend erweitert).
- Eigene Produkte: eigene Korb-Position außerhalb der Pricing-Engine, Summe additiv angezeigt; Händlerwerte nur bei `showDealerEconomics`.
- Keine Datenbank-, Rechte- oder Edge-Function-Änderung.
