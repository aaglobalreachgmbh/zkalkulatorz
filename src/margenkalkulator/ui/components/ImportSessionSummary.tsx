import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  Plus, 
  Minus, 
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImportModuleSummary {
  name: string;
  label: string;
  rowCount: number;
}

export interface ImportDiffSummary {
  added: number;
  changed: number;
  removed: number;
}

export interface ImportError {
  row?: number;
  field?: string;
  message: string;
}

export interface ImportSessionResult {
  success: boolean;
  fileName: string;
  modules: ImportModuleSummary[];
  totalRows: number;
  diff: ImportDiffSummary;
  errors: ImportError[];
  warnings?: string[];
  duration?: number;
}

interface ImportSessionSummaryProps {
  result: ImportSessionResult;
  onDismiss?: () => void;
  className?: string;
}

export function ImportSessionSummary({ 
  result, 
  onDismiss,
  className 
}: ImportSessionSummaryProps) {
  const [errorsOpen, setErrorsOpen] = useState(false);
  
  const hasErrors = result.errors.length > 0;
  const hasChanges = result.diff.added > 0 || result.diff.changed > 0 || result.diff.removed > 0;
  
  const borderColor = hasErrors 
    ? "border-l-destructive" 
    : result.success 
      ? "border-l-green-500" 
      : "border-l-amber-500";

  const StatusIcon = hasErrors 
    ? XCircle 
    : result.success 
      ? CheckCircle 
      : AlertTriangle;

  const statusColor = hasErrors 
    ? "text-destructive" 
    : result.success 
      ? "text-green-600" 
      : "text-amber-600";

  return (
    <Card className={cn("border-l-4", borderColor, className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <StatusIcon className={cn("h-5 w-5", statusColor)} />
            {hasErrors 
              ? "Import mit Fehlern" 
              : result.success 
                ? "Import abgeschlossen" 
                : "Import mit Warnungen"}
          </CardTitle>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss} className="h-7 text-xs">
              Schließen
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          {result.fileName}
          {result.duration && (
            <span className="text-muted-foreground/60">
              • {(result.duration / 1000).toFixed(1)}s
            </span>
          )}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Recognized Modules */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Module</p>
            <div className="flex flex-wrap gap-1">
              {result.modules.length > 0 ? (
                result.modules.map((module) => (
                  <Badge 
                    key={module.name} 
                    variant="outline" 
                    className="text-xs font-normal"
                  >
                    {module.label}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          </div>
          
          {/* Row Counts */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Zeilen</p>
            <p className="text-lg font-bold">{result.totalRows}</p>
          </div>
          
          {/* Diff Summary */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Änderungen</p>
            {hasChanges ? (
              <div className="flex items-center gap-2 text-sm">
                {result.diff.added > 0 && (
                  <span className="text-green-600 flex items-center gap-0.5">
                    <Plus className="h-3 w-3" />
                    {result.diff.added}
                  </span>
                )}
                {result.diff.changed > 0 && (
                  <span className="text-amber-600 flex items-center gap-0.5">
                    <RefreshCw className="h-3 w-3" />
                    {result.diff.changed}
                  </span>
                )}
                {result.diff.removed > 0 && (
                  <span className="text-red-600 flex items-center gap-0.5">
                    <Minus className="h-3 w-3" />
                    {result.diff.removed}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Keine</span>
            )}
          </div>
          
          {/* Errors */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Fehler</p>
            {result.errors.length === 0 ? (
              <span className="text-lg font-bold text-green-600">✓</span>
            ) : (
              <span className="text-lg font-bold text-destructive">
                {result.errors.length}
              </span>
            )}
          </div>
        </div>
        
        {/* Expandable Error List */}
        {result.errors.length > 0 && (
          <Collapsible open={errorsOpen} onOpenChange={setErrorsOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <span>{result.errors.length} Fehler anzeigen</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  errorsOpen && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-destructive/5 rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {result.errors.map((error, index) => (
                  <div 
                    key={index} 
                    className="text-sm text-destructive flex items-start gap-2"
                  >
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {error.row !== undefined && (
                        <span className="font-medium">Zeile {error.row}: </span>
                      )}
                      {error.field && (
                        <span className="font-medium">{error.field} – </span>
                      )}
                      {error.message}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="mt-4 bg-amber-500/10 rounded-md p-3 space-y-1">
            {result.warnings.map((warning, index) => (
              <div 
                key={index} 
                className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
