import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useReporting, TimeRange } from "@/margenkalkulator/hooks/useReporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, FileText, TrendingUp, Target, Euro, Calendar, AlertTriangle, Package, Receipt, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { VVLExportDialog } from "@/margenkalkulator/ui/components/VVLExportDialog";
import { ProvisionForecastDialog } from "@/margenkalkulator/ui/components/ProvisionForecastDialog";

const COLORS = {
  positive: "hsl(142 76% 36%)",
  neutral: "hsl(45 93% 47%)",
  negative: "hsl(0 84% 60%)",
};

const VVL_COLORS = {
  critical: "hsl(0 84% 60%)",
  warning: "hsl(45 93% 47%)",
  ok: "hsl(142 76% 36%)",
  upcoming: "hsl(220 70% 50%)",
};

const HARDWARE_COLORS = [
  "hsl(0 85% 45%)",
  "hsl(220 70% 50%)",
  "hsl(142 70% 45%)",
  "hsl(45 90% 50%)",
  "hsl(280 70% 50%)",
];

export default function Reporting() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const { data: stats, isLoading, error } = useReporting(timeRange);
  const [showVVLExport, setShowVVLExport] = useState(false);
  const [showProvisionExport, setShowProvisionExport] = useState(false);

  const timeRangeLabels: Record<TimeRange, string> = {
    week: "Diese Woche",
    month: "Dieser Monat",
    quarter: "Letztes Quartal",
  };

  const marginLabels: Record<string, string> = {
    positive: "Positiv (>50€)",
    neutral: "Neutral (0-50€)",
    negative: "Negativ (<0€)",
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Fehler beim Laden der Daten</p>
        </div>
      </MainLayout>
    );
  }

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}k €`;
    }
    return `${value.toFixed(0)} €`;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reporting</h1>
            <p className="text-muted-foreground">Statistiken und Analysen</p>
          </div>
          <div className="flex gap-2">
            {(["week", "month", "quarter"] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {timeRangeLabels[range]}
              </Button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowVVLExport(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  VVL-Liste
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowProvisionExport(true)}>
                  <Euro className="h-4 w-4 mr-2" />
                  Provisions-Prognose
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Export Dialogs */}
        <VVLExportDialog open={showVVLExport} onOpenChange={setShowVVLExport} />
        <ProvisionForecastDialog open={showProvisionExport} onOpenChange={setShowProvisionExport} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="offers">Angebote</TabsTrigger>
            <TabsTrigger value="contracts">Verträge</TabsTrigger>
          </TabsList>

          {/* === ÜBERSICHT TAB === */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards - Row 1: Angebote */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Angebote</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalOffers || 0}</div>
                  <p className="text-xs text-muted-foreground">{timeRangeLabels[timeRange]}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ø Marge</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.avgMargin !== undefined
                      ? `${stats.avgMargin >= 0 ? "+" : ""}${stats.avgMargin.toFixed(0)} €`
                      : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground">pro Angebot</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Offene VVLs</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.vvlStats.total || 0}</div>
                  <div className="flex gap-2 text-xs">
                    {(stats?.vvlStats.critical || 0) > 0 && (
                      <span className="text-destructive">🔴 {stats?.vvlStats.critical}</span>
                    )}
                    {(stats?.vvlStats.warning || 0) > 0 && (
                      <span className="text-yellow-600">🟡 {stats?.vvlStats.warning}</span>
                    )}
                    {(stats?.vvlStats.ok || 0) > 0 && (
                      <span className="text-green-600">🟢 {stats?.vvlStats.ok}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Umsatz (24M)</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalRevenue !== undefined ? formatCurrency(stats.totalRevenue) : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground">Summe über Laufzeit</p>
                </CardContent>
              </Card>
            </div>

            {/* KPI Cards - Row 2: Verträge */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Verträge</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalContracts || 0}</div>
                  <p className="text-xs text-muted-foreground">Aktive Verträge</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Provision Σ</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats?.totalProvision || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">{timeRangeLabels[timeRange]}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Hardware-EK Σ</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.ekVsProvision.totalEk || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">{timeRangeLabels[timeRange]}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">EK vs. Provision</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(stats?.ekVsProvision.difference || 0) >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {(stats?.ekVsProvision.difference || 0) >= 0 ? "+" : ""}
                    {formatCurrency(stats?.ekVsProvision.difference || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Differenz</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top-Tarif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Target className="h-12 w-12 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{stats?.topTariff?.name || "-"}</div>
                      <p className="text-muted-foreground">
                        {stats?.topTariff ? `${stats.topTariff.percentage}% der Angebote (${stats.topTariff.count}x)` : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>VVL-Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1 text-center p-3 rounded-lg bg-destructive/10">
                      <div className="text-2xl font-bold text-destructive">{stats?.vvlStats.critical || 0}</div>
                      <p className="text-xs text-muted-foreground">{"< 30 Tage"}</p>
                    </div>
                    <div className="flex-1 text-center p-3 rounded-lg bg-yellow-500/10">
                      <div className="text-2xl font-bold text-yellow-600">{stats?.vvlStats.warning || 0}</div>
                      <p className="text-xs text-muted-foreground">30-60 Tage</p>
                    </div>
                    <div className="flex-1 text-center p-3 rounded-lg bg-green-500/10">
                      <div className="text-2xl font-bold text-green-600">{stats?.vvlStats.ok || 0}</div>
                      <p className="text-xs text-muted-foreground">60-90 Tage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === ANGEBOTE TAB === */}
          <TabsContent value="offers" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Offers Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Angebote über Zeit</CardTitle>
                </CardHeader>
                <CardContent>
                  {(stats?.offersOverTime?.length || 0) > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats!.offersOverTime}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Angebote" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Keine Daten für diesen Zeitraum
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Margin Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Margen-Verteilung</CardTitle>
                </CardHeader>
                <CardContent>
                  {(stats?.marginDistribution?.some((d) => d.count > 0)) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={stats!.marginDistribution.filter((d) => d.count > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="category"
                          label={({ category, percentage }) => `${marginLabels[category]}: ${percentage}%`}
                          labelLine={false}
                        >
                          {stats!.marginDistribution.map((entry) => (
                            <Cell key={entry.category} fill={COLORS[entry.category]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number, name: string) => [
                            `${value} Angebote`,
                            marginLabels[name] || name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Keine Daten für diesen Zeitraum
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Hardware Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Hardware-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.hardwareDistribution?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats!.hardwareDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                        formatter={(value: number) => [`${value} Angebote`, "Anzahl"]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Angebote">
                        {stats!.hardwareDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={HARDWARE_COLORS[index % HARDWARE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Keine Daten für diesen Zeitraum
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === VERTRÄGE TAB === */}
          <TabsContent value="contracts" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* VVLs nach Team */}
              <Card>
                <CardHeader>
                  <CardTitle>VVLs nach Team</CardTitle>
                </CardHeader>
                <CardContent>
                  {(stats?.vvlsByTeam?.length || 0) > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats!.vvlsByTeam} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="teamName"
                          width={100}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number, name: string) => [
                            `${value} VVLs`,
                            name === "critical" ? "Kritisch" : "Gesamt",
                          ]}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Gesamt" />
                        <Bar dataKey="critical" fill={VVL_COLORS.critical} radius={[0, 4, 4, 0]} name="Kritisch" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Keine VVL-Daten vorhanden
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Provision pro Monat */}
              <Card>
                <CardHeader>
                  <CardTitle>Provision pro Monat</CardTitle>
                </CardHeader>
                <CardContent>
                  {(stats?.provisionByMonth?.some((d) => d.amount > 0)) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats!.provisionByMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number) => [`${value.toFixed(0)} €`, "Provision"]}
                        />
                        <Bar dataKey="amount" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} name="Provision" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Keine Provisions-Daten für diesen Zeitraum
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* EK vs Provision */}
            <Card>
              <CardHeader>
                <CardTitle>Hardware-EK vs. Provision</CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.ekVsProvision?.byMonth?.some((d) => d.ek > 0 || d.provision > 0)) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats!.ekVsProvision.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(0)} €`,
                          name === "ek" ? "Hardware-EK" : name === "provision" ? "Provision" : "Differenz",
                        ]}
                      />
                      <Legend 
                        formatter={(value) => 
                          value === "ek" ? "Hardware-EK" : value === "provision" ? "Provision" : value
                        }
                      />
                      <Bar dataKey="ek" fill="hsl(0 85% 45%)" radius={[4, 4, 0, 0]} name="ek" />
                      <Bar dataKey="provision" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} name="provision" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Keine Vertrags-Daten für diesen Zeitraum
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
