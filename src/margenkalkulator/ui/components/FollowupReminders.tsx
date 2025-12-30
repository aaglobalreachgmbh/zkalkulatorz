// ============================================
// Follow-up Reminders Component
// Shows pending offers that need attention
// ============================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  Clock, 
  X, 
  ChevronRight, 
  AlertCircle,
  Mail,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useOfferFollowups } from "@/margenkalkulator/hooks/useOfferFollowups";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface FollowupRemindersProps {
  compact?: boolean;
}

export function FollowupReminders({ compact = false }: FollowupRemindersProps) {
  const navigate = useNavigate();
  const { followups, urgentCount, isLoading, dismissFollowup } = useOfferFollowups();
  const [isOpen, setIsOpen] = useState(false);

  const handleViewOffer = (offerId: string) => {
    // Navigate to offers page with the offer selected
    navigate(`/offers?highlight=${offerId}`);
    setIsOpen(false);
  };

  const handleDismiss = async (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dismissFollowup(offerId);
  };

  // Compact mode: Just a badge/button in the header
  if (compact) {
    if (followups.length === 0) return null;

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {followups.length > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white ${
                urgentCount > 0 ? "bg-red-500" : "bg-amber-500"
              }`}>
                {followups.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b border-border">
            <h4 className="font-semibold text-sm">Follow-up Erinnerungen</h4>
            <p className="text-xs text-muted-foreground">
              {followups.length} Angebot{followups.length !== 1 ? "e" : ""} benötigt Aufmerksamkeit
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {followups.slice(0, 5).map((offer) => (
              <div 
                key={offer.id}
                className="p-3 border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleViewOffer(offer.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{offer.name}</p>
                    {offer.customerName && (
                      <p className="text-xs text-muted-foreground truncate">{offer.customerName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          offer.daysPending >= 7 
                            ? "text-red-600 border-red-500/30" 
                            : "text-amber-600 border-amber-500/30"
                        }`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {offer.daysPending} Tage
                      </Badge>
                      {offer.avgMonthly > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {offer.avgMonthly.toFixed(0)}€/Monat
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-6 w-6"
                    onClick={(e) => handleDismiss(offer.id, e)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {followups.length > 5 && (
            <div className="p-3 border-t border-border">
              <Button 
                variant="ghost" 
                className="w-full text-sm"
                onClick={() => navigate("/offers")}
              >
                Alle {followups.length} anzeigen
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  // Full card mode for dashboard
  if (isLoading || followups.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Follow-up Erinnerungen</CardTitle>
              <p className="text-xs text-muted-foreground">
                {followups.length} Angebot{followups.length !== 1 ? "e" : ""} seit 3+ Tagen unbearbeitet
              </p>
            </div>
          </div>
          {urgentCount > 0 && (
            <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
              <AlertCircle className="w-3 h-3 mr-1" />
              {urgentCount} dringend
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {followups.slice(0, 3).map((offer) => (
            <div 
              key={offer.id}
              className="p-3 bg-card border border-border rounded-lg hover:border-amber-500/30 transition-colors cursor-pointer group"
              onClick={() => handleViewOffer(offer.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{offer.name}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs shrink-0 ${
                        offer.daysPending >= 7 
                          ? "text-red-600 border-red-500/30 bg-red-500/10" 
                          : "text-amber-600 border-amber-500/30 bg-amber-500/10"
                      }`}
                    >
                      {offer.daysPending} Tage
                    </Badge>
                  </div>
                  {offer.customerName && (
                    <p className="text-xs text-muted-foreground mt-0.5">{offer.customerName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewOffer(offer.id);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleDismiss(offer.id, e)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {followups.length > 3 && (
          <Button 
            variant="ghost" 
            className="w-full mt-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/offers")}
          >
            +{followups.length - 3} weitere anzeigen
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
