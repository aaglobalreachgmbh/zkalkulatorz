
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

---

# PHASE 6: STEP-MODULARISIERUNG + POLISH

## Status: GEPLANT

---

## 🎯 Vision

**Phase 6 = 3 Sub-Phasen:**

1. **6A: Step-Modularisierung** — HardwareStep & MobileStep in fokussierte Module aufteilen
2. **6B: Animation-System** — Konsistentes Framer Motion Setup
3. **6C: Accessibility & Polish** — A11y Audit + Dark Mode Fix + Final Touch

---

## IST-ZUSTAND NACH PHASE 5

### Architektur (✅ Gut)
```
CalculatorContext → Vollständige Business-Logik
CalculatorShell 2.0 → Sauberes Grid-Layout
SummarySidebar 2.0 → Context-basiert, cleanes Design
MobileActionFooter 2.0 → Context-basiert, Touch-optimiert
```

### Verbleibende Schulden (❌ Phase 6 Scope)

| Problem | Ort | Impact |
|---------|-----|--------|
| **Monolithische Steps** | HardwareStep (621 LOC), MobileStep (495 LOC) | Wartbarkeit, Testbarkeit |
| **Inkonsistente Animationen** | Verschiedene `transition-*` Klassen | UX-Inkonsistenz |
| **A11y Lücken** | Fehlende aria-labels, Focus-Management | Barrierefreiheit |
| **Dark Mode Bugs** | Einige Tokens nicht invertiert | Visuell |

---

## PHASE 6A: STEP-MODULARISIERUNG

### Ziel
- Monolithische Step-Komponenten in fokussierte Module aufteilen
- Jedes Modul < 150 LOC
- Wiederverwendbare Primitives extrahieren

### 6A.1: HardwareStep Modularisierung

**Aktuelle Struktur (621 LOC):**
```
HardwareStep.tsx
├── State Management (~50 LOC)
├── Search/Filter Logic (~80 LOC)
├── Hardware Grid Rendering (~200 LOC)
├── SIM-Only Card (~60 LOC)
├── Selection Logic (~100 LOC)
└── UI Components inline (~130 LOC)
```

**Neue Struktur:**
```
src/margenkalkulator/ui/steps/HardwareStep/
├── index.tsx              # Orchestrator (~80 LOC)
│   └── Imports, State, Layout
│
├── HardwareGrid.tsx       # Grid Container (~60 LOC)
│   └── Responsive Grid, Loading State
│
├── HardwareCard.tsx       # Single Device Card (~100 LOC)
│   └── Image, Name, Price, Selection
│
├── HardwareSearch.tsx     # Search + Filter (~80 LOC)
│   └── Input, Category Filter, Clear
│
├── SIMOnlyCard.tsx        # Special "Ohne Gerät" Card (~50 LOC)
│   └── Icon, Label, Selection
│
├── PriceInput.tsx         # EK/VK Price Editor (~60 LOC)
│   └── Dual Input, Validation
│
└── types.ts               # Local Types (~20 LOC)
    └── HardwareCardProps, SearchState
```

**Migration-Pattern:**
```typescript
// index.tsx - Orchestrator
export function HardwareStep() {
  const { option1, updateOption1 } = useCalculator();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  
  const filteredHardware = useFilteredHardware(search, category);
  
  const handleSelect = useCallback((hw: Hardware) => {
    updateOption1({ hardware: { ...option1.hardware, ...hw } });
  }, [option1, updateOption1]);
  
  return (
    <div className="space-y-4">
      <HardwareSearch 
        value={search} 
        onChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
      />
      <HardwareGrid>
        <SIMOnlyCard 
          selected={!option1.hardware.name}
          onSelect={() => handleSelect(SIM_ONLY_HARDWARE)}
        />
        {filteredHardware.map(hw => (
          <HardwareCard
            key={hw.id}
            hardware={hw}
            selected={option1.hardware.name === hw.name}
            onSelect={() => handleSelect(hw)}
          />
        ))}
      </HardwareGrid>
      {option1.hardware.name && (
        <PriceInput
          ekNet={option1.hardware.ekNet}
          vkBrutto={option1.hardware.vkBrutto}
          onChange={(prices) => updateOption1({ hardware: { ...option1.hardware, ...prices } })}
        />
      )}
    </div>
  );
}
```

### 6A.2: MobileStep Modularisierung

**Aktuelle Struktur (495 LOC):**
```
MobileStep.tsx
├── Contract Type Toggle (~40 LOC)
├── Tariff Grid (~180 LOC)
├── Quantity Selector (~60 LOC)
├── SUB Variant Selector (~80 LOC)
└── Feature Display (~135 LOC)
```

