import { useState } from "react";
import { Wifi, Smartphone, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GigaKombiBannerProps {
  isEligible: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function GigaKombiBanner({ 
  isEligible, 
  onDismiss,
  className 
}: GigaKombiBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  
  if (!isEligible || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-r from-emerald-500 to-teal-600",
      "text-white rounded-xl p-5",
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
      
      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Banner schließen"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
            🎉 GigaKombi aktiv!
          </h3>
          
          {/* Benefits List */}
          <ul className="space-y-1.5 mb-3">
            <li className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span>5€ Rabatt auf Mobilfunk-Tarif pro Monat</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span>Unlimited Datenvolumen für bis zu 10 Prime-SIMs</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span>Festnetz + Mobilfunk aus einer Hand</span>
            </li>
          </ul>
          
          {/* Explanation */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-medium">+</span>
              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-medium">=</span>
              <span className="font-semibold">GigaKombi</span>
            </div>
            <p className="text-xs opacity-90">
              Tipp: GigaKombi erhöht die Kundenbindung und reduziert die Wechselwahrscheinlichkeit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
