# Project Architecture Rules

- Render tenant logos in web views through `BrandLogo` so sizing, aspect ratio, and broken-image handling stay consistent.- Role-based workspace (user type, palette, home layout) lives in `margenkalkulator/workspace/profiles.ts` + `useWorkspaceProfile` (per-user localStorage); simulated sales tools use `DemoPageShell` and local demo data so they stay clearly marked and backend-free.
- The "Demo-Firma" sample business is driven by `useDemoMode` (per-user localStorage flag) and `workspace/demoDataset.ts`, rendered only on dedicated demo surfaces (`TodayOverview`, `/demo-betrieb`) — never mixed into real data hooks, so real and invented data cannot be confused.
- Customer-facing AI explanations go through the `explain-offer` edge function, which accepts only customer-side offer values (never margin/EK/provision).
