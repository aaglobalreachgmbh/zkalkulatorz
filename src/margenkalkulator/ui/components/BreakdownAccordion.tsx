import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CalculationResult, ViewMode } from "../../engine/types";

interface BreakdownAccordionProps {
  result: CalculationResult;
  viewMode: ViewMode;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function BreakdownAccordion({ result, viewMode }: BreakdownAccordionProps) {
  const { periods, breakdown } = result;

  const monthlyBreakdown = breakdown.filter((b) => b.appliesTo === "monthly");
  const oneTimeBreakdown = breakdown.filter((b) => b.appliesTo === "oneTime");
  const dealerBreakdown = breakdown.filter((b) => b.appliesTo === "dealer");

  return (
    <Accordion type="multiple" className="w-full">
      {/* Periods */}
      <AccordionItem value="periods">
        <AccordionTrigger className="text-sm">
          Monatliche Kosten nach Zeitraum
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {periods.map((period, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-md"
              >
                <span className="text-sm">{period.label}</span>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(period.monthly.net)} netto</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(period.monthly.gross)} brutto
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Monthly Breakdown */}
      {monthlyBreakdown.length > 0 && (
        <AccordionItem value="monthly">
          <AccordionTrigger className="text-sm">
            Monatliche Positionen
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1">
              {monthlyBreakdown.map((item) => (
                <div
                  key={item.key}
                  className="flex justify-between items-center py-1.5 text-sm"
                >
                  <span className="text-muted-foreground">
                    {item.label}
                    {item.periodRef && (
                      <span className="text-xs ml-1">({item.periodRef})</span>
                    )}
                  </span>
                  <span className="font-mono">
                    {item.net !== 0 ? formatCurrency(item.net) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* One-time Breakdown */}
      {oneTimeBreakdown.length > 0 && (
        <AccordionItem value="onetime">
          <AccordionTrigger className="text-sm">
            Einmalige Kosten
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1">
              {oneTimeBreakdown.map((item) => (
                <div
                  key={item.key}
                  className="flex justify-between items-center py-1.5 text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono">{formatCurrency(item.net)}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Dealer Breakdown - Only in dealer view */}
      {viewMode === "dealer" && dealerBreakdown.length > 0 && (
        <AccordionItem value="dealer">
          <AccordionTrigger className="text-sm">
            Händler-Kalkulation (Details)
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1">
              {dealerBreakdown.map((item) => (
                <div
                  key={item.key}
                  className="flex justify-between items-center py-1.5 text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span
                    className={`font-mono ${
                      item.ruleId === "margin"
                        ? item.net >= 0
                          ? "text-green-600 font-semibold"
                          : "text-destructive font-semibold"
                        : ""
                    }`}
                  >
                    {formatCurrency(item.net)}
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
