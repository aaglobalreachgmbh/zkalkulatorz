// ============================================
// Price Timeline Component
// Visual timeline showing price development over contract duration
// ============================================

import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Period } from "../../engine/types";
import { formatMonthlyPrice } from "../../lib/formatters";
import { cn } from "@/lib/utils";

interface PriceTimelineProps {
  periods: Period[];
  termMonths?: number;
  avgMonthly: number;
  className?: string;
}

export function PriceTimeline({
  periods,
  termMonths = 24,
  avgMonthly,
  className,
}: PriceTimelineProps) {
  // Calculate segment widths based on duration
  const segments = useMemo(() => {
    return periods.map(period => {
      const duration = period.toMonth - period.fromMonth + 1;
      const widthPercent = (duration / termMonths) * 100;
      const isFree = period.monthly.net < 0.01;
      
      return {
        ...period,
        duration,
        widthPercent,
        isFree,
      };
    });
  }, [periods, termMonths]);
  
  // Find max price for relative height calculation
  const maxPrice = useMemo(() => {
    return Math.max(...periods.map(p => p.monthly.net), 1);
  }, [periods]);
  
  if (!periods || periods.length === 0) {
    return null;
  }
  
  // Don't show timeline for single-period offers
  if (periods.length === 1) {
    return null;
  }
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Timeline Label */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Monat 1</span>
        <span>Monat {termMonths}</span>
      </div>
      
      {/* Timeline Bar */}
      <div className="relative h-16">
        {/* Background track */}
        <div className="absolute inset-0 bg-muted/30 rounded-lg" />
        
        {/* Average price line */}
        <div 
          className="absolute left-0 right-0 border-t-2 border-dashed border-primary/50 z-10"
          style={{ 
            bottom: `${(avgMonthly / maxPrice) * 100}%`,
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute -right-1 -top-2 w-4 h-4 bg-primary rounded-full border-2 border-background cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Durchschnitt: {formatMonthlyPrice(avgMonthly)}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Period segments */}
        <div className="absolute inset-0 flex rounded-lg overflow-hidden">
          {segments.map((segment, idx) => {
            const heightPercent = segment.isFree ? 5 : (segment.monthly.net / maxPrice) * 100;
            
            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className="relative h-full cursor-help flex items-end"
                    style={{ width: `${segment.widthPercent}%` }}
                  >
                    {/* Price bar */}
                    <div 
                      className={cn(
                        "w-full transition-all rounded-t-sm",
                        segment.isFree 
                          ? "bg-gradient-to-t from-emerald-500 to-emerald-400" 
                          : "bg-gradient-to-t from-primary to-primary/80",
                        idx === 0 && "rounded-l-lg",
                        idx === segments.length - 1 && "rounded-r-lg"
                      )}
                      style={{ height: `${Math.max(heightPercent, 5)}%` }}
                    />
                    
                    {/* Separator line */}
                    {idx < segments.length - 1 && (
                      <div className="absolute right-0 top-0 bottom-0 w-px bg-background/50" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      Monat {segment.fromMonth}–{segment.toMonth}
                    </p>
                    <p className={cn(
                      segment.isFree && "text-emerald-500"
                    )}>
                      {segment.isFree ? "Kostenfrei (BP befreit)" : formatMonthlyPrice(segment.monthly.net)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {segment.duration} Monate
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        {segments.some(s => s.isFree) && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500 to-emerald-400" />
            <span>Kostenfrei</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-primary to-primary/80" />
          <span>Normalpreis</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 border-t-2 border-dashed border-primary/50" />
          <span>Ø Durchschnitt</span>
        </div>
      </div>
    </div>
  );
}
