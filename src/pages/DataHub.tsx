// ============================================
// DataHub - Zentrale Datenverwaltung für den Kalkulator
// "3.-Klässler-Bedienbarkeit" - Einfach wie nie
// ============================================

import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HardDrive, 
  Receipt, 
  Tags, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTenantHardware } from "@/margenkalkulator/hooks/useTenantHardware";
import { useTenantProvisions } from "@/margenkalkulator/hooks/useTenantProvisions";
import { SmartImporter } from "@/margenkalkulator/ui/components/SmartImporter";
import { TenantHardwareManager } from "@/margenkalkulator/ui/components/TenantHardwareManager";
import { TenantProvisionManager } from "@/margenkalkulator/ui/components/TenantProvisionManager";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type DataCategory = "hardware" | "provisions" | "promos";

interface DataStatus {
  category: DataCategory;
  label: string;
  description: string;
  icon: typeof HardDrive;
  count: number;
  status: "complete" | "partial" | "missing";
  lastUpdate?: string;
}

function StatusBadge({ status }: { status: DataStatus["status"] }) {
  switch (status) {
    case "complete":
      return (
        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Vollständig
        </Badge>
      );
    case "partial":
      return (
        <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Unvollständig
        </Badge>
      );
    case "missing":
      return (
        <Badge className="bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/30">
          <XCircle className="h-3 w-3 mr-1" />
          Fehlt
        </Badge>
      );
  }
}

function DataStatusCard({ 
  data, 
  onUpload,
  isActive
}: { 
  data: DataStatus;
  onUpload: () => void;
  isActive: boolean;
}) {
  const Icon = data.icon;
  
  return (
    <Card 
      className={`
        cursor-pointer transition-all hover:shadow-md
        ${isActive ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"}
        ${data.status === "missing" ? "border-red-500/30" : ""}
      `}
      onClick={onUpload}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`
            p-3 rounded-xl
            ${data.status === "complete" ? "bg-emerald-500/10" : 
              data.status === "partial" ? "bg-yellow-500/10" : "bg-red-500/10"}
          `}>
            <Icon className={`
              h-6 w-6
              ${data.status === "complete" ? "text-emerald-600" : 
                data.status === "partial" ? "text-yellow-600" : "text-red-600"}
            `} />
          </div>
          <StatusBadge status={data.status} />
        </div>
        
        <h3 className="font-semibold text-lg mb-1">{data.label}</h3>
        <p className="text-sm text-muted-foreground mb-4">{data.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            {data.count}
            <span className="text-sm font-normal text-muted-foreground ml-1">Einträge</span>
          </span>
          
          <Button 
            variant={data.status === "missing" ? "default" : "outline"} 
            size="sm"
            className="gap-1"
          >
            {data.status === "missing" ? "Jetzt hochladen" : "Aktualisieren"}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DataHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DataCategory>("hardware");
  const [showSmartImporter, setShowSmartImporter] = useState(false);
  
  const { hardware, isLoading: hardwareLoading, hasData: hasHardware } = useTenantHardware();
  const { provisions, isLoading: provisionsLoading, hasData: hasProvisions } = useTenantProvisions();
  
  const isLoading = hardwareLoading || provisionsLoading;
  
  // Derive status for each category
  const dataStatuses: DataStatus[] = [
    {
      category: "hardware",
      label: "Hardware-Preise",
      description: "EK-Preise für Smartphones, Tablets, Zubehör",
      icon: HardDrive,
      count: hardware.length,
      status: hardware.length === 0 ? "missing" : hardware.length < 10 ? "partial" : "complete",
    },
    {
      category: "provisions",
      label: "Provisionen",
      description: "Tarif-Provisionen für Neu- und VVL-Verträge",
      icon: Receipt,
      count: provisions.length,
      status: provisions.length === 0 ? "missing" : provisions.length < 5 ? "partial" : "complete",
    },
    {
      category: "promos",
      label: "Aktionen & Rabatte",
      description: "Laufende Aktionen und Sonderrabatte",
      icon: Tags,
      count: 0, // TODO: Connect to promos data
      status: "partial", // TODO: Dynamic status
    },
  ];
  
  // Calculate overall status
  const overallStatus = dataStatuses.every(d => d.status === "complete") 
    ? "complete" 
    : dataStatuses.some(d => d.status === "missing") 
      ? "missing" 
      : "partial";

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 mb-2 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zum Dashboard
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              Meine Daten
            </h1>
            <p className="text-muted-foreground mt-1">
              Verwalte Hardware-Preise, Provisionen und Aktionen für deinen Kalkulator
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => setShowSmartImporter(true)}
          >
            <Sparkles className="h-4 w-4" />
            KI-Import
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 ml-1 opacity-70" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Lade einfach deine Datei hoch - die KI erkennt automatisch, 
                  welche Daten enthalten sind und wie sie importiert werden sollen.
                </p>
              </TooltipContent>
            </Tooltip>
          </Button>
        </div>

        {/* Overall Status Alert */}
        {overallStatus === "missing" && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              <strong>Wichtig:</strong> Bevor du den Kalkulator nutzen kannst, 
              musst du deine Daten hochladen. Klicke auf einen Bereich unten, um zu starten.
            </AlertDescription>
          </Alert>
        )}

        {overallStatus === "complete" && (
          <Alert className="bg-emerald-500/10 border-emerald-500/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-600">
              <strong>Alles bereit!</strong> Deine Daten sind vollständig. 
              Du kannst den Kalkulator jetzt mit deinen eigenen Werten nutzen.
            </AlertDescription>
          </Alert>
        )}

        {/* Data Status Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {dataStatuses.map((status) => (
            <DataStatusCard
              key={status.category}
              data={status}
              isActive={activeTab === status.category}
              onUpload={() => setActiveTab(status.category)}
            />
          ))}
        </div>

        {/* Detail Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DataCategory)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="hardware" className="gap-2">
              <HardDrive className="h-4 w-4" />
              Hardware
            </TabsTrigger>
            <TabsTrigger value="provisions" className="gap-2">
              <Receipt className="h-4 w-4" />
              Provisionen
            </TabsTrigger>
            <TabsTrigger value="promos" className="gap-2">
              <Tags className="h-4 w-4" />
              Aktionen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hardware" className="mt-6">
            <TenantHardwareManager />
          </TabsContent>

          <TabsContent value="provisions" className="mt-6">
            <TenantProvisionManager />
          </TabsContent>

          <TabsContent value="promos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Aktionen & Rabatte</CardTitle>
                <CardDescription>
                  Verwalte laufende Aktionen und Sonderrabatte für deine Tarife
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Die Aktionsverwaltung wird bald verfügbar sein. 
                    Aktuell werden die Standard-Aktionen aus dem System verwendet.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Smart Importer Modal */}
        <SmartImporter 
          open={showSmartImporter} 
          onOpenChange={setShowSmartImporter}
        />
      </div>
    </MainLayout>
  );
}
