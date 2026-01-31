
# PHASE 4: BUSINESS-LOGIK MIGRATION IN DEN CONTEXT

## Übersicht

Phase 3 hat die Architektur etabliert, aber die "Intelligenz" (Berechnungen mit Bonussen) liegt noch im `WizardContent`. Phase 4 vervollständigt die Migration, sodass:
1. `result1`/`result2` aus dem Context **komplett** sind (inkl. aller Boni)
2. `WizardContent` zum reinen "UI-Orchestrator" wird (~50% Code-Reduktion)
3. `SummarySidebar` und `MobileActionFooter` den Context direkt nutzen können

---

## Ist-Zustand Analyse

### Aktuell in WizardContent (Zeilen 113-354):

```text
┌─────────────────────────────────────────────────────────────┐
│ WIZARDCONTENT - Business Logic (~240 Zeilen)               │
├─────────────────────────────────────────────────────────────┤
│ Hooks:                                                      │
│  • useEmployeeSettings → employeeSettings                   │
│  • usePushProvisions → getBonusAmount                       │
│  • useQuantityBonus → getBonusForQuantity, tiers            │
│  • useOfferBasket → basketItems (für Quantity)              │
├─────────────────────────────────────────────────────────────┤
│ Berechnungen:                                               │
│  • employeeOptions (memoized)                               │
│  • buildPushContext (callback)                              │
│  • totalQuantityInBasket (from basket)                      │
│  • activeQuantityBonusTier (memoized)                       │
│  • quantityBonusForOption1/2 (memoized)                     │
│  • result1 = calculateOffer(option1, {...ALL BONUSES...})   │
│  • result2 = calculateOffer(option2, {...ALL BONUSES...})   │
└─────────────────────────────────────────────────────────────┘
```

### Aktuell im CalculatorContext (unvollständig):

```typescript
// Zeilen 184-201 - OHNE Bonusse!
const result1 = useMemo(() => {
  return calculateOffer(option1); // ← Keine Boni!
}, [option1]);
```

---

## Migrations-Strategie

### Kritisches Problem: Zirkuläre Abhängigkeit

Der Warenkorb (`useOfferBasket`) beeinflusst die Mengen-Bonus-Berechnung:

```text
totalQuantityForBonus = basketItems.reduce(...) + option1.mobile.quantity
```

**Risiko:** Wenn der Context `useOfferBasket` importiert, entsteht eine zirkuläre Abhängigkeit:
```
CalculatorContext → useOfferBasket → (nutzt evtl. Context?) → CalculatorContext
```

**Lösung:** "Injection Pattern" - Basket-Daten werden von außen in den Context injiziert:

```typescript
<CalculatorProvider basketQuantity={totalQuantityInBasket}>
  <WizardContent />
</CalculatorProvider>
```

---

## Implementierungsplan

### SCHRITT 4.1: Context Interface erweitern

Neue State-Felder im `CalculatorContext`:

```typescript
interface CalculatorState {
  // ... bestehende Felder ...
  
  // === BONUS CONFIGURATION ===
  /** Geladene Employee Settings (Provision-Abzug) */
  employeeSettings: EmployeeSettings | null;
  
  /** Aktiver Mengen-Bonus-Tier */
  activeQuantityBonusTier: QuantityBonusTier | null;
  
  /** Berechneter Quantity-Bonus für Option 1 */
  quantityBonusForOption1: number;
  
  /** Berechneter Quantity-Bonus für Option 2 */
  quantityBonusForOption2: number;
  
  /** Push-Bonus für Option 1 */
  pushBonusForOption1: number;
  
  /** Push-Bonus für Option 2 */
  pushBonusForOption2: number;
  
  // === RESULTS (JETZT KOMPLETT!) ===
  result1: CalculationResult | null;  // Mit allen Bonussen
  result2: CalculationResult | null;  // Mit allen Bonussen
}
```

### SCHRITT 4.2: Provider Props erweitern

```typescript
interface CalculatorProviderProps {
  children: ReactNode;
  defaultViewMode?: ViewMode;
  /** Injizierte Basket-Quantity für Mengen-Bonus */
  basketQuantity?: number;
}
```

### SCHRITT 4.3: Business Hooks in den Context verschieben

Der `CalculatorProvider` importiert und nutzt:

