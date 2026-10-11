# Vertriebsportal visuell vereinfachen und produktreif ausrichten

## Zielbild
Das Portal soll im ersten Blick wie ein fertiges Vertriebswerkzeug wirken: Angebot starten, Kunden finden und offene Vorgänge bearbeiten. Kalkulation und Angebotserstellung bleiben der Kern. Verwaltung, Demo-Werkzeuge und spätere ERP-Funktionen treten sichtbar zurück.

Der Umbau soll nicht nur aufräumen, sondern eine erkennbare Produktlinie herstellen: moderne vertriebliche Führung für neue Nutzer und ein optional vertrauter Arbeitsmodus für Umsteiger aus klassischen Shop-Systemen.

## Belegter Ist-Zustand
- Die aktuelle Startseite ist technisch ruhig, nutzt den verfügbaren Raum aber kaum: Unter drei Einstiegsflächen bleibt sehr viel Leerfläche.
- Die Seitenleiste verwendet bereits Icons, ihre Gruppierung enthält jedoch leere oder eingeklappte Bereiche und zeigt „Dashboard“ statt eines klaren vertrieblichen Einstiegs.
- Angebote und Kunden haben saubere Leerzustände, wirken ohne Beispieldaten aber unfertig; die Beispieldaten sind erst nach einem zusätzlichen Klick sichtbar.
- Der Kalkulator ist fachlich umfangreich, zeigt beim Einstieg jedoch sofort eine lange Geräteliste und zusätzlich eine Einführung. Dadurch konkurrieren Gerätesuche, Tour und Schrittführung um Aufmerksamkeit.
- Der wichtigste Verkaufsweg verwendet teilweise feste Rot-, Grün-, Grau- und Weißwerte statt der vorhandenen Marken- und Oberflächenfarben. Dadurch wirken Branding-Einstellungen im Kalkulator nicht durchgängig.
- Einzelne Kunden-, Reporting- und Tarifflächen verwenden Emoji oder Textzeichen neben dem vorhandenen Lucide-Icon-System. Mehrere Aktionen öffnen außerdem ungestaltete Browser-Rückfragen.
- Im Abschlussbereich bestehen parallele Zusammenfassungen und Aktionen, die nur weiterleiten, statt den aktuellen Kalkulationsstand tatsächlich zu übernehmen. Das wirkt fertiger, als es funktional ist.
- Im geprüften Konto funktionieren Startseite, Angebote und Kunden ohne Seitenfehler. Bundles und Shop-Einstellungen sind rollenbedingt gesperrt. Der Kalkulator lud im ersten Screenshot noch nach, war anschließend aber bedienbar.
- Der aktuelle Build ist fehlerfrei.

## Historischer Vergleich
- **Früher besser:** Der ursprüngliche Vier-Schritte-Fokus war eindeutiger; eine Hauptaktion und standardmäßig eingeklappte Details haben den Verkauf geführt.
- **Heute besser:** Rollenprofile, Kundenansicht, Demo-Trennung, mobile Angebotsfertigstellung und individualisierbare Arbeitsplätze sind fachlich deutlich stärker.
- **Heute schwächer:** Zusätzliche Modi, Werkzeuge und Auswahlflächen haben die frühere Klarheit verwischt. Die Oberfläche ist reduziert, aber nicht überall ausreichend priorisiert; „wenig Inhalt“ ersetzt teilweise echte Tagesübersicht.
- **Visuelle Entwicklung:** Auf ein generisches helles Grundsystem folgten Glassmorphism und anschließend das striktere Zero-Scroll-Cockpit. Heute sind helle Arbeitsflächen und eine dunkle Primärfarbe aktiv; ältere Design-Dokumente beschreiben teilweise noch einen deutlich dunkleren Finanzplattform-Look. Diese widersprüchlichen Zielbilder werden auf eine aktuelle Linie konsolidiert.
- **Praktische Lehre:** Das feste Cockpit mit rechter Zusammenfassung ist für schnelle Kalkulation stärker als der alte Scroll-Wizard. Mobile Überlagerungsfehler und doppelte Abschlussflächen zeigen aber, dass diese Struktur nur mit einer klaren Informationshierarchie stabil bleibt.
- **Nicht zurückbauen:** Kunden-/Händlerschutz, Rollenprofile, mobile Angebotsfertigstellung, eigene Produkte und Demo-Trennung bleiben erhalten.

## Umsetzung

