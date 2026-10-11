# Startseite, Dashboard und vollständigen Demo-Arbeitsplatz schärfen

## Ehrliche Bewertung gegenüber MoCare und easyfilius

**Gesamturteil:** Das Portal ist im vertrieblichen Kern innovativer, aber als sichtbares Gesamtsystem noch weniger geschlossen als die etablierten Wettbewerber. Die Stärke liegt nicht darin, heute schon Kasse, Warenwirtschaft oder Backoffice vollständig zu ersetzen, sondern im geführten Weg von Kundenbedarf über Kalkulation und Marge bis zum verständlichen Angebot.

### Wo das Portal bereits stärker positioniert ist
- **Verkauf zuerst:** Kalkulation, Angebot und Kundengespräch bilden den Kern statt einer aus Warenwirtschaft oder Kasse abgeleiteten Nebenfunktion.
- **Kundenansicht:** Händlerwerte können gezielt ausgeblendet werden; eine vergleichbar klar beworbene Präsentationsansicht ist bei den genannten Wettbewerbern öffentlich nicht belegt.
- **Verständlichkeit:** KI-gestützte Angebotserklärungen sind in den öffentlich auffindbaren Leistungsbeschreibungen von MoCare und easyfilius nicht erkennbar.
- **Individualisierung:** Nutzerprofile, Arbeitsweisen, Paletten, Bundles, eigene Produkte und Verkaufsziele ermöglichen perspektivisch persönlichere Arbeitsplätze als ein starres Branchensystem.
- **Demo und Schulung:** Ein isolierter Beispielbetrieb kann den gesamten Ablauf ohne echte Kundendaten erlebbar machen.

### Wo die Wettbewerber heute reifer wirken
- **Geschlossenes Tagesgeschäft:** MoCare und easyfilius präsentieren Kasse, Kundenakte, VVL, Bestand, Auswertung und Verwaltung als zusammenhängendes Betriebssystem.
- **Sofort erkennbare Übersicht:** Beide bewerben Dashboard- beziehungsweise Kennzahlenansichten als normalen Einstieg. Im Portal ist das konfigurierbare Dashboard aktuell faktisch versteckt.
- **Vertraute Branchenbegriffe:** VVL, Filialen, Kasse, Lager und Angebotsvorlagen sind klar benannte Arbeitsbereiche. Im Portal liegen wichtige Funktionen teilweise in eingeklappten Gruppen.
- **Reifeerwartung:** Bei etablierten Lösungen erwartet der Markt stabile Kassen-, Warenwirtschafts-, DATEV-/TSE- und Bestandsabläufe. Diese Breite besitzt das Portal noch nicht und soll im ersten Abschnitt nicht vorgetäuscht werden.

### Knallhartes UX-Urteil
- Die aktuelle Oberfläche ist technisch umfangreich, aber ihre Informationsarchitektur vermittelt diese Stärke nicht zuverlässig.
- „Start“ ist sichtbar; verschwunden wirkt das Dashboard, weil der Standard **Cockpit** nur Schnellzugriffe zeigt. Das echte Karten-Dashboard erscheint ausschließlich im Layout **Klassisch**.
- Die Umschaltung liegt auf einer separaten Arbeitsplatzseite, die weder in der Seitenleiste noch in der Befehlssuche gut auffindbar ist.
- Werkzeuge, Einstellungen und beide Verwaltungsgruppen sind standardmäßig eingeklappt. Das hält die Navigation ruhig, widerspricht aber dem Wunsch, im Demo-Modus das vollständige System entdecken zu können.
- Der Demo-Modus schaltet die Ansicht auf Superadmin-Niveau, sperrt Verwaltungsaktionen aber nicht durchgängig sichtbar. Sich allein auf serverseitige Ablehnung zu verlassen, ist für eine überzeugende Demo weder sauber noch verständlich.
- Die aktuelle Vorschau protokolliert weiterhin einen Berechtigungsfehler beim Firmen-Branding (`is_same_tenant`). Dieser Fehler ist nicht die Ursache des versteckten Dashboards, muss aber getrennt behoben werden und darf nicht als gelöste Demo-Frage dargestellt werden.

