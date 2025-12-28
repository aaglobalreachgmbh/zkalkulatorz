// ============================================
// Cloud Offer Manager Component
// Save, Load, Delete from Supabase
// ============================================

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Cloud,
  CloudOff,
  Trash2,
  Clock,
  Smartphone,
  Signal,
  Save,
  FolderOpen,
  Loader2,
  RefreshCw,
  Building2,
} from "lucide-react";
import type { OfferOptionState } from "../../engine/types";
import type { CloudOffer } from "../../storage/types";
import { useCloudOffers } from "../../hooks/useCloudOffers";
import { useCustomers } from "../../hooks/useCustomers";
import { useAuth } from "@/hooks/useAuth";
import { CustomerSelector } from "./CustomerSelector";

interface CloudOfferManagerProps {
  config: OfferOptionState;
  avgMonthly: number;
  onLoadOffer: (config: OfferOptionState) => void;
}

export function CloudOfferManager({
  config,
  avgMonthly,
  onLoadOffer,
}: CloudOfferManagerProps) {
  const { user } = useAuth();
  const {
    offers,
    isLoading,
    refetch,
    createOffer,
    deleteOffer,
  } = useCloudOffers();
  const { customers } = useCustomers();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"load" | "save">("load");
  const [saveName, setSaveName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Build customer lookup map
  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.id, c.company_name));
    return map;
  }, [customers]);

  // Generate default name
  const defaultName = () => {
    const parts: string[] = [];
    if (config.hardware.name && config.hardware.ekNet > 0) {
      parts.push(config.hardware.name);
    }
    if (config.mobile.tariffId) {
      parts.push(config.mobile.tariffId.replace(/_/g, " "));
    }
    return parts.join(" + ") || `Angebot ${new Date().toLocaleDateString("de-DE")}`;
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSaveName(defaultName());
      setSelectedCustomerId(null);
      refetch();
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    try {
      await createOffer.mutateAsync({
        name: saveName.trim(),
        config,
        avgMonthly,
        customerId: selectedCustomerId,
      });
      setSaveName("");
      setSelectedCustomerId(null);
      setTab("load");
    } catch {
      // Error handled in hook
    }
  };

  const handleLoad = (offer: CloudOffer) => {
    onLoadOffer(offer.config);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOffer.mutateAsync(id);
    } catch {
      // Error handled in hook
    }
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <CloudOff className="w-4 h-4" />
        <span className="hidden sm:inline">Cloud</span>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Cloud className="w-4 h-4" />
          <span className="hidden sm:inline">Cloud</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            Cloud-Angebote
          </DialogTitle>
          <DialogDescription>
            Speichern und laden Sie Angebote aus der Cloud.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "load" | "save")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="load" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Laden
            </TabsTrigger>
            <TabsTrigger value="save" className="gap-2">
              <Save className="w-4 h-4" />
              Speichern
            </TabsTrigger>
          </TabsList>

          <TabsContent value="load" className="mt-4">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Lade Angebote...</p>
              </div>
            ) : offers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Cloud className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Keine gespeicherten Angebote</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setTab("save")}
                  className="mt-2"
                >
                  Erstes Angebot speichern →
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetch()}
                    className="gap-1 text-muted-foreground"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Aktualisieren
                  </Button>
                </div>
                <ScrollArea className="max-h-[300px] pr-4">
                  <div className="space-y-2">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <button
                          onClick={() => handleLoad(offer)}
                          className="flex-1 text-left"
                        >
                          <div className="font-medium text-foreground">
                            {offer.name}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              {offer.preview?.hardware || "SIM Only"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Signal className="w-3 h-3" />
                              {offer.preview?.tariff || "Kein Tarif"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(offer.updated_at)}
                            </span>
                          </div>
                          {/* Customer badge */}
                          {offer.customer_id && customerMap.get(offer.customer_id) && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                              <Building2 className="w-3 h-3" />
                              {customerMap.get(offer.customer_id)}
                            </div>
                          )}
                          <div className="mt-1 text-sm font-medium text-primary">
                            {(offer.preview?.avgMonthly || 0).toFixed(2)} € /mtl.
                            {(offer.preview?.quantity || 1) > 1 && (
                              <span className="text-muted-foreground">
                                {" "}
                                (×{offer.preview?.quantity})
                              </span>
                            )}
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(offer.id);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="save" className="mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Name des Angebots
                </label>
                <Input
                  placeholder="z.B. iPhone 16 + Prime M"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                />
              </div>

              {/* Customer Selector */}
              <CustomerSelector
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
              />

              <div className="text-sm text-muted-foreground">
                <p>Das Angebot wird in der Cloud gespeichert und ist auf allen Geräten verfügbar.</p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                disabled={!saveName.trim() || createOffer.isPending}
                className="gap-2"
              >
                {createOffer.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                {createOffer.isPending ? "Speichern..." : "In Cloud speichern"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