### 1. Navigation auf Verkaufsarbeit zuschneiden
- Den Einstieg eindeutig als **Start** bezeichnen und mit einem vertrauten Haus-Icon versehen.
- Primär sichtbar: Start, Kalkulator, Angebote, Kunden, Verträge.
- Kalender, Aktionen, eigene Produkte und Posteingang unter **Werkzeuge** bündeln; nur arbeitsplatzrelevante Einträge anzeigen.
- Konto, Sicherheit, Lizenz und administrative Bereiche unter **Einstellungen** bündeln.
- Jede Seite erhält genau ein passendes Lucide-Icon; keine dekorativen Sonderzeichen oder Emoji-Glyphen.
- Emoji, Häkchen-Glyphen und uneinheitliche Ampelzeichen in vertriebsrelevanten Ansichten durch das bestehende Icon- und Statussystem ersetzen.
- Shop/Außendienst bleibt eine Arbeitsplatzumschaltung, wird aber kompakter und eindeutig beschriftet.

### 2. Startseite als tägliche Vertriebszentrale ausbauen
- Die primäre Aktion **Neues Angebot** bleibt dominant.
- Darunter eine kompakte Tageszeile: offene Angebote, anstehende Vertragsverlängerungen, Wiedervorlagen und Termine. Echte Daten und klar gekennzeichnete Demo-Daten bleiben getrennt.
- Rollenwahl und Beispieldaten in einen unaufdringlichen Bereich **Arbeitsplatz anpassen** verschieben; sie dürfen nicht wichtiger als die Tagesarbeit wirken.
- Für den Fokus-Modus kein frei konfigurierbares Kartenraster. Der klassische Modus bleibt für Nutzer erhalten, die das bisherige Dashboard wünschen.

### 3. Kalkulator-Einstieg vereinfachen
- Oben nur Kunde, aktueller Schritt und eine klare Hauptaktion zeigen.
- Gerätesuche und Kategorien vor der langen Liste sichtbar machen; häufige oder zum Nutzerfokus passende Geräte zuerst zeigen.
- Vorschläge, Aktionen und Vorlagen erst nach Gerätewahl kontextbezogen einblenden; manuelle Auswahl bleibt immer erreichbar.
- Tour nicht gleichzeitig mit dem eigentlichen Arbeitsbereich dominieren lassen; Einführung als kleine, freiwillige Hilfe anbieten.
- Rechte Zusammenfassung und Abschlussansicht auf eine gemeinsame visuelle und inhaltliche Quelle reduzieren; Marge, Provision und Status dürfen nicht in zwei unterschiedlichen Ampelsystemen erscheinen.
- Irreführende Aktionen wie „Als Template speichern“ oder „Als Bundle speichern“ nur anzeigen, wenn der aktuelle Kalkulationsstand tatsächlich übernommen wird; andernfalls entfernen.
- Sicherheitsrelevante Wechsel zwischen Kunden- und Händleransicht über einen einheitlichen, klar formulierten Systemdialog statt eines Browser-Popups bestätigen.
- Berechnungslogik, Tarifdaten, Kundensicherheitsmodus und bestehende Angebotsfertigstellung bleiben unverändert.

### 4. Listen und Leerzustände produktreif gestalten
- Angebote, Kunden und Verträge erhalten bei vorhandenen Daten eine dichte, gut scannbare Arbeitsansicht.
- Ohne Echtdaten wird eine einzige klare Erstaktion gezeigt. Beispieldaten bleiben ausdrücklich als Demo markiert und getrennt.
- CSV-Export wird erst aktiv, wenn exportierbare Daten vorhanden sind.
- Gesperrte Module erklären knapp den fehlenden Zugriff und bieten nur sinnvolle Rückwege.

### 5. Visuelle Produktlinie vereinheitlichen
- Den aktuellen hellen Enterprise-Cockpit-Stil bewusst als Grundlage festlegen; kein erneuter Wechsel zu Glassmorphism oder einer überwiegend dunklen Oberfläche.
- Markenfarbe, Oberflächen, Statusfarben, Rahmen und Text ausschließlich über die bestehenden semantischen Designwerte ausgeben. Individuelles Firmenbranding muss gerade im Kalkulator sichtbar konsistent funktionieren.
- Einheitliche Radien, Abstände, Tabellenzeilen, Suchfelder, Dialoge und Hauptaktionen für Start, Kalkulator, Kunden, Angebote und Verträge herstellen.
- Native Browser-Rückfragen in den berührten Kernwegen durch vorhandene Systemdialoge ersetzen.
- Das Ergebnis bei 1366×768 gegen den bestehenden Zero-Scroll-Vertrag prüfen, statt nur großzügige Hochformat-Screenshots zu bewerten.

