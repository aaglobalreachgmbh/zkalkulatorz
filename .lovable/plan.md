
# PHASE 3: MIGRATION & ADAPTER STRATEGY

## Analyse-Ergebnis

### Step-Props-Matrix (Kritisch für Adapter)

| Step | Pflicht-Props | Optional | Source |
|------|---------------|----------|--------|
| **HardwareStep** | `value`, `onChange` | `onHardwareSelected`, `datasetVersion`, `viewMode` | Zeilen 36-42 |
| **MobileStep** | `value`, `onChange`, `datasetVersion` | `fixedNetEnabled`, `hardwareName`, `viewMode`, `fullOption`, `result`, `quantityBonus`, `onConfigComplete`, `onMetaUpdate` | Zeilen 32-49 |
| **FixedNetStep** | `value`, `onChange`, `datasetVersion` | `onFixedNetEnabled` | Zeilen 24-29 |

### Kritische Erkenntnis: CalculatorContext Lücke

Der aktuelle `CalculatorContext` berechnet `result1` nur mit `calculateOffer(option1)`, aber der alte Wizard nutzt zusätzliche Parameter:

```typescript
// Alter Wizard (Zeilen 314-323):
const result1 = useMemo(() => {
  const context = buildPushContext(option1);
  const pushBonus = getBonusAmount(...);
  return calculateOffer(option1, {
    ...employeeOptions,
    pushBonus,
    quantityBonus: quantityBonusForOption1,
    quantityBonusTierName: activeQuantityBonusTier?.name,
  });
}, [...]);
```

**Entscheidung:** Wir behalten diese komplexe Logik temporär in `WizardContent` und erweitern den Context später (Phase 4). Dies minimiert das Migrationsrisiko.

---

## MIGRATIONS-PLAN

### SCHRITT 3.1: MobileActionFooter erstellen

**Neue Datei:** `src/margenkalkulator/ui/components/MobileActionFooter.tsx`

**Zweck:** Ersetzt `FloatingActionBar` für Mobile-Viewports

**Interface:**
```typescript
interface MobileActionFooterProps {
  option: OfferOptionState;
  result: CalculationResult | null;
  viewMode: ViewMode;
  quantityBonus?: number;
  onResetForNewTariff?: () => void;
}
```

**Logik:**
- Zeigt Ø-Monatspreis links
- "Zum Angebot" Button rechts (aus `useOfferBasket`)
- Rendert `null` wenn kein Tarif gewählt
- Kompaktes Layout für 44px Footer-Höhe

---

### SCHRITT 3.2: SummarySidebar Refactor (Minimal)

**Problem:** SummarySidebar hat bereits eigene Props, nutzt aber noch kein Context.

**Entscheidung:** KEIN Refactor in dieser Phase.

Die Sidebar funktioniert mit Props und das aktuelle Wizard-Mapping funktioniert. Wir riskieren keine Breaking Changes an einer funktionierenden Komponente.

**Begründung:** Der Wizard reicht die Props weiterhin durch (Adapter-Pattern). Context-Migration der Sidebar ist ein separates Ticket (Phase 4).

---

### SCHRITT 3.3: Wizard Transformation

**Strategie:** "Hybrid-Wizard" - nutzt CalculatorProvider als Shell, behält aber komplexe Berechnungslogik intern.

**Neue Struktur:**

