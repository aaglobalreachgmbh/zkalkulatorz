// ============================================
// Customer Emails Tab Component
// Zeigt alle gesendeten E-Mails für einen Kunden
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, Calendar, Send, Check, CheckCheck, AlertCircle, 
  ExternalLink, FileText, Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useCustomerEmails, type CustomerEmail } from "@/margenkalkulator/hooks/useCustomerEmails";

interface CustomerEmailsTabProps {
  customerId: string;
}

const STATUS_CONFIG: Record<string, { 
  icon: typeof Check; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  sent: { 
    icon: Send, 
    label: "Gesendet", 
    color: "text-blue-600",
    bgColor: "bg-blue-500/20",
  },
  delivered: { 
    icon: Check, 
    label: "Zugestellt", 
    color: "text-green-600",
    bgColor: "bg-green-500/20",
  },
  opened: { 
    icon: CheckCheck, 
    label: "Geöffnet", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/20",
  },
  failed: { 
    icon: AlertCircle, 
    label: "Fehlgeschlagen", 
    color: "text-red-600",
    bgColor: "bg-red-500/20",
  },
};

export function CustomerEmailsTab({ customerId }: CustomerEmailsTabProps) {
  const { emails, isLoading, hasEmails } = useCustomerEmails(customerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasEmails) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Noch keine E-Mails an diesen Kunden gesendet.</p>
          <p className="text-sm mt-1">
            Erstellen Sie ein Angebot und senden Sie es per E-Mail.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Gesendete E-Mails ({emails.length})
        </h3>
      </div>

      <div className="space-y-3">
        {emails.map((email) => (
          <EmailCard key={email.id} email={email} />
        ))}
      </div>
    </div>
  );
}

function EmailCard({ email }: { email: CustomerEmail }) {
  const statusConfig = STATUS_CONFIG[email.status] || STATUS_CONFIG.sent;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Header with status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(email.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
              </span>
            </div>

            {/* Subject */}
            <p className="font-medium">{email.subject}</p>

            {/* Recipient */}
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">An:</span> {email.recipient_name || email.recipient_email}
              {email.recipient_name && (
                <span className="text-xs ml-1">({email.recipient_email})</span>
              )}
            </p>

            {/* Offer data if available */}
            {email.offer_data && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1 w-fit">
                <FileText className="h-3 w-3" />
                <span>
                  {email.offer_data.hardware} • {email.offer_data.tariff}
                  {email.offer_data.avgMonthly && (
                    <> • {email.offer_data.avgMonthly.toFixed(2)}€/Monat</>
                  )}
                </span>
              </div>
            )}

            {/* Message preview */}
            {email.message && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {email.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
