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
import Index from "./pages/Index";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SecurityErrorBoundary>
      <SecurityProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
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
              path="/data-manager"
              element={
                <ProtectedRoute>
                  <DataManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-manager/hardware"
              element={
                <ProtectedRoute>
                  <HardwareManager />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
      </SecurityProvider>
    </SecurityErrorBoundary>
  </QueryClientProvider>
);

export default App;
