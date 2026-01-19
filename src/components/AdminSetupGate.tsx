// ============================================
// Admin Setup Gate
// Zwingt Admins zur Ersteinrichtung vor App-Nutzung
// ============================================

import { useState, useEffect } from "react";
import { useAdminSetupStatus } from "@/hooks/useAdminSetupStatus";
import { AdminSetupWizard } from "@/components/admin-setup";
import { Loader2 } from "lucide-react";

interface AdminSetupGateProps {
  children: React.ReactNode;
}

export function AdminSetupGate({ children }: AdminSetupGateProps) {
  const { needsSetup, isLoading } = useAdminSetupStatus();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (needsSetup && !showWizard) {
      setShowWizard(true);
    }
  }, [needsSetup, showWizard]);

  // Während Laden: Kinder normal anzeigen (kein Flackern)
  if (isLoading) {
    return <>{children}</>;
  }

  // Wizard anzeigen wenn Setup benötigt
  if (showWizard && needsSetup) {
    return <AdminSetupWizard onComplete={() => setShowWizard(false)} />;
  }

  return <>{children}</>;
}
