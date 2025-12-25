// ============================================
// MFA Verify Component
// TOTP verification during login
// ============================================

import { useState } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SecureInput } from "@/components/ui/secure-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Smartphone, Key, Loader2, ArrowLeft } from "lucide-react";

interface MFAVerifyProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function MFAVerify({ onSuccess, onCancel }: MFAVerifyProps) {
  const { challengeAndVerify, verifyBackupCode, isVerifying } = useMFA();
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [activeTab, setActiveTab] = useState<"totp" | "backup">("totp");

  const handleTOTPVerify = async () => {
    if (code.length !== 6) return;
    
    const success = await challengeAndVerify(code);
    if (success) {
      onSuccess();
    } else {
      setCode("");
    }
  };

  const handleBackupVerify = async () => {
    if (!backupCode) return;
    
    const success = await verifyBackupCode(backupCode);
    if (success) {
      onSuccess();
    } else {
      setBackupCode("");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
        <CardDescription>
          Gib den Code aus deiner Authenticator-App ein
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "totp" | "backup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              App-Code
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Backup-Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">6-stelliger Code</Label>
              <SecureInput
                id="totp-code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="font-mono text-center text-2xl tracking-[0.5em]"
                detectThreats={false}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length === 6) {
                    handleTOTPVerify();
                  }
                }}
              />
            </div>
            
            <Button 
              onClick={handleTOTPVerify}
              disabled={code.length !== 6 || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifiziere...
                </>
              ) : (
                "Verifizieren"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup-Code</Label>
              <SecureInput
                id="backup-code"
                type="text"
                placeholder="XXXXXXXX"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="font-mono text-center text-lg tracking-widest"
                detectThreats={false}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && backupCode.length === 8) {
                    handleBackupVerify();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Backup-Codes können nur einmal verwendet werden.
              </p>
            </div>
            
            <Button 
              onClick={handleBackupVerify}
              disabled={backupCode.length < 8 || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifiziere...
                </>
              ) : (
                "Mit Backup-Code anmelden"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {onCancel && (
          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="w-full mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Anmeldung
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
