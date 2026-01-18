// ============================================
// Inline Tariff Config - Complete tariff configuration
// ============================================
//
// Appears below selected tariff with:
// - SUB-Variant (Geräteklasse) selection INLINE
// - TARIFF-SPECIFIC discount/promo selection as toggle buttons
// - Live price update with animation
// - Full price breakdown with period transparency
// - Expert options (OMO, FH-Partner) as collapsible
// - "Add to Offer" CTA
//
// Uses getPromosForTariff() to show ONLY applicable promos
// ============================================

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { 
  Plus, Check, Tag, Sparkles, TrendingDown, AlertTriangle, 
  ChevronDown, Calendar, Info, Euro, Smartphone, Settings2, Percent
} from "lucide-react";
import { AnimatedCurrency } from "./AnimatedCurrency";
import { SubVariantSelector } from "./SubVariantSelector";
import { OMORateSelectorEnhanced, type OMORate } from "./OMORateSelectorEnhanced";
import { FHPartnerToggle } from "./FHPartnerToggle";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { getPromosForTariff } from "../../engine/calculators/promo";
import { formatCurrency } from "../../lib/formatters";
import { listSubVariants } from "../../engine/catalogResolver";
import type { 
  MobileTariff, 
  Promo, 
  MobileState, 
  OfferOptionState, 
  CalculationResult,
  ViewMode,
  SubVariant
} from "../../engine/types";

interface InlineTariffConfigProps {
  tariff: MobileTariff;
  mobileState: MobileState;
  /** ALL promos - will be filtered to tariff-specific */
  allPromos: Promo[];
  /** Full offer option for basket */
  fullOption: OfferOptionState;
  /** Pre-calculated result */
  result: CalculationResult;
  viewMode: ViewMode;
  quantityBonus?: number;
  /** Reference date for promo validity check */
  asOfISO?: string;
  /** Hardware name for SUB auto-inference */
  hardwareName?: string;
  onPromoChange: (promoId: string) => void;
  onSubVariantChange?: (subVariantId: string) => void;
  onOmoChange?: (omoRate: number) => void;
  onFHPartnerChange?: (checked: boolean) => void;
  onAddedToOffer?: () => void;
}

