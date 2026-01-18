import { Info, Plus, Minus, Equal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "../../lib/formatters";
import type { CalculationResult, OfferOptionState } from "../../engine/types";
import { cn } from "@/lib/utils";
import { AnimatedCurrency } from "./AnimatedCurrency";

interface CalculationExplainerProps {
    result: CalculationResult;
    option: OfferOptionState;
    className?: string;
}

export function CalculationExplainer({ result, option, className }: CalculationExplainerProps) {
    // Extract key figures
    const basePrice = option.mobile.tariffId ? (result.breakdown.find(r => r.ruleId === "base")?.amount || 0) : 0;

    // Hardware surcharge (per month)
    const hardwareSurcharge = result.breakdown
        .filter(r => r.category === "hardware" && r.amount > 0)
        .reduce((sum, r) => sum + r.amount, 0);

    // Total Discounts (per month average)
    const discounts = result.breakdown
        .filter(r => r.amount < 0)
        .reduce((sum, r) => sum + r.amount, 0);

    const finalPrice = result.totals.avgTermNet;

    if (!option.mobile.tariffId) return null;

    return (
        <Card className={cn("border-dashed bg-muted/30", className)}>
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Info className="w-4 h-4" />
                    So berechnet sich der Preis
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="space-y-1.5 text-sm">
                    {/* Base Price */}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tarif-Grundpreis</span>
                        <span className="font-medium">{formatCurrency(basePrice)}</span>
                    </div>

                    {/* Hardware Surcharge */}
                    {hardwareSurcharge > 0 && (
                        <div className="flex justify-between items-center text-amber-700 dark:text-amber-400">
                            <div className="flex items-center gap-1.5">
                                <Plus className="w-3 h-3" />
                                <span>Hardware-Zuschlag</span>
                            </div>
                            <span className="font-medium">{formatCurrency(hardwareSurcharge)}</span>
                        </div>
                    )}

                    {/* Discounts */}
                    {discounts < 0 && (
                        <div className="flex justify-between items-center text-emerald-600">
                            <div className="flex items-center gap-1.5">
                                <Minus className="w-3 h-3" />
                                <span>Rabatte (Ø mtl.)</span>
                            </div>
                            <span className="font-medium">{formatCurrency(discounts)}</span>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="my-2 border-t border-dashed" />

                    {/* Final Result */}
                    <div className="flex justify-between items-center text-base">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Equal className="w-3 h-3 text-primary" />
                            <span>Effektivpreis</span>
                        </div>
                        <span className="font-bold text-primary">
                            <AnimatedCurrency value={finalPrice} decimals={2} /> €
                        </span>
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-2 text-right">
                        * Durchschnitt über {option.meta.termMonths} Monate Laufzeit
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
