
# Audit-Bericht — Margenkalkulator (LESEND, keine Änderungen)

> Hinweis: Dies ist eine reine Bestandsaufnahme als Plan-Dokument. Es wird nichts implementiert, nichts geändert. „Implement plan" bitte NICHT klicken.

---

## 0. BACKEND-STATUS (eindeutig)

**Backend vorhanden: Ja — Lovable Cloud (Supabase) ist vollständig angebunden.**

Belege im Code:
- `src/integrations/supabase/client.ts` — Supabase-Client mit fest verdrahteter Project-URL + anon key.
- `supabase/migrations/` — **98 Migrations-Dateien** (Tabellen, RLS-Policies, DB-Funktionen, Trigger).
- `supabase/functions/` — **22 Edge Functions** (Deno), z. B. `calculate-margin`, `generate-pdf`, `send-offer-email`, `invite-user`, `daily-security-audit`, `ai-consultant`, `verify-turnstile`, `gdpr-cleanup`, `rate-limiter`, `sync-emails`, `import-tariffs` …
- `supabase/config.toml` mit `verify_jwt`-Konfiguration je Function.
- ~80 produktive Tabellen mit RLS-Policies (siehe Abschnitt 4).
- Auth läuft real über `supabase.auth` (`useAuth.tsx`), inkl. MFA (AAL1/AAL2).

→ Es handelt sich **nicht** um ein reines Frontend-Projekt mit Mocks. Es ist eine vollwertige Client-Server-Anwendung; allerdings liegt **ein erheblicher Teil der Geschäftslogik im Frontend** (siehe Abschnitt 6).

---

## 1. Tech-Überblick

| Bereich | Stand |
|---|---|
| Framework | Vite 5 + React 18 + TypeScript 5 |
| UI | TailwindCSS v3, shadcn/ui (radix-ui), `@react-pdf/renderer`, dnd-kit |
| State/Data | `@tanstack/react-query`, React Context |
| Backend | Lovable Cloud (Supabase: Postgres + Auth + Storage + Edge Functions) |
| Tests | Vitest (Unit), Playwright (`e2e/`) |
| Build/Run | `vite`, Scripts: `dev`, `build`, `test`, `typecheck`, `validate`. Build-Status: laut letzten Sitzungen kompiliert (nach `as never`-Casts in Hooks). Nicht in diesem Audit nachgeprüft. |
| Ordnerstruktur | `src/pages` (Routen), `src/components` (allg. UI), `src/hooks`, `src/contexts`, `src/lib`, `src/margenkalkulator/` (Engine, Wizard, PDF, eigene Hooks/Contexts), `src/integrations/supabase` (auto-gen), `supabase/{migrations,functions,tests}` |
| Doku im Repo | sehr umfangreich: `docs/`, `directives/`, `knowledge/`, `.lovable/`, `ARCHITECTURE_BLUEPRINT.md`, `COMPLIANCE_MATRIX.md` u. v. m. |

---

## 2. Screen-/Routen-Inventar

Erfasst aus `src/pages/` + `docs/system_map.md`. Status = (a) erreichbar & funktional sichtbar / (s) versteckt-nicht-im-Menü / unklar.

### Public / Auth
| Route | Datei | Status |
|---|---|---|
| `/auth` | `Auth.tsx` | a |
| `/auth/reset-password` | `ResetPassword.tsx` | a |
| `/datenschutz` | `Privacy.tsx` | a |
| `/share/offer/:id` | `SharedOfferPage.tsx` | a (Token-basiert, kein Login) |
| `/pending-approval` | `PendingApproval.tsx` | a |

### Operativ
| Route | Datei | Status |
|---|---|---|
| `/` (Home) | `Home.tsx` / `Index.tsx` | a |
| `/calculator` | `margenkalkulator/ui/Wizard.tsx` | a (Kern) |
| `/customers` | (CRM) | a |
| `/offers`, `/offers/:id` | `Offers.tsx`, `OfferDetail.tsx` | a |
| `/contracts` | `Contracts.tsx` | a |
| `/bundles` | `Bundles.tsx` | a |
| `/calendar` | `Calendar.tsx` | a |
| `/inbox` | `Inbox.tsx` (E-Mail-Integration) | a, Reifegrad **unklar** |
| `/news` | `News.tsx` + `AdminNews.tsx` | a |
| `/time-tracking` | `TimeTracking.tsx` | a |
| `/gamification` | `Gamification.tsx` | a |
| `/provisions` | `Provisions.tsx` | a |
| `/mocca-import` | `MoccaImport.tsx` | a (Importer) |

