# PHASE 5 & 6: KOMPLETTE UI/UX NEUGESTALTUNG

## Status: GEPLANT
## Datum: 2026-02-01

---

## 🚨 KOMPLETT-AUDIT: AKTUELLE PROBLEME

### Quantitative Analyse

| Metrik | IST | SOLL | Aktion |
|--------|-----|------|--------|
| `Wizard.tsx` | 700 LOC | < 350 | Halbieren |
| `SummarySidebar.tsx` | 419 LOC | < 150 | Komplett neu |
| `HardwareStep.tsx` | 621 LOC | < 300 | Aufteilen |
| `MobileStep.tsx` | 495 LOC | < 250 | Aufteilen |
| Components in `/ui/components/` | **103** | < 40 | 63 löschen/konsolidieren |
| Direkte Farbwerte im Code | ~50 | 0 | Alle durch Tokens ersetzen |

### Qualitative Probleme

| Problem | Schwere | Ort | Beschreibung |
|---------|---------|-----|--------------|
| **103 Komponenten** | 🔴 Kritisch | `/ui/components/` | Unmöglich zu navigieren |
| **Überladener Header** | 🔴 Kritisch | Wizard.tsx:428-468 | 8+ UI-Elemente (Progress, Badge, Toggle, Menu, Density...) |
| **Redundante CTAs** | 🔴 Kritisch | Sidebar + Footer | "Zum Angebot" 2x sichtbar |
| **3 große Boxen** | 🟠 Hoch | SummarySidebar:154-218 | Hardware/Tarif/Festnetz als separate Karten |
| **Veralteter Kommentar** | 🟠 Hoch | SummarySidebar:11 | "Actions moved to FloatingActionBar" (existiert nicht) |
| **Farb-Chaos** | 🟠 Hoch | Überall | `emerald-500`, `amber-500`, `orange-600` direkt |
| **Accordion in Accordion** | 🟡 Mittel | Steps | Verschachtelte Accordions verwirrend |
| **Unklare Hierarchie** | 🟡 Mittel | Global | Was ist die EINE wichtigste Aktion? |

---

## 🎯 NEUES DESIGN-PRINZIP

```
╔═══════════════════════════════════════════════════════════════╗
║                     "BRUTAL SIMPEL"                           ║
╠═══════════════════════════════════════════════════════════════╣
║  1. EIN Preis groß sichtbar (Hero KPI)                       ║
║  2. EIN primärer CTA (Zum Angebot)                           ║
║  3. DREI Schritte (Hardware → Tarif → Festnetz)              ║
║  4. KEINE verschachtelten Accordions                         ║
║  5. NUR Semantic Tokens für Farben                           ║
║  6. < 40 Komponenten total                                   ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🗑️ ZU LÖSCHENDE KOMPONENTEN (Phase 5A)

### Definitiv Löschen

| Komponente | Zeilen | Grund |
|------------|--------|-------|
| `WizardProgress.tsx` | 89 | Overengineered, verwirrt |
| `QuickStartDialog.tsx` | 156 | Nice-to-have, nicht MVP |
| `SavingsBreakdown.tsx` | 112 | Kunden-Feature, nicht Kern |
| `PricePeriodBreakdown.tsx` | 98 | Nice-to-have |
| `PriceTimeline.tsx` | 134 | Nice-to-have |
| `LiveCalculationBar.tsx` | 87 | Ersetzt durch Sidebar |
| `SmartAdvisor.tsx` | 245 | Nie fertig |
| `SmartAdvisorBadge.tsx` | 34 | Nie fertig |
| `DensityToggle.tsx` | 45 | Overengineering |
| `CustomerSessionToggle.tsx` | 67 | In ViewModeToggle integrieren |
| `AiRecommendationsPanel.tsx` | 189 | Nie fertig |
| `UpsellRecommendationsPanel.tsx` | 156 | Nie fertig |

**Geschätzte Reduktion: ~1,400 LOC**

### Konsolidieren

| Aktuelle Komponenten | Neue Komponente | Ersparnis |
|---------------------|-----------------|-----------|
| `AnimatedCurrency.tsx` + `MarginBadge.tsx` | `PriceDisplay.tsx` | ~80 LOC |
| `ConfigurableDashboard.tsx` + 6 Widgets | `SimpleDashboard.tsx` | ~400 LOC |

---

## 📐 NEUE ARCHITEKTUR

### Layout (Desktop ≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER (48px)                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  🧮 Kalkulator                    [Kunde|Händler]  [⋮ Menü]      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────┬─────────────────────────┤
│                                               │                         │
│              HAUPTBEREICH                     │      SIDEBAR (360px)    │
│              (flex-1, scroll-y)               │      (sticky, no-scroll)│
│                                               │                         │
│  ┌─────────────────────────────────────────┐ │  ┌───────────────────┐  │
│  │ 📱 HARDWARE                             │ │  │                   │  │
│  │ [SIM Only] [iPhone] [Samsung] [Xiaomi]  │ │  │  49,99 €/Monat    │  │
│  │                                          │ │  │  ────────────────│  │
│  └─────────────────────────────────────────┘ │  │  📱 iPhone 16     │  │
│                                               │  │  📶 Prime XL (3×) │  │
│  ┌─────────────────────────────────────────┐ │  │  ────────────────│  │
│  │ 📶 MOBILFUNK                            │ │  │                   │  │
│  │ [Neu ○ VVL] [Menge: 3 ▼]                │ │  │  Marge: +127€ ✓  │  │
│  │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐│ │  │                   │  │
│  │ │Prime S│ │Prime M│ │Prime L│ │PrimeXL││ │  ├───────────────────┤  │
│  │ │ 29,99 │ │ 42,49 │ │ 49,99 │ │ 59,99 ││ │  │                   │  │
│  │ └───────┘ └───────┘ └───────┘ └───────┘│ │  │ [ HINZUFÜGEN ]    │  │
│  └─────────────────────────────────────────┘ │  │                   │  │
│                                               │  └───────────────────┘  │
│  ┌─────────────────────────────────────────┐ │                         │
│  │ 🌐 FESTNETZ (Optional)                  │ │                         │
│  │ [✓] Festnetz hinzufügen                 │ │                         │
│  │ Cable 1000 Mbit/s - 44,99€/Monat        │ │                         │
│  └─────────────────────────────────────────┘ │                         │
│                                               │                         │
└───────────────────────────────────────────────┴─────────────────────────┘
```

