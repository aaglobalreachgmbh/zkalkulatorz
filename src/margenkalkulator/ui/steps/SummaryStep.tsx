// ============================================
// SummaryStep - Final wizard step with full summary
// ============================================

import { useState } from "react";
import {
  Building2, User, FileText, Tag, Coins, TrendingUp,
  Sparkles, Mail, Calendar, Download, Save, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { DealerOnly } from "@/components/guards/ViewModeGuards";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import type { Customer } from "../../hooks/useCustomers";
import { MarginBadge } from "../components/MarginBadge";
import { ProvisionBreakdown } from "../components/ProvisionBreakdown";
import { ProfitabilityTrafficLight } from "../components/ProfitabilityTrafficLight";
import { AiRecommendationsPanel } from "../components/AiRecommendationsPanel";
import { PdfDownloadButton } from "../components/PdfDownloadButton";
import { QuickSaveOfferButton } from "../components/QuickSaveOfferButton";
import { CreateCalendarEventModal } from "../components/CreateCalendarEventModal";
import { SendOfferEmailModal } from "../components/SendOfferEmailModal";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { formatCurrency, getProfitabilityStatus, calculateMarginPercent } from "../../lib/formatters";

interface SummaryStepProps {
  option: OfferOptionState;
  result: CalculationResult;
  viewMode: ViewMode;
  customer?: Customer | null;
  className?: string;
}

export function SummaryStep({
  option,
  result,
  viewMode,
  customer,
  className,
}: SummaryStepProps) {
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showDealerEconomics = visibility.showDealerEconomics;

  const [sectionsOpen, setSectionsOpen] = useState({
    customer: true,
    contracts: true,
    discounts: true,
    provisions: true,
    margin: true,
    ai: false,
  });

  const toggleSection = (key: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculations
  const margin = result.dealer.margin;
  const quantity = option.mobile.quantity;
  const marginPerContract = margin / quantity;
  const status = getProfitabilityStatus(marginPerContract);
  const totalRevenue = result.totals.sumTermNet;
  const marginPercent = calculateMarginPercent(margin, totalRevenue);

  // Discounts
  const teamDealActive = quantity >= 3;
  const gigaKombiActive = option.fixedNet.enabled && option.mobile.tariffId.toLowerCase().includes("prime");
  const hasDiscounts = teamDealActive || gigaKombiActive;

  // Tariff name
  const tariffName = option.mobile.tariffId?.replace(/_/g, " ") || "Kein Tarif";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Customer Section */}
      {customer && (
        <Collapsible open={sectionsOpen.customer} onOpenChange={() => toggleSection("customer")}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Kunde
                  </CardTitle>
                  {sectionsOpen.customer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{customer.company_name}</span>
                  {customer.vip_kunde && (
                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">VIP</Badge>
                  )}
                </div>
                {customer.contact_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{customer.contact_name}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Contracts Section */}
      <Collapsible open={sectionsOpen.contracts} onOpenChange={() => toggleSection("contracts")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Verträge ({quantity})
                </CardTitle>
                {sectionsOpen.contracts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarif</span>
                <span className="font-medium">{quantity}× {tariffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Laufzeit</span>
                <span>{option.meta.termMonths} Monate</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vertragsart</span>
                <Badge variant="outline" className="text-xs">
                  {option.mobile.contractType === "new" ? "Neuvertrag" : "Verlängerung"}
                </Badge>
              </div>
              {option.hardware.name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hardware</span>
                  <span>{option.hardware.name}</span>
                </div>
              )}
              <DealerOnly viewMode={visibility.effectiveMode}>
                {option.hardware.ekNet > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hardware EK</span>
                    <span>{formatCurrency(option.hardware.ekNet)}</span>
                  </div>
                )}
              </DealerOnly>
              {option.fixedNet.enabled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Festnetz</span>
                  <span>{option.fixedNet.productId?.replace(/_/g, " ")}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-medium">
                <span>Ø Monatlich</span>
                <span>{formatCurrency(result.totals.avgTermNet)}</span>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Discounts Section */}
      {hasDiscounts && (
        <Collapsible open={sectionsOpen.discounts} onOpenChange={() => toggleSection("discounts")}>
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-emerald-500/10 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Tag className="w-4 h-4" />
                    Aktive Rabatte
                  </CardTitle>
                  {sectionsOpen.discounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-2 text-sm">
                {teamDealActive && (
                  <div className="flex justify-between items-center text-emerald-800 dark:text-emerald-300">
                    <span>TeamDeal {quantity >= 5 ? "(>5 Verträge)" : "(>3 Verträge)"}</span>
                    <span className="font-medium">
                      -{quantity >= 5 ? "10" : quantity >= 3 ? "5" : "0"}%
                    </span>
                  </div>
                )}
                {gigaKombiActive && (
                  <div className="flex justify-between items-center text-emerald-800 dark:text-emerald-300">
                    <span>GigaKombi Setup</span>
                    <span className="font-medium">
                      -5,00 € / Monat
                    </span>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Dealer-Only Sections */}
      {/* Dealer-Only Sections */}
      <DealerOnly viewMode={visibility.effectiveMode}>
        <>
          {/* Provisions Section */}
          <Collapsible open={sectionsOpen.provisions} onOpenChange={() => toggleSection("provisions")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Coins className="w-4 h-4 text-primary" />
                      Provisionen
                    </CardTitle>
                    {sectionsOpen.provisions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <ProvisionBreakdown
                    airtimeProvision={result.dealer.provisionAfter}
                    airtimeMonthly={result.dealer.provisionAfter / option.meta.termMonths}
                    oneTimeProvision={result.dealer.provisionBase}
                    hardwareProvision={result.dealer.fixedNetProvision || 0}
                    termMonths={option.meta.termMonths as 24 | 36}
                    contractCount={quantity}
                    compact
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Margin Section */}
          <Collapsible open={sectionsOpen.margin} onOpenChange={() => toggleSection("margin")}>
            <Card className={cn(
              status === "critical" && "border-red-500/50 bg-red-500/5",
              status === "warning" && "border-amber-500/50 bg-amber-500/5",
              status === "positive" && "border-emerald-500/50 bg-emerald-500/5"
            )}>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Margen-Analyse
                    </CardTitle>
                    {sectionsOpen.margin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Netto-Marge</span>
                    <MarginBadge
                      margin={margin}
                      marginPercentage={marginPercent}
                      size="lg"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pro Vertrag</span>
                    <span className="font-medium">{formatCurrency(marginPerContract)}</span>
                  </div>
                  <ProfitabilityTrafficLight
                    marginTotal={margin}
                    marginPercentage={marginPercent}
                    profitabilityStatus={status}
                    contractCount={quantity}
                    compact
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* AI Recommendations */}
          <Collapsible open={sectionsOpen.ai} onOpenChange={() => toggleSection("ai")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      KI-Empfehlungen
                    </CardTitle>
                    {sectionsOpen.ai ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <AiRecommendationsPanel
                    config={option}
                    result={result}
                    compact
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </>
      </DealerOnly>

      {/* Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Aktionen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="w-full">
            <QuickSaveOfferButton
              config={option}
              result={result}
              variant="default"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SendOfferEmailModal
              trigger={
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  E-Mail
                </Button>
              }
            />
            <CreateCalendarEventModal
              trigger={
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Calendar className="w-4 h-4" />
                  Termin
                </Button>
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <PdfDownloadButton
              option={option}
              result={result}
              variant="outline"
              size="sm"
              type="customer"
              viewMode={viewMode}
            />
            <DealerOnly viewMode={visibility.effectiveMode}>
              <PdfDownloadButton
                option={option}
                result={result}
                variant="outline"
                size="sm"
                type="dealer"
                viewMode={viewMode}
              />
            </DealerOnly>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
