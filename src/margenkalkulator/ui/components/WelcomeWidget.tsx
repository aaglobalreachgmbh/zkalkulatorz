// ============================================
// Welcome Widget - Prominentes Onboarding für Firmeninhaber
// Phase 1: Setup-Wizard Card mit Branding als Schritt 1
// ============================================

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Palette, 
  FileText, 
  Users, 
  ChevronRight, 
  X, 
  CheckCircle2,
  Sparkles,
  Building2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useCloudOffers } from "@/margenkalkulator/hooks/useCloudOffers";
import { useTenantAdmin } from "@/hooks/useTenantAdmin";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "welcome_widget_dismissed";
const STORAGE_KEY_STEPS = "welcome_widget_completed_steps";

interface OnboardingStep {
  id: string;
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  completed: boolean;
  adminOnly?: boolean;
}

export function WelcomeWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { offers, isLoading } = useCloudOffers();
  const { isTenantAdmin, isLoading: isRoleLoading } = useTenantAdmin();
  const { branding, isLoading: isBrandingLoading } = useTenantBranding();
  
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_STEPS);
    return stored ? JSON.parse(stored) : [];
  });

  // Check if branding is configured
  const hasBranding = useMemo(() => {
    if (!branding) return false;
    return !!(branding.logoUrl || branding.primaryColor);
  }, [branding]);

  // Check if user has offers
  const hasOffers = (offers?.length ?? 0) > 0;

  // Don't show if dismissed or not logged in
  if (dismissed || !user) return null;
  
  // Don't show while loading
  if (isLoading || isRoleLoading || isBrandingLoading) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  const handleStepClick = (step: OnboardingStep) => {
    // Mark step as started (not completed - that happens on return)
    navigate(step.href);
  };

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      const updated = [...completedSteps, stepId];
      setCompletedSteps(updated);
      localStorage.setItem(STORAGE_KEY_STEPS, JSON.stringify(updated));
    }
  };

  // Build steps - Branding is ALWAYS step 1 for admins
  const steps: OnboardingStep[] = useMemo(() => {
    const allSteps: OnboardingStep[] = [];
    let stepNum = 1;

    // Step 1: Branding (Admin only, but shown to all with different messaging)
    allSteps.push({
      id: "branding",
      step: stepNum++,
      title: "Branding einrichten",
      description: isTenantAdmin 
        ? "Logo & Farben für Ihre Angebote" 
        : "Vom Administrator einzurichten",
      icon: Palette,
      href: "/settings/branding",
      completed: hasBranding || completedSteps.includes("branding"),
      adminOnly: !isTenantAdmin,
    });

    // Step 2: Create first offer
    allSteps.push({
      id: "offer",
      step: stepNum++,
      title: "Erstes Angebot erstellen",
      description: "Den Kalkulator ausprobieren",
      icon: FileText,
      href: "/calculator",
      completed: hasOffers || completedSteps.includes("offer"),
    });

    // Step 3: Add customers
    allSteps.push({
      id: "customers",
      step: stepNum++,
      title: "Kunden anlegen",
      description: "Kundendaten für Angebote",
      icon: Users,
      href: "/customers?action=new",
      completed: completedSteps.includes("customers"),
    });

    return allSteps;
  }, [isTenantAdmin, hasBranding, hasOffers, completedSteps]);

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allComplete = completedCount === steps.length;

  // Auto-dismiss if all steps complete
  if (allComplete && !dismissed) {
    return (
      <Card className="border-success/30 bg-gradient-to-r from-success/5 to-success/10 max-w-5xl mx-auto w-full mb-8 animate-fade-in">
        <CardContent className="py-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-success/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Einrichtung abgeschlossen! 🎉
                </h2>
                <p className="text-muted-foreground">
                  Ihr MargenKalkulator ist einsatzbereit.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              Schließen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 max-w-5xl mx-auto w-full mb-8 animate-fade-in shadow-lg">
      <CardContent className="py-6 px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Willkommen im MargenKalkulator!
                <Sparkles className="w-5 h-5 text-primary" />
              </h2>
              <p className="text-muted-foreground">
                Richten Sie Ihr System in {steps.length} Schritten ein
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground -mt-1"
          >
            <X className="w-4 h-4 mr-1" />
            Später
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Fortschritt</span>
            <span className="font-medium text-primary">
              {completedCount}/{steps.length} Schritte
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => !step.adminOnly && handleStepClick(step)}
              disabled={step.adminOnly}
              className={cn(
                "group relative flex flex-col p-5 rounded-xl border transition-all text-left",
                step.completed
                  ? "bg-success/5 border-success/30"
                  : step.adminOnly
                    ? "bg-muted/30 border-border/50 cursor-not-allowed opacity-70"
                    : "bg-card hover:bg-card/80 border-border hover:border-primary/40 hover:shadow-md cursor-pointer"
              )}
            >
              {/* Step Number Badge */}
              <div className={cn(
                "absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                step.completed
                  ? "bg-success text-success-foreground"
                  : "bg-primary text-primary-foreground"
              )}>
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  step.step
                )}
              </div>

              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                step.completed
                  ? "bg-success/10"
                  : step.adminOnly
                    ? "bg-muted"
                    : "bg-primary/10 group-hover:bg-primary/20"
              )}>
                <step.icon className={cn(
                  "w-6 h-6",
                  step.completed
                    ? "text-success"
                    : step.adminOnly
                      ? "text-muted-foreground"
                      : "text-primary"
                )} />
              </div>

              {/* Content */}
              <h3 className={cn(
                "font-semibold text-base mb-1",
                step.completed ? "text-success" : "text-foreground"
              )}>
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {step.description}
              </p>

              {/* Action */}
              {!step.completed && !step.adminOnly && (
                <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  Starten
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
              {step.completed && (
                <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Erledigt
                </div>
              )}
              {step.adminOnly && !step.completed && (
                <div className="mt-auto text-xs text-muted-foreground italic">
                  Nur für Administratoren
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Sie können diese Einrichtung jederzeit über die Einstellungen fortsetzen.
        </p>
      </CardContent>
    </Card>
  );
}
