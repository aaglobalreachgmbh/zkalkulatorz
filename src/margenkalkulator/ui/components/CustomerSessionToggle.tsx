// ============================================
// Customer Session Toggle (Safety Lock)
// Phase 3A: Prominent toggle in wizard header
// ============================================

import { Lock, Unlock } from "lucide-react";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { cn } from "@/lib/utils";

interface CustomerSessionToggleProps {
  className?: string;
}

export function CustomerSessionToggle({ className }: CustomerSessionToggleProps) {
  const { session, toggleSession } = useCustomerSession();

  return (
    <button
      onClick={toggleSession}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all",
        session.isActive
          ? "bg-amber-500 text-amber-950 hover:bg-amber-400 ring-2 ring-amber-300"
          : "bg-muted text-muted-foreground hover:bg-muted/80",
        className
      )}
      title={session.isActive ? "Kundensitzung beenden" : "Kundensitzung starten"}
    >
      {session.isActive ? (
        <>
          <Lock className="w-4 h-4" />
          <span>KUNDENSITZUNG</span>
        </>
      ) : (
        <>
          <Unlock className="w-4 h-4" />
          <span>Kundensitzung</span>
        </>
      )}
    </button>
  );
}
