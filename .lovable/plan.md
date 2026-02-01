
# Plan: Fix Dashboard Widget Panel Duplicate/Layout Issue

## Problem
`AddWidgetPanel` is rendered **twice** in edit mode:
1. In `DashboardEditHeader.tsx` - Header controls area (wrong placement)
2. In `Home.tsx` - Widget grid area (correct placement)

The `AddWidgetPanel` component's DialogTrigger renders a large dashed placeholder box, which is appropriate for the widget grid but **breaks the header layout**.

---

## Solution

### Option A: Remove from Header (Recommended)
Remove `AddWidgetPanel` from `DashboardEditHeader.tsx`. Keep only the grid placeholder version in `Home.tsx`.

**Änderungen:**
- `DashboardEditHeader.tsx`: Remove `AddWidgetPanel` import and usage (lines 8, 52-55)

### Why This is Better:
- Simpler code
- The large "Widget hinzufügen" placeholder at the bottom of the grid is more intuitive
- No duplicate dialogs

---

## Code Changes

### `src/margenkalkulator/ui/components/DashboardEditHeader.tsx`

```diff
- import { AddWidgetPanel } from "./AddWidgetPanel";
- import { WidgetLayout } from "@/margenkalkulator/config/dashboardWidgets";

  interface DashboardEditHeaderProps {
    isEditMode: boolean;
    onToggleEditMode: () => void;
    onResetToDefault: () => void;
-   onAddWidget: (widgetId: string) => void;
-   currentLayout: WidgetLayout[];
    isAuthenticated: boolean;
  }

  // Remove AddWidgetPanel from JSX (lines 52-55)
```

### `src/pages/Home.tsx`
Remove unused props from `DashboardEditHeader`:

```diff
  <DashboardEditHeader
    isEditMode={isEditMode}
    onToggleEditMode={() => setEditMode(!isEditMode)}
    onResetToDefault={resetToDefault}
-   onAddWidget={addWidget}
-   currentLayout={layout}
    isAuthenticated={!!user}
  />
```

---

## Ergebnis
- Ein `AddWidgetPanel` als große Kachel am Ende der Widget-Liste
- Sauberer Header mit nur "Bearbeiten/Fertig" und "Zurücksetzen" Buttons
- Keine doppelten Dialoge
