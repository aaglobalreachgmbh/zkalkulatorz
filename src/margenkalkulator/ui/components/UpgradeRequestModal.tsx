// ============================================
// Upgrade Request Modal
// Modal zum Anfordern eines Lizenz-Upgrades
// ============================================

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Send, Loader2, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useToast } from "@/hooks/use-toast";

interface UpgradeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
}

const PLANS = [
  {
    id: "pro",
    name: "Pro",
    price: "49€/Monat",
    seats: "10 Seats",
    features: ["PDF-Export", "Cloud-Sync", "Team-Verwaltung", "KI-Berater"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Auf Anfrage",
    seats: "Unbegrenzt",
    features: ["Alle Pro-Features", "API-Zugang", "Custom Branding", "Dedizierter Support"],
  },
];

export function UpgradeRequestModal({ 
  open, 
  onOpenChange, 
  currentPlan 
}: UpgradeRequestModalProps) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = () => {
    setSelectedPlan("pro");
    setMessage("");
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Build email content
    const subject = encodeURIComponent(
      `Lizenz-Upgrade Anfrage: ${selectedPlan.toUpperCase()}`
    );
    const body = encodeURIComponent(
      `Upgrade-Anfrage\n` +
      `================\n\n` +
      `Von: ${user?.email || "Unbekannt"}\n` +
      `Tenant: ${identity.tenantId}\n` +
      `Aktueller Plan: ${currentPlan}\n` +
      `Gewünschter Plan: ${selectedPlan}\n\n` +
      `Nachricht:\n${message || "(Keine zusätzliche Nachricht)"}\n\n` +
      `---\n` +
      `Gesendet vom MargenKalkulator`
    );

    // Open mailto link
    const mailtoLink = `mailto:support@allenetze.de?subject=${subject}&body=${body}`;
    
    // Simulate a short delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    window.open(mailtoLink, "_blank");
    
    setIsSubmitting(false);
    setSubmitted(true);

    toast({
      title: "E-Mail-Client geöffnet",
      description: "Bitte senden Sie die Anfrage über Ihr E-Mail-Programm.",
    });
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle>Anfrage vorbereitet</DialogTitle>
            <DialogDescription>
              Ihr E-Mail-Programm sollte sich geöffnet haben. Senden Sie die E-Mail ab, 
              um Ihre Upgrade-Anfrage abzuschließen.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-4">
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Lizenz erweitern
          </DialogTitle>
          <DialogDescription>
            Wählen Sie einen Plan und senden Sie eine Upgrade-Anfrage an unser Team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current plan info */}
          <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
            Ihr aktueller Plan: <strong className="capitalize">{currentPlan}</strong>
          </div>

          {/* Plan selection */}
          <RadioGroup 
            value={selectedPlan} 
            onValueChange={setSelectedPlan}
            className="grid gap-3"
          >
            {PLANS.map((plan) => (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? "ring-2 ring-primary" 
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor={plan.id} 
                          className="text-base font-semibold cursor-pointer"
                        >
                          {plan.name}
                        </Label>
                        <Badge variant="secondary">{plan.price}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.seats}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>

          {/* Additional message */}
          <div className="space-y-2">
            <Label htmlFor="upgrade-message">Zusätzliche Nachricht (optional)</Label>
            <Textarea
              id="upgrade-message"
              placeholder="z.B. Anzahl benötigter Seats, spezielle Anforderungen..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird geöffnet...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Anfrage senden
                  <ExternalLink className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
