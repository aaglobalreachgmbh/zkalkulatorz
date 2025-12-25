import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SecurityProvider } from "@/providers/SecurityProvider";
import { SecurityErrorBoundary } from "@/components/SecurityErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DataManager from "./pages/DataManager";
import HardwareManager from "./pages/HardwareManager";
import Auth from "./pages/Auth";

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
