
# PHASE 4: BUSINESS-LOGIK MIGRATION IN DEN CONTEXT ✅ COMPLETE

## Status: ✅ Implemented

Phase 4 wurde erfolgreich abgeschlossen. Die Business-Logik (Bonusse, Berechnungen) wurde vom `WizardContent` in den `CalculatorContext` migriert.

---

## Änderungen

### CalculatorContext.tsx (Erweitert)
- **Business Hooks:** `useEmployeeSettings`, `usePushProvisions`, `useQuantityBonus` importiert
- **Neue State-Felder:**
  - `employeeSettings` - Provision-Abzug Konfiguration
  - `activeQuantityBonusTier` - Aktiver Mengen-Bonus-Tier
  - `quantityBonusForOption1/2` - Berechnete Quantity-Boni
  - `pushBonusForOption1/2` - Berechnete Push-Boni
- **Injection Pattern:** `basketQuantity` Prop für zirkuläre Abhängigkeits-Vermeidung
- **Vollständige Berechnung:** `result1`/`result2` enthalten jetzt alle Boni

### Wizard.tsx (Vereinfacht)
- **Entfernt:** ~70 Zeilen Business-Logik (employeeOptions, buildPushContext, bonus calculations)
- **Entfernt:** Imports für `useEmployeeSettings`, `usePushProvisions`, `useQuantityBonus`
- **Root Export:** Berechnet `basketQuantity` und injiziert in `CalculatorProvider`
- **WizardContent:** Nutzt `result1`, `result2`, `quantityBonusForOption1` direkt aus Context

---

## Architektur nach Phase 4

```text
┌─────────────────────────────────────────────────────────────┐
│ Wizard (Root)                                               │
│  └─ Berechnet basketQuantity aus useOfferBasket            │
│     └─ <CalculatorProvider basketQuantity={...}>           │
│          └─ WizardContent (Pure UI Orchestrator)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CalculatorContext (State + Business Logic)                  │
├─────────────────────────────────────────────────────────────┤
│ • option1, option2, activeSection, viewMode                 │
│ • employeeSettings, activeQuantityBonusTier                 │
│ • quantityBonusForOption1/2, pushBonusForOption1/2          │
│ • result1, result2 (VOLLSTÄNDIG mit allen Boni!)           │
│ • goToSection, updateOption1, setViewMode, etc.             │
└─────────────────────────────────────────────────────────────┘
```

---

## Code-Metriken (Tatsächlich)

| Datei | Vorher | Nachher | Delta |
|-------|--------|---------|-------|
| `CalculatorContext.tsx` | 347 | ~400 | +53 |
| `Wizard.tsx` | 775 | ~530 | -245 |
| **NETTO** | 1122 | ~930 | **-192** |

---

## Nächste Schritte (Optional)

### Phase 5: SummarySidebar & MobileActionFooter Context-Migration
- Sidebar direkt auf `useCalculator()` umstellen (Props entfernen)
- MobileActionFooter analog
- Weitere ~50 Zeilen Props-Drilling entfernen

### Phase 6: Weitere Optimierungen
- Auto-Save Logic in Context verschieben
- Onboarding Tour in separaten Context
- Performance-Monitoring einbauen
