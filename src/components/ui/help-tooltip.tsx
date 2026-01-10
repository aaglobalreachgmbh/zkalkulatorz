/**
 * HelpTooltip Component
 * 
 * Zeigt Info-Icons mit Erklärungen für Fachbegriffe an.
 * Verwendet für OMO, VVL, SUB, GigaKombi und andere technische Begriffe.
 */
import * as React from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  term: string;
  className?: string;
  iconClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * Fachbegriff-Definitionen
 */
const TERM_DEFINITIONS: Record<string, { title: string; description: string; example?: string }> = {
  // Mobilfunk-Begriffe
  omo: {
    title: "OMO-Matrix (One More Offer)",
    description: "Steuert die Zuzahlung für Hardware je nach Geräteklasse und gewählter Provision. Höhere OMO-Rate = niedrigere Zuzahlung für den Kunden.",
    example: "Bei OMO 35% zahlt der Kunde weniger an als bei OMO 0%",
  },
  vvl: {
    title: "VVL (Vertragsverlängerung)",
    description: "Bestandskunde verlängert seinen bestehenden Vertrag. In der Regel gelten besondere Konditionen und Hardware-Angebote für VVL-Kunden.",
    example: "Kunde mit auslaufendem Vertrag kann VVL-Konditionen nutzen",
  },
  sub: {
    title: "SUB (Subventions-Variante)",
    description: "Definiert, wie stark ein Gerät durch den Tarif subventioniert wird. Je nach SUB-Stufe unterscheiden sich Zuzahlung und Provision.",
    example: "SUB M = mittlere Subvention mit ausgewogener Zuzahlung",
  },
  gigakombi: {
    title: "GigaKombi-Vorteil",
    description: "Kombivorteil bei Vodafone: Kunden mit Festnetz + Mobilfunk erhalten 5€ Rabatt pro Monat auf den Mobilfunk-Tarif.",
    example: "Cable 250 + Business Prime M = 5€ GigaKombi-Rabatt",
  },
  hwImMonatspreis: {
    title: "Im Monatspreis anzeigen",
    description: "Aktiviert: Hardware-Kosten werden auf 24 Monate verteilt und im monatlichen Kundenpreis angezeigt. So sieht der Kunde den realen Gesamtpreis. Deaktiviert: Hardware-Kosten erscheinen nur in der Händler-Marge.",
    example: "Tipp: Für Kunden-Präsentationen aktivieren, damit der Kunde den echten Monatspreis sieht",
  },
  // Provision & Marge
  provision: {
    title: "Provision",
    description: "Einmalzahlung von Vodafone an den Händler bei Vertragsabschluss. Höhe abhängig von Tarif, Vertragsart (Neu/VVL) und SUB-Variante.",
    example: "Business Prime M Neuvertrag: ca. 450€ Provision",
  },
  marge: {
    title: "Händler-Marge",
    description: "Der tatsächliche Verdienst des Händlers = Provision minus Hardware-Einkaufspreis (EK). Kann positiv oder negativ sein.",
    example: "450€ Provision - 779€ EK = -329€ Marge",
  },
  ekNet: {
    title: "EK Netto (Einkaufspreis)",
    description: "Der Netto-Einkaufspreis der Hardware für den Händler. Dieser wird von der Provision abgezogen um die Marge zu berechnen.",
    example: "iPhone 16 128GB: 779€ EK netto",
  },
  // Festnetz
  cable: {
    title: "Kabel-Internet",
    description: "Internet über das TV-Kabelnetz. Bietet hohe Bandbreiten (bis 1000 Mbit/s) und ist in vielen Regionen verfügbar.",
  },
  dsl: {
    title: "DSL (Digital Subscriber Line)",
    description: "Internet über die Telefonleitung. Weit verbreitet, aber mit niedrigeren Geschwindigkeiten als Kabel oder Fiber.",
  },
  fiber: {
    title: "Fiber (Glasfaser)",
    description: "Internet über Glasfaserkabel. Höchste Geschwindigkeiten (bis 2500 Mbit/s) und niedrigste Latenz. Nicht überall verfügbar.",
  },
  komfort: {
    title: "Komfort-Tarife",
    description: "Premium-Festnetz-Tarife mit zusätzlichen Leistungen wie TV-Paketen, höheren Geschwindigkeiten oder erweiterten Telefonie-Optionen.",
  },
  // Vertragsbezogen
  teamDeal: {
    title: "TeamDeal-Rabatt",
    description: "Staffelrabatt für Geschäftskunden: Je mehr Verträge gleichzeitig abgeschlossen werden, desto höher der monatliche Rabatt pro Vertrag.",
    example: "3-5 Verträge = 5€ Rabatt, 10+ = 10€ Rabatt",
  },
  promo: {
    title: "Promo/Aktion",
    description: "Zeitlich begrenzte Sonderkonditionen wie reduzierter Monatspreis in den ersten X Monaten oder einmalige Rabatte.",
  },
  pushProvision: {
    title: "Push-Provision",
    description: "Zusätzlicher Bonus auf die reguläre Provision für bestimmte Tarife oder Aktionszeiträume. Erhöht die Händler-Marge.",
    example: "+50€ Push-Provision auf Business Prime L",
  },
  // Kundenverwaltung
  mocca: {
    title: "Mocca (CRM-System)",
    description: "Branchenübliches CRM-System für Mobilfunk-Fachhändler. Der Marge Kalkulator kann Kundendaten aus Mocca-Exporten importieren.",
  },
};

export function HelpTooltip({ 
  term, 
  className,
  iconClassName,
  side = "top",
  align = "center"
}: HelpTooltipProps) {
  const termKey = term.toLowerCase().replace(/[-_\s]/g, "");
  const definition = TERM_DEFINITIONS[termKey];
  
  if (!definition) {
    console.warn(`HelpTooltip: No definition found for term "${term}"`);
    return null;
  }

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button 
          type="button" 
          className={cn(
            "inline-flex items-center justify-center rounded-full",
            "text-muted-foreground hover:text-foreground transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          aria-label={`Info zu ${definition.title}`}
        >
          <HelpCircle className={cn("w-4 h-4", iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        align={align}
        className="max-w-xs p-3 space-y-2"
      >
        <p className="font-semibold text-sm">{definition.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {definition.description}
        </p>
        {definition.example && (
          <p className="text-xs text-primary/80 italic">
            Beispiel: {definition.example}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Inline-Variante: Text mit Tooltip als Label
 */
export function HelpLabel({ 
  term, 
  children,
  className 
}: { 
  term: string; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {children}
      <HelpTooltip term={term} />
    </span>
  );
}

export { TERM_DEFINITIONS };
