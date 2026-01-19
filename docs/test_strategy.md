# 🏗️ Test Strategy (Wolkenkratzer-Standard)
**Version:** 1.0
**Phase:** 11 (Automated Quality)
**Status:** ACTIVE
**Standard:** Skyscraper Engineering – "Beweisbar korrekt, nicht nur funktioniert irgendwie."

---

## 1. Existing Test Infrastructure (Inventory)

### 1.1 Test Runner
| Component | Path | Status |
|-----------|------|--------|
| Vitest Config | `src/vitest.config.ts` | ✅ Active |
| Vitest Setup | `src/vitest.setup.ts` | ✅ Active |
| Environment | `jsdom` | ✅ Configured |
| Coverage | `v8` provider | ✅ Available |

### 1.2 Test Scripts (package.json)
```json
"test": "vitest run -c src/vitest.config.ts",
"test:watch": "vitest -c src/vitest.config.ts",
"test:coverage": "vitest run --coverage -c src/vitest.config.ts"
```

### 1.3 Existing Test Files
| Type | Path | Tests | Status |
|------|------|-------|--------|
| Unit (Zod) | `src/lib/contracts.test.ts` | 3 | ✅ |
| Unit (Logic) | `src/lib/logic.test.ts` | 4 | ✅ |
| Unit (Provision) | `src/lib/provisionLogic.test.ts` | 6 | ✅ |
| Hook (useLicense) | `src/hooks/__tests__/useLicense.test.ts` | 3 | ✅ |
| DB (pgTAP) | `supabase/tests/01_integrity.sql` | 7 | ⬜ (needs local Supabase) |

**Total:** 16 JS/TS tests + 7 SQL assertions

### 1.4 E2E Status
| Tool | Status |
|------|--------|
| Playwright | ❌ NOT installed |
| Cypress | ❌ NOT installed |

---

## 2. Test Pyramid (Wolkenkratzer Definition)

```
                    ┌─────────────┐
                    │   E2E (3)   │  ← Smoke: Login, Calculator, Customer Mode
                    │   Smokes    │
                    └─────────────┘
               ┌─────────────────────┐
               │   Integration (10)  │  ← API contracts, Form validation, DB views
               │   Contracts         │
               └─────────────────────┘
          ┌─────────────────────────────┐
          │      Unit Tests (30+)       │  ← Pure logic, Zod schemas, Hooks
          │      Fast & Isolated        │
          └─────────────────────────────┘
     ┌───────────────────────────────────────┐
     │     Static Analysis (TypeScript)      │  ← tsc --noEmit, ESLint
     │     Always On                         │
     └───────────────────────────────────────┘
```

### 2.1 Layer Definitions

#### Unit Tests (Fundament)
**Target:** Pure functions, Zod schemas, utility helpers.
**Black Box Rule:** DO NOT test pricing engine internals. Test the wrapper/contract.
**Location:** `src/lib/*.test.ts`

**Coverage Targets:**
- `calculateEconomics` (already tested)
- `calculateMonthlyProvision` (already tested)
- Zod schemas: `CalculationInputSchema`, `OfferSchema` (already tested)
- Utility functions: currency formatters, date helpers

#### Integration Tests (Tragwerk)
**Target:** API contracts, Form validation, Component state machines.
**Location:** `src/components/**/*.test.tsx`, `src/hooks/**/*.test.ts`

**Coverage Targets:**
- MarginForm: renders, validates, submits
- Customer Mode gating: renders without dealer fields
- PDF generation boundary: ViewModel → PDF (no secrets)
- Admin guard: role check works

#### E2E Smokes (Abnahme)
**Target:** 3 critical flows that MUST work before release.
**Location:** `e2e/*.spec.ts` (to be created)

**Coverage Targets:**
1. **Flow A:** Login → Calculator → Add Tariff → See Summary
2. **Flow B:** Customer Mode → Verify NO margin/EK visible
3. **Flow C:** Admin Guard → Non-admin blocked

---

## 3. Earthquake Scenarios (Top 20)

These are the "floor collapses" we must prevent.

