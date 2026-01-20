# System Handoff: Project "zKalkulator" (GrundKonzept)

**To:** Claude (and all incoming Agents)
**From:** Antigravity (Current Orchestrator)
**Date:** 2026-01-20
**Subject:** Full Operational Context & State Analysis

---

## 1. The Directives (Who We Are & How We Work)
We are building **zKalkulator**, an enterprise-grade Margin Calculation and Contract Management System (SaaS).
We operate under the **DOE Framework**:
1.  **Directives (The Law):** We follow strict SOPs. We do not guess. `task.md` is our GPS.
2.  **Orchestration (The Manager):** We break down complex tasks into atomic steps.
3.  **Execution (The Tools):** We use deterministic scripts and verified code.

**The Golden Rule:** "Visual Debt is Technical Debt" & "Vibe Coding is Forbidden." We build Engineering-Grade software.

---

## 2. Technology Stack (The Arsenal)
*   **Frontend:** React 18 (Vite), TypeScript, Tailwind CSS (Design System 2.0).
*   **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, RLS).
*   **Deployment:** **Lovable Cloud** (Primary) & Vercel (Secondary).
*   **Repo:** GitHub (`zkalkulatorz`).
*   **Protection:**
    *   `eslint-plugin-boundaries` (Feature-Sliced Design enforcement).
    *   `dependency-cruiser` (Circular dependency prevention).
    *   `decimal.js` (Property-Based Tested Math - IEEE 754 Floats are BANNED).

---

## 3. Current Status (Where We Are)
**Overall Health:** 🟢 GREEN (Stable, Deployed, Polished)

We have just completed **Phase 13: Feature Expansion (Admin & Real Data)**.
*   **Admin Dashboard:** Fully migrated from `localStorage` mocks to Real Supabase Data (`departments`, `audit_logs`).
*   **Security:** `AdminGuard` and `useUserRole` are active and enforcing DB-level permissions.
*   **Visuals:** "Enterprise Polish" (Phase 12) is active. The UI looks like Stripe/Vodafone.
*   **QA:** "Phase Q" (The QA Manifest) is enforced. CI blocks on any lint error.

**Immediate Next Steps:**
1.  **UAT (User Acceptance Testing):** User is currently verifying the Admin Panel using `UAT_PROTOCOL.md`.
2.  **Phase 8 (Data Ingestion):** Next major feature is the CSV Import Pipeline for Tariffs.

---

## 4. Risks & Known Difficulties (The Minefield)
*   **CRITICAL: iCloud Ghost Files:** The workspace is in an iCloud Drive folder. This causes file duplication (e.g., `useAuth 2.ts`).
    *   *Countermeasure:* If the build fails with "Duplicate Identifier", run `find . -name "* 2.ts" -delete`.
*   **Strict CI/CD:** The Build Pipeline (`npm run build && npm run lint`) is **unforgiving**.
    *   *Rule:* Never push without running `npm run lint` locally.
*   **Lovable Cloud Constraints:**
    *   Build requires `src/node_modules` exclusion (Already fixed in `tailwind.config.ts`).
    *   Relies on `VITE_SUPABASE_ANON_KEY` (handled by our `envGuard.ts`).

---

## 5. The "Antigravity" Philosophy
*   **Don't ask "How?".** Analyze the code, read the `task.md`, and propose the "What".
*   **Don't break the build.** The CI is our sacred gatekeeper.
*   **Write Artifacts.** `implementation_plan.md` must be written before code. `walkthrough.md` must be written after code.

---

**Link to Repository:** `https://github.com/aaglobalreachgmbh/zkalkulatorz` (Contextual reference)

*End of Briefing.*
