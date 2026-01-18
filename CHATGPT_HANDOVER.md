# PROJEKT-STATUS-BERICHT: MargenKalkulator (Antigravity Rebuild)
**Datum:** 2026-01-18
**Ziel:** Synchronisation mit ChatGPT Architect

## 1. System-Status: LIVE (Lovable Cloud)
Das System wurde erfolgreich als **Managed Instance** auf Lovable Cloud deployt. Die Infrastruktur wird von Lovable verwaltet, aber die Logik ist custom "Antigravity"-Code.

- **URL:** (Dein Lovable Link hier einfügen)
- **Supabase Project:** Managed by Lovable (`mexrgeaf...`)
- **Repo:** `zkalkulatorz` (GitHub)
- **Deployment:** Automatisch via Lovable Sync.

## 2. Architektur (Final Decision)
Wir nutzen eine **Event-Driven Serverless Architecture**.
- **Frontend:** Next.js (via Lovable/Vercel).
- **Backend:** Supabase (PostgreSQL).
- **Logik:** Deno Edge Functions (Serverless).
- **Security:** "Split-Table" Design + Row Level Security (RLS).

## 3. Implementierte Kern-Komponenten (Code)

### A. Der Vertrag (Contract-First)
`src/lib/contracts.ts`
```typescript
export const CalculationInputSchema = z.object({
  productId: z.string().uuid(),
  volume: z.coerce.number().positive(),
  customerType: CustomerTypeEnum,
});

export const CalculationOutputSchema = z.object({
  margin: z.number(),
  marginPercent: z.number(),
  recommendedPrice: z.number(),
});
```

### B. Die "Black Box" Logik (Edge Function)
`supabase/functions/calculate-margin/index.ts`
- **Isolation:** Nutzt `SUPABASE_SERVICE_ROLE_KEY` (in Lovable Secrets hinterlegt).
- **Logik:**
    1. Liest `list_price` aus `tariffs_public` (Public).
    2. Liest `cost_price` aus `tariffs_commercial` (Protected/RLS).
    3. Berechnet Marge = (Umsatz - Kosten).
- **Sicherheit:** Gibt NIEMALS `cost_price` an das Frontend zurück.

### C. Datenbank-Festung (Schema)
`supabase/migrations/`
- **`tariffs_public`**: Sichtbar für Authenticated Users.
- **`tariffs_commercial`**: RLS "Deny All" (Nur Service Role darf lesen).
- **Honeytokens**: Tabelle `honeytokens` zur Runtime Defense (Alarm bei Zugriff).

## 4. Aktuelle Compliance (The 9 Directives)
Wir haben die akademischen Vorgaben (MIT/Stanford Prinzipien) technisch umgesetzt:
- [x] **No Vibe Coding:** Alles ist Zod-Typisiert.
- [x] **Self-Annealing:** Fehlerkorrektur via DOE Framework.
- [x] **Enterprise Design:** Vodafone Colors & Geist Sans.

## 5. Nächste Schritte für ChatGPT
"ChatGPT, bitte übernimm ab hier für **Phase 8 (Data Ingestion)**:
1.  Wir müssen echte Vodafone-Tarife (CSV) in die `tariffs_commercial` Tabelle importieren.
2.  Da RLS den direkten Zugriff blockiert, brauchen wir ein Admin-Script oder eine Seed-Function."
