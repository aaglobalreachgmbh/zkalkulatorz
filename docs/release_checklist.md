# Release Checklist (Enterprise Grade)

**Gatekeeper for Deployment.**

## 1. Build & Integrity
- [ ] `npm run build` passes with Exit Code 0.
- [ ] No Type Errors (TypeScript Strict Mode).
- [ ] No Linting Errors (ESLint).
- [ ] Bundle Size check (No massive vendor chunks).

## 2. Security & Privacy
- [ ] **Customer Mode Verified:** No sensitive data in DOM.
- [ ] **Permissions:** Admin routes inacessible to Sales Users.
- [ ] **Storage:** No unencrypted auth tokens in LocalStorage (use `secureStorage`).

## 3. Critical Functionality
- [ ] **PDF Generation:** Works and looks like "Vodafone Business".
- [ ] **Calculation:** Totals match manual reference check.
- [ ] **Save/Load:** Offer restoration works 100%.

## 4. UI/UX Polish
- [ ] **White Screen Check:** Error Boundary catches crashes.
- [ ] **Loading States:** No content jumping (Skeletons used).
- [ ] **Mobile:** Hamburger menu works, no horizontal scroll.
