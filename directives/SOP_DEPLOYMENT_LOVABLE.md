# SOP: Deployment für Lovable Cloud

**Gültig für:** ZKalkulator / MargenKalkulator  
**Hosting:** Lovable Cloud (integriert mit Supabase)  
**Erstellt:** 2026-01-25

---

## 1. Kritische Architektur-Hinweise

### Lovable + Supabase Integration

| Aspekt | Status |
|--------|--------|
| **Hosting-Plattform** | Lovable Cloud |
| **Supabase-Zugang** | Nur über Lovable integriert – **NICHT über supabase.com** |
| **Direkter supabase.com Login** | ❌ **Nicht möglich** |
| **Freigeschalteter Benutzer** | `vertrieb@aaglobalreach.de` |

> [!CAUTION]
> **Niemals** Anweisungen geben, die einen direkten Login auf supabase.com erfordern.  
> Alle Datenbank-Änderungen müssen über Code-Migrations oder die Lovable-UI erfolgen.

---

## 2. CL Quality Gate (Continuous Linting)

Lovable Cloud führt ein **Quality Gate** vor jedem Deployment durch.  
Ein Deployment schlägt fehl, wenn:

- ❌ TypeScript-Fehler existieren
- ❌ ESLint-Fehler oder Warnungen (je nach Konfiguration)
- ❌ Build-Fehler (`npm run build` schlägt fehl)
- ❌ Unaufgelöste Imports oder fehlende Abhängigkeiten

### Vor jedem Push prüfen:

```bash
# 1. TypeScript-Check
npm run typecheck

# 2. Lint-Check
npm run lint

# 3. Build-Test (PFLICHT!)
npm run build

# 4. Optionale Unit-Tests
npm run test
```

> [!IMPORTANT]
> **Immer `npm run build` lokal testen, BEVOR du pushst!**  
> Lovable zeigt oft nur "Build failed" ohne detaillierte Fehlermeldungen.

---

## 3. Häufige Build-Fehler und Lösungen

### 3.1 `Cannot find module './math-operators'` (TailwindCSS)

**Ursache:** Korrupte node_modules-Installation

**Lösung:**
```bash
rm -rf node_modules
rm -rf package-lock.json
npm install
```

### 3.2 `Failed to resolve import` aus `src/node_modules/`

**Ursache:** Parasitäres `node_modules/` Verzeichnis im `src/` Ordner

**Lösung:**
```bash
rm -rf src/node_modules/
npm run build
```

> [!WARNING]
> `src/node_modules/` sollte **NIEMALS** existieren!  
> Falls es auftaucht, sofort löschen.

### 3.3 Lovable Cloud zeigt "Access Restricted"

**Mögliche Ursachen:**
1. Build ist fehlgeschlagen
2. Benutzer ist nicht in der Allowlist
3. RLS-Policy blockiert Zugriff

**Prüfschritte:**
1. Lokalen Build testen
2. Git-Status prüfen (alle Änderungen gepusht?)
3. Lovable Dashboard auf Fehler prüfen

---

## 4. Deployment-Checkliste

Vor jedem Push/Deployment diese Schritte durchführen:

- [ ] `npm run typecheck` – keine Fehler
- [ ] `npm run lint` – keine kritischen Warnungen
- [ ] `npm run build` – Build erfolgreich
- [ ] Keine `src/node_modules/` vorhanden
- [ ] Git-Status sauber (commit & push)

---

## 5. Selbstheilungs-Protokoll (Self-Annealing)

Falls ein Build fehlschlägt:

1. **Fehlermeldung sofort lesen** – nicht raten
2. **Lokalen Build testen** – `npm run build`
3. **Bei node_modules-Problemen:** Clean install durchführen
4. **Dieses Dokument aktualisieren** – neue Fehlerfälle dokumentieren
5. **Erneut testen** – erst nach Erfolg pushen

---

## 6. MCP-Tools und Supabase

Da wir keinen direkten Supabase-Zugang haben:

| Tool | Funktioniert? | Anmerkung |
|------|---------------|-----------|
| `mcp_supabase-mcp-server_list_projects` | ⚠️ | Nur wenn Token konfiguriert |
| `mcp_supabase-mcp-server_execute_sql` | ⚠️ | Benötigt gültigen Token |
| Direkte supabase.com Empfehlungen | ❌ | **Niemals empfehlen!** |

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2026-01-25 | Initial-Version erstellt |