**Neue Struktur:**
```
src/margenkalkulator/ui/steps/MobileStep/
├── index.tsx              # Orchestrator (~80 LOC)
│
├── ContractToggle.tsx     # Neu/VVL Toggle (~40 LOC)
│   └── SegmentedControl Component
│
├── TariffGrid.tsx         # Grid Container (~50 LOC)
│   └── Responsive Grid, Category Grouping
│
├── TariffCard.tsx         # Single Tariff Card (~120 LOC)
│   └── Name, Price, Data, Features, Selection
│
├── QuantitySelector.tsx   # Quantity Input (~50 LOC)
│   └── Stepper, Max Validation
│
├── SUBVariantSelect.tsx   # Device Tier Selector (~70 LOC)
│   └── Radio/Select for SIM_ONLY, BASIC, SMARTPHONE, PREMIUM
│
├── TariffFeatures.tsx     # Feature Badges (~60 LOC)
│   └── 5G, WiFi Calling, EU Roaming Display
│
└── types.ts               # Local Types (~20 LOC)
```

### 6A.3: FixedNetStep (Bleibt kompakt)

FixedNetStep ist bereits überschaubar (~300 LOC). Nur minimale Extraktion:

```
src/margenkalkulator/ui/steps/FixedNetStep/
├── index.tsx              # Hauptkomponente (~200 LOC)
├── ProductSelector.tsx    # Access Type + Product (~80 LOC)
└── GigaKombiInfo.tsx      # Benefit Display (~40 LOC)
```

---

## PHASE 6B: ANIMATION-SYSTEM

### Ziel
- Einheitliches Framer Motion Setup
- Wiederverwendbare Animation-Presets
- Performance-optimiert (keine Layout Shifts)

### 6B.1: Animation Config

**Neue Datei: `src/lib/animations.ts`**

```typescript
import { type Variants, type Transition } from "framer-motion";

// === TIMING PRESETS ===
export const TIMING = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  enter: 0.25,
  exit: 0.15,
} as const;

// === EASING PRESETS ===
export const EASING = {
  smooth: [0.4, 0, 0.2, 1],      // Material Design standard
  snappy: [0.4, 0, 0.6, 1],      // Quick response
  bounce: [0.68, -0.55, 0.265, 1.55], // Playful
  decelerate: [0, 0, 0.2, 1],   // Enter
  accelerate: [0.4, 0, 1, 1],   // Exit
} as const;

// === VARIANT PRESETS ===
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// === TRANSITION PRESETS ===
export const smoothTransition: Transition = {
  duration: TIMING.normal,
  ease: EASING.smooth,
};

export const snapTransition: Transition = {
  duration: TIMING.fast,
  ease: EASING.snappy,
};
```

### 6B.2: AnimatedCard Component

**Neue Datei: `src/components/ui/animated-card.tsx`**

```typescript
import { motion } from "framer-motion";
import { scaleIn, smoothTransition } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AnimatedCard({ children, selected, onClick, className }: AnimatedCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={smoothTransition}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-card p-4 cursor-pointer transition-colors",
        selected && "border-primary ring-2 ring-primary/20",
        !selected && "border-border hover:border-primary/50",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
```

### 6B.3: AnimatePresence für Listen

```typescript
// In HardwareGrid.tsx
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, slideUp } from "@/lib/animations";

export function HardwareGrid({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

## PHASE 6C: ACCESSIBILITY & POLISH

### 6C.1: A11y Audit Checklist

| Bereich | Anforderung | Implementation |
|---------|-------------|----------------|
| **Focus Management** | Visible focus rings | `focus-visible:ring-2 ring-primary` |
| **Keyboard Navigation** | All interactive elements | `tabIndex`, `onKeyDown` handlers |
| **Screen Readers** | Descriptive labels | `aria-label`, `aria-describedby` |
| **Color Contrast** | WCAG AA (4.5:1) | Token validation |
| **Motion** | Reduced motion support | `prefers-reduced-motion` |

### 6C.2: Reduced Motion Support

```typescript
// src/lib/animations.ts - Erweitert

export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  
  return reduced;
};

// Usage
const prefersReducedMotion = useReducedMotion();
const transition = prefersReducedMotion ? { duration: 0 } : smoothTransition;
```

### 6C.3: Focus Trap für Modals

```typescript
// Für alle Dialog/Sheet Komponenten
import { FocusTrap } from "@radix-ui/react-focus-trap";

