
# PHASE 5-7: ENTERPRISE UX COMPLETE OVERHAUL

## Status: ✅ PHASE 5A + 5B (Tokens) ABGESCHLOSSEN
## Datum: 2026-02-01

### Fortschritt:
- [x] Phase 5A: SummarySidebar & MobileActionFooter auf Context umgestellt
- [x] Phase 5B (Teil 1): Semantic Design Tokens in index.css hinzugefügt
- [ ] Phase 5B (Teil 2): Header-Reduzierung & Sidebar-Redesign
- [ ] Phase 5C: Komponenten-Bereinigung
- [ ] Phase 6: Step-Modularisierung
- [ ] Phase 7: Polish & Accessibility

---

## 📊 ANALYSE-ERGEBNISSE (KRITISCH)

### Quantitative Probleme

| Metrik | IST | SOLL | Delta |
|--------|-----|------|-------|
| UI-Komponenten | **109** | 30-40 | -70% |
| Wizard.tsx LOC | **700** | 300 | -57% |
| HardwareStep LOC | **621** | 200 | -68% |
| Hardcodierte Farben | **578** | 0 | -100% |
| Header-Elemente | **8+** | 3 | -63% |
| Accordion-Ebenen | **3** | 1 | -67% |

### Qualitative Probleme

1. **Kognitive Überlastung**: Zu viele Optionen gleichzeitig sichtbar
2. **Inkonsistente Farbsprache**: `emerald-500` vs `green-500` vs `success`
3. **Redundante Features**: SmartAdvisor, AiRecommendations, ConfigurableDashboard
4. **Verwirrende Navigation**: 3 Accordion-Ebenen + Stepper + Tabs
5. **Button-Probleme**: Event-Handler-Chaos durch zu viele verschachtelte Komponenten

---

## 🎯 ENTERPRISE UX PRINZIPIEN (CPQ Best Practices)

Aus der Recherche zu Salesforce CPQ, IBM Carbon Design, Atlassian:

```text
┌──────────────────────────────────────────────────────────────┐
│ 1. "ONE PRIMARY ACTION PER SCREEN"                           │
│    → Nur EIN großer CTA pro View ("Zum Angebot")             │
│                                                              │
│ 2. "PRICE ALWAYS VISIBLE"                                    │
│    → Sticky Sidebar mit Hero-Preis, nie verdeckt             │
│                                                              │
│ 3. "PROGRESSIVE DISCLOSURE"                                  │
│    → Nur zeigen, was gerade relevant ist                     │
│                                                              │
│ 4. "< 3 CLICKS TO GOAL"                                      │
│    → Hardware → Tarif → Add = 3 Klicks                       │
│                                                              │
│ 5. "COGNITIVE LOAD < 7±2 ITEMS"                              │
│    → Max 5-9 sichtbare Optionen pro Bereich                  │
└──────────────────────────────────────────────────────────────┘
```

---

## PHASE 5A: CONTEXT-FINALISIERUNG (2h)

### Ziel
`SummarySidebar` und `MobileActionFooter` auf `useCalculator()` umstellen.

### Änderungen

**SummarySidebar.tsx (419 → ~150 LOC)**

```typescript
// VORHER: 11 Props
export function SummarySidebar({
  option, result, viewMode, quantityBonus, 
  onResetForNewTariff, onGoToCheckout, className
}: SummarySidebarProps)

// NACHHER: 2 Props
export function SummarySidebar({ 
  onResetForNewTariff, 
  className 
}: SummarySidebarProps) {
  // Alles aus Context
  const { 
    option1: option, 
    result1: result, 
    effectiveViewMode,
    quantityBonusForOption1: quantityBonus,
    activeQuantityBonusTier,
  } = useCalculator();
  
  const visibility = useSensitiveFieldsVisible(effectiveViewMode);
  // ...
}
```

**MobileActionFooter.tsx (165 → ~80 LOC)**

