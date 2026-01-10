// ============================================
// Super-Admin Dashboard
// Zentrale Verwaltung für allenetze.de Betreiber
// Umbenannt von AdminCustomers für bessere Klarheit
// ============================================

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Building2,
  Users,
  Key,
  MoreHorizontal,
  Search,
  Filter,
  Check,
  X,
  Pause,
  Play,
  Mail,
  Globe,
  Loader2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useTenants, TenantWithLicense } from "@/margenkalkulator/hooks/useTenants";
import { CreateTenantModal } from "@/margenkalkulator/ui/components/CreateTenantModal";

const statusConfig = {
  active: { label: "Aktiv", color: "bg-emerald-500", icon: Check },
  suspended: { label: "Pausiert", color: "bg-amber-500", icon: Pause },
  cancelled: { label: "Gekündigt", color: "bg-destructive", icon: X },
  trial: { label: "Trial", color: "bg-blue-500", icon: Play },
};

const planConfig: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "bg-slate-500" },
  professional: { label: "Professional", color: "bg-blue-500" },
  enterprise: { label: "Enterprise", color: "bg-purple-500" },
  internal: { label: "Internal", color: "bg-primary" },
};

export default function SuperAdmin() {
  const { tenants, isLoading, error, updateStatus, updateLicense } = useTenants();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.company_name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.contact_email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    totalSeats: tenants.reduce((sum, t) => sum + (t.license?.seat_limit || 0), 0),
    usedSeats: tenants.reduce((sum, t) => sum + (t.license?.seats_used || 0), 0),
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Super-Admin</h1>
              <p className="text-sm text-muted-foreground">
                Zentrale Verwaltung aller Shops
              </p>
            </div>
          </div>
          <div className="flex-1" />
          <CreateTenantModal />
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Info Banner */}
          <Alert className="bg-primary/5 border-primary/20">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              <strong>Super-Admin Bereich:</strong> Hier verwalten Sie alle angeschlossenen Partner-Shops. 
              Nur Benutzer mit der Rolle "admin" haben Zugriff auf diesen Bereich.
            </AlertDescription>
          </Alert>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Gesamt Shops</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {stats.active} aktiv
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Aktive Shops</CardDescription>
                <CardTitle className="text-3xl text-emerald-500">{stats.active}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(stats.active / Math.max(stats.total, 1)) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Gesamte Lizenzen</CardDescription>
                <CardTitle className="text-3xl">{stats.totalSeats}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {stats.usedSeats} genutzt ({stats.totalSeats > 0 ? Math.round((stats.usedSeats / stats.totalSeats) * 100) : 0}%)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Verfügbare Lizenzen</CardDescription>
                <CardTitle className="text-3xl text-emerald-500">
                  {stats.totalSeats - stats.usedSeats}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={stats.totalSeats > 0 ? ((stats.totalSeats - stats.usedSeats) / stats.totalSeats) * 100 : 0} 
                  className="h-2" 
                />
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Shop oder E-Mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Pausiert</SelectItem>
                <SelectItem value="cancelled">Gekündigt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Fehler beim Laden der Shops: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Lizenzen</TableHead>
                      <TableHead>Domains</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {search || statusFilter !== "all"
                            ? "Keine Shops gefunden"
                            : "Noch keine Shops angelegt. Klicken Sie auf 'Neuen Kunden anlegen' um zu starten."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTenants.map((tenant) => (
                        <TenantRow
                          key={tenant.id}
                          tenant={tenant}
                          onUpdateStatus={updateStatus}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Separate row component for better performance
function TenantRow({
  tenant,
  onUpdateStatus,
}: {
  tenant: TenantWithLicense;
  onUpdateStatus: (params: { tenantId: string; status: TenantWithLicense["status"] }) => void;
}) {
  const status = statusConfig[tenant.status];
  const plan = planConfig[tenant.license?.plan || "starter"];
  const seatUsage = tenant.license
    ? (tenant.license.seats_used / tenant.license.seat_limit) * 100
    : 0;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{tenant.company_name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {tenant.contact_email}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="secondary" className={`${status.color} text-white gap-1`}>
          <status.icon className="h-3 w-3" />
          {status.label}
        </Badge>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className="gap-1">
          <Key className="h-3 w-3" />
          {plan.label}
        </Badge>
      </TableCell>

      <TableCell>
        {tenant.license ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className={seatUsage >= 90 ? "text-destructive font-medium" : ""}>
                {tenant.license.seats_used} / {tenant.license.seat_limit}
              </span>
            </div>
            <Progress value={seatUsage} className="h-1.5 w-20" />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Keine Lizenz</span>
        )}
      </TableCell>

      <TableCell>
        {tenant.allowed_domains && tenant.allowed_domains.length > 0 ? (
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{tenant.allowed_domains.length}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(tenant.created_at), "dd.MM.yyyy", { locale: de })}
        </span>
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {tenant.status !== "active" && (
              <DropdownMenuItem
                onClick={() => onUpdateStatus({ tenantId: tenant.id, status: "active" })}
              >
                <Play className="h-4 w-4 mr-2" />
                Aktivieren
              </DropdownMenuItem>
            )}
            
            {tenant.status === "active" && (
              <DropdownMenuItem
                onClick={() => onUpdateStatus({ tenantId: tenant.id, status: "suspended" })}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausieren
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => onUpdateStatus({ tenantId: tenant.id, status: "cancelled" })}
              className="text-destructive focus:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Kündigen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
