# Phase 11: Engineering Blueprint 3.0 (Automated Quality)
**Status:** ACTIVE
**Goal:** Achieve "100% Error-Free" status via Deterministic Testing.

## The 5-Step Iteration Plan

### 11.1 Test Namespace & Structure (Sanity)
- **Goal:** strictly separate "Pure Logic" (Unit) from "UI/Integration" (Component) from "Database" (pgTAP).
- **Location Rules:**
    - `src/lib/*.test.ts` -> Business Logic (No React).
    - `src/components/**/*.test.tsx` -> UI Components (React/jsdom).
    - `src/hooks/**/*.test.ts` -> React Hooks (renderHook).
    - `supabase/tests/*.sql` -> Database/RLS (pgTAP).
- **Action:**
    - verify `src/lib/logic.test.ts` matches rule (DONE).
    - verify `src/lib/contracts.test.ts` matches rule (DONE).
    - Ensure Component tests are co-located or in `__tests__`.

### 11.2 CI Automation (The Pipeline)
- **Goal:** Enable headless, automated testing (no watch mode) for CI/CD.
- **Action:**
    - Update `package.json` scripts:
        - `"test": "vitest run"`
        - `"test:watch": "vitest"`
        - `"test:coverage": "vitest run --coverage"`
    - Verify `npm test` runs successfully in terminal.

### 11.3 Hook Testing (React State Logic)
- **Goal:** Verify complex hooks (e.g., `useLicense`, `useMarginCalculation`) without rendering full UI.
- **Action:**
    - Test `useLicense.ts` (mocking Supabase client).
    - Test `useTimeTracking.ts` if logic is complex.

### 11.4 Critical Component Testing (Integration)
- **Goal:** Verify "Money Components" (e.g., `MarginForm`, `ContractCard`).
- **Action:**
    - Test `MarginForm` validation logic (rendering).
    - Verify "Save" button state based on validity.

### 11.5 Database Integrity (pgTAP)
- **Goal:** Verify RLS and Data Integrity at the DB layer.
- **Action:**
    - Automate `supabase test db` (requires local Supabase stack or Docker).
    - Confirm `01_integrity.sql` passes.

## Execution Rules
- **TDD:** Write the failing test first (where applicable).
- **Strict Logic Separation:** Never import React in a Logic test.
- **Mocking:** Mock all external I/O (Supabase, Fetch) in Unit Tests.
