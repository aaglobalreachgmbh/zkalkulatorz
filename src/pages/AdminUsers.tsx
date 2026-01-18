import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, Clock, UserCheck, UserX, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  is_approved: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, is_approved, approved_at, approved_by, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_approved: approve,
          approved_at: approve ? new Date().toISOString() : null,
          approved_by: approve ? user?.id : null,
        })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(approve ? "Benutzer freigeschaltet" : "Benutzer deaktiviert");
    },
    onError: (error) => {
      console.error("Approval error:", error);
      toast.error("Fehler bei der Benutzeraktualisierung");
    },
  });

  const pendingUsers = users?.filter((u) => !u.is_approved) ?? [];
  const approvedUsers = users?.filter((u) => u.is_approved) ?? [];

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd.MM.yyyy HH:mm", { locale: de });
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
          <p className="text-muted-foreground">
            Verwalte Benutzerfreischaltungen und Zugriffsrechte
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wartend</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingUsers.length}</div>
              <p className="text-xs text-muted-foreground">
                Benutzer warten auf Freischaltung
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Freigeschaltet</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedUsers.length}</div>
              <p className="text-xs text-muted-foreground">
                Aktive Benutzer
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Registrierte Benutzer
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Benutzer</CardTitle>
            <CardDescription>
              Freischaltung und Deaktivierung von Benutzerkonten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Wartend ({pendingUsers.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Freigeschaltet ({approvedUsers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine wartenden Benutzer
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Registriert am</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            {u.display_name || "-"}
                          </TableCell>
                          <TableCell>{u.email || "-"}</TableCell>
                          <TableCell>{formatDate(u.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" />
                              Wartend
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() =>
                                approveMutation.mutate({ userId: u.id, approve: true })
                              }
                              disabled={approveMutation.isPending}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Freischalten
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="approved">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : approvedUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine freigeschalteten Benutzer
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Freigeschaltet am</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            {u.display_name || "-"}
                          </TableCell>
                          <TableCell>{u.email || "-"}</TableCell>
                          <TableCell>{formatDate(u.approved_at)}</TableCell>
                          <TableCell>
                            <Badge variant="default">
                              <Check className="mr-1 h-3 w-3" />
                              Aktiv
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                approveMutation.mutate({ userId: u.id, approve: false })
                              }
                              disabled={approveMutation.isPending || u.id === user?.id}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Deaktivieren
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