### Admin / Backoffice
| Route | Datei | Status |
|---|---|---|
| `/admin` | (KPIs) | a |
| `/admin/users` | `AdminUsers.tsx` | a |
| `/admin/employees` | `AdminEmployees.tsx` | a |
| `/admin/permissions` | `AdminPermissions.tsx` | a |
| `/admin/news` | `AdminNews.tsx` | a |
| `/admin/distribution` | `DistributionDashboard.tsx` | a |
| `/tenant-admin` | `TenantAdmin.tsx` | a |
| `/data-manager`, `/data-hub` | `HardwareManager.tsx`, `DataHub.tsx` | a |
| `/license` | `License.tsx` | a |
| `/super-admin` | `SuperAdmin.tsx` | a (Rolle `superadmin`) |
| `/settings/security` | `SecuritySettings.tsx` | a |
| `/settings/hardware-images` | `HardwareImages.tsx` | a |
| `/branding` | `BrandingSettings.tsx` | a |
| `/team` | `Team.tsx` | a |
| `/activity` | `ActivityDashboard.tsx` | a |

### Security/Governance
| Route | Datei | Status |
|---|---|---|
| `/security` | `SecurityDashboard.tsx` | a (Admin-gegated) |
| `/security/report` | `SecurityReport.tsx` | a |
| `/security/threats` | `ThreatIntelligence.tsx` | a |
| `/security/test` | `SecurityTestPage.tsx` | s (Entwickler-/Testseite) |
| `/gdpr` | `GDPRDashboard.tsx` | a |
| `/offline` | `Offline.tsx` | a |

**Versteckt/„toter Code"-Verdacht:** `SecurityTestPage`, `margenkalkulator/tests_legacy/`, mehrere `.lovable/`/`directives/`-Dokumente ohne UI-Anbindung. **Zu verifizieren.**

---

## 3. Funktions-Inventar (Status (a) funktional / (b) Stub-Mock / (c) vorhanden aber nicht auffindbar / (d) nicht vorhanden)

