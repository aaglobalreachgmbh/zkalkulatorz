// ============================================
// Security Settings Page
// MFA setup and account security management
// ============================================

import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { MFASetup } from "@/components/mfa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, User, Mail, Clock, ShieldAlert } from "lucide-react";
import { Navigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";

export default function SecuritySettings() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <div className="container max-w-2xl py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8" />
            Sicherheitseinstellungen
          </h1>
          <p className="text-muted-foreground">
            Verwalte deine Kontoeinstellungen und Sicherheitsoptionen.
          </p>
        </div>

        <Separator />

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Konto-Informationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">E-Mail</span>
              </div>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Erstellt am</span>
              </div>
              <span className="text-sm font-medium">
                {new Date(user.created_at).toLocaleDateString("de-DE")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Rolle</span>
              </div>
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {isAdmin ? "Administrator" : "Benutzer"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* MFA Section - Only for Admins */}
        {isAdmin ? (
          <MFASetup />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Zwei-Faktor-Authentifizierung
              </CardTitle>
              <CardDescription>
                2FA ist nur für Administratoren verfügbar.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
