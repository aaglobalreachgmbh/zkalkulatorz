import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  myRole?: "owner" | "admin" | "member";
}

export function useTeams() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const teamsQuery = useQuery({
    queryKey: ["teams", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get teams the user is a member of
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .order("name", { ascending: true });

      if (teamsError) throw teamsError;

      // Get members for each team
      const teamsWithMembers: TeamWithMembers[] = await Promise.all(
        (teams || []).map(async (team) => {
          const { data: members } = await supabase
            .from("team_members")
            .select(`
              id,
              team_id,
              user_id,
              role,
              joined_at
            `)
            .eq("team_id", team.id);

          // Get profiles for members
          const membersWithProfiles = await Promise.all(
            (members || []).map(async (member) => {
              const { data: profile } = await supabase
                .from("profiles")
                .select("display_name, email")
                .eq("id", member.user_id)
                .single();

              return {
                ...member,
                role: member.role as "owner" | "admin" | "member",
                profile: profile || undefined,
              };
            })
          );

          const myMembership = membersWithProfiles.find((m) => m.user_id === user.id);

          return {
            ...team,
            members: membersWithProfiles,
            myRole: myMembership?.role,
          };
        })
      );

      return teamsWithMembers;
    },
    enabled: !!user,
  });

  const createTeam = useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      if (!user) {
        console.warn("[useTeams] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: input.name,
          description: input.description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as owner
      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "owner",
      });

      if (memberError) throw memberError;

      return team as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team erstellt");
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen: " + error.message);
    },
  });

  const updateTeam = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: string;
      name: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from("teams")
        .update({ name, description: description || null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team aktualisiert");
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team gelöscht");
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });

  const addMember = useMutation({
    mutationFn: async ({
      teamId,
      email,
      role = "member",
    }: {
      teamId: string;
      email: string;
      role?: "admin" | "member";
    }) => {
      // Find user by email from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        toast.error("Benutzer nicht gefunden");
        return null;
      }

      const { error } = await supabase.from("team_members").insert({
        team_id: teamId,
        user_id: profile.id,
        role,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Benutzer ist bereits Mitglied");
          return null;
        }
        throw error;
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Mitglied hinzugefügt");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Mitglied entfernt");
    },
    onError: (error) => {
      toast.error("Fehler beim Entfernen: " + error.message);
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({
      teamId,
      userId,
      role,
    }: {
      teamId: string;
      userId: string;
      role: "admin" | "member";
    }) => {
      const { error } = await supabase
        .from("team_members")
        .update({ role })
        .eq("team_id", teamId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Rolle aktualisiert");
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  return {
    teams: teamsQuery.data ?? [],
    isLoading: teamsQuery.isLoading,
    error: teamsQuery.error,
    createTeam,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    updateMemberRole,
  };
}
