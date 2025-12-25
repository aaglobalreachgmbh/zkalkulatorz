import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useTeams, TeamWithMembers } from "@/margenkalkulator/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Users,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  User,
  Loader2,
  Pencil,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  owner: "Inhaber",
  admin: "Admin",
  member: "Mitglied",
};

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3 w-3" />,
  admin: <Shield className="h-3 w-3" />,
  member: <User className="h-3 w-3" />,
};

export default function Team() {
  const { user } = useAuth();
  const { teams, isLoading, createTeam, updateTeam, deleteTeam, addMember, removeMember, updateMemberRole } =
    useTeams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "member">("member");

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    await createTeam.mutateAsync({ name: teamName, description: teamDescription });
    setIsCreateDialogOpen(false);
    setTeamName("");
    setTeamDescription("");
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !memberEmail.trim()) return;
    await addMember.mutateAsync({
      teamId: selectedTeam.id,
      email: memberEmail,
      role: memberRole,
    });
    setIsAddMemberDialogOpen(false);
    setMemberEmail("");
    setMemberRole("member");
  };

  const handleDeleteTeam = async (team: TeamWithMembers) => {
    if (window.confirm(`Team "${team.name}" wirklich löschen?`)) {
      await deleteTeam.mutateAsync(team.id);
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (window.confirm("Mitglied wirklich entfernen?")) {
      await removeMember.mutateAsync({ teamId, userId });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teams</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Teams und teilen Sie Angebote</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neues Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateTeam}>
                <DialogHeader>
                  <DialogTitle>Neues Team erstellen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie ein Team, um Angebote mit Kollegen zu teilen.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="team-name">Teamname *</Label>
                    <Input
                      id="team-name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Vertrieb Nord"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="team-description">Beschreibung</Label>
                    <Textarea
                      id="team-description"
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      placeholder="Optional: Beschreibung des Teams..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={createTeam.isPending}>
                    {createTeam.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Erstellen
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Add Member Dialog */}
        <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
          <DialogContent>
            <form onSubmit={handleAddMember}>
              <DialogHeader>
                <DialogTitle>Mitglied hinzufügen</DialogTitle>
                <DialogDescription>
                  Fügen Sie ein neues Mitglied zu "{selectedTeam?.name}" hinzu.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="member-email">E-Mail-Adresse *</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="kollege@firma.de"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="member-role">Rolle</Label>
                  <Select value={memberRole} onValueChange={(v) => setMemberRole(v as "admin" | "member")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Mitglied</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={addMember.isPending}>
                  {addMember.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Hinzufügen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : teams.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">Noch keine Teams</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Erstellen Sie Ihr erstes Team, um Angebote mit Kollegen zu teilen.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Team erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {team.name}
                      </CardTitle>
                      {team.description && (
                        <CardDescription className="mt-1">{team.description}</CardDescription>
                      )}
                    </div>
                    {(team.myRole === "owner" || team.myRole === "admin") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTeam(team);
                              setIsAddMemberDialogOpen(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Mitglied hinzufügen
                          </DropdownMenuItem>
                          {team.myRole === "owner" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteTeam(team)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Team löschen
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{team.members.length} Mitglieder</span>
                      <Badge variant="secondary">{roleLabels[team.myRole || "member"]}</Badge>
                    </div>
                    <div className="space-y-2">
                      {team.members.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">
                                {(member.profile?.display_name || member.profile?.email || "U")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-sm">
                                {member.profile?.display_name || member.profile?.email || "Unbekannt"}
                                {member.user_id === user?.id && " (Sie)"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              {roleIcons[member.role]}
                              {roleLabels[member.role]}
                            </Badge>
                            {(team.myRole === "owner" || team.myRole === "admin") &&
                              member.user_id !== user?.id &&
                              member.role !== "owner" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveMember(team.id, member.user_id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                          </div>
                        </div>
                      ))}
                      {team.members.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{team.members.length - 5} weitere Mitglieder
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
