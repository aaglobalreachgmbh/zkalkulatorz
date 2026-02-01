
# PHASE 5: CONTEXT-FINALISIERUNG + UI/UX NEUGESTALTUNG

## Status: GEPLANT

---

## 🎯 Vision

**Phase 5 = 2 Sub-Phasen:**

1. **5A: Context-Finalisierung** — SummarySidebar & MobileActionFooter konsumieren Context direkt (Props eliminieren)
2. **5B: UI/UX Komplett-Neugestaltung** — "Wolkenkratzer 2.0" mit sauberem, professionellem Enterprise-Design

---

## IST-ZUSTAND ANALYSE

### Architektur (✅ Gut nach Phase 4)
```
CalculatorContext → result1, result2 (KOMPLETT mit Bonussen)
Wizard → WizardContent (Reiner UI-Orchestrator)
CalculatorShell → Grid-Layout (Zero-Scroll)
```

### UI-Schulden (❌ Kritisch)

| Problem | Ort | Ursache |
|---------|-----|---------|
| **Visuelles Chaos** | SummarySidebar | Zu viele Boxen, inkonsistente Abstände |
| **Farb-Wildwuchs** | Überall | Direkte Farben statt Tokens (`emerald-500`, `amber-500`) |
| **Props-Drilling** | Sidebar/Footer | Redundante Props, Context nicht genutzt |
| **Veraltete Kommentare** | SummarySidebar | Referenziert `FloatingActionBar` (gelöscht) |
| **Accordion-Chaos** | Steps | Überladene Accordions, schlechte Hierarchie |
| **Header-Wildwuchs** | CalculatorShell | Zu viele Elemente, unklare Priorität |
| **Mobile UX** | MobileActionFooter | Zu komprimiert, schlechte Hierarchie |
| **Inkonsistente Typografie** | Global | Keine klare Scale |

---

## PHASE 5A: CONTEXT-FINALISIERUNG

### Ziel
- SummarySidebar und MobileActionFooter nutzen `useCalculator()` direkt
- Props-Drilling eliminieren
- Code-Reduktion ~30%

### Änderungen

#### 5A.1: SummarySidebar Refactor

**Vorher:**
```typescript
interface SummarySidebarProps {
  option: OfferOptionState;
  result: CalculationResult;
  viewMode: ViewMode;
  quantityBonus?: number;
  onResetForNewTariff?: () => void;
  onGoToCheckout?: () => void;
  className?: string;
}
```

**Nachher:**
```typescript
interface SummarySidebarProps {
  onResetForNewTariff?: () => void;
  onGoToCheckout?: () => void;
  className?: string;
}

export function SummarySidebar({ onResetForNewTariff, onGoToCheckout, className }: SummarySidebarProps) {
  const {
    option1: option,
    result1: result,
    effectiveViewMode,
    quantityBonusForOption1: quantityBonus,
  } = useCalculator();
  
  // ...
}
```

#### 5A.2: MobileActionFooter Refactor

**Vorher:**
```typescript
interface MobileActionFooterProps {
  option: OfferOptionState;
  result: CalculationResult | null;
  viewMode: ViewMode;
  quantityBonus?: number;
  onResetForNewTariff?: () => void;
}
```

**Nachher:**
```typescript
interface MobileActionFooterProps {
  onResetForNewTariff?: () => void;
}

export function MobileActionFooter({ onResetForNewTariff }: MobileActionFooterProps) {
  const {
    option1: option,
    result1: result,
    effectiveViewMode,
    quantityBonusForOption1: quantityBonus,
  } = useCalculator();
  
  // ...
}
```

#### 5A.3: Wizard.tsx Vereinfachung

**Entferne Props von CalculatorShell-Aufrufen:**
```typescript
// VORHER
<SummarySidebar
  option={option1}
  result={result1}
  viewMode={effectiveViewMode}
  quantityBonus={quantityBonusForOption1}
  onResetForNewTariff={handleResetForNewTariff}
/>

// NACHHER
<SummarySidebar
  onResetForNewTariff={handleResetForNewTariff}
/>
```

---

## PHASE 5B: UI/UX KOMPLETT-NEUGESTALTUNG

### Design-Prinzipien

```
┌────────────────────────────────────────────────────────────┐
│                    "WOLKENKRATZER 2.0"                     │
├────────────────────────────────────────────────────────────┤
│ 1. KONTRAST: Dunkel vs. Hell für Hierarchie                │
│ 2. WEISSRAUM: Großzügig, aber strukturiert                 │
│ 3. TYPOGRAFIE: 3-Stufen-Skala (Display/Body/Caption)       │
│ 4. FARBEN: Nur Semantic Tokens, keine direkten Werte       │
│ 5. INTERAKTION: Subtile Hover, keine Animationsorgien      │
│ 6. FOKUS: CTA immer sichtbar, Rest unterstützt             │
└────────────────────────────────────────────────────────────┘
```

### 5B.1: Design Token System

**Neue Tokens in `index.css`:**

