# Eingebettete Logos sauber darstellen

## Ziel
Firmen- und Partnerlogos sollen in Navigation, Kopfzeilen, Branding-Vorschauen und erzeugten PDFs unabhängig vom Seitenverhältnis vollständig, scharf und ohne Layoutsprünge erscheinen.

## Umsetzung
1. Eine gemeinsame Logo-Darstellung für die Weboberfläche ergänzen:
   - fest definierte, responsive Bildfläche
   - `object-contain` statt Beschnitt oder Verzerrung
   - sinnvolle Innenabstände für breite, quadratische und hochformatige Logos
   - Lade- und Fehlerzustand mit Firmenname statt unsichtbarem/defektem Bild
2. Die gemeinsame Darstellung in Seitenleiste, Kopfzeilen, Dashboard, Upload-Vorschau, PDF-Vorschau und White-Label-Vorschau einsetzen.
3. Die Logo-Rahmen in allen PDF-Vorlagen auf ein einheitliches Seitenverhältnis und `contain`-Darstellung abstimmen, ohne PDF-Inhalte oder Berechnungen zu verändern.
4. Desktop- und schmale Ansichten sowie ein fehlendes/defektes Logo visuell prüfen; anschließend die vorhandenen Prüfungen und den aktuellen Build-Status kontrollieren.

## Technische Leitplanken
- Nur Darstellung und Robustheit der Logos ändern; keine Branding-Daten, Berechnungen oder Berechtigungen anfassen.
- Bestehende Designfarben und Komponenten weiterverwenden.
- Für Web-Logos eine kleine wiederverwendbare React-Komponente nutzen; PDF-Logos bleiben in den vorhandenen PDF-Komponenten.