// Bereits durch Radix UI abgedeckt, aber sicherstellen dass:
// - Alle Dialoge FocusTrap nutzen
// - Escape schließt Dialoge
// - Focus returns to trigger on close
```

### 6C.4: Dark Mode Token Fix

**Überprüfen in `index.css`:**

```css
.dark {
  /* Sicherstellen dass alle neuen Tokens invertiert sind */
  --surface-elevated: 222 47% 14%;
  --surface-sunken: 222 47% 6%;
  
  --text-secondary: 220 9% 65%;
  --text-muted: 220 9% 50%;
  --text-disabled: 220 9% 35%;
}
```

### 6C.5: Final Polish Items

| Item | Beschreibung |
|------|--------------|
| **Loading States** | Skeleton Loader für alle async Daten |
| **Empty States** | "Keine Tarife gefunden" mit Icon |
| **Error States** | Toast + Inline Error Messages |
| **Hover States** | Konsistente 0.15s Transitions |
| **Active States** | Ring + Scale für Touch Feedback |

---

## IMPLEMENTIERUNGS-REIHENFOLGE

### Phase 6A (Modularisierung)
1. **6A.1** HardwareStep aufteilen (5 neue Dateien)
2. **6A.2** MobileStep aufteilen (6 neue Dateien)
3. **6A.3** FixedNetStep minimal refactoren
4. **BUILD CHECK**

### Phase 6B (Animationen)
5. **6B.1** `src/lib/animations.ts` erstellen
6. **6B.2** AnimatedCard Component
7. **6B.3** Steps mit neuen Animationen
8. **BUILD CHECK**

### Phase 6C (A11y & Polish)
9. **6C.1** Focus Styles global
10. **6C.2** Reduced Motion Support
11. **6C.3** Dark Mode Token Fix
12. **6C.4** Empty/Loading/Error States
13. **FINAL BUILD CHECK**
14. **A11Y AUDIT mit aXe**

---

## CODE-METRIKEN (Geschätzt)

| Datei/Modul | Vorher | Nachher | Delta |
|-------------|--------|---------|-------|
| `HardwareStep.tsx` | 621 | ~80 (index) | -541 |
| `HardwareStep/*` (NEU) | 0 | ~370 | +370 |
| `MobileStep.tsx` | 495 | ~80 (index) | -415 |
| `MobileStep/*` (NEU) | 0 | ~370 | +370 |
| `animations.ts` (NEU) | 0 | ~80 | +80 |
| `animated-card.tsx` (NEU) | 0 | ~40 | +40 |
| **NETTO** | 1116 | ~1020 | **-96** |

**Wichtiger:** Die Reduktion ist gering, aber die Wartbarkeit steigt enorm:
- Jede Datei < 150 LOC
- Isolierte Tests möglich
- Wiederverwendbare Komponenten

---

## RISIKO-MATRIX

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| Import-Fehler nach Refactor | Mittel | Barrel exports, IDE auto-imports |
| Animation Performance | Niedrig | `will-change`, GPU-accelerated props |
| A11y Regression | Niedrig | aXe automated testing |
| Breaking Changes | Niedrig | Schrittweise Migration mit Tests |

---

## VALIDIERUNG NACH PHASE 6

### Funktional
- [ ] Hardware-Auswahl funktioniert wie vorher
- [ ] Tarif-Auswahl funktioniert wie vorher
- [ ] Animationen smooth (60fps)
- [ ] Keyboard-Navigation vollständig

### A11y
- [ ] aXe Audit: 0 Violations
- [ ] Keyboard-only Navigation möglich
- [ ] Screen Reader Test (VoiceOver/NVDA)
- [ ] Color Contrast Check bestanden

### Performance
- [ ] Lighthouse Performance > 90
- [ ] CLS = 0
- [ ] FCP < 1.5s

---

# PHASE 7: FINAL REVIEW & DOCUMENTATION

## Status: GEPLANT (nach Phase 6)

### Scope
- Performance Monitoring Setup
- E2E Test Suite (Playwright)
- Technische Dokumentation
- README Update
- Demo-Video/Screenshots

---

## GESAMTÜBERSICHT ALLER PHASEN

| Phase | Focus | Status |
|-------|-------|--------|
| 1-3 | Architecture Foundation | ✅ Abgeschlossen |
| 4 | Business Logic → Context | ✅ Abgeschlossen |
| 5A | Context-Finalisierung | 📋 Geplant |
| 5B | UI/UX Neugestaltung | 📋 Geplant |
| 6A | Step-Modularisierung | 📋 Geplant |
| 6B | Animation-System | 📋 Geplant |
| 6C | A11y & Polish | 📋 Geplant |
| 7 | Final Review | 📋 Geplant |