```typescript
// VORHER: 5 Props
// NACHHER: 1 Prop (onResetForNewTariff)
export function MobileActionFooter({ onResetForNewTariff }) {
  const { option1, result1, effectiveViewMode, quantityBonusForOption1 } = useCalculator();
  // ...
}
```

**Wizard.tsx Cleanup (~100 LOC entfernt)**

```diff
- <SummarySidebar
-   option={option1}
-   result={result1}
-   viewMode={effectiveViewMode}
-   quantityBonus={quantityBonusForOption1}
-   onResetForNewTariff={resetForNewTariff}
-   onGoToCheckout={() => goToSection("compare")}
- />
+ <SummarySidebar onResetForNewTariff={resetForNewTariff} />
```

---

## PHASE 5B: RADIKAL-MINIMALISTISCHES REDESIGN (4h)

### 1. Semantic Color Tokens (index.css)

```css
@layer base {
  :root {
    /* === SEMANTIC STATUS TOKENS === */
    --status-success: 142 71% 45%;      /* Positive Margin */
    --status-warning: 38 92% 50%;       /* Low Margin */
    --status-error: 0 84% 60%;          /* Negative Margin */
    
    /* === MARGIN-SPECIFIC === */
    --margin-positive: var(--status-success);
    --margin-neutral: var(--status-warning);
    --margin-negative: var(--status-error);
    
    /* === SURFACE HIERARCHY === */
    --surface-base: var(--background);
    --surface-elevated: var(--card);
    --surface-overlay: 0 0% 100%;
    
    /* === TEXT HIERARCHY === */
    --text-display: var(--foreground);      /* Headlines */
    --text-body: var(--muted-foreground);   /* Body text */
    --text-subtle: 220 9% 60%;              /* Hints */
    
    /* === SPACING SCALE === */
    --space-xs: 0.25rem;   /* 4px */
    --space-sm: 0.5rem;    /* 8px */
    --space-md: 1rem;      /* 16px */
    --space-lg: 1.5rem;    /* 24px */
    --space-xl: 2rem;      /* 32px */
  }
}
```

### 2. Header-Reduzierung (8 → 3 Elemente)

**VORHER:**
```text
┌─────────────────────────────────────────────────────────────────┐
│ Kalkulator  [Progress] [Session] [Density] [View] [Session] [⋮]│
└─────────────────────────────────────────────────────────────────┘
```

