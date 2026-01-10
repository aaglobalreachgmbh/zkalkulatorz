/**
 * Gamification Stats Component
 * 
 * Compact stats display for points, streak, and rank.
 */

import { useGamification } from "@/hooks/useGamification";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Flame, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface GamificationStatsProps {
  className?: string;
  variant?: "horizontal" | "vertical";
}

export function GamificationStats({ 
  className, 
  variant = "horizontal" 
}: GamificationStatsProps) {
  const { stats, isLoading } = useGamification();
  const { myRank } = useLeaderboard("week");

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-16 flex-1" />
            <Skeleton className="h-16 flex-1" />
            <Skeleton className="h-16 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      icon: Star,
      label: "Punkte",
      value: stats.totalPoints.toLocaleString("de-DE"),
      subValue: `+${stats.weeklyPoints} diese Woche`,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${stats.currentStreak} Tage`,
      subValue: stats.longestStreak > stats.currentStreak 
        ? `Rekord: ${stats.longestStreak}` 
        : "Aktuelle Serie",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Trophy,
      label: "Rang",
      value: myRank ? `#${myRank.rank}` : "-",
      subValue: "im Team",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Besuche",
      value: stats.visitCount.toString(),
      subValue: `${stats.badgesEarned} Badges`,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  const isVertical = variant === "vertical";

  return (
    <Card className={className}>
      <CardContent className={cn(
        "p-4",
        isVertical ? "space-y-3" : "grid grid-cols-2 sm:grid-cols-4 gap-3"
      )}>
        {statItems.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              item.bgColor
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full bg-background",
              item.color
            )}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="font-bold text-lg leading-tight">{item.value}</div>
              <div className="text-xs text-muted-foreground truncate">
                {item.subValue}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
