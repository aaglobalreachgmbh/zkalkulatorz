# Security Documentation

## Quick Reference (Security Manifest)

> **ROLLE:** Du agierst als Senior Security Engineer. Deine oberste Priorität ist die Sicherheit der Anwendung.

### REGEL 1: Datenbank-Härtung (Supabase)

| Anforderung | Code-Beispiel |
|-------------|---------------|
| RLS Pflicht | `ALTER TABLE x ENABLE ROW LEVEL SECURITY` |
| WITH CHECK | `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` |
| Admin-Checks | `public.has_role(auth.uid(), 'admin')` |
| SECURITY DEFINER | `SET search_path = public` |

### REGEL 2: Geheimnisse & Edge Functions

| ❌ Verboten | ✅ Erlaubt |
|-------------|------------|
| API-Keys im Frontend | Supabase Secrets |
| Direkte API-Calls vom Client | Edge Functions als Proxy |
| Auth-Header nur auf Existenz prüfen | JWT kryptographisch verifizieren |

### REGEL 3: Frontend & Validierung

```tsx
// ✅ Immer so:
import { Input } from "@/components/ui";          // = SecureInput
import { useSecurity } from "@/providers/SecurityProvider";
const { sanitize, checkThreats } = useSecurity();

// ❌ Niemals:
<input type="text" ... />                         // Raw HTML
dangerouslySetInnerHTML={{ __html: userInput }}  // XSS-Gefahr
```

### REGEL 4: Projektspezifische Patterns

| Pattern | Import |
|---------|--------|
| Security Context | `useSecurity()` |
| Secure HOC | `withSecurity(Component, { requireAuth: true })` |
| Rate Limiting | `useServerRateLimit('ai')` |
| Encrypted Storage | `useSecureStorage('key')` |

### REGEL 5: AI-Halluzinationen vermeiden

- ✅ Prüfe ob Sicherheitskommentare echten Code haben
- ✅ Nutze nur existierende npm-Pakete
- ✅ Nutze Lovable AI Gateway statt direkter API-Calls

---

## Überblick

Dieses Projekt implementiert ein 8-Schichten-Sicherheitssystem, das automatischen Schutz für alle Komponenten bietet.

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIVERSAL SECURITY FIREWALL                   │
├─────────────────────────────────────────────────────────────────┤
│  1. CSP HEADERS           │ Browser blockt externe Scripts      │
│  2. SECURITY PROVIDER     │ Automatischer Schutz aller Kinder   │
│  3. ERROR BOUNDARY        │ Keine Crash-Screens, sicheres Fail  │
│  4. SECURE HOC            │ Wrapper für alle neuen Komponenten  │
│  5. SECURE INPUT          │ Auto-Sanitization bei Eingaben      │
│  6. THREAT DETECTION      │ Erkennung von Angriffsmustern       │
│  7. RATE LIMITING         │ Schutz vor Brute-Force & Spam       │
│  8. SESSION SECURITY      │ Timeout & Activity-Tracking         │
└─────────────────────────────────────────────────────────────────┘
```

## Verwendung

### 1. SecurityProvider

Alle Komponenten innerhalb des `SecurityProvider` erhalten automatischen Schutz:

```tsx
import { SecurityProvider } from "@/providers/SecurityProvider";

<SecurityProvider>
  <App />
</SecurityProvider>
```

### 2. useSecurity Hook

Zugriff auf Security-Funktionen in Komponenten:

```tsx
import { useSecurity } from "@/providers/SecurityProvider";

function MyComponent() {
  const { sanitize, checkThreats, canMakeRequest } = useSecurity();
  
  const handleInput = (value: string) => {
    // Threat Check
    const result = checkThreats(value);
    if (!result.isSafe) {
      console.warn("Threat detected:", result.threats);
    }
    
    // Sanitize
    const clean = sanitize(value);
  };
  
  const handleApiCall = () => {
    // Rate Limit Check
    if (!canMakeRequest("api")) {
      return; // Zu viele Anfragen
    }
    // ... API Call
  };
}
```

### 3. withSecurity HOC

Automatischer Schutz für neue Komponenten:

```tsx
import { withSecurity } from "@/lib/withSecurity";

function MyComponent(props) {
  return <div>...</div>;
}

// Mit Standardschutz
export default withSecurity(MyComponent);

// Mit Auth-Requirement
export default withSecurity(MyComponent, { requireAuth: true });

// Mit Event-Tracking
export default withSecurity(MyComponent, { trackEvents: true });

