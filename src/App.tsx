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
import Home from "./pages/Home";
import Index from "./pages/Index";
import Bundles from "./pages/Bundles";
import NotFound from "./pages/NotFound";
import DataManager from "./pages/DataManager";
import HardwareManager from "./pages/HardwareManager";
import Auth from "./pages/Auth";
import SecurityDashboard from "./pages/SecurityDashboard";
import Customers from "./pages/Customers";
import Team from "./pages/Team";
import Offers from "./pages/Offers";
import Reporting from "./pages/Reporting";
import SecuritySettings from "./pages/SecuritySettings";
import Admin from "./pages/Admin";
import License from "./pages/License";
import SecurityReport from "./pages/SecurityReport";
import ThreatIntelligence from "./pages/ThreatIntelligence";

const queryClient = new QueryClient();

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
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                    <Routes>
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/" element={<Home />} />
                      <Route path="/calculator" element={<Index />} />
                      <Route path="/bundles" element={<Bundles />} />
                      <Route path="/admin" element={<Admin />} />
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
                          <AdminRoute>
                            <SecurityDashboard />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/security/report"
                        element={
                          <AdminRoute>
                            <SecurityReport />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/security/threat-intel"
                        element={
                          <AdminRoute>
                            <ThreatIntelligence />
                          </AdminRoute>
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
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </BrowserRouter>
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
