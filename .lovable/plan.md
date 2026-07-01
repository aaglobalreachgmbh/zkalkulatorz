## Neutrale Ist-Zustand-Lieferung — keine Bau-Empfehlungen

**Was bereits geliefert wurde (Block 1–6):**
Reine, unkommentierte DDL des `public`-Schemas — 1 Enum + 84 Tabellen mit Spalten, Typen, NOT-NULL, Defaults, PK/FK/UNIQUE/CHECK. Direkt aus `pg_catalog`/`information_schema` generiert. **Keine Empfehlungen, keine Bewertungen, keine „so solltest du es bauen"-Hinweise.**

## Optional nachlieferbar (falls gewünscht) — ebenfalls neutral

Jede der folgenden Nachlieferungen ist eine reine Bestandsaufnahme, keine Vorgabe. Das Zieltool darf jedes davon ignorieren, neu entwerfen oder ersetzen.

**A) RLS-Policies + GRANTs**
- `pg_policies` → `CREATE POLICY`-Statements verbatim
- `information_schema.role_table_grants` → `GRANT`-Statements verbatim
- Risiko-Hinweis: RLS-Klauseln enthalten Aufrufe auf `has_role()`, `get_my_tenant_id()`, `is_same_tenant()` etc. Das könnte suggerieren, dass diese Funktionen zwingend so heißen müssen. Sie sind **nicht** verpflichtend — nur eine gewachsene Konvention.

**B) Non-PK/Non-UNIQUE-Indexe**
- Aus `pg_indexes`, gefiltert auf reine Sekundärindexe
- Neutral — reine Performance-Historie, keine fachliche Regel.

**C) Trigger + Views + Storage-Bucket-Policies**
- `pg_trigger` (nur triggerdef, ohne Funktionsrumpf → Funktionsrümpfe sind separat)
- Views inkl. `_safe`-Views (nur Definitionen, ohne Nutzungs-Kommentar)
- `storage.buckets` + `storage.objects`-Policies

## Was ich **bewusst nicht** liefere (Kontaminationsrisiko)

- Funktionsrümpfe (SECURITY DEFINER-Logik) — wurden bereits weiter oben im Verlauf als Ist-Stand geliefert, aber sie enthalten eingebettete Business-Logik-Annahmen. Zieltool sollte diese als **historische Referenz**, nicht als Blaupause behandeln.
- Frontend-Konventionen (Tenant-Claim-Herkunft, JWT-Hooks, Storage-Scoping-Keys) — sind Implementation-Details, nicht Schema.
- Migrations-Historie (98 Files) — ist Verlauf, nicht Ist-Zustand.
- Meinungen zu „technischer Schuld", „sollte ersetzt werden", „ist Best Practice".

## Empfehlung an dich

Gib deinem Tool die 6 DDL-Blöcke **so wie sie sind** als „reference schema, historical state". Wenn du zusätzlich A/B/C willst, sag welches — ich liefere jedes Element in derselben rohen, unkommentierten Form. Andernfalls: Audit ist abgeschlossen.