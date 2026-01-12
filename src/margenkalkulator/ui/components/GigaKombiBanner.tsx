// ============================================
// GigaKombi Banner - Compact Version
// Auto-dismiss after 5 seconds, max height 60px
// ============================================

import { useState, useEffect } from "react";
import { Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GigaKombiBannerProps {
  isEligible: boolean;
  discountAmount?: number;
  className?: string;
  /** Auto-dismiss after seconds (0 = never) */
  autoDismissSeconds?: number;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

export function GigaKombiBanner({
  isEligible,
  discountAmount = 5,
  className,
  autoDismissSeconds = 5,
  onDismiss,
}: GigaKombiBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss after X seconds
  useEffect(() => {
    if (autoDismissSeconds <= 0 || !isEligible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, autoDismissSeconds * 1000);

    return () => clearTimeout(timer);
  }, [autoDismissSeconds, onDismiss, isEligible]);

  // Reset visibility when eligibility changes
  useEffect(() => {
    if (isEligible) {
      setIsVisible(true);
    }
  }, [isEligible]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isEligible || !isVisible) return null;

  return (
    className = {
      cn(
        "flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg",
        "bg-emerald-500/10 border border-emerald-300 dark:border-emerald-700",
        "animate-fade-in max-h-10",
        className
      )
    }
    >
      <div className="flex items-center gap-2 text-xs">
        <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600 flex-shrink-0" />
        <span className="font-medium text-emerald-700 dark:text-emerald-400">
          GigaKombi aktiv! −{discountAmount}€/mtl.
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-full hover:bg-emerald-500/20 transition-colors text-emerald-600"
        aria-label="Schließen"
      >
        <X className="w-4 h-4" />
      </button>
    </div >
  );
}