### P0 – Critical (Data Leak / Business Logic Failure)
| ID | Scenario | Test Type | File Target |
|----|----------|-----------|-------------|
| EQ-1 | Customer Mode renders EK/Marge/Provision | E2E + Unit | Customer mode components |
| EQ-2 | Pricing calculation returns wrong margin | Unit | `calculateEconomics` wrapper |
| EQ-3 | RLS disabled on `tariffs_commercial` | DB (pgTAP) | `01_integrity.sql` |
| EQ-4 | Admin route accessible without role | Integration | Admin guard |
| EQ-5 | PDF contains dealer-sensitive data | Unit | PDF ViewModel |

### P1 – Major (Functionality Broken)
| ID | Scenario | Test Type | File Target |
|----|----------|-----------|-------------|
| EQ-6 | Empty tenant data crashes app | Unit | Hooks with null checks |
| EQ-7 | Import with invalid CSV columns | Unit | CSV parser/validator |
| EQ-8 | SSR/Client mismatch (hydration) | E2E | Page components |
| EQ-9 | Offline mode loses unsaved data | Unit | `useWizardAutoSave` |
| EQ-10 | Race condition on concurrent updates | Integration | Optimistic updates |

### P2 – UX Friction (Minor)
| ID | Scenario | Test Type | File Target |
|----|----------|-----------|-------------|
| EQ-11 | Infinite spinner on error | Unit | Error boundaries |
| EQ-12 | Form submits with invalid data | Integration | Zod validation |
| EQ-13 | Timezone display wrong | Unit | Date formatters |
| EQ-14 | Large list (500+ items) slow | Integration | Virtualization |
| EQ-15 | Session expires mid-typing | E2E | Session handling |

### P3 – Detected via Static Analysis
| ID | Scenario | Detection |
|----|----------|-----------|
| EQ-16 | `any` type in critical paths | ESLint `no-explicit-any` |
| EQ-17 | Unhandled Promise rejection | TypeScript strict |
| EQ-18 | Missing null checks | TypeScript strict |
| EQ-19 | Deprecated API usage | ESLint rules |
| EQ-20 | Bundle size regression | Build analysis |

---

## 4. Definition of Done (Phase 11)

### 4.1 Quantitative Gates
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Unit Tests | ≥ 25 | 16 | 🔴 |
| Integration Tests | ≥ 8 | 0 | 🔴 |
| E2E Smokes | 3 | 0 | 🔴 |
| Test Flakiness | 0 on 3 runs | N/A | ⬜ |
| Coverage (critical paths) | ≥ 70% | Unknown | ⬜ |

### 4.2 Qualitative Gates
- [ ] All P0 Earthquake Scenarios have tests
- [ ] Customer Mode "No-Leak" test exists and passes
- [ ] Pricing Engine treated as Black Box (no internal tests)
- [ ] `npm test` runs deterministically (no Date/random issues)
- [ ] Evidence Pack completed (`/docs/evidence/phase_11/`)

### 4.3 Evidence Pack Requirements
```
/docs/evidence/phase_11/
├── test_output.log       # Full test run output
├── coverage_report.html  # v8 coverage
├── earthquake_status.md  # Which scenarios are tested
└── regression_shield.md  # What changes break tests
```

---

## 5. Black Box Covenant

> **The Pricing Engine (`calculate-margin`) is a BLACK BOX.**
> 
> We test:
> 1. The **input contract** (Zod validation)
> 2. The **output shape** (response schema)
> 3. The **wrapper logic** (edge cases, error handling)
> 
> We do NOT test:
> 1. Internal math formulas
> 2. Lookup tables
> 3. Commission rules
> 
> If pricing logic needs verification, use **Golden Fixtures**:
> - Input fixture → Output snapshot
> - If output changes unexpectedly, test fails → human review

---

## 6. Next Steps (Phase 11.2 Preview)

**Prompt 11.2 (ANALYSE):**
1. Search for "fatal patterns" in codebase (`throw`, infinite spinners, unguarded localStorage)
2. Identify exact file paths for Top 5 critical domains
3. Write "Test Claims" for each domain

---

**Document Created By:** Antigravity (Principal Engineer + QA Lead)
**Date:** 2026-01-19
