# Platform Hosting Guide

## Current Platform: Lovable

This project is configured for **Lovable** hosting with the following tech stack:

| Component | Technology | Status |
|-----------|------------|--------|
| Framework | React 18 + Vite | ✅ Lovable Compatible |
| UI | shadcn/ui + Tailwind CSS | ✅ |
| Routing | react-router-dom | ✅ |
| State | TanStack Query | ✅ |
| Auth | Supabase Auth | ✅ Gmail + Magic Link |
| Database | Supabase PostgreSQL | ✅ |
| PDF | @react-pdf/renderer | ✅ |

### Authentication Methods
- ✅ Gmail (Google OAuth via Supabase)
- ✅ Magic Link (Email)
- ✅ Username/Password (Supabase)

---

## Future Migration: Firebase Studios

When cloning this repo to **Firebase Studios**, the platform should automatically detect the React/Vite structure and can migrate to Next.js for better Firebase integration.

### Recommended Firebase Stack
| Component | Current (Lovable) | Target (Firebase) |
|-----------|-------------------|-------------------|
| Framework | React + Vite | Next.js 14+ (App Router) |
| Auth | Supabase Auth | Firebase Auth |
| Database | Supabase PostgreSQL | Firestore / Firebase RTDB |
| Functions | Supabase Edge Functions | Firebase Cloud Functions |
| Hosting | Lovable | Firebase Hosting |

### Migration Steps
1. Clone repo to Firebase Studios
2. Let Firebase detect and convert to Next.js
3. Replace Supabase client with Firebase SDK
4. Migrate RLS policies to Firestore Security Rules
5. Convert Edge Functions to Cloud Functions

### Files to Update During Migration
- `src/integrations/supabase/*` → Firebase SDK
- `src/hooks/useAuth.tsx` → Firebase Auth hooks
- `vite.config.ts` → `next.config.js`
- `package.json` → Add Next.js dependencies

---

## Important Notes

> ⚠️ **Lovable Compatibility**  
> While hosted on Lovable, do NOT add Next.js dependencies.
> Lovable only supports React + Vite projects.

> ✅ **Firebase Studios Detection**  
> Firebase Studios will detect this as a React project and offer
> to migrate to Next.js automatically.

---

## Tech Stack Validation Commands

```bash
# Verify React/Vite setup
cat package.json | grep -E "vite|react"

# Should NOT see any Next.js:
cat package.json | grep "next" | grep -v "next-themes"
# Expected output: (empty or only next-themes)

# Verify ESLint is for Vite/React:
head -10 eslint.config.js
# Should NOT contain eslint-config-next
```
