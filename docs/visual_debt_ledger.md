# 🔍 Visual Debt & Risk Ledger (Wolkenkratzer-Standard)
**Version:** 1.0
**Phase:** 11.2 ANALYSE
**Date:** 2026-01-19

---

## 1. Fatal Pattern Analysis

### 1.1 `throw new Error` Locations (Non-Node Modules)

| Priority | File | Line | Risk |
|----------|------|------|------|
| **P0** | `src/services/calculationService.ts` | 17, 27, 37, 44 | Calculation fails → user sees error page |
| **P0** | `src/actions/admin-users.ts` | 36, 58, 68 | Admin action fails → unauthorized access risk |
| **P0** | `src/actions/invites.ts` | 36, 53 | Invite fails → license limit bypass risk |
| **P1** | `src/lib/secureApiGateway.ts` | 337–409 | Security throw → good (intentional) |
| **P1** | `src/lib/secureStorage.ts` | 115–196 | Crypto unavailable → fallback needed |
| **P2** | `src/components/ui/form.tsx` | 41 | Hook context error → developer error |
| **P2** | `src/components/ui/carousel.tsx` | 35 | Hook context error → developer error |

**Total:** 29 throw statements in src (excluding node_modules)

### 1.2 Suspense Boundaries

| File | Line | Fallback | Risk |
|------|------|----------|------|
| `src/App.tsx` | 392–703 | `<PageLoader />` | ✅ Good - has fallback |

**Assessment:** Single Suspense boundary with proper fallback. No infinite spinner risk.

### 1.3 Unguarded `window` Usage

| File | Usage | Risk |
|------|-------|------|
| `src/hooks/use-mobile.tsx` | `window.innerWidth`, `window.matchMedia` | SSR crash risk |
| `src/hooks/useAuth.tsx` | `window.location.href` | SSR safe (in effect) |
| `src/hooks/useNetworkStatus.ts` | `window.addEventListener` | SSR safe (in effect) |
| `src/lib/telemetry.ts` | `typeof window !== 'undefined'` | ✅ Guarded |
| `src/pages/*.tsx` | `window.confirm`, `window.location` | SSR safe (user action) |

**Assessment:** Most are guarded or in useEffect. `use-mobile.tsx` may need SSR guard.

### 1.4 localStorage Usage

| File | Pattern | Risk |
|------|---------|------|
| `src/lib/license.ts` | Load/Save license | Data loss if cleared |
| `src/lib/seatManagement.ts` | Seat assignments | Data loss if cleared |
| `src/lib/localStoragePolicy.ts` | Audit + cleanup | ✅ Governance layer |
| `src/lib/secureStorage.ts` | Encrypted wrapper | ✅ Security layer |

**Assessment:** Centralized governance exists. Cloud sync mitigates data loss.

---

## 2. Top 5 Critical Domains

### Domain 1: Margin Calculation Entry (Black Box Wrapper)
**Path:** `src/services/calculationService.ts`
**Risk Level:** P0

**Symptoms:**
- 4 throw statements in calculation flow
- No error boundary for calculation failures
- No retry logic

**Test Claims:**
- IF input fails Zod validation, THEN must return 400-style error, NEVER corrupt data
- IF engine returns malformed data, THEN must throw identifiable error, NEVER display wrong margin
- IF network fails, THEN must show retry option, NEVER hang

---

### Domain 2: Customer Mode Gating (der Tresor)
**Path:** `src/margenkalkulator/ui/steps/CompareStep.tsx`
**Risk Level:** P0 (CRITICAL)

**Symptoms:**
- `isCustomerMode` checked 6 times in render
- Conditional rendering based on `visibility.effectiveMode`
- Some dealer fields may leak via CSS (not checked)

**Test Claims:**
- IF `isCustomerMode === true`, THEN rendered HTML MUST NOT contain: `cost_price`, `ek`, `margin`, `provision`, `einkaufspreis`
- IF `isCustomerMode === true`, THEN confidential components MUST NOT mount (not just hidden)
- NEVER rely on CSS `display: none` for security

---

### Domain 3: Admin Guard & RBAC
**Path:** `src/components/guards/AdminGuard.tsx`
**Risk Level:** P0

**Symptoms:**
- Client-side redirect (bypassable if server not protected)
- Marked `@deprecated` - server protection recommended
- Uses `useUserRole()` hook (async)

**Test Claims:**
- IF user is not admin, THEN must redirect to "/", NEVER render children
- IF role loading fails, THEN must show error, NEVER grant access
- Server-side `requireAdmin()` MUST be primary protection

---

### Domain 4: PDF Generation Boundary
**Path:** `src/margenkalkulator/ui/components/PdfExportDialog.tsx`
**Risk Level:** P1

**Symptoms:**
- PDF created client-side (can be inspected)
- Must use "customer-safe" ViewModel (no raw data)

**Test Claims:**
- IF generating PDF for customer, THEN PDF content MUST NOT contain: `ek`, `margin`, `provision`, `costPrice`
- PDF input must be sanitized ViewModel, NEVER raw calculation result

---

### Domain 5: localStorage Security
**Path:** `src/lib/localStoragePolicy.ts`, `src/lib/secureStorage.ts`
**Risk Level:** P1

**Symptoms:**
- 50+ localStorage accesses across lib/
- Governance layer exists but not enforced at compile time

**Test Claims:**
- IF key not in whitelist, THEN must be flagged in audit
- NEVER store raw secrets (API keys, passwords)
- Encrypted storage MUST use AES-GCM with proper key derivation

---

## 3. "Risse" (Cracks) Summary

| ID | Crack | Domain | Fix Strategy |
|----|-------|--------|--------------|
| **R1** | Customer Mode may leak via CSS | Customer Mode | Test: rendered HTML contains no secrets |
| **R2** | AdminGuard is client-side only | Admin Guard | Verify server-side protection exists |
| **R3** | Calculation throws → white screen | Margin Calc | Add error boundary + retry |
| **R4** | PDF may contain raw data | PDF Gen | Test: PDF content is ViewModel only |
| **R5** | use-mobile.tsx may crash SSR | Hooks | Add `typeof window` guard |

---

## 4. Next Step: Prompt 11.3 IMPLEMENT

**Objective:** Build tests that prove the cracks are sealed.

**Priority Order:**
1. No-Leak Test for Customer Mode (P0)
2. AdminGuard integration test (P0)
3. Calculation error boundary test (P0)
4. PDF content validation test (P1)
5. SSR safety tests (P2)

---

*Document Created By:* Antigravity (Staff Engineer + SRE)
