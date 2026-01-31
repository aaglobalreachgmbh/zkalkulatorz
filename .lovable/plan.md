
# PHASE 2: ARCHITEKTUR IMPLEMENTATION

## Überblick

Wir erstellen drei Dateien/Änderungen:
1. **CSS-Update** für Zero-Scroll Enforcement
2. **CalculatorContext.tsx** - Zentraler State
3. **CalculatorShell.tsx** - Layout-Grid

---

## SCHRITT 2.1: GLOBAL CSS UPDATE

**Datei:** `src/index.css`

**Änderung:** Am Anfang der `@layer base` Sektion hinzufügen:

```css
html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}
```

**Zusätzlich:** Custom Scrollbar Utility-Klasse in `@layer components`:

```css
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 20px;
}
```

---

## SCHRITT 2.2: CalculatorContext.tsx

**Datei:** `src/margenkalkulator/context/CalculatorContext.tsx` (NEU)

**Imports benötigt (aus Wizard.tsx abgeleitet):**
- `OfferOptionState`, `CalculationResult`, `ViewMode`, `WizardStep` aus `../engine/types`
- `createDefaultOptionState`, `calculateOffer` aus `../engine`
- `useCustomerSession` aus `@/contexts/CustomerSessionContext`
- `usePOSMode` aus `@/contexts/POSModeContext`
- `useEmployeeSettings`, `usePushProvisions`, `useQuantityBonus` Hooks
- `useFeature` aus `@/hooks/useFeature`
- `useOfferBasket` für Basket-Integration

**State-Interface (aus Phase 1):**

| State | Typ | Migration |
|-------|-----|-----------|
| `activeSection` | `WizardStep` | CONTEXT |
| `activeOption` | `1 \| 2` | CONTEXT |
| `viewMode` | `ViewMode` | CONTEXT |
| `effectiveViewMode` | `ViewMode` (computed) | CONTEXT |
| `canShowDealerData` | `boolean` (computed) | CONTEXT |
| `option1` | `OfferOptionState` | CONTEXT |
| `option2` | `OfferOptionState` | CONTEXT |
| `result1` | `CalculationResult` (computed) | CONTEXT |
| `result2` | `CalculationResult` (computed) | CONTEXT |
| `showQuickStart` | `boolean` | CONTEXT |
| `showRestoreDialog` | `boolean` | CONTEXT |
| `option2Enabled` | `boolean` (feature flag) | CONTEXT |
| `fixedNetModuleEnabled` | `boolean` (feature flag) | CONTEXT |

**Security Guard Logik:**
```text
effectiveViewMode = isPOSMode || customerSession.isActive 
                    ? "customer" 
                    : viewMode

canShowDealerData = effectiveViewMode === "dealer" 
                    && !isPOSMode 
                    && !customerSession.isActive
```

**SAFE_DEFAULT Pattern:**
Alle Actions werden als No-Ops mit `console.warn()` implementiert.
Alle computed Values default zu "sicheren" Werten (keine Dealer-Daten).

---

## SCHRITT 2.3: CalculatorShell.tsx

**Datei:** `src/margenkalkulator/layout/CalculatorShell.tsx` (NEU)

**Layout-Struktur:**

```text
┌─────────────────────────────────────────────────────────────┐
│ HEADER (h-16, flex-none)                                    │
│ [Titel] [ViewMode Toggle] [Actions]                         │
├─────────────────────────────────────────────────────────────┤
│ CONTENT GRID (flex-1, overflow-hidden)                      │
│                                                             │
│  ┌───────────────────────────┬─────────────────────────┐   │
│  │ LEFT: Main Stage          │ RIGHT: Summary Sidebar  │   │
│  │ (flex-1, overflow-y-auto) │ (w-[400px], lg:flex)   │   │
│  │                           │                         │   │
│  │ • Hardware Step           │ • Price Summary         │   │
│  │ • Mobile Step             │ • Breakdown             │   │
│  │ • FixedNet Step           │ • Quantity Bonus        │   │
│  │                           │ ────────────────────── │   │
│  │                           │ ACTION FOOTER:          │   │
│  │                           │ [Zum Angebot hinzu...]  │   │
│  └───────────────────────────┴─────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ MOBILE FOOTER (lg:hidden, fixed bottom)             │   │
│  │ [Summary] [Add to Offer Button]                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**CSS-Klassen:**
- Root: `flex flex-col h-full w-full`
- Header: `flex-none h-16`
- Content Grid: `flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] overflow-hidden`
- Left Panel: `h-full overflow-y-auto custom-scrollbar`
- Right Panel: `hidden lg:flex flex-col h-full overflow-hidden`
- Mobile Footer: `lg:hidden fixed bottom-0 left-0 right-0`

---

## Neue Dateistruktur nach Phase 2

```text
src/margenkalkulator/
├── context/                      ← NEU
│   ├── CalculatorContext.tsx     ← NEU (State + Provider + Hook)
│   └── index.ts                  ← NEU (Barrel Export)
├── contexts/
│   ├── OfferBasketContext.tsx    ← Bleibt
│   └── index.ts
├── layout/                       ← NEU
│   ├── CalculatorShell.tsx       ← NEU (Grid Layout)
│   └── index.ts                  ← NEU (Barrel Export)
└── ui/
    └── Wizard.tsx                ← Wird in Phase 3 refactored
```

---

## Validierung nach Implementation

1. **Build Check:** `npm run build` muss grün sein
2. **Import Check:** Alle Imports müssen auflösen
3. **Type Check:** Keine TypeScript-Fehler
4. **Keine Breaking Changes:** Wizard.tsx bleibt unverändert

---

## Nächster Schritt (Phase 3)

Nach erfolgreicher Implementation:
- Wizard.tsx refactoren: State → CalculatorContext
- Layout → CalculatorShell
- Redundante CTAs entfernen (StickyPriceBar, FloatingActionBar)
- Mobile Rescue Footer aktivieren
