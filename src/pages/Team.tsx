// ============================================
// Team Page - Kanban-Style Team Management
// With Activity Timeline, Permissions Sheet, and Drag-and-Drop
// ============================================

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useTenantAdmin } from "@/hooks/useTenantAdmin";
import { useTenantInvitations } from "@/margenkalkulator/hooks/useTenantInvitations";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { AccessDeniedCard } from "@/components/AccessDeniedCard";
import {
  TeamStatsBar,
  TeamKanbanBoard,
  TeamMemberData,
  TeamActivityTimeline,
  MemberPermissionsSheet,
} from "@/components/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Users, Loader2, UserPlus, Clock, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIdentity } from "@/contexts/IdentityContext";

// Type definitions
interface ProfileWithRole {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  is_approved: boolean | null;
  role?: string;
}

export default function Team() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();
  const { canViewTeam, hasFullAccess, isLoading: permissionsLoading } = usePermissions();
  const { isTenantAdmin } = useTenantAdmin();
  const { trackMemberInvited, trackMemberPromoted, trackMemberDemoted, trackMemberRemoved, trackPermissionChanged } = useActivityTracker();

  // Invitations hook
  const { pendingInvitations, expiredInvitations, isLoading: invitationsLoading, sendInvitation, revokeInvitation, resendInvitation } = useTenantInvitations();

  // State
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"tenant_admin" | "user">("user");
  const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);
  const [isPermissionsSheetOpen, setIsPermissionsSheetOpen] = useState(false);
  const [activeView, setActiveView] = useState<"board" | "activity">("board");

  // Fetch all tenant members with roles
  const membersQuery = useQuery({
    queryKey: ["tenant-members", identity.tenantId],
    queryFn: async (): Promise<ProfileWithRole[]> => {
      if (!identity.tenantId) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name, created_at, is_approved")
        .eq("tenant_id", identity.tenantId);

      if (profilesError) {
        console.warn("[Team] Profiles query error:", profilesError.message);
        return [];
      }

      const profilesWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", profile.id);
          const roleList = roles?.map((r) => r.role) || [];
          let highestRole = "user";
          if (roleList.includes("admin")) highestRole = "admin";
          if (roleList.includes("tenant_admin")) highestRole = "tenant_admin";
          return { ...profile, role: highestRole };
        })
      );

      return profilesWithRoles;
    },
    enabled: !!identity.tenantId,
  });

  // Transform data for Kanban board
  const { admins, members, invitations, inactive, stats } = useMemo(() => {
    const allProfiles = membersQuery.data || [];
    const allInvitations = [...pendingInvitations, ...expiredInvitations];

    const adminsList: TeamMemberData[] = allProfiles
      .filter((p) => p.is_approved && (p.role === "tenant_admin" || p.role === "admin"))
      .map((p) => ({ id: p.id, type: "member" as const, name: p.display_name || p.email?.split("@")[0] || "Unbekannt", email: p.email || "", role: p.role || "user", joinedAt: p.created_at, isCurrentUser: p.id === user?.id }));

    const membersList: TeamMemberData[] = allProfiles
      .filter((p) => p.is_approved && p.role !== "tenant_admin" && p.role !== "admin")
      .map((p) => ({ id: p.id, type: "member" as const, name: p.display_name || p.email?.split("@")[0] || "Unbekannt", email: p.email || "", role: p.role || "user", joinedAt: p.created_at, isCurrentUser: p.id === user?.id }));

    const invitationsList: TeamMemberData[] = allInvitations.map((inv) => ({ id: inv.id, type: "invitation" as const, name: inv.email.split("@")[0], email: inv.email, role: inv.role, expiresAt: inv.expires_at }));

    const inactiveList: TeamMemberData[] = allProfiles
      .filter((p) => !p.is_approved)
      .map((p) => ({ id: p.id, type: "member" as const, name: p.display_name || p.email?.split("@")[0] || "Unbekannt", email: p.email || "", role: p.role || "user", joinedAt: p.created_at, isCurrentUser: p.id === user?.id }));

    const expiringCount = pendingInvitations.filter((inv) => new Date(inv.expires_at) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)).length;

    return { admins: adminsList, members: membersList, invitations: invitationsList, inactive: inactiveList, stats: { totalMembers: adminsList.length + membersList.length, admins: adminsList.length, pendingInvitations: pendingInvitations.length, expiringInvitations: expiringCount } };
  }, [membersQuery.data, pendingInvitations, expiredInvitations, user?.id]);

  // Handle invite
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await sendInvitation.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      await trackMemberInvited(inviteEmail.trim(), inviteRole);
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("user");
    } catch (error) { /* Error handled by mutation */ }
  };

  // Handle actions with activity tracking
  const handleRemove = async (member: TeamMemberData) => {
    if (!window.confirm(`${member.name} wirklich entfernen?`)) return;
    const { error } = await supabase.from("profiles").update({ is_approved: false }).eq("id", member.id);
    if (error) { toast.error("Fehler beim Entfernen: " + error.message); } 
    else { toast.success("Mitarbeiter deaktiviert"); await trackMemberRemoved(member.id, member.name); queryClient.invalidateQueries({ queryKey: ["tenant-members"] }); }
  };

  const handlePromote = async (member: TeamMemberData) => {
    const { error } = await supabase.from("user_roles").upsert({ user_id: member.id, role: "tenant_admin" });
    if (error) { toast.error("Fehler beim Befördern: " + error.message); } 
    else { toast.success(`${member.name} zum Admin befördert`); await trackMemberPromoted(member.id, member.name, "tenant_admin"); queryClient.invalidateQueries({ queryKey: ["tenant-members"] }); }
  };

  const handleDemote = async (member: TeamMemberData) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", member.id).eq("role", "tenant_admin");
    if (error) { toast.error("Fehler beim Herabstufen: " + error.message); } 
    else { toast.success(`${member.name} ist jetzt Mitarbeiter`); await trackMemberDemoted(member.id, member.name, "user"); queryClient.invalidateQueries({ queryKey: ["tenant-members"] }); }
  };

  const handleResendInvitation = (member: TeamMemberData) => {
    const invitation = [...pendingInvitations, ...expiredInvitations].find((inv) => inv.id === member.id);
    if (invitation) resendInvitation.mutate(invitation);
  };

  const handleRevokeInvitation = (member: TeamMemberData) => {
    if (!window.confirm(`Einladung an ${member.email} wirklich widerrufen?`)) return;
    revokeInvitation.mutate(member.id);
  };

  const handleMemberClick = (member: TeamMemberData) => {
    if (member.type === "member" && canManage) {
      setSelectedMember(member);
      setIsPermissionsSheetOpen(true);
    }
  };

  const handlePermissionsSaved = async () => {
    if (selectedMember) {
      await trackPermissionChanged(selectedMember.id, selectedMember.name, {});
      queryClient.invalidateQueries({ queryKey: ["team-activities"] });
    }
  };

  // Access check
  if (!permissionsLoading && !hasFullAccess && !canViewTeam) {
    return <MainLayout><AccessDeniedCard title="Kein Zugriff auf Team" description="Sie haben keine Berechtigung, die Team-Verwaltung einzusehen." /></MainLayout>;
  }

  const isLoading = membersQuery.isLoading || invitationsLoading;
  const canManage = isTenantAdmin || hasFullAccess;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <div className="flex items-center gap-2"><Users className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Team-Verwaltung</h1></div>
              <p className="text-muted-foreground mt-1">Verwalten Sie Ihre Mitarbeiter und Einladungen</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <TeamStatsBar stats={stats} />

            {/* View Toggle */}
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "board" | "activity")}>
              <TabsList><TabsTrigger value="board" className="gap-2"><LayoutGrid className="h-4 w-4" />Übersicht</TabsTrigger><TabsTrigger value="activity" className="gap-2"><Clock className="h-4 w-4" />Aktivität</TabsTrigger></TabsList>
              <TabsContent value="board" className="mt-6">
                <TeamKanbanBoard admins={admins} members={members} invitations={invitations} inactive={inactive} canManage={canManage} onPromote={handlePromote} onDemote={handleDemote} onRemove={handleRemove} onResendInvitation={handleResendInvitation} onRevokeInvitation={handleRevokeInvitation} onAddMember={() => setIsInviteDialogOpen(true)} onMemberClick={handleMemberClick} />
              </TabsContent>
              <TabsContent value="activity" className="mt-6">
                <TeamActivityTimeline />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Permissions Sheet */}
        <MemberPermissionsSheet member={selectedMember} open={isPermissionsSheetOpen} onOpenChange={setIsPermissionsSheetOpen} onSaved={handlePermissionsSaved} />

        {/* Invite Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <form onSubmit={handleInvite}>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Mitarbeiter einladen</DialogTitle><DialogDescription>Senden Sie eine Einladung per E-Mail an einen neuen Mitarbeiter.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="invite-email">E-Mail-Adresse *</Label><Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="mitarbeiter@firma.de" required /></div>
                <div className="grid gap-2"><Label htmlFor="invite-role">Rolle</Label><Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "tenant_admin" | "user")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">Mitarbeiter</SelectItem><SelectItem value="tenant_admin">Admin</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">Admins können Mitarbeiter verwalten und Einstellungen ändern.</p></div>
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Abbrechen</Button><Button type="submit" disabled={sendInvitation.isPending}>{sendInvitation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Einladung senden</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
