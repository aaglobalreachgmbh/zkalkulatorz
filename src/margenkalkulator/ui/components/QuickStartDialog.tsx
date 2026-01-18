import { useState, useEffect } from "react";
import { Smartphone, CreditCard, Wifi, Users, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wizard_quickstart_dismissed";

type QuickStartOption = "sim_only" | "with_hardware" | "with_fixednet" | "team_deal";

interface QuickStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: QuickStartOption) => void;
}

const OPTIONS: Array<{
  id: QuickStartOption;
  icon: typeof Smartphone;
  title: string;
  description: string;
  sections: {
    hardware: boolean;
    mobile: boolean;
    fixedNet: boolean;
  };
}> = [
  {
    id: "sim_only",
    icon: CreditCard,
    title: "Nur Tarif",
    description: "SIM-Only ohne Hardware",
    sections: { hardware: false, mobile: true, fixedNet: false },
  },
  {
    id: "with_hardware",
    icon: Smartphone,
    title: "Mit Smartphone",
    description: "Tarif + Gerät im Bundle",
    sections: { hardware: true, mobile: true, fixedNet: false },
  },
  {
    id: "with_fixednet",
    icon: Wifi,
    title: "Mit Festnetz",
    description: "Mobilfunk + Internet Bundle",
    sections: { hardware: true, mobile: true, fixedNet: true },
  },
  {
    id: "team_deal",
    icon: Users,
    title: "Team-Deal",
    description: "Mehrere Verträge für Teams",
    sections: { hardware: true, mobile: true, fixedNet: false },
  },
];

export function QuickStartDialog({ 
  open, 
  onOpenChange, 
  onSelect 
}: QuickStartDialogProps) {
  const handleSelect = (option: QuickStartOption) => {
    onSelect(option);
    onOpenChange(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Was benötigt Ihr Kunde?
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 py-4">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border",
                  "bg-card hover:bg-muted/50 hover:border-primary/50",
                  "transition-all active:scale-95"
                )}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">{option.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground"
          >
            Überspringen und selbst konfigurieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to check if quickstart should be shown
export function shouldShowQuickStart(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== "true";
}

// Helper to reset quickstart preference
export function resetQuickStartPreference(): void {
  localStorage.removeItem(STORAGE_KEY);
}
