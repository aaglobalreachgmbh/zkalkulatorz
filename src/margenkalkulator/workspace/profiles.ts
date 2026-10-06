// ============================================
// Workspace-Profile: Nutzertyp, Paletten, Layouts
// Reine Konfiguration – keine Logik, keine Backend-Abhängigkeit.
// ============================================

import {
  Store, Briefcase, Building, Car, Shuffle,
  type LucideIcon,
} from "lucide-react";

export type UserType = "pos" | "dealer" | "direct" | "field" | "hybrid";
export type HomeLayout = "focus" | "cockpit" | "classic";

export interface QuickAction {
  label: string;
  description: string;
  url: string;
}

export interface UserTypeProfile {
  id: UserType;
  label: string;
  description: string;
  icon: LucideIcon;
  quickActions: QuickAction[];
  /** Demo-Werkzeuge, die in der Seitenleiste erscheinen */
  tools: string[];
}

export const DEMO_TOOLS: Record<string, { title: string; url: string }> = {
  pos: { title: "Kasse (Demo)", url: "/pos" },
  campaigns: { title: "VVL-Kampagnen (Demo)", url: "/campaigns" },
  provisionCheck: { title: "Provisionskontrolle (Demo)", url: "/provision-check" },
  crossSell: { title: "Kreuzgeschäft", url: "/cross-sell" },
  fieldDay: { title: "Außendienst-Tag (Demo)", url: "/field-day" },
};

export const USER_TYPES: UserTypeProfile[] = [
  {
    id: "pos", label: "Shop / POS", icon: Store,
    description: "Handyshop am Tresen – schnell kalkulieren und kassieren.",
    quickActions: [
      { label: "Neues Angebot", description: "Kalkulator starten", url: "/calculator" },
      { label: "Kasse", description: "Zubehör + Vertrag kassieren", url: "/pos" },
      { label: "VVL fällig", description: "Bestandskunden ansprechen", url: "/campaigns" },
    ],
    tools: ["pos", "crossSell", "campaigns"],
  },
  {
    id: "dealer", label: "Fachhändler / Vertreter", icon: Briefcase,
    description: "Eigene Kunden betreuen, Provisionen im Blick.",
    quickActions: [
      { label: "Neues Angebot", description: "Kalkulator starten", url: "/calculator" },
      { label: "Provisionskontrolle", description: "Gutschrift abgleichen", url: "/provision-check" },
      { label: "Kreuzgeschäft", description: "Chancen im Bestand", url: "/cross-sell" },
    ],
    tools: ["crossSell", "campaigns", "provisionCheck"],
  },
  {
    id: "direct", label: "Direct Sales Store", icon: Building,
    description: "Hohe Frequenz, Team-Ziele, Bundles.",
    quickActions: [
      { label: "Neues Angebot", description: "Kalkulator starten", url: "/calculator" },
      { label: "Team", description: "Ziele und Ranking", url: "/team" },
      { label: "Bundles", description: "Standardpakete", url: "/bundles" },
    ],
    tools: ["pos", "campaigns", "crossSell"],
  },
  {
    id: "field", label: "Außendienst (BPO)", icon: Car,
    description: "Unterwegs beim Geschäftskunden, Angebot vor Ort.",
    quickActions: [
      { label: "Mein Tag", description: "Termine und Route", url: "/field-day" },
      { label: "Neues Angebot", description: "Vor Ort kalkulieren", url: "/calculator" },
      { label: "Kreuzgeschäft", description: "Chancen beim Kunden", url: "/cross-sell" },
    ],
    tools: ["fieldDay", "crossSell", "provisionCheck"],
  },
  {
    id: "hybrid", label: "Hybrid", icon: Shuffle,
    description: "Shop und Außendienst – Kreuzgeschäft fördern.",
    quickActions: [
      { label: "Kreuzgeschäft", description: "Mobilfunk + Festnetz", url: "/cross-sell" },
      { label: "Neues Angebot", description: "Kalkulator starten", url: "/calculator" },
      { label: "Mein Tag", description: "Termine", url: "/field-day" },
    ],
    tools: ["crossSell", "fieldDay", "campaigns"],
  },
];

export interface PalettePreset {
  id: string;
  label: string;
  /** HSL-Triplet für --primary */
  primaryHsl: string;
  swatch: string;
}

export const PALETTES: PalettePreset[] = [
  { id: "vodafone", label: "Vodafone Rot", primaryHsl: "0 100% 45%", swatch: "#E60000" },
  { id: "ocean", label: "Ocean Deep", primaryHsl: "196 56% 40%", swatch: "#2d8a9e" },
  { id: "forest", label: "Forest", primaryHsl: "150 30% 30%", swatch: "#356b4f" },
  { id: "graphite", label: "Graphit", primaryHsl: "0 0% 20%", swatch: "#333333" },
  { id: "ember", label: "Ember", primaryHsl: "12 79% 57%", swatch: "#e85d3a" },
  { id: "navy", label: "Navy Trust", primaryHsl: "220 52% 18%", swatch: "#0f1b3d" },
];

export const HOME_LAYOUTS: { id: HomeLayout; label: string; description: string }[] = [
  { id: "focus", label: "Fokus", description: "Schnellstart und nächste Aufgabe" },
  { id: "cockpit", label: "Cockpit", description: "Schnellstart und kompakte Heute-Übersicht" },
  { id: "classic", label: "Klassisch", description: "Konfigurierbare Widgets wie bisher" },
];