### Layout (Mobile <1024px)

```
┌───────────────────────────────────┐
│  Kalkulator          [👤] [⋮]    │  48px Header
├───────────────────────────────────┤
│                                   │
│  (Scrollbarer Hauptbereich)       │
│                                   │
│  ┌───────────────────────────────┐│
│  │ Hardware                      ││
│  │ [SIM Only] [iPhone ▼]         ││
│  └───────────────────────────────┘│
│                                   │
│  ┌───────────────────────────────┐│
│  │ Tarif: Prime XL               ││
│  │ Menge: [- 3 +]                ││
│  └───────────────────────────────┘│
│                                   │
│  padding-bottom: 80px             │
│                                   │
├───────────────────────────────────┤
│  49,99€   +127€  [ HINZUFÜGEN ]  │  64px Fixed Footer
└───────────────────────────────────┘
```

### Komponenten-Hierarchie

```
App
└── MainLayout
    └── Index (Calculator Route)
        └── CalculatorProvider          ← Context für alles
            └── WizardContent
                └── CalculatorShell     ← Grid-Layout
                    ├── CalculatorHeader   (48px, fixed)
                    │   ├── Title
                    │   ├── ViewModeToggle
                    │   └── ActionMenu
                    │
                    ├── MainStage          (scroll-y)
                    │   ├── HardwareSection
                    │   ├── MobileSection  
                    │   └── FixedNetSection
                    │
                    ├── SummarySidebar     (sticky, desktop only)
                    │   ├── PriceHero
                    │   ├── ConfigList
                    │   ├── MarginDisplay (dealer only)
                    │   └── AddToOfferButton
                    │
                    └── MobileFooter       (fixed bottom, mobile only)
                        ├── PriceSummary
                        ├── MarginBadge (dealer only)
                        └── AddButton
```

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

## PHASE 5B: UI/UX KOMPLETT-NEUGESTALTUNG (RESET)

### ❌ AKTUELLE PROBLEME (Audit)

| Problem | Ort | Auswirkung |
|---------|-----|------------|
| **Zu viele Boxen** | SummarySidebar | 3 große Boxen für Hardware/Tarif/Festnetz → visuelles Chaos |
| **Redundante CTAs** | Sidebar + Footer | "Zum Angebot" erscheint 2x (Desktop + Mobile) |
| **Überladener Header** | Wizard.tsx | 8+ Elemente: Progress, Badge, Toggle, Menu, DensityToggle... |
| **Accordion-Overkill** | Steps | Accordions in Accordions → verwirrend |
| **Farb-Wildwuchs** | Überall | `emerald-500`, `amber-500`, `orange-600` direkt im Code |
| **700+ LOC Wizard** | Wizard.tsx | Unmöglich zu warten |
| **620+ LOC HardwareStep** | HardwareStep.tsx | Monolith, nicht testbar |
| **Veraltete Kommentare** | SummarySidebar | "Actions moved to FloatingActionBar" (existiert nicht mehr) |
| **Unklarer Fokus** | Überall | Was ist die EINE wichtigste Aktion? |

---

