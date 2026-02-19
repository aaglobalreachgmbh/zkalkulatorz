import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type FixedNetState,
  type DatasetVersion,
  type FixedNetAccessType,
  listFixedNetByAccessType,
  getFixedNetProductFromCatalog,
} from "@/margenkalkulator";
import {
  Router,
  Phone,
  Lock,
  Check,
  Zap,
  MapPin,
  CheckCircle,
  Download,
  Upload,
  ChevronRight,
  Wifi,
  RadioTower,
} from "lucide-react";
import { useFeature } from "@/hooks/useFeature";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { cn } from "@/lib/utils";

interface FixedNetStepProps {
  value: FixedNetState;
  onChange: (value: FixedNetState) => void;
  datasetVersion: DatasetVersion;
  onFixedNetEnabled?: () => void;
}

type FixedNetPhase = "disabled" | "address" | "selection";

type RouterOption = {
  id: "premium" | "standard" | "none";
  name: string;
  description: string;
  monthlyExtra: number;
  label: string;
};

const ROUTER_OPTIONS: RouterOption[] = [
  {
    id: "premium",
    name: "FRITZ!Box 6690 Cable",
    description: "Premium WLAN AX, 2x Telefon, 4x LAN",
    monthlyExtra: 6.99,
    label: "mtl. Miete",
  },
  {
    id: "standard",
    name: "Vodafone Station",
    description: "Standard WLAN AC, 2x Telefon",
    monthlyExtra: 0,
    label: "Inklusive",
  },
  {
    id: "none",
    name: "Kein Router (Eigene Hardware)",
    description: "Kundeneigenes Gerät verwenden",
    monthlyExtra: 0,
    label: "",
  },
];

const ACCESS_TYPE_CONFIG = [
  {
    id: "CABLE" as FixedNetAccessType,
    label: "Kabel",
    icon: Router,
    maxSpeed: "1000 Mbit/s",
    available: true,
  },
  {
    id: "FIBER" as FixedNetAccessType,
    label: "Glasfaser",
    icon: Zap,
    maxSpeed: "1000 Mbit/s",
    available: true,
  },
  {
    id: "DSL" as FixedNetAccessType,
    label: "DSL",
    icon: RadioTower,
    maxSpeed: "250 Mbit/s",
    available: false,
  },
];

