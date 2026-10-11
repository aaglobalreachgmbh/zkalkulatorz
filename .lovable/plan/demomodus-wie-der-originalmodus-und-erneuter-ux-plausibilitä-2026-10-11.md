# Demomodus wie der Originalmodus und erneuter UX-Plausibilitätscheck

## Ziel
Der Demomodus nutzt dieselben Seiten, Navigation, Filter, Tabellen, Detailansichten und Kalkulator-Abläufe wie der Originalmodus. Nur die Datenquelle wechselt. Beispieldaten bleiben eindeutig gekennzeichnet, vollständig von Echtdaten getrennt und können keine echten Nachrichten, Dateien oder Datensätze verändern.

## Belegter Ist-Zustand
- Der globale Demostatus liegt bereits benutzerbezogen im Browser und lässt sich in den Arbeitsplatz-Einstellungen umschalten.
- Kunden, Angebote, Verträge und Auswertungen zeigen Demo-Inhalte aktuell als zusätzliche, getrennte Blöcke unter den echten Ansichten. Dadurch sieht und bedient sich die Demo nicht wie der Originalmodus.
- Startseite und Demo-Betrieb verwenden eigene Demo-Komponenten; der eigenständige Demo-Betrieb bildet daher eine zweite Oberfläche neben dem normalen Portal.
- Der Kalkulator nutzt „Demo-Modus“ derzeit zusätzlich für einen unvollständigen Katalog-Fallback und `?demo=true` für eine Beispielkonfiguration. Diese Bedeutungen sind nicht deckungsgleich mit dem globalen Demo-Schalter.
- Der vorhandene Demo-Datensatz umfasst Kunden, Angebote, Verträge, Termine, VVL, Ziele und Cross-Selling-Chancen, aber noch nicht alle Felder und Verknüpfungen, die normale Detailseiten und Aktionen erwarten.
- Die aktuelle Vorschau protokolliert weiterhin Rechtefehler bei mehreren Backend-Helfern. Der neue Demomodus darf deshalb nicht unbemerkt auf fehlerhafte Echtabfragen zurückfallen; die Rechtefehler selbst sind nicht Teil dieses Frontend-Plans.

## UX-Ergebnis der erneuten Recherche
- Eine überzeugende Produktdemo sollte einen konkreten Kernablauf vom Ausgangspunkt bis zum Ergebnis zeigen, statt separate Oberflächenfragmente zu präsentieren.
- Plausible Demo-Daten sollten stabil, zusammenhängend, zurücksetzbar und von externen Integrationen isoliert sein.
- Für Telekommunikationsvertrieb sind wenige Tastendrücke, geführte Bedarfsermittlung, passende Angebote, Warenkorb, VVL sowie Up- und Cross-Selling die belastbaren Kernmuster.
- MOCARE bestätigt als Marktmuster zentrale Kundenakten, Verträge, Margen-/Provisionskontrolle, Auswertungen und mobile Nutzung. Das rechtfertigt vertraute Begriffe und dichte Arbeitsansichten, aber keinen visuellen Nachbau.
- Der UX-Fokus bleibt deshalb: Angebot zuerst, Kunde und Bestand im Kontext, Verwaltung danach.

## Umsetzung

### 1. Eine eindeutige Demo-Sitzung
- Den bestehenden Demo-Schalter zum einzigen Modus für Beispieldaten machen.
- Im aktiven Modus eine schlanke, dauerhaft sichtbare Leiste „Demomodus – nur Beispieldaten“ mit den Aktionen **Zurücksetzen** und **Demomodus verlassen** anzeigen.
- Den separaten Navigationseintrag „Demo-Betrieb“ entfernen; der Einstieg erfolgt über Startseite oder Arbeitsplatz-Einstellungen.
- Den Katalog-Fallback sprachlich von der echten Demo-Sitzung trennen, damit fehlende Firmendaten nicht als vollständiger Demomodus erscheinen.

### 2. Gleiche Seiten, wechselnde Datenquelle
- Kunden, Angebote, Verträge und Auswertungen behalten exakt ihre normalen Seiten und Bedienelemente.
- Ein kleiner Demo-Datenadapter liefert im Demomodus kompatible Datensätze an diese Ansichten; außerhalb des Demomodus bleiben die bestehenden Echt-Hooks unverändert.
- Demo- und Echtdaten werden niemals in einer Liste zusammengeführt. Die bisherigen zusätzlichen `DemoListSection`-Blöcke und Demo-Leerzustandsknöpfe entfallen.
- IDs und Beziehungen werden so ergänzt, dass Kunde → Angebote → Verträge nachvollziehbar durchgeklickt werden kann.
- Der Demo-Datensatz bleibt lokal, deterministisch und enthält keine echten Identitäten.

