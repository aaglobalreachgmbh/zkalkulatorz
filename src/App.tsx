import { Suspense, lazy, useState, useEffect, Component, type ReactNode, type ErrorInfo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { TenantAdminRoute } from "@/components/TenantAdminRoute";
import { SecurityProvider } from "@/providers/SecurityProvider";
import { SecurityErrorBoundary } from "@/components/SecurityErrorBoundary";
import { OfflineBoundary } from "@/components/OfflineBoundary";
import { IdentityProvider } from "@/contexts/IdentityContext";
import { CustomerSessionProvider } from "@/contexts/CustomerSessionContext";
import { POSModeProvider } from "@/contexts/POSModeContext";
import { SeatLimitGate } from "@/components/SeatLimitGate";
import { FeatureRoute } from "@/components/FeatureRoute";
import { MobileAccessGate } from "@/components/MobileAccessGate";
import { OfferBasketProvider } from "@/margenkalkulator/contexts";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// P1 FIX: Enhanced loading fallback with timeout and retry
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

// P1 FIX: Route-level Error Boundary to prevent white screens
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
    console.error("[RouteErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <span className="text-destructive text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold">Seite konnte nicht geladen werden</h2>
            <p className="text-muted-foreground text-sm">
              Ein Fehler ist aufgetreten. Bitte laden Sie die Seite neu.
            </p>
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Seite neu laden
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// QueryClient with optimized caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache retention (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
    },
  },
});

// Seiten die immer auf allen Geräten erlaubt sind
const ALWAYS_ALLOWED_PATHS = ["/auth", "/datenschutz", "/license", "/pending-approval"];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SecurityErrorBoundary>
      <SecurityProvider>
        <OfflineBoundary>
          <TooltipProvider>
            <AuthProvider>
              <IdentityProvider>
                <CustomerSessionProvider>
                  <POSModeProvider>
                    <OfferBasketProvider>
                      <SeatLimitGate>
                      <MobileAccessGate allowedPaths={ALWAYS_ALLOWED_PATHS}>
                        <Toaster />
                        <Sonner />
                      <BrowserRouter>
                    <RouteErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public routes - no authentication required */}
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/datenschutz" element={<Privacy />} />
                      <Route path="/pending-approval" element={<PendingApproval />} />
                      
                      {/* ALL other routes require authentication */}
                      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                      <Route path="/calculator" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                      <Route path="/bundles" element={<ProtectedRoute><Bundles /></ProtectedRoute>} />
                      <Route path="/daten" element={<ProtectedRoute><DataHub /></ProtectedRoute>} />
                      <Route path="/license" element={<ProtectedRoute><License /></ProtectedRoute>} />
                      
                      {/* Admin routes */}
                      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                      <Route path="/admin/employees" element={<AdminRoute><AdminEmployees /></AdminRoute>} />
                      <Route path="/admin/push-provisions" element={<AdminRoute><AdminPushProvisions /></AdminRoute>} />
                      <Route path="/admin/quantity-bonus" element={<AdminRoute><AdminQuantityBonus /></AdminRoute>} />
                      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                      
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
                            <OfferDetail />
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
                  </OfferBasketProvider>
                </POSModeProvider>
                </CustomerSessionProvider>
              </IdentityProvider>
            </AuthProvider>
          </TooltipProvider>
        </OfflineBoundary>
      </SecurityProvider>
    </SecurityErrorBoundary>
  </QueryClientProvider>
);

export default App;