**NACHHER:**
```text
┌─────────────────────────────────────────────────────────────────┐
│ Kalkulator                                      [Modus ▾] [⋮]  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementierung:**
- `WizardProgress` → ENTFERNEN (Accordion zeigt Status bereits)
- `CustomerSessionToggle` → In ActionMenu verschieben
- `DensityToggle` → In ActionMenu verschieben
- `ViewModeToggle` → Kompakter Dropdown "Modus"

### 3. Sidebar-Redesign: "Hero KPI" Pattern

**VORHER (Zu viele Karten):**
```text
┌──────────────────────────┐
│ Übersicht        [1x]    │
│ ┌──────────────────────┐ │
│ │  Regulär: 49,99€     │ │
│ │  €29,99              │ │
│ │  Ø Monat (Effektiv)  │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ ┌────┐ Hardware          │
│ │ 📱 │ iPhone 16 Pro     │
│ └────┘ EK: 999€          │
├──────────────────────────┤
│ ┌────┐ Mobilfunk         │
│ │ 📶 │ Red Business L    │
│ └────┘ Neu               │
├──────────────────────────┤
│ ┌────┐ Festnetz          │
│ │ 📡 │ Nicht aktiv       │
│ └────┘                   │
├──────────────────────────┤
│ ✅ GigaKombi aktiv       │
├──────────────────────────┤
│ Aktive Rabatte           │
│ TeamDeal (3x)    -5%     │
│ GigaKombi        -5€     │
├──────────────────────────┤
│ Provision        +180€   │
│ Marge            +142€   │
│ ✅ Gute Marge            │
├──────────────────────────┤
│ [Export & Aktionen ▾]    │
├──────────────────────────┤
│ [████ ZUM ANGEBOT ████]  │
│ [Zum Gesamtangebot (2)]  │
└──────────────────────────┘
```

**NACHHER (Hero KPI + Kompaktliste):**
```text
┌──────────────────────────┐
│       €29,99             │   ← HERO: 48px Font
│       Ø mtl. netto       │
│                          │
│  ┌────────────────────┐  │
│  │ iPhone 16 + Prime L │  │   ← Kompakt: 1 Zeile
│  │ 3× Neu • GigaKombi │  │
│  └────────────────────┘  │
│                          │
│  Marge: +142€ ██████░░░  │   ← Progress Bar
│                          │
│ [████ ZUM ANGEBOT ████]  │   ← Primär CTA
└──────────────────────────┘
```

**Neue Komponente: `CompactConfigSummary.tsx`**

```typescript
export function CompactConfigSummary() {
  const { option1, result1 } = useCalculator();
  
  const parts = [
    option1.hardware.name || "SIM Only",
    option1.mobile.tariffId?.replace(/_/g, " ") || "Kein Tarif",
  ].filter(Boolean);
  
  const badges = [
    option1.mobile.quantity > 1 && `${option1.mobile.quantity}×`,
    option1.mobile.contractType === "new" ? "Neu" : "VVL",
    option1.fixedNet.enabled && "GigaKombi",
  ].filter(Boolean);
  
  return (
    <div className="p-3 bg-surface-elevated rounded-lg border">
      <p className="font-medium text-sm truncate">{parts.join(" + ")}</p>
      <div className="flex gap-1 mt-1">
        {badges.map(b => <Badge key={b} variant="outline" className="text-xs">{b}</Badge>)}
      </div>
    </div>
  );
}
```

### 4. Mobile Footer Redesign (64px, 3-Spalten)

**VORHER:**
```text
┌────────────────────────────────────────────┐
│ Ø/Monat  [3×]  ↗+142€  [🛒1] [Hinzufügen] │
└────────────────────────────────────────────┘
```

**NACHHER:**
```text
┌────────────────────────────────────────────┐
│  €29,99   │   +142€    │ [████ ADD ████]  │
│  Ø mtl.   │   Marge    │                  │
└────────────────────────────────────────────┘
```

**Implementierung:**

```typescript
export function MobileActionFooter({ onResetForNewTariff }) {
  const { option1, result1, effectiveViewMode, quantityBonusForOption1 } = useCalculator();
  const visibility = useSensitiveFieldsVisible(effectiveViewMode);
  
  if (!result1 || !option1.mobile.tariffId) return null;
  
  const margin = result1.dealer.margin + quantityBonusForOption1;
  
  return (
    <div className="grid grid-cols-3 gap-2 items-center h-16">
      {/* Spalte 1: Preis */}
      <div className="text-center">
        <p className="text-lg font-bold tabular-nums">
          {result1.totals.avgTermNet.toFixed(2)}€
        </p>
        <p className="text-[10px] text-text-subtle uppercase">Ø mtl.</p>
      </div>
      
      {/* Spalte 2: Marge (nur Dealer) */}
      {visibility.showDealerEconomics ? (
        <div className="text-center">
          <p className={cn(
            "text-lg font-bold tabular-nums",
            margin >= 100 && "text-[hsl(var(--margin-positive))]",
            margin >= 0 && margin < 100 && "text-[hsl(var(--margin-neutral))]",
            margin < 0 && "text-[hsl(var(--margin-negative))]",
          )}>
            {margin >= 0 ? "+" : ""}{margin.toFixed(0)}€
          </p>
          <p className="text-[10px] text-text-subtle uppercase">Marge</p>
        </div>
      ) : (
        <div /> // Placeholder
      )}
      
      {/* Spalte 3: CTA */}
      <Button 
        size="lg" 
        onClick={handleAdd}
        className="h-12 font-semibold"
      >
        <Plus className="w-5 h-5 mr-1" />
        Add
      </Button>
    </div>
  );
}
```

---

## PHASE 5C: KOMPONENTEN-BEREINIGUNG (3h)

### Zu löschende Komponenten (~1.400 LOC)

| Komponente | LOC | Grund |
|------------|-----|-------|
| `WizardProgress.tsx` | 118 | Redundant (Accordion zeigt Status) |
| `QuickStartDialog.tsx` | ~150 | Selten genutzt, verwirrt |
| `DensityToggle.tsx` | ~80 | In ActionMenu verschieben |
| `SmartAdvisor.tsx` | ~200 | Overengineered, verwirrt |
| `SmartAdvisorBadge.tsx` | ~50 | Abhängigkeit von SmartAdvisor |
| `AiConsultant.tsx` | ~300 | Zu komplex für MVP |
| `AiRecommendationsPanel.tsx` | ~450 | Redundant mit AiConsultant |
| `PriceTimeline.tsx` | ~150 | Verwirrt mehr als es hilft |
| `SavingsBreakdown.tsx` | ~120 | Redundant mit PricePeriodBreakdown |
| `ConfigurableDashboard.tsx` | ~250 | Ungenutzt |
| `WelcomeWidget.tsx` | ~100 | Ungenutzt |
| `SortableWidget.tsx` | ~150 | Ungenutzt |

**Gesamt-Einsparung: ~2.100 LOC**

### Zu konsolidierende Komponenten

| Von | Nach | Einsparung |
|-----|------|------------|
| `AnimatedCurrency.tsx` + `MarginBadge.tsx` | `PriceDisplay.tsx` | ~50 LOC |
| `ViewModeToggle.tsx` + `CustomerSessionToggle.tsx` | `ModeSelector.tsx` | ~80 LOC |

---

## PHASE 6: STEP-MODULARISIERUNG (4h)

### HardwareStep.tsx (621 → 200 LOC)

**Extraktion:**
```text
src/margenkalkulator/ui/steps/hardware/
├── HardwareGrid.tsx       (150 LOC) ← Karten-Grid
├── HardwareCard.tsx       (80 LOC)  ← Einzelne Karte
├── HardwareFilters.tsx    (60 LOC)  ← Brand/Category Filter
├── HardwareSearch.tsx     (40 LOC)  ← Suchfeld
└── index.tsx              (50 LOC)  ← Orchestrator
```

### MobileStep.tsx (495 → 150 LOC)

**Extraktion:**
```text
src/margenkalkulator/ui/steps/mobile/
├── TariffGrid.tsx         (120 LOC)
├── TariffCard.tsx         (80 LOC)
├── ContractTypeSelector.tsx (40 LOC)
├── QuantitySelector.tsx   (50 LOC)
└── index.tsx              (60 LOC)
```

---

## PHASE 7: POLISH & ACCESSIBILITY (2h)

### 7A: Farben-Migration

**Suchen & Ersetzen:**
```diff
- text-emerald-500      → text-[hsl(var(--status-success))]
- text-emerald-600      → text-[hsl(var(--status-success))]
- bg-emerald-500/10     → bg-[hsl(var(--status-success)/0.1)]
- text-amber-500        → text-[hsl(var(--status-warning))]
- text-red-500          → text-[hsl(var(--status-error))]
```

**Utility-Klassen hinzufügen:**

```css
@layer utilities {
  .text-margin-positive { color: hsl(var(--margin-positive)); }
  .text-margin-neutral { color: hsl(var(--margin-neutral)); }
  .text-margin-negative { color: hsl(var(--margin-negative)); }
  
  .bg-status-success { background-color: hsl(var(--status-success) / 0.1); }
  .bg-status-warning { background-color: hsl(var(--status-warning) / 0.1); }
  .bg-status-error { background-color: hsl(var(--status-error) / 0.1); }
}
```

### 7B: Button-Funktionalität Fix

**Problem:** Mehrfaches Klicken nötig
**Ursache:** Event-Bubbling durch verschachtelte Komponenten

**Lösung:**

```typescript
// In allen interaktiven Elementen
<Button
  onClick={(e) => {
    e.stopPropagation(); // Verhindert Event-Bubbling
    handleAction();
  }}