### 🎯 NEUES DESIGN-PRINZIP: "BRUTAL SIMPEL"

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. EIN Preis groß sichtbar (Hero KPI)                        │
│   2. EIN primärer CTA (Zum Angebot)                            │
│   3. DREI Konfigurationsschritte (Hardware → Tarif → Festnetz) │
│   4. KEINE verschachtelten Accordions                          │
│   5. KEINE direkten Farbwerte im Code                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5B.1: NEUES LAYOUT (Desktop)

```
┌───────────────────────────────────────────────────────────────────────┐
│  HEADER (48px) - MINIMAL                                              │
│  Kalkulator              [Kunde/Händler] [⋮]                         │
├───────────────────────────────────────────────┬───────────────────────┤
│                                               │                       │
│              HAUPTBEREICH                     │     SIDEBAR           │
│              (Scrollbar)                      │     (Fixed 360px)     │
│                                               │                       │
│  ┌─────────────────────────────────────────┐ │  ╔═══════════════════╗│
│  │ SCHRITT 1: HARDWARE                     │ │  ║  49,99 €/Monat   ║│
│  │ [Ohne Gerät] [iPhone 16] [Galaxy S25]   │ │  ║  ────────────────║│
│  │                                          │ │  ║  iPhone 16 Pro   ║│
│  └─────────────────────────────────────────┘ │  ║  Prime XL (3×)   ║│
│                                               │  ║  ────────────────║│
│  ┌─────────────────────────────────────────┐ │  ║  Marge: +127€ ✓  ║│
│  │ SCHRITT 2: MOBILFUNK                    │ │  ╠═══════════════════╣│
│  │ [Neu/VVL] [Menge: 1]                    │ │  ║                   ║│
│  │ ┌───────┐ ┌───────┐ ┌───────┐          │ │  ║  [ HINZUFÜGEN ]   ║│
│  │ │Prime S│ │Prime M│ │Prime L│          │ │  ║                   ║│
│  │ │  29€  │ │  42€  │ │  49€  │          │ │  ╚═══════════════════╝│
│  │ └───────┘ └───────┘ └───────┘          │ │                       │
│  └─────────────────────────────────────────┘ │                       │
│                                               │                       │
│  ┌─────────────────────────────────────────┐ │                       │
│  │ SCHRITT 3: FESTNETZ (Optional)          │ │                       │
│  │ [  ] Festnetz hinzufügen                │ │                       │
│  └─────────────────────────────────────────┘ │                       │
│                                               │                       │
└───────────────────────────────────────────────┴───────────────────────┘
```

---

### 5B.2: NEUES LAYOUT (Mobile)

```
┌─────────────────────────────────────┐
│  HEADER (48px)                      │
│  Kalkulator         [👤] [⋮]       │
├─────────────────────────────────────┤
│                                     │
│  HAUPTBEREICH (Scrollbar)           │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Hardware                        ││
│  │ [Ohne Gerät] [Mit Gerät ▼]      ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Tarif auswählen                 ││
│  │ ┌─────┐ ┌─────┐ ┌─────┐        ││
│  │ │S 29€│ │M 42€│ │L 49€│        ││
│  │ └─────┘ └─────┘ └─────┘        ││
│  └─────────────────────────────────┘│
│                                     │
│  (... scroll ...)                   │
│                                     │
├─────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│  49,99€  +127€   [ HINZUFÜGEN ]    │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└─────────────────────────────────────┘
```

---

### 5B.3: KOMPONENTEN-RESET

**LÖSCHEN:**
- `WizardProgress.tsx` — unnötige Komplexität
- `SavingsBreakdown.tsx` — Kunden-Feature, nicht Kern
- `PricePeriodBreakdown.tsx` — Nice-to-have, nicht MVP
- `PriceTimeline.tsx` — Nice-to-have
- `QuickStartDialog.tsx` — Verwirrt mehr als hilft
- `DensityToggle.tsx` — Overengineering
- `CustomerSessionToggle.tsx` — Kann in ViewModeToggle integriert werden

**BEHALTEN & VEREINFACHEN:**
- `SummarySidebar.tsx` → Komplett neu (< 150 LOC)
- `MobileActionFooter.tsx` → Komplett neu (< 80 LOC)
- `ViewModeToggle.tsx` → Vereinfachen
- `ActionMenu.tsx` → Vereinfachen

**NEU ERSTELLEN:**
- `CalculatorHeader.tsx` — Minimaler Header (< 60 LOC)
- `ConfigSummary.tsx` — Zeigt aktuelle Auswahl (< 50 LOC)
- `PriceDisplay.tsx` — Hero-Preis-Komponente (< 40 LOC)

---

### 5B.4: DESIGN TOKENS (Vereinfacht)

