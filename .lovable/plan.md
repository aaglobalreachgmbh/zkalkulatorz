# Vertriebsportal visuell vereinfachen und produktreif ausrichten

## Zielbild
Das Portal soll im ersten Blick wie ein fertiges Vertriebswerkzeug wirken: Angebot starten, Kunden finden und offene Vorgänge bearbeiten. Kalkulation und Angebotserstellung bleiben der Kern. Verwaltung, Demo-Werkzeuge und spätere ERP-Funktionen treten sichtbar zurück.

## Belegter Ist-Zustand
- Die aktuelle Startseite ist technisch ruhig, nutzt den verfügbaren Raum aber kaum: Unter drei Einstiegsflächen bleibt sehr viel Leerfläche.
- Die Seitenleiste verwendet bereits Icons, ihre Gruppierung enthält jedoch leere oder eingeklappte Bereiche und zeigt „Dashboard“ statt eines klaren vertrieblichen Einstiegs.
- Angebote und Kunden haben saubere Leerzustände, wirken ohne Beispieldaten aber unfertig; die Beispieldaten sind erst nach einem zusätzlichen Klick sichtbar.
- Der Kalkulator ist fachlich umfangreich, zeigt beim Einstieg jedoch sofort eine lange Geräteliste und zusätzlich eine Einführung. Dadurch konkurrieren Gerätesuche, Tour und Schrittführung um Aufmerksamkeit.
- Im geprüften Konto funktionieren Startseite, Angebote und Kunden ohne Seitenfehler. Bundles und Shop-Einstellungen sind rollenbedingt gesperrt. Der Kalkulator lud im ersten Screenshot noch nach, war anschließend aber bedienbar.
- Der aktuelle Build ist fehlerfrei.

## Historischer Vergleich
- **Früher besser:** Der ursprüngliche Vier-Schritte-Fokus war eindeutiger; eine Hauptaktion und standardmäßig eingeklappte Details haben den Verkauf geführt.
- **Heute besser:** Rollenprofile, Kundenansicht, Demo-Trennung, mobile Angebotsfertigstellung und individualisierbare Arbeitsplätze sind fachlich deutlich stärker.
- **Heute schwächer:** Zusätzliche Modi, Werkzeuge und Auswahlflächen haben die frühere Klarheit verwischt. Die Oberfläche ist reduziert, aber nicht überall ausreichend priorisiert; „wenig Inhalt“ ersetzt teilweise echte Tagesübersicht.
- **Nicht zurückbauen:** Kunden-/Händlerschutz, Rollenprofile, mobile Angebotsfertigstellung, eigene Produkte und Demo-Trennung bleiben erhalten.

## Umsetzung

### 1. Navigation auf Verkaufsarbeit zuschneiden
- Den Einstieg eindeutig als **Start** bezeichnen und mit einem vertrauten Haus-Icon versehen.
- Primär sichtbar: Start, Kalkulator, Angebote, Kunden, Verträge.
- Kalender, Aktionen, eigene Produkte und Posteingang unter **Werkzeuge** bündeln; nur arbeitsplatzrelevante Einträge anzeigen.
- Konto, Sicherheit, Lizenz und administrative Bereiche unter **Einstellungen** bündeln.
- Jede Seite erhält genau ein passendes Lucide-Icon; keine dekorativen Sonderzeichen oder Emoji-Glyphen.
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
- Berechnungslogik, Tarifdaten, Kundensicherheitsmodus und bestehende Angebotsfertigstellung bleiben unverändert.

### 4. Listen und Leerzustände produktreif gestalten
- Angebote, Kunden und Verträge erhalten bei vorhandenen Daten eine dichte, gut scannbare Arbeitsansicht.
- Ohne Echtdaten wird eine einzige klare Erstaktion gezeigt. Beispieldaten bleiben ausdrücklich als Demo markiert und getrennt.
- CSV-Export wird erst aktiv, wenn exportierbare Daten vorhanden sind.
- Gesperrte Module erklären knapp den fehlenden Zugriff und bieten nur sinnvolle Rückwege.

### 5. Vertrauter Wechselpfad statt Wettbewerber-Kopie
- Ein optionales Arbeitsplatzlayout **Klassisch** nutzt vertraute Muster älterer Shop-Systeme: kompakte Funktionsnavigation, Tageskennzahlen und Schnellzugriffe.
- Es übernimmt weder Farben, Texte, Icons noch Bildschirmaufbau von MOCARE oder easyfilius.
- MOCARE bestätigt Branchenbedarf für Margen-/Provisionskontrolle, Kundenakte, VVL und mobile Nutzung; easyfilius bestätigt Angebotsvorlagen, Preisregeln, Warenwirtschaft und Vertragsverwaltung.
- Phase 1 bleibt **Angebot zuerst, Verwaltung danach**. Kasse/TSE, vollständige Warenwirtschaft, Buchhaltung, Reparatur und Zeiterfassung werden nicht als scheinbar fertige Funktionen dargestellt.

## Prüfung
- Desktop bei 1366×768: Start → Kunde → Kalkulator → Warenkorb → Angebot.
- Mobil und kurzes Display: dieselbe Kernstrecke, ohne verdeckte Aktionen.
- Rollen: Shop/POS, Fachhändler, Direct Sales, Außendienst und Hybrid; jeweils Navigation und Startprioritäten prüfen.
- Echte und Demo-Daten dürfen auf keiner Liste vermischt erscheinen.
- Bestehende Berechnungs- und Kundensicherheits-Tests bleiben unverändert grün; abschließend Build und relevante Oberflächentests prüfen.

## Technische Grenzen
- Nur Frontend, Navigation und Darstellung ändern.
- Keine Änderung an Engine, CalculatorContext, Datenbank, Rechten oder Angebotsformeln.
- Bestehende Design-Tokens und UI-Bausteine verwenden; keine Konkurrenzoberfläche kopieren.
- Neue strukturelle Regeln in `AGENTS.md` dokumentieren, ohne Projektwissen zu duplizieren.
