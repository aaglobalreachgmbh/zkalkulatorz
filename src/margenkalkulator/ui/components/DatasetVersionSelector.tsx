import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Database, Check, Loader2, Info } from "lucide-react";
import { useDatasetVersions, type DatasetVersion } from "@/margenkalkulator/hooks/useDatasetVersions";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface DatasetVersionSelectorProps {
  compact?: boolean;
  showActivateButton?: boolean;
  onVersionChange?: (version: DatasetVersion | null) => void;
}

export function DatasetVersionSelector({
  compact = false,
  showActivateButton = false,
  onVersionChange,
}: DatasetVersionSelectorProps) {
  const { versions, activeVersion, isLoading, activateVersion, isActivating } = useDatasetVersions();
  const [selectedId, setSelectedId] = useState<string | undefined>(activeVersion?.id);

  const selectedVersion = versions.find(v => v.id === selectedId) ?? activeVersion;

  const handleValueChange = (value: string) => {
    setSelectedId(value);
    const version = versions.find(v => v.id === value) ?? null;
    onVersionChange?.(version);
  };

  const handleActivate = async () => {
    if (!selectedId || selectedId === activeVersion?.id) return;
    await activateVersion(selectedId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Lade Versionen...</span>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Database className="h-4 w-4" />
            <span className="text-sm">Standard-Provisionen</span>
            <Info className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[200px]">
            Keine benutzerdefinierten Versionen vorhanden. 
            Es werden die Standard-Provisionen aus v2025_10 verwendet.
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedId} onValueChange={handleValueChange}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Version wählen" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {versions.map((version) => (
              <SelectItem key={version.id} value={version.id}>
                <div className="flex items-center gap-2">
                  <span>{version.versionName}</span>
                  {version.isActive && (
                    <Badge variant="secondary" className="h-4 text-[10px] px-1">
                      Aktiv
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Provisionen:
        </span>
      </div>
      
      <Select value={selectedId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Version wählen" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {versions.map((version) => (
            <SelectItem key={version.id} value={version.id}>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span>{version.versionName}</span>
                  {version.isActive && (
                    <Check className="h-3 w-3 text-green-600" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Gültig ab {format(new Date(version.validFrom), "dd.MM.yyyy", { locale: de })}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showActivateButton && selectedId && selectedId !== activeVersion?.id && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleActivate}
          disabled={isActivating}
        >
          {isActivating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Aktivieren
            </>
          )}
        </Button>
      )}

      {selectedVersion && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[300px]">
            <div className="space-y-1 text-xs">
              <p><strong>Version:</strong> {selectedVersion.versionName}</p>
              <p><strong>Gültig ab:</strong> {format(new Date(selectedVersion.validFrom), "dd.MM.yyyy", { locale: de })}</p>
              {selectedVersion.validUntil && (
                <p><strong>Gültig bis:</strong> {format(new Date(selectedVersion.validUntil), "dd.MM.yyyy", { locale: de })}</p>
              )}
              {selectedVersion.sourceFile && (
                <p><strong>Quelle:</strong> {selectedVersion.sourceFile}</p>
              )}
              <p><strong>Status:</strong> {selectedVersion.isActive ? "Aktiv" : "Inaktiv"}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