```css
/* index.css - NUR diese Tokens verwenden */
:root {
  /* Status */
  --status-success: 142 71% 45%;
  --status-warning: 38 92% 50%;
  --status-error: 0 84% 60%;
  
  /* Marge-Farben */
  --margin-positive: var(--status-success);
  --margin-warning: var(--status-warning);
  --margin-negative: var(--status-error);
}
```

**VERBOT:** Keine `emerald-500`, `amber-500`, `orange-600` etc. im Code!

---

### 5B.5: SIDEBAR NEU (< 150 LOC)

```typescript
// SummarySidebar.tsx - KOMPLETT NEU
export function SummarySidebar() {
  const { option1, result1, effectiveViewMode, quantityBonusForOption1 } = useCalculator();
  const { addItem, items } = useOfferBasket();
  const visibility = useSensitiveFieldsVisible(effectiveViewMode);
  
  const hasTariff = !!option1.mobile.tariffId;
  const avgMonthly = result1?.totals.avgTermNet ?? 0;
  const margin = (result1?.dealer.margin ?? 0) + quantityBonusForOption1;
  
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* HERO PREIS */}
      <div className="p-6 text-center border-b border-border">
        <p className="text-sm text-muted-foreground mb-1">Ø Monatlich</p>
        <p className="text-4xl font-bold tabular-nums">
          {avgMonthly.toFixed(2)} €
        </p>
      </div>
      
      {/* KONFIGURATION */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        <ConfigLine icon={Smartphone} label={option1.hardware.name || "SIM Only"} />
        <ConfigLine icon={Signal} label={option1.mobile.tariffId || "Kein Tarif"} />
        {option1.fixedNet.enabled && (
          <ConfigLine icon={Wifi} label="Festnetz aktiv" />
        )}
      </div>
      
      {/* DEALER SECTION (Conditional) */}
      {visibility.showDealerEconomics && (
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex justify-between items-center">
            <span className="text-sm">Marge</span>
            <MarginBadge margin={margin} />
          </div>
        </div>
      )}
      
      {/* CTA (Always visible) */}
      <div className="p-4 border-t border-border">
        <Button
          size="lg"
          onClick={() => handleAdd()}
          disabled={!hasTariff}
          className="w-full"
        >
          <Plus className="w-5 h-5 mr-2" />
          Zum Angebot
        </Button>
      </div>
    </div>
  );
}
```

---

### 5B.6: MOBILE FOOTER NEU (< 80 LOC)

```typescript
// MobileActionFooter.tsx - KOMPLETT NEU
export function MobileActionFooter() {
  const { option1, result1, effectiveViewMode, quantityBonusForOption1 } = useCalculator();
  const { addItem } = useOfferBasket();
  const visibility = useSensitiveFieldsVisible(effectiveViewMode);
  
  const hasTariff = !!option1.mobile.tariffId;
  const avgMonthly = result1?.totals.avgTermNet ?? 0;
  const margin = (result1?.dealer.margin ?? 0) + quantityBonusForOption1;
  
  if (!hasTariff) return null;
  
  return (
    <div className="h-16 bg-card border-t border-border px-4 flex items-center gap-4">
      {/* Preis */}
      <div className="flex-1">
        <p className="text-lg font-bold tabular-nums">{avgMonthly.toFixed(2)} €</p>
        <p className="text-xs text-muted-foreground">Ø/Monat</p>
      </div>
      
      {/* Marge (Conditional) */}
      {visibility.showDealerEconomics && (
        <MarginBadge margin={margin} size="sm" />
      )}
      
      {/* CTA */}
      <Button size="default" onClick={() => handleAdd()}>
        <Plus className="w-4 h-4 mr-1" />
        Hinzufügen
      </Button>
    </div>
  );
}
```

---

### 5B.7: WIZARD NEU (< 400 LOC)

**Aktuelle Wizard.tsx: 700 LOC → Ziel: < 400 LOC**

**Entfernen:**
- QuickStartDialog Integration
- WizardRestoreDialog Integration  
- OnboardingTour Integration
- DensityToggle
- WizardProgress (8+ Props)
- CustomerSessionToggle
- Demo-Mode Banner
- GigaKombi Toast Logic

**Behalten:**
- CalculatorProvider Wrapper
- CalculatorShell Layout
- Accordion Steps
- SummarySidebar (Context-basiert)
- MobileActionFooter (Context-basiert)

---

### 5B.8: HEADER NEU (< 60 LOC)

```typescript
// CalculatorHeader.tsx - MINIMAL
export function CalculatorHeader() {
  const { effectiveViewMode, setViewMode } = useCalculator();
  
  return (
    <header className="h-12 bg-card border-b border-border px-4 flex items-center justify-between">
      <h1 className="text-lg font-semibold">Kalkulator</h1>
      
      <div className="flex items-center gap-2">
        <ViewModeToggle 
          value={effectiveViewMode} 
          onChange={setViewMode}
        />
        <ActionMenu />
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
