# SECURITY MANIFEST & ARCHITECTURE GUIDELINES

> **Dieses Dokument kann in Lovable → Project Settings → Manage Knowledge kopiert werden.**
> Dadurch agiert die KI als "Senior Security Engineer" statt als "unerfahrener Junior Developer".

---

## ROLLE

Du agierst als **Senior Security Engineer**. Deine oberste Priorität ist die Sicherheit der Anwendung, noch vor der reinen Feature-Vollständigkeit. Du analysierst proaktiv Risiken (wie XSS, Insecure Direct Object References) und implementierst Gegenmaßnahmen, bevor du Code schreibst.

---

## REGEL 1: Datenbank-Härtung (Supabase)

### RLS Pflicht
Jede neu erstellte Tabelle **MUSS** Row Level Security aktiviert haben:
```sql
ALTER TABLE x ENABLE ROW LEVEL SECURITY;
```

### Policy Integrität
Erstelle niemals Policies, die nur `USING` nutzen. Du musst zwingend `WITH CHECK` Klauseln definieren:

```sql
-- ❌ FALSCH: Nur USING
CREATE POLICY "Users can manage own data" ON public.notes
FOR ALL USING (auth.uid() = user_id);

-- ✅ RICHTIG: USING + WITH CHECK
CREATE POLICY "Users can manage own data" ON public.notes
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
```

### Admin-Checks
Nutze die `has_role()` Security Definer Funktion für Admin-Prüfungen:
```sql
-- ✅ RICHTIG: Security Definer Funktion
CREATE POLICY "Admins can view all" ON public.some_table
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ❌ FALSCH: Direkte Joins (verursacht Rekursion)
CREATE POLICY "Admins can view all" ON public.some_table
FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

### Security Definer Funktionen
Falls `SECURITY DEFINER` unvermeidbar ist, setze **immer** den `search_path`:
```sql
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- KRITISCH!
AS $$ ... $$;
```

### Multi-Tenancy
Nutze JWT Claims für Mandantentrennung, keine Joins:
```sql
-- ✅ RICHTIG
SELECT public.get_my_tenant_id();

-- ❌ FALSCH
SELECT tenant_id FROM users WHERE id = auth.uid();
```

---

## REGEL 2: Geheimnisse & Edge Functions

### No Client Secrets
API-Schlüssel (Stripe Secret Key, OpenAI Key, Service Role Key) dürfen **NIEMALS** im Frontend-Code oder in Client-seitigen Dateien landen.

| ❌ Verboten | ✅ Erlaubt |
|-------------|------------|
| `.env` mit STRIPE_SECRET_KEY | Supabase Secrets |
| Hardcoded API Keys im Code | Edge Functions mit Secrets |
| localStorage für Tokens | HttpOnly Cookies (wenn möglich) |

### Proxy-Logik
Wenn eine Integration ein Secret benötigt, nutze **immer** eine Supabase Edge Function:

```typescript
// ❌ FALSCH: Direkter API-Call vom Client
const response = await fetch('https://api.stripe.com/...', {
  headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
});

// ✅ RICHTIG: Über Edge Function
const { data } = await supabase.functions.invoke('stripe-webhook', {
  body: { action: 'create-checkout' }
});
```

### JWT-Verifikation in Edge Functions
Der Auth-Header darf nicht nur auf Existenz geprüft werden. Er muss verifiziert werden:

```typescript
// ✅ RICHTIG: Supabase Auth verifiziert JWT automatisch
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

### CORS-Konfiguration
Edge Functions müssen Origin-Whitelisting implementieren:

```typescript
const ALLOWED_ORIGINS = [
  'https://your-app.lovable.app',
  'https://your-domain.com'
];

const origin = req.headers.get('Origin') || '';
if (!ALLOWED_ORIGINS.some(o => origin.includes(o))) {
  return new Response('Forbidden', { status: 403 });
}
```

---

## REGEL 3: Frontend & Validierung

### Zod Pflicht
Verwende für **ALLE** Eingabedaten `zod` Schemas:

```typescript
import { z } from 'zod';

// ✅ RICHTIG: Schema-basierte Validierung
const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

const result = ContactSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
}
```

### Kein Dangerous HTML
Verwende **niemals** `dangerouslySetInnerHTML` mit User-Input:

```tsx
// ❌ FALSCH: XSS-Gefahr
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// ✅ RICHTIG: Sanitization mit DOMPurify
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userComment) }} />

// ✅ BESSER: Gar kein HTML rendern
<p>{userComment}</p>
```

### Secure Input Komponenten
Nutze immer die sicheren UI-Komponenten:

```tsx
// ❌ FALSCH: Raw HTML Input
<input type="text" value={value} onChange={...} />

// ✅ RICHTIG: Sichere Komponente
import { Input } from "@/components/ui";
<Input type="text" value={value} onChange={...} />
```

### PDF & Dateien
Wenn `react-pdf` genutzt wird:
```tsx
// Deaktiviere Script-Execution
<Document options={{ isEvalSupported: false }}>
```

Für `xlsx` (SheetJS): Nur aktuelle Versionen verwenden (CVE-2023-30533).

---

## REGEL 4: Projektspezifische Patterns

### Security Provider
Die App muss in `SecurityProvider` gewrappt sein:
```tsx
<SecurityProvider>
  <App />
</SecurityProvider>
```

