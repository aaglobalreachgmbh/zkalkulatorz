// ============================================
// Tariff Facts Panel - Phase 2 Slice A
// Displays "Leistungen & Konditionen" for tariffs
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Info, Wifi, Phone, Router, Shield } from "lucide-react";
import type { MobileTariff, FixedNetProduct } from "../../engine/types";

interface MobileTariffFactsProps {
  type: "mobile";
  tariff: MobileTariff | undefined;
}

interface FixedNetFactsProps {
  type: "fixednet";
  product: FixedNetProduct | undefined;
}

type TariffFactsPanelProps = MobileTariffFactsProps | FixedNetFactsProps;

export function TariffFactsPanel(props: TariffFactsPanelProps) {
  if (props.type === "mobile") {
    return <MobileTariffFacts tariff={props.tariff} />;
  }
  return <FixedNetFacts product={props.product} />;
}

// ============================================
// Mobile Tariff Facts
// ============================================

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
        {/* Features List */}
        <ul className="space-y-1.5">
          {tariff.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Badges */}
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

        {/* Contract Info */}
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

// ============================================
// Fixed Net Facts
// ============================================

function FixedNetFacts({ product }: { product: FixedNetProduct | undefined }) {
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

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4" />
          Leistungen & Konditionen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Speed Highlight */}
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">{product.speed} Mbit/s</span>
        </div>

        {/* Features List */}
        <ul className="space-y-1.5">
          {product.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          <Badge variant="outline" className="text-xs">
            <Router className="w-3 h-3 mr-1" />
            {product.routerType} inkl.
          </Badge>
          {product.includesPhone && (
            <Badge variant="outline" className="text-xs">
              <Phone className="w-3 h-3 mr-1" />
              Telefon-Flat
            </Badge>
          )}
          {product.setupWaived && (
            <Badge variant="secondary" className="text-xs">
              Bereitstellung entfällt
            </Badge>
          )}
          {(product.speed ?? 0) >= 500 && (
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Feste IP inkl.
            </Badge>
          )}
        </div>

        {/* One-Time Costs Info */}
        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <p>Mindestvertragslaufzeit: 24 Monate</p>
          <p>Bereitstellung: {product.setupWaived ? "entfällt" : "19,90€ netto"}</p>
          <p>Versand Hardware: 8,40€ netto</p>
          {(product.speed ?? 0) < 500 && (
            <p>Feste IP: optional (+5€/mtl.)</p>
          )}
        </div>

        {/* Promo Info if exists */}
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