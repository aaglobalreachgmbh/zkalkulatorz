// ============================================
// Daily Delta Widget - Taktgeber für den Arbeitstag
// ============================================

import { useMemo, useState, useEffect } from "react";
import { Zap, Clock, Sparkles, Moon, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DayPhase {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  colorClass: string;
  bgClass: string;
  icon: React.ElementType;
  description: string;
}

const PHASES: DayPhase[] = [
  { 
    id: "focus", 
    name: "Fokus Phase", 
    startHour: 8, 
    endHour: 18, 
    colorClass: "text-success", 
    bgClass: "bg-success/10",
    icon: Zap,
    description: "Aktive Arbeitszeit"
  },
  { 
    id: "transition", 
    name: "Übergang", 
    startHour: 18, 
    endHour: 19, 
    colorClass: "text-warning", 
    bgClass: "bg-warning/10",
    icon: Clock,
    description: "Letzte Aufgaben abschließen"
  },
  { 
    id: "cleandesk", 
    name: "Clean Desk", 
    startHour: 19, 
    endHour: 22, 
    colorClass: "text-amber-500", 
    bgClass: "bg-amber-500/10",
    icon: Sparkles,
    description: "Tagesabschluss & Vorbereitung"
  },
  { 
    id: "closed", 
    name: "Feierabend", 
    startHour: 22, 
    endHour: 8, 
    colorClass: "text-muted-foreground", 
    bgClass: "bg-muted",
    icon: Moon,
    description: "Shop geschlossen – App weiterhin nutzbar"
  },
];

function getCurrentPhase(hour: number): DayPhase {
  if (hour >= 8 && hour < 18) return PHASES[0];
  if (hour >= 18 && hour < 19) return PHASES[1];
  if (hour >= 19 && hour < 22) return PHASES[2];
  return PHASES[3];
}

function getDayProgress(hour: number, minute: number): number {
  // Day runs from 8:00 to 22:00 (14 hours)
  const dayStart = 8;
  const dayEnd = 22;
  const totalMinutes = (dayEnd - dayStart) * 60;
  
  if (hour < dayStart) return 0;
  if (hour >= dayEnd) return 100;
  
  const currentMinutes = (hour - dayStart) * 60 + minute;
  return Math.round((currentMinutes / totalMinutes) * 100);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("de-DE", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

export function DailyDeltaWidget() {
  const [now, setNow] = useState(new Date());
  const [cleanDeskDone, setCleanDeskDone] = useState(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem("cleandesk_completed");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.date === today && parsed.done;
    }
    return false;
  });

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentPhase = useMemo(() => getCurrentPhase(hour), [hour]);
  const progress = useMemo(() => getDayProgress(hour, minute), [hour, minute]);
  
  const PhaseIcon = currentPhase.icon;

  const handleCleanDesk = () => {
    const today = new Date().toDateString();
    localStorage.setItem("cleandesk_completed", JSON.stringify({ date: today, done: true }));
    setCleanDeskDone(true);
  };

  return (
    <Card className="max-w-5xl mx-auto w-full mb-6 animate-fade-in border-border/50">
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Current Phase */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              currentPhase.bgClass
            )}>
              <PhaseIcon className={cn("w-5 h-5", currentPhase.colorClass)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("font-semibold text-sm", currentPhase.colorClass)}>
                  {currentPhase.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(now)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {currentPhase.description}
              </p>
            </div>
          </div>

          {/* Center: Progress Bar */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>08:00</span>
              <span className="font-medium text-foreground">{progress}%</span>
              <span>22:00</span>
            </div>
            <div className="relative">
              <Progress 
                value={progress} 
                className="h-2"
              />
              {/* Phase markers */}
              <div className="absolute inset-0 flex">
                <div className="w-[71.4%] border-r border-background/50" /> {/* 10/14 = 71.4% for 18:00 */}
                <div className="w-[7.14%] border-r border-background/50" /> {/* 1/14 = 7.14% for 19:00 */}
              </div>
            </div>
          </div>

          {/* Right: Action */}
          <div className="flex items-center gap-2">
            {currentPhase.id === "cleandesk" && !cleanDeskDone && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCleanDesk}
                className="gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              >
                <CheckCircle className="w-4 h-4" />
                Tagesabschluss
              </Button>
            )}
            {cleanDeskDone && currentPhase.id === "cleandesk" && (
              <div className="flex items-center gap-1.5 text-success text-sm">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Erledigt</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
