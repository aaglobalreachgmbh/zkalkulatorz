// ============================================
// CompactConfigSummary - Hero KPI Pattern
// Single-line configuration summary for sidebar
// ============================================

import { Badge } from "@/components/ui/badge";
import { useCalculator } from "../../context/CalculatorContext";
import { cn } from "@/lib/utils";

interface CompactConfigSummaryProps {
  className?: string;
}

export function CompactConfigSummary({ className }: CompactConfigSummaryProps) {
  const { option1: option } = useCalculator();

  // Build configuration parts
  const configParts: string[] = [];
  
  if (option.hardware.name) {
    configParts.push(option.hardware.name);
  } else {
    configParts.push("SIM Only");
  }
  
  if (option.mobile.tariffId) {
    // Clean up tariff name (remove underscores, keep readable)
    const tariffName = option.mobile.tariffId
      .replace(/_/g, " ")
      .replace(/Red Business/i, "Red")
      .replace(/Business/i, "Biz");
    configParts.push(tariffName);
  }

  // Build badges
  const badges: string[] = [];
  
  if (option.mobile.quantity > 1) {
    badges.push(`${option.mobile.quantity}×`);
  }
  
  if (option.mobile.tariffId) {
    badges.push(option.mobile.contractType === "new" ? "Neu" : "VVL");
  }
  
  if (option.fixedNet.enabled) {
    badges.push("GigaKombi");
  }

  const configText = configParts.join(" + ");

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main configuration line */}
      <p className="text-sm font-medium text-foreground truncate" title={configText}>
        {configText}
      </p>
      
      {/* Badges row */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className={cn(
                "text-[10px] h-5 px-1.5 font-medium",
                badge === "GigaKombi" && "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.3)]",
                badge === "Neu" && "bg-primary/10 text-primary",
                badge === "VVL" && "bg-muted text-muted-foreground"
              )}
            >
              {badge}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompactConfigSummary;
