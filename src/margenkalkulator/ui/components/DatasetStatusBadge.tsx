import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileEdit, Eye, Check, Archive, Database } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type DatasetStatus = "draft" | "review" | "published" | "archived";
export type SourceType = "xlsx" | "csv" | "pdf" | "manual" | "seed";

interface DatasetStatusBadgeProps {
  status: DatasetStatus;
  versionName: string;
  sourceType?: SourceType | null;
  sourceDate?: string | null;
  compact?: boolean;
  className?: string;
}

const statusConfig: Record<DatasetStatus, { 
  label: string; 
  icon: React.ElementType; 
  variant: "default" | "secondary" | "outline" | "destructive";
  className: string;
}> = {
  draft: {
    label: "Entwurf",
    icon: FileEdit,
    variant: "secondary",
    className: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  review: {
    label: "In Prüfung",
    icon: Eye,
    variant: "secondary",
    className: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  published: {
    label: "Aktiv",
    icon: Check,
    variant: "default",
    className: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
  },
  archived: {
    label: "Archiviert",
    icon: Archive,
    variant: "outline",
    className: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
  },
};

const sourceTypeLabels: Record<SourceType, string> = {
  xlsx: "Excel",
  csv: "CSV",
  pdf: "PDF",
  manual: "Manuell",
  seed: "Standard",
};

export function DatasetStatusBadge({
  status,
  versionName,
  sourceType,
  sourceDate,
  compact = false,
  className,
}: DatasetStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn("gap-1 font-normal", config.className, className)}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <p><strong>Version:</strong> {versionName}</p>
            {sourceType && <p><strong>Quelle:</strong> {sourceTypeLabels[sourceType]}</p>}
            {sourceDate && (
              <p><strong>Datum:</strong> {format(new Date(sourceDate), "dd.MM.yyyy", { locale: de })}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="outline" 
        className={cn("gap-1 font-normal", config.className)}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Database className="h-3 w-3" />
        <span>v{versionName}</span>
        {sourceType && (
          <>
            <span className="text-muted-foreground/50">|</span>
            <span>{sourceTypeLabels[sourceType]}</span>
          </>
        )}
        {sourceDate && (
          <>
            <span className="text-muted-foreground/50">|</span>
            <span>{format(new Date(sourceDate), "dd.MM.yyyy", { locale: de })}</span>
          </>
        )}
      </span>
    </div>
  );
}
