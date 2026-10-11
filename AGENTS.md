# Project Architecture Rules

- Render tenant logos in web views through `BrandLogo` so sizing, aspect ratio, and broken-image handling stay consistent.- Role-based workspace (user type, palette, home layout) lives in `margenkalkulator/workspace/profiles.ts` + `useWorkspaceProfile` (per-user localStorage); simulated sales tools use `DemoPageShell` and local demo data so they stay clearly marked and backend-free.
- The "Demo-Firma" uses the normal customer, offer, and contract screens through an exclusive local demo workspace selected by `useDemoMode`; never combine its records or writes with live backend data, and always show the global demo banner.
- Customer-facing AI explanations go through the `explain-offer` edge function, which accepts only customer-side offer values (never margin/EK/provision).
- Calculator suggestions (tariffs/promos/bundles after device choice) come from the pure `workspace/suggestions.ts` plus per-user `useBusinessFocus` (focus goals, custom products, scoped localStorage); they only pre-fill wizard state and never touch the pricing engine or show dealer values in customer view.

- Own products added to an offer ("Zusatzleistungen") live in `workspace/useOfferExtras` (scoped localStorage), shown additively in the basket, never fed into the pricing engine and never showing provision.
- Mobile calculator completion uses the same `OfferBasketPanel` and `CreateOfferModal` as desktop through a bottom sheet, so basket, extras, and offer creation never diverge by viewport.
- Shared dialog primitives enforce dynamic viewport height and internal scrolling so completion actions remain reachable on short mobile screens.
- The sales UI follows a light enterprise cockpit: core navigation stays sales-first, uses Lucide icons and semantic tokens, while classic layouts remain optional migration aids rather than competitor copies.
- Demo mode grants a superadmin-like view only via `useDemoAccess` in role hooks/AdminRoute; it never assigns real roles, and server RLS remains the security boundary.
- Home is a single sales overview: quick actions, daily work, and configurable dashboard widgets share `/`; workspace layouts adjust emphasis but never hide the dashboard.
- Administrative demo routes run inside `DemoAdminBoundary`, which keeps their real UI explorable while blocking backend writes and function calls in demo mode.
- Public demo access uses a server-verified, short-lived ticket and always activates the anonymous local demo workspace; it never creates an auth session or grants backend roles.
- Server-side abuse limits use the shared persistent rate-limit helper with server-derived, keyed hashes and fail closed, because browser or instance-local counters are not a security boundary.
