// ============================================
// Mode Selector - Redesign: Slim Dropdown
// Same functionality, cleaner visuals
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
  showSessionToggle = true,
}: ModeSelectorProps) {
  const { session, toggleSession } = useCustomerSession();
  const { hasAdminFullVisibility } = useSensitiveFieldsVisible(value);

  const isCustomerMode = value === "customer";
  const isDealerMode = value === "dealer";
  const isSessionActive = session.isActive;

  const currentLabel = isSessionActive ? "Gesichert" : isCustomerMode ? "Kunde" : "Händler";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 min-w-[100px] text-sm font-medium",
            isSessionActive && "border-amber-400 bg-amber-50 text-amber-700"
          )}
        >
          {isSessionActive ? (
            <Lock className="w-3.5 h-3.5" />
          ) : isDealerMode ? (
            <Calculator className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
          {currentLabel}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-gray-500">
          Ansichtsmodus
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => onChange("customer")}
          disabled={!allowCustomerMode || isSessionActive}
          className={cn("gap-3 cursor-pointer", isCustomerMode && "bg-gray-100")}
        >
          <Eye className="w-4 h-4" />
          <div className="flex-1">
            <p className="font-medium text-sm">Kundenansicht</p>
            <p className="text-xs text-gray-500">Nur Kundenpreise</p>
          </div>
          {isCustomerMode && <Badge variant="secondary" className="text-[10px]">Aktiv</Badge>}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onChange("dealer")}
          disabled={isSessionActive}
          className={cn("gap-3 cursor-pointer", isDealerMode && "bg-gray-100")}
        >
          <Calculator className="w-4 h-4" />
          <div className="flex-1">
            <p className="font-medium text-sm">Händleransicht</p>
            <p className="text-xs text-gray-500">EK, Provisionen, Marge</p>
          </div>
          {isDealerMode && <Badge variant="secondary" className="text-[10px]">Aktiv</Badge>}
        </DropdownMenuItem>

        {hasAdminFullVisibility && isCustomerMode && !isSessionActive && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 flex items-center gap-2 text-amber-600">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs">Admin-Vollsicht aktiv</span>
            </div>
          </>
        )}

        {showSessionToggle && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500">
              Sicherheit
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={toggleSession}
              className={cn(
                "gap-3 cursor-pointer",
                isSessionActive && "bg-amber-50 text-amber-700"
              )}
            >
              {isSessionActive ? (
                <>
                  <Lock className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Kundensitzung beenden</p>
                    <p className="text-xs opacity-70">Händlerdaten freigeben</p>
                  </div>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Kundensitzung starten</p>
                    <p className="text-xs opacity-70">Händlerdaten sperren</p>
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
