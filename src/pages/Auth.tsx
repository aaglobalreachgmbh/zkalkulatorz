import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SecureInput } from "@/components/ui/secure-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Turnstile, useTurnstile } from "@/components/ui/turnstile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calculator, Loader2, Eye, EyeOff, AlertCircle, ShieldAlert, ExternalLink, CheckCircle, Building2, Mail, KeyRound } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  isLoginLocked, 
  recordFailedLoginAttempt, 
  clearLoginAttempts,
  sanitizeInput,
  logSecurityEvent 
} from "@/lib/securityUtils";
import { PUBLISHER } from "@/margenkalkulator/publisherConfig";
import { PublisherModal } from "@/components/PublisherModal";
import { validateInviteToken, getInviteFromUrl } from "@/hooks/useEmailAllowlist";
import { cn } from "@/lib/utils";

// Validation schemas
const emailSchema = z.string().email("Ungültige E-Mail-Adresse").max(255, "E-Mail zu lang");
const passwordSchema = z.string().min(6, "Passwort muss mindestens 6 Zeichen haben").max(128, "Passwort zu lang");
const displayNameSchema = z.string().min(2, "Name muss mindestens 2 Zeichen haben").max(50, "Name zu lang");

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Brute-force protection state
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

// ============================================================================
  // REGEL: Turnstile darf NIEMALS den Login-Button blockieren!
  // Turnstile ist optional und dient nur als zusätzlicher Schutz.
  // Wenn Turnstile nicht konfiguriert, fehlschlägt oder nicht verifiziert ist,
  // MUSS der Login trotzdem möglich sein.
  // Button disabled-Logik darf NUR isLoading und isLockedOut prüfen!
  // ============================================================================
  const turnstileEnabled = !!import.meta.env.VITE_TURNSTILE_SITE_KEY;

  // Turnstile state - with fallback enabled for network restrictions
  const loginTurnstile = useTurnstile({ allowFallback: true });
  const signupTurnstile = useTurnstile({ allowFallback: true });
  
  // If Turnstile is not configured, mark as verified immediately
  useEffect(() => {
    if (!turnstileEnabled) {
      // Simulate verified state when Turnstile is disabled
    }
  }, [turnstileEnabled]);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupDisplayName, setSignupDisplayName] = useState("");

  // Password reset state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Invite token state
  const [inviteInfo, setInviteInfo] = useState<{
    valid: boolean;
    email: string;
    tenantId: string;
    role: string;
    companyName: string;
  } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("login");

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

  // Check for invite token in URL
  useEffect(() => {
    const checkInviteToken = async () => {
      const token = getInviteFromUrl();
      if (!token) {
        setInviteLoading(false);
        return;
      }

      const result = await validateInviteToken(token);
      if (result.valid && result.email) {
        setInviteInfo({
          valid: true,
          email: result.email,
          tenantId: result.tenantId || "",
          role: result.role || "user",
          companyName: result.companyName || "",
        });
        // Pre-fill signup email and switch to signup tab
        setSignupEmail(result.email);
        setActiveTab("signup");
      }
      setInviteLoading(false);
    };

    checkInviteToken();
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

// Turnstile komplett deaktiviert - siehe REGEL oben

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
      loginTurnstile.reset();
      
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

// Turnstile komplett deaktiviert - siehe REGEL oben

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
    
    // Check if email is in allowlist (skip for now - handled by trigger)
    // Future: Add pre-registration check here
    
    const { error } = await signUp(sanitizedEmail, signupPassword, sanitizedDisplayName || undefined);

    if (error) {
      setIsLoading(false);
      signupTurnstile.reset();
      if (error.message.includes("already registered")) {
        toast.error("Diese E-Mail ist bereits registriert. Bitte melde dich an.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Konto erstellt! Du kannst dich jetzt anmelden.");
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Bitte geben Sie Ihre E-Mail-Adresse ein");
      return;
    }

    const emailResult = emailSchema.safeParse(resetEmail.toLowerCase());
    if (!emailResult.success) {
      toast.error("Ungültige E-Mail-Adresse");
      return;
    }

    setIsResetting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error("[Auth] Password reset error:", error);
        toast.error("Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.");
        setIsResetting(false);
        return;
      }

      toast.success("Falls ein Konto mit dieser E-Mail existiert, erhalten Sie einen Link zum Zurücksetzen.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      console.error("[Auth] Unexpected error:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsResetting(false);
    }
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
      <div className="w-full max-w-md flex flex-col items-center">
      <Card className="w-full shadow-elevated animate-fade-in">
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                    name="email"
                    type="email"
                    placeholder="name@firma.de"
                    value={loginEmail}
                    onChange={(e, sanitized) => setLoginEmail(sanitized)}
                    disabled={isLoading || isLockedOut}
                    autoComplete="username email"
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
                      name="password"
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
                
{/* Turnstile komplett deaktiviert - blockiert Login */}
                
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

                {/* Google OAuth Separator */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      oder
                    </span>
                  </div>
                </div>

                {/* Google Login Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setIsLoading(true);
                    const { error } = await signInWithGoogle();
                    if (error) {
                      toast.error("Google-Anmeldung fehlgeschlagen: " + error.message);
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || isLockedOut}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Mit Google anmelden
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setResetEmail(loginEmail);
                    setShowForgotPassword(true);
                  }}
                  disabled={isLockedOut}
                >
                  <KeyRound className="w-3 h-3 mr-1" />
                  Passwort vergessen?
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-4 mt-4">
              {/* Invite Banner */}
              {inviteInfo?.valid && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Sie wurden eingeladen!
                      </p>
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                        <Building2 className="w-4 h-4" />
                        <span><strong>Firma:</strong> {inviteInfo.companyName}</span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>Rolle:</strong> {inviteInfo.role === "tenant_admin" ? "Administrator" : "Mitarbeiter"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name (optional)</Label>
                  <SecureInput
                    id="signup-name"
                    name="name"
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
                    name="email"
                    type="email"
                    placeholder="name@firma.de"
                    value={signupEmail}
                    onChange={(e, sanitized) => setSignupEmail(sanitized)}
                    disabled={isLoading || !!inviteInfo?.valid}
                    readOnly={!!inviteInfo?.valid}
                    autoComplete="email"
                    maxLength={255}
                    className={cn(
                      errors.signupEmail ? "border-destructive" : "",
                      inviteInfo?.valid && "bg-muted cursor-not-allowed"
                    )}
                  />
                  {inviteInfo?.valid && (
                    <p className="text-xs text-muted-foreground">
                      E-Mail-Adresse aus der Einladung
                    </p>
                  )}
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
                      name="new-password"
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
                
{/* Turnstile komplett deaktiviert - blockiert Login */}
                
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
                <p className="text-xs text-center text-muted-foreground">
                  Mit der Registrierung akzeptieren Sie unsere{" "}
                  <a href="/datenschutz" className="underline hover:text-primary">
                    Datenschutzhinweise
                  </a>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Publisher Footer - below login card */}
      <div className="mt-6 text-center space-y-2 w-full">
        <p className="text-xs text-muted-foreground">
          {PUBLISHER.getCopyright()} — interner Zugang
        </p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <PublisherModal 
            trigger={
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                Über diese App
              </button>
            } 
          />
          <a
            href={PUBLISHER.links.impressum}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            Impressum
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={PUBLISHER.links.datenschutz}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            Datenschutz
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Passwort zurücksetzen
            </DialogTitle>
            <DialogDescription>
              Geben Sie Ihre E-Mail-Adresse ein. Falls ein Konto existiert, erhalten Sie einen Link zum Zurücksetzen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-Mail-Adresse</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@firma.de"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResetting}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForgotPassword(false)}
                disabled={isResetting}
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handlePasswordReset}
                disabled={isResetting || !resetEmail}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Senden...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Link senden
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
