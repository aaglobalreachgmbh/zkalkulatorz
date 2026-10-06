# Testmodus ohne Login (nur Vorschau)

## Ziel
Sie sollen die App in der Lovable-Vorschau ansehen und testen können, ohne sich anzumelden. Die veröffentlichte App (zkalkulatorz.lovable.app) bleibt geschützt wie bisher.

## So fühlt es sich an
- Auf der Anmeldeseite gibt es in der Vorschau einen Knopf „Ohne Login testen“.
- Danach öffnet sich die App. Oben steht ein auffälliger Hinweis „Testmodus – nicht angemeldet“ mit dem Knopf „Beenden“.
- Den Testmodus schalten Sie jederzeit über diesen Knopf aus.
- In der veröffentlichten App erscheint der Knopf nie und der Testmodus lässt sich dort nicht aktivieren.

## Was funktioniert, was nicht
- Funktioniert: Kalkulator, Startseite, Arbeitsplatz-Einstellungen, Farben und Layouts, alle Demo-Werkzeuge (Kasse, Kampagnen, Kreuzgeschäft, Provisionskontrolle, Außendienst-Tag).
- Leer oder eingeschränkt: Gespeicherte Angebote, Kunden, Verträge, Team und Admin-Seiten. Diese Daten sind aus Sicherheitsgründen nur für angemeldete Nutzer lesbar. Der Datenbankschutz wird bewusst nicht gelockert.
- Speichern in der Datenbank ist im Testmodus nicht möglich. Die App zeigt dann einen Hinweis statt eines Fehlers.

## Zusätzlich: Anmelden einfacher machen
- „Angemeldet bleiben“ ist fest aktiv, damit die Sitzung länger hält.
- Auf der Anmeldeseite kommt ein Link „Login-Link per E-Mail“ dazu. Damit melden Sie sich ohne Passwort an und kommen auch an die echten Daten.

## Technische Details
- Freischaltung nur, wenn der Hostname `id-preview--*.lovable.app`, `*.lovableproject.com` oder `localhost` ist. Auf dem veröffentlichten Hostname und auf eigenen Domains ist der Testmodus fest gesperrt.
- Der Schalter liegt in `sessionStorage` (`test-mode=1`) und endet mit dem Tab. Neues Modul `src/lib/testMode.ts` mit `isTestModeAllowed()` und `isTestModeActive()`.
- `ProtectedRoute`: Lässt den Aufruf durch, wenn kein Nutzer angemeldet ist und der Testmodus aktiv ist. `AdminRoute` und `TenantAdminRoute` bleiben unverändert und gesperrt.
- `MainLayout`: Banner mit „Beenden“. Der Knopf löscht den Schalter und leitet zu `/auth`.
- `Auth.tsx`: Knopf „Ohne Login testen“ (nur wenn erlaubt) und „Login-Link per E-Mail“ über `signInWithOtp` mit `emailRedirectTo: window.location.origin`.
- Keine Änderung an Datenbankrechten, Rollen oder Edge Functions. Hooks brechen ohne Nutzer nicht ab, sondern liefern weiter leere Fallbacks (kein throw).
