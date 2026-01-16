# System Map (ZKalkulatorz)

**Live Map of Routes, Features, and Components**
*Last Verification: [Current Date]*

## 1. Core Routing Architecture
- **Framework:** React Router + Vite (Lazy Loading)
- **Guards:**
  - `<ProtectedRoute>`: General Auth
  - `<AdminRoute>`: Role = Admin
  - `<TenantAdminRoute>`: Role = TenantAdmin
  - `<MobileAccessGate>`: POS restriction
  - `<OfflineBoundary>`: Resilience

## 2. Route Map

### Public / Auth
- `/auth`: Login/Reset
- `/auth/reset-password`: Self-service reset
- `/datenschutz`: Privacy Policy
- `/share/offer/:id`: Public Offer View (Zero-Auth, Sanitized)

### Operational (POS/Sales)
- `/`: Dashboard (Home)
- `/calculator`: **The Core Engine** (Wizard)
- `/customers`: CRM List
- `/offers`: Offer Management
- `/contracts`: VVL/Contract Lifecycle

### Admin / Backoffice
- `/admin`: Global KPIs
- `/admin/users`: User Management
- `/tenant-admin`: Organization Settings
- `/data-manager`: Hardware/Tariff Data (The "Brain")

### Security & Governance
- `/security`: Security Dashboard
- `/security/report`: Audit Logs
- `/settings/security`: User MFA/Session Settings
- `/settings/hardware-images`: Hardware Asset Management
- `/admin/distribution`: Distribution Partner Dashboard