```typescript
// Wizard.tsx - NEUER AUFBAU

export function Wizard() {
  return (
    <CalculatorProvider>
      <WizardContent />
    </CalculatorProvider>
  );
}

function WizardContent() {
  // 1. Hole Navigation/UI State aus Context
  const { 
    activeSection, goToSection,
    option1, setOption1, updateOption1,
    option2, setOption2, updateOption2,
    activeOption, setActiveOption,
    viewMode, setViewMode, effectiveViewMode, canShowDealerData,
    fixedNetModuleEnabled,
    showQuickStart, setShowQuickStart,
    showRestoreDialog, setShowRestoreDialog,
  } = useCalculator();
  
  // 2. BEHALTE komplexe Business-Logik hier (nicht im Context)
  const { settings: employeeSettings } = useEmployeeSettings();
  const { getBonusAmount } = usePushProvisions();
  const { getBonusForQuantity, calculateTotalBonus } = useQuantityBonus();
  const { items: basketItems } = useOfferBasket();
  
  // 3. Berechne Results MIT allen Bonussen (wie vorher)
  const employeeOptions = useMemo(() => ({...}), [employeeSettings]);
  const result1 = useMemo(() => {
    return calculateOffer(option1, { ...employeeOptions, pushBonus, quantityBonus });
  }, [...]);
  
  // 4. Render mit CalculatorShell
  return (
    <CalculatorShell
      sidebar={<SummarySidebar option={option1} result={result1} ... />}
      mobileFooter={<MobileActionFooter option={option1} result={result1} ... />}
      headerActions={<ViewModeToggle ... />}
    >
      <Accordion ...>
        <HardwareStep 
          value={option1.hardware} 
          onChange={(hw) => updateOption1(prev => ({...prev, hardware: hw}))}
          viewMode={effectiveViewMode}
          onHardwareSelected={() => goToSection("mobile")}
        />
        <MobileStep 
          value={option1.mobile}
          onChange={(mobile) => updateOption1(prev => ({...prev, mobile}))}
          datasetVersion={option1.meta.datasetVersion}
          fullOption={option1}
          result={result1}
          viewMode={effectiveViewMode}
          ...
        />
        ...
      </Accordion>
    </CalculatorShell>
  );
}
```

**Was bleibt im WizardContent:**
- `useEmployeeSettings`, `usePushProvisions`, `useQuantityBonus` Hooks
- Komplette `result1`/`result2` Berechnung mit allen Bonussen
- Auto-Save Logik (`useWizardAutoSave`)
- Onboarding Tour (`useOnboardingTour`)
- Bundle/Template Loading aus Router State
- GigaKombi Toast Logic

**Was kommt aus dem Context:**
- `activeSection`, `goToSection`
- `option1`, `option2`, `setOption1`, `setOption2`, `updateOption1`, `updateOption2`
- `viewMode`, `effectiveViewMode`, `canShowDealerData`
- `showQuickStart`, `showRestoreDialog`
- Feature Flags

---

### SCHRITT 3.4: Cleanup - Alte Bars löschen

Nach erfolgreicher Migration:

| Datei | Aktion |
|-------|--------|
| `src/margenkalkulator/ui/components/StickyPriceBar.tsx` | LÖSCHEN |
| `src/margenkalkulator/ui/components/FloatingActionBar.tsx` | LÖSCHEN |
| `src/margenkalkulator/ui/components/AddToOfferButton.tsx` | LÖSCHEN |

---

## Technische Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| TypeScript-Fehler bei Step-Props | Hoch | Exaktes Mapping aus Analyse |
| Fehlende Berechnungslogik | Mittel | Business-Logik bleibt in WizardContent |
| Layout-Bruch durch Shell | Mittel | Zero-Scroll CSS bereits implementiert |
| Mobile Footer nicht sichtbar | Niedrig | lg:hidden Klasse getestet |

---

## Validierung nach Migration

1. **Build Check:** `npm run build` muss grün sein
2. **Visual Check:** 
   - Desktop: Sidebar rechts sichtbar mit "Zum Angebot" Button
   - Mobile: Footer unten sichtbar mit Preis + Button
3. **Funktionstest:**
   - Hardware wählen → Mobile öffnet sich
   - Tarif wählen → Preis in Sidebar/Footer aktualisiert
   - "Zum Angebot" → Item erscheint im Basket
4. **Security Check:** Im Customer-Mode keine EK/Marge sichtbar

---

## Geschätzte LOC-Änderungen

| Datei | Vorher | Nachher | Delta |
|-------|--------|---------|-------|
| `Wizard.tsx` | 823 | ~550 | -273 |
| `MobileActionFooter.tsx` | 0 | ~120 | +120 |
| `StickyPriceBar.tsx` | 180 | 0 | -180 |
| `FloatingActionBar.tsx` | 188 | 0 | -188 |
| `AddToOfferButton.tsx` | 81 | 0 | -81 |
| **TOTAL** | 1272 | ~670 | **-602** |

Netto-Reduktion: ~47% weniger Code in den betroffenen Dateien.

---

## Ausführungs-Reihenfolge

1. **3.1** MobileActionFooter.tsx erstellen
2. **3.3** Wizard.tsx transformieren (KRITISCH - größte Änderung)
3. **Build Check** - Stopp bei Fehler!
4. **3.4** Alte Bars löschen (nur wenn Build OK)
5. **Final Build Check**