| Funktion | Status | Notiz |
|---|---|---|
| Kalkulations-Wizard (Hardware → Mobile → FixedNet → Review) | a | `src/margenkalkulator/ui/Wizard.tsx` + `engine/offer.ts` |
| Margen-/Provisions-Berechnung (Engine) | a | `engine/calculators/*`, `dealerEconomics`, Push-/Quantity-Bonus, OMO-Matrix |
| **Produkt-agnostischer Katalog** (frei def. Produkte/Kategorien/Bilder/Zahlweisen, Privat/Business) | **d** | Aktuell Vodafone-Business-Katalog hartcodiert in `data/business/v2025_09/`+`v2025_10/`; Consumer-Daten existieren (`data/consumer/{gigamobil,smart}/tariffs.ts`) aber nicht im Wizard-Flow integriert. Kein generisches Produkt-Modell in der DB. |
| Tarifdaten-Import (XLSX/CSV) | a | `dataManager/`, Edge Function `import-tariffs`, Tabelle `dataset_versions`, `hardware_imports` |
| Angebote speichern | a | `saved_offers`, `cloudOffers.ts`, `useCloudOffers` |
| Offer-Drafts/AutoSave | a | `offer_drafts`, `useCloudDrafts`, `useWizardAutoSave` |
| Templates/Bundles | a | `corporate_bundles`, `template_folders`, `useCloudTemplates`, `storage/bundles.ts` |
| **PDF-Export** | a | `src/margenkalkulator/pdf/` (`@react-pdf/renderer`) + Edge Function `generate-pdf` |
| **Shared Offer (Cloud-Link)** | a | Tabelle `shared_offers` (Token, expires_at, view_count, is_revoked), public RPCs `get_shared_offer_public`, `increment_shared_offer_views`; Route `/share/offer/:id`; Edge `send-offer-email` |
| Kunden-CRM (Kunden, Notizen, Verträge, VVL) | a | `customers`, `customer_notes`, `customer_contracts`, `useCustomerContracts` mit VVL-Logik |
| Varianten-Vergleich für Kunden | b | UI-Ebene im Wizard ja, dedizierter Kunden-Vergleichsmodus eher rudimentär — **zu verifizieren** |
| Status-Tracking / Rückfragen / Feedback durch Kunden auf Shared-Offer | **d** | Shared-Offer ist read-only (View-Counter), kein Reply/Status-Channel |
| Auth (Email/Password + MFA TOTP) | a | `useAuth`, `useMFA`, `mfa_backup_codes` |
| MFA-Enforcement für Admins | a | `useAdminMFAEnforcement`, `MFAEnforcementDialog` |
| Approval-Workflow (neue Nutzer pending) | a | `profiles.is_approved`, `handle_new_user()`, `admin_notifications` |
| Tenant-Allowlist (Email/Domain) | a | `tenant_allowed_emails`, `tenant_allowed_domains`, `check_email_allowed()` |
| Invites | a | Edge `invite-user`, `send-admin-invite`, `tenant_invitations` |
| Rollen (`superadmin`, `admin`, `tenant_admin`, `user` …) | a | `app_role` Enum + `user_roles`-Tabelle + `has_role()` SECDEF |
| RLS-Mandantentrennung | a | über `get_my_tenant_id()` (JWT-Claim) + `is_same_tenant()`; siehe Abschnitt 5 |
| White-Label/Branding | a | `tenant_settings`, `useTenantBranding`, `BrandingSettings.tsx`, Storage-Bucket `tenant-logos` |
| Custom Fields | d | Keine generische Custom-Field-Tabelle gefunden |
| SSO (SAML/OIDC) | d | Nur Email/Password + MFA |
| Push-Provisionen | a | `push_provisions`, `usePushProvisions`, `push_tariff_groups` |
| Mengen-Bonus / Cross-Sell-Bonus | a | `quantity_bonus_tiers`, `bonus_rules` |
| Zeitwirtschaft | a | `shifts`, `shift_templates`, `time_entries`, `absences`, `time_entry_corrections` |
| Gamification | a | `badge_definitions`, `user_badges`, `user_points`, `get_leaderboard()` |
| Außendienst (Besuche/Fotos/Checklisten) | a | `visit_reports`, `visit_photos` (privater Bucket), `visit_checklists` |
| E-Mail-Integration (IMAP) | b | `email_accounts`, `synced_emails`, Edge `sync-emails`, `ionos-connect`. Funktionalität/Stabilität **zu verifizieren**. |
| Kalender-Integration | a | `calendar_events`, Edge `create-calendar-event` |
| News-Feed | a | `news_items` |
| Offline-Modus | b | `useOfflineMode`, `offlineStorage`, `OfflineBoundary`; tatsächlicher Sync-Pfad **zu verifizieren** |
| KI-Funktionen | a | Edges `ai-consultant`, `ai-offer-check`, `ai-data-import` (Lovable AI Gateway) |
| Threat-Intel / Security-Scan | a | `threat_feeds`, `threat_feed_entries`, `security_events`, `daily_security_*` |
| Rate-Limiting | a | `rate_limit_entries`, `check_rate_limit()`, Edge `rate-limiter` |
| Cloudflare Turnstile | a | Edge `verify-turnstile` |
| GDPR-Cleanup | a | `gdpr_deletion_log`, Edge `gdpr-cleanup` |
| Support-Modul (Tickets, Impersonation, Diagnose) | d | Nicht vorhanden |
| Distributions-/Generalunternehmer-Vorstufe | a/b | `distributions`, `distribution_partners`, `tenant_distribution_map`, Provisionssplit-Funktion vorhanden; UI minimal |

---

## 4. Datenmodell

Backend ist vorhanden (siehe 0). ~80 Tabellen in `public`. Auszug der zentralen Entitäten (alle mit RLS-Policies; Felderzahl in Klammern):

