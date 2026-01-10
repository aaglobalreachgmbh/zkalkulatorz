/**
 * Gamification Page
 * 
 * Full gamification overview with leaderboard, badges, and stats.
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { GamificationStats } from "@/components/gamification/GamificationStats";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { BadgeCollection } from "@/components/gamification/BadgeCollection";
import { useGamification } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, History, Star } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Gamification() {
  const { points, stats } = useGamification();

  return (
    <AppLayout 
      title="Gamification" 
      subtitle="Punkte, Badges und Leaderboard"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <GamificationStats variant="horizontal" />

        {/* Main Content */}
        <Tabs defaultValue="leaderboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="h-4 w-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Punkte-Verlauf
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="badges">
            <BadgeCollection />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Punkte-Verlauf
                </CardTitle>
              </CardHeader>
              <CardContent>
                {points.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Noch keine Punkte gesammelt</p>
                    <p className="text-sm">Schließe Besuche ab, um Punkte zu verdienen!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {points.slice(0, 50).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            flex items-center justify-center w-10 h-10 rounded-full
                            ${p.points > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}
                          `}>
                            <Star className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {p.description || getSourceLabel(p.source_type)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(p.created_at), "dd. MMMM yyyy, HH:mm", { locale: de })}
                            </div>
                          </div>
                        </div>
                        <div className={`
                          font-bold text-lg
                          ${p.points > 0 ? "text-emerald-500" : "text-red-500"}
                        `}>
                          {p.points > 0 ? "+" : ""}{p.points}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    visit_completed: "Besuch abgeschlossen",
    photo_added: "Foto hinzugefügt",
    checklist_complete: "Checkliste ausgefüllt",
    gps_captured: "GPS erfasst",
    streak_bonus: "Streak-Bonus",
    badge_earned: "Badge verdient",
  };
  return labels[source] || source;
}