## Zielbild

Die vom Nutzer gewählte Lösung **„Start mit Übersicht“** wird der einheitliche Einstieg. Sie kombiniert eine klare Hauptaktion mit Tageslage, Kennzahlen und anpassbaren Bereichen. Es gibt keinen konkurrierenden, versteckten zweiten Dashboard-Begriff.

Im Demo-Modus sieht und erlebt der Nutzer denselben Aufbau wie im Originalbetrieb – mit vollständiger Navigation und ausschließlich lokalen, erfundenen Daten. Alle gefahrlos simulierbaren Aktionen funktionieren lokal; echte Verwaltungs-, Nachrichten- oder Backend-Aktionen werden verständlich als Demo-Vorschau behandelt und senden nichts.

## Umsetzung

### 1. Startseite zu einer vollständigen Vertriebsübersicht vereinen
- „Start“ bleibt der feste, immer sichtbare erste Menüpunkt mit Haus-Icon.
- Oben stehen **Neues Angebot**, Kundensuche und die wichtigsten offenen Aufgaben.
- Darunter folgt eine kompakte Tagesübersicht mit offenen Angeboten, VVL, Wiedervorlagen, Terminen und Zielerreichung.
- Die vorhandenen Dashboard-Karten werden in diese Startseite integriert, statt nur im schwer auffindbaren Layout „Klassisch“ zu erscheinen.
- Anpassbare Karten bleiben möglich, beginnen aber mit einem sinnvollen rollenbezogenen Standard; Bearbeiten und Zurücksetzen sind sichtbar, ohne die Tagesarbeit zu dominieren.
- Die bisherige Entweder-oder-Logik aus Schnellstart, Cockpit und klassischem Dashboard wird so reduziert, dass kein Inhalt scheinbar „verschwindet“.

### 2. Navigation sichtbar, vollständig und trotzdem beherrschbar machen
- Primär offen sichtbar bleiben: Start, Kalkulator, Angebote, Kunden, Verträge.
- VVL beziehungsweise anstehende Verlängerungen erhalten einen klaren, branchentypischen Zugang innerhalb der Kunden-/Vertragsarbeit.
- Im normalen Modus bleiben seltene Werkzeuge und Verwaltung sinnvoll gruppiert.
- Im Demo-Modus öffnen sich relevante Gruppen standardmäßig und zeigen alle verfügbaren Bereiche mit korrekten Lucide-Icons.
- Die globale Suche erhält Zugänge zu Dashboard-Anpassung, Demo-Umschaltung, Werkzeuge sowie sichtbaren Verwaltungsseiten.
- Keine Emoji, Sonderzeichen oder uneinheitlichen Symbolsysteme in Navigation und Kernansichten.

### 3. Demo als originalgetreuen Superadmin-Arbeitsplatz absichern
- Demo-Modus nutzt dieselben Seiten, Tabellen, Detailansichten, Filter und Navigation wie der Echtmodus; nur die Datenquelle wird exklusiv auf lokale Beispieldaten umgestellt.
- Der globale Demo-Hinweis mit Zurücksetzen und Beenden bleibt dauerhaft sichtbar.
- Kunden-, Angebots- und Vertragsaktionen werden lokal und rücksetzbar simuliert, ohne echte Datensätze zu lesen oder zu verändern.
- Verwaltungsseiten werden sichtbar und nutzbar präsentiert: sichere Einstellungsänderungen werden lokal simuliert; nicht sinnvoll simulierbare Aktionen erhalten einen klaren Demo-Hinweis statt einer echten Anfrage oder eines technischen Fehlers.
- Nachrichten, Einladungen, Benutzeränderungen, Importe, Veröffentlichung und sicherheitskritische Aktionen dürfen im Demo-Modus niemals echte Backend-Aufrufe auslösen.
- Die Anzeige „Superadmin-Demo“ bleibt strikt eine Oberflächenfreigabe und vergibt keine echte Rolle.

