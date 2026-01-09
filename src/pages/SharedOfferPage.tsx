// ============================================
// Shared Offer Public View Page
// ============================================

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Wifi, 
  Smartphone, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Download,
  MessageCircle,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { de } from "date-fns/locale";
import { useSharedOffers, type SharedOfferData } from "@/margenkalkulator/hooks/useSharedOffers";

function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0,00 €";
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

export default function SharedOfferPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const { getSharedOffer, isLoading } = useSharedOffers();
  const [offer, setOffer] = useState<{
    id: string;
    offer_id: string;
    customer_name: string | null;
    offer_data: SharedOfferData;
    expires_at: string;
    valid_days: number;
    view_count: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOffer() {
      if (!offerId || !token) {
        setError("Ungültiger Link");
        return;
      }

      const result = await getSharedOffer(offerId, token);
      if (!result) {
        setError("Angebot nicht gefunden oder abgelaufen");
        return;
      }

      setOffer(result);
    }

    loadOffer();
  }, [offerId, token, getSharedOffer]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold">Angebot nicht verfügbar</h1>
            <p className="text-muted-foreground">{error}</p>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Möglicherweise ist das Angebot abgelaufen oder wurde vom Absender zurückgezogen.
                Bitte kontaktieren Sie Ihren Ansprechpartner für ein aktuelles Angebot.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading || !offer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-semibold">Angebot wird geladen...</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  const offerData = offer.offer_data;
  const expiresAt = new Date(offer.expires_at);
  const isExpired = isPast(expiresAt);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs">
            Angebot {offer.offer_id}
          </Badge>
          <h1 className="text-2xl font-bold">Ihr persönliches Angebot</h1>
          {offer.customer_name && (
            <p className="text-muted-foreground">
              Erstellt für: {offer.customer_name}
            </p>
          )}
        </div>

        {/* Validity */}
        <Card className={isExpired ? "border-destructive" : "border-primary"}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpired ? (
                  <XCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
                <div>
                  <p className="font-medium">
                    {isExpired ? "Angebot abgelaufen" : "Angebot gültig"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isExpired 
                      ? `Abgelaufen am ${format(expiresAt, "dd.MM.yyyy", { locale: de })}`
                      : `Noch ${formatDistanceToNow(expiresAt, { locale: de })} gültig`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {offer.valid_days} Tage
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offer Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Angebotsübersicht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Items */}
            {offerData.offerItems && offerData.offerItems.length > 0 ? (
              <div className="space-y-4">
                {offerData.offerItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {item.type === 'mobile' && <Phone className="w-4 h-4 text-primary" />}
                      {item.type === 'hardware' && <Smartphone className="w-4 h-4 text-primary" />}
                      {item.type === 'fixednet' && <Wifi className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">{item.quantity}× Verträge</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.monthlyPrice)}</p>
                      <p className="text-xs text-muted-foreground">mtl.</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {offerData.tariffName && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>{offerData.tariffName}</span>
                  </div>
                )}
                {offerData.hardwareName && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <span>{offerData.hardwareName}</span>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              {offerData.monthlyPrice !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monatliche Kosten</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(offerData.monthlyPrice)}
                  </span>
                </div>
              )}
              {offerData.oneTimePrice !== undefined && offerData.oneTimePrice > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Einmalige Kosten</span>
                  <span className="font-semibold">
                    {formatCurrency(offerData.oneTimePrice)}
                  </span>
                </div>
              )}
              {offerData.contractLength && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Vertragslaufzeit</span>
                  <span>{offerData.contractLength} Monate</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {!isExpired && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1 gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Angebot anfragen
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Als PDF speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GDPR Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-2 pt-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            <span>Datenschutz gemäß DSGVO</span>
          </div>
          <p>
            Dieses Angebot wurde Ihnen auf Anfrage zugestellt. 
            Bei Fragen zum Datenschutz kontaktieren Sie bitte Ihren Ansprechpartner.
          </p>
          <p className="font-medium">
            Vodafone Business Partner
          </p>
        </div>
      </div>
    </div>
  );
}
