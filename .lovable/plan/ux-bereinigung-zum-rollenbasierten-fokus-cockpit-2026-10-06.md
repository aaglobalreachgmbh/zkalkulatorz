# UX-Bereinigung zum rollenbasierten Fokus-Cockpit

## Zielbild

Die Anwendung bleibt ein flexibles Vertriebswerkzeug für Shop/POS, Fachhandel, Direct Store, Außendienst und Hybrid-Vertrieb. Die ausgewählte Richtung **„Balanced focus cockpit“** wird zur verbindlichen Grundlage:

- Vodafone Klar: Weiß, Hellgrau, Dunkelgrau und gezielt eingesetztes Vodafone-Rot
- Sora für Überschriften, Manrope für Fließtext und Zahlen
- ein eindeutiger Arbeitsbeginn statt mehrerer konkurrierender Einstiege
- Rollenprofil, Demo und zusätzliche Werkzeuge bleiben erhalten, dominieren aber nicht das Tagesgeschäft

## Verifizierter Befund

**Durchdacht und zu bewahren**
- Rollenprofile mit passenden Schnellaktionen und Werkzeugen sind bereits sauber modelliert.
- Der Kalkulator bleibt die klare Kernfunktion und schützt Händlerdaten zentral über den Kunden-/Händlermodus.
- Demo-Firma, Energie-Ergänzung und KI-Erklärung sind als Simulation beziehungsweise Zusatzwerkzeug klar abgrenzbar.
- Der Kalkulator besitzt bewusst eine kompakte, scrollarme Arbeitsfläche.

**Zu additiv geworden**
- Auf der Startseite stehen Rollen-Schnellstart, Demo-Übersicht, konfigurierbare Widgets und ein statischer Systemstatus untereinander.
- „Demo-Betrieb“ und „Arbeitsplatz anpassen“ haben jeweils mehrere gleichwertig wirkende Einstiegspunkte.
- Die Seitenleiste kombiniert allgemeine Werkzeuge, rollenabhängige Werkzeuge und mehrere Verwaltungsgruppen; besonders Hybrid-Nutzer erhalten dadurch zu viele sichtbare Optionen.
- Hauptbereich und Kalkulator verwenden getrennte Rahmen/Kopfzeilen, wodurch Übergänge uneinheitlich wirken.
- Demo-Kennzeichnungen verwenden Warnfarben; dadurch verlieren echte Warnungen an Signalwirkung.

## Umsetzung in fünf vollständigen Schritten

### 1. Startseite zum Fokus-Cockpit ordnen
- Die ausgewählte Komposition übernehmen: kompakte Status-/Zugangszeile, zentrale Arbeitsfrage, vier klare Schnellaktionen, kompakter Arbeitsmodus.
- Nach gewähltem Nutzertyp wird die große Rollenwahl zu einer schmalen Statuszeile mit „Anpassen“; nur bei der ersten Nutzung bleibt die Auswahl prominent.
- Pro Startseiten-Layout nur eine Hauptlogik anzeigen:
  - **Fokus:** Schnellaktionen und nächste Aufgabe
  - **Cockpit:** Schnellaktionen plus kompakte Heute-Übersicht
  - **Klassisch:** bestehendes Widget-Dashboard
- Demo-Daten nicht mehr zusätzlich über alle regulären Blöcke stapeln. Ein kompakter Demo-Zugang bleibt; die vollständige Demo-Übersicht bleibt auf „Demo-Betrieb“.
- Den derzeit statisch behaupteten Systemstatus von der Startseite entfernen. Ein Status darf dort nur erscheinen, wenn er tatsächlich geprüft wird.

### 2. Navigation nach Häufigkeit und Rolle reduzieren
- Dauerhaft sichtbar bleiben: Startseite, Kalkulator, Angebote, Kunden, Verträge und die drei wichtigsten Aktionen des gewählten Nutzertyps.
- Kalender, News, Bundles, Posteingang, Auswertungen und Team in eine aufklappbare Gruppe „Weitere Werkzeuge“ verschieben.
- „Arbeitsplatz anpassen“ nur als kompakte Aktion am Rollenstatus und in den Einstellungen führen, nicht zusätzlich als gleichwertiges Hauptwerkzeug.
- „Demo-Betrieb“ als einen regulären Sidebar-Einstieg plus einen kontextuellen Demo-Knopf führen; weitere Doppelungen entfernen.
- Persönliche Sicherheit und administrative Sicherheit getrennt benennen: „Meine Sicherheit“ versus „Admin & Sicherheit“.