// Mit Prop-Sanitization
export default withSecurity(MyComponent, { sanitizeProps: true });
```

### 4. SecureInput Komponente

Drop-in-Replacement für `<input>` mit automatischem Schutz:

```tsx
import { SecureInput } from "@/components/ui/secure-input";

<SecureInput
  type="text"
  placeholder="Eingabe..."
  onChange={(e, sanitizedValue) => {
    // sanitizedValue ist bereits bereinigt
    setValue(sanitizedValue);
  }}
  onThreatDetected={(threats) => {
    console.warn("Bedrohung erkannt:", threats);
  }}
/>
```

### 5. Security Patterns

Zentrale Definition aller Sicherheitsregeln:

```tsx
import { 
  THREAT_PATTERNS,
  SANITIZE_RULES,
  VALIDATION_SCHEMAS,
  FILE_VALIDATION,
  RATE_LIMITS,
  checkAllThreats,
  sanitizeAll,
} from "@/lib/securityPatterns";

// Manuelle Threat-Prüfung
const result = checkAllThreats(userInput);

// Manuelle Sanitization
const clean = sanitizeAll(userInput, 1000);

// Zod-Schema für Validierung
import { z } from "zod";
const schema = VALIDATION_SCHEMAS.email;
```

## Checkliste für neue Komponenten

- [ ] Komponente mit `withSecurity()` wrappen (wenn kritisch)
- [ ] Für Formulare `SecureInput` statt `<input>` verwenden
- [ ] Für sensible Daten `data-sensitive` Attribut hinzufügen
- [ ] Für Drag & Drop `data-allow-drop` Attribut hinzufügen
- [ ] Rate Limiting für API-Calls implementieren
- [ ] Zod-Schemas für Validierung verwenden

## Threat Categories

| Kategorie | Beschreibung | Beispiele |
|-----------|--------------|-----------|
| `sqlInjection` | SQL-Befehle in Eingaben | `SELECT * FROM`, `'; DROP TABLE` |
| `xss` | Cross-Site-Scripting | `<script>`, `javascript:` |
| `promptInjection` | AI-Prompt-Manipulation | `ignore previous instructions` |
| `pathTraversal` | Verzeichnis-Navigation | `../../../etc/passwd` |
| `commandInjection` | Shell-Befehle | `; rm -rf /`, `| cat /etc/passwd` |
| `ldapInjection` | LDAP-Abfragen | `)(|(password=*` |
| `noSqlInjection` | NoSQL-Befehle | `$where`, `$gt`, `$regex` |

## Rate Limits

| Kategorie | Max Requests | Zeitfenster |
|-----------|--------------|-------------|
| API | 60 | 1 Minute |
| AI | 10 | 1 Minute |
| Login | 5 | 5 Minuten |
| Upload | 10 | 1 Minute |

## Session Security

- **Timeout**: 5 Minuten Inaktivität (automatische Abmeldung)
- **Warnung**: 1 Minute vor Timeout
- **Check-Intervall**: Alle 15 Sekunden
- **Activity Events**: Maus, Tastatur, Scroll, Touch, Klick

