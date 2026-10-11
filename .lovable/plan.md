# Prüfung und Feinschliff: Fehler, Überschneidungen, Zentrierung, Typografie, Barrierefreiheit

## Ausgangslage (bereits geprüft)
- Vorschau meldet zuletzt einen Absturz „Too many re-renders“ (Endlosschleife einer Ansicht). Auslösende Seite noch nicht bestätigt.
- 78 Symbol-Schaltflächen ohne Beschriftung für Screenreader.
- 9 Bilder ohne Alternativtext.
- Mehrere Bereiche setzen eigene Hauptbereiche (`<main>`) zusätzlich zum Rahmenlayout – doppelte Orientierungspunkte.
- 99 Stellen mit festen Farben (grau/weiß/schwarz) statt Designfarben – Kontrast- und Dunkelmodus-Risiko.
- `h-screen` an ca. 20 Stellen – auf Handys rutschen Inhalte unter die Browserleiste.

## Schritte
1. **Absturz finden und beheben**: Seiten per Browsertest (Desktop + Handy, normal und Demo) durchklicken, Endlosschleife lokalisieren, Ursache beheben.
2. **Überlappungen und Zentrierung**: Screenshots von Start, Kalkulator, Kunden, Angebote, Eigene Produkte, Einstellungen, Anmeldung bei 1366×768, 1920 und 390 Breite; überlappende Leisten, abgeschnittene Texte, schiefe Ausrichtung korrigieren (gleiche Seitenbreite und Abstände).
3. **Typografie**: einheitliche Überschriftenstufen (h1 → h2 → h3 ohne Sprünge), ruhigere Schriftgrößen-Skala, lesbare Zahlen (tabellarische Ziffern bei Preisen/Margen).
4. **Barrierefreiheit**: Beschriftungen für Symbol-Schaltflächen, Alternativtexte, ein Hauptbereich pro Seite, sichtbarer Tastaturfokus, Tippflächen mind. 44 px auf Handy, feste Farben durch Designfarben ersetzen, `h-screen` → `h-dvh`.
5. **Nachweis**: Typprüfung, Tests, erneute Screenshots vorher/nachher, kurzer Bericht mit offenen Punkten.

## Technische Details
- Keine Änderungen an Berechnungslogik, Datenbank oder Rechten.
- Nur Darstellung/Komponenten; shadcn-Bausteine wiederverwenden, keine eigenen Fokus-Lösungen.
- Hauptbereich nur in `MainLayout`; innere `<main>` werden zu `<div>`/`<section>`.
