import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVVLCounts } from "@/margenkalkulator/hooks/useCustomerContracts";
import { AlertTriangle, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VVLNotificationBanner() {
  const navigate = useNavigate();
  const counts = useVVLCounts();
  const [dismissed, setDismissed] = useState(false);
  
  // Only show if there are critical VVLs (< 30 days) - with null-safe access
  const criticalCount = counts?.critical ?? 0;
  
  // Reset dismissed state when critical count changes
  useEffect(() => {
    if (criticalCount > 0) {
      // Check sessionStorage to not spam user
      const lastDismissed = sessionStorage.getItem('vvl-banner-dismissed');
      if (lastDismissed) {
        const timestamp = parseInt(lastDismissed, 10);
        // Re-show after 1 hour
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          setDismissed(true);
        }
      }
    }
  }, [criticalCount]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('vvl-banner-dismissed', Date.now().toString());
  };

  if (dismissed || criticalCount === 0) return null;

  return (
    <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-3 animate-fade-in">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-full">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              <span className="text-red-600 font-bold">{criticalCount}</span> 
              {criticalCount === 1 ? ' Vertrag benötigt' : ' Verträge benötigen'} dringend Aufmerksamkeit
            </p>
            <p className="text-xs text-muted-foreground">
              VVL-Datum in weniger als 30 Tagen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="destructive"
            className="h-8"
            onClick={() => navigate("/contracts")}
          >
            <Bell className="h-3 w-3 mr-1" />
            Anzeigen
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
