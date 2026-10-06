# Project Architecture Rules

- Render tenant logos in web views through `BrandLogo` so sizing, aspect ratio, and broken-image handling stay consistent.- Role-based workspace (user type, palette, home layout) lives in `margenkalkulator/workspace/profiles.ts` + `useWorkspaceProfile` (per-user localStorage); simulated sales tools use `DemoPageShell` and local demo data so they stay clearly marked and backend-free.
