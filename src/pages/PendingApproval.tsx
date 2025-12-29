import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, Mail } from "lucide-react";

export default function PendingApproval() {
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Konto wird geprüft</CardTitle>
          <CardDescription>
            Deine Registrierung wird derzeit von einem Administrator überprüft.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Was passiert als nächstes?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ein Administrator wird deine Anfrage prüfen</li>
              <li>Nach Freischaltung erhältst du vollen Zugang</li>
              <li>Du kannst dich dann mit deinen Zugangsdaten anmelden</li>
            </ul>
          </div>

          {user?.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Angemeldet als: {user.email}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              Bei Fragen wende dich an deinen Administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
