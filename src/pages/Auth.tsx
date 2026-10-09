import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PUBLISHER } from "@/margenkalkulator/publisherConfig";
import { PublisherModal } from "@/components/PublisherModal";
import { supabase } from "@/integrations/supabase/client";
import { isTestModeAllowed, enableTestMode } from "@/lib/testMode";

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Bitte E-Mail und Passwort eingeben");
      return;
    }

    if (!isLogin && !displayName) {
      toast.error("Bitte einen Namen eingeben");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("E-Mail noch nicht bestätigt. Bitte prüfen Sie Ihr Postfach.");
          } else {
            toast.error(`Anmeldung fehlgeschlagen: ${error.message}`);
          }
        } else {
          toast.success("Erfolgreich angemeldet");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Diese E-Mail-Adresse ist bereits registriert.");
          } else {
            toast.error(`Registrierung fehlgeschlagen: ${error.message}`);
          }
        } else {
          toast.success("Registrierung erfolgreich! Sie können sich jetzt anmelden.");
          setIsLogin(true);
          setPassword("");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Bitte zuerst Ihre E-Mail eingeben");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
    });
    if (error) toast.error(`Login-Link fehlgeschlagen: ${error.message}`);
    else toast.success("Login-Link gesendet – bitte Postfach prüfen.");
  };

  const handleTestMode = () => {
    enableTestMode();
    navigate("/", { replace: true });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-svh overflow-y-auto flex items-start justify-center bg-gradient-to-br from-background via-background to-muted/20 p-3 sm:items-center sm:p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <Card className="w-full rounded-lg shadow-lg border-border/50 animate-fade-in sm:rounded-2xl">
          <CardHeader className="space-y-3 pb-2 pt-5 text-center sm:space-y-6 sm:pt-8">
            {/* Logo */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary shadow-lg sm:h-20 sm:w-20 sm:rounded-2xl">
              <Calculator className="h-6 w-6 text-primary-foreground sm:h-10 sm:w-10" />
            </div>
            
            {/* Title & Subtitle */}
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                MargenKalkulator
              </CardTitle>
              <p className="hidden text-sm font-medium text-primary sm:block">
                Vodafone Business Partner
              </p>
              <CardDescription className="text-muted-foreground pt-2">
                {isLogin ? "Anmelden" : "Konto erstellen"}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-4 pb-5 sm:px-8 sm:pb-8">
            <form onSubmit={handleSubmit} method="post" action="#" autoComplete="on" className="space-y-4 sm:space-y-5">
              {/* Display Name - nur bei Registrierung */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    Name
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Ihr Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-Mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ihre@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="username"
                  className="h-11"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Passwort
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="h-11"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-semibold mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? "Anmelden..." : "Registrieren..."}
                  </>
                ) : (
                  isLogin ? "Anmelden" : "Registrieren"
                )}
              </Button>

              {/* Toggle Login/Register */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setPassword("");
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  {isLogin 
                    ? "Noch kein Konto? Jetzt registrieren" 
                    : "Bereits registriert? Anmelden"}
                </button>
              </div>
            </form>
            {isLogin && (
              <div className="mt-4 space-y-2">
                <Button type="button" variant="ghost" className="w-full" onClick={handleMagicLink}>
                  Login-Link per E-Mail (ohne Passwort)
                </Button>
                {isTestModeAllowed() && (
                  <Button type="button" variant="outline" className="w-full border-warning" onClick={handleTestMode}>
                    Ohne Login testen (nur Vorschau)
                  </Button>
                )}
              </div>
            )}

            {/* Security Note */}
            <div className="hidden pt-6 mt-6 border-t border-border/50 sm:block">
              <p className="text-xs text-center text-muted-foreground">
                🔒 Sichere Authentifizierung
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publisher Info */}
        <div className="mt-4 hidden text-center sm:block">
          <PublisherModal
            trigger={
              <button className="text-xs text-muted-foreground/70 hover:text-primary transition-colors duration-200">
                {PUBLISHER.getCopyright()}
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}