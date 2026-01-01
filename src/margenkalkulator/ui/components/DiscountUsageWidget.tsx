// ============================================
// DiscountUsageWidget - Dashboard Widget
// Shows discount usage statistics
// ============================================

import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCloudOffers } from "../../hooks/useCloudOffers";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function DiscountUsageWidget() {
  const navigate = useNavigate();
  const { offers, isLoading } = useCloudOffers();

  const stats = useMemo(() => {
    if (offers.length === 0) {
      return {
        teamDeal: 0,
        gigaKombi: 0,
        soho: 0,
        total: 0,
      };
    }

    let teamDealCount = 0;
    let gigaKombiCount = 0;
    let sohoCount = 0;

    offers.forEach(offer => {
      const config = offer.config as { 
        mobile?: { quantity?: number }; 
        fixedNet?: { enabled?: boolean };
      };
      
      // TeamDeal: quantity >= 3
      if ((config.mobile?.quantity ?? 1) >= 3) {
        teamDealCount++;
      }
      
      // GigaKombi: fixed net enabled
      if (config.fixedNet?.enabled) {
        gigaKombiCount++;
      }
      
      // SOHO: estimate based on small quantities and no hardware
      if ((config.mobile?.quantity ?? 1) <= 2) {
        sohoCount++;
      }
    });

    const total = offers.length;
    return {
      teamDeal: Math.round((teamDealCount / total) * 100),
      gigaKombi: Math.round((gigaKombiCount / total) * 100),
      soho: Math.round((sohoCount / total) * 100),
      total,
    };
  }, [offers]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const discounts = [
    { name: "TeamDeal", value: stats.teamDeal, color: "bg-blue-500" },
    { name: "GigaKombi", value: stats.gigaKombi, color: "bg-emerald-500" },
    { name: "SOHO", value: stats.soho, color: "bg-purple-500" },
  ];

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/reporting")}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Rabatt-Nutzung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {discounts.map(discount => (
          <div key={discount.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{discount.name}</span>
              <span className="font-medium">{discount.value}%</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div 
                className={`h-full transition-all ${discount.color}`}
                style={{ width: `${discount.value}%` }}
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-1">
          Basierend auf {stats.total} Angeboten
        </p>
      </CardContent>
    </Card>
  );
}