### 3. Rollenbezogene Prioritäten schärfen
- **Shop/POS:** Neues Angebot, Kundensuche, Kasse und fällige VVL zuerst; Management-Auswertungen einklappen.
- **Fachhändler:** Angebot, Provision/Soll-Ist und Kreuzgeschäft zuerst.
- **Direct Store:** Angebot, Teamfortschritt und Bundles zuerst.
- **Außendienst:** Tagesroute, nächster Termin, Kunde und Angebot zuerst; breite Tabellen vermeiden.
- **Hybrid:** nicht alle Module gleichzeitig zeigen, sondern die drei aktuell wichtigsten Aktionen plus „Weitere Werkzeuge“.
- Kundensitzung weiterhin als sicherheitsrelevanten Zustand deutlich von Arbeitsplatz-/POS-Modi unterscheiden.

### 4. Neue Funktionen sauber integrieren statt aufstapeln
- KI-Erklärung und Energie-Gesamtübersicht als sekundäre Aktionen im Angebotsergebnis bündeln; Speichern/PDF bleiben primär.
- Demo-Badges auf einen neutralen Demo-Stil umstellen; Orange/Rot bleiben echten Warnungen und Fehlern vorbehalten.
- Energie-Gesamtübersicht visuell an die bestehende Angebotszusammenfassung angleichen, ohne Berechnungslogik zu ändern.
- Demo-Daten weiterhin ausschließlich auf den dafür vorgesehenen Demo-Flächen anzeigen; reale Listen bleiben unvermischt.
- Keine neue Kasse, kein ERP-Ausbau und keine zusätzlichen Module in diesem Schritt.

### 5. Konsistenz und Praxistest
- Kopfzeile und Seitenrahmen zwischen regulärer App und Kalkulator visuell angleichen, ohne den Zero-Scroll-Vertrag des Kalkulators zu brechen.
- Veraltete POS-Begriffsdopplung intern auf den bestehenden Arbeitsplatzmodus vereinheitlichen; Kundenmodus bleibt fachlich getrennt.
- Desktop bei 1366×768 und Tablet prüfen: Hauptaktion, Preis/Marge und Abschlussaktion müssen ohne Such- oder Scrollarbeit erreichbar bleiben.
- Je Persona einen realistischen Ablauf testen: Startseite → Kunde/Vorgang → Kalkulator → Ergebnis → Speichern/PDF.
- Zusätzlich prüfen: Kundensitzung blendet Händlerdaten weiterhin vollständig aus; Demo ist jederzeit erkennbar und abschaltbar.

## Bewusster Rückbau

- Entfernen: statischer Systemstatus auf der Startseite, doppelte Demo-/Arbeitsplatz-Einstiege, gleichzeitiges Stapeln aller Startseitenkonzepte.
- Ausblenden statt löschen: seltene Werkzeuge, Auswertungen und administrative Bereiche.
- Behalten: Rollenvielfalt, Paletten, Dichtewahl, drei Startseiten-Modi, Demo-Firma, Energie und KI-Erklärung.
- Nicht verändern: Kalkulationslogik, Rechte, Rollen, echte Kundendaten und Datenhaltung.

## Marktbezug

Öffentlich belegbare Branchenmuster bei MoCare, C.A.T., Akviz, bo-telekom und Provisionskontrolle sind: durchgängiger Vorgang Kunde → Vertrag → Verkauf → Provision, VVL-Frühwarnung, Soll-/Ist-Provision, schnelle Favoriten und mobile Nutzung. Herstellerangaben sind keine unabhängigen Benchmarks. Daher werden nur die risikoarmen Muster übernommen: weniger Wechsel, klare nächste Aktion, sichtbarer Status und nachvollziehbare Wirtschaftlichkeit — nicht deren gesamte ERP-Komplexität.

## Technische Leitplanken

- Bestehende Design-Tokens und Komponenten verwenden; Vodafone-Rot nur semantisch als Marke/Primäraktion einsetzen.
- Sora/Manrope zentral laden und nicht pro Seite duplizieren.
- Keine Änderungen an Backend, Kalkulations-Engine oder Sicherheitsregeln.
- Änderungen klein und reversibel halten; zuerst Startseite/Navigation, danach Ergebnisintegration und Konsistenzprüfung.
