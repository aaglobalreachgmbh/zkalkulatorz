import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  Loader2,
  Smartphone,
  Wifi,
  Users,
  Percent,
  Zap,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TemplateGenerator } from "./TemplateGenerator";
import { businessCatalog2025_09 } from "@/margenkalkulator";

interface ProductTabsProps {
  onDataChange?: () => void;
}

export function ProductTabs({ onDataChange }: ProductTabsProps) {
  return (
    <Tabs defaultValue="mobilfunk" className="space-y-4">
      <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-1">
        <TabsTrigger value="mobilfunk" className="text-xs sm:text-sm">
          <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">Mobilfunk</span>
          <span className="sm:hidden">Mobil</span>
        </TabsTrigger>
        <TabsTrigger value="teamdeal" className="text-xs sm:text-sm">
          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          TeamDeal
        </TabsTrigger>
        <TabsTrigger value="festnetz" className="text-xs sm:text-sm">
          <Wifi className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Festnetz
        </TabsTrigger>
        <TabsTrigger value="omo" className="text-xs sm:text-sm">
          <Percent className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          OMO
        </TabsTrigger>
        <TabsTrigger value="aktionen" className="text-xs sm:text-sm">
          <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Aktionen
        </TabsTrigger>
        <TabsTrigger value="vorlagen" className="text-xs sm:text-sm">
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Vorlagen
        </TabsTrigger>
      </TabsList>

      <TabsContent value="mobilfunk">
        <DataTab
          icon={<Smartphone className="h-5 w-5" />}
          title="Mobilfunk-Tarife (Prime, Smart)"
          data={businessCatalog2025_09.mobileTariffs.filter(t => t.family === "prime" || t.productLine === "PRIME")}
          renderItem={(t) => (
            <div className="flex justify-between">
              <span>{t.name}</span>
              <span className="text-muted-foreground">{t.baseNet.toFixed(2)}€ / {t.provisionBase}€</span>
            </div>
          )}
          getKey={(t) => t.id}
        />
      </TabsContent>

      <TabsContent value="teamdeal">
        <DataTab
          icon={<Users className="h-5 w-5" />}
          title="TeamDeal-Tarife"
          data={businessCatalog2025_09.mobileTariffs.filter(t => t.family === "teamdeal")}
          renderItem={(t) => (
            <div>
              <div className="flex justify-between">
                <span className="font-medium">{t.name}</span>
                <Badge variant="outline">{t.tier}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                <span>SIM: {t.provisionsByVariant?.SIM_ONLY ?? 0}€</span>
                <span>SUB5: {t.provisionsByVariant?.BASIC ?? 0}€</span>
                <span>SUB10: {t.provisionsByVariant?.SMARTPHONE ?? 0}€</span>
              </div>
            </div>
          )}
          getKey={(t) => t.id}
        />
      </TabsContent>

      <TabsContent value="festnetz">
        <DataTab
          icon={<Wifi className="h-5 w-5" />}
          title="Festnetz-Produkte"
          data={businessCatalog2025_09.fixedNetProducts}
          renderItem={(p) => (
            <div className="flex justify-between">
              <span>{p.name}</span>
              <div className="flex gap-2">
                <Badge variant="outline">{p.accessType}</Badge>
                <span className="text-muted-foreground">{p.speed} Mbit</span>
              </div>
            </div>
          )}
          getKey={(p) => p.id}
        />
      </TabsContent>

      <TabsContent value="omo">
        <DataTab
          icon={<Percent className="h-5 w-5" />}
          title="OMO-Matrix"
          data={businessCatalog2025_09.mobileTariffs.filter(t => t.omoMatrix)}
          renderItem={(t) => (
            <div>
              <div className="font-medium">{t.id}</div>
              <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                {[0, 5, 10, 15, 17.5, 20, 25].map(rate => (
                  <span key={rate}>{rate}%: {t.omoMatrix?.[rate] ?? "-"}</span>
                ))}
              </div>
            </div>
          )}
          getKey={(t) => t.id}
        />
      </TabsContent>

      <TabsContent value="aktionen">
        <DataTab
          icon={<Zap className="h-5 w-5" />}
          title="Aktionen/Promos"
          data={businessCatalog2025_09.promos}
          renderItem={(p) => (
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{p.label ?? p.id}</span>
                <Badge variant="outline" className="ml-2">{p.type}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {p.validFromISO} - {p.validUntilISO ?? "∞"}
              </span>
            </div>
          )}
          getKey={(p) => p.id}
        />
      </TabsContent>

      <TabsContent value="vorlagen">
        <TemplateGenerator />
      </TabsContent>
    </Tabs>
  );
}

// Generic Data Display + Import Tab
interface DataTabProps<T> {
  icon: React.ReactNode;
  title: string;
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
}

function DataTab<T>({ icon, title, data, renderItem, getKey }: DataTabProps<T>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    // Simulate processing
    await new Promise(r => setTimeout(r, 500));
    setIsLoading(false);
    
    toast({
      title: "Import-Vorschau",
      description: "Import-Funktion wird in der nächsten Version verfügbar.",
    });
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{data.length} Einträge geladen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {data.slice(0, 10).map(item => (
              <div key={getKey(item)} className="text-sm p-2 bg-muted/50 rounded">
                {renderItem(item)}
              </div>
            ))}
            {data.length > 10 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                +{data.length - 10} weitere...
              </p>
            )}
            {data.length === 0 && (
              <p className="text-sm text-muted-foreground">Keine Daten vorhanden</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importieren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            disabled={isLoading}
          />
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird verarbeitet...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
