/**
 * Badge Collection Component
 * 
 * Zeigt alle verfügbaren und verdienten Badges.
 */

import { useGamification, type BadgeDefinition } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BadgeCollectionProps {
  className?: string;
  compact?: boolean;
  showOnlyEarned?: boolean;
}

export function BadgeCollection({ 
  className, 
  compact = false,
  showOnlyEarned = false 
}: BadgeCollectionProps) {
  const { badgeDefinitions, userBadges, stats, isLoading } = useGamification();

  const earnedBadgeIds = new Set(userBadges.map(b => b.badge_id));

  const badgesByCategory = badgeDefinitions.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    if (!showOnlyEarned || earnedBadgeIds.has(badge.id)) {
      acc[badge.category].push(badge);
    }
    return acc;
  }, {} as Record<string, BadgeDefinition[]>);

  const categoryLabels: Record<string, string> = {
    milestone: "Meilensteine",
    streak: "Streaks",
    special: "Spezial",
  };

  const categoryOrder = ["milestone", "streak", "special"];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-16 w-16 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderBadge = (badge: BadgeDefinition) => {
    const isEarned = earnedBadgeIds.has(badge.id);
    const earnedBadge = userBadges.find(b => b.badge_id === badge.id);

    return (
      <Tooltip key={badge.id}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-default",
              isEarned
                ? "bg-primary/10 border-primary/30 shadow-sm"
                : "bg-muted/30 border-muted/50 opacity-50 grayscale"
            )}
          >
            <span className="text-3xl mb-1">{badge.icon}</span>
            {!compact && (
              <span className={cn(
                "text-xs font-medium text-center leading-tight",
                isEarned ? "text-foreground" : "text-muted-foreground"
              )}>
                {badge.name}
              </span>
            )}
            
            {/* Earned indicator */}
            {isEarned && (
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                <CheckCircle2 className="h-3 w-3" />
              </div>
            )}
            
            {/* Locked indicator */}
            {!isEarned && (
              <div className="absolute -top-1 -right-1 bg-muted text-muted-foreground rounded-full p-0.5">
                <Lock className="h-3 w-3" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <div className="space-y-1">
            <div className="font-semibold flex items-center gap-2">
              <span>{badge.icon}</span>
              {badge.name}
            </div>
            <p className="text-xs text-muted-foreground">
              {badge.description}
            </p>
            {isEarned && earnedBadge && (
              <p className="text-xs text-primary">
                ✓ Verdient am {new Date(earnedBadge.earned_at).toLocaleDateString("de-DE")}
              </p>
            )}
            {!isEarned && (
              <p className="text-xs text-muted-foreground">
                🎁 +{badge.points_reward} Punkte bei Verdienst
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Meine Badges
          </CardTitle>
          <Badge variant="secondary">
            {stats.badgesEarned} / {stats.badgesTotal}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {badgeDefinitions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Keine Badges verfügbar</p>
          </div>
        ) : compact ? (
          // Compact: Just show earned badges in a row
          <div className="flex flex-wrap gap-2">
            {userBadges.slice(0, 6).map(ub => {
              const badge = badgeDefinitions.find(b => b.id === ub.badge_id);
              if (!badge) return null;
              return renderBadge(badge);
            })}
            {userBadges.length > 6 && (
              <div className="flex items-center justify-center p-3 rounded-xl bg-muted/30 border-2 border-dashed border-muted">
                <span className="text-xs text-muted-foreground">
                  +{userBadges.length - 6}
                </span>
              </div>
            )}
          </div>
        ) : (
          // Full: Show by category
          <div className="space-y-6">
            {categoryOrder.map(category => {
              const badges = badgesByCategory[category];
              if (!badges || badges.length === 0) return null;

              return (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    {categoryLabels[category]}
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {badges.map(renderBadge)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
