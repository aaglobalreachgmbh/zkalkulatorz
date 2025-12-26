/**
 * GDPR Dashboard - Admin Page
 * 
 * Zeigt Löschungsprotokolle und ermöglicht manuelle Löschanfragen
 * Nur für Admins zugänglich
 */

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Trash2, 
  Shield, 
  FileText, 
  Search, 
  RefreshCw,
  UserX,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import type { Json } from "@/integrations/supabase/types";

interface DeletionLog {
  id: string;
  user_id: string;
  email_hash: string | null;
  deletion_reason: string;
  deleted_tables: Json;
  deleted_at: string;
  deletion_requested_by: string;
}

interface InactiveUser {
  id: string;
  email: string | null;
  display_name: string | null;
  last_activity_at: string | null;
  created_at: string;
}

export default function GDPRDashboard() {
  const [deletionLogs, setDeletionLogs] = useState<DeletionLog[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch deletion logs
  const fetchDeletionLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("gdpr_deletion_log")
        .select("*")
        .order("deleted_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setDeletionLogs(data || []);
    } catch (error) {
      console.error("Error fetching deletion logs:", error);
      toast({
        title: "Fehler",
        description: "Konnte Löschprotokolle nicht laden",
        variant: "destructive",
      });
    }
  };

  // Fetch inactive users (last activity > 18 months - warning zone)
  const fetchInactiveUsers = async () => {
    try {
      const eighteenMonthsAgo = new Date();
      eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, last_activity_at, created_at")
        .lt("last_activity_at", eighteenMonthsAgo.toISOString())
        .order("last_activity_at", { ascending: true })
        .limit(50);

      if (error) throw error;
      setInactiveUsers(data || []);
    } catch (error) {
      console.error("Error fetching inactive users:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDeletionLogs(), fetchInactiveUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Manual user deletion
  const handleManualDeletion = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      // Call the gdpr-cleanup function with specific user
      const { error } = await supabase.functions.invoke("gdpr-cleanup", {
        body: { manual_user_id: userId, requested_by: "admin_manual" },
      });

      if (error) throw error;

      toast({
        title: "Löschung angefordert",
        description: "Die Benutzerdaten werden gelöscht.",
      });

      // Refresh data
      await Promise.all([fetchDeletionLogs(), fetchInactiveUsers()]);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Fehler",
        description: "Konnte Benutzer nicht löschen",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  // Filter logs by search term
  const filteredLogs = deletionLogs.filter(
    (log) =>
      log.email_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.deletion_reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    totalDeletions: deletionLogs.length,
    automaticDeletions: deletionLogs.filter(
      (log) => log.deletion_requested_by === "system_auto"
    ).length,
    manualDeletions: deletionLogs.filter(
      (log) => log.deletion_requested_by !== "system_auto"
    ).length,
    inactiveUsersAtRisk: inactiveUsers.length,
  };

  // Export logs as CSV
  const exportLogs = () => {
    const csvContent = [
      ["ID", "User ID", "Email Hash", "Grund", "Gelöschte Tabellen", "Gelöscht am", "Angefordert von"],
      ...deletionLogs.map((log) => [
        log.id,
        log.user_id,
        log.email_hash || "-",
        log.deletion_reason,
        JSON.stringify(log.deleted_tables),
        log.deleted_at,
        log.deletion_requested_by,
      ]),
    ]
      .map((row) => row.join(";"))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `gdpr-deletion-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/security/status">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                DSGVO Dashboard
              </h1>
              <p className="text-muted-foreground">
                Datenlöschung und Compliance-Übersicht
              </p>
            </div>
          </div>
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt gelöscht</p>
                  <p className="text-2xl font-bold">{stats.totalDeletions}</p>
                </div>
                <Trash2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Automatisch</p>
                  <p className="text-2xl font-bold">{stats.automaticDeletions}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Manuell</p>
                  <p className="text-2xl font-bold">{stats.manualDeletions}</p>
                </div>
                <UserX className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className={stats.inactiveUsersAtRisk > 0 ? "border-yellow-500" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bald inaktiv</p>
                  <p className="text-2xl font-bold">{stats.inactiveUsersAtRisk}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Löschprotokolle
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Inaktive Benutzer
              {stats.inactiveUsersAtRisk > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stats.inactiveUsersAtRisk}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Manuelle Löschung
            </TabsTrigger>
          </TabsList>

          {/* Deletion Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Löschprotokolle</CardTitle>
                    <CardDescription>
                      Alle durchgeführten Datenlöschungen gemäß DSGVO Art. 17
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setLoading(true);
                        fetchDeletionLogs().finally(() => setLoading(false));
                      }}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Keine Löschprotokolle vorhanden</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>E-Mail (Hash)</TableHead>
                        <TableHead>Grund</TableHead>
                        <TableHead>Gelöschte Tabellen</TableHead>
                        <TableHead>Angefordert von</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(log.deleted_at), "dd.MM.yyyy HH:mm", {
                              locale: de,
                            })}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.email_hash || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.deletion_reason === "inactivity_2_years"
                                ? "2 Jahre inaktiv"
                                : log.deletion_reason === "user_request"
                                ? "Nutzeranfrage"
                                : log.deletion_reason}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(log.deleted_tables) ? (
                                (log.deleted_tables as string[]).slice(0, 3).map((table) => (
                                  <Badge key={table} variant="secondary" className="text-xs">
                                    {table}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  -
                                </Badge>
                              )}
                              {Array.isArray(log.deleted_tables) &&
                                (log.deleted_tables as string[]).length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{(log.deleted_tables as string[]).length - 3}
                                  </Badge>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.deletion_requested_by === "system_auto"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {log.deletion_requested_by === "system_auto"
                                ? "Automatisch"
                                : "Manuell"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inactive Users Tab */}
          <TabsContent value="inactive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Benutzer im Warnbereich
                </CardTitle>
                <CardDescription>
                  Benutzer die seit 18+ Monaten inaktiv sind. Automatische Löschung nach 24 Monaten.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inactiveUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Keine Benutzer im Warnbereich</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Benutzer</TableHead>
                        <TableHead>Letzte Aktivität</TableHead>
                        <TableHead>Registriert seit</TableHead>
                        <TableHead>Tage bis Löschung</TableHead>
                        <TableHead>Aktion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactiveUsers.map((user) => {
                        const lastActivity = user.last_activity_at
                          ? new Date(user.last_activity_at)
                          : new Date(user.created_at);
                        const twoYearsFromActivity = new Date(lastActivity);
                        twoYearsFromActivity.setFullYear(
                          twoYearsFromActivity.getFullYear() + 2
                        );
                        const daysUntilDeletion = Math.max(
                          0,
                          Math.ceil(
                            (twoYearsFromActivity.getTime() - Date.now()) /
                              (1000 * 60 * 60 * 24)
                          )
                        );

                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {user.display_name || "Unbekannt"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {user.email || user.id.slice(0, 8)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.last_activity_at
                                ? format(new Date(user.last_activity_at), "dd.MM.yyyy", {
                                    locale: de,
                                  })
                                : "Nie"}
                            </TableCell>
                            <TableCell>
                              {format(new Date(user.created_at), "dd.MM.yyyy", {
                                locale: de,
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  daysUntilDeletion < 90
                                    ? "destructive"
                                    : daysUntilDeletion < 180
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {daysUntilDeletion} Tage
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Jetzt löschen
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Benutzer unwiderruflich löschen?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Alle Daten von{" "}
                                      <strong>{user.display_name || user.email}</strong>{" "}
                                      werden permanent gelöscht. Diese Aktion kann nicht
                                      rückgängig gemacht werden.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleManualDeletion(user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {deletingUserId === user.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                      ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                      )}
                                      Endgültig löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Deletion Tab */}
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Manuelle Löschanfrage</CardTitle>
                <CardDescription>
                  Bearbeitung von DSGVO Art. 17 Löschanfragen ("Recht auf Vergessenwerden")
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Wichtiger Hinweis
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        Löschanfragen müssen innerhalb von 30 Tagen bearbeitet werden 
                        (DSGVO Art. 12). Dokumentieren Sie die Anfrage und den Löschgrund.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Benutzer-E-Mail oder ID</Label>
                    <Input
                      id="user-email"
                      placeholder="max@example.com oder UUID"
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deletion-reason">Löschgrund</Label>
                    <Input
                      id="deletion-reason"
                      placeholder="z.B. Nutzeranfrage vom 26.12.2025"
                      type="text"
                    />
                  </div>
                  <Button className="w-full" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschanfrage bearbeiten
                  </Button>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h4 className="font-medium mb-4">Checkliste für Löschanfragen</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Identität des Anfragenden verifizieren
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Anfrage dokumentieren (Datum, Kanal)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Prüfen auf gesetzliche Aufbewahrungspflichten
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Löschung durchführen und protokollieren
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Bestätigung an den Anfragenden senden
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