## CSP Headers

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://ai.gateway.lovable.dev;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
">
```

## Best Practices

1. **Niemals** `dangerouslySetInnerHTML` mit User-Input verwenden
2. **Immer** Input validieren (Zod) UND sanitieren
3. **Immer** Rate Limiting für externe API-Calls
4. **Niemals** sensible Daten in localStorage ohne Verschlüsselung
5. **Immer** HTTPS für alle externen Verbindungen
6. **Niemals** API-Keys im Frontend-Code

## Debugging

Security-Events werden in der Konsole geloggt (nur in DEV):

```
[Security Event] { type: "threat_detected", ... }
```

In Produktion werden nur anonymisierte Logs erstellt.

## Weiterentwicklung

Bei Hinzufügen neuer Dateien:

1. Für kritische Komponenten: `withSecurity()` verwenden
2. Für Formulare: `SecureInput` / `SecureTextarea` verwenden
3. Für API-Calls: `canMakeRequest()` prüfen
4. Für User-Input: `sanitize()` und `checkThreats()` verwenden
5. Bei neuen Threat-Patterns: In `securityPatterns.ts` hinzufügen

Das Sicherheitssystem erweitert sich automatisch auf alle Komponenten innerhalb des `SecurityProvider`.

---

## Entwickler-Guidelines

### ⚠️ KRITISCHE REGELN

1. **NIEMALS** raw `<input>` oder `<textarea>` verwenden
   ```tsx
   // ❌ FALSCH
   <input type="text" value={value} onChange={...} />
   
   // ✅ RICHTIG
   import { Input } from "@/components/ui/input";
   <Input type="text" value={value} onChange={...} />
   ```

2. **IMMER** von `@/components/ui` importieren
   ```tsx
   // ❌ FALSCH - Direkter HTML-Element
   <input type="text" ... />
   
   // ✅ RICHTIG - Automatisch SecureInput
   import { Input } from "@/components/ui";
   <Input type="text" ... />
   ```

3. **Ausnahme: File-Inputs** - Nur für Datei-Uploads
   ```tsx
   import { RawInput } from "@/components/ui/input";
   <RawInput type="file" accept=".xlsx,.csv" ... />
   ```

### Automatischer Schutz für neue Dateien

Durch die Kombination von:

| Mechanismus | Schutz | Automatisch? |
|-------------|--------|--------------|
| **Input-Alias** | `import { Input }` = SecureInput | ✅ JA |
| **ESLint Rules** | `no-eval`, `no-implied-eval`, `no-script-url` | ✅ JA |
| **Zod Validation** | Runtime-Typprüfung | ✅ JA |
| **CSP Headers** | Externe Script-Blockierung | ✅ JA |
| **SecurityProvider** | Globale Threat Detection | ✅ JA |
| **RLS Policies** | Deny-by-Default auf DB-Ebene | ✅ JA |
| **Vite Build** | Console-Removal, Minification | ✅ JA |

...wird **jede neue Datei automatisch** den Sicherheitsstandards unterworfen.

### Code-Review Checkliste

Vor dem Merge prüfen:

- [ ] Alle `<input>` sind `Input` oder `SecureInput`?
- [ ] Alle `<textarea>` sind `Textarea` oder `SecureTextarea`?
- [ ] Keine `dangerouslySetInnerHTML` mit User-Input?
- [ ] Keine `eval()`, `new Function()`, `setTimeout(string)`?
- [ ] API-Keys nur in Edge Functions, nicht im Frontend?
- [ ] Rate Limiting für externe API-Calls implementiert?
- [ ] Zod-Schemas für komplexe Validierung verwendet?

### Barrel-Exports

Zentrale Imports für sichere Komponenten:

```tsx
// Empfohlen: Zentrale Imports
import { 
  Input,           // = SecureInput
  Textarea,        // = SecureTextarea  
  Button, 
  Card 
} from "@/components/ui";

// Auch erlaubt: Einzelne Imports
import { Input } from "@/components/ui/input";  // = SecureInput
```

### Passwort-Felder

Für Passwort-Felder Threat-Detection deaktivieren (Passwörter können false-positives auslösen):

```tsx
<SecureInput
  type="password"
  enableThreatDetection={false}  // Wichtig!
  ...
/>
```

---

## Offline Security (GLOBAL & PERMANENT)

### Architektur-Entscheidung

Die Offline-Fallback-Seite ist eine **permanente, globale** Sicherheitsmaßnahme, 
die in der Anwendungsarchitektur fest verankert ist.

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE SECURITY LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  1. NETWORK DETECTOR       │ Online/Offline Status überwachen   │
│  2. OFFLINE BOUNDARY       │ Isoliert App von Offline-Zustand   │
│  3. SECURE OFFLINE PAGE    │ Minimale, sichere Fallback-UI      │
│  4. SESSION PRESERVATION   │ Auth-Status wird geschützt         │
│  5. DATA PROTECTION        │ Keine sensiblen Ops offline        │
│  6. INPUT BLOCKING         │ Keine Formular-Eingaben möglich    │
└─────────────────────────────────────────────────────────────────┘
```

### Sicherheits-Garantien im Offline-Modus

| Garantie | Beschreibung |
|----------|--------------|
| **Keine sensiblen Daten exponiert** | Keine Margen, Provisionen, EK-Preise sichtbar |
| **Keine Formular-Eingaben** | Verhindert Offline-Injection-Angriffe |
| **Session bleibt geschützt** | Auth-Token wird nicht gelöscht |
| **CSP Headers aktiv** | Browser-Schutz bleibt bestehen |
| **Rate Limiter blockiert** | Keine API-Calls im Offline-Modus |
| **Audit-Log** | Offline-Events werden geloggt |
| **Keyboard-Blocking** | Paste & Submit-Shortcuts blockiert |