export function FixedNetStep({
  value,
  onChange,
  datasetVersion,
  onFixedNetEnabled,
}: FixedNetStepProps) {
  const { enabled: fixedNetEnabled, reason: fixedNetReason } =
    useFeature("fixedNetModule");

  const [phase, setPhase] = useState<FixedNetPhase>(
    value.enabled ? "selection" : "disabled"
  );
  const [address, setAddress] = useState({
    street: "",
    houseNumber: "",
    zip: "",
    city: "",
  });
  const [checkedAddress, setCheckedAddress] = useState(
    value.enabled ? "Musterstraße 1, 10115 Berlin" : ""
  );
  const [saveAddress, setSaveAddress] = useState(false);
  const [selectedRouterId, setSelectedRouterId] = useState<
    "premium" | "standard" | "none"
  >("standard");
  const [selectedAccessType, setSelectedAccessType] =
    useState<FixedNetAccessType>(value.accessType || "CABLE");
  const [isChecking, setIsChecking] = useState(false);

  const productsForAccessType = useMemo(
    () => listFixedNetByAccessType(datasetVersion, selectedAccessType),
    [datasetVersion, selectedAccessType]
  );

  const selectedProduct =
    value.enabled && value.productId
      ? getFixedNetProductFromCatalog(datasetVersion, value.productId)
      : undefined;

  // Feature disabled
  if (!fixedNetEnabled) {
    return (
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
                {fixedNetReason ||
                  "Dieses Feature ist in Ihrer Lizenz nicht verfügbar."}
              </p>
            </div>
          </div>
          <Switch checked={false} disabled />
        </div>
      </div>
    );
  }

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setPhase("address");
    } else {
      setPhase("disabled");
      setCheckedAddress("");
      onChange({ ...value, enabled: false, productId: "", accessType: "CABLE" });
    }
  };

  const handleCheckAvailability = () => {
    setIsChecking(true);
    // Simulate API check
    setTimeout(() => {
      const displayAddress = `${address.street} ${address.houseNumber}, ${address.zip} ${address.city}`.trim();
      setCheckedAddress(
        displayAddress.length > 3 ? displayAddress : "Musterstraße 1, 10115 Berlin"
      );

      // Pre-select first available product
      const products = listFixedNetByAccessType(datasetVersion, "CABLE");
      const firstProduct = products[0];
      onChange({
        ...value,
        enabled: false, // Not yet confirmed until "Hinzufügen" is clicked
        accessType: "CABLE",
        productId: firstProduct?.id || "",
      });
      setSelectedAccessType("CABLE");
      setIsChecking(false);
      setPhase("selection");
    }, 600);
  };

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

  const handleSelectProduct = (productId: string) => {
    onChange({ ...value, productId });
  };

  const handleConfirm = () => {
    onChange({
      ...value,
      enabled: true,
      accessType: selectedAccessType,
    });
    if (onFixedNetEnabled) {
      setTimeout(() => onFixedNetEnabled(), 300);
    }
  };

  const addressIsComplete =
    address.street.length > 1 &&
    address.houseNumber.length > 0 &&
    address.zip.length === 5 &&
    address.city.length > 1;

  // ─── PHASE 0: Disabled toggle card ───────────────────────────────────────
  if (phase === "disabled") {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
              <Router className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Festnetz & Internet
                </h2>
                <HelpTooltip content="GigaKombi Business: -5€/mtl. auf Mobilfunk + Unlimited für bis zu 10 SIMs" />
              </div>
              <p className="text-sm text-muted-foreground">
                Aktivieren für GigaKombi Business Vorteil
              </p>
            </div>
          </div>
          <Switch checked={false} onCheckedChange={handleToggle} />
        </div>
      </div>
    );
  }

  // ─── PHASE A: Address Form ────────────────────────────────────────────────
  if (phase === "address") {
    return (
      <div className="space-y-3">
        {/* Header toggle row */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Router className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Festnetz & Internet
                </h2>
                <p className="text-xs text-muted-foreground">
                  Adresse prüfen um Tarife zu sehen
                </p>
              </div>
            </div>
            <Switch checked={true} onCheckedChange={handleToggle} />
          </div>
        </div>

        {/* Step 1 — Address form */}
        <div className="bg-card rounded-xl border border-primary/40 overflow-hidden">
          {/* Step header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <span className="font-semibold text-sm text-foreground">
                Installationsadresse
              </span>
            </div>
            <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
              In Bearbeitung
            </Badge>
          </div>

          {/* Address grid */}
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1 font-medium">
                  Straße
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) =>
                    setAddress({ ...address, street: e.target.value })
                  }
                  placeholder="Musterstraße"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-medium">
                  Nr.
                </label>
                <input
                  type="text"
                  value={address.houseNumber}
                  onChange={(e) =>
                    setAddress({ ...address, houseNumber: e.target.value })
                  }
                  placeholder="1"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-medium">
                  Postleitzahl
                </label>
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) =>
                    setAddress({
                      ...address,
                      zip: e.target.value.slice(0, 5),
                    })
                  }
                  placeholder="10115"
                  maxLength={5}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-medium">
                  Ort
                </label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                  placeholder="Berlin"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="rounded border-input w-4 h-4 accent-primary"
                />
                <span className="text-xs text-muted-foreground">
                  Adresse im Adressbuch speichern
                </span>
              </label>

              <Button
                onClick={handleCheckAvailability}
                disabled={isChecking}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                {isChecking ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Prüfe...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verfügbarkeit prüfen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Steps 2 & 3 — Locked */}
        {[
          { num: 2, label: "Technologie Auswahl" },
          { num: 3, label: "Tarifdetails" },
        ].map((step) => (
          <div
            key={step.num}
            className="bg-card rounded-xl border border-border overflow-hidden opacity-50"
          >
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {step.num}
                </div>
                <span className="font-medium text-sm text-muted-foreground">
                  {step.label}
                </span>
              </div>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── PHASE B: Selection Flow ──────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Header toggle row */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Router className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Festnetz & Internet
              </h2>
              <p className="text-xs text-muted-foreground">
                Verfügbarkeit geprüft
              </p>
            </div>
          </div>
          <Switch checked={true} onCheckedChange={handleToggle} />
        </div>
      </div>

      {/* Step 1 — Checked Address */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm text-foreground">
                Installationsadresse
              </span>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {checkedAddress}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPhase("address")}
            className="text-xs text-primary hover:underline"
          >
            Ändern
          </button>
        </div>
      </div>

      {/* Step 2 — Technology */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            2
          </div>
          <span className="font-semibold text-sm text-foreground">
            Technologie wählen
          </span>
        </div>

        <div className="p-4 grid grid-cols-3 gap-3">
          {ACCESS_TYPE_CONFIG.map((tech) => {
            const Icon = tech.icon;
            const isSelected = selectedAccessType === tech.id;
            return (
              <button
                key={tech.id}
                onClick={() =>
                  tech.available
                    ? handleAccessTypeChange(tech.id)
                    : undefined
                }
                disabled={!tech.available}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2 min-h-[100px]",
                  !tech.available && "opacity-40 cursor-not-allowed",
                  tech.available &&
                    "hover:shadow-md hover:border-primary/50 hover:bg-muted/30",
                  isSelected && tech.available
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card"
                )}
              >
                {isSelected && tech.available && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                    isSelected && tech.available
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "font-semibold text-sm",
                      isSelected && tech.available
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    {tech.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tech.available ? tech.maxSpeed : "Nicht verfügbar"}
                  </p>
                </div>
                {tech.available && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Verfügbar
                  </span>
                )}
                {!tech.available && (
                  <span className="text-xs text-muted-foreground">
                    Ausbau nicht geplant
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3 — Tariff Cards */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            3
          </div>
          <span className="font-semibold text-sm text-foreground">
            Tarif auswählen
            <span className="font-normal text-muted-foreground ml-1">
              (
              {
                ACCESS_TYPE_CONFIG.find((a) => a.id === selectedAccessType)
                  ?.label
              }
              )
            </span>
          </span>
        </div>

        <div className="p-4">
          {productsForAccessType.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Produkte für diese Technologie verfügbar.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {productsForAccessType.slice(0, 3).map((product, idx) => {
                const isSelected = value.productId === product.id;
                return (
                  <div
                    key={product.id}
                    className={cn(
                      "relative flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    {idx === 0 && (
                      <div className="bg-primary text-primary-foreground text-xs font-semibold text-center py-1 px-2">
                        Empfohlen
                      </div>
                    )}
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div>
                        <p className="font-semibold text-sm text-foreground leading-tight">
                          {product.name}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {product.monthlyNet.toFixed(2)}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            €/ mtl.
                          </span>
                        </p>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        {product.speed && (
                          <div className="flex items-center gap-1.5">
                            <Download className="w-3 h-3 text-primary" />
                            <span>Download {product.speed} Mbit/s</span>
                          </div>
                        )}
                        {product.speed && (
                          <div className="flex items-center gap-1.5">
                            <Upload className="w-3 h-3 text-muted-foreground" />
                            <span>Upload 50 Mbit/s</span>
                          </div>
                        )}
                        {product.includesPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-primary" />
                            <span>Telefonie Flatrate</span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "w-full mt-auto text-xs",
                          isSelected &&
                            "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                        onClick={() => handleSelectProduct(product.id)}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3 h-3" />
                            Ausgewählt
                          </>
                        ) : (
                          "Auswählen"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Step 4 — Router */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            4
          </div>
          <span className="font-semibold text-sm text-foreground">
            Router & Hardware
          </span>
        </div>

        <div className="p-4 space-y-2">
          {ROUTER_OPTIONS.map((router) => {
            const isSelected = selectedRouterId === router.id;
            return (
              <button
                key={router.id}
                onClick={() => setSelectedRouterId(router.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 text-left",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Radio dot */}
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      isSelected
                        ? "border-primary"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {router.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {router.description}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      router.monthlyExtra > 0
                        ? "text-foreground"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {router.monthlyExtra > 0
                      ? `+ ${router.monthlyExtra.toFixed(2)} €`
                      : router.label
                      ? "0,00 €"
                      : "—"}
                  </p>
                  {router.label && (
                    <p className="text-xs text-muted-foreground">
                      {router.label}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* GigaKombi Info */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <div className="flex items-start gap-2">
          <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-emerald-800 dark:text-emerald-200">
            <p className="font-semibold">GigaKombi Business Vorteil:</p>
            <p className="text-xs mt-0.5">
              -5€ mtl. auf Mobilfunk + Unlimited Datenvolumen für bis zu 10
              Business Prime SIMs
            </p>
          </div>
        </div>
      </div>

      {/* Zusammenfassung + CTA */}
      {value.productId && selectedProduct && (
        <div className="bg-muted/40 rounded-xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Zusammenfassung
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {selectedProduct.name}
              </span>
              <span className="font-medium">
                {selectedProduct.monthlyNet.toFixed(2)} €
              </span>
            </div>
            {selectedRouterId === "premium" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  FRITZ!Box 6690 Cable
                </span>
                <span className="font-medium">+ 6,99 €</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Monatlich gesamt</span>
              <span className="text-primary">
                {(
                  selectedProduct.monthlyNet +
                  (selectedRouterId === "premium" ? 6.99 : 0)
                ).toFixed(2)}{" "}
                €
              </span>
            </div>
          </div>
        </div>
      )}

      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-11"
        onClick={handleConfirm}
        disabled={!value.productId}
      >
        Festnetz zum Angebot hinzufügen
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
