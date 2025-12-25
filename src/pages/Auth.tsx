import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SecureInput } from "@/components/ui/secure-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Loader2, Eye, EyeOff, AlertCircle, ShieldAlert } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { 
  isLoginLocked, 
  recordFailedLoginAttempt, 
  clearLoginAttempts,
  sanitizeInput,
  logSecurityEvent 
} from "@/lib/securityUtils";

// Validation schemas
const emailSchema = z.string().email("Ungültige E-Mail-Adresse").max(255, "E-Mail zu lang");
const passwordSchema = z.string().min(6, "Passwort muss mindestens 6 Zeichen haben").max(128, "Passwort zu lang");
const displayNameSchema = z.string().min(2, "Name muss mindestens 2 Zeichen haben").max(50, "Name zu lang");

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Brute-force protection state
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupDisplayName, setSignupDisplayName] = useState("");

  // Check lockout status on mount and periodically
  useEffect(() => {
    const checkLockout = () => {
      const lockStatus = isLoginLocked();
      if (lockStatus.locked && lockStatus.secondsRemaining) {
        setLockoutSeconds(lockStatus.secondsRemaining);
      } else {
        setLockoutSeconds(null);
      }
    };
    
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const validateField = (field: string, value: string, schema: z.ZodType) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      setErrors((prev) => ({ ...prev, [field]: result.error.errors[0].message }));
      return false;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check if currently locked out
    const lockStatus = isLoginLocked();
    if (lockStatus.locked) {
      toast.error(`Zu viele Fehlversuche. Bitte warte ${lockStatus.secondsRemaining} Sekunden.`);
      logSecurityEvent("login_locked", { category: "auth", severity: "warn" });
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(loginEmail.toLowerCase(), 255);
    const sanitizedPassword = loginPassword; // Don't sanitize password, just validate

    const emailValid = validateField("loginEmail", sanitizedEmail, emailSchema);
    const passwordValid = validateField("loginPassword", sanitizedPassword, passwordSchema);

    if (!emailValid || !passwordValid) return;

    setIsLoading(true);
    const { error } = await signIn(sanitizedEmail, sanitizedPassword);

    if (error) {
      setIsLoading(false);
      
      // Record failed attempt for brute-force protection
      const attemptResult = recordFailedLoginAttempt();
      
      if (attemptResult.isLocked) {
        toast.error(`Konto vorübergehend gesperrt. Bitte warte ${attemptResult.lockoutSeconds} Sekunden.`);
        setLockoutSeconds(attemptResult.lockoutSeconds || 300);
        logSecurityEvent("login_locked", { category: "auth", severity: "error" });
        return;
      }
      
      if (error.message.includes("Invalid login credentials")) {
        toast.error(`Ungültige Anmeldedaten. (${attemptResult.attemptsRemaining} Versuche übrig)`);
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Clear login attempts on success
    clearLoginAttempts();
    toast.success("Erfolgreich angemeldet!");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(signupEmail.toLowerCase(), 255);
    const sanitizedDisplayName = signupDisplayName ? sanitizeInput(signupDisplayName, 50) : "";

    const emailValid = validateField("signupEmail", sanitizedEmail, emailSchema);
    const passwordValid = validateField("signupPassword", signupPassword, passwordSchema);
    const nameValid = sanitizedDisplayName
      ? validateField("signupDisplayName", sanitizedDisplayName, displayNameSchema)
      : true;

    if (!emailValid || !passwordValid || !nameValid) return;

    setIsLoading(true);
    const { error } = await signUp(sanitizedEmail, signupPassword, sanitizedDisplayName || undefined);

    if (error) {
      setIsLoading(false);
      if (error.message.includes("already registered")) {
        toast.error("Diese E-Mail ist bereits registriert. Bitte melde dich an.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Konto erstellt! Du kannst dich jetzt anmelden.");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLockedOut = lockoutSeconds !== null && lockoutSeconds > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-elevated animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Calculator className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">MargenKalkulator</CardTitle>
            <CardDescription className="text-muted-foreground">
              Vodafone Business Partner Portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Lockout Warning */}
          {isLockedOut && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Zugriff vorübergehend gesperrt</p>
                <p className="text-muted-foreground">
                  Bitte warte {Math.ceil(lockoutSeconds / 60)} Minute(n) und versuche es erneut.
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="signup">Registrieren</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-Mail</Label>
                  <SecureInput
                    id="login-email"
                    type="email"
                    placeholder="name@firma.de"
                    value={loginEmail}
                    onChange={(e, sanitized) => setLoginEmail(sanitized)}
                    disabled={isLoading || isLockedOut}
                    autoComplete="email"
                    maxLength={255}
                    className={errors.loginEmail ? "border-destructive" : ""}
                  />
                  {errors.loginEmail && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.loginEmail}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Passwort</Label>
                  <div className="relative">
                    <SecureInput
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading || isLockedOut}
                      autoComplete="current-password"
                      maxLength={128}
                      className={errors.loginPassword ? "border-destructive" : ""}
                      detectThreats={false}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLockedOut}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.loginPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.loginPassword}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || isLockedOut}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Anmelden...
                    </>
                  ) : isLockedOut ? (
                    <>
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Gesperrt ({lockoutSeconds}s)
                    </>
                  ) : (
                    "Anmelden"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name (optional)</Label>
                  <SecureInput
                    id="signup-name"
                    type="text"
                    placeholder="Max Mustermann"
                    value={signupDisplayName}
                    onChange={(e, sanitized) => setSignupDisplayName(sanitized)}
                    disabled={isLoading}
                    autoComplete="name"
                    maxLength={50}
                    className={errors.signupDisplayName ? "border-destructive" : ""}
                  />
                  {errors.signupDisplayName && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.signupDisplayName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-Mail</Label>
                  <SecureInput
                    id="signup-email"
                    type="email"
                    placeholder="name@firma.de"
                    value={signupEmail}
                    onChange={(e, sanitized) => setSignupEmail(sanitized)}
                    disabled={isLoading}
                    autoComplete="email"
                    maxLength={255}
                    className={errors.signupEmail ? "border-destructive" : ""}
                  />
                  {errors.signupEmail && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.signupEmail}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Passwort</Label>
                  <div className="relative">
                    <SecureInput
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mindestens 6 Zeichen"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                      maxLength={128}
                      className={errors.signupPassword ? "border-destructive" : ""}
                      detectThreats={false}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.signupPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.signupPassword}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrieren...
                    </>
                  ) : (
                    "Konto erstellen"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
