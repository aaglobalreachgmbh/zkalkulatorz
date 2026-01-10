// ============================================
// Zentrale Status-Badge Konfiguration
// Einheitliche Darstellung für alle Listen
// ============================================

import { 
  Send, Check, CheckCheck, AlertCircle, Clock, 
  FileText, Mail, ScrollText, MessageSquare, Trophy,
  type LucideIcon 
} from "lucide-react";

// ============================================
// E-Mail Status
// ============================================

export interface StatusConfig {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
  borderColor?: string;
}

export const EMAIL_STATUS: Record<string, StatusConfig> = {
  sent: { 
    icon: Send, 
    label: "Gesendet", 
    color: "text-blue-600",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
  },
  delivered: { 
    icon: Check, 
    label: "Zugestellt", 
    color: "text-green-600",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
  },
  opened: { 
    icon: CheckCheck, 
    label: "Geöffnet", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/50",
  },
  failed: { 
    icon: AlertCircle, 
    label: "Fehlgeschlagen", 
    color: "text-red-600",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50",
  },
};

// ============================================
// Angebots-Status
// ============================================

export const OFFER_STATUS: Record<string, StatusConfig> = {
  draft: { 
    icon: FileText, 
    label: "Entwurf", 
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted-foreground/50",
  },
  saved: { 
    icon: Check, 
    label: "Gespeichert", 
    color: "text-blue-600",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
  },
  sent: { 
    icon: Send, 
    label: "Gesendet", 
    color: "text-amber-600",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/50",
  },
  accepted: { 
    icon: CheckCheck, 
    label: "Angenommen", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/50",
  },
  expired: { 
    icon: Clock, 
    label: "Abgelaufen", 
    color: "text-red-600",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50",
  },
};

// ============================================
// Kunden-Status
// ============================================

export const CUSTOMER_STATUS: Record<string, StatusConfig> = {
  aktiv: { 
    icon: Check, 
    label: "Aktiv", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/50",
  },
  gewonnen: { 
    icon: Trophy, 
    label: "Gewonnen", 
    color: "text-amber-600",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/50",
  },
  inaktiv: { 
    icon: Clock, 
    label: "Inaktiv", 
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted-foreground/50",
  },
  interessent: { 
    icon: Mail, 
    label: "Interessent", 
    color: "text-blue-600",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
  },
};

// ============================================
// Vertrags-Status
// ============================================

export const CONTRACT_STATUS: Record<string, StatusConfig> = {
  aktiv: { 
    icon: Check, 
    label: "Aktiv", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/50",
  },
  vvl: { 
    icon: Clock, 
    label: "VVL möglich", 
    color: "text-amber-600",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/50",
  },
  gekuendigt: { 
    icon: AlertCircle, 
    label: "Gekündigt", 
    color: "text-red-600",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50",
  },
};

// ============================================
// Timeline Typ-Konfiguration
// ============================================

export const TIMELINE_TYPE_CONFIG = {
  offer: {
    icon: FileText,
    label: "Angebot",
    color: "bg-amber-500/20 text-amber-600 border-amber-500/50",
  },
  email: {
    icon: Mail,
    label: "E-Mail",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/50",
  },
  contract: {
    icon: ScrollText,
    label: "Vertrag",
    color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/50",
  },
  note: {
    icon: MessageSquare,
    label: "Notiz",
    color: "bg-purple-500/20 text-purple-600 border-purple-500/50",
  },
};

// ============================================
// Notiz-Typ Icons
// ============================================

export const NOTE_TYPE_ICONS: Record<string, string> = {
  info: "💬",
  call: "📞",
  meeting: "🤝",
  offer: "📄",
  contract: "✍️",
};

// ============================================
// Helper Functions
// ============================================

export function getEmailStatus(status: string | null): StatusConfig {
  return EMAIL_STATUS[status || "sent"] || EMAIL_STATUS.sent;
}

export function getOfferStatus(isDraft: boolean, hasSentEmail: boolean): StatusConfig {
  if (isDraft) return OFFER_STATUS.draft;
  if (hasSentEmail) return OFFER_STATUS.sent;
  return OFFER_STATUS.saved;
}

export function getCustomerStatus(status: string | null): StatusConfig {
  return CUSTOMER_STATUS[status || "aktiv"] || CUSTOMER_STATUS.aktiv;
}

export function getContractStatus(status: string | null): StatusConfig {
  return CONTRACT_STATUS[status || "aktiv"] || CONTRACT_STATUS.aktiv;
}