```css
:root {
  /* === SURFACE HIERARCHY === */
  --surface-base: var(--background);
  --surface-raised: var(--card);
  --surface-elevated: 0 0% 100%; /* Pure white panels */
  --surface-sunken: 220 14% 94%; /* Input wells */
  
  /* === SEMANTIC ACTIONS === */
  --action-primary: var(--primary);
  --action-success: 142 71% 45%;
  --action-warning: 38 92% 50%;
  --action-danger: 0 84% 60%;
  
  /* === TEXT HIERARCHY === */
  --text-primary: var(--foreground);
  --text-secondary: 220 9% 46%;
  --text-muted: 220 9% 60%;
  --text-disabled: 220 9% 75%;
  
  /* === TYPOGRAPHY SCALE === */
  --text-display: 1.5rem;    /* 24px - Headlines */
  --text-title: 1.125rem;    /* 18px - Section titles */
  --text-body: 0.875rem;     /* 14px - Default text */
  --text-caption: 0.75rem;   /* 12px - Labels, hints */
  --text-micro: 0.625rem;    /* 10px - Badges */
  
  /* === SPACING SCALE === */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
}
```

### 5B.2: CalculatorShell 2.0

**Neues Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPACT HEADER (56px)                        │
│  [Logo]  ─────── Kalkulator ──────  [ViewMode] [•••] [User]    │
├─────────────────────────────────────────────────┬───────────────┤
│                                                 │               │
│              STAGE (Scrollable)                 │   SUMMARY     │
│                                                 │   (Fixed)     │
│  ┌──────────────────────────────────────────┐  │               │
│  │  HARDWARE ACCORDION                       │  │  ┌─────────┐ │
│  └──────────────────────────────────────────┘  │  │   KPIs   │ │
│                                                 │  └─────────┘ │
│  ┌──────────────────────────────────────────┐  │               │
│  │  MOBILFUNK ACCORDION                      │  │  ┌─────────┐ │
│  └──────────────────────────────────────────┘  │  │ ÜBERSICHT│ │
│                                                 │  └─────────┘ │
│  ┌──────────────────────────────────────────┐  │               │
│  │  FESTNETZ ACCORDION (Optional)            │  │  ┌─────────┐ │
│  └──────────────────────────────────────────┘  │  │ DEALER   │ │
│                                                 │  │ (cond.)  │ │
│                                                 │  └─────────┘ │
│                                                 │               │
│                                                 │  ═══════════ │
│                                                 │  [  CTA   ]  │
│                                                 │  ═══════════ │
└─────────────────────────────────────────────────┴───────────────┘
```

**Code-Änderungen:**

```typescript
// CalculatorShell.tsx - Neue Struktur
export function CalculatorShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col h-full w-full bg-surface-base", className)}>
      {/* COMPACT HEADER */}
      <CalculatorHeader />
      
      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] overflow-hidden">
        {/* LEFT: Stage */}
        <Stage>{children}</Stage>
        
        {/* RIGHT: Summary (Desktop) */}
        <aside className="hidden lg:block">
          <SummarySidebar />
        </aside>
      </div>
      
      {/* MOBILE FOOTER */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50">
        <MobileActionFooter />
      </div>
    </div>
  );
}
```

### 5B.3: SummarySidebar 2.0

**Komplette Neugestaltung:**

```
┌─────────────────────────────────────┐
│  Ø Monat                            │
│  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │
│  49,99 €                            │ ← HERO KPI
│  ──────────────────────────────────│
│                                     │
│  📱 iPhone 16 Pro                   │ ← Kompakte Zeile
│  📶 Business Prime XL (3x)          │
│  🌐 Festnetz aktiv                  │
│                                     │
│  ──────────────────────────────────│
│  🏷️ TeamDeal          -5%          │ ← Rabatt-Zeilen
│  🔗 GigaKombi         -5€          │
│  ──────────────────────────────────│
│                                     │
│ ┌─ DEALER SECTION (wenn sichtbar) ┐│
│ │  Provision    +320,00 €         ││
│ │  ───────────────────────        ││
│ │  MARGE        +127,50 €  ✅     ││
│ └─────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  [     ZUM ANGEBOT HINZUFÜGEN    ] │ ← STICKY CTA
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────────────┘
```

**Key-Änderungen:**
- Boxen entfernt → Einfache Zeilen mit Icons
- Farben nur aus Tokens
- CTA immer sichtbar (sticky)
- Dealer-Section als optionaler Block

### 5B.4: MobileActionFooter 2.0

**Neues Design:**

```
┌────────────────────────────────────────────────────────┐
│  49,99 €/M   │  +127€ ✅  │  [ HINZUFÜGEN ]          │
│  ────────────┴────────────┴─────────────────────────── │
│  effektiv       Marge(D)      PRIMARY CTA             │
└────────────────────────────────────────────────────────┘
```

**Charakteristiken:**
- 60px Höhe (Touch-optimiert)
- 3-Spalten-Grid
- Marge nur wenn `canShowDealerData`
- CTA mit voller Breite wenn kein Dealer-Mode

### 5B.5: Step-Components Refactor

**Aktuelle Probleme:**
- `HardwareStep.tsx` (621 Zeilen) — zu lang
- `MobileStep.tsx` (495 Zeilen) — zu lang
- Inkonsistente Card-Styles

**Strategie: Komponentenextraktion**

```
src/margenkalkulator/ui/steps/
├── HardwareStep/
│   ├── index.tsx           (Orchestrator, ~100 LOC)
│   ├── HardwareCard.tsx    (Single Card, ~80 LOC)
│   ├── HardwareGrid.tsx    (Grid Layout, ~50 LOC)
│   ├── HardwareSearch.tsx  (Search/Filter, ~60 LOC)
│   └── SIMOnlyCard.tsx     (Special Card, ~40 LOC)
│
├── MobileStep/
│   ├── index.tsx           (Orchestrator, ~80 LOC)
│   ├── TariffCard.tsx      (Single Card, ~100 LOC)
│   ├── TariffGrid.tsx      (Grid Layout, ~50 LOC)
│   ├── ContractToggle.tsx  (Neu/VVL Toggle, ~30 LOC)
│   └── QuantitySelector.tsx (Quantity Input, ~40 LOC)
│
└── FixedNetStep/
    └── index.tsx           (Bleibt kompakt)
