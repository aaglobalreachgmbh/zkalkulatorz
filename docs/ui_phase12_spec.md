# Phase 12: Cockpit Enterprise UI Redesign (The Wolkenkratzer)

## 12.1 PLAN

### Objective
Transform the Calculator into a "Vodafone-aligned Enterprise Cockpit" where users can configure and export an offer **without page scrolling** on target viewports (1366x768).

### 1) Cockpit Layout Model: Option A (Two-Part Cockpit)
We select **Option A** (Split View) because it aligns with the existing (but imperfect) direction in `Wizard.tsx` and maximizes "Live Summary" visibility.

#### The "No-Scroll Contract"
- **Viewport:** 1366x768 (Target)
- **Container:** `h-screen` (Fixed height, no window scroll)
- **Header:** ~64px (Fixed)
- **Cockpit Body:** `flex-1` (Remaining height)
  - **Left Rail (Config):** ~66-70% width. **Internal Scroll** allowed.
  - **Right Rail (Summary):** ~30-33% width. **Sticky/Fixed**. Never scrolls away. Shows Monthly/One-Time totals live.
  - **Footer (Action Bar):** Sticky at bottom of Left Rail. Primary CTA ("Next"/"Add") always visible.
- **Forbidden:** `window` scroll. `body { overflow: hidden; }` on calculator route to enforce contract.

### 2) UI Inventory (Verified Paths)
- **Entry Route:** `src/pages/Index.tsx` (wraps `Wizard`)
- **Main Layout:** `src/components/MainLayout.tsx`
- **Wizard Logic:** `src/margenkalkulator/ui/Wizard.tsx` (Current layout implementation)
- **Steps:** `src/margenkalkulator/ui/steps/*.tsx`
- **Summary Sidebar:** `src/margenkalkulator/ui/components/SummarySidebar.tsx`

### 3) Information Hierarchy & Visual Grammar
- **Primary KPI:** "Monatliche Gesamtkosten" (Monthly Total) - Large, top right.
- **Secondary:** "Einmalige Kosten" (Hardware/Install) - Medium, below primary.
- **Tertiary:** Line items (Tariff details) - Small, mostly hidden in "Customer Mode".
- **Dealer-Only:** Margin/Provision - **Strictly Guarded** (not just hidden).

**Tokens:**
- **Primary Action:** Vodafone Red (Action confirm)
- **Surface:** White / Gray-50 (Day), Slate-900 (Night)
- **Input Height:** 44px (Touch friendly)

### 4) Acceptance Tests (Gates)
- **G0 (No-Scroll):** On 1366x768, `window.scrollY` is always 0.
- **G1 (CTA):** "Weiter" / "Export" button is visible without scrolling panel.
- **G3 (Leak):** Customer Mode screenshot shows ZERO occurrences of "Marge", "Provision", "EK".
- **G6 (Speed):** New user walkthrough (Select Tariff -> Add HW -> Export) < 60s.

### 5) Execution Slicing (Phase 12.3)
1.  **Refactor Main Container:** Change `Wizard.tsx` from `min-h-screen` to `h-screen`.
2.  **Refactor Left Rail:** Ensure `overflow-y-auto` works correctly with flex.
3.  **Sticky Footer:** Implement `StickyPriceBar` or similar as a permanent docked footer in the left rail.
4.  **Summary Rail:** Ensure `SummarySidebar` consumes full height.
5.  **Clean:** Remove `min-h` hacks.

### 6) Risks
- **P0:** Shared `MainLayout` might enforce margins/padding that break full-width cockpit. -> *Mitigation: Create dedicated `CockpitLayout` bypassing standard shell if needed.*
- **P1:** Long tariff lists might require internal scroll, hiding the "Next" button if not sticky. -> *Mitigation: Sticky Footer inside the Left Rail.*
