import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  type FixedNetState,
  type DatasetVersion,
  type FixedNetAccessType,
  listFixedNetByAccessType,
  getFixedNetProductFromCatalog,
} from "@/margenkalkulator";
import { Router, Phone, Lock, Check, Zap } from "lucide-react";
import { useFeature } from "@/hooks/useFeature";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { cn } from "@/lib/utils";

interface FixedNetStepProps {
  value: FixedNetState;
  onChange: (value: FixedNetState) => void;
  datasetVersion: DatasetVersion;
  onFixedNetEnabled?: () => void;
}

export function FixedNetStep({ value, onChange, datasetVersion, onFixedNetEnabled }: FixedNetStepProps) {
  const { enabled: fixedNetEnabled, reason: fixedNetReason } = useFeature("fixedNetModule");
  const [selectedAccessType, setSelectedAccessType] = useState<FixedNetAccessType>(
    value.accessType || "CABLE"
  );

  // All hooks must be called unconditionally before any early returns
  // Get products for selected access type
  const productsForAccessType = useMemo(() =>
    listFixedNetByAccessType(datasetVersion, selectedAccessType),
    [datasetVersion, selectedAccessType]
  );

  const selectedProduct = value.enabled && value.productId
    ? getFixedNetProductFromCatalog(datasetVersion, value.productId)
    : undefined;

  // Feature disabled - show locked state (after all hooks)
  if (!fixedNetEnabled) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Festnetz & Internet
                </h2>
                <p className="text-sm text-muted-foreground">
                  {fixedNetReason || "Dieses Feature ist in Ihrer Lizenz nicht verfügbar."}
                </p>
              </div>
            </div>
            <Switch checked={false} disabled />
          </div>
        </div>
      </div>
    );
  }

  const updateField = <K extends keyof FixedNetState>(
    field: K,
    fieldValue: FixedNetState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // Handle access type change
  const handleAccessTypeChange = (accessType: FixedNetAccessType) => {
    setSelectedAccessType(accessType);
    const products = listFixedNetByAccessType(datasetVersion, accessType);
    const firstProduct = products[0];
    onChange({
      ...value,
      accessType,
      productId: firstProduct?.id || "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Simple Toggle Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
              <Router className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Festnetz & Internet hinzufügen
                </h2>
                <HelpTooltip content="Verfügbarkeitsprüfung" />
              </div>
              <p className="text-sm text-muted-foreground">
                Aktivieren für GigaKombi Vorteil (-5€ mtl.)
              </p>
            </div>
          </div>
          <Switch
            checked={value.enabled}
            onCheckedChange={(checked) => {
              updateField("enabled", checked);
              if (checked) {
                if (!value.accessType) {
                  handleAccessTypeChange("CABLE");
                }
                // Trigger auto-collapse after enabling
                if (onFixedNetEnabled) {
                  setTimeout(() => onFixedNetEnabled(), 300);
                }
              }
            }}
          />
        </div>
      </div>

      {/* Expanded Options when enabled */}
      {value.enabled && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-6 animate-fade-in">
          {/* Access Type Pills */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              Zugangstyp
              <HelpTooltip content="Kabel-Anschluss prüfen" />
            </Label>
            {/* Access Type Selection Cards */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
                Zugangstyp
                <HelpTooltip content="Kabel-Anschluss prüfen" />
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["CABLE", "DSL", "FIBER"] as FixedNetAccessType[]).map((type) => {
                  const isSelected = selectedAccessType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleAccessTypeChange(type)}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-3 min-h-[120px]",
                        "hover:shadow-md hover:border-primary/50 hover:bg-muted/50",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}

                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {type === "CABLE" && <Router className="w-5 h-5" />}
                        {type === "DSL" && <Phone className="w-5 h-5" />}
                        {type === "FIBER" && <Zap className="w-5 h-5" />}
                      </div>

                      <span className={cn(
                        "font-semibold text-sm",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {type === "CABLE" && "Kabel Internet"}
                        {type === "DSL" && "DSL Anschluss"}
                        {type === "FIBER" && "Glasfaser"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Product Selector */}
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

          {/* Selected Product Summary */}
          {selectedProduct && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.speed} Mbit/s Download
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{selectedProduct.monthlyNet.toFixed(2)} €</p>
                  <p className="text-xs text-muted-foreground">pro Monat</p>
                </div>
              </div>
            </div>
          )}

          {/* GigaKombi Info */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-sm text-emerald-800 dark:text-emerald-200 flex-1">
                <p className="font-semibold mb-1">GigaKombi Business Vorteil:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>5€ monatlicher Rabatt auf Mobilfunk</li>
                  <li>Unlimited Datenvolumen für bis zu 10 Business Prime SIMs</li>
                </ul>
              </div>
              <HelpTooltip content="Festnetz" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
