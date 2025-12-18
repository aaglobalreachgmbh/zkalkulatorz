import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FixedNetState, DatasetVersion, FixedNetAccessType, MobileState } from "../../engine/types";
import { 
  listFixedNetByAccessType, 
  getFixedNetProductFromCatalog,
  getCatalog,
} from "../../engine/catalogResolver";
import { 
  komfortRegioPhoneTiers, 
  komfortRegioInternetOptions,
  komfortFTTHPhoneTiers,
  komfortFTTHInternetOptions,
  KOMFORT_FIXED_IP_ADDON_NET,
} from "../../data/business/v2025_09/fixedNetKomfort";
import { DATA_SOURCES } from "../../data/business/v2025_09/sources";
import { calculateGigaKombi } from "../../engine/benefitsEngine";
import { Wifi, Router, Phone, CheckCircle, Cable, Zap, PhoneCall, Infinity, Settings } from "lucide-react";

// Constants
const EXPERT_SETUP_NET = 89.99;

// Access type configuration
const ACCESS_TYPE_CONFIG: {
  id: FixedNetAccessType;
  label: string;
  icon: typeof Wifi;
  description: string;
}[] = [
  { id: "CABLE", label: "Kabel", icon: Cable, description: "Schnelles Internet via Kabelanschluss" },
  { id: "DSL", label: "DSL", icon: Wifi, description: "Internet via Telefonleitung" },
  { id: "FIBER", label: "Glasfaser", icon: Zap, description: "Höchste Geschwindigkeiten" },
  { id: "KOMFORT_REGIO", label: "Komfort Regio", icon: Phone, description: "Telefon + Internet Paket" },
  { id: "KOMFORT_FTTH", label: "Komfort FTTH", icon: PhoneCall, description: "Glasfaser Telefon-Paket" },
];

interface FixedNetStepProps {
  value: FixedNetState;
  onChange: (value: FixedNetState) => void;
  datasetVersion: DatasetVersion;
  mobileState?: MobileState;  // For GigaKombi calculation
}

