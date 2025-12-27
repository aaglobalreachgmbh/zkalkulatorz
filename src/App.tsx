import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { SecurityProvider } from "@/providers/SecurityProvider";
import { SecurityErrorBoundary } from "@/components/SecurityErrorBoundary";
import { OfflineBoundary } from "@/components/OfflineBoundary";
import { IdentityProvider } from "@/contexts/IdentityContext";
import { CustomerSessionProvider } from "@/contexts/CustomerSessionContext";
import { SeatLimitGate } from "@/components/SeatLimitGate";
import { FeatureRoute } from "@/components/FeatureRoute";
import { MobileAccessGate } from "@/components/MobileAccessGate";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Bundles from "./pages/Bundles";
import NotFound from "./pages/NotFound";
import DataManager from "./pages/DataManager";
import HardwareManager from "./pages/HardwareManager";
import Auth from "./pages/Auth";
import SecurityDashboard from "./pages/SecurityDashboard";
import Customers from "./pages/Customers";
import MoccaImport from "./pages/MoccaImport";
import Team from "./pages/Team";
import Offers from "./pages/Offers";
import Reporting from "./pages/Reporting";
import SecuritySettings from "./pages/SecuritySettings";
import Admin from "./pages/Admin";
import AdminEmployees from "./pages/AdminEmployees";
import AdminPushProvisions from "./pages/AdminPushProvisions";
import License from "./pages/License";
import SecurityReport from "./pages/SecurityReport";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import SecurityStatusDashboard from "./pages/SecurityStatusDashboard";
import Privacy from "./pages/Privacy";
import GDPRDashboard from "./pages/GDPRDashboard";
import ActivityDashboard from "./pages/ActivityDashboard";

const queryClient = new QueryClient();

// Seiten die immer auf allen Geräten erlaubt sind
const ALWAYS_ALLOWED_PATHS = ["/auth", "/datenschutz", "/license"];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SecurityErrorBoundary>
      <SecurityProvider>
        <OfflineBoundary>
          <TooltipProvider>
            <AuthProvider>
              <IdentityProvider>
                <CustomerSessionProvider>
                  <SeatLimitGate>
                    <MobileAccessGate allowedPaths={ALWAYS_ALLOWED_PATHS}>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                    <Routes>
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/" element={<Home />} />
                      <Route path="/calculator" element={<Index />} />
                      <Route path="/bundles" element={<Bundles />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/admin/employees" element={<AdminRoute><AdminEmployees /></AdminRoute>} />
                      <Route path="/admin/push-provisions" element={<AdminRoute><AdminPushProvisions /></AdminRoute>} />
                      <Route path="/license" element={<License />} />
                      <Route
                        path="/offers"
                        element={
                          <ProtectedRoute>
                            <Offers />
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
                        path="/customers/import"
                        element={
                          <ProtectedRoute>
                            <MoccaImport />
                          </ProtectedRoute>
                        }
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
                      <Route path="/datenschutz" element={<Privacy />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </BrowserRouter>
                    </MobileAccessGate>
                  </SeatLimitGate>
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
