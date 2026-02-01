
# PHASE 5-7: STATUS-REPORT & NÄCHSTE SCHRITTE

## ✅ ABGESCHLOSSEN

### Phase 5A: Context-Finalisierung ✅
| Komponente | Status | Details |
|------------|--------|---------|
| `SummarySidebar.tsx` | ✅ DONE | Verwendet `useCalculator()`, Props: 11 → 2 |
| `MobileActionFooter.tsx` | ✅ DONE | Verwendet `useCalculator()`, Props: 5 → 1 |
| `Wizard.tsx` | ✅ DONE | Vereinfachte Prop-Übergabe |

### Phase 5B Teil 1: Semantic Design Tokens ✅
| Element | Status |
|---------|--------|
| `--status-success/warning/error` | ✅ In index.css |
| `--margin-positive/neutral/negative` | ✅ In index.css |
| Utility-Klassen (`.text-margin-positive`, etc.) | ✅ In index.css |

### Phase 5C Teil 1: Komponenten-Löschung ✅
**11 Komponenten gelöscht (~1.800 LOC entfernt):**
- ✅ `WizardProgress.tsx`
- ✅ `QuickStartDialog.tsx`
- ✅ `SmartAdvisor.tsx` & `SmartAdvisorBadge.tsx`
- ✅ `AiConsultant.tsx` & `AiRecommendationsPanel.tsx`
- ✅ `PriceTimeline.tsx` & `SavingsBreakdown.tsx`
- ✅ `ConfigurableDashboard.tsx` & `SortableWidget.tsx`
- ✅ `DensityToggle.tsx`

---

## ❌ NOCH OFFEN

### Phase 5B Teil 2: Header-Reduzierung (~1h)
**Aktueller Zustand (Wizard.tsx Zeile 411-436):**
```text
Header: [Session Badge] [flex-spacer] [CustomerSessionToggle] [ViewModeToggle] [ActionMenu]
```
**Ziel:** `[Modus ▾] [⋮]` (2 Elemente)

**Offene Aufgaben:**
1. `CustomerSessionToggle` in ActionMenu verschieben
2. `ViewModeToggle` als kompakten Dropdown "Modus" gestalten
3. Session Badge nur bei aktiver Session anzeigen (bereits so)

### Phase 5B Teil 3: Sidebar Redesign (~2h)
**Aktueller Zustand:**
- `SummarySidebar.tsx`: **432 LOC** (Ziel: ~150)
- Komplexe Struktur mit 3 Boxed-Cards + Discounts + Actions

**Offene Aufgaben:**
1. `CompactConfigSummary.tsx` erstellen (Hero KPI Pattern)
2. Sidebar auf Kern-Elemente reduzieren:
   - Hero-Preis (48px)
   - Kompakte Konfig-Zusammenfassung (1 Zeile)
   - Marge mit Progress Bar
   - Primärer CTA

### Phase 5C Teil 2: Verbleibende Löschungen (~30min)
| Komponente | LOC | Status |
|------------|-----|--------|
| `WelcomeWidget.tsx` | 272 | ❌ Noch vorhanden, ungenutzt |

### Phase 5C Teil 3: Konsolidierung (~1h)
| Von | Nach | Status |
|-----|------|--------|
| `AnimatedCurrency.tsx` + `MarginBadge.tsx` | `PriceDisplay.tsx` | ❌ Ausstehend |
| `ViewModeToggle.tsx` + `CustomerSessionToggle.tsx` | `ModeSelector.tsx` | ❌ Ausstehend |

### Phase 6: Step-Modularisierung (~4h)
| Datei | Aktuell | Ziel | Status |
|-------|---------|------|--------|
| `HardwareStep.tsx` | **621 LOC** | 200 LOC | ❌ Nicht modularisiert |
| `MobileStep.tsx` | ~495 LOC | 150 LOC | ❌ Nicht modularisiert |

**Geplante Struktur:**
```text
src/margenkalkulator/ui/steps/hardware/
├── HardwareGrid.tsx
├── HardwareCard.tsx
├── HardwareFilters.tsx
├── HardwareSearch.tsx
└── index.tsx

src/margenkalkulator/ui/steps/mobile/
├── TariffGrid.tsx
├── TariffCard.tsx
├── ContractTypeSelector.tsx
├── QuantitySelector.tsx
└── index.tsx
```

### Phase 7: Polish & Accessibility (~2h)
- ❌ Hardcodierte Farben migrieren (z.B. `text-amber-500` → `text-[hsl(var(--status-warning))]`)
- ❌ Button Event-Bubbling systematisch prüfen
- ❌ A11y: Focus-Management, ARIA-Labels, Screen Reader Support

---

## METRIKEN-FORTSCHRITT

| Metrik | Vorher | Aktuell | Ziel | Status |
|--------|--------|---------|------|--------|
| Gelöschte Komponenten | 0 | ~12 | ~12 | ✅ |
| `SummarySidebar.tsx` LOC | 419 | 432 | 150 | ❌ |
| `HardwareStep.tsx` LOC | 621 | 621 | 200 | ❌ |
| Header-Elemente | 8+ | 4 | 3 | 🟡 |
| Semantic Tokens | ❌ | ✅ | ✅ | ✅ |

---

## EMPFOHLENE REIHENFOLGE

1. **Phase 5B Teil 2**: Header-Reduzierung (Quick Win)
2. **Phase 5C Teil 2+3**: WelcomeWidget löschen + Konsolidierung
3. **Phase 5B Teil 3**: Sidebar Redesign
4. **Phase 6**: Step-Modularisierung (größter Aufwand)
5. **Phase 7**: Polish & A11y

**Geschätzte Restzeit:** ~10h
