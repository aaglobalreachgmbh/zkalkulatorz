import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { useState } from "react";
import type { CalculationResult, ViewMode } from "../../engine/types";
import { KpiSummary } from "./KpiSummary";
import { BreakdownAccordion } from "./BreakdownAccordion";

interface OptionCardProps {
  title: string;
  result: CalculationResult;
  viewMode: ViewMode;
  onCopy?: () => void;
  isActive?: boolean;
  gkEligible?: boolean;
}

export function OptionCard({ 
  title, 
  result, 
  viewMode, 
  onCopy,
  isActive = false,
  gkEligible = false
}: OptionCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className={`
      relative rounded-2xl shadow-card border-border/50 overflow-hidden
      transition-all duration-200
      ${isActive 
        ? "ring-2 ring-primary shadow-elevated bg-card" 
        : "bg-card/90 hover:shadow-elevated hover:bg-card"
      }
    `}>
      <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {gkEligible && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs font-medium">
                GK Konvergenz
              </Badge>
            )}
          </div>
          {onCopy && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCopy}
              className="text-muted-foreground hover:text-foreground rounded-lg"
            >
              <Copy className="h-4 w-4 mr-1" />
              <span className="text-xs">Kopieren</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <KpiSummary result={result} viewMode={viewMode} />

        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <Label htmlFor={`details-${title}`} className="text-sm text-muted-foreground">
            Details anzeigen
          </Label>
          <Switch
            id={`details-${title}`}
            checked={showDetails}
            onCheckedChange={setShowDetails}
          />
        </div>

        {showDetails && (
          <div className="pt-2">
            <BreakdownAccordion result={result} viewMode={viewMode} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
