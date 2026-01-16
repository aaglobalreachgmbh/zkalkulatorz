# Risk Register (ZKalkulatorz)

**Priority Levels:**
- **P0:** Critical Blocker / Data Leak / Legal Risk
- **P1:** Major Functionality Broken / Business Impact
- **P2:** UX Friction / Minor Bug

## Active Risks

| ID | Risk | Severity | Mitigation Strategy | Owner | Status |
|----|------|----------|---------------------|-------|--------|
| R-1 | **Client-Side Pricing Logic** (Manipulation) | P0 | Logic is currently in JS bundle. Mitigation: Validation on Save (Backend) + Obfuscation (partial). **Long-term:** Move engine to Edge Functions. | Lead Dev | 🟡 |
| R-2 | **Local Storage Data Loss** | P1 | Browser might clear storage. Mitigation: `useWizardAutoSave` pushes to Supabase immediately. `OfflineBoundary` handles sync. | Frontend | 🟢 |
| R-3 | **PDF Client Generation Freeze** | P2 | Large PDFs freeze UI. Mitigation: Hybrid Architecture (Client Preview + Edge Final). **Status:** Stub Created (`/generate-pdf`). | Frontend | 🟢 |
| R-4 | **Customer Mode Data Leak** | P0 | Showing margin/commission to customer. Mitigation: Strict Check `isCustomerMode` in React Render Tree (not just CSS). | Lead Dev | 🟢 |
| R-5 | **Build Bloom** (Large Chunks) | P2 | Bundle size > 1.5MB. Mitigation: Code Splitting (Lazy) implemented in `App.tsx`. | Infra | 🟢 |

## Resolved Risks
- *None documented yet.*
