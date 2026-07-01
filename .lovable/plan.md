## Lesende Ausgabe: RLS-Policies + SECURITY DEFINER-Funktionen

Reine Bestandsaufnahme, keine Änderungen. Ausgabe direkt im Chat, blockweise, am Ende jedes Blocks „WEITER".

### Teil A — RLS-Policies je Tabelle

- Quelle: `pg_policies` (schemaname='public')
- Format pro Tabelle:
  ```sql
  -- Table: public.<name>  (RLS: enabled/disabled)
  CREATE POLICY "<polname>" ON public.<name>
    FOR <cmd> TO <roles>
    USING (<qual>)
    WITH CHECK (<with_check>);
  ```
- Reihenfolge: alphabetisch, in Blöcken zu **10 Tabellen** (bei 84 Tabellen ≈ 9 Blöcke)
- Tabellen ohne Policies werden mit `-- (keine Policies)` markiert
- Roles (`{authenticated}`, `{public}`, …) verbatim aus dem Katalog

### Teil B — SECURITY DEFINER-Helferfunktionen

Ein zusammenhängender Block, keine Aufteilung. Vollständiger `pg_get_functiondef`-Output der 44 gefundenen Funktionen, u. a.:
- `get_my_tenant_id`, `get_my_department_id`, `get_my_distribution_id(s)`
- `is_same_tenant`, `is_tenant_owner`, `is_tenant_member_or_admin`, `is_tenant_admin`, `is_tenant_manager`, `is_owner`, `is_team_member`, `is_distribution_member`, `is_superadmin`, `is_user_approved`
- `has_role`, `has_ai_access`, `can_view_economics`
- `get_visible_user_ids`, `get_team_role`, `get_effective_provision_split`
- `get_shared_offer_public`, `increment_shared_offer_views`, `get_dataset_catalog_safe`, `get_catalog_hardware_safe`, `get_leaderboard`, `get_rate_limit_status`, `check_rate_limit`, `check_email_allowed`, `validate_invite_token`
- `handle_new_user`, `create_user_meta_on_signup`, `update_user_meta`, `auto_assign_tenant_admin_on_first_user`, `notify_admins_new_registration`
- `log_user_activity`, `log_table_access`, `log_cross_tenant_attempt`, `audit_rls_security`
- `cleanup_rate_limits`, `cleanup_old_activities`, `cleanup_expired_shared_offers`
- Trigger-Bodies: `update_updated_at_column`, `update_last_activity`, `calculate_work_minutes`, `ensure_single_active_dataset_version`, `sync_tenant_distribution_map`, `update_shared_offers_updated_at`, `update_bonus_rules_updated_at`

Bereits im aktuellen Kontext vollständig sichtbar → wird 1:1 verbatim ausgegeben, keine Umformulierung, keine Bewertung.

### Bewusst NICHT enthalten

- GRANTs (separater Audit-Block, falls gewünscht)
- Storage-Bucket-Policies (`storage.objects`) — separat
- Edge-Function-Code
- Empfehlungen, Risikoeinschätzungen, „sollte-so-sein"-Kommentare

### Ablauf

1. Nach Freigabe: **Block 1 (Tabellen 1–10)** — RLS-Policies verbatim + „WEITER"
2. Auf dein „Weiter" folgen Blöcke 2–9
3. Danach **Teil B** in einem Rutsch
4. Ende: „AUDIT KOMPLETT"