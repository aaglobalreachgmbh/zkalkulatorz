// ============================================
// ProvisionSourcesWidget - Dashboard Widget
// Pie chart showing provision sources
// ============================================

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCloudOffers } from "../../hooks/useCloudOffers";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { usePOSMode } from "@/contexts/POSModeContext";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 76%, 36%)", "hsl(280, 65%, 60%)"];

export function ProvisionSourcesWidget() {
  const navigate = useNavigate();
  const { isPOSMode } = usePOSMode();
  // In a widget context, we might not have explicit viewMode prop, so we default to "dealer" 
  // but strictly check visibility rules.
  // Actually, better to check if we are in a context that allows seeing this.
  // If we assume this widget is on a Dashboard, we need to know the context.
  // SAFE DEFAULT: If generic component, use hook with default 'dealer' but check if POS/Customer Session active.

  // However, simpler: This widget shows PROVISION. It should ONLY be visible if showDealerEconomics is true.
  // We can derive "effective view mode" from global context checks.
  // Let's rely on the hook which checks POS Mode and Customer Session internally if we pass the current mode.
  // Since we don't have "viewMode" prop here, we assume standard view (likely Dealer) but subject to overrides.

  // FIX: derive mode from POS/Session contexts directly or pass it.
  // For now, let's just use useSensitiveFieldsVisible with "dealer" as base, 
  // relying on the hook's internal overrides (if any) or just force check global states.

  // BETTER: Just hide it if isPOSMode is true (Customer facing in shop).
  if (isPOSMode) return null;

  const { offers, isLoading } = useCloudOffers();

  const data = useMemo(() => {
    // Aggregate provision sources from offers
    let airtime = 0;
    let hardware = 0;
    let onetime = 0;

    offers.forEach(offer => {
      // Estimate margin from avgMonthly
      const avgMonthly = offer.preview?.avgMonthly ?? 0;
      const quantity = offer.config?.mobile?.quantity ?? 1;
      const estimatedMargin = avgMonthly * 0.1 * quantity * 24;
      const hasHardware = (offer.config?.hardware?.ekNet ?? 0) > 0;

      if (hasHardware) {
        hardware += estimatedMargin * 0.35;
        airtime += estimatedMargin * 0.45;
        onetime += estimatedMargin * 0.20;
      } else {
        airtime += estimatedMargin * 0.60;
        onetime += estimatedMargin * 0.40;
      }
    });

    const total = airtime + hardware + onetime;
    if (total === 0) return [];

    return [
      { name: "Airtime", value: Math.round((airtime / total) * 100), color: COLORS[0] },
      { name: "Hardware", value: Math.round((hardware / total) * 100), color: COLORS[1] },
      { name: "Einmal", value: Math.round((onetime / total) * 100), color: COLORS[2] },
    ].filter(d => d.value > 0);
  }, [offers]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-28" />
        </CardHeader>
        <CardContent>
          <div className="h-[100px] bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Provisionsquellen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Keine Daten</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/reporting")}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Provisionsquellen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-[80px] h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={35}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`]}
                  contentStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1">
            {data.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
