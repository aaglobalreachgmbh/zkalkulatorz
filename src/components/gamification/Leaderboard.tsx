/**
 * Leaderboard Component
 * 
 * Zeigt Team-Rangliste mit Punkten und Besuchen.
 */

import { useState } from "react";
import { useLeaderboard, type LeaderboardPeriod } from "@/hooks/useLeaderboard";
import { useIdentity } from "@/contexts/IdentityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, TrendingUp, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  className?: string;
  compact?: boolean;
}

export function Leaderboard({ className, compact = false }: LeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const { leaderboard, isLoading, myRank, podium } = useLeaderboard(period);
  const { identity } = useIdentity();

  const periodLabels: Record<LeaderboardPeriod, string> = {
    week: "Diese Woche",
    month: "Dieser Monat",
    all: "Gesamt",
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    if (rank === 2) return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    if (rank === 3) return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    return "";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Team Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Team Leaderboard
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs px-2">Woche</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2">Monat</TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2">Gesamt</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Noch keine Punkte in diesem Zeitraum</p>
            <p className="text-sm">Schließe Besuche ab, um Punkte zu sammeln!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Podium for top 3 (non-compact) */}
            {!compact && podium.first && (
              <div className="flex justify-center gap-4 mb-6 pt-4">
                {/* 2nd place */}
                {podium.second && (
                  <div className="flex flex-col items-center">
                    <Avatar className="h-12 w-12 border-2 border-gray-400">
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {getInitials(podium.second.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <Medal className="h-5 w-5 text-gray-400 -mt-2" />
                    <span className="text-xs font-medium mt-1 text-center max-w-[80px] truncate">
                      {podium.second.display_name}
                    </span>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {podium.second.total_points} Pkt
                    </Badge>
                  </div>
                )}

                {/* 1st place */}
                <div className="flex flex-col items-center -mt-4">
                  <Avatar className="h-16 w-16 border-2 border-yellow-500">
                    <AvatarFallback className="bg-yellow-100 text-yellow-600 text-lg">
                      {getInitials(podium.first.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <Trophy className="h-6 w-6 text-yellow-500 -mt-2" />
                  <span className="text-sm font-semibold mt-1 text-center max-w-[100px] truncate">
                    {podium.first.display_name}
                  </span>
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 mt-1">
                    {podium.first.total_points} Pkt
                  </Badge>
                </div>

                {/* 3rd place */}
                {podium.third && (
                  <div className="flex flex-col items-center">
                    <Avatar className="h-12 w-12 border-2 border-amber-600">
                      <AvatarFallback className="bg-amber-100 text-amber-600">
                        {getInitials(podium.third.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <Award className="h-5 w-5 text-amber-600 -mt-2" />
                    <span className="text-xs font-medium mt-1 text-center max-w-[80px] truncate">
                      {podium.third.display_name}
                    </span>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {podium.third.total_points} Pkt
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Full list */}
            <div className="space-y-1">
              {leaderboard.slice(compact ? 0 : 3, compact ? 5 : 10).map((entry) => {
                const isMe = entry.user_id === identity.userId;
                
                return (
                  <div
                    key={entry.user_id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-colors",
                      isMe && "bg-primary/10 ring-1 ring-primary/20",
                      !isMe && "hover:bg-muted/50"
                    )}
                  >
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn(
                        "text-xs",
                        entry.rank <= 3 && getRankBadge(entry.rank)
                      )}>
                        {getInitials(entry.display_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium truncate",
                          isMe && "text-primary"
                        )}>
                          {entry.display_name}
                          {isMe && " (Du)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {entry.visits_count} Besuche
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {entry.badges_count} Badges
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">{entry.total_points}</div>
                      <div className="text-xs text-muted-foreground">Punkte</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show my rank if not in visible list */}
            {myRank && myRank.rank > (compact ? 5 : 10) && (
              <>
                <div className="text-center text-muted-foreground text-xs py-2">• • •</div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <div className="w-8 flex justify-center">
                    <span className="text-sm font-medium text-muted-foreground">{myRank.rank}</span>
                  </div>
                  
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {getInitials(myRank.display_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-primary truncate">
                      {myRank.display_name} (Du)
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">{myRank.total_points}</div>
                    <div className="text-xs text-muted-foreground">Punkte</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
