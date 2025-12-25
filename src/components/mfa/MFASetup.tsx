// ============================================
// MFA Setup Component
// TOTP enrollment with QR code and backup codes
// ============================================

import { useState } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SecureInput } from "@/components/ui/secure-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Key,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export function MFASetup() {
  const {
    hasMFA,
    factors,
    backupCodesCount,
    isLoading,
    isEnrolling,
    isVerifying,
    enrollmentData,
    enrollTOTP,
    verifyEnrollment,
    unenrollTOTP,
    generateBackupCodes,
    cancelEnrollment,
  } = useMFA();

  const [verifyCode, setVerifyCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);

  // Start enrollment
  const handleEnroll = async () => {
    await enrollTOTP("Google Authenticator");
  };

  // Verify and complete enrollment
  const handleVerify = async () => {
    if (!enrollmentData || !verifyCode) return;
    
    const success = await verifyEnrollment(enrollmentData.factorId, verifyCode);
    if (success) {
      setVerifyCode("");
      // Generate backup codes after successful enrollment
      handleGenerateBackupCodes();
    }
  };

  // Disable MFA
  const handleDisable = async () => {
    const totpFactor = factors.find(f => f.factor_type === "totp" && f.status === "verified");
    if (totpFactor) {
      await unenrollTOTP(totpFactor.id);
    }
  };

  // Generate new backup codes
  const handleGenerateBackupCodes = async () => {
    setIsGeneratingCodes(true);
    const codes = await generateBackupCodes();
    setGeneratedBackupCodes(codes);
    setShowBackupCodes(true);
    setIsGeneratingCodes(false);
  };

  // Copy code to clipboard
  const copyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Code kopiert");
  };

  // Copy all codes
  const copyAllCodes = async () => {
    await navigator.clipboard.writeText(generatedBackupCodes.join("\n"));
    toast.success("Alle Codes kopiert");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {hasMFA ? (
              <ShieldCheck className="w-6 h-6 text-green-500" />
            ) : (
              <Shield className="w-6 h-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="flex items-center gap-2">
                Zwei-Faktor-Authentifizierung
                {hasMFA && (
                  <Badge variant="default" className="bg-green-500">
                    Aktiv
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Schütze dein Konto mit Google Authenticator
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasMFA && !enrollmentData && (
            <>
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Als Admin solltest du 2FA aktivieren, um dein Konto besser zu schützen.
                </AlertDescription>
              </Alert>
              
              <Button onClick={handleEnroll} disabled={isEnrolling}>
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Einrichten...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    2FA einrichten
                  </>
                )}
              </Button>
            </>
          )}

          {enrollmentData && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  Scanne den QR-Code mit Google Authenticator oder einer ähnlichen App:
                </p>
                
                <div className="flex justify-center mb-4">
                  <img 
                    src={enrollmentData.qrCode} 
                    alt="TOTP QR Code" 
                    className="w-48 h-48 rounded-lg bg-white p-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Oder gib diesen Code manuell ein:
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded text-xs font-mono break-all">
                      {enrollmentData.secret}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(enrollmentData.secret);
                        toast.success("Secret kopiert");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-code">
                  Verifizierungscode aus der App eingeben:
                </Label>
                <div className="flex gap-2">
                  <SecureInput
                    id="verify-code"
                    type="text"
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="font-mono text-center text-lg tracking-widest"
                    detectThreats={false}
                  />
                  <Button 
                    onClick={handleVerify}
                    disabled={verifyCode.length !== 6 || isVerifying}
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button variant="ghost" onClick={cancelEnrollment} className="w-full">
                Abbrechen
              </Button>
            </div>
          )}

          {hasMFA && !enrollmentData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Backup-Codes</p>
                    <p className="text-xs text-muted-foreground">
                      {backupCodesCount} Codes verfügbar
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGenerateBackupCodes}
                  disabled={isGeneratingCodes}
                >
                  {isGeneratingCodes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Neu generieren
                    </>
                  )}
                </Button>
              </div>

              <Button 
                variant="destructive" 
                onClick={handleDisable}
                className="w-full"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                2FA deaktivieren
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Backup-Codes
            </DialogTitle>
            <DialogDescription>
              Speichere diese Codes sicher. Du kannst sie verwenden, wenn du keinen Zugriff auf deine Authenticator-App hast.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Diese Codes werden nur einmal angezeigt. Speichere sie jetzt!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-2">
            {generatedBackupCodes.map((code, index) => (
              <button
                key={index}
                onClick={() => copyCode(code, index)}
                className="p-2 bg-muted hover:bg-muted/80 rounded font-mono text-sm flex items-center justify-between group transition-colors"
              >
                <span>{code}</span>
                {copiedIndex === index ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={copyAllCodes} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Alle kopieren
            </Button>
            <Button onClick={() => setShowBackupCodes(false)} className="flex-1">
              Fertig
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
