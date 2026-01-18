// ============================================
// Setup Step: Provisionen konfigurieren
// ============================================

import { useState } from "react";
import { Check, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

interface SetupStepProvisionsProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function SetupStepProvisions({ onComplete, isCompleted }: SetupStepProvisionsProps) {
  const [acknowledged, setAcknowledged] = useState(isCompleted);

  const handleConfigure = () => {
    // Öffne Provisionen-Seite in neuem Tab
    window.open("/admin/provisions", "_blank");
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
          Die Provisionskonfiguration bestimmt, wie Ihre Mitarbeiter für Vertragsabschlüsse 
          vergütet werden. Sie können Basis-Provisionen, Staffeln und Boni definieren.
        </AlertDescription>
      </Alert>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium">Was Sie hier konfigurieren:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            Basis-Provisionen pro Tarifgruppe
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            Staffel-Provisionen für höhere Tarife
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            Abzüge für Mitarbeiter (z.B. Umsatzbeteiligung)
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            Mengen-Boni (z.B. ab 10 Verträgen extra)
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleConfigure} variant="outline" className="gap-2 flex-1">
          <ExternalLink className="w-4 h-4" />
          Provisionen konfigurieren
        </Button>
        
        {!acknowledged ? (
          <Button onClick={handleAcknowledge} className="gap-2 flex-1">
            <Check className="w-4 h-4" />
            Ich habe die Provisionen eingerichtet
          </Button>
        ) : (
          <Button disabled className="gap-2 flex-1 bg-green-500 hover:bg-green-500">
            <Check className="w-4 h-4" />
            Abgeschlossen
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Tipp: Sie können die Provisionen jederzeit später unter{" "}
        <Link to="/admin/provisions" className="text-primary hover:underline">
          Admin → Provisionen
        </Link>{" "}
        anpassen.
      </p>
    </div>
  );
}
