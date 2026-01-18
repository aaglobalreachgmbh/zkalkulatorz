// ============================================
// Quick Actions Widget - Quickstart Icons
// ============================================

import { useNavigate } from "react-router-dom";
import { UserPlus, Search, FileText, Bell } from "lucide-react";
import { useVVLCounts } from "@/margenkalkulator/hooks/useCustomerContracts";
import { useTenantBranding } from "@/hooks/useTenantBranding";

export function QuickActionsWidget() {
  const navigate = useNavigate();
  const vvlCounts = useVVLCounts();
  const { branding } = useTenantBranding();
  
  const urgentVVLCount = vvlCounts.critical;

  const actions = [
    {
      label: "Neuer Kunde",
      icon: UserPlus,
      onClick: () => navigate("/customers?action=new"),
      variant: "primary" as const,
    },
    {
      label: "Kundensuche",
      icon: Search,
      onClick: () => navigate("/customers"),
      variant: "primary" as const,
    },
    {
      label: "Neues Angebot",
      icon: FileText,
      onClick: () => navigate("/calculator"),
      variant: "primary" as const,
    },
    {
      label: "VVL-Liste",
      icon: Bell,
      onClick: () => navigate("/contracts"),
      variant: "warning" as const,
      badge: urgentVVLCount > 0 ? (urgentVVLCount > 9 ? '9+' : String(urgentVVLCount)) : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        const isPrimary = action.variant === "primary";
        
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            className="group flex flex-col items-center gap-2.5 p-4 bg-card border border-border/50 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
            style={{
              ...(isPrimary && branding.primaryColor ? {
                '--hover-border': `${branding.primaryColor}30`,
              } as React.CSSProperties : {})
            }}
          >
            <div 
              className={`relative w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
                isPrimary 
                  ? "bg-primary/8 group-hover:bg-primary/12" 
                  : "bg-amber-500/8 group-hover:bg-amber-500/12"
              }`}
              style={isPrimary && branding.primaryColor ? {
                backgroundColor: `${branding.primaryColor}15`,
              } : undefined}
            >
              <Icon 
                className={`w-5 h-5 ${isPrimary ? "text-primary" : "text-amber-500"}`}
                style={isPrimary && branding.primaryColor ? { color: branding.primaryColor } : undefined}
              />
              {/* VVL Badge */}
              {action.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {action.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
