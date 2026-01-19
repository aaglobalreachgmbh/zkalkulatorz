# Phase 11.2 ANALYSE (Das "Riss-Protokoll")

## 1. Gefundene "Fatal Patterns" (Codebase Audit)

Diese Patterns bedrohen die Stabilität und müssen im "Implement"-Schritt (11.3 & 11.4) behoben werden.

### A. Impure Renders (Hydration/Consistency Risk)
- **Problem**: `Date.now()` oder `Math.random()` direkt im Render-Body. Führt zu "Server-Client Mismatch".
- **Fundorte**:
  - `src/components/customer/ContractCard.tsx` (Zeile 97: `Date.now()`)
  - `src/components/team/TeamMemberCard.tsx` (Zeile 86: `Date.now()`)
  - `src/components/ui/sidebar.tsx` (Zeile 547: `Math.random()`)
  - `src/hooks/useGamification.ts` (Zeile 213: `Date.now()`)

### B. State Updates in Effects (Infinite Loop Risk)
- **Problem**: `setState` wird synchron in `useEffect` aufgerufen. Verursacht "Cascading Renders".
- **Fundorte**:
  - `src/components/AdminSetupGate.tsx` (Zeile 21)
  - `src/components/AppSidebar.tsx` (Zeile 137)
  - `src/components/OnboardingTour.tsx` (Zeile 123)
  - `src/components/ProtectedRoute.tsx` (Zeile 32)
  - `src/hooks/useLicense.ts` (Zeile 79)

### C. Unsafe Error Handling
- **Problem**: `throw new Error` ohne expliziten Boundary-Check in Services.
- **Fundort**: `src/services/calculationService.ts` (Zeile 17, 27, 37).
- **Risiko**: Wenn `MarginForm` den Error nicht fängt (aktuell tut es das, aber andere Caller?), stürzt die App ab (White Screen).

### D. "Any" Types (Blindflug)
- **Problem**: TypeScript wird umgangen.
- **Fundorte**: `src/actions/admin-tenants.ts`, `src/components/calculator/MarginForm.tsx` (zodResolver as any).

---

## 2. Top 5 Kritische Domänen & Test-Claims

Hier definieren wir, was **beweisbar** sein muss (Claims).

### Domäne 1: Margin Calculation Wrapper
**Pfad**: `src/services/calculationService.ts`
- [ ] **Claim**: "Wenn Input invalid ist (z.B. volume=-1), MUSS der Service VOR dem Edge-Function-Call abbrechen und einen Zod-Error werfen."
- [ ] **Claim**: "Wenn die Edge-Function 500 liefert, DARF der Service NICHT `undefined` zurückgeben, sondern muss einen typisierten Error werfen."

### Domäne 2: Offer Forms (Zod Validation)
**Pfad**: `src/components/calculator/MarginForm.tsx`
- [ ] **Claim**: "Ein Submit DARF NICHT möglich sein, wenn `customerType` fehlt."
- [ ] **Claim**: "Wenn `volume` leer ist, MUSS das UI *inline* 'Required' anzeigen (kein Toast)."

### Domäne 3: Customer Mode Gating (The Vault)
**Pfad**: `src/components/customer/ContractCard.tsx`
- [ ] **Claim**: "Im Customer Mode (URL-Parameter oder Context) DARF KEIN `ek_price`, `provision`, oder `margin` im HTML-Source auftauchen."
- [ ] **Claim**: "Wenn `isCustomerMode=true`, MUSS die 'Edit'-Action deaktiviert/hidden sein."

### Domäne 4: PDF Generation Boundary
**Pfad**: `src/margenkalkulator/dataManager/importers/pdfImporter.ts` (Proxy für Gen)
- [ ] **Claim**: "Wenn `generatePdf` aufgerufen wird, DARF KEIN `undefined` Value in die PDF-Engine gereicht werden (Crash-Gefahr)."
- [ ] **Claim**: "Sonderzeichen (Emojis, Quotes) im Namen DÜRFEN das PDF-Generieren NICHT abbrechen."

### Domäne 5: Admin Guard (RBAC)
**Pfad**: `src/components/AdminRoute.tsx`
- [ ] **Claim**: "Ein Nutzer ohne 'ADMIN' Rolle, der `/admin` aufruft, MUSS auf 'Zugriff verweigert' oder Login redirected werden."
- [ ] **Claim**: "Ein 'Loading'-State während des Auth-Checks DARF NICHT kurzzeitig den Admin-Inhalt flackern lassen (Flash of Unprivileged Content)."

---

## 3. Plan für Phase 11.3 (Implement)

1. **Fix Fatal Patterns first**:
   - `Date.now()` -> `useEffect` oder `useMemo`.
   - `setState` in Effect -> Refactor condition.
2. **Install Playwright**: Für die Claims 3 & 5 (Isolation/Leaking).
3. **Vitest Tests**: Für Claims 1, 2 & 4.