| Bereich | Tabellen |
|---|---|
| Mandanten/Identität | `tenants`, `profiles`, `user_roles` (Enum `app_role`), `employee_settings`, `employee_assignments`, `departments`, `user_department_assignments`, `tenant_settings`, `tenant_allowed_emails`, `tenant_allowed_domains`, `tenant_invitations` |
| Lizenz/Seats | `licenses`, `seat_assignments`, `user_meta` |
| Daten/Katalog | `dataset_versions` (versionierte Tarifdaten als JSONB), `custom_datasets`, `tenant_hardware`, `hardware_imports`, `hardware_images`, `tenant_provisions`, `push_provisions`, `push_tariff_groups`, `bonus_rules`, `quantity_bonus_tiers`, `corporate_bundles` |
| CRM/Angebote | `customers`, `customer_notes`, `customer_contracts`, `customer_import_mappings`, `saved_offers`, `offer_drafts`, `offer_activities`, `offer_emails`, `won_offer_data`, `template_folders`, `shared_offers` |
| Berechnungen/Provisionen | `calculation_history`, `provision_calculations` |
| HR/Zeit | `shifts`, `shift_templates`, `shift_swap_requests`, `time_entries`, `time_entry_corrections`, `absences` |
| Aufgaben/Kommunikation | `calendar_events`, `news_items`, `notifications`, `notification_preferences`, `scheduled_notifications`, `email_accounts`, `synced_emails` |
| Außendienst | `visit_reports`, `visit_photos`, `visit_checklists` |
| Gamification | `badge_definitions`, `user_badges`, `user_points`, `employee_goals`, `onboarding_progress`, `onboarding_templates` |
| Berechtigungen | `permission_templates` |
| Distribution | `distributions`, `distribution_partners`, `tenant_distribution_map` |
| Security | `security_events`, `access_audit_log`, `admin_audit_log`, `admin_notifications`, `admin_setup_status`, `blocked_ips`, `honeypot_submissions`, `login_anomalies`, `daily_security_reports`, `threat_feeds`, `threat_feed_entries`, `mfa_backup_codes`, `rate_limit_entries`, `password_reset_tokens`, `ai_access` |
| GDPR | `gdpr_deletion_log` |
| Teams | `teams`, `team_members` |

**Wichtige DB-Funktionen (Security-Definer):** `has_role`, `is_superadmin`, `is_tenant_admin`, `is_tenant_member_or_admin`, `is_same_tenant`, `get_my_tenant_id`, `get_my_department_id`, `is_owner`, `is_team_member`, `get_visible_user_ids`, `can_view_economics`, `is_user_approved`, `handle_new_user`, `check_email_allowed`, `validate_invite_token`, `get_shared_offer_public`, `increment_shared_offer_views`, `check_rate_limit`, `cleanup_*`, `log_cross_tenant_attempt`, `get_dataset_catalog_safe`, `get_catalog_hardware_safe`, `audit_rls_security`, `get_effective_provision_split`.

**Edge Functions (22):** siehe Abschnitt 0; `verify_jwt`-Flag je Function in `supabase/config.toml`.

**Storage-Buckets:** `hardware-images` (public), `tenant-logos` (public), `visit-photos` (privat).

**Bemerkenswert:** `tenant_id` ist als `TEXT` modelliert (z. B. `'tenant_default'`), nicht als FK auf `tenants.id` mit UUID — funktional, aber unsauber.

**Frontend-Entwurf des Datenmodells:** Engine arbeitet zusätzlich mit getypten TS-Modellen in `src/margenkalkulator/engine/types.ts` (Mobile-Tariffs, SubVariants, Promos, FixedNet, Money, OfferOption …), ein **zweites parallel gepflegtes Datenmodell** zu den JSONB-Inhalten von `dataset_versions`.

---

## 5. Auth / Rollen / Mandanten

| Aspekt | Real (Server/RLS) | Nur Frontend | Nicht vorhanden |
|---|---|---|---|
| Email/Password Auth | ✅ Supabase | | |
| MFA (TOTP, Backup-Codes) | ✅ `auth.mfa` + `mfa_backup_codes` | | |
| MFA-Enforcement Admin | ✅ DB + UI | | |
| Approval-Workflow | ✅ `profiles.is_approved` | | |
| Rollen (`superadmin`,`admin`,`tenant_admin`,`user`) | ✅ `user_roles` + `has_role()` | | |
| Mandanten-Trennung | ✅ via RLS + `get_my_tenant_id()` (JWT-Claim) + `is_same_tenant()` | | |
| Subdomain-/Hostname-Resolver für Tenant | | | ❌ nicht vorhanden |
| SSO (SAML/OIDC, Google) | | | ❌ (Google bewusst entfernt — `.lovable/memory/auth/google-oauth-removal.md`) |
| Department-Scope | teils ✅ (`get_my_department_id()` fällt auf `dept_default` zurück) | | |
| Impersonation für Support | | | ❌ |

