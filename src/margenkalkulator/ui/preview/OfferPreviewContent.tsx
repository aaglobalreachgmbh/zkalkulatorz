import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, Package, CheckCircle, Euro } from "lucide-react";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import { getMobileTariff, getSubVariant, getPromo, getFixedNetProduct } from "../../engine";

interface OfferPreviewContentProps {
  title: string;
  state: OfferOptionState;
  result: CalculationResult;
  viewMode: ViewMode;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function OfferPreviewContent({
  title,
  state,
  result,
  viewMode,
}: OfferPreviewContentProps) {
  const tariff = getMobileTariff(state.mobile.tariffId);
  const subVariant = getSubVariant(state.mobile.subVariantId);
  const promo = getPromo(state.mobile.promoId);
  const fixedNet = state.fixedNet.enabled
    ? getFixedNetProduct(state.fixedNet.productId)
    : null;

  const oneTimeTotal = result.oneTime.reduce((sum, m) => sum + m.gross, 0);
  const hasBenefits = fixedNet !== null || promo?.type !== "NONE";

  return (
    <div className="space-y-4 print-section">
      {/* Header */}
      <div className="text-center pb-4 border-b">
        <h1 className="text-2xl font-bold text-primary">
          Vodafone Business Angebot
        </h1>
        <p className="text-muted-foreground">allenetze.de</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Badge variant="outline">{title}</Badge>
          <Badge variant="secondary">
            {viewMode === "dealer" ? "Händleransicht" : "Kundenansicht"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Erstellt am {new Date().toLocaleDateString("de-DE")} • Version:{" "}
          {state.meta.datasetVersion}
        </p>
      </div>

      {/* Hardware Section */}
      {(state.hardware.name || state.hardware.ekNet > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Hardware
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {state.hardware.name && (
              <p>
                <span className="text-muted-foreground">Gerät:</span>{" "}
                {state.hardware.name}
              </p>
            )}
            {viewMode === "dealer" && state.hardware.ekNet > 0 && (
              <>
                <p>
                  <span className="text-muted-foreground">EK netto:</span>{" "}
                  {formatCurrency(state.hardware.ekNet)}
                </p>
                {state.hardware.amortize && (
                  <p>
                    <span className="text-muted-foreground">
                      Amortisierung:
                    </span>{" "}
                    {state.hardware.amortMonths} Monate
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Mobilfunk
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <span className="text-muted-foreground">Tarif:</span>{" "}
            <strong>{tariff?.name || state.mobile.tariffId}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Variante:</span>{" "}
            {subVariant?.label || state.mobile.subVariantId}
          </p>
          <p>
            <span className="text-muted-foreground">Vertragsart:</span>{" "}
            {state.mobile.contractType === "new" ? "Neuvertrag" : "Verlängerung"}
          </p>
          {promo && promo.type !== "NONE" && (
            <p>
              <span className="text-muted-foreground">Aktion:</span>{" "}
              <Badge variant="secondary" className="ml-1">
                {promo.label}
              </Badge>
            </p>
          )}
          {tariff?.features && tariff.features.length > 0 && (
            <div className="pt-2">
              <span className="text-muted-foreground">Leistungen:</span>
              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                {tariff.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fixed Net Section */}
      {fixedNet && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Festnetz & Internet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">Produkt:</span>{" "}
              <strong>{fixedNet.name}</strong>
            </p>
            {fixedNet.features && fixedNet.features.length > 0 && (
              <ul className="list-disc list-inside text-muted-foreground">
                {fixedNet.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benefits Section */}
      {hasBenefits && (
        <Card className="bg-accent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Vorteile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {promo && promo.type !== "NONE" && (
                <Badge variant="outline" className="bg-background">
                  {promo.label}
                </Badge>
              )}
              {fixedNet && (
                <Badge variant="outline" className="bg-background">
                  Router inklusive
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Costs Section */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="w-4 h-4" />
            Kosten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Period Cards */}
          {result.periods.length === 1 ? (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Monatlich (netto)</span>
              <span className="font-semibold text-lg">
                {formatCurrency(result.periods[0].monthly.net)}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {result.periods.map((period, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <span className="text-muted-foreground">
                    {period.label || `Monat ${period.fromMonth}–${period.toMonth}`}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(period.monthly.net)} / Monat
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* One-time costs */}
          {oneTimeTotal > 0 && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Einmalig (brutto)</span>
              <span className="font-medium">{formatCurrency(oneTimeTotal)}</span>
            </div>
          )}

          {/* Totals */}
          <div className="pt-2 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ø Monat (netto)</span>
              <span className="font-semibold">
                {formatCurrency(result.totals.avgTermNet)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Summe 24M (brutto)</span>
              <span className="font-bold text-lg text-primary">
                {formatCurrency(result.totals.sumTermGross)}
              </span>
            </div>
          </div>

          {/* Dealer-only section */}
          {viewMode === "dealer" && (
            <div className="mt-4 pt-4 border-t border-dashed">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Händler-Kalkulation
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Provision:</span>
                </div>
                <div className="text-right font-medium">
                  {formatCurrency(result.dealer.provisionAfter)}
                </div>
                {result.dealer.hardwareEkNet > 0 && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Hardware EK:</span>
                    </div>
                    <div className="text-right">
                      {formatCurrency(result.dealer.hardwareEkNet)}
                    </div>
                  </>
                )}
                <div>
                  <span className="text-muted-foreground">Marge:</span>
                </div>
                <div
                  className={`text-right font-bold ${
                    result.dealer.margin >= 0 ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {formatCurrency(result.dealer.margin)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
