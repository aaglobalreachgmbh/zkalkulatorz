# Risk Register (Test-Relevant)

## The "Earthquake" Scenarios (Top 20)

These are specific error conditions that must be simulated in our test suite.

### Data & State
1.  **Empty Tenant Data**: New user logs in, 0 products, 0 customers. Does it crash?
2.  **Null/Undefined in Math**: Price is `null` or `undefined`. Does `NaN` appear in UI?
3.  **Large Numbers**: Price > 1 Million. Does layout break?
4.  **Special Characters**: Customer Name = `Robert'); DROP TABLE Students;`. (SQLi/XSS check).
5.  **Race Conditions**: Clicking "Calculated" 5 times rapidly.
6.  **Stale Data**: Tab open for 24h, then click "Save".

### Network & Environment
7.  **Offline**: Network disconnects while submitting offer.
8.  **Flaky Network**: Request follows 5s timeout or returns 500 once, then 200.
9.  **LocalStorage Full**: Quota exceeded (rare but fatal for offline-first).
10. **Session Expiry**: Token expires while user is typing.

### Security & Privacy (The Walls)
11. **Customer Mode Leak**: Dealer views source code in Customer Mode → finds `ek_price`.
12. **URL Hacking**: User changes `/offer/123/edit` to `/offer/456/edit` (Other tenant).
13. **Role Escalation**: User forces navigation to `/admin`.

### UI/UX
14. **Viewport Crush**: Mobile device (320px). Is "Buy" button visible?
15. **Zoom 200%**: Is critical info readable?
16. **Dark Mode**: Are inputs readable? (Contrast).
17. **Fast Navigation**: Back/Forward browser buttons during wizard.

### Integration
18. **PDF Failure**: PDF Gen Service returns 500 or timeout.
19. **Import Corrupt**: Importing CSV with wrong delimiter or missing columns.
20. **Engine Update**: Pricing Engine Library updates but API changes slightly.

## Mitigation Strategy
- **Unit/Integration**: Cover #2, #4, #5, #17, #19.
- **E2E**: Cover #1, #7, #10, #11 #11, #13, #14.
- **Manual/Exploratory**: Cover #3, #9, #15, #16.