**Bemerkenswert:** `get_my_tenant_id()` liest aus `request.jwt.claims->>tenant_id`. Wie dieser Claim **gesetzt** wird (Custom-Claim-Hook / JWT-Template), ist im Code nicht eindeutig dokumentiert — **zu verifizieren**, sonst greift Default `'tenant_default'` und alle User landen im selben Mandanten.

---

## 6. Margen-/Provisions-Sichtbarkeit (kritisch)

**Antwort: Hybrid — überwiegend client-seitig, partiell server-seitig.**

| Pfad | Wo wird Margen/EK/Provision ausgeblendet? |
|---|---|
| Eingeloggter Verkäufer im Wizard (Standardpfad) | **Client-seitig.** `useCustomerSafeMode()` liefert nur `true`, wenn eine Customer-Session aktiv ist (`CustomerSessionContext`). UI versteckt dann Felder. Die Berechnung (`engine/offer.ts → calculateDealerEconomics`) läuft trotzdem im Browser, sensible Werte sind im JS-Bundle/State vorhanden. |
| `dataset_versions` mit Tarifen inkl. Provisionen | **Server-seitig (partiell).** Hilfsfunktion `get_dataset_catalog_safe()` schließt `provisions` und `omo_matrix` aus dem JSONB explizit aus. Verwendung dieser Safe-View flächendeckend? **zu verifizieren** — RLS auf `dataset_versions` erlaubt den vollen Datensatz für Tenant-Mitglieder. |
| `tenant_hardware` (EK-Preise) | **Server-seitig (partiell).** `get_catalog_hardware_safe()` blendet `ek_net` aus. Vollzugriff auf `tenant_hardware` ist auf Tenant-Mitglieder beschränkt — d. h. eingeloggte Mitarbeiter sehen EK weiterhin, sofern direkt abgefragt. |
| `can_view_economics(user_id)` | server-seitig vorhanden, prüft Admin/TenantAdmin oder `employee_settings.can_view_margins`. Tatsächlicher Einsatz in Policies aktueller Tabellen **zu verifizieren**. |
| `shared_offers` (Kundenpfad) | **Server-seitig sicher.** RPC `get_shared_offer_public` liefert nur das vorab gespeicherte `offer_data` JSONB; was darin steht, wird beim Erzeugen vom Client bestimmt. Ob beim Speichern Margen/EK aus `offer_data` ausgefiltert werden, **zu verifizieren** (vermutlich „kundensicher" gespeichert, aber Garantie fehlt im Code dieses Audits). |
| Edge Function `calculate-margin` | Existiert und kann Berechnungen server-seitig ausführen — aber das Frontend nutzt parallel die TS-Engine. **Zwei Berechnungswege** koexistieren. |

**Fazit:** Echte Mandanten-/Rollen-Trennung ja, aber „Customer-Safety-Lock" ist primär **UI-Schutz**. Für ein echtes Verkäufer→Kunden-Modell ohne Margen-Leak ist das nicht ausreichend.

---

## 7. Angebots-/PDF-/Shared-Offer-Funktion

| Aspekt | Status | Details |
|---|---|---|
| Angebot speichern | a | `saved_offers` + `useCloudOffers` |
| Drafts (Auto-Save) | a | `offer_drafts` + `useWizardAutoSave` |
| PDF-Erzeugung Client | a | `@react-pdf/renderer` (`src/margenkalkulator/pdf/`) |
| PDF-Erzeugung Server | a | Edge Function `generate-pdf` (verify_jwt) — Pfad existiert; tatsächliche Nutzung neben Client-PDF **zu verifizieren** |
| Branding/Logo im PDF | unklar | Branding-Daten existieren; Einbindung in PDF-Templates **zu verifizieren** |
| Shared-Offer Cloud-Link | a | Tabelle `shared_offers` mit `access_token`, `expires_at`, `valid_days`, `view_count`, `last_viewed_at`, `is_revoked` |
| Zugriffsschutz Shared-Offer | a | Öffentlicher Zugriff **nur** via RPC `get_shared_offer_public(offer_id, access_token)` mit Prüfungen `NOT is_revoked AND expires_at > NOW()`; Token-Helfer in `src/lib/tokenSecurity.ts` |
| Versand per E-Mail | a | Edge `send-offer-email` (Resend-API-Key Secret vorhanden) |
| Kundenseitiges Feedback/Annehmen/Status | d | Read-only Counter, kein Reply-/Status-Channel |
| Varianten-Vergleich für Kunden | b | UI-seitig im Wizard möglich, dedizierter Kundenvergleich auf Shared-Offer-Seite **zu verifizieren** |

---

## 8. ÜBERRASCHUNGEN (außerhalb des Referenzrahmens, real vorhanden)

- **Komplette HR-Suite:** Schichten (`shifts`, `shift_templates`, `shift_swap_requests`), Zeiterfassung (`time_entries`, `time_entry_corrections`), Abwesenheiten (`absences`), Mitarbeiterziele (`employee_goals`), Onboarding-Templates/Progress.
- **Außendienst-Modul:** Besuchsberichte, Foto-Bucket (privat), Checklisten.
- **Gamification:** Badges, Punkte, Leaderboard-Funktion in DB.
- **E-Mail-Postfach-Integration (IMAP):** `email_accounts`, `synced_emails`, Edges `sync-emails`/`ionos-connect`, IONOS-spezifisch.
- **Kalender-Modul** mit eigener Edge-Function.
- **News-Feed** + Admin-Pflege.
- **Permission-Templates** (`permission_templates`).
- **Vollständiges Security-Subsystem:** Threat-Intel-Feeds, Daily Security Audit/Scan, Login-Anomalies, Honeypot, Blocked IPs, `access_audit_log`, `admin_audit_log`, Server-Rate-Limiter, Turnstile, CSP via `index.html`, `SecurityProvider`, Zero-Trust-API-Gateway (`useSecureApi`, `secureApiGateway.ts`), `withSecurity` HOC, `SecureInput` Aliasing, `tunnelSecurityGuard`, `zeroDefenseLayer`, `llmSecurityLayer`.
- **GDPR-Dashboard** inkl. Cleanup-Edge.
- **MFA inkl. Backup-Codes** als eigene Tabelle.
- **KI-Pipeline (3 Edges):** Daten-Import, Angebots-Check, Berater-Chat.
- **Lizenz-/Seat-Management:** `licenses`, `seat_assignments`, `user_meta` (Discount-Tier, Subscription-Status, Feature-Flags), `SeatLimitGate`.
- **Distributions-Layer:** Generalunternehmer mit Provisionssplit (`get_effective_provision_split`).
- **Mocca-Importer** (`MoccaImport.tsx`) — externer Datenquellen-Import.
- **Hardware-Bilder-Verwaltung** mit eigenem Public-Bucket.
- **Audit-/Telemetrie-Layer:** `user_activity_log`, `log_user_activity`, `useActivityTracker`, `lib/telemetry.ts`.
- **DGRV-Logik** hartkodiert in Engine (`engine/offer.ts`): „Business + leadTimeMonths ≥ 7 ⇒ 12 Monate BP-frei" überschreibt user-gewählte Promo.
- **Zwei Tarif-Quellen parallel:** statische TS-Kataloge (`data/business/v2025_09/`, `v2025_10/`, `data/consumer/...`) und DB-versionierte `dataset_versions`.
- **Zwei Berechnungswege parallel:** Frontend-Engine (`margenkalkulator/engine`) und Edge `calculate-margin`.
- **„Antigravity"-/Manifest-Doku-Schicht:** `directives/ANTIGRAVITY_KERNEL.md`, `ENGINEERING_BLUEPRINT_3.0.md`, `PHASE_AUDIT_MASTER_PLAN.md` u. a. (Prozess-/Meta-Dokumente ohne UI-Bezug).
- **`.workspace/skills/`, `.agents/skills/`, `.lovable/`-Memory** — Lovable-spezifische Meta-Artefakte.
- **CI/CD:** `.github/workflows/ci.yml`, `deploy.yml`, eigene Scripts unter `execution/`.
- **Tests:** Vitest-Suite (Engine-Invarianten, Provisionen, Contracts, Guards), Playwright (`customer-mode.spec.ts`, `pdf-validation.spec.ts`), eigene SQL-Tests in `supabase/tests/`.

---

## 9. Bekannte Lücken / Bugs / Provisorien

| # | Befund | Schwere |
|---|---|---|
| 1 | Produkt-Modell ist **nicht generisch** — Vodafone-Business hartkodiert; freie Produktdefinition fehlt. | hoch |
| 2 | **Customer-Safety-Lock primär Frontend** (siehe Abschnitt 6); EK/Marge im Client erreichbar. | hoch |
| 3 | **Zwei Tarif-Quellen** (TS-Katalog + DB) parallel → Risiko widersprüchlicher Wahrheiten. | hoch |
| 4 | **Zwei Berechnungswege** (TS-Engine + Edge `calculate-margin`) parallel. | mittel |
| 5 | `tenant_id` als `TEXT` mit Default `'tenant_default'`; kein FK auf `tenants.id`; bei fehlendem JWT-Claim Fallback in denselben Tenant. | hoch |
| 6 | **Custom-Claim-Hook für `tenant_id`/`department_id`** nicht im Repo nachweisbar — Mandantentrennung effektiv nur sicher, wenn dieser Hook in Supabase konfiguriert ist. **Zu verifizieren.** | kritisch (falls fehlend) |
| 7 | **Public Storage-Buckets** `hardware-images` und `tenant-logos`. | mittel |
| 8 | **Kein SSO/SAML/OIDC**, nur Email/Password (+MFA). | mittel |
| 9 | **Kein Support-/Ticket-/Impersonation-Modul.** | mittel |
| 10 | **Keine Custom-Fields** auf Entitäten. | mittel |
| 11 | **Kein Kunden-Feedback-/Reply-Kanal** auf Shared-Offers (read-only). | mittel |
| 12 | Inbox/IMAP-Sync, Offline-Sync: Stabilität/Tiefe **zu verifizieren**. | unklar |
| 13 | Konsumer-Tarifdaten im Repo vorhanden, aber Wizard-Flow für Privat-Bereich **nicht aktiviert**. | mittel |
| 14 | Engine enthält **branchen-/mandantenfremde Hartlogik** (z. B. „DGRV"-Override). | mittel |
| 15 | Viele Hooks nutzen `as never` / `Record<string,unknown>`-Casts gegen die Supabase-Typen (siehe vorherige Sitzung) — Indikator für gewachsene Typ-Schulden. | mittel |
| 16 | Sehr viele parallele Meta-/Direktiv-Dokumente (`directives/`, `.lovable/`, `knowledge/`, `docs/`) — kein offensichtlich kanonischer Single Source of Truth. | niedrig |
| 17 | Tests vorhanden, aber tatsächliche grüne Lauffähigkeit der gesamten Suite in dieser Sitzung **nicht verifiziert**. | unklar |
| 18 | `auto_assign_tenant_admin_on_first_user`-Trigger basiert auf JWT-Claim-Tenant — selbe Abhängigkeit wie #6. | hoch |

---

### Markierte Unsicherheiten (zu verifizieren, nicht geraten)
- Setzen des `tenant_id`-Claims in JWT (Supabase Auth Hook?).
- Tatsächliche Nutzung von `get_dataset_catalog_safe` / `get_catalog_hardware_safe` im Frontend (vs. direkter Tabellenzugriff).
- Inhalt von `offer_data` in `shared_offers` (filtert der Client EK/Marge vor dem Speichern?).
- Praktische Funktionsweise von Inbox-Sync, Offline-Sync, IONOS-Connect.
- Tatsächlicher Aufruf der Edge `calculate-margin` aus dem Frontend (oder rein Frontend-Engine).
- Branding-Übernahme in PDF-Templates.

---

**Zusammenfassung in einem Satz:**
Das Projekt ist eine voll integrierte Lovable-Cloud-Anwendung (Vite/React + Supabase mit 98 Migrationen, 22 Edge Functions, ~80 RLS-Tabellen) mit weit über dem Kalkulator-Kern hinausgehendem Funktionsumfang (HR, Außendienst, KI, Security, Gamification, Distribution), aber mit drei strukturellen Schwächen: nicht-generischer Produktkatalog, zweigleisige Tarif-/Berechnungsquellen und ein überwiegend client-seitiger Customer-Safety-Lock — und einer kritischen Abhängigkeit von einem extern konfigurierten JWT-Tenant-Claim, dessen Setzung im Repo nicht nachweisbar ist.
