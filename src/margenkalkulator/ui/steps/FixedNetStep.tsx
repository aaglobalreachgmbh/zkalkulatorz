import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FixedNetState, DatasetVersion } from "../../engine/types";
import { listFixedNetProducts, getFixedNetProductFromCatalog } from "../../engine/catalogResolver";
import { Wifi, Router, Phone, CheckCircle } from "lucide-react";

interface FixedNetStepProps {
  value: FixedNetState;
  onChange: (value: FixedNetState) => void;
  datasetVersion: DatasetVersion;
}

export function FixedNetStep({ value, onChange, datasetVersion }: FixedNetStepProps) {
  const updateField = <K extends keyof FixedNetState>(
    field: K,
    fieldValue: FixedNetState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const fixedNetProducts = listFixedNetProducts(datasetVersion);
  const selectedProduct = value.enabled 
    ? getFixedNetProductFromCatalog(datasetVersion, value.productId) 
    : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wifi className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Festnetz & Internet</CardTitle>
            <CardDescription>
              Optional: Festnetzprodukt zum Angebot hinzufügen (aktiviert GK-Konvergenz)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="fixed-enabled">Festnetz hinzufügen</Label>
            <p className="text-xs text-muted-foreground">
              Kombiniertes Mobilfunk + Festnetz Angebot
            </p>
          </div>
          <Switch
            id="fixed-enabled"
            checked={value.enabled}
            onCheckedChange={(checked) => updateField("enabled", checked)}
          />
        </div>

        {value.enabled && (
          <>
            <div className="space-y-2">
              <Label>Produkt</Label>
              <Select
                value={value.productId}
                onValueChange={(v) => updateField("productId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Produkt wählen" />
                </SelectTrigger>
                <SelectContent>
                  {fixedNetProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-2">
                          <span>{product.name}</span>
                          {product.speed && (
                            <Badge variant="outline" className="text-xs">
                              {product.speed} Mbit/s
                            </Badge>
                          )}
                          {product.includesPhone && (
                            <Phone className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {product.monthlyNet.toFixed(2)} €/Mo
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {/* Badges for key features */}
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.setupWaived && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Setup erlassen
                    </Badge>
                  )}
                  {selectedProduct.routerType && (
                    <Badge variant="secondary">
                      <Router className="w-3 h-3 mr-1" />
                      {selectedProduct.routerType === "FRITZBOX" ? "FRITZ!Box" : "Vodafone Station"} inkl.
                    </Badge>
                  )}
                  {selectedProduct.includesPhone && (
                    <Badge variant="secondary">
                      <Phone className="w-3 h-3 mr-1" />
                      Telefon-Flat
                    </Badge>
                  )}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-background px-2 py-0.5 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Monatlich:</span>
                    <span className="ml-2 font-medium">
                      {selectedProduct.monthlyNet.toFixed(2)} € netto
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Einmalig:</span>
                    <span className="ml-2 font-medium">
                      {selectedProduct.setupWaived ? (
                        <span className="text-green-600">0,00 € (erlassen)</span>
                      ) : (
                        `${selectedProduct.oneTimeNet.toFixed(2)} € netto`
                      )}
                    </span>
                  </div>
                </div>

                {/* Promo info */}
                {selectedProduct.promo && selectedProduct.promo.type !== "NONE" && (
                  <div className="text-sm text-primary">
                    <span className="font-medium">Aktion: </span>
                    {selectedProduct.promo.type === "INTRO_PRICE" && (
                      <span>
                        {selectedProduct.promo.value.toFixed(2)} €/Mo für{" "}
                        {selectedProduct.promo.durationMonths} Monate
                      </span>
                    )}
                    {selectedProduct.promo.type === "PCT_OFF_BASE" && (
                      <span>
                        {selectedProduct.promo.value * 100}% Rabatt für{" "}
                        {selectedProduct.promo.durationMonths} Monate
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
