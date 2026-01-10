// ============================================
// Setup Step: On-Top-Regeln definieren
// ============================================

import { useState } from "react";
import { Check, Info, ExternalLink, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

interface SetupStepOnTopRulesProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function SetupStepOnTopRules({ onComplete, isCompleted }: SetupStepOnTopRulesProps) {
  const [acknowledged, setAcknowledged] = useState(isCompleted);

  const handleConfigure = () => {
    // Öffne On-Top-Regeln-Seite in neuem Tab
    window.open("/admin/provisions?tab=push", "_blank");
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onComplete();
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          On-Top-Regeln sind zusätzliche Boni, die auf die Basis-Provision aufgeschlagen werden - 
          z.B. für bestimmte Tarife, Aktionen oder Vertriebsziele.
        </AlertDescription>
      </Alert>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium">Beispiele für On-Top-Regeln:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            Push-Provisionen für bestimmte Tarife (z.B. +20€ für GigaMobil)
          </li>
          <li className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            Aktions-Boni (zeitlich begrenzte Kampagnen)
          </li>
          <li className="flex items-start gap-2">
            <Target className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            Mengen-Staffeln (z.B. ab 5 Verträgen extra)
          </li>
          <li className="flex items-start gap-2">
            <Target className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            Hardware-Boni (Bonus bei Geräteverkauf)
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">+15€</div>
          <div className="text-xs text-muted-foreground">Beispiel Push</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">+5€/Stück</div>
          <div className="text-xs text-muted-foreground">Mengen-Bonus</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleConfigure} variant="outline" className="gap-2 flex-1">
          <ExternalLink className="w-4 h-4" />
          On-Top-Regeln konfigurieren
        </Button>
        
        {!acknowledged ? (
          <Button onClick={handleAcknowledge} className="gap-2 flex-1">
            <Check className="w-4 h-4" />
            On-Top-Regeln sind eingerichtet
          </Button>
        ) : (
          <Button disabled className="gap-2 flex-1 bg-green-500 hover:bg-green-500">
            <Check className="w-4 h-4" />
            Abgeschlossen
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Tipp: Sie können jederzeit neue Regeln unter{" "}
        <Link to="/admin/provisions" className="text-primary hover:underline">
          Admin → Provisionen → Push-Regeln
        </Link>{" "}
        hinzufügen.
      </p>
    </div>
  );
}