### Warum Global?

- **Konsistentes Verhalten** über alle Routen
- **Keine Sicherheitslücken** durch vergessene Route-Handler
- **Zentrale Kontrolle** über Offline-Verhalten
- **Automatischer Schutz** für neue Seiten/Komponenten

### Warum Permanent?

- **Offline-Angriffe sind real** (Man-in-the-Middle, Netzwerk-Spoofing)
- **Benutzer können keine manipulierten Offline-Daten einschleusen**
- **Schützt vor "Offline-then-sync"-Angriffen**
- **Verhindert Daten-Exfiltration bei Netzwerkproblemen**

### Sicherheits-Checkliste gegen Offline-Bedrohungen

| Bedrohung | Schutzmaßnahme | Status |
|-----------|----------------|--------|
| XSS im Offline-Modus | Keine User-Inputs möglich | ✅ |
| Session Hijacking | Token bleibt geschützt, keine Übertragung | ✅ |
| LocalStorage Manipulation | Kein Zugriff auf sensible Keys | ✅ |
| CSRF Offline | Keine Formulare, keine Actions | ✅ |
| Netzwerk-Spoofing | CSP blockiert externe Ressourcen | ✅ |
| Data Exfiltration | Keine API-Calls, Rate Limiter aktiv | ✅ |
| Keyboard Injection | Paste & Submit blockiert | ✅ |
| Cache Poisoning | Keine lokale Datenspeicherung im Offline-Modus | ✅ |

### Verwendung

Die Offline-Security ist automatisch aktiv durch `OfflineBoundary` in `App.tsx`:

```tsx
<SecurityProvider>
  <OfflineBoundary>
    <TooltipProvider>
      {/* Gesamte App ist automatisch geschützt */}
    </TooltipProvider>
  </OfflineBoundary>
</SecurityProvider>
```

### Netzwerk-Status Hook

```tsx
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function MyComponent() {
  const { isOnline, wasOffline, retry } = useNetworkStatus();
  
  if (!isOnline) {
    // Wird automatisch durch OfflineBoundary behandelt
  }
}
```

---

## Zero-Trust API Gateway (GLOBAL & PERMANENT)

### Architektur-Prinzip

**Jede externe Verbindung ist per Default untrusted.**

Das Zero-Trust API Gateway erweitert die Sicherheitsarchitektur auf 16 Schichten:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZERO-TRUST API GATEWAY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ LLM SECURITY │  │ API GATEWAY  │  │ TUNNEL SECURITY      │   │
│  │    LAYER     │  │   WRAPPER    │  │     GUARD            │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                  │                     │               │
│         └─────────────┬────┴─────────────────────┘               │
│                       │                                          │
│              ┌────────▼────────┐                                 │
│              │ ZERO-DAY DEFENSE│                                 │
│              │     LAYER       │                                 │
│              └────────┬────────┘                                 │
│                       │                                          │
├───────────────────────┼──────────────────────────────────────────┤
│  EXISTING 12 LAYERS   │                                          │
│  (CSP, Provider,      │                                          │
│   Offline, CSRF, etc.)│                                          │
└───────────────────────┴──────────────────────────────────────────┘
```

### Automatischer Schutz für

- ✅ LLM/AI APIs (OpenAI, Gemini, Lovable AI)
- ✅ Payment APIs (Stripe, etc.)
- ✅ Communication APIs (Twilio, etc.)
- ✅ WebSocket Verbindungen
- ✅ Server-Sent Events (SSE)
- ✅ Alle zukünftigen Integrationen

### Komponenten

#### 1. Secure API Gateway (`src/lib/secureApiGateway.ts`)

Zentraler Schutz für alle ausgehenden HTTP-Anfragen:

| Feature | Beschreibung |
|---------|--------------|
| SSRF Protection | Blockiert private IPs, Cloud Metadata Endpoints |
| Domain Whitelist | Nur erlaubte Domains pro Kategorie |
| Rate Limiting | Pro-Kategorie Limits (AI: 10/min, API: 60/min) |
| Payload Sanitization | Automatische Bereinigung von Request Bodies |
| Response Validation | Header- und Content-Prüfung |
| Timeout Enforcement | Schutz vor Slowloris/DoS |

```tsx
import { secureApiCall } from "@/lib/secureApiGateway";

