// ============================================
// Pro-Dashboard: Airtime Provision Timeline
// Modul 2.2 - Provision über die Laufzeit
// ============================================

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Lightbulb, Calendar } from "lucide-react";
import type { DiscountResult } from "../../engine/discountEngine";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AirtimeProvisionTimelineProps {
  /** Monatliche Provision (nach Rabatten) */
  monthlyProvision: number;
  /** Vertragslaufzeit */
  termMonths: 24 | 36;
  /** Tarif-Name */
  tariffName: string;
  /** Anzahl Verträge */
  contractCount: number;
  /** Angewandte Rabatte */
  discountsApplied?: DiscountResult;
  /** Kompakte Ansicht */
  compact?: boolean;
}

interface QuarterBlock {
  label: string;
  months: string;
  provision: number;
  cumulative: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function AirtimeProvisionTimeline({
  monthlyProvision,
  termMonths,
  tariffName,
  contractCount,
  discountsApplied,
  compact = false,
}: AirtimeProvisionTimelineProps) {
  const [isOpen, setIsOpen] = useState(!compact);

  // Generate quarterly blocks
  const quarters = useMemo((): QuarterBlock[] => {
    const blocks: QuarterBlock[] = [];
    const quarterCount = termMonths / 3;

    for (let i = 0; i < quarterCount; i++) {
      const startMonth = i * 3 + 1;
      const endMonth = (i + 1) * 3;
      const quarterProvision = monthlyProvision * 3;
      const cumulative = monthlyProvision * endMonth;

      blocks.push({
        label: `Q${i + 1}`,
        months: `Monat ${startMonth}-${endMonth}`,
        provision: quarterProvision,
        cumulative,
      });
    }

    return blocks;
  }, [monthlyProvision, termMonths]);

  const totalProvision = monthlyProvision * termMonths;
  const isLowProvision = monthlyProvision < 10;

  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Airtime über {termMonths} Monate
            </span>
          </div>
          <span className="text-sm font-semibold text-success">
            {formatCurrency(totalProvision)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatCurrency(monthlyProvision)}/Monat × {contractCount} Verträge
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-foreground">
                Airtime-Provision Timeline ({termMonths} Monate)
              </h3>
              <p className="text-xs text-muted-foreground">
                {tariffName} × {contractCount} Verträge
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-success">
              Gesamt: {formatCurrency(totalProvision)}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-5 pt-0">
            {/* Timeline Bars */}
            <div className="space-y-2 mb-4">
              {quarters.map((quarter, index) => (
                <TimelineBar
                  key={index}
                  quarter={quarter}
                  maxProvision={monthlyProvision * 3}
                  showMilestone={index === 3} // After Q4 (12 months)
                />
              ))}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">
                Monatlich: {formatCurrency(monthlyProvision)}
              </span>
              <span className="font-semibold text-foreground">
                Gesamt: {formatCurrency(totalProvision)}
              </span>
            </div>

            {/* Discount Info */}
            {discountsApplied && discountsApplied.totalPercentageDiscount > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <span className="font-medium">Aktive Rabatte: </span>
                {discountsApplied.teamDealPercentage > 0 && (
                  <span className="mr-2">
                    TeamDeal -{discountsApplied.teamDealPercentage}%
                  </span>
                )}
                {discountsApplied.gigaKombiDiscount > 0 && (
                  <span className="mr-2">
                    GigaKombi -{discountsApplied.gigaKombiDiscount}€
                  </span>
                )}
                {discountsApplied.sohoPercentage > 0 && (
                  <span>SOHO -{discountsApplied.sohoPercentage}%</span>
                )}
              </div>
            )}

            {/* Low Provision Warning */}
            {isLowProvision && (
              <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-warning">
                    Niedrige Provision:
                  </span>{" "}
                  <span className="text-muted-foreground">
                    Mit nur {formatCurrency(monthlyProvision)}/Monat sollte ein
                    Tarif-Upgrade erwogen werden.
                  </span>
                </div>
              </div>
            )}

            {/* Upgrade Tip */}
            {termMonths === 24 && (
              <div className="mt-3 p-3 rounded-lg bg-info/10 border border-info/30 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-info">💡 Tipp:</span>{" "}
                  <span className="text-muted-foreground">
                    Nach Monat 12 könnte ein Upgrade auf einen höheren Tarif
                    sinnvoll sein, um die Airtime-Provision zu erhöhen.
                  </span>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function TimelineBar({
  quarter,
  maxProvision,
  showMilestone,
}: {
  quarter: QuarterBlock;
  maxProvision: number;
  showMilestone?: boolean;
}) {
  const barWidth = (quarter.provision / maxProvision) * 100;

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Quarter Label */}
        <div className="w-16 flex-shrink-0">
          <span className="text-xs font-medium text-muted-foreground">
            {quarter.months}
          </span>
        </div>

        {/* Bar */}
        <div className="flex-1 h-6 relative bg-muted rounded">
          <div
            className={cn(
              "absolute h-full rounded transition-all bg-success",
              showMilestone && "bg-primary"
            )}
            style={{ width: `${barWidth}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-foreground mix-blend-difference">
              {formatCurrency(quarter.provision)}/Q
            </span>
          </div>
        </div>

        {/* Cumulative */}
        <div className="w-20 text-right text-xs text-muted-foreground tabular-nums">
          Σ {formatCurrency(quarter.cumulative)}
        </div>
      </div>

      {/* Milestone marker after Q4 */}
      {showMilestone && (
        <div className="absolute left-16 -bottom-1 w-[calc(100%-5rem)] flex items-center">
          <div className="flex-1 border-t-2 border-dashed border-primary/40" />
          <span className="px-2 text-xs text-primary font-medium">
            12 Monate
          </span>
        </div>
      )}
    </div>
  );
}
