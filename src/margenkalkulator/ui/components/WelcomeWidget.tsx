// ============================================
// Welcome Widget - Elegantes Onboarding im Sales Cockpit Style
// Prominente Positionierung mit Akzent-Border und Progress-Tracking
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
  Building2,
  ArrowRight
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
    navigate(step.href);
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
      <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-success/10 via-success/5 to-transparent max-w-5xl mx-auto w-full mb-8 animate-fade-in shadow-sm">
        {/* Left Accent Border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
        
        <CardContent className="py-6 px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-success bg-success/10 px-2 py-0.5 rounded">
                    Abgeschlossen
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  Einrichtung abgeschlossen! 🎉
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ihr MargenKalkulator ist einsatzbereit.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDismiss} className="gap-2">
              Schließen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 bg-card max-w-5xl mx-auto w-full mb-8 animate-fade-in shadow-lg">
      {/* Left Accent Border - Primary Color */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
      
      <CardContent className="py-8 px-8">
        {/* Header with Label */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-5">
            {/* Large Icon */}
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            
            <div>
              {/* Category Label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded">
                  Einrichtung
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Willkommen im MargenKalkulator
              </h2>
              <p className="text-muted-foreground">
                Richten Sie Ihr System in {steps.length} einfachen Schritten ein.
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

        {/* Steps Grid - Larger Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => !step.adminOnly && handleStepClick(step)}
              disabled={step.adminOnly}
              className={cn(
                "group relative flex flex-col p-6 rounded-2xl border-2 transition-all text-left",
                step.completed
                  ? "bg-success/5 border-success/30"
                  : step.adminOnly
                    ? "bg-muted/20 border-border cursor-not-allowed opacity-60"
                    : "bg-card hover:bg-muted/30 border-border hover:border-primary/50 hover:shadow-lg cursor-pointer"
              )}
            >
              {/* Step Number Badge - Larger */}
              <div className={cn(
                "absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md",
                step.completed
                  ? "bg-success text-white"
                  : "bg-primary text-white"
              )}>
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  step.step
                )}
              </div>

              {/* Icon - Larger */}
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors",
                step.completed
                  ? "bg-success/10"
                  : step.adminOnly
                    ? "bg-muted"
                    : "bg-primary/10 group-hover:bg-primary/15"
              )}>
                <step.icon className={cn(
                  "w-7 h-7",
                  step.completed
                    ? "text-success"
                    : step.adminOnly
                      ? "text-muted-foreground"
                      : "text-primary"
                )} />
              </div>

              {/* Content */}
              <h3 className={cn(
                "font-semibold text-lg mb-2",
                step.completed ? "text-success" : "text-foreground"
              )}>
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                {step.description}
              </p>

              {/* Action */}
              {!step.completed && !step.adminOnly && (
                <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  Starten
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
              {step.completed && (
                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Erledigt
                </div>
              )}
              {step.adminOnly && !step.completed && (
                <div className="text-xs text-muted-foreground italic">
                  Nur für Administratoren
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Progress Bar - Enhanced */}
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground font-medium">Fortschritt</span>
            <span className="font-bold text-foreground">
              {progressPercent}% abgeschlossen
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
          <p className="text-xs text-muted-foreground text-center mt-3">
            Sie können diese Einrichtung jederzeit über die Einstellungen fortsetzen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
