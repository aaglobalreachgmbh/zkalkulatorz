import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useReporting, TimeRange } from "@/margenkalkulator/hooks/useReporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, TrendingUp, Target, Euro } from "lucide-react";
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

const COLORS = {
  positive: "hsl(142 76% 36%)",
  neutral: "hsl(45 93% 47%)",
  negative: "hsl(0 84% 60%)",
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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reporting</h1>
            <p className="text-muted-foreground">Statistiken und Analysen Ihrer Angebote</p>
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
          </div>
        </div>

        {/* KPI Cards */}
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Top-Tarif</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{stats?.topTariff?.name || "-"}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.topTariff ? `${stats.topTariff.percentage}% der Angebote` : "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Umsatz (24M)</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalRevenue !== undefined
                  ? `${(stats.totalRevenue / 1000).toFixed(1)}k €`
                  : "-"}
              </div>
              <p className="text-xs text-muted-foreground">Summe über Laufzeit</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
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
                    formatter={(value: number, name: string) => [`${value} Angebote`, "Anzahl"]}
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
      </div>
    </MainLayout>
  );
}