### 6. Vertrauter Wechselpfad statt Wettbewerber-Kopie
- Ein optionales Arbeitsplatzlayout **Klassisch** nutzt vertraute Muster älterer Shop-Systeme: kompakte Funktionsnavigation, Tageskennzahlen und Schnellzugriffe.
- Es übernimmt weder Farben, Texte, Icons noch Bildschirmaufbau von MOCARE oder easyfilius.
- MOCARE bestätigt Branchenbedarf für Margen-/Provisionskontrolle, Kundenakte, VVL und mobile Nutzung; easyfilius bestätigt Angebotsvorlagen, Preisregeln, Warenwirtschaft und Vertragsverwaltung.
- Das Klassisch-Layout dient als Umstiegshilfe, nicht als Nachbau: bekannte Begriffe, kurze Wege und hohe Informationsdichte werden in der eigenen Gestaltung abgebildet.
- Perspektivische Wechselhilfen werden sichtbar vorgesehen: Datenimport, Zuordnungsvorschau und klare Modulgrenzen. Es wird nicht behauptet, bestehende Fremdsysteme bereits vollständig ersetzen oder deren Daten direkt übernehmen zu können.
- Phase 1 bleibt **Angebot zuerst, Verwaltung danach**. Kasse/TSE, vollständige Warenwirtschaft, Buchhaltung, Reparatur und Zeiterfassung werden nicht als scheinbar fertige Funktionen dargestellt.

### 7. Ehrliche Produktreife statt Schein-Funktionalität
- Provisorische Ansichten dürfen einen realistischen Zielzustand zeigen, müssen aber als Demo oder Vorschau erkennbar bleiben.
- Kein sichtbarer Befehl ohne nachvollziehbare Reaktion, sicheren Rückweg oder ehrlichen Hinweis auf fehlende Berechtigung.
- Bereits funktionierende Module bleiben erreichbar; zusätzliche ERP-Breite darf den Angebotsprozess nicht verlängern.
- Veraltete oder widersprüchliche Design-Dokumentation wird nach der Umsetzung auf das tatsächlich gewählte Zielbild abgestimmt.

## Prüfung
- Desktop bei 1366×768: Start → Kunde → Kalkulator → Warenkorb → Angebot.
- Mobil und kurzes Display: dieselbe Kernstrecke, ohne verdeckte Aktionen.
- Rollen: Shop/POS, Fachhändler, Direct Sales, Außendienst und Hybrid; jeweils Navigation und Startprioritäten prüfen.
- Kunden- und Händleransicht: Branding, sensible Daten, Dialoge und Statusdarstellung vergleichen.
- Alle sichtbaren Haupt- und Menübefehl-Aktionen im Kernweg anklicken; Weiterleitungen ohne Zustandsübernahme gelten als Fehler.
- Echte und Demo-Daten dürfen auf keiner Liste vermischt erscheinen.
- Bestehende Berechnungs- und Kundensicherheits-Tests bleiben unverändert grün; abschließend Build und relevante Oberflächentests prüfen.

## Arbeitsweise und Selbstkontrolle
- Vor jedem Umbau prüfen: Unterstützt er Angebotserstellung, Orientierung oder Umstieg? Wenn nicht, gehört er nicht in den sichtbaren Kern.
- Bestehende Engine, Rechte und Datenflüsse als geschützte Grenzen behandeln; visuelle Verbesserungen dürfen keine scheinbar neue Fachfunktion vortäuschen.
- Erst reale Oberfläche und tatsächliche Aktion prüfen, dann bewerten; Dokumentation und alte Pläne sind nur Vergleichsmaterial.
- Nach jeder zusammenhängenden Änderung Desktop und Mobil praktisch durchlaufen, statt ausschließlich Code oder Build-Ergebnis zu bewerten.
- Bei konkurrierenden Ideen gewinnt die Variante mit weniger Entscheidungen, klarerer Hauptaktion und geringerem Risiko für sensible Händlerdaten.

## Technische Grenzen
- Nur Frontend, Navigation und Darstellung ändern.
- Keine Änderung an Engine, CalculatorContext, Datenbank, Rechten oder Angebotsformeln.
- Bestehende Design-Tokens und UI-Bausteine verwenden; keine Konkurrenzoberfläche kopieren.
- Neue strukturelle Regeln in `AGENTS.md` dokumentieren, ohne Projektwissen zu duplizieren.
