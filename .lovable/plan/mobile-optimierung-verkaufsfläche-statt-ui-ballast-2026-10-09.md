# Mobile-Optimierung: Verkaufsfläche statt UI-Ballast

## Ziel
Die wichtigsten Arbeitswege sollen auf dem Smartphone schnell und ohne verdeckte Inhalte funktionieren: Startseite, Navigation, Kalkulator, Festnetzprüfung, Angebotskorb und eigene Produkte. Desktop bleibt in Aufbau und Informationsdichte erhalten.

## Verifizierte Störenfriede
- Auf normalen Seiten belegt die mobile Kopfzeile aktuell 80 px; Logo, Herausgeberzeile, Erinnerungen, Info und Benutzer-Menü konkurrieren um eine schmale Zeile.
- Im Kalkulator stapeln sich App-Kopfzeile, eine zweite 48-px-Kalkulatorleiste, die 44-px-Schrittnavigation und später die feste Angebotsleiste. Dadurch bleibt zu wenig Raum für die eigentliche Auswahl.
- Die Festnetz-Adressfelder und Technologiekarten bleiben auch auf kleinen Breiten zwei- bzw. dreispaltig. Das ist praktisch zu eng; die beiden gesperrten Folgeschritte erzeugen zusätzlich Höhe ohne Bedienwert.
- Vorschläge nach der Gerätewahl sind mobil standardmäßig vollständig geöffnet. Sie sind nützlich, verdrängen aber die manuelle Tarifwahl.
- Die mobile Navigation funktioniert bereits als seitliches Menü, schließt sich nach einer Zielauswahl aber nicht ausdrücklich selbst.
- „Eigene Produkte“ stapelt Datensätze mobil, die Preiswerte verlieren dabei jedoch ihre klare Feldzuordnung.

## Was sichtbar bleibt
- Menü, Firmenidentität, aktueller Kalkulationsschritt und Kunden-/Händlermodus.
- Primäre nächste Aktion sowie die mobile Preis-/Angebotsleiste nach einer gültigen Auswahl.
- Manuelle Tarifwahl, Verfügbarkeitsprüfung, Validierungswarnungen und Warenkorbstand.
- Demo-Kennzeichnungen und Schutz sensibler Händlerwerte.

## Was mobil reduziert oder eingeklappt wird
- Herausgeber-Unterzeile, doppelte Seitentitel und sekundäre Kopfzeilenaktionen.
- Vorschläge, Aktionen und Vorlagen: kompakte Zusammenfassung nach Gerätewahl, Details auf Fingertipp.
- Gesperrte Festnetz-Folgeschritte: ein kurzer Fortschrittshinweis statt zwei eigener Karten.
- Lange Hilfs- und Beschreibungszeilen in Startkarten; keine Funktion wird entfernt.

## Umsetzung
1. **Mobile Grundstruktur bereinigen**
   - Kopfzeile auf eine kompakte, kollisionsfreie Zeile reduzieren; unwichtige Aktionen ins Benutzer-Menü verschieben.
   - Seitenmenü nach Navigation schließen und Touch-Ziele konsistent groß halten.
   - Sichere Abstände für Geräte mit unterem Systembereich berücksichtigen.

2. **Kalkulator auf eine Arbeitsebene verdichten**
   - Doppelte mobile Kopfbereiche zusammenführen: kompakte Werkzeugzeile plus klarer Schrittstatus.
   - Inhalt darf intern scrollen; Preis-/Hinzufügen-Leiste bleibt sichtbar, ohne Felder oder den letzten Listeneintrag zu verdecken.
   - Modus und Zusatzaktionen platzsparend, aber weiterhin erreichbar darstellen.

3. **Kernschritte für den Daumen optimieren**
   - Festnetzadresse mobil einspaltig; Straße/Hausnummer und PLZ/Ort erhalten lesbare Mindestbreiten.
   - Technologien mobil als gut antippbare Liste oder horizontale Auswahl statt drei gequetschter Karten.
   - Verfügbarkeitsaktion über volle Breite; unwirksame gesperrte Karten zusammenfassen.
   - Vorschlagsbereich mobil zunächst kompakt; ausgewählter Top-Vorschlag bleibt als Schnellaktion sichtbar.

4. **Startseite und ergänzende Werkzeuge ordnen**
   - „Neues Angebot“ bleibt erste Aktion; Arbeitsmodus und weitere Schnellstarts werden darunter kompakter.
   - Produktzeilen bekommen mobil eindeutige Bezeichnungen für monatlich, einmalig und Provision.
   - Kartenabstände und Überschriften auf kleinen Displays vereinheitlichen, ohne Demo- und Echtdaten zu vermischen.

5. **Bedienprüfung**
   - Kritische Wege prüfen: Vorschau ohne Login, Seitenmenü, neues Angebot, Gerät → Vorschlag → Tarif → Hinzufügen, Festnetzadresse → Technologie → Tarif, Zusatzleistung, eigene Produkte.
   - Auf schmale und große Smartphones sowie Tablet prüfen: kein horizontaler Überlauf, keine verdeckten Aktionen, keine Textkollisionen, Tastatur verdeckt keine Formularaktion.
   - Bestehende Tests, Typprüfung und aktuellen Vorschau-Status kontrollieren; Rechenlogik, Datenrechte und Backend bleiben unverändert.

## Technische Grenzen
- Änderungen betreffen ausschließlich Darstellung und Bedienfluss im Frontend.
- Keine Tarif-, Margen-, Provisions- oder Angebotsformel wird verändert.
- Keine Datenbank-, Rechte- oder Anmeldeänderung.
- Desktop-spezifischer Zero-Scroll-Aufbau bleibt erhalten; mobile Regeln werden gezielt ergänzt.
