# 📐 Phase 12 UI Specification — Cockpit Enterprise Redesign

**Version:** 2.1
**Date:** 2026-01-19
**Status:** DRAFT (12.1 PLAN)
**Primary Model:** Gemini 3 Pro High (Creator)
**Secondary Model:** Claude (Critic only — never implements)

---

## 0. Self-Configuration

| Parameter | Value |
|-----------|-------|
| **Primary Model** | Gemini 3 Pro High |
| **Secondary Model** | Claude (critic only) |
| **Context Limit** | ~1M tokens (effective ~200k per turn) |
| **Safe Batch Size** | 50-100 lines per file edit |
| **Screenshot Capability** | Browser Subagent (Puppeteer-like) + Manual via Lovable UI |

---

## 1. Laws (Non-Negotiables)

| ID | Law | Enforcement |
|----|-----|-------------|
| **L1** | Pricing engine = BLACK BOX. No refactor. | Code review gate |
| **L2** | Allowed: UI/UX, layout, rendering, flags, validation, a11y, perf | Scope filter |
| **L3** | Customer Mode: No dealer tokens in DOM/PDF | Leak test (existing) |
| **L4** | No invented paths. Verify before naming. | Repo scan |
| **L5** | Evidence mandatory | Screenshot + path proof |
| **L6** | No "o2" in copy | Grep check |

---

## 2. Wolkenkratzer Definition

### Vision
A **skyscraper that survives earthquakes**:
- **TRUST-FIRST:** Vodafone red cues, enterprise calm, official look
- **ZERO-SCROLL:** Primary work completes without document scroll
- **LOW COGNITIVE LOAD:** One decision cluster per step
- **LAYOUT HYGIENE:** No clipped elements, no random spacing

### Target Viewports

| Name | Resolution | Priority |
|------|------------|----------|
| Laptop Standard | 1366 × 768 | **PRIMARY** |
| Desktop HD | 1440 × 900 | Secondary |
| Full HD | 1920 × 1080 | Tertiary |

---

## 3. Success Gates

| Gate | Requirement | Test Method |
|------|-------------|-------------|
| **G0 No-Scroll** | `scrollY === 0` during primary flow | Manual + JS assertion |
| **G1 CTA** | Primary CTA visible on every step | Screenshot check |
| **G2 Totals** | Monthly + One-time always visible | Screenshot check |
| **G3 Leak** | Customer Mode = zero dealer tokens | Existing test + HTML scan |
| **G4 A11y** | Tab order logical, focus visible | Manual keyboard walk |
| **G5 Performance** | No layout shift, predictable states | Lighthouse + manual |
| **G6 Demo** | New user → PDF in < 3 minutes | Timed walkthrough |

---

## 4. Cockpit Layout Model Selection

### Options Evaluated

| Option | Description | Zero-Scroll | CTA | Totals |
|--------|-------------|-------------|-----|--------|
| **A** | Two-panel (left content + right sticky rail) | ✅ Rail sticky | ✅ In rail footer | ✅ In rail |
| **B** | Fixed-height container + sticky footer | ✅ If height managed | ✅ Footer | ⚠️ Must fit |
| **C** | Tabbed cockpit | ❌ Tab switch loses context | ⚠️ Per-tab | ❌ Hidden on switch |

### Decision: **Option A (Two-Panel Cockpit)**

**Justification:**
1. **No-Scroll Guarantee:** Left panel scrolls internally; page never scrolls.
2. **CTA Always Visible:** Sticky footer inside right rail or at rail bottom.
3. **Totals Always Visible:** Summary lives in right rail, always mounted.
4. **Progressive Disclosure:** Accordion/collapsible sections in left panel reduce height.
5. **Enterprise Precedent:** Stripe, Supabase, Vodafone portals use similar patterns.

---

## 5. No-Scroll Contract

### Above-Fold Requirements (1366×768)

| Region | Content | Height Budget |
|--------|---------|---------------|
| **Header** | App bar + step indicator | 64px |
| **Sub-Header** | View mode toggle, session badge | 48px |
| **Work Area** | Split: Left (flex-1) + Right (320px) | Remaining (~656px) |

### Panel Rules

| Panel | Behavior |
|-------|----------|
| **Left (Input)** | `overflow-y: auto`, `max-height: calc(100vh - 112px)` |
| **Right (Summary)** | `position: sticky`, `top: 112px`, internal scroll if needed |
| **Footer CTA** | Sticky at bottom of right rail OR floating bar on mobile |

### Forbidden Patterns

| Pattern | Why Forbidden |
|---------|---------------|
| CTA below fold | Fails G1 |
| Totals in collapsed section | Fails G2 |
| Long forms without grouping | Causes scroll |
| Full-width cards stacking vertically | Height explosion |

---

## 6. Information Hierarchy

### KPI Precedence

