// ============================================
// OfferDetail Page - Full offer view with tabs
// ============================================

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { 
  ArrowLeft, FileText, Coins, TrendingUp, History, 
  Loader2, Calendar, User, Building2, Mail, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCloudOffers } from "@/margenkalkulator/hooks/useCloudOffers";
import { useCustomers } from "@/margenkalkulator/hooks/useCustomers";
import { MarginBadge } from "@/margenkalkulator/ui/components/MarginBadge";
import { ProvisionBreakdown } from "@/margenkalkulator/ui/components/ProvisionBreakdown";
import { ProfitabilityTrafficLight } from "@/margenkalkulator/ui/components/ProfitabilityTrafficLight";
import { AiRecommendationsPanel } from "@/margenkalkulator/ui/components/AiRecommendationsPanel";
import { PdfDownloadButton } from "@/margenkalkulator/ui/components/PdfDownloadButton";
import { calculateOffer } from "@/margenkalkulator";
import { 
  formatCurrency, 
  getProfitabilityStatus, 
  calculateMarginPercent 
} from "@/margenkalkulator/lib/formatters";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function OfferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { offers, isLoading } = useCloudOffers();
  const { customers } = useCustomers();

  const offer = useMemo(() => offers.find(o => o.id === id), [offers, id]);
  const customer = useMemo(() => 
    offer?.customer_id ? customers.find(c => c.id === offer.customer_id) : null,
  [offer, customers]);

  // Recalculate result from config
  const result = useMemo(() => {
    if (!offer?.config) return null;
    return calculateOffer(offer.config);
  }, [offer]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!offer || !result) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/offers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Angeboten
          </Button>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Angebot nicht gefunden.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const config = offer.config;
  const margin = result.dealer.margin;
  const quantity = config.mobile.quantity;
  const marginPerContract = margin / quantity;
  const status = getProfitabilityStatus(marginPerContract);
  const marginPercent = calculateMarginPercent(margin, result.totals.sumTermNet);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "angenommen": return <Badge className="bg-emerald-500/20 text-emerald-600">Angenommen</Badge>;
      case "abgelehnt": return <Badge variant="destructive">Abgelehnt</Badge>;
      case "gesendet": return <Badge className="bg-blue-500/20 text-blue-600">Gesendet</Badge>;
      default: return <Badge variant="secondary">Offen</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/offers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div className="flex gap-2">
            <PdfDownloadButton option={config} result={result} type="customer" viewMode="customer" />
            <PdfDownloadButton option={config} result={result} type="dealer" viewMode="dealer" />
          </div>
        </div>

        {/* Offer Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">{offer.name}</CardTitle>
                  {getStatusBadge(offer.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(offer.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                  </span>
                  {customer && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {customer.company_name}
                    </span>
                  )}
                </div>
              </div>
              <MarginBadge 
                margin={margin} 
                marginPercentage={marginPercent} 
                size="lg"
                showLabel
              />
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="provisions" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Provisionen
            </TabsTrigger>
            <TabsTrigger value="margins" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Margen
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historie
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Configuration */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Konfiguration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarif:</span>
                    <span className="font-medium">{config.mobile.tariffId?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anzahl:</span>
                    <span>{quantity} Verträge</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Laufzeit:</span>
                    <span>{config.meta.termMonths} Monate</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hardware:</span>
                    <span>{config.hardware.name || "SIM Only"}</span>
                  </div>
                  {config.fixedNet.enabled && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Festnetz:</span>
                      <span>{config.fixedNet.productId?.replace(/_/g, " ")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Costs */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Kosten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ø Monatlich:</span>
                    <span className="font-medium">{formatCurrency(result.totals.avgTermNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gesamtkosten:</span>
                    <span>{formatCurrency(result.totals.sumTermNet)}</span>
                  </div>
                  {config.hardware.ekNet > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hardware EK:</span>
                      <span>{formatCurrency(config.hardware.ekNet)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer */}
              {customer && (
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Kunde
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">{customer.company_name}</span>
                      {customer.contact_name && <span className="text-muted-foreground">{customer.contact_name}</span>}
                      {customer.email && (
                        <a href={`mailto:${customer.email}`} className="text-primary hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Provisions Tab */}
          <TabsContent value="provisions">
            <ProvisionBreakdown
              airtimeProvision={result.dealer.airtimeTotal || 0}
              airtimeMonthly={(result.dealer.airtimeTotal || 0) / config.meta.termMonths}
              oneTimeProvision={result.dealer.provisionBase}
              hardwareProvision={result.dealer.hardwareProvision || 0}
              termMonths={config.meta.termMonths as 24 | 36}
              contractCount={quantity}
            />
          </TabsContent>

          {/* Margins Tab */}
          <TabsContent value="margins" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Margen-Analyse</h3>
                    <p className="text-sm text-muted-foreground">Detaillierte Profitabilitätsberechnung</p>
                  </div>
                  <MarginBadge margin={margin} marginPercentage={marginPercent} size="lg" showLabel />
                </div>
                <ProfitabilityTrafficLight status={status} marginPerContract={marginPerContract} />
              </CardContent>
            </Card>
            
            <AiRecommendationsPanel config={config} result={result} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Erstellt am {format(new Date(offer.created_at), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                    </span>
                  </div>
                  {offer.updated_at !== offer.created_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Geändert am {format(new Date(offer.updated_at), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Status: {offer.status === "offen" ? "Offen" : offer.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
