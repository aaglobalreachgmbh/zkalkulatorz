// ============================================
// Setup Step: Team einladen (Optional)
// ============================================

import { useState } from "react";
import { Check, Info, ExternalLink, UserPlus, Mail, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface SetupStepTeamProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function SetupStepTeam({ onComplete, isCompleted }: SetupStepTeamProps) {
  const [acknowledged, setAcknowledged] = useState(isCompleted);

  const handleConfigure = () => {
    // Öffne Team-Seite in neuem Tab
    window.open("/admin/users", "_blank");
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onComplete();
  };

  const handleCopyInviteInfo = () => {
    const text = `Melde dich beim MargenKalkulator an: ${window.location.origin}/auth`;
    navigator.clipboard.writeText(text);
    toast.success("Einladungslink kopiert!");
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="w-4 h-4 text-blue-500" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Dieser Schritt ist <strong>optional</strong>. Sie können Ihr Team auch später einladen.
        </AlertDescription>
      </Alert>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium">Team-Verwaltung ermöglicht:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <UserPlus className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            Mitarbeiter zur Allowlist hinzufügen
          </li>
          <li className="flex items-start gap-2">
            <UserPlus className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            Rollen und Berechtigungen zuweisen
          </li>
          <li className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            Einladungs-E-Mails versenden
          </li>
          <li className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            Neue Registrierungen freischalten
          </li>
        </ul>
      </div>

      <div className="p-4 border rounded-lg space-y-3">
        <h4 className="font-medium text-sm">Schnell-Einladung</h4>
        <p className="text-sm text-muted-foreground">
          Teilen Sie diesen Link mit Ihren Mitarbeitern. Nach der Registrierung 
          können Sie diese unter "Team" freischalten.
        </p>
        <div className="flex gap-2">
          <code className="flex-1 px-3 py-2 bg-muted rounded text-sm truncate">
            {window.location.origin}/auth
          </code>
          <Button variant="outline" size="icon" onClick={handleCopyInviteInfo}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleConfigure} variant="outline" className="gap-2 flex-1">
          <ExternalLink className="w-4 h-4" />
          Team verwalten
        </Button>
        
        {!acknowledged ? (
          <Button onClick={handleAcknowledge} variant="secondary" className="gap-2 flex-1">
            <Check className="w-4 h-4" />
            Später einrichten
          </Button>
        ) : (
          <Button disabled className="gap-2 flex-1 bg-green-500 hover:bg-green-500">
            <Check className="w-4 h-4" />
            Abgeschlossen
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Verwalten Sie Ihr Team jederzeit unter{" "}
        <Link to="/admin/users" className="text-primary hover:underline">
          Admin → Team
        </Link>
      </p>
    </div>
  );
}
