# Test Strategy (Phase 11 Blueprint)

## 1. The "Skyscraper" Philosophy
We are moving from "works somehow" to **"provably correct"**.
- **Fundament**: Tests, Contracts, Security, Deterministic States.
- **Tragwerk**: Clear boundaries (UI vs Engine), Clean Data Flow, RLS.
- **Erdbeben**: Edge-cases, Empty Data, Offline, Race Conditions.

## 2. Test Pyramid

### 2.1 Unit Tests (Vitest)
**Focus:** Pure logic, isolated functions, contracts.
- **Scope:**
  - Margin Calculation Wrapper (Engine is Black Box, Wrapper is White Box).
  - Zod Schemas / Validation Logic.
  - Utility functions (date formatting, currency math).
- **Target:** 100% coverage of utility and logic files.

### 2.2 Integration Tests (Vitest + RTL)
**Focus:** Component interactions, Data flow, API Contracts.
- **Scope:**
  - API/Edge Function contracts (Request/Response shape).
  - Database Views and Schemas (via pgTAP or mocked DB calls).
  - Complex Components (Calculator Wizards, Data Grids).
  - **Rules:** No secrets in tests. No live external calls (mock everything).

### 2.3 E2E Smoke Tests (Playwright - To Be Installed)
**Focus:** Critical User Flows from "Outside".
- **Scope - Top 3 Kern-Flows:**
  1. **Login → Calculator → PDF**: Can a user log in, create an offer, and get a PDF?
  2. **Customer Mode → No-Leak**: Switch to Customer Mode. Are margins/EK Hidden? (HTML Source Check).
  3. **Admin → Guard**: Can a normal user access Admin routes? (Must fail).

## 3. Definition of Done (Phase 11)
A feature or phase is "Done" when:
1.  **Coverage**: 
    - Critical Logic: >90% Unit Coverage.
    - Critical Flows: 100% E2E Smoke Coverage (Happy Path + 1 Sad Path).
2.  **Stability**: 
    - 0 Flaky tests on 3 consecutive runs (`npm run test:3x`).
3.  **Security**:
    - "No-Leak" tests passed for Customer Mode.
4.  **Performance**:
    - Full test suite runs < 2 minutes (locally).

## 4. Tools & Infra
- **Runner**: Vitest (Unit/Integration).
- **E2E**: Playwright.
- **CI**: GitHub Actions (to be configured).
