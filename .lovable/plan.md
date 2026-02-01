

# PHASE 5-7: AKTUELLER STATUS & NÄCHSTE SCHRITTE

## ✅ ABGESCHLOSSEN (Verifiziert)

### Phase 5A: Context-Finalisierung ✅
| Komponente | Status | Verifiziert |
|------------|--------|-------------|
| `SummarySidebar.tsx` | ✅ | Verwendet `useCalculator()`, Props reduziert |
| `MobileActionFooter.tsx` | ✅ | Verwendet `useCalculator()` |
| `Wizard.tsx` | ✅ | Vereinfachte Prop-Übergabe |

### Phase 5B Teil 1: Semantic Design Tokens ✅
- `--status-success/warning/error` in index.css ✅
- `--margin-positive/neutral/negative` in index.css ✅
- Utility-Klassen vorhanden ✅

### Phase 5B Teil 2: Header-Reduzierung ✅
- `ModeSelector.tsx` erstellt (154 LOC) ✅
- Kombiniert ViewMode + CustomerSession in einem Dropdown ✅
- Header auf `[Modus ▾] [⋮]` reduziert ✅

### Phase 5C Teil 1+2: Komponenten-Löschung ✅
**~13 Komponenten gelöscht (~2.100 LOC entfernt):**
- ✅ WizardProgress, QuickStartDialog, SmartAdvisor, SmartAdvisorBadge
- ✅ AiConsultant, AiRecommendationsPanel, PriceTimeline, SavingsBreakdown
- ✅ ConfigurableDashboard, SortableWidget, DensityToggle, WelcomeWidget

---

## ❌ NOCH OFFEN

### Phase 5B Teil 3: Sidebar Redesign (~2h)
**Aktueller Zustand:**
```text
SummarySidebar.tsx: 432 LOC (Ziel: ~150 LOC)
```

**Problem:** Zu viele Elemente, 3 separate Boxed-Cards für Hardware/Mobilfunk/Festnetz

**Offene Aufgaben:**
1. `CompactConfigSummary.tsx` erstellen (Hero KPI Pattern)
2. Sidebar auf Kern-Elemente komprimieren:
   - Hero-Preis (48px Font)
   - Kompakte Konfig-Zusammenfassung (1 Zeile)
   - Marge mit Progress Bar
   - Primärer CTA

### Phase 5C Teil 3: Konsolidierung (~30min)
| Von | Nach | Status |
|-----|------|--------|
| `AnimatedCurrency.tsx` + `MarginBadge.tsx` | `PriceDisplay.tsx` | ❌ Ausstehend |
| `ViewModeToggle.tsx` | Kann entfernt werden | 🟡 Noch von GlobalControls.tsx verwendet |
| `CustomerSessionToggle.tsx` | Kann entfernt werden | 🟡 Noch vorhanden |

### Phase 6: Step-Modularisierung (~4h)
| Datei | Aktuell | Ziel | Status |
|-------|---------|------|--------|
| `HardwareStep.tsx` | **621 LOC** | 200 LOC | ❌ Monolithisch |
| `MobileStep.tsx` | ~500 LOC | 150 LOC | ❌ Monolithisch |

**Geplante Struktur:**
```text
src/margenkalkulator/ui/steps/hardware/
├── HardwareGrid.tsx       ← Karten-Grid
├── HardwareCard.tsx       ← Einzelne Karte
├── HardwareFilters.tsx    ← Brand/Category Filter
├── HardwareSearch.tsx     ← Suchfeld
└── index.tsx              ← Orchestrator

src/margenkalkulator/ui/steps/mobile/
├── TariffGrid.tsx
├── TariffCard.tsx
├── ContractTypeSelector.tsx
├── QuantitySelector.tsx
└── index.tsx
```

### Phase 7: Polish & Accessibility (~2h)
- ❌ Hardcodierte Farben migrieren (`text-amber-500` → semantic tokens)
- ❌ Button Event-Bubbling systematisch prüfen
- ❌ A11y: Focus-Management, ARIA-Labels

---

## METRIKEN-FORTSCHRITT

| Metrik | Vorher | Aktuell | Ziel | Status |
|--------|--------|---------|------|--------|
| Gelöschte Komponenten | 0 | ~13 | ~12 | ✅ |
| `SummarySidebar.tsx` LOC | 419 | 432 | 150 | ❌ |
| `HardwareStep.tsx` LOC | 621 | 621 | 200 | ❌ |
| Header-Elemente | 8+ | 2 | 2-3 | ✅ |
| Semantic Tokens | ❌ | ✅ | ✅ | ✅ |

---

## EMPFOHLENE NÄCHSTE SCHRITTE

### Option A: Sidebar-First (Visueller Impact)
1. **Phase 5B Teil 3**: Sidebar Redesign (~2h)
   - CompactConfigSummary.tsx erstellen
   - SummarySidebar.tsx von 432 → ~150 LOC reduzieren
2. **Phase 5C Teil 3**: Konsolidierung (~30min)
   - AnimatedCurrency + MarginBadge → PriceDisplay
3. **Phase 6**: Step-Modularisierung (~4h)
4. **Phase 7**: Polish (~2h)

### Option B: Modularisierung-First (Technische Schulden)
1. **Phase 6**: Step-Modularisierung (~4h)
   - HardwareStep aufteilen
   - MobileStep aufteilen
2. **Phase 5B Teil 3**: Sidebar Redesign (~2h)
3. **Phase 5C Teil 3**: Konsolidierung (~30min)
4. **Phase 7**: Polish (~2h)

---

## GESCHÄTZTE RESTZEIT

| Phase | Aufwand |
|-------|---------|
| 5B Teil 3 (Sidebar) | ~2h |
| 5C Teil 3 (Konsolidierung) | ~30min |
| 6 (Modularisierung) | ~4h |
| 7 (Polish & A11y) | ~2h |
| **TOTAL** | **~8.5h** |