export function InlineTariffConfig({
  tariff,
  mobileState,
  allPromos,
  fullOption,
  result,
  viewMode,
  quantityBonus = 0,
  asOfISO,
  hardwareName = "",
  onPromoChange,
  onSubVariantChange,
  onOmoChange,
  onFHPartnerChange,
  onAddedToOffer,
}: InlineTariffConfigProps) {
  const { addItem, items } = useOfferBasket();
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showDealerEconomics = visibility.showDealerEconomics;
  const showOmoSelector = visibility.showOmoSelector;
  const showFhPartnerToggle = visibility.showFhPartnerToggle;
  
  const [expertOptionsOpen, setExpertOptionsOpen] = useState(false);
  
  // Get SUB variants for this tariff
  const subVariants = useMemo(() => {
    return listSubVariants(fullOption.meta.datasetVersion);
  }, [fullOption.meta.datasetVersion]);
  
  // Filter promos for THIS SPECIFIC tariff
  const tariffPromos = useMemo(() => {
    return getPromosForTariff(allPromos, tariff.id, asOfISO);
  }, [allPromos, tariff.id, asOfISO]);
  
  // Get selected SUB variant for price display
  const selectedSubVariant = subVariants.find(v => v.id === mobileState.subVariantId);
  const subVariantAddOn = selectedSubVariant?.monthlyAddNet || 0;
  
  // Calculate prices including SUB
  const basePrice = tariff.baseNet;
  const effectiveBasePrice = basePrice + subVariantAddOn;
  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;
  const hasDiscount = avgMonthly < effectiveBasePrice;
  const savingsPerMonth = effectiveBasePrice - avgMonthly;
  const savingsPercent = effectiveBasePrice > 0 ? (savingsPerMonth / effectiveBasePrice) * 100 : 0;
  
  // OMO is active?
  const omoActive = (mobileState.omoRate ?? 0) > 0;
  
  // Selected promo
  const selectedPromo = tariffPromos.find(p => p.id === mobileState.promoId);
  const hasSelectedPromo = mobileState.promoId && mobileState.promoId !== "NONE";
  
  // Has expert options available?
  const hasExpertOptions = (showOmoSelector || showFhPartnerToggle) && tariff.family !== "teamdeal";
  
  // Calculate period breakdown for transparency
  const periods = useMemo(() => {
    const termMonths = fullOption.meta.termMonths || 24;
    
    if (!selectedPromo || selectedPromo.id === "NONE" || selectedPromo.type === "NONE") {
      return [{ from: 1, to: termMonths, price: effectiveBasePrice, label: "Vertragslaufzeit", isBase: true }];
    }
    
    const promoMonths = selectedPromo.durationMonths || 0;
    
    if (selectedPromo.type === "INTRO_PRICE") {
      const introPrice = selectedPromo.value + subVariantAddOn;
      if (promoMonths >= termMonths) {
        return [{ from: 1, to: termMonths, price: introPrice, label: "Aktionszeitraum", isBase: false }];
      }
      return [
        { from: 1, to: promoMonths, price: introPrice, label: "Aktionszeitraum", isBase: false },
        { from: promoMonths + 1, to: termMonths, price: effectiveBasePrice, label: "Regulärer Preis", isBase: true },
      ];
    }
    
    if (selectedPromo.type === "PCT_OFF_BASE") {
      const discountedPrice = basePrice * (1 - selectedPromo.value) + subVariantAddOn;
      if (promoMonths >= termMonths) {
        return [{ from: 1, to: termMonths, price: discountedPrice, label: "Aktionspreis", isBase: false }];
      }
      return [
        { from: 1, to: promoMonths, price: discountedPrice, label: "Aktionspreis", isBase: false },
        { from: promoMonths + 1, to: termMonths, price: effectiveBasePrice, label: "Regulärer Preis", isBase: true },
      ];
    }
    
    if (selectedPromo.type === "ABS_OFF_BASE") {
      const discountedPrice = basePrice - (selectedPromo.amountNetPerMonth || 0) + subVariantAddOn;
      if (promoMonths >= termMonths) {
        return [{ from: 1, to: termMonths, price: discountedPrice, label: "Aktionspreis", isBase: false }];
      }
      return [
        { from: 1, to: promoMonths, price: discountedPrice, label: "Aktionspreis", isBase: false },
        { from: promoMonths + 1, to: termMonths, price: effectiveBasePrice, label: "Regulärer Preis", isBase: true },
      ];
    }
    
    return [{ from: 1, to: 24, price: effectiveBasePrice, label: "Vertragslaufzeit", isBase: true }];
  }, [selectedPromo, basePrice, subVariantAddOn, effectiveBasePrice, fullOption.meta.termMonths]);
  
  // Generate tariff name for basket
  const tariffName = useMemo(() => {
    const parts = [tariff.name];
    if (mobileState.quantity > 1) {
      parts.push(`(×${mobileState.quantity})`);
    }
    if (fullOption.hardware.ekNet > 0) {
      parts.push(`+ ${fullOption.hardware.name}`);
    }
    return parts.join(" ");
  }, [tariff, mobileState.quantity, fullOption.hardware]);
  
  // Check if already in basket
  const isAlreadyAdded = items.some(
    item => 
      item.option.mobile.tariffId === mobileState.tariffId &&
      item.option.hardware.name === fullOption.hardware.name &&
      item.option.mobile.contractType === mobileState.contractType
  );
  
  const handleAdd = () => {
    addItem(tariffName, fullOption, result);
    toast.success(`"${tariffName}" zum Angebot hinzugefügt`, {
      description: mobileState.quantity > 1 ? `${mobileState.quantity} Verträge` : undefined,
      duration: 2000, // Shorter toast duration for rapid workflows
    });
    fireConfetti({ duration: 1000, quick: true }); // Quick mode for faster workflows
    onAddedToOffer?.();
  };
  
  // Filter promos - exclude NONE for buttons
  const availablePromos = tariffPromos.filter(p => p.id !== "NONE");
  const hasAvailablePromos = availablePromos.length > 0;
  
  const marginColor = margin >= 100 ? "text-emerald-600" : margin >= 0 ? "text-amber-600" : "text-red-600";
  
  return (
    <div className="mt-4 p-5 rounded-xl border-2 border-primary/30 bg-primary/5 animate-fade-in">
      {/* Header with Base Price */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">{tariff.name} ausgewählt</span>
          {mobileState.quantity > 1 && (
            <Badge variant="secondary">{mobileState.quantity}x</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Euro className="w-3.5 h-3.5" />
          <span>Basis: {formatCurrency(basePrice)}</span>
        </div>
      </div>
      
      {/* OMO Warning */}
      {omoActive && (
        <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            OMO-Rate ({mobileState.omoRate}%) aktiv – Rabatte deaktiviert
          </AlertDescription>
        </Alert>
      )}
      
      {/* SUB Variant Selection - INLINE */}
      {onSubVariantChange && tariff.family !== "teamdeal" && (
        <div className="mb-5 p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium text-muted-foreground">
              Geräteklasse (SUB)
            </Label>
            <HelpTooltip term="sub" />
          </div>
          <SubVariantSelector
            value={mobileState.subVariantId}
            onChange={onSubVariantChange}
            hardwareName={hardwareName}
            allowedSubVariants={tariff.allowedSubVariants}
            subVariants={subVariants}
          />
          {subVariantAddOn > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              → Aufpreis: +{subVariantAddOn}€/mtl. = Effektiv: {formatCurrency(effectiveBasePrice)}/mtl.
            </p>
          )}
        </div>
      )}
      
      {/* Discount Toggle Buttons */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Rabatt wählen
            {!hasAvailablePromos && (
              <span className="text-xs ml-2 text-amber-600">(keine verfügbar für diesen Tarif)</span>
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* No Discount */}
          <button
            onClick={() => onPromoChange("NONE")}
            disabled={omoActive}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
              !hasSelectedPromo && !omoActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50",
              omoActive && "opacity-50 cursor-not-allowed"
            )}
          >
            Kein Rabatt
          </button>
          
          {/* Tariff-Specific Promos */}
          {availablePromos.map((promo) => {
            const isSelected = mobileState.promoId === promo.id;
            const isDisabled = omoActive;
            
            // Short label for button
            let shortLabel = promo.label;
            if (promo.type === "PCT_OFF_BASE") {
              shortLabel = `-${(promo.value * 100).toFixed(0)}%`;
            } else if (promo.type === "ABS_OFF_BASE" && promo.amountNetPerMonth) {
              shortLabel = `-${promo.amountNetPerMonth}€`;
            } else if (promo.type === "INTRO_PRICE") {
              shortLabel = `${promo.durationMonths}M gratis`;
            }
            
            return (
              <button
                key={promo.id}
                onClick={() => {
                  if (!isDisabled) {
                    // Reset OMO when selecting promo
                    if (omoActive && onOmoChange) {
                      onOmoChange(0);
                    }
                    onPromoChange(promo.id);
                  }
                }}
                disabled={isDisabled}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/50",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>
        
        {/* Promo description with validity period */}
        {selectedPromo && selectedPromo.id !== "NONE" && (
          <div className="mt-2 p-2 rounded-md bg-muted/50 text-sm">
            <p className="text-muted-foreground">
              {selectedPromo.type === "INTRO_PRICE" && `${selectedPromo.durationMonths} Monate Grundgebühr entfällt`}
              {selectedPromo.type === "PCT_OFF_BASE" && `${(selectedPromo.value * 100).toFixed(0)}% Rabatt für ${selectedPromo.durationMonths} Monate`}
              {selectedPromo.type === "ABS_OFF_BASE" && `−${selectedPromo.amountNetPerMonth}€/mtl. für ${selectedPromo.durationMonths} Monate`}
            </p>
            {selectedPromo.eligibilityNote && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {selectedPromo.eligibilityNote}
              </p>
            )}
            {selectedPromo.validUntilISO && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Gültig bis {new Date(selectedPromo.validUntilISO).toLocaleDateString("de-DE")}
              </p>
            )}
          </div>
        )}
      </div>
      
      
      {/* OMO Quick-Access (extracted from Experten-Optionen) */}
      {showOmoSelector && onOmoChange && tariff.family !== "teamdeal" && (
        <div className="mb-4 p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">OMO-Rate</Label>
              <HelpTooltip term="omo" />
            </div>
            <div className="flex-1 max-w-xs">
              <OMORateSelectorEnhanced
                value={(mobileState.omoRate ?? 0) as OMORate}
                onChange={(rate) => {
                  // OMO und Promo sind nicht kombinierbar
                  if (rate > 0 && mobileState.promoId !== "NONE") {
                    onOmoChange(rate);
                    onPromoChange("NONE");
                  } else {
                    onOmoChange(rate);
                  }
                }}
                tariff={tariff}
                contractType={mobileState.contractType}
              />
            </div>
          </div>
          {(mobileState.omoRate ?? 0) > 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ OMO-Rabatte und Aktionen sind nicht kombinierbar
            </p>
          )}
        </div>
      )}

      {/* Price Breakdown (Collapsible) */}
      {periods.length > 1 && (
        <Collapsible className="mb-4">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-full">
            <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
            <span>Preisübersicht nach Zeitraum</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="grid gap-2 p-3 rounded-lg bg-muted/30 border border-border">
              {periods.map((period, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex items-center justify-between py-1 px-2 rounded",
                    !period.isBase && "bg-emerald-500/10"
                  )}
                >
                  <span className="text-sm">
                    <span className="font-medium">Monat {period.from}–{period.to}</span>
                    <span className="text-muted-foreground ml-2">({period.label})</span>
                  </span>
                  <span className={cn(
                    "font-semibold",
                    !period.isBase && "text-emerald-600"
                  )}>
                    {formatCurrency(period.price)}/mtl.
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* FH-Partner Toggle (simplified - only this remains in collapsible) */}
      {showFhPartnerToggle && onFHPartnerChange && tariff.family !== "teamdeal" && (
        <Collapsible open={expertOptionsOpen} onOpenChange={setExpertOptionsOpen} className="mb-4">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between p-3 h-auto bg-muted/50 hover:bg-muted text-sm"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                <span className="font-medium">Weitere Optionen</span>
                <span className="text-xs text-muted-foreground">(FH-Partner)</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", expertOptionsOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="p-4 bg-card rounded-lg border border-border">
              <FHPartnerToggle
                checked={mobileState.isFHPartner ?? false}
                onChange={onFHPartnerChange}
                fhPartnerProvision={tariff.fhPartnerNet}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Price Display */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border mb-4">
        {/* Left: Price */}
        <div className="flex items-baseline gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ø Monatspreis</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                <AnimatedCurrency value={avgMonthly} decimals={2} />
              </span>
              <span className="text-muted-foreground">€</span>
            </div>
          </div>
          
          {/* Savings Badge */}
          {hasDiscount && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1">
              <TrendingDown className="w-3 h-3" />
              -{savingsPercent.toFixed(0)}%
            </Badge>
          )}
        </div>
        
        {/* Right: Margin (Dealer only) */}
        {showDealerEconomics && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Marge</p>
            <p className={cn("text-2xl font-bold", marginColor)}>
              <AnimatedCurrency value={margin} variant="margin" decimals={0} />
            </p>
          </div>
        )}
      </div>
      
      {/* CTA Button */}
      <div className="flex gap-3">
        {isAlreadyAdded ? (
          <div className="flex items-center gap-3 flex-1">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 py-2 px-4">
              <Check className="w-4 h-4 mr-2" />
              Im Angebot enthalten
            </Badge>
            {onAddedToOffer && (
              <Button
                variant="outline"
                onClick={onAddedToOffer}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Weiteren Tarif
              </Button>
            )}
          </div>
        ) : (
          <Button
            size="lg"
            onClick={handleAdd}
            className="flex-1 bg-primary hover:bg-primary/90 gap-2 font-semibold text-base shadow-lg shadow-primary/30"
          >
            <Plus className="w-5 h-5" />
            Zum Angebot hinzufügen
            <Sparkles className="w-4 h-4 animate-pulse" />
          </Button>
        )}
      </div>
    </div>
  );
}
