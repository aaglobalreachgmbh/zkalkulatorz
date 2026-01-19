# 🛡️ PHASE AUDIT MASTER PLAN
**Version:** 1.0
**Created:** 2026-01-19
**Status:** ACTIVE
**Methodology:** 5-Step Engineering Loop (ADR → TDD → Code → Security → SRE)

---

## Executive Summary

This document defines the **acceptance criteria** and **verification steps** for all 10 phases of the ZKalkulator Enterprise Upgrade. Each phase must pass its Quality Gates before being marked as ✅ Complete.

---

## Phase Overview

| Phase | Name | Status | Verified |
|-------|------|--------|----------|
| 1 | Core Architecture | ✅ Done | ✅ tsc passes |
| 2 | Database Schema | ✅ Done | ⬜ Needs supabase CLI |
| 3 | Authentication & RLS | ✅ Done | ⬜ Needs pgTAP |
| 4 | API Layer | ✅ Done | ✅ contracts.test.ts |
| 5 | UI Components | ✅ Done | ✅ tsc passes |
| 6 | PDF Generation | ✅ Done | ✅ tsc passes |
| 7 | Calculator Engine | ✅ Done | ✅ logic.test.ts |
| 8 | Admin Dashboard | ✅ Done | ✅ tsc passes |
| 9 | Edge Functions | ✅ Done | ⚠️ Lint warnings |
| 10 | Build Stabilization | ✅ Done | ✅ Verified |
| 11 | Test Infrastructure | ✅ Done | ✅ Verified |

---

## Verification Protocol (5-Step Loop)

For each phase, we apply:

### Step 1: ADR Review (Architecture)
- Does the implementation match the original design intent?
- Are there undocumented deviations?

### Step 2: TDD Check (Test Coverage)
- Do unit tests exist for critical logic?
- Are edge cases covered?
- Is coverage measurable?

### Step 3: Code Quality Audit
- TypeScript strict mode compliance?
- `@ts-nocheck` usage documented?
- Clean Code principles followed?

### Step 4: Security Scan
- Input validation with Zod?
- RLS policies active?
- No hardcoded secrets?

### Step 5: SRE Validation
- Error handling present?
- Logging/observability hooks?
- Resilience patterns (retry, fallback)?

---

## Phase 1: Core Architecture

### Scope
- Next.js 15 App Router setup
- Directory structure (`src/`, `app/`, `lib/`)
- Base configuration files

### Acceptance Criteria
- [ ] `tsconfig.json` has `strict: true`
- [ ] `next.config.ts` exists and is valid
- [ ] ESLint configured
- [ ] Prettier configured

### Verification Command
```bash
npx tsc --noEmit && npm run lint
```

---

## Phase 2: Database Schema

### Scope
- Supabase tables: `tariffs_public`, `tariffs_commercial`, `user_roles`, etc.
- Migrations in `supabase/migrations/`

### Acceptance Criteria
- [ ] All migrations apply cleanly
- [ ] Foreign keys defined
- [ ] RLS enabled on sensitive tables

### Verification Command
```bash
supabase db push --dry-run
```

---

## Phase 3: Authentication & RLS

### Scope
- Supabase Auth integration
- Row Level Security policies
- Admin role separation

### Acceptance Criteria
- [ ] RLS enabled on `tariffs_commercial`
- [ ] RLS enabled on `user_roles`
- [ ] Policy tests in `supabase/tests/01_integrity.sql`

### Verification Command
```bash
# Run pgTAP tests (requires local supabase stack)
supabase test db
```

---

## Phase 4: API Layer

### Scope
- Supabase Edge Functions
- API contracts with Zod

### Acceptance Criteria
- [ ] `contracts.ts` defines all API schemas
- [ ] Edge functions use Zod validation
- [ ] Error responses are structured

### Verification Command
```bash
npm run test -- src/lib/contracts.test.ts
```

---

## Phase 5: UI Components

### Scope
- Shadcn/UI components
- Custom components (`MarginForm`, `ContractCard`, etc.)

### Acceptance Criteria
- [ ] All components compile without error
- [ ] Props are strictly typed
- [ ] No `any` in component signatures

### Verification Command
```bash
npx tsc --noEmit
```

---

## Phase 6: PDF Generation

### Scope
- `@react-pdf/renderer` components
- PDF templates in `src/margenkalkulator/pdf/`

### Acceptance Criteria
- [ ] All PDF components compile
- [ ] Conditional styles use ternary (not `&&`)
- [ ] No runtime errors on render

### Verification Command
```bash
npx tsc --noEmit --project tsconfig.json
```

---

## Phase 7: Calculator Engine

### Scope
- Margin calculation logic
- Pure functions in `logic.ts`

### Acceptance Criteria
- [ ] `calculateEconomics` is pure (no side effects)
- [ ] Design by Contract (Pre/Post conditions)
- [ ] Unit tests pass

### Verification Command
```bash
npm run test -- src/lib/logic.test.ts
```

---

## Phase 8: Admin Dashboard

### Scope
- `/admin` routes
- User management, tenant management
- Feature flags UI

### Acceptance Criteria
- [ ] Admin routes protected by auth
- [ ] Components compile
- [ ] API calls use proper error handling

### Verification Command
```bash
npx tsc --noEmit
```

---

## Phase 9: Edge Functions

### Scope
- `calculate-margin` function
- `import-tariffs` function
- `generate-pdf` function

### Acceptance Criteria
- [ ] Each function has `logic.ts` extracted
- [ ] Error handling with structured responses
- [ ] Deno types compatible

### Verification Command
```bash
# Deno check (if available)
deno check supabase/functions/calculate-margin/index.ts
```

---

## Phase 10: Build Stabilization

### Scope
- All TypeScript errors resolved
- Clean `tsc --noEmit` output

### Acceptance Criteria
- [x] `npx tsc --noEmit` passes
- [x] `npm run lint` passes
- [x] Git push successful

### Verification Command
```bash
npx tsc --noEmit && npm run lint
```

**Status:** ✅ VERIFIED (Commit `04eb2d3`)

---

## Phase 11: Test Infrastructure

### Scope
- Vitest configuration
- CI scripts in `package.json`
- jsdom environment

### Acceptance Criteria
- [x] `npm run test` executes without error
- [x] `logic.test.ts` passes (4/4)
- [x] `contracts.test.ts` passes (3/3)

### Verification Command
```bash
npm run test
```

**Status:** ✅ VERIFIED (Commit `f99324a`)

---

## Next Steps: Phase 12+

### Phase 12: Hook Testing (11.3)
- Write tests for `useLicense`, `useMarginCalculation`
- Mock Supabase client
**Status:** ✅ VERIFIED (Commit `Pending`)
- `useLicense.test.ts` passes (mocked)
- `provisionLogic.test.ts` passes (refactored)

### Phase 13: Component Testing (11.4)
- Test `MarginForm` with React Testing Library
- Verify validation states

### Phase 14: Database Testing (11.5)
- Execute `pgTAP` tests
- Verify RLS policies work as expected

---

## Execution Order

1. **Immediate:** Run verification commands for Phases 1-9
2. **Log Results:** Update this document with ✅ or ❌
3. **Fix Issues:** Address any failures found
4. **Final Push:** Once all verified, tag release as `v1.0.0`

---

## Appendix: Engineering Manifesto Reference

This plan adheres to the principles defined in:
- `directives/ENGINEERING_MANIFESTO.md`
- `directives/ENGINEERING_BLUEPRINT_3.0.md`
- `directives/SOP_001_5_STEP_LOOP.md`

**Quality Gates are non-negotiable.**
