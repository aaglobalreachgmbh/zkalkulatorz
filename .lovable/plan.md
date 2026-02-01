
# Plan: Dashboard-Wiederherstellung mit Widget-System

## Zusammenfassung
Die Home-Seite wird auf das konfigurierbare Widget-Dashboard umgestellt. Das komplette Widget-System (Registry, Hook, Persistence) existiert bereits - nur die Rendering-Logik in `Home.tsx` fehlt.

---

## Bestandsaufnahme (Vorhanden)

| Komponente | Pfad | Status |
|------------|------|--------|
| Widget-Registry | `src/margenkalkulator/config/dashboardWidgets.tsx` | ✅ 14 Widgets |
| Config-Hook | `src/margenkalkulator/hooks/useDashboardConfig.ts` | ✅ add/remove/move |
| Add-Panel | `src/margenkalkulator/ui/components/AddWidgetPanel.tsx` | ✅ Dialog |
| DB-Persistenz | `user_dashboard_config` Tabelle | ✅ Vorhanden |

---

## Änderungen

### 1. `src/pages/Home.tsx` - Komplette Umstellung

**Aktuelle Struktur (wird ersetzt):**
- Zwei statische Karten (Individuelle Konfiguration / Bundles)
- Kein Widget-System

**Neue Struktur:**
```text
┌─────────────────────────────────────────────────┐
│ HEADER: Edit-Mode Toggle + "Widget hinzufügen"  │
├─────────────────────────────────────────────────┤
│                                                 │
│  [WelcomeBanner Widget]                         │
│  [HeadlineWidget]                               │
│  [QuickActionsWidget]                           │
│  [TodayTasksWidget]                             │
│  [DashboardWidgets (KPIs)]                      │
│  [AverageMarginWidget]                          │
│  ...weitere konfigurierte Widgets...            │
│                                                 │
│  [+ Widget hinzufügen] (Edit-Mode)              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Implementierung:**
1. Import `useDashboardConfig` Hook
2. Import `DASHBOARD_WIDGETS` Registry
3. Import `AddWidgetPanel` Komponente
4. Render-Loop über `layout.filter(w => w.visible)`
5. Edit-Mode mit Entfernen-Button pro Widget
6. Drag-and-Drop via `@dnd-kit/sortable` (bereits installiert)

---

### 2. Widget-Rendering-Komponente (Neu)

**Datei:** `src/margenkalkulator/ui/components/DashboardWidgetRenderer.tsx`

```typescript
interface Props {
  widgetId: string;
  isEditMode: boolean;
  onRemove: () => void;
}
```

- Suspense-Wrapper für Lazy-Loading
- Edit-Mode: X-Button zum Entfernen
- Fehler-Boundary für robustes Rendering

---

### 3. Edit-Mode Header (Neu)

**Datei:** `src/margenkalkulator/ui/components/DashboardEditHeader.tsx`

- Toggle "Bearbeiten" / "Fertig"
- "Zurücksetzen auf Standard" Button
- Sichtbar nur für eingeloggte User

---

## Technische Details

### Drag-and-Drop (Optional, Phase 2)
```typescript
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
```

Bereits in `package.json`: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

### Widget-Lifecycle
1. `useDashboardConfig()` lädt Layout aus DB oder Default
2. `layout.filter(w => w.visible)` filtert sichtbare Widgets
3. `DASHBOARD_WIDGETS[id].component` rendert Lazy-Component
4. `addWidget()` / `removeWidget()` mutiert & persistiert

---

## Ausführungsreihenfolge

1. `DashboardWidgetRenderer.tsx` erstellen (Suspense + Edit-UI)
2. `DashboardEditHeader.tsx` erstellen (Toggle + Reset)
3. `Home.tsx` refaktorieren (Widget-Loop statt statische Karten)
4. Test: Widget hinzufügen/entfernen, Seite neu laden

---

## Scope-Abgrenzung

Wie angefordert: **Nur Dashboard-Seite (Home.tsx)** - keine Änderungen am Kalkulator (`/calculator`).
