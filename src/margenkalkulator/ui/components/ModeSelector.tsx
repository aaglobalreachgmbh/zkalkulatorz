// ============================================
// Mode Selector - Consolidated View/Session Control
// Phase 5B: Combines ViewModeToggle + CustomerSession
// ============================================

import { Eye, Calculator, Lock, Unlock, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ViewMode } from "@/margenkalkulator";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  allowCustomerMode?: boolean;
  showSessionToggle?: boolean;
}

export function ModeSelector({ 
  value, 
  onChange, 
  allowCustomerMode = true,
  showSessionToggle = true 
}: ModeSelectorProps) {
  const { session, toggleSession } = useCustomerSession();
  const { hasAdminFullVisibility } = useSensitiveFieldsVisible(value);
  
  const isCustomerMode = value === "customer";
  const isDealerMode = value === "dealer";
  const isSessionActive = session.isActive;
  
  // Determine display label
  const currentLabel = isCustomerMode ? "Kunde" : "Händler";
  const CurrentIcon = isCustomerMode ? Eye : Calculator;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "gap-2 min-w-[100px]",
            isSessionActive && "border-amber-500 bg-amber-500/10"
          )}
        >
          {isSessionActive ? (
            <Lock className="w-4 h-4 text-amber-600" />
          ) : (
            <CurrentIcon className="w-4 h-4" />
          )}
          <span>{isSessionActive ? "Gesichert" : currentLabel}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Ansichtsmodus
        </DropdownMenuLabel>
        
        {/* Customer Mode */}
        <DropdownMenuItem 
          onClick={() => onChange("customer")}
          disabled={!allowCustomerMode || isSessionActive}
          className={cn(
            "gap-3 cursor-pointer",
            isCustomerMode && "bg-accent"
          )}
        >
          <Eye className="w-4 h-4" />
          <div className="flex-1">
            <p className="font-medium">Kundenansicht</p>
            <p className="text-xs text-muted-foreground">Nur Kundenpreise sichtbar</p>
          </div>
          {isCustomerMode && <Badge variant="secondary" className="text-xs">Aktiv</Badge>}
        </DropdownMenuItem>
        
        {/* Dealer Mode */}
        <DropdownMenuItem 
          onClick={() => onChange("dealer")}
          disabled={isSessionActive}
          className={cn(
            "gap-3 cursor-pointer",
            isDealerMode && "bg-accent"
          )}
        >
          <Calculator className="w-4 h-4" />
          <div className="flex-1">
            <p className="font-medium">Händleransicht</p>
            <p className="text-xs text-muted-foreground">EK, Provisionen, Marge</p>
          </div>
          {isDealerMode && <Badge variant="secondary" className="text-xs">Aktiv</Badge>}
        </DropdownMenuItem>
        
        {/* Admin indicator */}
        {hasAdminFullVisibility && isCustomerMode && !isSessionActive && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 flex items-center gap-2 text-amber-600">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs">Admin-Vollsicht aktiv</span>
            </div>
          </>
        )}
        
        {/* Session Toggle */}
        {showSessionToggle && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Sicherheit
            </DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={toggleSession}
              className={cn(
                "gap-3 cursor-pointer",
                isSessionActive && "bg-amber-500/10 text-amber-700 dark:text-amber-300"
              )}
            >
              {isSessionActive ? (
                <>
                  <Lock className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-medium">Kundensitzung beenden</p>
                    <p className="text-xs opacity-70">Händlerdaten wieder freigeben</p>
                  </div>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-medium">Kundensitzung starten</p>
                    <p className="text-xs opacity-70">Alle Händlerdaten sperren</p>
                  </div>
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