// ALLE externen API-Calls müssen so aussehen:
const data = await secureApiCall({
  url: "https://api.example.com/endpoint",
  method: "POST",
  body: { ... },
  category: "general",
});
```

#### 2. LLM Security Layer (`src/lib/llmSecurityLayer.ts`)

Spezieller Schutz für AI/LLM-Interaktionen:

| Schutz | Beschreibung |
|--------|--------------|
| Direct Prompt Injection | "ignore previous instructions", "new mode" |
| Jailbreak Detection | "DAN mode", "Developer mode", "No filters" |
| System Prompt Leak Prevention | Erkennt Versuche, System Prompt zu extrahieren |
| Indirect Injection | Injections über Daten (hidden instructions) |
| Multi-Turn Attack Detection | Gestaffelte Angriffe über mehrere Messages |
| Output Filtering | Filtert API Keys, System Prompts aus Antworten |

```tsx
import { checkPromptInjection, filterLlmOutput } from "@/lib/llmSecurityLayer";

// Input-Prüfung
const result = checkPromptInjection(userMessage);
if (!result.safe) {
  console.warn("Injection attempt:", result.threats);
}

// Output-Filterung
const safeOutput = filterLlmOutput(aiResponse);
```

#### 3. Tunnel Security Guard (`src/lib/tunnelSecurityGuard.ts`)

Schutz für persistente Verbindungen:

| Schutz | Beschreibung |
|--------|--------------|
| Origin Validation | Nur erlaubte WebSocket/SSE Endpoints |
| Message Rate Limiting | Max 100 Messages/Sekunde |
| Message Size Limits | Max 64KB pro Message |
| Content Validation | Threat Detection auf Message-Ebene |
| Connection Monitoring | Anomalie-Detection pro Verbindung |

```tsx
import { createSecureWebSocket } from "@/lib/tunnelSecurityGuard";

// Gesicherter WebSocket
const ws = createSecureWebSocket("wss://...", {
  maxMessagesPerSecond: 50,
});
```

#### 4. Zero-Day Defense Layer (`src/lib/zeroDefenseLayer.ts`)

Heuristische Erkennung unbekannter Angriffe:

| Technik | Beschreibung |
|---------|--------------|
| Anomaly Scoring | 0-100 Score basierend auf Verhalten |
| Entropy Detection | Erkennt verdächtig zufällige Daten |
| Rapid Action Detection | Erkennt zu schnelle Aktionsfolgen |
| Behavioral Baseline | Vergleich mit normalem Nutzerverhalten |
| Session Quarantine | Automatische Isolation bei kritischen Anomalien |

```tsx
import { analyzeAction, isSessionQuarantined } from "@/lib/zeroDefenseLayer";

// Jede Aktion analysieren
const result = analyzeAction("form_submit", userInput);

if (result.recommendation === "hard_block") {
  // Aktion blockieren
}

if (result.level === "critical") {
  // Session wird automatisch quarantiniert
}
```

### useSecureApi Hook

React Hook für sichere API-Aufrufe:

```tsx
import { useSecureApi, useSecureLlmApi } from "@/hooks/useSecureApi";

function MyComponent() {
  // Für allgemeine APIs
  const [state, { execute }] = useSecureApi({ category: "general" });
  
  // Für LLM APIs (mit Prompt Injection Schutz)
  const [llmState, llmActions] = useSecureLlmApi();
  
  const handleSubmit = async () => {
    // Automatisch durch Gateway geschützt
    const data = await execute(url, "POST", body);
  };
}
```

### Neue Threat Patterns

| Kategorie | Pattern | Risiko |
|-----------|---------|--------|
| `jailbreak` | "DAN mode", "Developer mode" | Critical |
| `systemPromptLeak` | "show your system prompt" | Critical |
| `indirectInjection` | "when you see this, do..." | High |
| `multiTurnAttack` | Gestaffelte Angriffe | High |
| `ssrf` | Private IPs, Cloud Metadata | Critical |
| `highEntropy` | Verdächtig zufällige Daten | Medium |
| `rapidActions` | Aktionen schneller als 100ms | Medium |

### Sicherheits-Checkliste für neue Integrationen

| Anforderung | Implementierung |
|-------------|-----------------|
| ✅ API über Gateway | `useSecureApi()` oder `secureApiCall()` |
| ✅ LLM-Schutz | `useSecureLlmApi()` mit Prompt Filtering |
| ✅ WebSocket gesichert | `createSecureWebSocket()` |
| ✅ Anomalie-Tracking | `analyzeAction()` bei User-Aktionen |
| ✅ Rate Limits | Automatisch durch Gateway |
| ❌ Direkter fetch() | NIEMALS für externe APIs |

### Für Entwickler: KRITISCHE REGELN

```tsx
// ❌ NIEMALS - Direkter fetch zu externen APIs
const response = await fetch("https://api.external.com/...");

