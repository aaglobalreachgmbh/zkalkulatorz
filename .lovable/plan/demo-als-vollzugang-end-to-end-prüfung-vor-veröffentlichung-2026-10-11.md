# Demo als Vollzugang + End-to-End-Prüfung vor Veröffentlichung

## Ziel
1. Im Demo-Modus sieht man das Portal wie ein Superadmin: alle Seiten, Bereiche und Navigationspunkte sichtbar.
2. Automatische Browser-Tests prüfen Kunden-, Angebots- und Vertragsabläufe in Demo- und Echtmodus inklusive Datentrennung.
3. Abschließender Zugänglichkeits-Check aller Seiten mit ehrlichem Ergebnisbericht.

## Wichtige Sicherheitsgrenze
"Superadmin im Demo-Modus" gilt nur für die Anzeige im Browser. Es werden keine echten Rechte vergeben, keine Rollen in der Datenbank geändert und keine echten Admin-Aktionen ausgeführt. Admin-Seiten zeigen im Demo-Modus Beispielinhalte bzw. einen klaren Hinweis "Im Demo-Modus nur Ansicht", statt echte Daten zu laden oder zu schreiben.

## Schritte
1. **Demo-Sichtrechte**: Ein zentraler Schalter macht im Demo-Modus Navigation, Seitenschutz und Funktionssperren auf "alles sichtbar". Echtmodus bleibt unverändert.
2. **Navigation vollständig**: Alle Seiten mit passendem Icon in der Seitenleiste, gruppiert (Verkauf, Kunden, Auswertung, Werkzeuge, Verwaltung, Superadmin). Keine Platzhalterzeichen.
3. **Admin-Seiten absichern**: Admin-/Superadmin-/Sicherheitsseiten im Demo-Modus ohne echte Abfragen/Schreibzugriffe (Beispielansicht oder Nur-Ansicht-Hinweis).
4. **End-to-End-Tests** (Playwright, Ordner e2e):
   - Demo: Kunde anlegen/bearbeiten/löschen, Angebot speichern/umbenennen/Status, Vertrag anlegen; prüfen, dass keine Netzwerk-Schreibanfrage an das Backend geht und Zurücksetzen alles wiederherstellt.
   - Echtmodus: dieselben Seiten laden ohne Demo-Datensätze; Demo-Namen dürfen nicht erscheinen.
   - Wechsel Demo an/aus: keine Vermischung, Banner nur im Demo-Modus.
   - Navigation: jeder Menüpunkt im Demo-Modus erreichbar, keine Seitenfehler.
   - Echtmodus-Schreibtests laufen nur mit Testkonto (Umgebungsvariablen); ohne Zugang werden sie sichtbar übersprungen, nicht als bestanden gewertet.
5. **Gegenprüfung**: Tests, Typprüfung, Build ausführen; eigener Browser-Durchlauf mit Screenshots Desktop + Mobil; Bericht: geprüft / nicht prüfbar / offen.

## Technische Details
- Neuer Hook `useDemoAccess` (kein throw, sicherer Default) wird in `usePermissions`, `useTenantAdmin`, `useUserRole`-Verbraucher, `AdminGuard`, `PermissionGate`, `AppSidebar` und `useFeature` als Override eingeklinkt — nur wenn `useDemoMode().enabled`.
- Netzwerk-Isolation im Test via `page.on('request')`: POST/PATCH/DELETE an `/rest/v1/` und `/functions/v1/` im Demo-Modus = Testfehler.
- Neues npm-Skript `test:e2e`; CI bleibt unverändert (E2E optional, da Login nötig).
- `AGENTS.md`-Regel ergänzen: Demo-Vollzugang ist reine Anzeige, nie Rechtevergabe.
- Bekannt offen und nicht Teil dieses Plans: die aktuellen Berechtigungsfehler im Echtbetrieb (Firmen-Branding, Provisionen) aus den Vorschau-Logs.
