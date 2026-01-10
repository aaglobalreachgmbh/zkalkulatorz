/**
 * News Card Component
 * 
 * Displays a single news item with type badge, date, and content
 */

import { Badge } from "@/components/ui/badge";
import { Pin, ArrowRight, AlertTriangle, Info, GraduationCap, Gift, Package, AlertCircle } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { NewsItem, NewsType } from "@/margenkalkulator/hooks/useNews";
import { NEWS_TYPE_CONFIG } from "@/margenkalkulator/hooks/useNews";

interface NewsCardProps {
  news: NewsItem;
  onClick?: () => void;
  compact?: boolean;
}

const iconMap: Record<string, typeof AlertTriangle> = {
  AlertTriangle,
  Info,
  GraduationCap,
  Gift,
  Package,
  AlertCircle,
};

function formatNewsDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) return "Heute";
    if (isYesterday(date)) return "Gestern";
    return format(date, "dd.MM.yyyy", { locale: de });
  } catch {
    return dateString;
  }
}

export function NewsCard({ news, onClick, compact = false }: NewsCardProps) {
  const typeConfig = NEWS_TYPE_CONFIG[news.type as NewsType] || NEWS_TYPE_CONFIG.info;
  const Icon = iconMap[typeConfig.icon] || Info;

  if (compact) {
    return (
      <div
        className="p-3 border-l-2 border-transparent hover:border-primary transition-colors cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center gap-2 mb-1">
          <Badge className={`${typeConfig.bgColor} text-[10px] px-1.5 py-0`}>
            {typeConfig.label}
          </Badge>
          {news.is_pinned && (
            <Pin className="h-3 w-3 text-primary" />
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatNewsDate(news.created_at)}
          </span>
        </div>
        <h4 className="font-medium text-sm line-clamp-1">{news.title}</h4>
      </div>
    );
  }

  return (
    <div
      className={`p-4 border-l-2 ${
        news.is_pinned ? "border-primary bg-primary/5" : "border-transparent"
      } hover:border-primary transition-colors cursor-pointer group`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge className={`${typeConfig.bgColor} text-xs font-medium gap-1`}>
            <Icon className="h-3 w-3" />
            {typeConfig.label}
          </Badge>
          {news.is_pinned && (
            <Pin className="h-3.5 w-3.5 text-primary" />
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatNewsDate(news.created_at)}
        </span>
      </div>

      <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
        {news.title}
      </h4>

      {news.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {news.description}
        </p>
      )}

      {news.content && (
        <button className="text-sm text-foreground hover:text-primary inline-flex items-center gap-1 transition-colors">
          Mehr lesen
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}

// Legacy support for mock news items from Bundles page
export interface LegacyNewsItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: NewsType;
}

export function LegacyNewsCard({ news, onClick }: { news: LegacyNewsItem; onClick?: () => void }) {
  const typeConfig = NEWS_TYPE_CONFIG[news.type] || NEWS_TYPE_CONFIG.info;
  const Icon = iconMap[typeConfig.icon] || Info;

  return (
    <div
      className="p-4 border-l-2 border-transparent hover:border-primary transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge className={`${typeConfig.bgColor} text-xs font-medium gap-1`}>
          <Icon className="h-3 w-3" />
          {typeConfig.label}
        </Badge>
        <span className="text-xs text-muted-foreground shrink-0">
          {news.time ? `${news.date}, ${news.time}` : news.date}
        </span>
      </div>

      <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
        {news.title}
      </h4>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
        {news.description}
      </p>

      <button className="text-sm text-foreground hover:text-primary inline-flex items-center gap-1 transition-colors">
        Mehr lesen
        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
