# Security Documentation

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

- **Timeout**: 30 Minuten Inaktivität
- **Warnung**: 5 Minuten vor Timeout
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
