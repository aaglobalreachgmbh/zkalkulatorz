# Test Matrix

| Domain | Criticality | Unit Tests (Logic) | Integration (Component/API) | E2E (Flow) | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pricing Engine** | **CRITICAL (Black Box)** | Wrapper Inputs/Outputs | - | Calculator Flow | Incorrect Margins = Financial Loss |
| **Offer Forms** | High | Zod Validation | Form Submission State | Create Offer | Invalid Data, UX Dead Ends |
| **Customer Mode** | **CRITICAL** | - | Render Guard / CSS Hidden check | **No-Leak Check** | **Data Leak (EK/Margin exposed)** |
| **PDF Generation** | High | ViewModel Transformation | Rendering Stability | Download PDF | Broken Layout, Missing Data |
| **Admin/Tenants** | High | - | RLS Policies / Guard Components | Admin Access Denied | Unauthorized Access |
| **Auth/Session** | Medium | - | Session Provider / Hooks | Login/Logout | Locked out users |
| **Offline Mode** | Medium | Sync Queue Logic | OfflineBoundary Component | - | Data Loss on Reconnect |

## Priorities for Phase 11
1.  **Customer Mode Leak Proofing**: Must be verified by automated test.
2.  **Calculator Stability**: Ensure inputs reach the engine correctly and results display.
3.  **Admin Security**: Ensure RLS and Route Guards actually work.