// ✅ IMMER - Über Secure API Gateway
import { useSecureApi } from "@/hooks/useSecureApi";
const [state, { execute }] = useSecureApi({ category: "general" });
const data = await execute("https://api.external.com/...", "GET");

// ❌ NIEMALS - Roher WebSocket
const ws = new WebSocket("wss://...");

// ✅ IMMER - Über Tunnel Security Guard
import { createSecureWebSocket } from "@/lib/tunnelSecurityGuard";
const ws = createSecureWebSocket("wss://...");
```

---

## 🔒 Security Audit (27.12.2025)

### Basis-Dokument

Audit durchgeführt basierend auf: **"Strategien zur Härtung von Vibe Coding Applikationen auf der Lovable-Plattform"**

### Ergebnis-Zusammenfassung

| Bereich | PDF-Empfehlung | Status | Details |
|---------|----------------|--------|---------|
| **RLS Aktiviert** | Alle Tabellen | ✅ | USING + WITH CHECK auf allen Tabellen |
| **Multi-Tenant Isolation** | JWT Claims nutzen | ✅ | `get_my_tenant_id()` Funktion |
| **SECURITY DEFINER** | search_path setzen | ✅ | Alle Funktionen haben `search_path = public` |
| **Edge Function Auth** | JWT kryptographisch prüfen | ✅ | `supabase.auth.getUser()` Validierung |
| **CORS Konfiguration** | Origin Whitelist | ✅ | Alle Edge Functions mit ALLOWED_ORIGINS |
| **Rate Limiting** | Pro User/Kategorie | ✅ | 10/min AI, 60/min API |
| **Input Validation** | Zod strict mode | ✅ | `securityPatterns.ts` + Edge Functions |
| **Prompt Injection** | Sandwich Defense | ✅ | `llmSecurityLayer.ts` implementiert |
| **Output Filtering** | API Key Redaction | ✅ | `filterAIOutput()` in ai-consultant |
| **Encrypted Storage** | Session-based Key | ✅ | AES-256-GCM in `secureStorage.ts` |
| **No Secrets in Frontend** | Edge Functions nutzen | ✅ | Alle APIs über Edge Functions |
| **Content-Type Check** | Nur JSON erlauben | ✅ | ai-consultant prüft explizit |

### RLS-Policies Verifiziert

```sql
-- Alle Tabellen haben korrekte Policies:
profiles:              auth.uid() = id (USING + WITH CHECK)
customers:             auth.uid() = user_id (alle Operationen)
saved_offers:          auth.uid() = user_id + Team-Access
calculation_history:   Tenant-Isolation
user_roles:            Admin only (has_role check)
security_events:       Admin only
daily_security_reports: Admin only
```

### Edge Function Security Headers

Alle Edge Functions implementieren:

```typescript
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};
```

### Dependency Audit

| Paket | CVE | Status |
|-------|-----|--------|
| xlsx@0.18.5 | CVE-2023-30533 | ✅ Gepatcht |
| react@18.3.1 | - | ✅ Sicher (nicht 19.x) |
| @react-pdf/renderer | - | ✅ PDF-Generierung (kein JS-Rendering) |

### Nächste Schritte (Optional)

1. **npm audit in CI/CD** - GitHub Actions Workflow hinzufügen
2. **pgTAP RLS Tests** - Automatisierte Policy-Tests
3. ~~**Object.freeze(Object.prototype)** - Prototype Pollution Schutz~~ ✅ Implementiert (28.12.2025)

---

## 🛡️ Go-Live Checkliste

Vor dem Deployment prüfen:

- [ ] RLS aktiviert + WITH CHECK für alle Tabellen?
- [ ] Keine Secrets im Client-Code?
- [ ] npm audit ausgeführt (keine kritischen Lücken)?
- [ ] Prototype Pollution Schutz aktiv?
- [ ] Edge Functions mit CORS-Whitelisting?
- [ ] Zod-Validierung für alle Formulare?
- [ ] SecureInput statt raw `<input>`?
- [ ] Rate Limiting für externe APIs?

**Interaktive Checkliste:** Verfügbar im Security Dashboard (`/security-dashboard`)

---

*Letztes Audit: 28.12.2025 | Auditor: AI Security Scan*