>
```

**Systematische Prüfung:**
1. Alle `onClick` Handler in Accordions
2. Alle `onClick` Handler in Popovers/Dropdowns
3. Alle `onClick` Handler in Cards

### 7C: Accessibility (A11y)

```typescript
// Focus-Management für Accordions
<AccordionTrigger
  className="focus-visible:ring-2 focus-visible:ring-primary/50"
  aria-expanded={isOpen}
  aria-controls={`panel-${id}`}
>

// Für Screen Readers
<span className="sr-only">
  {margin >= 0 ? "Positive Marge" : "Negative Marge"}: {margin}€
</span>
```

---

## IMPLEMENTIERUNGS-REIHENFOLGE

| Phase | Fokus | Geschätzte Zeit | Abhängigkeiten |
|-------|-------|-----------------|----------------|
| **5A** | Context-Finalisierung | 2h | - |
| **5B** | UI-Redesign (Sidebar, Header, Footer) | 4h | 5A |
| **5C** | Komponenten-Bereinigung | 3h | 5B |
| **6** | Step-Modularisierung | 4h | 5C |
| **7** | Polish & A11y | 2h | 6 |
| **TOTAL** | | **15h** | |

---

## ERFOLGSMETRIKEN

| Metrik | Vorher | Nachher | Ziel |
|--------|--------|---------|------|
| UI-Komponenten | 109 | <40 | ✓ |
| Wizard.tsx LOC | 700 | <350 | ✓ |
| Hardcodierte Farben | 578 | 0 | ✓ |
| Header-Elemente | 8+ | 3 | ✓ |
| Klicks bis Angebot | 5-7 | 3 | ✓ |
| Button-Response | 2+ Klicks | 1 Klick | ✓ |

---

## DATEIEN-ÜBERSICHT

### Zu ändern:
- `src/margenkalkulator/context/CalculatorContext.tsx`
- `src/margenkalkulator/ui/Wizard.tsx`
- `src/margenkalkulator/ui/components/SummarySidebar.tsx`
- `src/margenkalkulator/ui/components/MobileActionFooter.tsx`
- `src/margenkalkulator/layout/CalculatorShell.tsx`
- `src/index.css`

### Neu zu erstellen:
- `src/margenkalkulator/ui/components/CompactConfigSummary.tsx`
- `src/margenkalkulator/ui/components/ModeSelector.tsx`
- `src/margenkalkulator/ui/components/PriceDisplay.tsx`
- `src/margenkalkulator/ui/steps/hardware/*` (Modularisierung)
- `src/margenkalkulator/ui/steps/mobile/*` (Modularisierung)

### Zu löschen:
- `src/margenkalkulator/ui/components/WizardProgress.tsx`
- `src/margenkalkulator/ui/components/QuickStartDialog.tsx`
- `src/margenkalkulator/ui/components/SmartAdvisor.tsx`
- `src/margenkalkulator/ui/components/SmartAdvisorBadge.tsx`
- `src/margenkalkulator/ui/components/AiConsultant.tsx`
- `src/margenkalkulator/ui/components/AiRecommendationsPanel.tsx`
- `src/margenkalkulator/ui/components/PriceTimeline.tsx`
- `src/margenkalkulator/ui/components/SavingsBreakdown.tsx`
- `src/margenkalkulator/ui/components/ConfigurableDashboard.tsx`
- `src/margenkalkulator/ui/components/WelcomeWidget.tsx`
- `src/margenkalkulator/ui/components/SortableWidget.tsx`
- `src/components/DensityToggle.tsx`
