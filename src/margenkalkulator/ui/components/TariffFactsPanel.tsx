import { type MobileTariff, type FixedNetProduct } from "@/margenkalkulator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Info, Wifi, Phone, Router, Shield } from "lucide-react";

interface MobileTariffFactsProps {
  type: "mobile";
  tariff: MobileTariff | undefined;
}

interface FixedNetFactsProps {
  type: "fixednet";
  product: FixedNetProduct | undefined;
  fixedIpEnabled?: boolean;
  expertSetupEnabled?: boolean;
  expertSetupNet?: number;
}

type TariffFactsPanelProps = MobileTariffFactsProps | FixedNetFactsProps;

export function TariffFactsPanel(props: TariffFactsPanelProps) {
  if (props.type === "mobile") {
    return <MobileTariffFacts tariff={props.tariff} />;
  }
  return <FixedNetFacts 
    product={props.product} 
    fixedIpEnabled={props.fixedIpEnabled}
    expertSetupEnabled={props.expertSetupEnabled}
    expertSetupNet={props.expertSetupNet}
  />;
}

function MobileTariffFacts({ tariff }: { tariff: MobileTariff | undefined }) {
  if (!tariff) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            Bitte wählen Sie einen Tarif aus.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4" />
          Leistungen & Konditionen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1.5">
          {tariff.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {tariff.oneNumberIncluded && (
            <Badge variant="outline" className="text-xs">
              <Phone className="w-3 h-3 mr-1" />
              OneNumber inkl.
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Wifi className="w-3 h-3 mr-1" />
            5G
          </Badge>
          <Badge variant="outline" className="text-xs">
            24 Monate
          </Badge>
        </div>
        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <p>Mindestvertragslaufzeit: 24 Monate</p>
          {tariff.productLine === "PRIME" && (
            <p>GigaDepot Business: {tariff.tier === "S" ? "optional (+3,95€/mtl.)" : "inklusive"}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FixedNetFacts({ 
  product, 
  fixedIpEnabled,
  expertSetupEnabled,
  expertSetupNet = 89.99,
}: { 
  product: FixedNetProduct | undefined;
  fixedIpEnabled?: boolean;
  expertSetupEnabled?: boolean;
  expertSetupNet?: number;
}) {
  if (!product) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            Bitte wählen Sie ein Produkt aus.
          </p>
        </CardContent>
      </Card>
    );
  }

  const SETUP_FEE = 19.90;
  const SHIPPING_FEE = 8.40;

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4" />
          Leistungen & Konditionen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">{product.speed} Mbit/s</span>
        </div>
        <ul className="space-y-1.5">
          {product.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {product.includesRouter && (
            <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
              <Router className="w-3 h-3 mr-1" />
              {product.routerModelDefault || "Router"} inkl. (0€)
            </Badge>
          )}
          {product.includesPhone && (
            <Badge variant="outline" className="text-xs">
              <Phone className="w-3 h-3 mr-1" />
              Telefon-Flat
            </Badge>
          )}
          {product.fixedIpIncluded && (
            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
              <Shield className="w-3 h-3 mr-1" />
              Feste IP inkl.
            </Badge>
          )}
          {product.setupWaived && (
            <Badge variant="secondary" className="text-xs">
              Bereitstellung entfällt
            </Badge>
          )}
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Einmalige Kosten</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bereitstellung</span>
              <span>{product.setupWaived ? <span className="text-green-600">erlassen</span> : `${SETUP_FEE.toFixed(2)} €`}</span>
            </div>
            {!product.setupWaived && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versand Hardware</span>
                <span>{SHIPPING_FEE.toFixed(2)} €</span>
              </div>
            )}
            {expertSetupEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experten-Service</span>
                <span>{expertSetupNet.toFixed(2)} €</span>
              </div>
            )}
          </div>
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Optionen</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Feste IP</span>
              {product.fixedIpIncluded ? (
                <span className="text-green-600">inklusive</span>
              ) : fixedIpEnabled ? (
                <span>+{(product.fixedIpAddonNet ?? 5).toFixed(2)} €/Mo</span>
              ) : (
                <span className="text-muted-foreground">zubuchbar</span>
              )}
            </div>
            {product.expertSetupAvailable && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experten-Einrichtung</span>
                <span className={expertSetupEnabled ? "" : "text-muted-foreground"}>
                  {expertSetupEnabled ? "gebucht" : "verfügbar"}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>Mindestvertragslaufzeit: 24 Monate</p>
        </div>
        {product.promo && (
          <div className="pt-2 border-t">
            <Badge className="bg-primary/10 text-primary text-xs">
              Aktion: {product.promo.type === "INTRO_PRICE" 
                ? `${product.promo.durationMonths} Monate zum Aktionspreis` 
                : `${Math.round((1 - (product.promo.value ?? 1)) * 100)}% Rabatt für ${product.promo.durationMonths} Monate`}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}