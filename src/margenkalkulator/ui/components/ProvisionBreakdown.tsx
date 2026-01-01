// ============================================
// ProvisionBreakdown Component
// Shows detailed provision sources
// ============================================

import { Coins, Smartphone, Radio, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "../../lib/formatters";

interface ProvisionBreakdownProps {
  airtimeProvision: number;
  airtimeMonthly: number;
  oneTimeProvision: number;
  hardwareProvision: number;
  termMonths: 24 | 36;
  contractCount: number;
  compact?: boolean;
  className?: string;
}

export function ProvisionBreakdown({
  airtimeProvision,
  airtimeMonthly,
  oneTimeProvision,
  hardwareProvision,
  termMonths,
  contractCount,
  compact = false,
  className,
}: ProvisionBreakdownProps) {
  const totalProvision = airtimeProvision + oneTimeProvision + hardwareProvision;
  const monthlyTotal = airtimeMonthly * contractCount;

  const items = [
    {
      id: "airtime",
      label: "Airtime-Provision",
      icon: Radio,
      total: airtimeProvision,
      monthly: airtimeMonthly,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "onetime",
      label: "Einmal-Provision",
      icon: Gift,
      total: oneTimeProvision,
      monthly: null,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      id: "hardware",
      label: "Hardware-Provision",
      icon: Smartphone,
      total: hardwareProvision,
      monthly: null,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ].filter(item => item.total > 0);

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-xs text-muted-foreground font-medium">Provisionen</p>
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <item.icon className={cn("w-3.5 h-3.5", item.color)} />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
            <span className={cn("font-medium", item.color)}>
              +{formatCurrency(item.total)}
            </span>
          </div>
        ))}
        <div className="border-t border-border pt-2 flex justify-between text-sm font-medium">
          <span>Gesamt ({termMonths} Monate)</span>
          <span className="text-emerald-600">+{formatCurrency(totalProvision)}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          Provisions-Aufschlüsselung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              item.bgColor
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bgColor)}>
                <item.icon className={cn("w-4 h-4", item.color)} />
              </div>
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                {item.monthly !== null && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.monthly)}/Monat × {contractCount} Vertr.
                  </p>
                )}
              </div>
            </div>
            <span className={cn("font-bold", item.color)}>
              +{formatCurrency(item.total)}
            </span>
          </div>
        ))}

        <div className="border-t border-border pt-3 mt-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">Gesamt-Provision</p>
              <p className="text-xs text-muted-foreground">über {termMonths} Monate</p>
            </div>
            <span className="text-xl font-bold text-emerald-600">
              +{formatCurrency(totalProvision)}
            </span>
          </div>
          {monthlyTotal > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Davon monatlich: {formatCurrency(monthlyTotal)}/Monat
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
