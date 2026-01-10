// ============================================
// Setup Step: Hardware-Liste importieren
// ============================================

import { useState } from "react";
import { Check, Info, ExternalLink, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

interface SetupStepHardwareProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function SetupStepHardware({ onComplete, isCompleted }: SetupStepHardwareProps) {
  const [acknowledged, setAcknowledged] = useState(isCompleted);

  const handleConfigure = () => {
    // Öffne Hardware-Seite in neuem Tab
    window.open("/admin/hardware", "_blank");
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
          Importieren Sie Ihre aktuelle Hardware-Preisliste (EK-Preise), um präzise 
          Margenberechnungen durchführen zu können.
        </AlertDescription>
      </Alert>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium">Hardware-Import unterstützt:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <FileSpreadsheet className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            Excel-Dateien (.xlsx, .xls)
          </li>
          <li className="flex items-start gap-2">
            <FileSpreadsheet className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            CSV-Dateien mit Gerätename, EK-Preis, VK-Preis
          </li>
          <li className="flex items-start gap-2">
            <Upload className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            Automatische Spaltenerkennung
          </li>
          <li className="flex items-start gap-2">
            <Upload className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            Vorschau vor dem Import
          </li>
        </ul>
      </div>

      <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">
          Nutzen Sie den Hardware-Import unter Admin → Hardware
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleConfigure} variant="outline" className="gap-2 flex-1">
          <ExternalLink className="w-4 h-4" />
          Hardware-Liste importieren
        </Button>
        
        {!acknowledged ? (
          <Button onClick={handleAcknowledge} className="gap-2 flex-1">
            <Check className="w-4 h-4" />
            Hardware-Liste ist eingerichtet
          </Button>
        ) : (
          <Button disabled className="gap-2 flex-1 bg-green-500 hover:bg-green-500">
            <Check className="w-4 h-4" />
            Abgeschlossen
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Tipp: Hardware-Listen können monatlich aktualisiert werden unter{" "}
        <Link to="/admin/hardware" className="text-primary hover:underline">
          Admin → Hardware
        </Link>
      </p>
    </div>
  );
}
