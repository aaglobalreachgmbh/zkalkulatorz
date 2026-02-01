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

### Phase 5B Teil 3: Sidebar Redesign ✅ (2026-02-01)
- `CompactConfigSummary.tsx` erstellt (~70 LOC) ✅
- `MarginProgressBar.tsx` erstellt (~60 LOC) ✅
- `SummarySidebar.tsx`: 432 → 220 LOC ✅
- Hero KPI Pattern implementiert ✅
- Semantic Tokens in formatters.ts migriert ✅

### Phase 5C Teil 1+2: Komponenten-Löschung ✅
**~13 Komponenten gelöscht (~2.100 LOC entfernt):**
- ✅ WizardProgress, QuickStartDialog, SmartAdvisor, SmartAdvisorBadge
- ✅ AiConsultant, AiRecommendationsPanel, PriceTimeline, SavingsBreakdown
- ✅ ConfigurableDashboard, SortableWidget, DensityToggle, WelcomeWidget

### Phase 5C Teil 3: Konsolidierung ✅ (2026-02-01)
- `ViewModeToggle.tsx` gelöscht (durch ModeSelector ersetzt) ✅
- `CustomerSessionToggle.tsx` gelöscht (ungenutzt) ✅
- `GlobalControls.tsx` gelöscht (ungenutzt) ✅

---

## ❌ NOCH OFFEN

### Phase 6: Step-Modularisierung (~4h)
| Datei | Aktuell | Ziel | Status |
|-----|------|--------|
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
| `SummarySidebar.tsx` LOC | 419 | 220 | 150 | 🟡 |
| `HardwareStep.tsx` LOC | 621 | 621 | 200 | ❌ |
| Header-Elemente | 8+ | 2 | 2-3 | ✅ |
| Semantic Tokens | ❌ | ✅ | ✅ | ✅ |

---

## NÄCHSTE SCHRITTE

1. **Phase 6**: Step-Modularisierung (~4h)
   - HardwareStep.tsx aufteilen (621 → 200 LOC)
   - MobileStep.tsx aufteilen (~500 → 150 LOC)
2. **Phase 7**: Polish (~2h)

---

## GESCHÄTZTE RESTZEIT

| Phase | Aufwand |
|-------|---------|
| 6 (Modularisierung) | ~4h |
| 7 (Polish & A11y) | ~2h |
| **TOTAL** | **~6h** |
