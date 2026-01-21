# Memory: auth/google-oauth-removal
Updated: 2026-01-21

## Problem: Google OAuth 403 Fehler

**Ursache:** Doppelte Konfiguration - sowohl Lovable Cloud's managed OAuth als auch eigene Google Cloud Console Credentials waren gleichzeitig aktiviert.

### Symptome:
- 403 Fehler beim Klick auf "Mit Google fortfahren"
- Redirect-URLs stimmten nicht überein
- OAuth Consent Screen war möglicherweise nicht auf "Production" gestellt

### Betroffene Komponenten (gelöscht/bereinigt):
1. ✅ `supabase/functions/gmail-oauth/` Edge Function - gelöscht
2. ✅ `signInWithGoogle` aus `useAuth.tsx` - entfernt
3. ✅ Google Login Button aus `Auth.tsx` - entfernt
4. ✅ Gmail-Integration aus `Inbox.tsx` - entfernt

## Lösung: Vollständige Umstellung auf Supabase Email/Password Auth

Die App nutzt jetzt ausschließlich:
- **Email/Password Authentifizierung** über Lovable Cloud (Supabase Auth)
- Keine externen OAuth-Provider
- User werden intern über das Backend-Dashboard verwaltet

### Vorteile:
- Keine externen Abhängigkeiten (Google Cloud Console)
- Keine Konflikte zwischen verschiedenen Auth-Providern
- Vollständige Kontrolle über User-Management in Lovable Cloud
- Einfacheres Debugging bei Auth-Problemen

## Auth-Seite Features:
- Login mit Email/Passwort
- Registrierung mit Email/Passwort + Anzeigename
- Toggle zwischen Login und Registrierung
- Fehlerbehandlung mit deutschsprachigen Toast-Nachrichten
