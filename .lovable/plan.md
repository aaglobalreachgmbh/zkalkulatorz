# Mobile-Nachprüfung und CI-Reparatur

## Verifizierter Ist-Zustand

- Die beiden aktuellen GitHub-Workflows brechen bereits bei **„Install Dependencies“** ab; Lint, Typprüfung, Tests und Build werden danach nur übersprungen. Ursache ist eine nicht mehr zu `package.json` passende `package-lock.json`. Der Fehler ist lokal mit `npm ci --dry-run` reproduzierbar.
- Die aktuelle Lovable-Vorschau baut fehlerfrei. Der Screenshot bedeutet daher nicht, dass vier unabhängige Qualitätsprüfungen fehlgeschlagen sind, sondern dass ein früher Installationsfehler beide sequenziellen Workflows stoppt.
- Der mobile Kernablauf bis Warenkorb und Angebotsformular funktioniert bei 440 px Breite. Bei nur 353 px Höhe bleiben jedoch reale Risiken: zu viele übereinanderliegende Kopf-/Hinweisleisten, weitere nicht scrollbar begrenzte Dialoge und zu wenig Arbeitsfläche bei eingeblendeter Tastatur.

## Umsetzung

### 1. GitHub Quality Gate wieder lauffähig machen
- Abhängigkeitssperre aus der bestehenden Paketliste sauber neu erzeugen, ohne Pakete oder Architektur unnötig zu ändern.
- Danach exakt die CI-Reihenfolge prüfen: saubere Installation, Lint, Typprüfung, Unit-Tests und Produktions-Build.
- Die zwei parallelen Workflows nicht umbauen; nur den bestätigten gemeinsamen Installationsfehler beheben.

### 2. Kurze Handy-Displays auf den Verkaufsablauf fokussieren
- Kalkulator-Kopf, Schrittleiste und feste Abschlussleiste so abstimmen, dass bei 440 × 353 noch nutzbarer Inhalt sichtbar bleibt.
- Gleichzeitige Vollbreiten-Hinweise auf Mobilgeräten vermeiden: kritische VVL-, Vorschau- und Demo-Hinweise kompakt priorisieren beziehungsweise einklappbar machen, statt Arbeitsfläche dauerhaft zu blockieren.
- Preis, Ansichtsmodus, Warenkorb und „Hinzufügen“ bleiben sichtbar; Publisher-Details, Erklärtexte und sekundäre Hinweise bleiben nachrangig.

### 3. Mobile Dialoge und Tastaturbedienung absichern
- Angebots-, E-Mail- und direkt zum Abschluss gehörende Dialoge auf kleine dynamische Viewports begrenzen und intern scrollbar machen.
- Überschriften/Schließen-Aktion erreichbar halten; aktive Eingabefelder und Hauptaktion dürfen durch Bildschirmtastatur oder feste Fußleiste nicht verdeckt werden.
- Warenkorb-Bottom-Sheet mit Safe-Area und kurzen Höhen testen; dieselben Angebotsdaten und Aktionen wie auf Desktop bleiben erhalten.

### 4. Verbleibende mobile Störfaktoren gezielt bereinigen
- Festnetz-Auswahl, Login/Registrierung, Tarif-/Gerätelisten und eigene Produkte bei 440 × 353 sowie normaler Handyhöhe prüfen.
- Touch-Ziele ausreichend groß halten, lange Beschriftungen ohne Überlagerung umbrechen oder kürzen und nur sekundäre Inhalte einklappen.
- Keine Rechenlogik, Rechte, Kundensicherheitsregeln, Echtdaten oder Desktop-Struktur ändern.

### 5. Vollständige Abnahme
- Kritischen Ablauf durchspielen: Login beziehungsweise erlaubte Vorschau → Gerät → Vorschlag/Tarif → Warenkorb → Zusatzleistung → Angebotsdaten → PDF-Aktion.
- Zusätzlich Festnetz, Registrierung, Seitenmenü und E-Mail-Dialog bei 440 × 353, normalem Smartphone und Tablet prüfen.
- Abschließend saubere Installation sowie Lint, Typprüfung, Unit-Tests und Build erneut ausführen; GitHub-Erfolg erst nach einem neuen Workflow-Lauf behaupten.

## Technische Leitplanken

- Bestehende semantische Design-Tokens und vorhandene Button-/Dialog-Komponenten verwenden; keine neue mobile Parallelfunktion bauen.
- Responsive Änderungen bleiben in den bestehenden Layouts und Angebotskomponenten.
- Der Screenshot wird als CI-Hinweis behandelt, nicht als Beleg für einen Fehler der mobilen Fachlogik.
