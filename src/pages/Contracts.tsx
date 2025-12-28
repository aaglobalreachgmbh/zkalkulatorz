import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import {
  useAllContracts,
  getVVLUrgency,
  getVVLUrgencyConfig,
  getRemainingDays,
  NETZ_CONFIG,
  type VVLUrgency,
  type ContractWithCustomer,
} from "@/margenkalkulator/hooks/useCustomerContracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Phone,
  Building2,
  Calendar,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Clock,
  CalendarDays,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Contracts() {
  const navigate = useNavigate();
  const { data: contracts = [], isLoading } = useAllContracts();
  const [netzFilter, setNetzFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("aktiv");

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (netzFilter !== "all" && c.netz !== netzFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    });
  }, [contracts, netzFilter, statusFilter]);

  // Group by urgency
  const groupedContracts = useMemo(() => {
    const groups: Record<VVLUrgency, ContractWithCustomer[]> = {
      critical: [],
      warning: [],
      ok: [],
      future: [],
      none: [],
    };

    filteredContracts.forEach((contract) => {
      const urgency = getVVLUrgency(contract.vvl_datum);
      groups[urgency].push(contract);
    });

    return groups;
  }, [filteredContracts]);

  // Counts
  const counts = useMemo(() => ({
    critical: groupedContracts.critical.length,
    warning: groupedContracts.warning.length,
    ok: groupedContracts.ok.length,
    total: filteredContracts.length,
  }), [groupedContracts, filteredContracts]);

  const renderContract = (contract: ContractWithCustomer) => {
    const urgency = getVVLUrgency(contract.vvl_datum);
    const urgencyConfig = getVVLUrgencyConfig(urgency);
    const remainingDays = getRemainingDays(contract.vvl_datum);
    const netzConfig = NETZ_CONFIG[contract.netz as keyof typeof NETZ_CONFIG] || NETZ_CONFIG.vodafone;

    return (
      <Card
        key={contract.id}
        className="hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => navigate(`/customers/${contract.customer_id}`)}
      >
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Urgency Indicator */}
              <div className={`w-2 h-2 rounded-full ${urgencyConfig.dotColor}`} />
              
              {/* Netz Badge */}
              <Badge variant="outline" className={`text-xs ${netzConfig.textColor}`}>
                {netzConfig.label}
              </Badge>

              {/* Customer Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{contract.customer?.company_name || "Unbekannt"}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {contract.handy_nr && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contract.handy_nr}
                    </span>
                  )}
                  {contract.tarif_name && (
                    <span>{contract.tarif_name}</span>
                  )}
                </div>
              </div>
            </div>

            {/* VVL Date & Status */}
            <div className="flex items-center gap-4">
              {contract.vvl_datum && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    VVL: {format(new Date(contract.vvl_datum), "dd.MM.yyyy")}
                  </div>
                  {remainingDays !== null && (
                    <Badge className={`mt-1 text-xs ${urgencyConfig.color}`}>
                      {remainingDays <= 0 
                        ? `${Math.abs(remainingDays)} Tage überfällig`
                        : `in ${remainingDays} Tagen`
                      }
                    </Badge>
                  )}
                </div>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGroup = (urgency: VVLUrgency, title: string, icon: React.ReactNode) => {
    const contracts = groupedContracts[urgency];
    if (contracts.length === 0) return null;

    const config = getVVLUrgencyConfig(urgency);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-medium">{title}</h3>
          <Badge variant="secondary">{contracts.length}</Badge>
        </div>
        <div className="space-y-2">
          {contracts.map(renderContract)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">VVL-Übersicht</h1>
              <p className="text-sm text-muted-foreground">
                Vertragsverlängerungen im Blick
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dringend (&lt;30d)</p>
                  <p className="text-2xl font-bold text-red-600">{counts.critical}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bald (30-60d)</p>
                  <p className="text-2xl font-bold text-amber-600">{counts.warning}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vormerken (60-90d)</p>
                  <p className="text-2xl font-bold text-green-600">{counts.ok}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt</p>
                  <p className="text-2xl font-bold">{counts.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={netzFilter} onValueChange={setNetzFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Netz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Netze</SelectItem>
                  <SelectItem value="vodafone">Vodafone</SelectItem>
                  <SelectItem value="o2">O2</SelectItem>
                  <SelectItem value="telekom">Telekom</SelectItem>
                  <SelectItem value="freenet">Freenet</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="aktiv">Aktiv</SelectItem>
                  <SelectItem value="gekuendigt">Gekündigt</SelectItem>
                  <SelectItem value="verlaengert">Verlängert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contract Groups */}
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-medium mb-1">Keine Verträge gefunden</h3>
              <p className="text-sm text-muted-foreground">
                Verträge können in der Kundenansicht hinzugefügt werden.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/customers")}>
                Zur Kundenliste
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {renderGroup('critical', 'Dringend – < 30 Tage', <AlertTriangle className="h-5 w-5 text-red-500" />)}
            {renderGroup('warning', 'Bald – 30-60 Tage', <Clock className="h-5 w-5 text-amber-500" />)}
            {renderGroup('ok', 'Vormerken – 60-90 Tage', <CalendarDays className="h-5 w-5 text-green-500" />)}
            {renderGroup('future', 'Später – > 90 Tage', <Calendar className="h-5 w-5 text-muted-foreground" />)}
            {renderGroup('none', 'Ohne VVL-Datum', <Calendar className="h-5 w-5 text-muted-foreground" />)}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