### 4. Wettbewerbsnähe ohne Kopie herstellen
- Von MoCare übernehmen wir als Prinzipien: Tagesüberblick, schnelle Kundenakte, sichtbare VVL-Aufgaben und kurze Shop-Wege.
- Von easyfilius übernehmen wir als Prinzipien: klare Angebotsvorlagen, Preis-/Produktregeln und vertraute Tarif-plus-Hardware-Arbeit.
- Nicht kopiert werden Farben, Texte, Screens, Icons oder konkrete Navigation der Wettbewerber.
- Eigene Differenzierung bleibt sichtbar: geführte Margenkalkulation, Kundenansicht, individuelle Verkaufsziele, Cross-Selling und verständliche KI-Erklärung.
- Kasse, TSE, vollständige Warenwirtschaft, Buchhaltung und Reparatur werden nicht als fertige Funktionen dargestellt.

### 5. Visuelle Konsistenz und praktische Dichte
- Helles Enterprise-Cockpit als verbindliche Linie; semantische Marken-, Oberflächen- und Statusfarben statt einzelner Hartcodierungen.
- Eine klare visuelle Hierarchie: Hauptaktion, Tageslage, Arbeitslisten, danach Anpassung und Verwaltung.
- Kompakte, scannbare Tabellen für Desktop; klare Aktionsleisten und erreichbare Details auf Mobilgeräten.
- Dashboard-Karten erhalten stabile Größen, einheitliche Überschriften, echte Leerzustände und keine verschachtelten Karten.
- Bei 1366×768 bleibt die wichtigste Tagesarbeit ohne unnötiges Scrollen erreichbar; auf Mobilgeräten werden Nebeninformationen geordnet eingeklappt.

## Prüfung

- **Navigation:** jeden sichtbaren Menüpunkt in Normal- und Demo-Modus öffnen; keine unerklärte Zugriffssperre, kein fehlendes Icon, keine tote Aktion.
- **Startseite:** neuer Nutzer, Shop, Fachhändler, Direct Sales, Außendienst, Hybrid und Superadmin-Demo sehen jeweils eine vollständige, verständliche Übersicht.
- **Demo-Isolation:** Kunden-, Angebots-, Vertrags- und Verwaltungsaktionen gegen Netzwerkaufrufe prüfen; Demo darf keine schreibende Backend-Anfrage senden.
- **Originaltreue:** dieselben Kernseiten in Echt- und Demo-Modus visuell vergleichen; Unterschiede dürfen nur Daten, Demo-Hinweis und bewusst gesperrte externe Aktionen betreffen.
- **Kernablauf:** Start → Kunde → Kalkulator → Warenkorb → Angebot; zusätzlich Kunde → Vertrag/VVL und Angebot → Detail.
- **Formate:** Desktop 1366×768, aktuelle große Vorschau, Tablet und kurzes Mobilformat prüfen.
- **Qualität:** vorhandene Tests sowie neue Browser-Tests für Dashboard-Sichtbarkeit, vollständige Demo-Navigation und lokale Demo-Aktionen ausführen.
- **Offener Echtbetriebsfehler:** Branding-Berechtigungsfehler separat diagnostizieren und nur nach bestätigter Ursache beheben; nicht mit dem Frontend-Umbau verdecken.

## Technische Grenzen
- Berechnungsengine, Tarifregeln und Kundensicherheitslogik bleiben unverändert.
- Demo-Privilegien bleiben rein lokal; echte Rechte und serverseitige Mandantentrennung werden nicht aufgeweicht.
- Keine Wettbewerberoberfläche wird nachgebaut.
- Keine neue ERP-, Kassen- oder Warenwirtschaftsfunktion wird als fertig behauptet.
