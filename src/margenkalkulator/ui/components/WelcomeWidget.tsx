// ============================================
// Welcome Widget - Onboarding für neue Testuser
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Palette, Package, FileText, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCloudOffers } from "@/margenkalkulator/hooks/useCloudOffers";

const STORAGE_KEY = "welcome_widget_dismissed";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  completed?: boolean;
}

export function WelcomeWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { offers, isLoading } = useCloudOffers();
  
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  // Don't show if dismissed or not logged in
  if (dismissed || !user) return null;
  
  // Don't show while loading
  if (isLoading) return null;
  
  // Don't show if user already has offers (not a new user)
  if ((offers?.length ?? 0) > 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  const handleStepClick = (href: string) => {
    navigate(href);
  };

  const steps: OnboardingStep[] = [
    {
      id: "branding",
      title: "Branding einstellen",
      description: "Logo hochladen und Unternehmensfarben festlegen",
      icon: Palette,
      href: "/settings/branding",
    },
    {
      id: "hardware",
      title: "Hardware importieren",
      description: "EK-Preise aus XLSX-Datei importieren",
      icon: Package,
      href: "/hardware-manager",
    },
    {
      id: "offer",
      title: "Erstes Angebot erstellen",
      description: "Den Kalkulator ausprobieren",
      icon: FileText,
      href: "/calculator",
    },
  ];

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 max-w-5xl mx-auto w-full mb-6 animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Willkommen im MargenKalkulator!</CardTitle>
              <p className="text-sm text-muted-foreground">
                In 3 Schritten loslegen
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Später
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.href)}
              className="group flex items-start gap-3 p-4 bg-background/60 hover:bg-background border border-border/50 hover:border-primary/30 rounded-lg transition-all text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 group-hover:bg-primary/20 rounded-lg flex items-center justify-center transition-colors">
                <step.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary/70">
                    Schritt {index + 1}
                  </span>
                </div>
                <h4 className="font-medium text-sm text-foreground mt-0.5">
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {step.description}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
