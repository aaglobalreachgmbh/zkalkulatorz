// ============================================
// AnimatedCurrency - Sanft animierte Währungsanzeige
// "Zapfsäulen-Effekt" für professionelles Gefühl
// ============================================

import { useSpring, useTransform, motion, type MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedCurrencyProps {
  /** Der anzuzeigende Wert in EUR */
  value: number;
  /** 
   * Variante für Vorzeichen-Anzeige:
   * - default: Kein Vorzeichen
   * - positive: Immer + Prefix
   * - negative: Immer - Prefix  
   * - margin: Automatisch +/- je nach Vorzeichen
   */
  variant?: "default" | "positive" | "negative" | "margin";
  /** Anzahl Dezimalstellen (0 oder 2) */
  decimals?: 0 | 2;
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

// Formatter für deutsches Währungsformat
const createFormatter = (decimals: number) =>
  new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export function AnimatedCurrency({
  value,
  variant = "default",
  decimals = 2,
  className,
}: AnimatedCurrencyProps) {
  const formatter = createFormatter(decimals);
  
  // Spring animation für sanftes Interpolieren
  const springValue = useSpring(value, {
    stiffness: 120,
    damping: 25,
    mass: 0.8,
  });

  // Update spring wenn sich value ändert
  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  // Transform the motion value to formatted string
  const display = useTransform(springValue, (latest) => {
    const absValue = Math.abs(latest);
    const formatted = formatter.format(absValue);
    
    switch (variant) {
      case "positive":
        return `+${formatted} €`;
      case "negative":
        return `−${formatted} €`; // Echtes Minus-Zeichen
      case "margin":
        return latest >= 0 ? `+${formatted} €` : `−${formatted} €`;
      default:
        return `${formatted} €`;
    }
  });

  return (
    <motion.span
      className={cn("tabular-nums inline-block", className)}
    >
      {display}
    </motion.span>
  );
}

export default AnimatedCurrency;
