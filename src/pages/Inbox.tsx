// ============================================
// Inbox Page - Email Integration with Gmail and IONOS
// ============================================

import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDeniedCard } from "@/components/AccessDeniedCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Inbox as InboxIcon,
  Mail,
  Plus,
  RefreshCw,
  Star,
  StarOff,
  Search,
  Filter,
  Users,
  Link2,
  ExternalLink,
  Settings,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import { useEmailAccounts } from "@/margenkalkulator/hooks/useEmailAccounts";
import { useSyncedEmails } from "@/margenkalkulator/hooks/useSyncedEmails";
import { useEmployeeAssignments } from "@/margenkalkulator/hooks/useEmployeeAssignments";
import { useIdentity } from "@/contexts/IdentityContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Import branded icons
import { GmailIcon, IonosIcon } from "@/margenkalkulator/ui/components/icons/IntegrationIcons";
import { IntegrationPromptCard } from "@/margenkalkulator/ui/components/IntegrationPromptCard";

function formatEmailDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Gestern";
  return format(date, "dd.MM.yy", { locale: de });
}

export default function InboxPage() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { accounts, isLoading: accountsLoading, disconnect } = useEmailAccounts();
  const { emails, isLoading: emailsLoading, refetch: refetchEmails } = useSyncedEmails();
  const { supervisedEmployeeIds } = useEmployeeAssignments();
  const { canUseInbox, hasFullAccess, isLoading: permissionsLoading } = usePermissions();

  // All hooks must be called unconditionally before any early returns
  const [activeTab, setActiveTab] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectProvider, setConnectProvider] = useState<"gmail" | "ionos" | null>(null);
  const [ionosCredentials, setIonosCredentials] = useState({ email: "", password: "" });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const isAdmin = identity?.role === "admin" || identity?.role === "tenant_admin";
  const isTeamLead = identity?.role === "manager" || supervisedEmployeeIds.length > 0;

  // Berechtigungsprüfung (after all hooks)
  if (!permissionsLoading && !hasFullAccess && !canUseInbox) {
    return (
      <MainLayout>
        <AccessDeniedCard
          title="Kein Zugriff auf Posteingang"
          description="Sie haben keine Berechtigung, den Posteingang zu nutzen. Kontaktieren Sie Ihren Shop-Administrator."
        />
      </MainLayout>
    );
  }

  // Filter emails based on active tab and search
  const filteredEmails = emails.filter(email => {
    const matchesSearch = !searchQuery ||
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "inbox" ||
      (activeTab === "unread" && !email.is_read) ||
      (activeTab === "starred" && email.is_starred) ||
      (activeTab === "linked" && email.customer_id);

    return matchesSearch && matchesTab;
  });

  const unreadCount = emails.filter(e => !e.is_read).length;

  // Gmail OAuth connect
  const handleGmailConnect = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht authentifiziert");

      const response = await supabase.functions.invoke("gmail-oauth", {
        body: {
          action: "get_auth_url",
          redirectUri: `${window.location.origin}/inbox`,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else if (response.data?.error) {
        toast.error(response.data.message || "Gmail OAuth nicht konfiguriert");
      }
    } catch (error) {
      console.error("Gmail connect error:", error);
      toast.error("Gmail-Verbindung fehlgeschlagen");
    } finally {
      setIsConnecting(false);
    }
  };

  // IONOS connect
  const handleIonosConnect = async () => {
    if (!ionosCredentials.email || !ionosCredentials.password) {
      toast.error("Bitte E-Mail und Passwort eingeben");
      return;
    }

    setIsConnecting(true);
    try {
      const response = await supabase.functions.invoke("ionos-connect", {
        body: {
          action: "save_credentials",
          email: ionosCredentials.email,
          password: ionosCredentials.password,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.success) {
        toast.success("IONOS-Konto erfolgreich verbunden");
        setShowConnectDialog(false);
        setConnectProvider(null);
        setIonosCredentials({ email: "", password: "" });
      } else {
        toast.error(response.data?.error || "Verbindung fehlgeschlagen");
      }
    } catch (error) {
      console.error("IONOS connect error:", error);
      toast.error("IONOS-Verbindung fehlgeschlagen");
    } finally {
      setIsConnecting(false);
    }
  };

  // Sync emails
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await supabase.functions.invoke("sync-emails", {
        body: {},
      });

      if (response.error) throw response.error;

      const results = response.data?.results || [];
      const synced = results.reduce((sum: number, r: any) => sum + (r.synced || 0), 0);

      if (synced > 0) {
        toast.success(`${synced} neue E-Mails synchronisiert`);
      } else {
        toast.info("Keine neuen E-Mails");
      }

      refetchEmails();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Synchronisation fehlgeschlagen");
    } finally {
      setIsSyncing(false);
    }
  };

  // Disconnect account
  const handleDisconnect = async (accountId: string) => {
    try {
      await disconnect(accountId);
      toast.success("Konto getrennt");
    } catch (error) {
      toast.error("Trennen fehlgeschlagen");
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <InboxIcon className="w-6 h-6" />
              Posteingang
            </h1>
            <p className="text-muted-foreground">
              E-Mail-Integration für Gmail und IONOS
            </p>
          </div>
          <div className="flex items-center gap-2">
            {accounts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                Synchronisieren
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowConnectDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Konto verbinden
            </Button>
          </div>
        </div>

        {/* Connected Accounts - Multiple accounts */}
        {accounts.length > 1 && (
          <div className="flex flex-wrap items-center gap-3">
            {accounts.map((account) => (
              <Card key={account.id} className="flex items-center gap-3 p-3 pr-4 border-success/30 bg-success/5">
                {account.provider === "gmail" ? (
                  <GmailIcon className="w-8 h-8" />
                ) : (
                  <IonosIcon className="w-8 h-8" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{account.email_address}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {account.sync_error ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-destructive" />
                        Fehler
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 text-success" />
                        Verbunden
                      </>
                    )}
                    {account.last_sync_at && (
                      <span className="ml-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatEmailDate(account.last_sync_at)}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDisconnect(account.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* No accounts connected - Show prominent integration prompts */}
        {accounts.length === 0 && !accountsLoading && (
          <Card className="border-dashed border-2">
            <CardContent className="py-10">
              <div className="text-center mb-6">
                <Mail className="w-14 h-14 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-xl font-semibold mb-2">E-Mail-Integration starten</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Verbinden Sie Ihre E-Mail-Konten, um Nachrichten direkt hier zu verwalten und mit Kunden zu verknüpfen.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                <IntegrationPromptCard
                  type="gmail"
                  onConnect={() => { setConnectProvider("gmail"); setShowConnectDialog(true); }}
                  variant="card"
                />
                <IntegrationPromptCard
                  type="ionos"
                  onConnect={() => { setConnectProvider("ionos"); setShowConnectDialog(true); }}
                  variant="card"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* One account connected - suggest adding another */}
        {accounts.length === 1 && !accountsLoading && (
          <div className="flex flex-wrap items-center gap-3">
            {accounts.map((account) => (
              <Card key={account.id} className="flex items-center gap-3 p-3 pr-4 border-success/30 bg-success/5">
                {account.provider === "gmail" ? (
                  <GmailIcon className="w-8 h-8" />
                ) : (
                  <IonosIcon className="w-8 h-8" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{account.email_address}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" />
                    Verbunden
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDisconnect(account.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}

            {/* Suggest adding another integration */}
            <IntegrationPromptCard
              type={accounts[0].provider === "gmail" ? "ionos" : "gmail"}
              onConnect={() => {
                setConnectProvider(accounts[0].provider === "gmail" ? "ionos" : "gmail");
                setShowConnectDialog(true);
              }}
              variant="dashed"
            />
          </div>
        )}

        {/* Email List */}
        {accounts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  E-Mails
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount} ungelesen
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Suchen..."
                      className="pl-9 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="inbox">Alle</TabsTrigger>
                  <TabsTrigger value="unread">Ungelesen</TabsTrigger>
                  <TabsTrigger value="starred">Markiert</TabsTrigger>
                  <TabsTrigger value="linked">Mit Kunde</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  {emailsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : filteredEmails.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <InboxIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Keine E-Mails gefunden</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredEmails.map((email) => (
                        <div
                          key={email.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent",
                            !email.is_read && "bg-primary/5 border-primary/10",
                            selectedEmail === email.id && "bg-muted"
                          )}
                          onClick={() => setSelectedEmail(email.id)}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            {email.is_starred ? (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            ) : (
                              <StarOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                "truncate",
                                !email.is_read && "font-semibold"
                              )}>
                                {email.sender_name || email.sender_email}
                              </p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatEmailDate(email.received_at)}
                              </span>
                            </div>
                            <p className={cn(
                              "text-sm truncate",
                              !email.is_read ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {email.subject}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {email.body_preview}
                            </p>
                          </div>

                          {email.customer_id && (
                            <Badge variant="outline" className="shrink-0">
                              <Link2 className="w-3 h-3 mr-1" />
                              Verknüpft
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Team Overview - Only for Team Leads and Admins */}
        {(isAdmin || isTeamLead) && accounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4" />
                Team-Übersicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {isAdmin
                  ? "Als Administrator können Sie alle E-Mails im Tenant einsehen."
                  : `Sie betreuen ${supervisedEmployeeIds.length} Mitarbeiter.`
                }
              </p>
              {/* TODO: Implement team email overview */}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Connect Account Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-Mail-Konto verbinden</DialogTitle>
            <DialogDescription>
              Wählen Sie einen Anbieter aus, um Ihre E-Mails zu synchronisieren.
            </DialogDescription>
          </DialogHeader>

          {!connectProvider ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setConnectProvider("gmail")}
              >
                <GmailIcon className="w-10 h-10" />
                <span>Gmail</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setConnectProvider("ionos")}
              >
                <IonosIcon className="w-10 h-10" />
                <span>IONOS</span>
              </Button>
            </div>
          ) : connectProvider === "gmail" ? (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <GmailIcon className="w-10 h-10" />
                <div>
                  <p className="font-medium">Gmail verbinden</p>
                  <p className="text-sm text-muted-foreground">
                    Sie werden zu Google weitergeleitet, um die Verbindung zu autorisieren.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConnectProvider(null)}>
                  Zurück
                </Button>
                <Button onClick={handleGmailConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Mit Google verbinden
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <IonosIcon className="w-10 h-10" />
                <div>
                  <p className="font-medium">IONOS verbinden</p>
                  <p className="text-sm text-muted-foreground">
                    Geben Sie Ihre IONOS-Zugangsdaten ein.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="ionos-email">E-Mail-Adresse</Label>
                  <Input
                    id="ionos-email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={ionosCredentials.email}
                    onChange={(e) => setIonosCredentials(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ionos-password">Passwort / App-Passwort</Label>
                  <Input
                    id="ionos-password"
                    type="password"
                    placeholder="••••••••"
                    value={ionosCredentials.password}
                    onChange={(e) => setIonosCredentials(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tipp: Erstellen Sie ein App-Passwort in Ihren IONOS-Einstellungen.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConnectProvider(null)}>
                  Zurück
                </Button>
                <Button onClick={handleIonosConnect} disabled={isConnecting}>
                  {isConnecting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Verbinden
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
