import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Play, Square, Coffee, Loader2 } from "lucide-react";
import { useTimeTracking, formatMinutesAsTime } from "@/hooks/useTimeTracking";
import { cn } from "@/lib/utils";

export function TimeClockWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    activeEntry,
    elapsedTime,
    weeklyStats,
    clockIn,
    clockOut,
    addBreak,
    isClockingIn,
    isClockingOut,
    isAddingBreak,
  } = useTimeTracking();

  const isWorking = !!activeEntry;
  const isLoading = isClockingIn || isClockingOut || isAddingBreak;

  const handleClockIn = async () => {
    try {
      await clockIn({});
    } catch (error) {
      console.error("Clock in failed:", error);
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut({});
      setIsOpen(false);
    } catch (error) {
      console.error("Clock out failed:", error);
    }
  };

  const handleAddBreak = async (minutes: number) => {
    try {
      await addBreak(minutes);
    } catch (error) {
      console.error("Add break failed:", error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isWorking ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-2 min-w-[120px] font-mono",
            isWorking && "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          <Clock className={cn("h-4 w-4", isWorking && "animate-pulse")} />
          {isWorking && elapsedTime ? (
            <span>{elapsedTime.formatted}</span>
          ) : (
            <span>Stempeln</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-semibold mb-1">Zeiterfassung</h4>
            {isWorking && elapsedTime ? (
              <div className="text-3xl font-mono font-bold text-primary">
                {elapsedTime.formatted}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch nicht eingestempelt
              </p>
            )}
          </div>

          {isWorking ? (
            <div className="space-y-3">
              {/* Break buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddBreak(15)}
                  disabled={isLoading}
                >
                  <Coffee className="h-3 w-3 mr-1" />
                  15m
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddBreak(30)}
                  disabled={isLoading}
                >
                  <Coffee className="h-3 w-3 mr-1" />
                  30m
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddBreak(60)}
                  disabled={isLoading}
                >
                  <Coffee className="h-3 w-3 mr-1" />
                  60m
                </Button>
              </div>

              {activeEntry && activeEntry.break_minutes > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Pause: {activeEntry.break_minutes} Min.
                </p>
              )}

              {/* Clock out */}
              <Button
                className="w-full"
                variant="destructive"
                onClick={handleClockOut}
                disabled={isLoading}
              >
                {isClockingOut ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Ausstempeln
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={handleClockIn}
              disabled={isLoading}
            >
              {isClockingIn ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Einstempeln
            </Button>
          )}

          {/* Weekly stats */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Diese Woche</p>
                <p className="font-medium">
                  {formatMinutesAsTime(weeklyStats.totalMinutes)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Überstunden</p>
                <p className={cn(
                  "font-medium",
                  weeklyStats.overtimeMinutes > 0 && "text-emerald-600",
                  weeklyStats.overtimeMinutes < 0 && "text-amber-600"
                )}>
                  {weeklyStats.overtimeMinutes >= 0 ? "+" : ""}
                  {formatMinutesAsTime(weeklyStats.overtimeMinutes)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
