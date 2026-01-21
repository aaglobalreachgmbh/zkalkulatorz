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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <Card className="w-full rounded-2xl shadow-lg border-border/50 animate-fade-in">
          <CardHeader className="text-center space-y-6 pb-2 pt-8">
            {/* Logo */}
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Calculator className="w-10 h-10 text-primary-foreground" />
            </div>
            
            {/* Title & Subtitle */}
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                MargenKalkulator
              </CardTitle>
              <p className="text-sm font-medium text-primary">
                Vodafone Business Partner
              </p>
              <CardDescription className="text-muted-foreground pt-2">
                {isLogin ? "Anmelden" : "Konto erstellen"}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  type="email"
                  placeholder="ihre@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
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

            {/* Security Note */}
            <div className="pt-6 mt-6 border-t border-border/50">
              <p className="text-xs text-center text-muted-foreground">
                🔒 Sichere Authentifizierung
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publisher Info */}
        <div className="mt-8 text-center">
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