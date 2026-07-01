
# Fix: E-Mail-Versand schlägt fehl (Resend, unverifizierte Sender-Domain)

## Bestätigter Befund

Alle 8 Edge Functions, die Mails verschicken, fallen auf Resends Shared-Test-Domain (`onboarding@resend.dev`, `noreply@resend.dev`, `security@resend.dev`) zurück. Resend erlaubt darüber nur Versand an die eigene Account-E-Mail; jeder Kunden-/Team-Empfänger bekommt 403. Für dieses Projekt ist zusätzlich **keine Sender-Domain konfiguriert** (`email_domain--check_email_domain_status` = `not_started`). Der Secret `SENDER_EMAIL_ADDRESS` existiert bereits, sein Inhalt ist im Zweifel leer oder ebenfalls `@resend.dev`.

## Voraussetzung (durch dich, nicht durch mich behebbar)

Genau **einen** der beiden Wege wählen — die Code-Änderung passt für beide:

**Weg A — bei Resend bleiben (schnellster Fix):**
1. In deinem Resend-Dashboard eine Domain verifizieren (z. B. `mail.zkalkulatorz.de`) — DNS-Records SPF/DKIM/DMARC setzen.
2. Im Cloud-Secret `SENDER_EMAIL_ADDRESS` eine Adresse dieser Domain hinterlegen, z. B. `noreply@mail.zkalkulatorz.de`.
3. Sicherstellen, dass `RESEND_API_KEY` auf die verifizierte Domain berechtigt ist.

**Weg B — auf Lovable Emails wechseln (empfohlen mittelfristig):** Sender-Domain über die Cloud-Emails-UI provisionieren, dann alle Edge Functions von `resend.send()` auf `send-transactional-email` umbauen. Größerer Umbau — sinnvoll, aber nicht in diesem Fix.

Dieser Plan setzt **Weg A** um.

## Code-Änderung (klein, deterministisch)

Einheitliches Muster in **jeder** betroffenen Edge Function:

```ts
const SENDER = Deno.env.get("SENDER_EMAIL_ADDRESS");
if (!SENDER) {
  return new Response(
    JSON.stringify({ error: "Email sender not configured" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

Dann `from` immer aus `SENDER` bauen (Firmennamen weiterhin als Anzeige-Prefix erlaubt: `${company} <${SENDER}>`).

Betroffene Dateien und die zu ersetzenden Zeilen:

| Datei | Aktuell | Neu |
|---|---|---|
| `supabase/functions/send-offer-email/index.ts:479` | `SENDER_EMAIL_ADDRESS \|\| "onboarding@resend.dev"` | Nur `SENDER`, Fallback → 500 |
| `supabase/functions/send-password-reset/index.ts:238` | hartkodiert `noreply@resend.dev` | `${branding.companyName} <${SENDER}>` |
| `supabase/functions/invite-user/index.ts:38` | Default `noreply@resend.dev` | `SENDER` |
| `supabase/functions/send-admin-invite/index.ts:37` | Default `noreply@resend.dev` | `SENDER` |
| `supabase/functions/notify-admin-registration/index.ts:7` | Default `onboarding@resend.dev` | `SENDER` |
| `supabase/functions/security-log/index.ts:160` | hartkodiert `onboarding@resend.dev` | `SENDER` |
| `supabase/functions/daily-security-scan/index.ts:267` | hartkodiert `security@resend.dev` | `SENDER` |
| `supabase/functions/daily-security-audit/index.ts:186` | hartkodiert `security@resend.dev` | `SENDER` |
| `supabase/functions/gdpr-cleanup/index.ts:287` | hartkodiert `noreply@resend.dev` | `SENDER` |

Anschließend: `deploy_edge_functions` für alle 9 Funktionen.

## Rationale für „fail loud" statt Fallback

Ein stilles Fallback auf `resend.dev` war genau die Ursache — es wirkt lokal, bricht in Produktion und ist im Log als „funktioniert grundsätzlich" schwer zu erkennen. Ohne konfigurierten Sender jetzt bewusst 500 zurückgeben, damit der Fehler früh sichtbar wird.

## Verifikation nach Deploy

1. `SENDER_EMAIL_ADDRESS` gesetzt → Testmail über `send-offer-email` an eine Adresse **außerhalb** der Resend-Account-Owner-Mail versenden.
2. Log der Edge Function: kein `statusCode: 403` mehr.
3. Passwort-Reset gegen eine externe Mail testen.

## Was **nicht** Teil dieses Fixes ist

- Rate-Limits, Template-Umbau, GDPR-Retention.
- Umstellung auf Lovable Emails (`send-transactional-email`).
- DNS-Setup — muss der Domain-Inhaber im Resend-Dashboard machen.
