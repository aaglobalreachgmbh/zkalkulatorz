## Lesende Ausgabe: Edge Functions Audit

Reine Bestandsaufnahme, keine Änderungen. 22 Edge Functions unter `supabase/functions/*`.

### Format je Function
Tabellenzeile: `Name | Zweck | Eingabe | Ausgabe | Secrets/Env | Aufrufer`
+ Kurzer Logikblock (2–5 Bullets) unter der Zeile.

### Zusätzlich für `calculate-margin` und `generate-pdf`
Kernlogik in **detaillierten Bullets** (Datenfluss, verwendete Tabellen/RPCs, Berechnungsschritte bzw. PDF-Rendering-Schritte, Fehlerbehandlung).

### Blockstruktur (je ~5 Functions pro Block)
- **Block 1:** ai-consultant, ai-data-import, ai-offer-check, calculate-margin, create-calendar-event
- **Block 2:** daily-security-audit, daily-security-scan, gdpr-cleanup, generate-pdf, import-tariffs
- **Block 3:** invite-user, ionos-connect, notify-admin-registration, rate-limiter, security-log
- **Block 4:** send-admin-invite, send-notification-email, send-offer-email, send-password-reset, sync-emails
- **Block 5:** threat-intel, verify-turnstile — Abschluss + „AUDIT KOMPLETT"

Am Ende jedes Blocks steht **WEITER** und ich warte auf dein „weiter".

### Datenquellen (nur lesend)
- `supabase/functions/*/index.ts` — echte Deno-Quellen
- `supabase/config.toml` — verify_jwt-Overrides
- `rg` über `src/` — Aufrufer via `functions.invoke("<name>")` bzw. `fetch(...)`
- Request-/Response-Shapes verbatim aus Zod-Schemas oder ersten `req.json()`-Destrukturierungen, keine Nachdichtung
- Secrets aus `Deno.env.get(...)`-Vorkommen im jeweiligen index.ts

### Bewusst NICHT enthalten
- Empfehlungen, Refactor-Vorschläge, Sicherheitsbewertungen
- Vollständige Function-Bodies (Zieltool soll frei planen können)
- Deployment-/Konfig-Vorschriften