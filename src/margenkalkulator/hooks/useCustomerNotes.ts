// ============================================
// Customer Notes Hook - Notizen im Timeline-Format
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { toast } from "sonner";

export interface CustomerNote {
  id: string;
  customer_id: string;
  user_id: string;
  note_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  customer_id: string;
  content: string;
  note_type?: string;
}

const NOTE_TYPES = {
  info: { label: "Info", icon: "💬" },
  call: { label: "Telefonat", icon: "📞" },
  meeting: { label: "Meeting", icon: "🤝" },
  offer: { label: "Angebot", icon: "📄" },
  contract: { label: "Vertrag", icon: "✍️" },
} as const;

export type NoteType = keyof typeof NOTE_TYPES;

export function useCustomerNotes(customerId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { trackActivity } = useActivityTracker();

  const queryKey = ["customerNotes", customerId];

  // Fetch notes for customer
  const {
    data: notes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<CustomerNote[]> => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw new Error("Notizen laden fehlgeschlagen: " + error.message);

      return data || [];
    },
    enabled: !!customerId && !!user,
  });

  // Create note mutation
  const createNote = useMutation({
    mutationFn: async (input: CreateNoteInput): Promise<CustomerNote> => {
      if (!user) throw new Error("Nicht eingeloggt");

      const { data, error } = await supabase
        .from("customer_notes")
        .insert({
          customer_id: input.customer_id,
          user_id: user.id,
          content: input.content,
          note_type: input.note_type || "info",
        })
        .select()
        .single();

      if (error) throw new Error("Notiz erstellen fehlgeschlagen: " + error.message);

      return data;
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Notiz erstellt", { description: "Die Notiz wurde hinzugefügt." });
      // Activity tracking via customer resource
      trackActivity({
        action: "customer_update",
        resourceType: "customer",
        resourceId: newNote.customer_id,
        resourceName: "Kunden-Notiz",
        summary: `Neue Notiz: ${newNote.content.substring(0, 50)}...`,
      });
    },
    onError: (error: Error) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  // Delete note mutation
  const deleteNote = useMutation({
    mutationFn: async (noteId: string): Promise<void> => {
      const { error } = await supabase
        .from("customer_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw new Error("Notiz löschen fehlgeschlagen: " + error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Notiz gelöscht", { description: "Die Notiz wurde entfernt." });
    },
    onError: (error: Error) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  return {
    notes,
    isLoading,
    error,
    createNote,
    deleteNote,
    noteTypes: NOTE_TYPES,
  };
}
