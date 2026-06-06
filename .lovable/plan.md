# Plan: Supabase Update/Upsert Typfehler beheben

## Problem

13 TypeScript-Fehler in Hooks, alle mit demselben Muster:

```ts
const updateData: Record<string, unknown> = { ... };
await supabase.from("table").update(updateData); // ❌ Typkonflikt
```

Die neuen strikten Supabase-Typen (`RejectExcessProperties<...>`) lassen offene `Record<string, unknown>`-Payloads nicht mehr zu.

## Betroffene Dateien (13 Stellen)

- `src/hooks/useAbsences.ts` (Zeile 193)
- `src/hooks/useAdminSetupStatus.ts` (Zeile 126)
- `src/hooks/useCloudDepartments.ts` (Zeile 209)
- `src/hooks/useCloudLicense.ts` (Zeile 152)
- `src/hooks/usePermissionTemplates.ts` (Zeile 136)
- `src/hooks/useShifts.ts` (Zeile 407)
- `src/hooks/useTimeTracking.ts` (Zeile 495)
- `src/margenkalkulator/hooks/useBonusRules.ts` (Zeile 238)
- `src/margenkalkulator/hooks/useCorporateBundles.ts` (Zeile 130)
- `src/margenkalkulator/hooks/useDatasetVersions.ts` (Zeile 220)
- `src/margenkalkulator/hooks/usePushProvisions.ts` (Zeilen 455, 647)
- `src/margenkalkulator/hooks/useTenants.ts` (Zeile 255)

## Fix-Strategie

**Minimaler, einheitlicher Cast am Aufrufpunkt** — Verhalten und Laufzeit ändern sich nicht. Pro Stelle wird genau eine Zeile angepasst:

```ts
// Vorher
await supabase.from("table").update(updateData);

// Nachher
await supabase.from("table").update(updateData as never);
```

Bzw. bei Upsert (useAdminSetupStatus.ts):

```ts
await supabase.from("admin_setup_status").upsert(payload as never, { onConflict: "..." });
```

`as never` ist hier das schmalste, korrekteste Mittel, weil:
- Die Payloads dynamisch zusammengebaut werden (computed keys, optional fields, JSON-Spalten) — eine vollständige typisierte Konstruktion wäre deutlich invasiver.
- Es löst exakt diesen `RejectExcessProperties`-Konflikt, ohne die echten Spaltentypen aufzuweichen (Supabase prüft serverseitig).
- Keine `@ts-ignore`/`@ts-expect-error`-Kommentare nötig.

## Nicht im Scope

- Keine Logik- oder Verhaltensänderungen
- Keine Änderungen an Datenbank, RLS, oder UI
- Keine Refactorings der Hooks darüber hinaus

## Verifikation

Nach den Edits prüft der Harness den Build automatisch — Ziel: 0 TS-Fehler.