| Rank | KPI | Display |
|------|-----|---------|
| **1st** | Monthly Total (VK) | Large, bold, top of summary |
| **2nd** | One-Time Total (VK) | Secondary size, below monthly |
| **3rd** | Customer-safe line summary | Compact list |
| **Dealer-only** | EK, Margin, Provision | GUARDED — never mounted in customer mode |

### Visual Grammar

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Tight gaps |
| `--spacing-sm` | 8px | Between related items |
| `--spacing-md` | 16px | Between groups |
| `--spacing-lg` | 24px | Section gaps |
| `--spacing-xl` | 32px | Major section dividers |

---

## 7. Design Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--vf-red` | #E60000 | Primary CTA, accents |
| `--vf-red-dark` | #B30000 | Hover states |
| `--surface` | #FFFFFF | Card backgrounds |
| `--surface-muted` | #F4F4F5 | Subtle backgrounds |
| `--border` | #E4E4E7 | Card borders |
| `--text-primary` | #18181B | Headings |
| `--text-muted` | #71717A | Secondary text |

### Typography

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-xl` | 24px | 700 | Page title |
| `--text-lg` | 20px | 600 | Section headers |
| `--text-md` | 16px | 500 | Labels |
| `--text-sm` | 14px | 400 | Body |
| `--text-xs` | 12px | 400 | Captions |

### Controls

| Token | Value |
|-------|-------|
| `--control-height` | 40px (touch-friendly) |
| `--control-padding` | 12px 16px |
| `--radius-sm` | 6px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |

---

## 8. Step Design Principles

1. **One Primary Decision:** Each step has ONE main choice (e.g., select tariff).
2. **Progressive Disclosure:** Advanced options collapse by default.
3. **Immediate Feedback:** Summary updates as user configures.
4. **No Dead Ends:** Every step has clear "Next" or "Add" action.
5. **Reversibility:** User can go back; state is preserved.

---

## 9. Acceptance Tests

### Screenshot Checklist (Per Viewport)

| Screenshot | 1366×768 | 1440×900 | 1920×1080 |
|------------|----------|----------|-----------|
| Home (landing) | ◻️ | ◻️ | ◻️ |
| Calculator: Hardware step | ◻️ | ◻️ | ◻️ |
| Calculator: Mobile step | ◻️ | ◻️ | ◻️ |
| Calculator: Summary visible | ◻️ | ◻️ | ◻️ |
| Calculator: Customer mode | ◻️ | ◻️ | ◻️ |
| Calculator: CTA visible | ◻️ | ◻️ | ◻️ |

### Keyboard Checklist

- [ ] Tab moves focus logically through inputs
- [ ] Focus ring visible on all interactive elements
- [ ] Enter submits forms where appropriate
- [ ] Escape closes modals/dropdowns

### 3-Minute-to-PDF Walkthrough

1. Land on `/` (0:00)
2. Click "Konfigurator starten" (0:10)
3. Select "Keine Hardware" (0:20)
4. Select any tariff (0:40)
5. See summary update (0:50)
6. Click "Add to Offer" (1:00)
7. Switch to Customer Mode (1:10)
8. Click "Export PDF" (1:20)
9. Verify PDF renders (1:30)
10. Done (< 3:00) ✅

### Minimal RTL/Vitest Tests

```typescript
// 1. Leak test (existing)
test("customer mode never renders dealer tokens", () => {
  // Already exists in ViewModeGuards.test.tsx
});

// 2. CTA visibility test
test("primary CTA exists in summary rail", () => {
  render(<SummarySidebar {...props} />);
  expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
});
```

---

## 10. Execution Slicing (12.3)

| Commit | Description | Files |
|--------|-------------|-------|
| **1** | Create `CockpitShell.tsx` skeleton | +1 file |
| **2** | Implement sticky right rail | `Wizard.tsx` |
| **3** | Move summary to rail | `SummarySidebar.tsx` |
| **4** | Add sticky CTA to rail footer | `FloatingActionBar.tsx` |
| **5** | Enforce internal scroll on left panel | `Wizard.tsx` |
| **6** | Spacing/typography pass | `globals.css` |
| **7** | Review + fix overflows | Various |

---

## 11. Risks & Mitigations

| Risk | Priority | Mitigation |
|------|----------|------------|
| Accordion height exceeds budget | P0 | Collapse by default, internal scroll |
| Right rail too tall on 768px | P0 | Compact summary mode |
| Mobile loses summary | P1 | Sticky bottom sheet |
| Leak in edge case | P0 | Existing tests + additional DOM scan |
| Playwright not available | P1 | Manual screenshots as fallback |

---

## 12. Claude Critique Placeholder

*To be filled after PLAN review:*

Claude's feedback on gaps, risks, or improvements will be integrated here as actionable items.

---

*Document generated by Antigravity (Gemini 3 Pro High)*
*Next Step: 12.2 INVENTORY*