```

### 5B.6: Header 2.0 (CalculatorHeader)

**Neue Komponente:**

```typescript
// src/margenkalkulator/ui/components/CalculatorHeader.tsx

export function CalculatorHeader() {
  const { viewMode, setViewMode, effectiveViewMode, canShowDealerData } = useCalculator();
  const { session: customerSession } = useCustomerSession();
  
  return (
    <header className="flex-none h-14 bg-card border-b border-border px-4 flex items-center justify-between">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">Kalkulator</h1>
        {customerSession.isActive && (
          <Badge variant="destructive" className="text-xs">
            <Lock className="w-3 h-3 mr-1" />
            Kunden-Modus
          </Badge>
        )}
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <ViewModeToggle compact />
        <ActionMenu compact />
      </div>
    </header>
  );
}
```

---

## IMPLEMENTIERUNGS-REIHENFOLGE

### Phase 5A (Context-Finalisierung)
1. **5A.1** SummarySidebar → useCalculator()
2. **5A.2** MobileActionFooter → useCalculator()
3. **5A.3** Wizard.tsx Props-Cleanup
4. **BUILD CHECK**

### Phase 5B (UI/UX-Neugestaltung)
5. **5B.1** Design Tokens in index.css
6. **5B.2** CalculatorShell 2.0
7. **5B.3** SummarySidebar 2.0 (Komplett neu)
8. **5B.4** MobileActionFooter 2.0 (Komplett neu)
9. **5B.5** CalculatorHeader (Neue Komponente)
10. **5B.6** Step-Refactoring (Optional, kann Phase 6 sein)
11. **BUILD CHECK**
12. **VISUAL VALIDATION**

---

## CODE-METRIKEN (Geschätzt)

| Datei | Vorher | Nachher | Delta |
|-------|--------|---------|-------|
| `SummarySidebar.tsx` | 419 | ~200 | -219 |
| `MobileActionFooter.tsx` | 165 | ~80 | -85 |
| `Wizard.tsx` | 700 | ~550 | -150 |
| `CalculatorShell.tsx` | 146 | ~100 | -46 |
| `CalculatorHeader.tsx` (NEU) | 0 | ~60 | +60 |
| `index.css` (Tokens) | 288 | ~350 | +62 |
| **NETTO** | 1718 | ~1340 | **-378** |

---

## RISIKO-MATRIX

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| Context undefined errors | Mittel | Safe defaults in useCalculator |
| Layout shift | Niedrig | CSS Grid mit festen Breiten |
| Mobile CTA hidden | Niedrig | z-50 + fixed positioning |
| Token naming conflicts | Niedrig | Prefix mit `--` |

---

## VALIDIERUNG NACH PHASE 5

### Funktional
- [ ] Tarif wählen → Sidebar zeigt Preis
- [ ] Quantity ändern → Bonus aktualisiert
- [ ] ViewMode Toggle → Dealer-Section erscheint/verschwindet
- [ ] Mobile Footer → CTA immer sichtbar
- [ ] "Zum Angebot" → Item im Basket

### Visuell
- [ ] Konsistente Abstände (8px Grid)
- [ ] Keine direkten Farbwerte im Code
- [ ] Typografie-Hierarchie erkennbar
- [ ] CTA immer prominent

### Performance
- [ ] Keine Console Warnings
- [ ] Build < 30s
- [ ] Keine Layout Shifts (CLS = 0)

---

## NÄCHSTE SCHRITTE NACH PHASE 5

**Phase 6 (Optional):**
- Step-Komponenten aufteilen (HardwareStep → Modul)
- Animation-System (Framer Motion konsistent)
- Dark Mode Optimierung
- Accessibility Audit

**Phase 7 (Final):**
- Performance Monitoring
- E2E Tests
- Dokumentation
