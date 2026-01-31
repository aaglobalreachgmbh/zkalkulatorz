

# PHASE 0: BUILD-RETTUNG

## Analyse-Ergebnis (Bestätigt)

### Package.json Status
| Paket | Installiert? | Aktion |
|-------|--------------|--------|
| `next` | ❌ NEIN | Keine Aktion nötig |
| `@supabase/ssr` | ❌ NEIN | Keine Aktion nötig |
| `next-themes` | ✅ JA (Zeile 74) | **BEHALTEN** - wird von `sonner.tsx` benötigt |

### Zu löschende Dateien
| Datei | Zeilen | Problem |
|-------|--------|---------|
| `src/utils/supabase/middleware.ts` | 49 | Importiert `@supabase/ssr` + `next/server` |
| `src/utils/supabase/server.ts` | 29 | Importiert `@supabase/ssr` + `next/headers` |

### Ordner-Bereinigung
Nach Löschung der beiden Dateien ist `src/utils/supabase/` leer → **Ordner ebenfalls löschen**

---

## Aktionen

### Aktion 1: Lösche Build-Breaker Dateien
```text
LÖSCHEN: src/utils/supabase/middleware.ts
LÖSCHEN: src/utils/supabase/server.ts
```

### Aktion 2: Lösche leeren Ordner
```text
LÖSCHEN: src/utils/supabase/ (wird leer nach Aktion 1)
```

### Aktion 3: Keine package.json Änderung
- `next` und `@supabase/ssr` sind nicht installiert
- `next-themes` bleibt (Dependency von sonner)

---

## Technischer Hintergrund

Die gelöschten Dateien enthielten Next.js Server-APIs die in Vite nicht existieren:
- `createServerClient` aus `@supabase/ssr` (Server-side Supabase)
- `cookies` aus `next/headers` (Next.js Server Component API)
- `NextResponse`, `NextRequest` aus `next/server` (Next.js Middleware API)

Das Projekt nutzt korrekt `@supabase/supabase-js` für Client-side Auth via `src/integrations/supabase/client.ts`.

---

## Validierung

Nach Durchführung:
```bash
npm run build
# Erwartung: Exit Code 0, keine TS2307 Fehler
```

---

## Nach Phase 0: Nächste Schritte

Nach erfolgreichem Build geht es weiter mit:
- **Phase 1**: State-Inventur von `Wizard.tsx`
- **Phase 2**: Architektur-Design (`CalculatorContext` + `CalculatorShell`)
- **Phase 3**: Implementation mit Mobile Rescue

