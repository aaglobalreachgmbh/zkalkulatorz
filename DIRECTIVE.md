# MARGENKALKULATOR SPECIFICATION (ZKalkulatorz)

**Role:** Senior Frontend Architect & SaaS Product Specialist

## Project Context
- **Repo:** `zkalkulatorz` (Vite/React SPA)
- **Goal:** Upgrade to "Enterprise Quality" SaaS Product.
- **Publisher:** `allenetze.de`

## Critical Implementation Notes (Stack Adaptation)
The original specification references Next.js patterns (SSR, API Routes).
**Current Stack:** Vite + React + Supabase (Client-Side Only).

### Adapted Architecture
1.  **No SSR Fix Needed:** This is an SPA. We focus on **Client-Side Resilience**.
    - Ensure `localStorage` access is guarded against null/privacy modes.
    - Ensure no "White Screen of Death" (Error Boundaries).
2.  **PDF Generation:** 
    - Cannot use Next.js API Routes.
    - **Solution:** Use Supabase Edge Functions OR robust Client-Side generation (`@react-pdf/renderer` inside a Web Worker to avoid freezing UI).
3.  **Routing:**
    - Uses `react-router` (likely).
    - Ensure "Customer Mode" routes are secure.

## Design System: "Enterprise Aesthetic"
- **Colors:** Deep Red (Primary), Allenetze Navy/Orange (Brand), Slate-50 (Bg).
- **UI:** Glassmorphism "Cockpit" feel.

## Definition of Done
1.  Reliable Build (`npm run build` in Vite).
2.  Enterprise UI Polish.
3.  Secure Data Handling.
