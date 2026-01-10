/**
 * Hook für Benachrichtigungs-Einstellungen
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface NotificationTypes {
  visit_reminder: boolean;
  visit_overdue: boolean;
  sync_pending: boolean;
  sync_failed: boolean;
  appointment_reminder: boolean;
  vvl_reminder: boolean;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  tenant_id: string;
  email_enabled: boolean;
  calendar_sync_enabled: boolean;
  reminder_before_minutes: number;
  notification_types: NotificationTypes;
}

const DEFAULT_NOTIFICATION_TYPES: NotificationTypes = {
  visit_reminder: true,
  visit_overdue: true,
  sync_pending: true,
  sync_failed: true,
  appointment_reminder: true,
  vvl_reminder: true,
};

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "id" | "user_id" | "tenant_id"> = {
  email_enabled: true,
  calendar_sync_enabled: false,
  reminder_before_minutes: 15,
  notification_types: DEFAULT_NOTIFICATION_TYPES,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async (): Promise<NotificationPreferences | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("[useNotificationPreferences] Query error:", error.message);
        return null;
      }

      if (!data) {
        // Return defaults if no preferences exist
        return {
          id: "",
          user_id: user.id,
          tenant_id: "tenant_default",
          ...DEFAULT_PREFERENCES,
        };
      }

      return {
        ...data,
        notification_types: (data.notification_types as unknown as NotificationTypes) || DEFAULT_NOTIFICATION_TYPES,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<NotificationPreferences, "id" | "user_id" | "tenant_id">>) => {
      if (!user) throw new Error("Not authenticated");

      // Check if preferences exist
      const { data: existing } = await supabase
        .from("notification_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("notification_preferences")
          .update({
            ...updates,
            notification_types: updates.notification_types as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            tenant_id: "tenant_default",
            email_enabled: DEFAULT_PREFERENCES.email_enabled,
            calendar_sync_enabled: DEFAULT_PREFERENCES.calendar_sync_enabled,
            reminder_before_minutes: DEFAULT_PREFERENCES.reminder_before_minutes,
            notification_types: (updates.notification_types || DEFAULT_NOTIFICATION_TYPES) as unknown as Json,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", user?.id] });
      toast.success("Einstellungen gespeichert");
    },
    onError: (error) => {
      console.error("[useNotificationPreferences] Update error:", error);
      toast.error("Einstellungen konnten nicht gespeichert werden");
    },
  });

  const toggleNotificationType = async (type: keyof NotificationTypes) => {
    const current = preferencesQuery.data?.notification_types || DEFAULT_NOTIFICATION_TYPES;
    await updatePreferencesMutation.mutateAsync({
      notification_types: {
        ...current,
        [type]: !current[type],
      },
    });
  };

  return {
    preferences: preferencesQuery.data,
    isLoading: preferencesQuery.isLoading,
    error: preferencesQuery.error as Error | null,
    updatePreferences: updatePreferencesMutation.mutate,
    toggleNotificationType,
    isUpdating: updatePreferencesMutation.isPending,
  };
}
