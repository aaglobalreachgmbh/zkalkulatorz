// ============================================
// Tenant Team Manager Component
// Manages team members and invitations
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Users, Mail, RefreshCw, Trash2, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { useTenantInvitations, type InvitationInput, type TenantInvitation } from "@/margenkalkulator/hooks/useTenantInvitations";
import { useAllEmployeeSettings, useAdminEmployeeManagement } from "@/margenkalkulator/hooks/useEmployeeSettings";
import { useIdentity } from "@/contexts/IdentityContext";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export function TenantTeamManager() {
  const { identity } = useIdentity();
  const {
    pendingInvitations,
    expiredInvitations,
    isLoading: isLoadingInvitations,
    sendInvitation,
    revokeInvitation,
    resendInvitation,
  } = useTenantInvitations();
  
  const { 
    employees: teamMembers, 
    isLoading: isLoadingMembers,
  } = useAllEmployeeSettings();
  
  const { createOrUpdateSettings } = useAdminEmployeeManagement();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "tenant_admin">("user");

  const handleSendInvitation = () => {
    if (!inviteEmail) return;
    
    sendInvitation.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => {
          setInviteEmail("");
          setInviteRole("user");
        },
      }
    );
  };

  const handleToggleMarginVisibility = async (userId: string, currentValue: boolean) => {
    try {
      await createOrUpdateSettings(userId, {
        featureOverrides: { can_view_margins: !currentValue },
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const getStatusBadge = (invitation: TenantInvitation) => {
    if (invitation.accepted_at) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Akzeptiert</Badge>;
    }
    if (new Date(invitation.expires_at) <= new Date()) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Abgelaufen</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Ausstehend</Badge>;
  };

  const isLoading = isLoadingInvitations || isLoadingMembers;

  return (
    <div className="space-y-6">
      {/* Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Mitarbeiter einladen
          </CardTitle>
          <CardDescription>
            Senden Sie eine Einladung per E-Mail. Der Empfänger kann sich damit für Ihren Tenant registrieren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">E-Mail-Adresse</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="mitarbeiter@firma.de"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48 space-y-2">
              <Label htmlFor="invite-role">Rolle</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "user" | "tenant_admin")}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Mitarbeiter</SelectItem>
                  <SelectItem value="tenant_admin">Tenant-Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSendInvitation}
                disabled={!inviteEmail || sendInvitation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendInvitation.isPending ? "Senden..." : "Einladen"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team-Mitglieder
          </CardTitle>
          <CardDescription>
            Verwalten Sie Berechtigungen für Ihre Teammitglieder
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="text-center py-8 text-muted-foreground">Laden...</div>
          ) : teamMembers && teamMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Abteilung</TableHead>
                  <TableHead>Margen sichtbar</TableHead>
                  <TableHead>PDF-Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.displayName || "Unbekannt"}
                    </TableCell>
                    <TableCell>{member.department || "–"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={member.featureOverrides?.can_view_margins ?? true}
                        onCheckedChange={() => 
                          handleToggleMarginVisibility(member.userId, member.featureOverrides?.can_view_margins ?? true)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={member.featureOverrides?.can_export_pdf ?? true}
                        disabled
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Teammitglieder vorhanden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Offene Einladungen
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary">{pendingInvitations.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Einladungen, die noch nicht akzeptiert wurden (gültig für 7 Tage)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvitations ? (
            <div className="text-center py-8 text-muted-foreground">Laden...</div>
          ) : pendingInvitations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Gesendet</TableHead>
                  <TableHead>Läuft ab</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant={invitation.role === "tenant_admin" ? "default" : "secondary"}>
                        {invitation.role === "tenant_admin" ? "Admin" : "Mitarbeiter"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true, locale: de })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invitation.expires_at), "dd.MM.yyyy HH:mm", { locale: de })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resendInvitation.mutate(invitation)}
                        disabled={resendInvitation.isPending}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Einladung widerrufen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Die Einladung an {invitation.email} wird gelöscht und kann nicht mehr verwendet werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeInvitation.mutate(invitation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Widerrufen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Keine offenen Einladungen
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired Invitations (collapsed by default) */}
      {expiredInvitations.length > 0 && (
        <Card className="opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-5 w-5" />
              Abgelaufene Einladungen
              <Badge variant="destructive">{expiredInvitations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {expiredInvitations.slice(0, 5).map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="text-muted-foreground">{invitation.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvitation.mutate(invitation)}
                        disabled={resendInvitation.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Erneut senden
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