export function FixedNetStep({ value, onChange, datasetVersion, mobileState }: FixedNetStepProps) {
  const [selectedAccessType, setSelectedAccessType] = useState<FixedNetAccessType>(
    value.accessType || "CABLE"
  );

  const updateField = <K extends keyof FixedNetState>(
    field: K,
    fieldValue: FixedNetState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // Get products for selected access type
  const productsForAccessType = useMemo(() => 
    listFixedNetByAccessType(datasetVersion, selectedAccessType),
    [datasetVersion, selectedAccessType]
  );

  const selectedProduct = value.enabled && value.productId
    ? getFixedNetProductFromCatalog(datasetVersion, value.productId) 
    : undefined;

  // Komfort-specific selectors
  const isKomfort = selectedAccessType === "KOMFORT_REGIO" || selectedAccessType === "KOMFORT_FTTH";
  const komfortPhoneTiers = selectedAccessType === "KOMFORT_REGIO" 
    ? komfortRegioPhoneTiers 
    : komfortFTTHPhoneTiers;
  const komfortInternetOptions = selectedAccessType === "KOMFORT_REGIO"
    ? komfortRegioInternetOptions
    : komfortFTTHInternetOptions;

  // Calculate GigaKombi eligibility
  const catalog = getCatalog(datasetVersion);
  const gigaKombiResult = useMemo(() => {
    if (!mobileState) return null;
    return calculateGigaKombi(
      [{ tariffId: mobileState.tariffId, quantity: mobileState.quantity }],
      value,
      catalog
    );
  }, [mobileState, value, catalog]);

  // Handle access type change
  const handleAccessTypeChange = (accessType: FixedNetAccessType) => {
    setSelectedAccessType(accessType);
    // Reset product selection when access type changes
    const products = listFixedNetByAccessType(datasetVersion, accessType);
    const firstProduct = products[0];
    onChange({
      ...value,
      accessType,
      productId: firstProduct?.id || "",
      fixedIpEnabled: false,
      expertSetupEnabled: false,
      phoneTierId: undefined,
      internetOptionId: undefined,
    });
  };

  // Check if Fixed IP is optional (not included in product)
  const showFixedIpToggle = selectedProduct && 
    !selectedProduct.fixedIpIncluded && 
    selectedProduct.fixedIpAddonNet;

  // Check if Expert Setup is available (Cable only)
  const showExpertSetup = selectedAccessType === "CABLE" && selectedProduct?.expertSetupAvailable;

  // Get source info for footer
  const sourceInfo = useMemo(() => {
    switch (selectedAccessType) {
      case "CABLE": return DATA_SOURCES.CABLE;
      case "DSL": return DATA_SOURCES.DSL;
      case "FIBER": return DATA_SOURCES.GLASFASER;
      case "KOMFORT_REGIO": return DATA_SOURCES.KOMFORT_REGIO;
      case "KOMFORT_FTTH": return DATA_SOURCES.KOMFORT_FTTH;
      default: return null;
    }
  }, [selectedAccessType]);

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
              Optional: Festnetzprodukt hinzufügen (aktiviert GigaKombi)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
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
            onCheckedChange={(checked) => {
              updateField("enabled", checked);
              if (checked && !value.accessType) {
                handleAccessTypeChange("CABLE");
              }
            }}
          />
        </div>

        {value.enabled && (
          <>
            {/* Access Type Selector */}
            <div className="space-y-3">
              <Label>Zugangstyp</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {ACCESS_TYPE_CONFIG.map((config) => {
                  const Icon = config.icon;
                  const isSelected = selectedAccessType === config.id;
                  return (
                    <button
                      key={config.id}
                      type="button"
                      onClick={() => handleAccessTypeChange(config.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="font-medium text-sm">{config.label}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {config.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Komfort-specific: Phone Tier + Internet Option */}
            {isKomfort ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Basis</Label>
                  <Select
                    value={value.phoneTierId || ""}
                    onValueChange={(v) => {
                      const tier = komfortPhoneTiers.find(t => t.id === v);
                      onChange({
                        ...value,
                        phoneTierId: v,
                        productId: v, // Use phone tier as base product
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Phone-Tarif wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {komfortPhoneTiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          <div className="flex justify-between w-full gap-4">
                            <span>{tier.name}</span>
                            <span className="text-muted-foreground">
                              {tier.monthlyNet.toFixed(2)} €/Mo
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Internetoption</Label>
                  <Select
                    value={value.internetOptionId || ""}
                    onValueChange={(v) => updateField("internetOptionId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Internetoption wählen (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Keine Internetoption</SelectItem>
                      {komfortInternetOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          <div className="flex justify-between w-full gap-4">
                            <span>{opt.name} ({opt.speed} Mbit/s)</span>
                            <span className="text-muted-foreground">
                              +{opt.addonNet.toFixed(2)} €/Mo
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              /* Standard Product Selector */
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
                    {productsForAccessType.map((product) => (
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
            )}

            {/* Add-ons Section */}
            {(showFixedIpToggle || showExpertSetup) && (
              <div className="space-y-3 pt-2 border-t">
                <Label className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Zusatzoptionen
                </Label>
                
                {showFixedIpToggle && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="fixedIp"
                      checked={value.fixedIpEnabled ?? false}
                      onCheckedChange={(checked) => updateField("fixedIpEnabled", !!checked)}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="fixedIp" className="font-normal cursor-pointer">
                        Feste IP-Adresse
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        +{(selectedProduct?.fixedIpAddonNet ?? KOMFORT_FIXED_IP_ADDON_NET).toFixed(2)} €/Mo
                      </span>
                    </div>
                  </div>
                )}

                {showExpertSetup && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="expertSetup"
                      checked={value.expertSetupEnabled ?? false}
                      onCheckedChange={(checked) => updateField("expertSetupEnabled", !!checked)}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="expertSetup" className="font-normal cursor-pointer">
                        Experten-Service Einrichtung
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        +{EXPERT_SETUP_NET.toFixed(2)} € einmalig
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Details Panel */}
            {selectedProduct && !isKomfort && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {/* Badges for key features */}
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.includesRouter && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      <Router className="w-3 h-3 mr-1" />
                      {selectedProduct.routerModelDefault || "Router"} inkl.
                    </Badge>
                  )}
                  {selectedProduct.fixedIpIncluded && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Feste IP inkl.
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
                  {selectedProduct.features.slice(0, 4).map((feature, idx) => (
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
                      {selectedProduct.oneTimeNet > 0 
                        ? `${selectedProduct.oneTimeNet.toFixed(2)} € netto`
                        : "0,00 €"
                      }
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
                  </div>
                )}
              </div>
            )}

            {/* GigaKombi Benefits Box */}
            {gigaKombiResult && gigaKombiResult.eligible && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Infinity className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-800">GigaKombi Business</span>
                </div>
                <p className="text-sm text-emerald-700">
                  {gigaKombiResult.explanation}
                </p>
                {gigaKombiResult.unlimitedLinesCount < 10 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Bis zu 10 Prime-SIMs können Unlimited erhalten.
                  </p>
                )}
              </div>
            )}

            {/* GK Not Eligible Notice */}
            {gigaKombiResult && !gigaKombiResult.eligible && mobileState && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <span className="font-medium">GigaKombi: </span>
                {gigaKombiResult.explanation}
              </div>
            )}
          </>
        )}

        {/* Source Footer */}
        {value.enabled && sourceInfo && (
          <div className="pt-3 border-t text-xs text-muted-foreground">
            <span>Quelle: {sourceInfo.title}</span>
            <span className="mx-2">•</span>
            <span>Stand: {sourceInfo.versionDate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
