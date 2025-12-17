import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
}

export function OptionCard({ 
  title, 
  result, 
  viewMode, 
  onCopy,
  isActive = false 
}: OptionCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className={`${isActive ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {onCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-4 h-4 mr-1.5" />
              Kopieren
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <KpiSummary result={result} viewMode={viewMode} />

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Details anzeigen</span>
          <Switch
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