### 3. Realistischer Vertriebsablauf
- Auf der normalen Startseite zeigt der Demomodus dieselben Tagesmodule, Kennzahlen und Hauptaktionen, die der Originalmodus bei gefüllten Daten verwenden soll.
- Kernstrecke: offenen Vorgang wählen → Kunde öffnen → Kalkulator starten → Vorschläge prüfen → Warenkorb → Angebotsvorschau.
- Der Kalkulator bleibt derselbe. Eine Beispielkonfiguration wird nur auf ausdrückliche Auswahl geladen, nicht automatisch durch einen versteckten URL-Parameter.
- Cross-Selling, VVL und Festnetz erscheinen kontextbezogen am Demo-Kunden, ohne den manuellen Kalkulationsweg zu verdrängen.

### 4. Sichere, glaubwürdige Aktionen
- Lesende Aktionen, Filter, Suche, Sortierung, Tabs und Detailnavigation funktionieren wie im Originalmodus.
- Schreibende Demo-Aktionen werden lokal simuliert und sichtbar bestätigt; sie dürfen niemals Backend-Mutationen, E-Mails, Exporte mit falschem Echtstatus oder externe Integrationen auslösen.
- Für nicht sinnvoll simulierbare Funktionen erscheint ein kurzer klarer Hinweis statt einer scheinbar erfolgreichen Aktion.
- **Zurücksetzen** stellt jederzeit den definierten Ausgangszustand wieder her.

### 5. Visuelle Plausibilität und Klarheit
- Demo-Kennzeichnung nur als globale Leiste und dezentes Statuszeichen; keine wiederholten „erfunden“-Badges in jeder Zeile oder Karte.
- Dieselben Lucide-Icons, Abstände, Tabellen, Statusfarben, Dialoge und mobilen Aktionen wie im Originalmodus verwenden.
- Startseite nicht mit Rollenwahl und Demo-Erklärung überladen: primäre Aktion, Tagesarbeit und offene Chancen stehen zuerst; Arbeitsplatzanpassung bleibt nachgeordnet.
- Keine MOCARE-/easyfilius-Farben, Texte oder Bildschirmaufbauten kopieren. Übernommen werden nur plausible Branchenmuster wie klare Kundenakte, VVL-Priorität und kurze Wege.

## Technische Leitplanken
- Keine Änderung an Berechnungsengine, Angebotsformeln, Rechten oder Backend-Schema.
- Echt-Hooks behalten ihr Fehler- und Berechtigungsverhalten; Demo-Hooks liefern ausschließlich lokale sichere Daten.
- Sensible Händlerwerte bleiben auch im Demomodus an Kunden-/Händleransicht und Kundensitzung gebunden.
- Die bisherige Architekturregel „Demo nur auf separaten Flächen“ wird gezielt ersetzt durch: gleiche Oberfläche, strikt alternative Datenquelle, niemals Datenmischung.

## Prüfung
- Desktop 1366×768 und Mobil: Start → Kunden → Kundendetail → Kalkulator → Warenkorb → Angebotsvorschau.
- Demomodus ein/aus auf jeder Kernseite: kein Vermischen, kein kurzer Echtdaten-Flash, keine verlorene Navigation.
- Suche, Filter, Sortierung und Detailverknüpfungen auf Kunden, Angeboten, Verträgen und Auswertungen.
- Schreibaktionen mit Netzwerkkontrolle: im Demomodus keine echte Mutation und kein externer Versand.
- Kundensitzung: Marge, EK und Provision bleiben vollständig verborgen.
- Reset stellt den Ausgangsdatensatz wieder her; erneutes Laden erhält den gewählten Modus.
- Abschließend Typprüfung, Lint, bestehende 40 Tests und Browserprüfung ohne Seitenfehler.

## Nicht Teil dieses Umbaus
- Keine Kassen-/GoBD-, Warenwirtschafts- oder vollständige ERP-Simulation.
- Keine Behauptung, MOCARE oder easyfilius bereits vollständig ersetzen oder deren Daten direkt importieren zu können.
- Keine Behebung der separat beobachteten Backend-Rechtefehler innerhalb dieses Frontend-Umbaus.
