// ============================================
// Email History Panel Component
// ============================================

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Mail, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { useOfferEmails, type OfferEmail } from "../../hooks/useOfferEmails";

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "sent":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950">
          <Mail className="w-3 h-3 mr-1" />
          Gesendet
        </Badge>
      );
    case "delivered":
      return (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Zugestellt
        </Badge>
      );
    case "opened":
      return (
        <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950">
          <FileText className="w-3 h-3 mr-1" />
          Geöffnet
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950">
          <XCircle className="w-3 h-3 mr-1" />
          Fehlgeschlagen
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
}

// Single email row
function EmailRow({ email }: { email: OfferEmail }) {
  const [isOpen, setIsOpen] = useState(false);

  const formattedDate = format(new Date(email.created_at), "dd. MMM yyyy, HH:mm", { locale: de });
  
  // Extract tariff count from offer_data if available
  const tariffCount = Array.isArray(email.offer_data) 
    ? (email.offer_data as unknown[]).length 
    : (email.offer_data as { items?: unknown[] })?.items?.length || 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {email.recipient_name || email.recipient_email}
                </span>
                <StatusBadge status={email.status} />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {email.subject}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {formattedDate}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="ml-11 mr-3 mb-3 p-3 bg-muted/30 rounded-lg space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground text-xs">Empfänger:</span>
              <p className="font-medium">{email.recipient_email}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Datum:</span>
              <p>{formattedDate}</p>
            </div>
          </div>
          
          {email.message && (
            <div>
              <span className="text-muted-foreground text-xs">Nachricht:</span>
              <p className="text-muted-foreground whitespace-pre-wrap text-xs mt-1">
                {email.message}
              </p>
            </div>
          )}
          
          {tariffCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="w-3 h-3" />
              <span>{tariffCount} Tarif{tariffCount !== 1 ? "e" : ""} im Angebot</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function EmailHistoryPanel() {
  const { emails, isLoading, refetch } = useOfferEmails();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter emails by search query
  const filteredEmails = emails.filter((email) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.recipient_email.toLowerCase().includes(query) ||
      email.recipient_name?.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query)
    );
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            E-Mail-Historie
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Empfänger oder Betreff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">
              {searchQuery ? "Keine E-Mails gefunden" : "Noch keine E-Mails gesendet"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-3">
            <div className="space-y-1">
              {filteredEmails.map((email) => (
                <EmailRow key={email.id} email={email} />
              ))}
            </div>
          </ScrollArea>
        )}
        
        {/* Stats */}
        {emails.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
            <span>{emails.length} E-Mail{emails.length !== 1 ? "s" : ""} insgesamt</span>
            <span>
              {emails.filter(e => e.status === "sent" || e.status === "delivered").length} erfolgreich
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
