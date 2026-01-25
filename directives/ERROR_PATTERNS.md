# Antigravity Error Pattern Registry
# Self-Annealing Knowledge Base

**Zuletzt aktualisiert:** 2026-01-25  
**Zweck:** Bekannte Fehlermuster dokumentieren, um zukünftige Fehler zu verhindern.

---

## Fehlermuster-Katalog

### ERR_001: CLI Missing Argument
```yaml
pattern_id: ERR_001
pattern: "flag needs an argument"
regex: "flag needs an argument: --(\w+)"
category: CLI_MISSING_ARG
severity: HIGH
```

**Symptom:**
```
Error: flag needs an argument: --password
```

**Root Cause:**
- Environment-Variable oder GitHub Secret ist leer/nicht gesetzt
- CLI-Befehl erwartet einen Wert, bekommt aber leeren String

**Betroffene Dateien:**
- `.github/workflows/deploy.yml`
- Jeder CLI-Aufruf mit `--flag $VARIABLE`

**Prävention:**
```bash
# Vor CLI-Aufruf prüfen:
if [ -z "$VARIABLE" ]; then
  echo "⏭️ Skipping: VARIABLE not set"
  exit 0
fi
```

**Fix angewendet:** 2026-01-25 in `deploy.yml`

---

### ERR_002: Module Not Found
```yaml
pattern_id: ERR_002
pattern: "Cannot find module"
regex: "Cannot find module ['\"](.+)['\"]"
category: IMPORT_RESOLUTION
severity: HIGH
```

**Symptom:**
```
Error: Cannot find module './math-operators'
```

**Root Cause:**
- Korrupte `node_modules/` Installation
- Fehlende Dependency
- Falscher Import-Pfad

**Prävention:**
```bash
# Clean install:
rm -rf node_modules package-lock.json
npm install
```

**Fix angewendet:** 2026-01-25 (TailwindCSS math-operators)

---

### ERR_003: Failed to Resolve Import (Nested node_modules)
```yaml
pattern_id: ERR_003
pattern: "Failed to resolve import"
regex: "Failed to resolve import ['\"](.+)['\"] from ['\"](.+/node_modules/.+)['\"]"
category: NESTED_NODE_MODULES
severity: CRITICAL
```

**Symptom:**
```
Failed to resolve import "es-toolkit/compat/sortBy" from "src/node_modules/recharts/..."
```

**Root Cause:**
- Parasitäres `node_modules/` Verzeichnis im falschen Ordner (z.B. `src/node_modules/`)
- Vite/Rollup findet falsche Module

**Prävention:**
```bash
# Prüfen ob es unerwartete node_modules gibt:
find . -name "node_modules" -type d | grep -v "^./node_modules$"

# Falls gefunden, löschen:
rm -rf src/node_modules/
```

**Fix angewendet:** 2026-01-25 (src/node_modules/ gelöscht)

---

### ERR_004: iCloud Conflict Duplicates
```yaml
pattern_id: ERR_004
pattern: "React Hook .* called conditionally"
secondary_pattern: "* 2.ts, * 3.ts"
category: ICLOUD_CONFLICT
severity: HIGH
```

**Symptom:**
```
React Hook "useCallback" is called conditionally
(aus Datei wie useDrafts 2.ts)
```

**Root Cause:**
- iCloud-Synchronisierung erstellt Duplikate bei Konflikten
- Dateien mit ` 2`, ` 3` Suffix enthalten veralteten Code

**Prävention:**
```bash
# Duplikate finden:
find . \( -name "* 2.*" -o -name "* 3.*" \) -not -path "./node_modules/*" -type f

# Duplikate löschen:
find . \( -name "* 2.*" -o -name "* 3.*" \) -not -path "./node_modules/*" -not -path "./knowledge/*" -type f -delete
```

**Fix angewendet:** 2026-01-25 (44 Duplikate gelöscht)

---

### ERR_005: Duplicate Config Files
```yaml
pattern_id: ERR_005
pattern: "multiple package.json"
regex: "Conflicting configuration"
category: DUPLICATE_CONFIG
severity: MEDIUM
```

**Symptom:**
- Build-Konfusion
- Falsche Dependencies verwendet

**Root Cause:**
- `package.json` in Unterordnern (z.B. `src/package.json`)
- Reste von anderen Frameworks (Next.js Configs in Vite-Projekt)

**Prävention:**
```bash
# Doppelte configs finden:
find . -name "package.json" -not -path "./node_modules/*"
find . -name "tsconfig*.json" -not -path "./node_modules/*"

# Sollte nur Root-Level configs zeigen
```

**Fix angewendet:** 2026-01-25 (src/package.json etc. gelöscht)

---

## Kategorien-Übersicht

| Kategorie | Beschreibung | Typische Lösung |
|-----------|--------------|-----------------|
| `CLI_MISSING_ARG` | CLI-Flag ohne Wert | Conditional check vor Aufruf |
| `IMPORT_RESOLUTION` | Module nicht gefunden | npm install / path fix |
| `NESTED_NODE_MODULES` | node_modules am falschen Ort | Löschen |
| `ICLOUD_CONFLICT` | Duplikat-Dateien | Finden und löschen |
| `DUPLICATE_CONFIG` | Mehrere Config-Dateien | Nur Root-Config behalten |

---

## Automatische Pattern-Erkennung

Wenn ein neuer Fehler auftritt:

1. **Pattern extrahieren** – Erste Zeile der Fehlermeldung
2. **In diesem Dokument suchen** – Bekanntes Pattern?
3. **Falls bekannt** → Prävention und Fix anwenden
4. **Falls neu** → Neuen Eintrag erstellen mit:
   - pattern_id
   - regex
   - category
   - Root Cause
   - Prävention
   - Fix

---

## Changelog

| Datum | Pattern | Aktion |
|-------|---------|--------|
| 2026-01-25 | ERR_001 | Erstellt (deploy.yml password) |
| 2026-01-25 | ERR_002 | Erstellt (math-operators) |
| 2026-01-25 | ERR_003 | Erstellt (nested node_modules) |
| 2026-01-25 | ERR_004 | Erstellt (iCloud duplicates) |
| 2026-01-25 | ERR_005 | Erstellt (duplicate configs) |