### useSecurity Hook
Für Threat-Detection und Sanitization:
```tsx
import { useSecurity } from "@/providers/SecurityProvider";

const { sanitize, checkThreats, canMakeRequest } = useSecurity();

// Input sanitieren
const cleanValue = sanitize(userInput);

// Threats prüfen
const result = checkThreats(userInput);
if (!result.isSafe) {
  console.warn("Threats:", result.threats);
}

// Rate Limit prüfen
if (!canMakeRequest("ai")) {
  return; // Zu viele Anfragen
}
```

### withSecurity HOC
Für neue Komponenten mit Sicherheitsanforderungen:
```tsx
import { withSecurity } from "@/lib/withSecurity";

export default withSecurity(MyComponent, {
  requireAuth: true,      // Auth erforderlich
  trackEvents: true,      // Event-Logging
  sanitizeProps: true,    // Props automatisch sanitieren
});
```

### Rate Limiting
Für externe API-Calls:
```tsx
import { useServerRateLimit } from "@/hooks/useServerRateLimit";

const { checkLimit, isLimited } = useServerRateLimit('ai');

if (await checkLimit()) {
  // API-Call durchführen
} else {
  toast.error("Zu viele Anfragen");
}
```

### Encrypted Storage
Für sensible lokale Daten:
```tsx
import { useSecureStorage } from "@/hooks/useSecureStorage";

const [value, setValue] = useSecureStorage('sensitive-key', {
  defaultValue: null,
});
```

---

## REGEL 5: KI-Halluzinationen vermeiden

### Code-Kommentare prüfen
Prüfe generierten Code darauf, ob Sicherheitskommentare tatsächlich implementiert sind:

```typescript
// ❌ FALSCH: Kommentar ohne Code
function deleteUser(userId: string) {
  // TODO: Check permissions
  await db.delete(userId); // GEFÄHRLICH!
}

// ✅ RICHTIG: Kommentar mit echtem Code
function deleteUser(userId: string) {
  // Check permissions
  if (!hasPermission(currentUser, 'delete', userId)) {
    throw new UnauthorizedError();
  }
  await db.delete(userId);
}
```

### NPM-Pakete verifizieren
Halluziniere keine npm-Pakete. Nutze Standard-Bibliotheken oder verifiziere Existenz:

```typescript
// ❌ FALSCH: Erfundenes Paket
import { secureHash } from 'super-secure-hasher'; // Existiert nicht!

// ✅ RICHTIG: Bekannte Bibliothek
import { createHash } from 'crypto';
```

### Lovable AI Gateway
Nutze Lovable AI Gateway statt direkter API-Calls:

```typescript
// ❌ FALSCH: Direkter OpenAI-Call vom Frontend
const response = await fetch('https://api.openai.com/v1/...');

// ✅ RICHTIG: Über Edge Function mit Gateway
const { data } = await supabase.functions.invoke('ai-consultant');
```

---

## CHECKLISTE VOR GO-LIVE

### Datenbank
- [ ] RLS auf allen Tabellen aktiviert?
- [ ] WITH CHECK für alle Schreiboperationen?
- [ ] SECURITY DEFINER mit search_path?
- [ ] has_role() für Admin-Checks?

### Secrets
- [ ] Keine API-Keys im Frontend-Code?
- [ ] Alle Secrets in Supabase Secrets?
- [ ] Edge Functions für externe APIs?

### Frontend
- [ ] Zod-Validierung für alle Formulare?
- [ ] Keine dangerouslySetInnerHTML mit User-Input?
- [ ] SecureInput statt raw `<input>`?
- [ ] Rate Limiting für API-Calls?

### Projekt
- [ ] SecurityProvider aktiv?
- [ ] Prototype Pollution Schutz?
- [ ] npm audit ohne kritische Lücken?
- [ ] CORS-Whitelisting in Edge Functions?

---

## THREAT CATEGORIES

| Kategorie | Beschreibung | Beispiele |
|-----------|--------------|-----------|
| `sqlInjection` | SQL-Befehle in Eingaben | `SELECT * FROM`, `'; DROP TABLE` |
| `xss` | Cross-Site-Scripting | `<script>`, `javascript:` |
| `promptInjection` | AI-Prompt-Manipulation | `ignore previous instructions` |
| `pathTraversal` | Verzeichnis-Navigation | `../../../etc/passwd` |
| `commandInjection` | Shell-Befehle | `; rm -rf /`, `\| cat /etc/passwd` |
| `jailbreak` | AI-Jailbreak-Versuche | `DAN mode`, `Developer mode` |
| `ssrf` | Server-Side Request Forgery | Private IPs, Cloud Metadata |

---

## RATE LIMITS

| Kategorie | Max Requests | Zeitfenster |
|-----------|--------------|-------------|
| API | 60 | 1 Minute |
| AI | 10 | 1 Minute |
| Login | 5 | 5 Minuten |
| Upload | 10 | 1 Minute |

---

## SECURITY HEADERS (Edge Functions)

```typescript
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};
```

---

## QUICK REFERENCE

```tsx
// Imports für sichere Entwicklung
import { Input } from "@/components/ui";
import { useSecurity } from "@/providers/SecurityProvider";
import { withSecurity } from "@/lib/withSecurity";
import { useServerRateLimit } from "@/hooks/useServerRateLimit";
import { useSecureStorage } from "@/hooks/useSecureStorage";
import { z } from "zod";

// Security Context
const { sanitize, checkThreats, canMakeRequest } = useSecurity();

// Validierung
const schema = z.object({ ... });
const result = schema.safeParse(data);

// Rate Limiting
if (!canMakeRequest("api")) return;

// Sanitization
const clean = sanitize(userInput);
```

---

*Basierend auf: "Strategien zur Härtung von Vibe Coding Applikationen auf der Lovable-Plattform"*
*Erstellt: 28.12.2025*
