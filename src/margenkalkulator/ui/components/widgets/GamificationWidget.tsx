/**
 * Gamification Dashboard Widget
 * 
 * Compact widget showing points, streak, badges, and rank.
 */

import { useGamification } from "@/hooks/useGamification";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  Flame, 
  Trophy, 
  Award, 
  ChevronRight,
  TrendingUp 
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function GamificationWidget() {
  const { stats, userBadges, badgeDefinitions, isLoading } = useGamification();
  const { myRank } = useLeaderboard("week");

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get 3 most recent badges
  const recentBadges = userBadges.slice(0, 3).map(ub => {
    const def = badgeDefinitions.find(b => b.id === ub.badge_id);
    return def;
  }).filter(Boolean);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-primary" />
            Meine Gamification
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link to="/gamification">
              Alle Details
              <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-3">
          {/* Points */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-yellow-500/10">
            <Star className="h-5 w-5 text-yellow-500 mb-1" />
            <span className="font-bold text-lg">{stats.totalPoints.toLocaleString("de-DE")}</span>
            <span className="text-xs text-muted-foreground">Punkte</span>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-orange-500/10">
            <Flame className={cn(
              "h-5 w-5 mb-1",
              stats.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
            )} />
            <span className="font-bold text-lg">{stats.currentStreak}</span>
            <span className="text-xs text-muted-foreground">Tage Streak</span>
          </div>

          {/* Rank */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-primary/10">
            <Trophy className="h-5 w-5 text-primary mb-1" />
            <span className="font-bold text-lg">
              {myRank ? `#${myRank.rank}` : "-"}
            </span>
            <span className="text-xs text-muted-foreground">im Team</span>
          </div>
        </div>

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Letzte Badges
              </span>
              <Badge variant="secondary" className="text-xs">
                {stats.badgesEarned}/{stats.badgesTotal}
              </Badge>
            </div>
            <div className="flex gap-2">
              {recentBadges.map((badge) => badge && (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border"
                >
                  <span className="text-lg">{badge.icon}</span>
                  <span className="text-xs font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Progress */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-sm">Diese Woche</span>
          </div>
          <div className="text-right">
            <span className="font-semibold text-emerald-500">
              +{stats.weeklyPoints} Punkte
            </span>
            <span className="text-xs text-muted-foreground block">
              {stats.visitCount} Besuche gesamt
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GamificationWidget;
