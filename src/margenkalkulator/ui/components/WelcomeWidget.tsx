// ============================================
// Welcome Widget - Modernes, elegantes Onboarding
// Clean Design mit subtilen Schatten und sanften Übergängen
// ============================================

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Palette, 
  FileText, 
  Users, 
  X, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      title: "Branding",
      description: isTenantAdmin 
        ? "Logo & Farben einrichten" 
        : "Vom Admin einzurichten",
      icon: Palette,
      href: "/settings/branding",
      completed: hasBranding || completedSteps.includes("branding"),
      adminOnly: !isTenantAdmin,
    });

    // Step 2: Create first offer
    allSteps.push({
      id: "offer",
      step: stepNum++,
      title: "Erstes Angebot",
      description: "Kalkulator testen",
      icon: FileText,
      href: "/calculator",
      completed: hasOffers || completedSteps.includes("offer"),
    });

    // Step 3: Add customers
    allSteps.push({
      id: "customers",
      step: stepNum++,
      title: "Kunden anlegen",
      description: "Kundendaten pflegen",
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
      <div className="max-w-5xl mx-auto w-full mb-6 animate-fade-in">
        <div className="bg-success/5 border border-success/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Einrichtung abgeschlossen 🎉
                </p>
                <p className="text-sm text-muted-foreground">
                  Ihr MargenKalkulator ist einsatzbereit.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Schließen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full mb-6 animate-fade-in">
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Subtle gradient top border */}
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Willkommen im MargenKalkulator
                </h2>
                <p className="text-sm text-muted-foreground">
                  {completedCount}/{steps.length} Schritte abgeschlossen
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Steps - Horizontal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => !step.adminOnly && handleStepClick(step)}
                disabled={step.adminOnly}
                className={cn(
                  "group relative flex items-center gap-4 p-4 rounded-xl transition-all text-left",
                  step.completed
                    ? "bg-success/5 border border-success/20"
                    : step.adminOnly
                      ? "bg-muted/30 border border-border/50 cursor-not-allowed opacity-60"
                      : "bg-muted/20 border border-border/50 hover:border-primary/30 hover:bg-muted/40 cursor-pointer"
                )}
              >
                {/* Icon with step indicator */}
                <div className={cn(
                  "relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  step.completed
                    ? "bg-success/10"
                    : step.adminOnly
                      ? "bg-muted/50"
                      : "bg-primary/10 group-hover:bg-primary/15"
                )}>
                  <step.icon className={cn(
                    "w-5 h-5",
                    step.completed
                      ? "text-success"
                      : step.adminOnly
                        ? "text-muted-foreground"
                        : "text-primary"
                  )} />
                  
                  {/* Completion check badge */}
                  {step.completed && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-medium text-sm",
                    step.completed ? "text-success" : "text-foreground"
                  )}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for actionable items */}
                {!step.completed && !step.adminOnly && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <p className="text-xs text-muted-foreground text-center mt-5">
            Sie können die Einrichtung jederzeit über Einstellungen fortsetzen
          </p>
        </div>
      </div>
    </div>
  );
}
