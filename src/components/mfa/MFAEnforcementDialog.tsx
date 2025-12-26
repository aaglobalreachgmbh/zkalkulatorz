import { useState } from "react";
import { Shield, AlertTriangle, Loader2, Copy, Check, Key, ArrowRight } from "lucide-react";
import { useMFA } from "@/components/mfa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export function MFAEnforcementDialog() {
  const {
    enrollTOTP,
    verifyEnrollment,
    generateBackupCodes,
    enrollmentData,
    isEnrolling,
    isVerifying,
    cancelEnrollment,
  } = useMFA();

  const [step, setStep] = useState<"intro" | "setup" | "verify" | "backup" | "complete">("intro");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleStartSetup = async () => {
    const result = await enrollTOTP("Admin MFA");
    if (result) {
      setStep("setup");
    } else {
      toast.error("Fehler beim Starten der MFA-Einrichtung");
    }
  };

  const handleVerify = async () => {
    if (!enrollmentData?.factorId || verificationCode.length !== 6) return;

    const success = await verifyEnrollment(enrollmentData.factorId, verificationCode);
    if (success) {
      setStep("backup");
      const codes = await generateBackupCodes();
      if (codes) {
        setBackupCodes(codes);
      }
    } else {
      toast.error("Ungültiger Code. Bitte versuchen Sie es erneut.");
      setVerificationCode("");
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    toast.success("Backup-Codes kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    setStep("complete");
    // Page will reload or redirect as MFA is now enabled
    window.location.reload();
  };

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-lg [&>button]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>MFA erforderlich für Administratoren</DialogTitle>
              <DialogDescription>
                Als Administrator müssen Sie die Zwei-Faktor-Authentifizierung aktivieren.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Sicherheitsanforderung</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Administratoren haben Zugriff auf sensible Daten und Einstellungen. 
                      Um Ihr Konto und das System zu schützen, ist MFA Pflicht.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Was Sie benötigen:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Eine Authenticator-App (Google Authenticator, Authy, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  2-3 Minuten Zeit für die Einrichtung
                </li>
              </ul>
            </div>

            <Button onClick={handleStartSetup} disabled={isEnrolling} className="w-full">
              {isEnrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird eingerichtet...
                </>
              ) : (
                <>
                  MFA jetzt einrichten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === "setup" && enrollmentData && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Scannen Sie diesen QR-Code mit Ihrer Authenticator-App:
              </p>
              <div className="bg-white p-4 rounded-lg inline-block">
                <img
                  src={enrollmentData.qrCode}
                  alt="MFA QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Oder geben Sie diesen Code manuell ein:
              </p>
              <code className="block text-xs bg-muted p-2 rounded text-center break-all font-mono">
                {enrollmentData.secret}
              </code>
            </div>

            <Button onClick={() => setStep("verify")} className="w-full">
              Weiter zur Verifizierung
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein:
            </p>

            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />

            <Button 
              onClick={handleVerify} 
              disabled={verificationCode.length !== 6 || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird verifiziert...
                </>
              ) : (
                "Code verifizieren"
              )}
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => {
                cancelEnrollment();
                setStep("setup");
              }}
              className="w-full"
            >
              Zurück zum QR-Code
            </Button>
          </div>
        )}

        {step === "backup" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 justify-center">
              <Check className="h-5 w-5" />
              <span className="font-medium">MFA erfolgreich aktiviert!</span>
            </div>

            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Key className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Backup-Codes sichern</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Speichern Sie diese Codes an einem sicheren Ort. Sie können jeden Code 
                      einmal verwenden, falls Sie keinen Zugang zu Ihrer Authenticator-App haben.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {backupCodes.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code
                      key={index}
                      className="text-sm bg-muted p-2 rounded font-mono text-center"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={handleCopyBackupCodes}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Alle Codes kopieren
                    </>
                  )}
                </Button>
              </div>
            )}

            <Button onClick={handleComplete} className="w-full">
              Fertig – Zum Dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
