# GitHub Secrets Configuration

> **⚠️ Diese Datei enthält KEINE echten Passwörter, nur Dokumentation welche Secrets benötigt werden.**

## Erforderliche GitHub Secrets

Diese Secrets müssen unter **Settings → Secrets and Variables → Actions** konfiguriert werden:

| Secret Name | Beschreibung | Wo zu finden |
|-------------|--------------|--------------|
| `DB_PASSWORD` | Supabase Database Password | Supabase Dashboard → Project Settings → Database |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI Access Token | Supabase Dashboard → Account → Access Tokens |

## Setup-Anleitung

1. Gehe zu: https://github.com/aaglobalreachgmbh/zkalkulatorz/settings/secrets/actions
2. Klicke auf "New repository secret"
3. Füge folgende Secrets hinzu:

### DB_PASSWORD
- **Erforderlich für**: `deploy.yml` → Link Supabase Project
- **Command**: `supabase link --project-ref $PROJECT_ID --password $DB_PASSWORD`
- **Wo finden**: Supabase Dashboard → Settings → Database → Connection string

### SUPABASE_ACCESS_TOKEN
- **Erforderlich für**: Supabase CLI Authentifizierung
- **Wo finden**: https://supabase.com/dashboard/account/tokens

## Projekt-Konfiguration

```yaml
PROJECT_ID: "mexrgeafzvcestcccmiy"  # Hardcoded in deploy.yml
```

## Fehlerbehebung

Falls der Fehler auftritt:
```
flag needs an argument: --password
```

→ Secret `DB_PASSWORD` ist nicht gesetzt oder leer.

---
*Zuletzt aktualisiert: 2026-01-21*
