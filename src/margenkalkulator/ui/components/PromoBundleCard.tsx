/**
 * Promo Bundle Card Component
 * 
 * Displays promotional bundles with badge, validity dates, and content icons
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { BundleContentIcons } from "./BundleContentIcons";
import type { PromoBundleExtended } from "@/margenkalkulator/hooks/usePromoBundles";

interface PromoBundleCardProps {
  bundle: PromoBundleExtended;
  onSelect: () => void;
}

function formatValidityText(validUntil: string | null): string {
  if (!validUntil) return "Unbegrenzt gültig";

  try {
    const endDate = parseISO(validUntil);
    const daysLeft = differenceInDays(endDate, new Date());

    if (daysLeft < 0) return "Abgelaufen";
    if (daysLeft === 0) return "Nur noch heute!";
    if (daysLeft === 1) return "Noch 1 Tag!";
    if (daysLeft <= 7) return `Noch ${daysLeft} Tage`;

    return `Gültig bis ${format(endDate, "dd.MM.yyyy", { locale: de })}`;
  } catch {
    return validUntil;
  }
}

function getUrgencyColor(validUntil: string | null): string {
  if (!validUntil) return "text-muted-foreground";

  try {
    const endDate = parseISO(validUntil);
    const daysLeft = differenceInDays(endDate, new Date());

    if (daysLeft < 0) return "text-muted-foreground line-through";
    if (daysLeft <= 3) return "text-red-500 font-medium";
    if (daysLeft <= 7) return "text-orange-500";

    return "text-muted-foreground";
  } catch {
    return "text-muted-foreground";
  }
}

export function PromoBundleCard({ bundle, onSelect }: PromoBundleCardProps) {
  const validityText = formatValidityText(bundle.promo_valid_until);
  const urgencyColor = getUrgencyColor(bundle.promo_valid_until);
  const isExpired = bundle.promo_valid_until && differenceInDays(parseISO(bundle.promo_valid_until), new Date()) < 0;

  return (
    <div
      className={`bg-background border rounded-xl overflow-hidden hover:shadow-lg transition-all ${bundle.promo_badge_text ? "border-t-4 border-t-primary" : "border-border"
        } ${isExpired ? "opacity-60" : ""}`}
    >
      {/* Badge Header */}
      {bundle.promo_badge_text && (
        <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
          <span className="text-sm font-bold text-primary-foreground">
            {bundle.promo_badge_text}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{bundle.name}</h3>
            {bundle.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {bundle.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {bundle.featured && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              TOP
            </Badge>
          )}
        </div>

        {/* Description */}
        {bundle.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {bundle.description}
          </p>
        )}

        {/* Content Icons */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1.5">Enthält:</p>
          <BundleContentIcons config={bundle.config} size="md" />
        </div>

        {/* Validity */}
        <div className={`flex items-center gap-1.5 text-sm ${urgencyColor} mb-4`}>
          <Clock className="h-3.5 w-3.5" />
          <span>{validityText}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <Button
          onClick={onSelect}
          disabled={!!isExpired}
          className="w-full gap-2"
          variant={isExpired ? "outline" : "default"}
        >
          {isExpired ? "Aktion beendet" : "Übernehmen"}
          {!isExpired && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// Compact version for sidebars
export function PromoBundleCardCompact({
  bundle,
  onSelect,
}: PromoBundleCardProps) {
  const validityText = formatValidityText(bundle.promo_valid_until);
  const urgencyColor = getUrgencyColor(bundle.promo_valid_until);

  return (
    <div
      className="p-3 border rounded-lg hover:border-primary transition-colors cursor-pointer group"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
          {bundle.name}
        </h4>
        {bundle.promo_badge_text && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
            {bundle.promo_badge_text}
          </Badge>
        )}
      </div>

      <BundleContentIcons config={bundle.config} size="sm" />

      <div className={`flex items-center gap-1 text-xs mt-2 ${urgencyColor}`}>
        <Clock className="h-3 w-3" />
        <span>{validityText}</span>
      </div>
    </div>
  );
}
