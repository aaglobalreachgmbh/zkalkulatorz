# Überschneidungen, Typografie und Barrierefreiheit korrigieren

## Ziel
Die Startübersicht und vergleichbare Ansichten sollen auf Laptop, großen Bildschirmen und Mobilgeräten ohne abgeschnittene Texte, kollidierende Statusflächen oder unleserliche Karten funktionieren. Die Informationsdichte bleibt vertriebstauglich, aber Inhalte dürfen nicht durch starre Spalten oder pauschales Abschneiden verloren gehen.

## Bestätigte Ursachen
- Die vier „Heute“-Karten werden bereits ab der Desktop-Stufe gleich breit nebeneinander gesetzt. Im vorhandenen Inhaltsbereich werden dadurch besonders „Fällige Verlängerungen“ und „Kreuzgeschäft-Chancen“ zu schmal.
- Kartenzeilen verteilen Langtext und Status/Preis in einer einfachen Zeile, ohne dem Text einen sauber begrenzten, umbrechenden Bereich zu geben. Die Statusfläche verdrängt oder überdeckt dadurch den Namen.
- Die globale Regel `overflow: hidden` für Karten verbirgt überstehenden Inhalt, statt die eigentliche Anordnung zu korrigieren.
- Aktuell verhindern drei doppelt gesetzte Beschriftungsattribute in „Eigene Produkte“ und „Kasse“ einen fehlerfreien Build. Diese stammen aus der letzten Barrierefreiheitsanpassung.

## Umsetzung
1. **Aktuelle Fehler zuerst beseitigen**
   - Die doppelten Beschriftungsattribute bereinigen und die vorhandenen deutschen Namen beibehalten.
   - Danach Typprüfung und Build als Ausgangsbasis prüfen.

2. **„Heute“-Übersicht belastbar aufbauen**
   - Die Karten erst dann vier-spaltig darstellen, wenn der tatsächlich verfügbare Inhaltsbereich breit genug ist; dazwischen zwei Spalten, mobil eine Spalte.
   - Lange Kundennamen und Themen kontrolliert umbrechen oder sinnvoll kürzen, Preise und Status rechts stabil halten.
   - Verlängerungsstatus als kompakte, nicht kreisförmig zusammengedrückte Kennzeichnung darstellen; Text und Kennzeichnung erhalten getrennte Bereiche.
   - Kreuzgeschäft-Chancen als klare, mehrzeilige Zeilen mit ausreichend Platz für Kunde und Chance gestalten.
   - Überschriften, Innenabstände und Zeilenhöhe vereinheitlichen, damit alle vier Karten gleich ruhig und gut scannbar wirken.

3. **Ähnliche Kollisionen app-weit korrigieren**
   - Startseite, Demo-Seiten, Angebotsdialoge, Tabellen/Karten und Einstellungen gezielt auf starre Mehrspalten, feste Breiten, erzwungene Einzeiligkeit und abgeschnittene Aktionsleisten prüfen.
   - Nur bestätigte Problemstellen ändern; fachliche Abläufe, Daten und Navigation bleiben unverändert.
   - Die pauschale Karten-Abschneideregel auf sichere Ausnahmefälle begrenzen, damit Inhalte nicht still verschwinden.

4. **Typografie und Barrierefreiheit konsistent machen**
   - Überschriftenhierarchie, lesbare Zeilenhöhen, Zahlen-/Preis-Ausrichtung und Kontrast in den betroffenen Ansichten angleichen.
   - Symbolschaltflächen eindeutig benennen, doppelte Attribute entfernen und wichtige mobile Tippflächen auf mindestens 44 × 44 Pixel bringen.
   - Tastaturfokus, Screenreader-Namen und semantische Struktur der geänderten Ansichten prüfen.

5. **Sichtprüfung mit realistischen Inhalten**
   - Öffentlichen Demo-Modus mit den vorhandenen langen Namen und Statuswerten testen.
   - Ansichten bei 390 Pixel Mobilbreite, 1366 × 768, der aktuellen breiten Vorschau und vergrößerter Schrift prüfen.
   - Automatisch auf horizontales Überlaufen, überdeckte Elemente und unbenannte Bedienelemente prüfen; anschließend Typprüfung, Tests und Build ausführen.

## Abgrenzung
- Keine Änderung an Berechnungen, Demo-Daten, Rollen oder Cloud-Funktionen.
- Texte werden nicht einfach ausgeblendet, um Kollisionen zu kaschieren; die Anordnung wird an den verfügbaren Platz angepasst.