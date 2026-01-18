# Test Matrix (Enterprise Quality)

**Scope:** Critical User Flows & Device targets.

## A. Device & Browser Support
| Device | Browser | Priority | Status |
|--------|---------|----------|--------|
| **iPad Pro 12.9"** | Safari | **P0** (Main POS Device) | ⬜️ |
| **Desktop (Win/Mac)** | Chrome/Edge | P0 (Backoffice) | ⬜️ |
| iPad Mini / Air | Safari | P1 | ⬜️ |
| iPhone 14/15 | Safari/Chrome | P2 (Emergency Only) | ⬜️ |

## B. Core User Roles
1.  **Sales Rep (POS):** Fast, Touch-friendly, Customer-facing mode.
2.  **Backoffice (Admin):** Data heavy, Mouse/Keyboard, Analytics.
3.  **Tenant Admin:** Settings, Branding, User Management.

## C. Critical Flow Verification (The "Golden Paths")
1.  **The "5-Minute Offer":** Login -> Select Customer -> Config Hardware -> Add Tariff -> Optimise -> **PRINT PDF**.
2.  **The "Offline Save":** Disconnect Wifi -> Edit Offer -> Reconnect -> Check Sync.
3.  **The "Privacy Toggle":** Open Tariff -> Activate "Customer Mode" -> Verify Margins Hidden.

## D. Edge Cases
- [ ] Session expiry while typing (Auto-save + Soft Lock).
- [ ] Zero Hardware stock (Fallback display).
- [ ] Max items (500+ SIMs) performance.
