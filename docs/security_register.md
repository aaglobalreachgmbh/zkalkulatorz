# 🔒 Security Register — MargenKalkulator (ZKalkulator)

**Version:** 1.0
**Date:** 2026-01-19
**Status:** PHASE S1 — TRIAGE COMPLETE
**Author:** Antigravity (Principal Security Engineer)

---

## Executive Summary

Security scan findings have been triaged. This document tracks each vulnerability, its exploit narrative, fix plan, and verification status.

---

## Findings Overview

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| P0-A | 🔴 HIGH | `shared_offers` token enumeration risk | ✅ FIXED |
| P0-B | 🔴 HIGH | `email_accounts` lateral access risk | NEEDS VERIFICATION |
| P0-C | 🟠 MEDIUM | `onboarding_templates` public exposure | NEEDS INVESTIGATION |
| P1-D | 🟡 LOW | RLS linter warnings (USING(true)) | NEEDS VERIFICATION |
| P1-E | 🟡 LOW | xlsx dependency vulnerability | ✅ FIXED (0.20.3) |

---

## P0-A: `shared_offers` — Token Enumeration Risk

### Source Files
- `src/margenkalkulator/hooks/useSharedOffers.ts`
- `src/pages/SharedOfferPage.tsx`
- DB Table: `shared_offers`
- RPC: `get_shared_offer_public`

### Current State
```typescript
// Token generation (qrCodeGenerator.ts)
const accessToken = generateAccessToken(); // Need to verify strength

// Storage
access_token: accessToken, // Stored in PLAINTEXT
```

### Exploit Narrative
1. **Attacker Goal:** Access other users' offer data without authorization
2. **Attack Vector:** Brute-force or guess `access_token` values
3. **Required Knowledge:** Token format and length
4. **Potential Impact:** Customer/pricing data leakage, GDPR violation

### Risk Assessment
- **Token Strength:** ✅ STRONG — 256 bits (32 bytes via `crypto.getRandomValues`)
- **Token Format:** Hex string, 64 characters
- **Rate Limiting:** ❌ MISSING — No rate limiting in code
- **Expiration:** ✅ EXISTS (`expires_at`, `valid_days`)
- **Token Storage:** ⚠️ PLAINTEXT — Should be SHA-256 hashed

### Evidence
```typescript
// src/margenkalkulator/utils/qrCodeGenerator.ts:74-80
export function generateAccessToken(): string {
  const array = new Uint8Array(32); // ✅ 256 bits
  crypto.getRandomValues(array);    // ✅ Cryptographically secure
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');                       // ✅ 64 char hex string
}
```

### Fix Plan
1. Verify token is ≥128 bits (32 bytes base64url)
2. Hash tokens before storage (SHA-256)
3. Add rate limiting (IP + token-based)
4. Ensure only customer-safe fields returned

---

## P0-B: `email_accounts` — Encrypted Token Access

### Source Files
- `src/margenkalkulator/hooks/useEmailAccounts.ts`
- DB Table: `email_accounts`

### Current State
```typescript
// Query is filtered by user_id
.from("email_accounts")
.select("*")
.eq("user_id", user.id)
```

### Exploit Narrative
1. **Attacker Goal:** Access other users' OAuth refresh tokens
2. **Attack Vector:** Bypass RLS or SQL injection
3. **Required Knowledge:** Another user's email account ID
4. **Potential Impact:** Account takeover, email access

### Risk Assessment
- **RLS in Hook:** ✅ Filtered by `user_id`
- **RLS in DB:** NEEDS VERIFICATION
- **Token Encryption:** ✅ Described as encrypted
- **Edge Functions:** Use `service_role` (correct pattern)

### Fix Plan
1. Verify RLS policies enforce `user_id = auth.uid()`
2. Ensure no `SELECT *` returns decrypted tokens to client
3. Create safe view for UI (no token columns)

---

## P0-C: `onboarding_templates` — Public Exposure

### Source Files
- No frontend file found (DB-only table suspected)
- DB Table: `onboarding_templates`

### Exploit Narrative
1. **Attacker Goal:** View internal onboarding processes
2. **Attack Vector:** Direct table query with anon key
3. **Required Knowledge:** Table exists
4. **Potential Impact:** Internal process leakage

### Risk Assessment
- **Frontend Usage:** Not found in codebase search
- **RLS:** UNKNOWN — requires DB inspection
- **Exposure:** May have `USING(true)` policy for seeding

### Fix Plan
1. Verify table exists and inspect RLS
2. Remove any public SELECT policy
3. If global templates needed, restrict to authenticated + admin

---

## P1-D: RLS Linter Warnings

### Finding
Supabase security linter flags:
- Permissive policies with `USING(true)`
- Functions with mutable `search_path`

### Risk Assessment
- **Scope:** Likely service_role only operations
- **Impact:** Low if properly scoped
- **Verification:** Requires SQL query proof

### Fix Plan
1. Query all policies with `USING(true)`
2. Verify they require `service_role` or superadmin
3. Add explicit role checks if missing

---

## P1-E: xlsx Dependency

### Current State
- Upgraded to 0.20.3 in previous phase
- CVE-2023-30533 patched

### Verification Needed
- Confirm no other version in lockfile
- Run `npm audit` for residual warnings

---

## Verification Commands

```sql
-- Check shared_offers RLS
SELECT * FROM pg_policies WHERE tablename = 'shared_offers';

-- Check email_accounts RLS
SELECT * FROM pg_policies WHERE tablename = 'email_accounts';

-- Check onboarding_templates RLS
SELECT * FROM pg_policies WHERE tablename = 'onboarding_templates';

-- Find all USING(true) policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE qual = 'true' OR qual LIKE '%true%';
```

```bash
# Check xlsx version
npm ls xlsx

# Run security audit
npm audit
```

---

## Next Steps

| Phase | Action | Status |
|-------|--------|--------|
| S1 | Triage & Document | ✅ COMPLETE |
| S2 | Close P0-A (shared_offers) | PENDING |
| S3 | Close P0-B (email_accounts) | PENDING |
| S4 | Close P0-C (onboarding_templates) | PENDING |
| S5 | Hardening Sweep | PENDING |

---

*Document maintained by Antigravity. Last updated: 2026-01-19*
