# 🔍 Visual Debt Ledger (Phase 12)

**Version:** 2.1
**Date:** 2026-01-19
**Status:** INVENTORY COMPLETE

---

## Verified Component Structure

### Calculator Entry Point
| Path | Lines | Purpose |
|------|-------|---------|
| `src/pages/Index.tsx` | 13 | Route wrapper |
| `src/margenkalkulator/ui/Wizard.tsx` | 813 | **Main Cockpit** — manages all state |
| `src/components/MainLayout.tsx` | 130 | Shell (Sidebar + Header + Content) |

### Wizard Steps (Accordion Content)
| Path | Lines | Purpose |
|------|-------|---------|
| `src/margenkalkulator/ui/steps/HardwareStep.tsx` | 27KB | Hardware selection |
| `src/margenkalkulator/ui/steps/MobileStep.tsx` | 15KB | Tariff selection |
| `src/margenkalkulator/ui/steps/FixedNetStep.tsx` | 8KB | Fixed-net add-ons |
| `src/margenkalkulator/ui/steps/CompareStep.tsx` | 16KB | Final comparison view |
| `src/margenkalkulator/ui/steps/SummaryStep.tsx` | 17KB | Summary (unused?) |

### Critical Layout Components
| Path | Lines | Purpose |
|------|-------|---------|
| `src/margenkalkulator/ui/components/SummarySidebar.tsx` | 12KB | Right rail summary |
| `src/margenkalkulator/ui/components/FloatingActionBar.tsx` | 7KB | Mobile bottom bar |
| `src/margenkalkulator/ui/components/StickyPriceBar.tsx` | 9KB | Mini-summary when scrolling |
| `src/margenkalkulator/ui/components/WizardProgress.tsx` | 3KB | Step indicator |
| `src/margenkalkulator/ui/components/LiveCalculationBar.tsx` | 12KB | Live totals |

### View Mode Guards
| Path | Lines | Purpose |
|------|-------|---------|
| `src/components/guards/ViewModeGuards.tsx` | 35 | DealerOnly/CustomerOnly filters |
| `src/hooks/useSensitiveFieldsVisible.ts` | — | Visibility logic |

---

## Visual Debt Inventory

### P0 — Blocking (Must Fix for Zero-Scroll)

| ID | Issue | Location | Root Cause | Status |
|----|-------|----------|------------|--------|
| **VD-1** | ~~Page scrolls on 1366×768~~ | `Wizard.tsx:636,680,729` | Accordion expands → pushes content | ✅ **FIXED** (max-h + overflow-y-auto) |
| **VD-2** | Summary hidden on mobile | `Wizard.tsx:779-790` | `hidden lg:block` class | ⚠️ Open (FloatingActionBar used) |
| **VD-3** | ~~CTA not always visible~~ | `SummarySidebar.tsx:347-410` | Only on mobile, not in rail | ✅ **FIXED** (Sticky footer added) |
| **VD-4** | ~~Accordion sections too tall~~ | `Wizard.tsx:636,680,729` | Full content expanded | ✅ **FIXED** (max-height applied) |

### P1 — Important (UX Degradation)

| ID | Issue | Location | Root Cause | Fix Strategy |
|----|-------|----------|------------|--------------|
| **VD-5** | Weak visual hierarchy | Multiple | Inconsistent font sizes | Apply typography scale |
| **VD-6** | Too many controls in header | `Wizard.tsx:515-565` | All modes shown | Group into dropdown |
| **VD-7** | Tariff list causes scroll | `MobileStep.tsx` | Vertical card stack | Grid or compact list |
| **VD-8** | No sticky totals during scroll | — | StickyPriceBar only on tariff select | Always show in rail |

### P2 — Polish (Nice to Have)

| ID | Issue | Location | Root Cause | Fix Strategy |
|----|-------|----------|------------|--------------|
| **VD-9** | Inconsistent padding | Global | Per-component values | Use spacing tokens |
| **VD-10** | Button styles mixed | Various | No hierarchy defined | Primary/Secondary/Ghost |
| **VD-11** | Icons without labels | Header controls | Space constraints | Add aria-labels |

---

## Baseline Scroll Analysis (Manual)

Based on `Wizard.tsx` structure at 1366×768:

| Area | Height Used | Budget | Status |
|------|-------------|--------|--------|
| Header | 64px | 64px | ✅ |
| Sub-header | 48px | 48px | ✅ |
| Wizard Progress | 40px | — | ⚠️ Extra |
| StickyPriceBar | 80px | — | ⚠️ Extra |
| Accordion (expanded) | **600px+** | 500px | ❌ OVERFLOW |
| Summary Sidebar | 400px | 500px | ✅ |

**Root Cause of Scroll:** Accordion content (HardwareStep + MobileStep) exceeds available height when expanded.

---

## Recommended Layout Changes

### 1. Structural Fix
```diff
- Accordion type="single" collapsible
+ Internal scroll zones within each accordion panel
+ max-height: 400px on AccordionContent
+ overflow-y: auto
```

### 2. Summary Rail Fix
```diff
+ SummarySidebar gets sticky footer with primary CTA
+ Always-visible totals at top of rail
+ Compact mode for 768px height
```

### 3. Mobile Adaptation
```diff
- FloatingActionBar only
+ Bottom sheet with expandable summary
+ Sticky CTA bar (60px)
```

---

*Ledger created by Antigravity (Phase 12.2 INVENTORY)*