```typescript
export function CalculatorProvider({
  children,
  defaultViewMode = "dealer",
  basketQuantity = 0,
}: CalculatorProviderProps) {
  // === BUSINESS HOOKS (NEU im Context) ===
  const { settings: employeeSettings } = useEmployeeSettings();
  const { getBonusAmount } = usePushProvisions();
  const { getBonusForQuantity, calculateStackedBonus } = useQuantityBonus();
  
  // ... bestehender State ...
  
  // === EMPLOYEE OPTIONS ===
  const employeeOptions = useMemo(() => ({
    employeeDeduction: employeeSettings
      ? {
          deductionValue: employeeSettings.provisionDeduction ?? 0,
          deductionType: employeeSettings.provisionDeductionType ?? "fixed",
        }
      : null,
  }), [employeeSettings]);
  
  // === QUANTITY BONUS CALCULATION ===
  const totalQuantityForBonus = basketQuantity + option1.mobile.quantity;
  
  const activeQuantityBonusTier = useMemo(() => {
    return getBonusForQuantity(totalQuantityForBonus);
  }, [getBonusForQuantity, totalQuantityForBonus]);
  
  const quantityBonusForOption1 = useMemo(() => {
    if (!activeQuantityBonusTier) return 0;
    return activeQuantityBonusTier.bonusPerContract * option1.mobile.quantity;
  }, [activeQuantityBonusTier, option1.mobile.quantity]);
  
  // === PUSH BONUS CALCULATION ===
  const buildPushContext = useCallback((option: OfferOptionState) => ({
    hasHardware: option.hardware.ekNet > 0,
    hardwareEkNet: option.hardware.ekNet,
    hasFixedNet: option.fixedNet.enabled,
    hasGigaKombi: option.fixedNet.enabled && 
                  option.mobile.tariffId.toLowerCase().includes("prime"),
    subVariantId: option.mobile.subVariantId,
    quantity: option.mobile.quantity,
    contractType: option.mobile.contractType,
  }), []);
  
  const pushBonusForOption1 = useMemo(() => {
    const context = buildPushContext(option1);
    return getBonusAmount(option1.mobile.tariffId, option1.mobile.contractType, 0, context);
  }, [option1, getBonusAmount, buildPushContext]);
  
  // === FULL RESULT CALCULATION ===
  const result1 = useMemo(() => {
    try {
      return calculateOffer(option1, {
        ...employeeOptions,
        pushBonus: pushBonusForOption1,
        quantityBonus: quantityBonusForOption1,
        quantityBonusTierName: activeQuantityBonusTier?.name,
      });
    } catch (err) {
      console.warn("[CalculatorContext] result1 calculation failed:", err);
      return null;
    }
  }, [option1, employeeOptions, pushBonusForOption1, quantityBonusForOption1, activeQuantityBonusTier]);
  
  // ... analog für result2 ...
}
```

### SCHRITT 4.4: WizardContent vereinfachen

**Vorher (~240 Zeilen Business-Logik):**
```typescript
function WizardContent() {
  // Hole aus Context
  const { option1, result1, ... } = useCalculator();
  
  // ENTFERNEN: Diese kommen jetzt aus dem Context
  // const { settings: employeeSettings } = useEmployeeSettings();
  // const { getBonusAmount } = usePushProvisions();
  // const { getBonusForQuantity } = useQuantityBonus();
  // const employeeOptions = useMemo(...);
  // const result1 = useMemo(...);
  
  // NUR Basket für Injection
  const { items: basketItems } = useOfferBasket();
  const totalQuantityInBasket = basketItems.reduce(
    (sum, item) => sum + (item.option.mobile.quantity || 1), 0
  );
  
  // ... UI-Rendering ...
}

// ROOT mit Injection
export function Wizard() {
  const { items: basketItems } = useOfferBasket();
  const basketQuantity = basketItems.reduce(
    (sum, item) => sum + (item.option.mobile.quantity || 1), 0
  );
  
  return (
    <CalculatorProvider basketQuantity={basketQuantity}>
      <WizardContent />
    </CalculatorProvider>
  );
}
```

### SCHRITT 4.5: SummarySidebar & MobileActionFooter vereinfachen (Optional)

Nach der Migration können diese Komponenten:

**Option A (Konservativ):** Props-Pattern beibehalten (kein Änderung)

**Option B (Modern):** Context direkt nutzen:

```typescript
export function SummarySidebar() {
  const { 
    option1, 
    result1, 
    effectiveViewMode, 
    quantityBonusForOption1 
  } = useCalculator();
  
  // Keine Props mehr nötig!
  // ...
}
```

**Empfehlung:** Option A (Konservativ) für Phase 4, Option B als Phase 5.

---

## Risiko-Matrix

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| Zirkuläre Abhängigkeit | Hoch | Injection Pattern für Basket |
| Hook-Reihenfolge-Fehler | Mittel | Hooks am Anfang des Providers |
| Performance-Regression | Niedrig | useMemo für alle Berechnungen |
| Breaking Props | Niedrig | SummarySidebar Props bleiben |

---

## Code-Metriken (Geschätzt)

| Datei | Vorher | Nachher | Delta |
|-------|--------|---------|-------|
| `CalculatorContext.tsx` | 347 | ~500 | +153 |
| `Wizard.tsx (WizardContent)` | 775 | ~550 | -225 |
| **NETTO** | 1122 | ~1050 | **-72** |

Die Netto-Reduktion ist gering, aber die **Separation of Concerns** ist deutlich besser:
- Context = Berechnung + State
- WizardContent = UI + Navigation

---

## Validierung nach Implementation

1. **Build Check:** `npm run build` muss grün sein
2. **Funktionstest:**
   - Tarif wählen → Preis in Sidebar korrekt
   - Quantity ändern → Bonus aktualisiert sich
   - Hardware hinzufügen → Push-Bonus aktiv
   - POS-Mode → Dealer-Daten versteckt
3. **Konsolen-Check:** Keine Warnings von `[CalculatorContext]`

---

## Dateiänderungen

| Datei | Aktion |
|-------|--------|
| `src/margenkalkulator/context/CalculatorContext.tsx` | ERWEITERN |
| `src/margenkalkulator/ui/Wizard.tsx` | VEREINFACHEN |
| `src/margenkalkulator/ui/components/SummarySidebar.tsx` | UNVERÄNDERT (Phase 4) |
| `src/margenkalkulator/ui/components/MobileActionFooter.tsx` | UNVERÄNDERT (Phase 4) |

---

## Nächste Schritte nach Phase 4

**Phase 5 (Optional):**
- SummarySidebar auf Context umstellen (Props entfernen)
- MobileActionFooter auf Context umstellen
- Weitere UI-Vereinfachungen

**Phase 6 (Optimierung):**
- Auto-Save Logic in Context verschieben
- Onboarding Tour in separaten Context
- Performance-Monitoring einbauen
