
# Plan: Dokumentations-Synchronisierung Phase 12

## Zusammenfassung
Drei Dokumentationsdateien sind veraltet und referenzieren gelöschte Komponenten oder haben falsche Status-Angaben. Diese werden mit dem aktuellen Code-Stand synchronisiert.

---

## Änderungen

### 1. `docs/ux/phase_12_plan.md`
**Problem:** Status zeigt "PLANNING (Checkpoint 12.1)" obwohl alle Phasen abgeschlossen sind.

**Änderungen:**
- Zeile 4: Status → `✅ COMPLETE`
- Zeile 5: Date → `2026-02-01`
- Zeilen 20-43: Alle Checkpoints auf ✅ setzen
- Zeilen 50-64: WBS Checkboxen aktualisieren:
  - `CockpitLayout.tsx` → `CalculatorShell.tsx` [x]
  - `WizardContainer` → `WizardContent` [x]
  - `TariffSelection` → `TariffCard/TariffGrid` [x]
  - `OptionDrawer` → Entfernt (durch inline-Konfiguration ersetzt)
  - `globals.css` → `index.css` [x]
  - `tokens.ts` → Existiert [x]

---

### 2. `docs/visual_debt_ledger.md`
**Problem:** Referenzen zu gelöschten Komponenten (FloatingActionBar, StickyPriceBar, WizardProgress).

**Änderungen:**
- Zeile 6: Status → `✅ IMPLEMENTATION COMPLETE`
- Zeile 5: Date → `2026-02-01`
- Zeilen 31-34: Critical Layout Components aktualisieren:
  - `FloatingActionBar.tsx` → `MobileActionFooter.tsx`
  - `StickyPriceBar.tsx` → Entfernen (obsolet)
  - `WizardProgress.tsx` → Entfernen (obsolet)
- Zeile 51: VD-2 Status → `✅ FIXED (MobileActionFooter)`
- Zeilen 59-62: P1-Items als FIXED markieren:
  - VD-5: ✅ (Semantic tokens)
  - VD-6: ✅ (ModeSelector consolidation)
  - VD-7: ✅ (TariffGrid)
  - VD-8: ✅ (SummarySidebar sticky)

---

### 3. `docs/evidence/phase_12/README.md`
**Problem:** Last Updated veraltet, After Screenshots leer.

**Änderungen:**
- Zeile 5: Last Updated → `2026-02-01`
- Zeilen 49-51: After Screenshots Section aktualisieren mit Hinweis auf implementierte Änderungen

---

## Technische Details

### Gelöschte Komponenten (nicht mehr referenzieren)
| Alt | Neu/Ersatz |
|-----|------------|
| `FloatingActionBar.tsx` | `MobileActionFooter.tsx` |
| `StickyPriceBar.tsx` | In `SummarySidebar.tsx` integriert |
| `WizardProgress.tsx` | Entfernt (Phase 5C) |
| `SmartAdvisor*.tsx` | Entfernt (Phase 5C) |
| `AiConsultant.tsx` | Entfernt (Phase 5C) |

### Aktualisierte Komponentenpfade
| Dokumentiert | Aktuell |
|--------------|---------|
| `CockpitLayout.tsx` | `CalculatorShell.tsx` |
| `WizardContainer` | `WizardContent` |
| `globals.css` | `index.css` |

---

## Ausführungsreihenfolge
1. `docs/ux/phase_12_plan.md` - Status + WBS
2. `docs/visual_debt_ledger.md` - Komponenten + Status
3. `docs/evidence/phase_12/README.md` - Datum + Sections

**Geschätzte Änderungen:** ~80 Zeilen über 3 Dateien
