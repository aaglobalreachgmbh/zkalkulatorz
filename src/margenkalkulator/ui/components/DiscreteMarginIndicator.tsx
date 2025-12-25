// ============================================
// Discrete Margin Indicator Component
// Farbcodierter Hinweis für Mitarbeiter im Kunden-Modus
// ============================================

import { cn } from "@/lib/utils";

interface DiscreteMarginIndicatorProps {
  margin: number;
  className?: string;
}

/**
 * Diskreter Marge-Indikator
 * 
 * ZWECK:
 * Im Kunden-Modus zeigt dieser Indikator dem Mitarbeiter
 * die Marge an, ohne dass der Kunde es bemerkt.
 * 
 * FARBCODIERUNG:
 * - 🟢 Grün: Marge > +100€ (gutes Geschäft)
 * - 🟡 Gelb: Marge 0-100€ (neutral)
 * - 🔴 Rot: Marge < 0€ (Verlust)
 */
export function DiscreteMarginIndicator({ margin, className }: DiscreteMarginIndicatorProps) {
  const getIndicatorColor = () => {
    if (margin > 100) return "bg-emerald-500";
    if (margin >= 0) return "bg-amber-500";
    return "bg-red-500";
  };

  const getIndicatorTitle = () => {
    if (margin > 100) return "Marge: Gut (>100€)";
    if (margin >= 0) return "Marge: Neutral (0-100€)";
    return "Marge: Negativ (<0€)";
  };

  return (
    <div
      className={cn(
        "w-2.5 h-2.5 rounded-full transition-colors",
        getIndicatorColor(),
        className
      )}
      title={getIndicatorTitle()}
      aria-label={getIndicatorTitle()}
    />
  );
}
