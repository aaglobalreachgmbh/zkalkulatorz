# Öffentlicher, passwortgeschützter Demo-Zugang

## Ziel
Der veröffentlichte Link erhält auf der Anmeldeseite einen separaten Demo-Zugang. Nach korrektem Passwort öffnet sich der vollständige lokale Demo-Arbeitsplatz mit Superadmin-Ansichten, ohne Zugriff auf echte Firmen- oder Benutzerdaten.

## Umsetzung
1. Das Demo-Passwort ausschließlich als geschütztes Cloud-Geheimnis speichern; es wird weder im Browsercode noch im Repository hinterlegt.
2. Eine öffentliche, gedrosselte Prüffunktion ergänzen, die das Passwort serverseitig vergleicht und nur ein kurzlebiges, signiertes Demo-Ticket ausstellt.
3. Den bisherigen Vorschau-Testmodus zu einem klar getrennten öffentlichen Demo-Modus erweitern: Ticket prüfen, Demo-Firma aktivieren und ausschließlich lokale Beispieldaten verwenden.
4. Auf der Anmeldeseite einen eigenen Bereich „Demo ansehen“ mit Passwortfeld ergänzen; Abmelden und Ablauf des Tickets führen zurück zur Anmeldung.
5. Desktop und Mobil testen: richtiges/falsches Passwort, direkter Seitenaufruf, Superadmin-Navigation, Neuladen, Ablauf/Abmelden sowie keine echten Schreibanfragen.

## Sicherheitsgrenzen
- Das Passwort gewährt keine echte Anmeldung, Rolle oder Datenbankberechtigung.
- Demo-Verwaltungsaktionen bleiben durch `DemoAdminBoundary` und lokale Demo-Hooks ohne echte Schreibwirkung.
- Reguläre Konten und die interne Anmeldung bleiben unverändert.
