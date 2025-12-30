// ============================================
// Customer Timeline Component
// Chronologische Ansicht aller Kundeninteraktionen
// ============================================

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, Mail, ScrollText, MessageSquare, Calendar,
  ExternalLink, Check, AlertCircle, Clock, Send
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import type { CloudOffer } from "@/margenkalkulator/hooks/useCloudOffers";
import type { CustomerEmail } from "@/margenkalkulator/hooks/useCustomerEmails";
import type { CustomerContract } from "@/margenkalkulator/hooks/useCustomerContracts";

interface CustomerNote {
  id: string;
  content: string;
  note_type: string;
  created_at: string;
}

export interface TimelineItem {
  id: string;
  type: "offer" | "email" | "contract" | "note";
  date: Date;
  title: string;
  subtitle?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  originalItem: CloudOffer | CustomerEmail | CustomerContract | CustomerNote;
}

interface CustomerTimelineProps {
  offers: CloudOffer[];
  emails: CustomerEmail[];
  contracts: CustomerContract[];
  notes: CustomerNote[];
  onOfferClick?: (offer: CloudOffer) => void;
  onContractClick?: (contract: CustomerContract) => void;
}

const TYPE_CONFIG = {
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

const NOTE_TYPE_ICONS: Record<string, string> = {
  info: "💬",
  call: "📞",
  meeting: "🤝",
  offer: "📄",
  contract: "✍️",
};

const EMAIL_STATUS_CONFIG: Record<string, { icon: typeof Check; label: string; color: string }> = {
  sent: { icon: Send, label: "Gesendet", color: "text-blue-500" },
  delivered: { icon: Check, label: "Zugestellt", color: "text-green-500" },
  opened: { icon: Check, label: "Geöffnet", color: "text-emerald-500" },
  failed: { icon: AlertCircle, label: "Fehlgeschlagen", color: "text-red-500" },
};

export function CustomerTimeline({
  offers,
  emails,
  contracts,
  notes,
  onOfferClick,
  onContractClick,
}: CustomerTimelineProps) {
  const navigate = useNavigate();

  // Combine all items into a single timeline
  const timelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add offers
    offers.forEach((offer) => {
      items.push({
        id: `offer-${offer.id}`,
        type: "offer",
        date: new Date(offer.created_at),
        title: offer.name,
        subtitle: offer.preview 
          ? `${offer.preview.hardware} • ${offer.preview.tariff} • ${offer.preview.avgMonthly?.toFixed(2)}€/Monat`
          : undefined,
        status: offer.is_draft ? "Entwurf" : "Gespeichert",
        originalItem: offer,
      });
    });

    // Add emails
    emails.forEach((email) => {
      items.push({
        id: `email-${email.id}`,
        type: "email",
        date: new Date(email.created_at),
        title: email.subject,
        subtitle: `An: ${email.recipient_name || email.recipient_email}`,
        status: email.status,
        metadata: {
          recipientEmail: email.recipient_email,
          offerData: email.offer_data,
        },
        originalItem: email,
      });
    });

    // Add contracts
    contracts.forEach((contract) => {
      items.push({
        id: `contract-${contract.id}`,
        type: "contract",
        date: new Date(contract.created_at),
        title: contract.tarif_name || "Vertrag",
        subtitle: [
          contract.hardware_name,
          contract.handy_nr,
          contract.monatspreis ? `${contract.monatspreis.toFixed(2)}€/Monat` : null,
        ].filter(Boolean).join(" • "),
        status: contract.status,
        originalItem: contract,
      });
    });

    // Add notes
    notes.forEach((note) => {
      items.push({
        id: `note-${note.id}`,
        type: "note",
        date: new Date(note.created_at),
        title: note.content.substring(0, 100) + (note.content.length > 100 ? "..." : ""),
        status: note.note_type,
        originalItem: note,
      });
    });

    // Sort by date (newest first)
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [offers, emails, contracts, notes]);

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Noch keine Aktivitäten für diesen Kunden.
        </CardContent>
      </Card>
    );
  }

  const handleItemClick = (item: TimelineItem) => {
    switch (item.type) {
      case "offer":
        if (onOfferClick) {
          onOfferClick(item.originalItem as CloudOffer);
        } else {
          navigate("/offers");
        }
        break;
      case "contract":
        if (onContractClick) {
          onContractClick(item.originalItem as CustomerContract);
        }
        break;
      // Notes and emails don't have navigation by default
    }
  };

  return (
    <div className="relative space-y-4">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

      {timelineItems.map((item, index) => {
        const config = TYPE_CONFIG[item.type];
        const Icon = config.icon;

        return (
          <div key={item.id} className="relative flex gap-4 pl-2">
            {/* Timeline dot */}
            <div className={`
              relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2
              bg-background ${config.color}
            `}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <Card className="flex-1 hover:bg-accent/50 transition-colors">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                      
                      {/* Type-specific status badges */}
                      {item.type === "email" && item.status && (
                        <Badge variant="outline" className="text-xs">
                          {EMAIL_STATUS_CONFIG[item.status]?.label || item.status}
                        </Badge>
                      )}
                      {item.type === "contract" && item.status && (
                        <Badge 
                          variant={item.status === "aktiv" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      )}
                      {item.type === "offer" && item.status && (
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                      )}
                      {item.type === "note" && item.status && (
                        <span className="text-sm">
                          {NOTE_TYPE_ICONS[item.status] || "💬"}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <p className="font-medium text-sm">{item.title}</p>

                    {/* Subtitle */}
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    )}

                    {/* Date */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(item.date, "dd.MM.yyyy HH:mm", { locale: de })}
                    </p>
                  </div>

                  {/* Actions */}
                  {(item.type === "offer" || item.type === "contract") && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleItemClick(item)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
