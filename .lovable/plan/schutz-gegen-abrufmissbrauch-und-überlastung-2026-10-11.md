# Schutz gegen Abrufmissbrauch und Überlastung

## Einordnung
Ein echter verteilter DDoS-Angriff muss vor der App durch Hosting- und Netzwerkschutz abgefangen werden. Die Anwendung kann jedoch Passwort-Raten, automatisierte Massenaufrufe, kostenintensive Funktionsaufrufe und Datenfluten deutlich begrenzen. Da die Plattform aktuell keinen einheitlichen serverseitigen Abrufschutz anbietet, wird der bestätigte projektspezifische Ansatz gezielt und möglichst klein umgesetzt.

## 1. Öffentlichen Demo-Zugang härten
- Den derzeit nur arbeitsspeicherbasierten Schutz durch einen persistenten, datenschutzfreundlich gehashten Zähler pro Herkunft ersetzen.
- Fehlversuche streng begrenzen, erfolgreiche Anmeldung und Ticketprüfung getrennt behandeln und eindeutige Wartezeiten zurückgeben.
- Große oder ungültige Anfragen früh ablehnen; Passwörter, Tickets und Herkunftsdaten niemals protokollieren.
- Bot-Prüfung vorbereiten, aber nicht scheinbar aktivieren: Der geheime Prüfschlüssel ist vorhanden, der notwendige öffentliche Website-Schlüssel ist aktuell nicht konfiguriert.

## 2. Öffentliche und teure Funktionen absichern
- Alle Funktionsendpunkte nach drei Klassen behandeln: öffentlich nötig, nur angemeldet, nur Verwaltung.
- PDF, Import, Sicherheitsprotokoll, E-Mail, Uploads und KI jeweils mit passender Anmeldung/Rolle, Größenlimit, Zeitfenster und strikter Eingabeprüfung versehen.
- Den PDF-Endpunkt bereits vor einer späteren rechenintensiven PDF-Erzeugung sperren; den Tarifimport zusätzlich gegen übergroße Listen schützen.
- Sicherheitsprotokolle gegen Datenfluten begrenzen und nur definierte Ereignisarten/Feldgrößen akzeptieren.

## 3. Bestehenden projektspezifischen Zähler sicher machen
- Den vorhandenen Datenbankzähler als gemeinsame interne Hilfsfunktion nutzen, statt voneinander abweichende Browser- und Arbeitsspeicher-Zähler zu verwenden.
- Herkunftsschlüssel ausschließlich serverseitig bilden; frei wählbare Kennungen aus Browseranfragen nicht mehr als Vertrauensbasis akzeptieren.
- Verwaltungsaktionen wie Bereinigung nicht öffentlich anbieten und sensible Funktionen bei Schutzfehlern geschlossen statt offen reagieren lassen.
- Alte Zähler kontrolliert bereinigen und nur notwendige, kurze Metadaten speichern.

## 4. Abhängigkeiten und Lastgrenzen prüfen
- Bestätigte DoS-relevante Abhängigkeitsmeldungen nach tatsächlicher Laufzeit-Relevanz sortieren.
- Direkte, kompatible Sicherheitsupdates für Testwerkzeuge, CSV-Verarbeitung und Navigation einspielen; indirekte Excel-/Diagramm-Abhängigkeiten nur aktualisieren, wenn Import und Auswertungen stabil bleiben.
- Datei-, JSON-, Base64- und Listenlimits zentral dokumentieren und an den betroffenen Eingängen durchsetzen.

## 5. Nachweis und Betrieb
- Automatisierte Tests für erlaubte Aufrufe, Grenzwert, Sperre, Ablauf, parallele Aufrufe und Ausfallverhalten ergänzen.
- Öffentliche Demo, KI, E-Mail, PDF, Import und Sicherheitsprotokoll praktisch testen; sicherstellen, dass normale Nutzung nicht unnötig blockiert wird.
- Abschließend Sicherheits- und Abhängigkeitsprüfung erneut ausführen und nur tatsächlich behobene Befunde schließen.
- Im Sicherheitsbereich klar unterscheiden: Anwendungsmissbrauch wird begrenzt; großflächiger DDoS-Schutz bleibt Aufgabe der vorgeschalteten Hosting-Infrastruktur.

## Technische Grenzen
- Der Schutz ist bewusst projektspezifisch und kein Ersatz für einen WAF-/CDN-DDoS-Dienst.
- Keine echten Rollen oder Daten werden für den öffentlichen Demo-Modus geöffnet.
- Reguläre Anmeldung und bestehende Mandantentrennung bleiben unverändert.
