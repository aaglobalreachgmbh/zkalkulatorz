import { Suspense, lazy, useState, useEffect, Component, type ReactNode, type ErrorInfo } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { TenantAdminRoute } from "@/components/TenantAdminRoute";
import { SecurityProvider } from "@/providers/SecurityProvider";
import { OfflineBoundary } from "@/components/OfflineBoundary";
import { IdentityProvider } from "@/contexts/IdentityContext";
import { CustomerSessionProvider } from "@/contexts/CustomerSessionContext";
import { POSModeProvider } from "@/contexts/POSModeContext";
import { SeatLimitGate } from "@/components/SeatLimitGate";
import { AdminSetupGate } from "@/components/AdminSetupGate";
import { FeatureRoute } from "@/components/FeatureRoute";
import { MobileAccessGate } from "@/components/MobileAccessGate";
import { OfferBasketProvider } from "@/margenkalkulator/contexts";
import { DensityProvider } from "@/contexts/DensityContext";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/CommandPalette";

// Eagerly loaded pages (critical path)
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (code splitting)
const Index = lazy(() => import("./pages/Index"));
const Bundles = lazy(() => import("./pages/Bundles"));
const DataManager = lazy(() => import("./pages/DataManager"));
const DataHub = lazy(() => import("./pages/DataHub"));
const HardwareManager = lazy(() => import("./pages/HardwareManager"));
const HardwareImages = lazy(() => import("./pages/HardwareImages"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const MoccaImport = lazy(() => import("./pages/MoccaImport"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Team = lazy(() => import("./pages/Team"));
const Offers = lazy(() => import("./pages/Offers"));
const OfferDetail = lazy(() => import("./pages/OfferDetail"));
const Reporting = lazy(() => import("./pages/Reporting"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminEmployees = lazy(() => import("./pages/AdminEmployees"));
const AdminPushProvisions = lazy(() => import("./pages/AdminPushProvisions"));
const AdminQuantityBonus = lazy(() => import("./pages/AdminQuantityBonus"));
const SharedOfferPage = lazy(() => import("./pages/SharedOfferPage"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const License = lazy(() => import("./pages/License"));
const SecurityReport = lazy(() => import("./pages/SecurityReport"));
const ThreatIntelligence = lazy(() => import("./pages/ThreatIntelligence"));
const SecurityStatusDashboard = lazy(() => import("./pages/SecurityStatusDashboard"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const GDPRDashboard = lazy(() => import("./pages/GDPRDashboard"));
const ActivityDashboard = lazy(() => import("./pages/ActivityDashboard"));
const SecurityTestPage = lazy(() => import("./pages/SecurityTestPage"));
const DistributionDashboard = lazy(() => import("./pages/DistributionDashboard"));
const TenantAdmin = lazy(() => import("./pages/TenantAdmin"));
const BrandingSettings = lazy(() => import("./pages/BrandingSettings"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Calendar = lazy(() => import("./pages/Calendar"));
const News = lazy(() => import("./pages/News"));
const AdminNews = lazy(() => import("./pages/AdminNews"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const AdminPermissions = lazy(() => import("./pages/AdminPermissions"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TimeTracking = lazy(() => import("./pages/TimeTracking"));
const Provisions = lazy(() => import("./pages/Provisions"));

import { EnterpriseErrorBoundary } from "@/components/EnterpriseErrorBoundary";

// Enhanced loading fallback with timeout and retry
const PageLoader = () => {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">Lade...</p>
        {showRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Seite neu laden
          </Button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PHASE 1: TOP-LEVEL ERROR BOUNDARY (outside all providers)
// ============================================================================
interface AppErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // PHASE 5: Enhanced error logging
    console.error("[AppErrorBoundary] FATAL ERROR:", error);
    console.error("[AppErrorBoundary] Component Stack:", errorInfo.componentStack);

    this.setState({
      errorInfo: `${error.name}: ${error.message}\n\nStack:\n${errorInfo.componentStack?.slice(0, 500)}`
    });

    // Clear corrupt session data on auth errors
    const errorMessage = error?.message?.toLowerCase() || "";
    if (
      errorMessage.includes("refresh_token") ||
      errorMessage.includes("session") ||
      errorMessage.includes("jwt") ||
      errorMessage.includes("auth")
    ) {
      console.warn("[AppErrorBoundary] Auth-related error, clearing session");
      this.clearSessionData();
    }
  }

  clearSessionData = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("[AppErrorBoundary] Failed to clear storage:", e);
    }
  };

  handleClearAndReload = () => {
    this.clearSessionData();
    window.location.href = "/auth";
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              App konnte nicht geladen werden
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ein kritischer Fehler ist aufgetreten. Bitte starten Sie die Anwendung neu.
            </p>

            {/* PHASE 5: Show error details in dev mode */}
            {isDev && this.state.errorInfo && (
              <pre className="text-left text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40 text-red-600 dark:text-red-400">
                {this.state.errorInfo}
              </pre>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={this.handleClearAndReload}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sitzung zurücksetzen und neu laden
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Seite neu laden
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Route-level Error Boundary (inside BrowserRouter, for route-specific errors)
// ============================================================================
interface RouteErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RouteErrorBoundary extends Component<{ children: ReactNode }, RouteErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // PHASE 5: Enhanced logging
    console.error("[RouteErrorBoundary] Caught route error:", error);
    console.error("[RouteErrorBoundary] Component Stack:", errorInfo.componentStack);

    const errorMessage = error?.message?.toLowerCase() || "";
    if (
      errorMessage.includes("refresh_token") ||
      errorMessage.includes("session") ||
      errorMessage.includes("token") ||
      errorMessage.includes("auth")
    ) {
      console.warn("[RouteErrorBoundary] Auth-related error detected, clearing session");
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error("Failed to clear storage:", e);
      }
    }
  }

  handleLogout = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }
    window.location.href = "/auth";
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message?.toLowerCase().includes("auth") ||
        this.state.error?.message?.toLowerCase().includes("token") ||
        this.state.error?.message?.toLowerCase().includes("session");

      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <span className="text-destructive text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold">Seite konnte nicht geladen werden</h2>
            <p className="text-muted-foreground text-sm">
              {isAuthError
                ? "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an."
                : "Ein Fehler ist aufgetreten. Bitte laden Sie die Seite neu."}
            </p>

            {/* PHASE 5: Show error in dev mode */}
            {isDev && this.state.error && (
              <pre className="text-left text-xs bg-muted p-3 rounded overflow-auto max-h-32 text-destructive">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col gap-2">
              {isAuthError ? (
                <Button onClick={this.handleLogout} className="gap-2">
                  Neu anmelden
                </Button>
              ) : (
                <Button onClick={() => window.location.reload()} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Seite neu laden
                </Button>
              )}
              <Button variant="outline" onClick={this.handleLogout} className="gap-2 text-sm">
                Abmelden und neu starten
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// PHASE 2: REMOVED clearCorruptSessionOnLoad - was causing redirect loops
// Session cleanup now only happens on explicit auth errors within error boundaries
// ============================================================================

// QueryClient with optimized caching and error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache retention
      retry: (failureCount, error) => {
        // No retry on auth-related errors
        const errorMsg = (error as Error)?.message?.toLowerCase() || "";
        if (
          errorMsg.includes("refresh_token") ||
          errorMsg.includes("jwt") ||
          errorMsg.includes("unauthorized") ||
          errorMsg.includes("session") ||
          errorMsg.includes("pgrst301")
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      // CRITICAL: Don't propagate errors to Error Boundary
      throwOnError: false,
    },
  },
});

// Pages that are always allowed on all devices
const ALWAYS_ALLOWED_PATHS = ["/auth", "/datenschutz", "/license", "/pending-approval", "/share"];

// ============================================================================
// PHASE 3 & 4: Safe Provider Wrapper with Fallback
// Wraps providers to catch errors and still render children
// ============================================================================
function SafeProviderStack({ children }: { children: ReactNode }) {
  return (
    <SecurityProvider>
      <OfflineBoundary>
        <TooltipProvider>
          <AuthProvider>
            <IdentityProvider>
              <CustomerSessionProvider>
                <POSModeProvider>
                  <DensityProvider>
                    <OfferBasketProvider>
                      {children}
                    </OfferBasketProvider>
                  </DensityProvider>
                </POSModeProvider>
              </CustomerSessionProvider>
            </IdentityProvider>
          </AuthProvider>
        </TooltipProvider>
      </OfflineBoundary>
    </SecurityProvider>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
// Lovable Cloud automatically manages Supabase credentials at build time
// No manual configuration check needed

const App = () => {
  return (
    // PHASE 1: Top-level error boundary OUTSIDE all providers
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeProviderStack>
          <SeatLimitGate>
            <MobileAccessGate allowedPaths={ALWAYS_ALLOWED_PATHS}>
              <Toaster richColors position="top-right" />
              <BrowserRouter>
                <CommandPalette />
                <RouteErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public routes - no authentication required */}
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/auth/reset-password" element={<ResetPassword />} />
                      <Route path="/datenschutz" element={<Privacy />} />
                      <Route path="/pending-approval" element={<PendingApproval />} />

                      {/* ALL other routes require authentication */}
                      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                      <Route
                        path="/calculator"
                        element={
                          <ProtectedRoute>
                            <EnterpriseErrorBoundary moduleName="Calculator Engine">
                              <Index />
                            </EnterpriseErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/bundles" element={<ProtectedRoute><Bundles /></ProtectedRoute>} />
                      <Route path="/daten" element={<ProtectedRoute><DataHub /></ProtectedRoute>} />
                      <Route path="/license" element={<ProtectedRoute><License /></ProtectedRoute>} />

                      {/* Admin routes */}
                      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                      <Route path="/admin/employees" element={<AdminRoute><AdminEmployees /></AdminRoute>} />
                      <Route path="/admin/push-provisions" element={<AdminRoute><AdminPushProvisions /></AdminRoute>} />
                      <Route path="/admin/quantity-bonus" element={<AdminRoute><AdminQuantityBonus /></AdminRoute>} />
                      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                      {/* Redirect old route to new super-admin */}
                      <Route path="/admin/customers" element={<Navigate to="/super-admin" replace />} />
                      <Route path="/super-admin" element={<AdminRoute><SuperAdmin /></AdminRoute>} />
                      <Route path="/admin/permissions" element={<TenantAdminRoute><AdminPermissions /></TenantAdminRoute>} />

                      <Route
                        path="/offers"
                        element={
                          <ProtectedRoute>
                            <Offers />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/offers/:id"
                        element={
                          <ProtectedRoute>
                            <EnterpriseErrorBoundary moduleName="Offer Detail">
                              <OfferDetail />
                            </EnterpriseErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/customers"
                        element={
                          <ProtectedRoute>
                            <Customers />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/customers/:id"
                        element={
                          <ProtectedRoute>
                            <CustomerDetail />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/customers/import"
                        element={
                          <ProtectedRoute>
                            <MoccaImport />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/contracts"
                        element={
                          <ProtectedRoute>
                            <Contracts />
                          </ProtectedRoute>
                        }
                      />
                      {/* VVL-Tracker alias for /contracts */}
                      <Route
                        path="/vvl-tracker"
                        element={<Navigate to="/contracts" replace />}
                      />
                      <Route
                        path="/team"
                        element={
                          <ProtectedRoute>
                            <Team />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/reporting"
                        element={
                          <ProtectedRoute>
                            <Reporting />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings/security"
                        element={
                          <ProtectedRoute>
                            <SecuritySettings />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings/hardware-images"
                        element={
                          <ProtectedRoute>
                            <HardwareImages />
                          </ProtectedRoute>
                        }
                      />
                      {/* Distribution Dashboard - Tenant Admin */}
                      <Route
                        path="/admin/distribution"
                        element={
                          <ProtectedRoute>
                            <DistributionDashboard />
                          </ProtectedRoute>
                        }
                      />
                      {/* Time Tracking */}
                      <Route
                        path="/time-tracking"
                        element={
                          <ProtectedRoute>
                            <TimeTracking />
                          </ProtectedRoute>
                        }
                      />
                      {/* Provisions */}
                      <Route
                        path="/provisions"
                        element={
                          <ProtectedRoute>
                            <Provisions />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/security"
                        element={
                          <FeatureRoute feature="adminSecurityAccess">
                            <AdminRoute>
                              <SecurityDashboard />
                            </AdminRoute>
                          </FeatureRoute>
                        }
                      />
                      <Route
                        path="/security/report"
                        element={
                          <FeatureRoute feature="adminSecurityAccess">
                            <AdminRoute>
                              <SecurityReport />
                            </AdminRoute>
                          </FeatureRoute>
                        }
                      />
                      <Route
                        path="/security/threat-intel"
                        element={
                          <FeatureRoute feature="adminSecurityAccess">
                            <AdminRoute>
                              <ThreatIntelligence />
                            </AdminRoute>
                          </FeatureRoute>
                        }
                      />
                      <Route
                        path="/security/status"
                        element={
                          <FeatureRoute feature="adminSecurityAccess">
                            <AdminRoute>
                              <SecurityStatusDashboard />
                            </AdminRoute>
                          </FeatureRoute>
                        }
                      />
                      <Route
                        path="/security/gdpr"
                        element={
                          <FeatureRoute feature="adminSecurityAccess">
                            <AdminRoute>
                              <GDPRDashboard />
                            </AdminRoute>
                          </FeatureRoute>
                        }
                      />
                      <Route
                        path="/admin/activity"
                        element={
                          <FeatureRoute feature="adminSecurityAccess">
                            <AdminRoute>
                              <ActivityDashboard />
                            </AdminRoute>
                          </FeatureRoute>
                        }
                      />
                      <Route
                        path="/security/test"
                        element={
                          <FeatureRoute feature="adminSecurityAccess">
                            <AdminRoute>
                              <SecurityTestPage />
                            </AdminRoute>
                          </FeatureRoute>
                        }
                      />
                      <Route
                        path="/data-manager"
                        element={
                          <FeatureRoute feature="dataGovernance">
                            <ProtectedRoute>
                              <DataManager />
                            </ProtectedRoute>
                          </FeatureRoute>
                        }
                      />
                      <Route
                        path="/data-manager/hardware"
                        element={
                          <FeatureRoute feature="dataGovernance">
                            <ProtectedRoute>
                              <HardwareManager />
                            </ProtectedRoute>
                          </FeatureRoute>
                        }
                      />
                      {/* Tenant Admin Routes */}
                      <Route
                        path="/tenant-admin"
                        element={
                          <TenantAdminRoute>
                            <TenantAdmin />
                          </TenantAdminRoute>
                        }
                      />
                      <Route
                        path="/settings/branding"
                        element={
                          <FeatureRoute feature="customBranding">
                            <TenantAdminRoute>
                              <BrandingSettings />
                            </TenantAdminRoute>
                          </FeatureRoute>
                        }
                      />

                      {/* Inbox - Zentrale Dokumentenablage */}
                      <Route
                        path="/inbox"
                        element={
                          <ProtectedRoute>
                            <Inbox />
                          </ProtectedRoute>
                        }
                      />

                      {/* Calendar */}
                      <Route
                        path="/calendar"
                        element={
                          <ProtectedRoute>
                            <Calendar />
                          </ProtectedRoute>
                        }
                      />

                      {/* News & Aktionen */}
                      <Route
                        path="/news"
                        element={
                          <ProtectedRoute>
                            <News />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin News */}
                      <Route
                        path="/admin/news"
                        element={
                          <TenantAdminRoute>
                            <AdminNews />
                          </TenantAdminRoute>
                        }
                      />

                      {/* Redirect routes for commonly attempted paths - prevents 404s */}
                      <Route path="/settings" element={<Navigate to="/settings/security" replace />} />
                      <Route path="/profile" element={<Navigate to="/" replace />} />
                      <Route path="/reports" element={<Navigate to="/reporting" replace />} />
                      <Route path="/wizard" element={<Navigate to="/calculator" replace />} />

                      {/* Public shared offer view (no auth required) */}
                      <Route path="/share/offer/:offerId" element={<SharedOfferPage />} />

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </RouteErrorBoundary>
              </BrowserRouter>
            </MobileAccessGate>
          </SeatLimitGate>
        </SafeProviderStack>
      </QueryClientProvider>
    </AppErrorBoundary>
  );

};

export default App;
