// ============================================
// Mode Selector - Screenshot Rebuild
// Flat, dark-themed dropdown
// ============================================

import { Eye, Calculator, Lock, Unlock, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10",
            isSessionActive && "text-amber-400 hover:text-amber-300"
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

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase tracking-wider">
          Ansichtsmodus
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => onChange("customer")}
          disabled={!allowCustomerMode || isSessionActive}
          className={cn("gap-2.5 cursor-pointer text-sm", isCustomerMode && "bg-gray-50")}
        >
          <Eye className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <p className="font-medium">Kundenansicht</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onChange("dealer")}
          disabled={isSessionActive}
          className={cn("gap-2.5 cursor-pointer text-sm", isDealerMode && "bg-gray-50")}
        >
          <Calculator className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <p className="font-medium">Händleransicht</p>
          </div>
        </DropdownMenuItem>

        {hasAdminFullVisibility && isCustomerMode && !isSessionActive && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 flex items-center gap-2 text-amber-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[11px]">Admin-Vollsicht aktiv</span>
            </div>
          </>
        )}

        {showSessionToggle && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={toggleSession}
              className={cn(
                "gap-2.5 cursor-pointer text-sm",
                isSessionActive && "text-amber-700"
              )}
            >
              {isSessionActive ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4 text-gray-400" />
              )}
              <span className="font-medium">
                {isSessionActive ? "Sitzung beenden" : "Kundensitzung"}
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
