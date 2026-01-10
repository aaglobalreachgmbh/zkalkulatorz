// ============================================
// Admin Notifications Hook
// Benachrichtigungen für Admins (neue Registrierungen etc.)
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useTenantAdmin } from "./useTenantAdmin";
import { toast } from "sonner";
import { useEffect } from "react";

export interface AdminNotification {
  id: string;
  tenant_id: string;
  type: string;
  title: string;
  message: string | null;
  target_user_id: string | null;
  related_user_id: string | null;
  related_email: string | null;
  is_read: boolean;
  read_at: string | null;
  read_by: string | null;
  action_taken: string | null;
  action_at: string | null;
  created_at: string;
}

interface UseAdminNotificationsResult {
  notifications: AdminNotification[];
  unreadCount: number;
  pendingRegistrations: AdminNotification[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAdminNotifications(): UseAdminNotificationsResult {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { isTenantAdmin, isLoading: adminLoading } = useTenantAdmin();
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading: queryLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-notifications", user?.id, identity.tenantId],
    queryFn: async () => {
      if (!user || !identity.tenantId) {
        return [];
      }

      const { data, error: queryError } = await supabase
        .from("admin_notifications")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (queryError) {
        console.warn("[useAdminNotifications] Query error:", queryError.message);
        return [];
      }

      return (data ?? []) as AdminNotification[];
    },
    enabled: !!user && !!identity.tenantId && isTenantAdmin && !adminLoading,
    staleTime: 1000 * 30, // 30 Sekunden Cache
  });

  // Realtime Subscription für neue Benachrichtigungen
  useEffect(() => {
    if (!user || !identity.tenantId || !isTenantAdmin) return;

    const channel = supabase
      .channel(`admin-notifications-${identity.tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
          filter: `tenant_id=eq.${identity.tenantId}`,
        },
        (payload) => {
          console.log("[useAdminNotifications] New notification:", payload);
          // Refetch für konsistente Daten
          queryClient.invalidateQueries({ 
            queryKey: ["admin-notifications", user.id, identity.tenantId] 
          });
          
          // Optional: Toast anzeigen
          if (payload.new && typeof payload.new === "object" && "title" in payload.new) {
            toast.info(payload.new.title as string, {
              description: "Neue Benachrichtigung",
              action: {
                label: "Anzeigen",
                onClick: () => {
                  // Navigation zur Benachrichtigungs-Seite
                  window.location.href = "/admin/users";
                },
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, identity.tenantId, isTenantAdmin, queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const pendingRegistrations = notifications.filter(
    (n) => n.type === "new_registration" && !n.action_taken
  );

  return {
    notifications,
    unreadCount,
    pendingRegistrations,
    isLoading: queryLoading || adminLoading,
    error: error as Error | null,
    refetch,
  };
}

// ============================================
// Mutations
// ============================================

export function useMarkNotificationRead() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) {
        console.warn("[useMarkNotificationRead] Not authenticated");
        return null;
      }

      const { data, error } = await supabase
        .from("admin_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: user.id,
        })
        .eq("id", notificationId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("[useMarkNotificationRead] Error:", error.message);
        return null;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["admin-notifications", user?.id, identity.tenantId] 
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user || !identity.tenantId) {
        console.warn("[useMarkAllNotificationsRead] Not authenticated");
        return null;
      }

      const { error } = await supabase
        .from("admin_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: user.id,
        })
        .eq("tenant_id", identity.tenantId)
        .eq("is_read", false);

      if (error) {
        console.error("[useMarkAllNotificationsRead] Error:", error.message);
        toast.error("Fehler beim Markieren als gelesen");
        return null;
      }

      toast.success("Alle Benachrichtigungen als gelesen markiert");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["admin-notifications", user?.id, identity.tenantId] 
      });
    },
  });
}

interface TakeActionParams {
  notificationId: string;
  action: "approved" | "rejected" | "dismissed";
}

export function useTakeNotificationAction() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId, action }: TakeActionParams) => {
      if (!user) {
        console.warn("[useTakeNotificationAction] Not authenticated");
        return null;
      }

      const { data, error } = await supabase
        .from("admin_notifications")
        .update({
          action_taken: action,
          action_at: new Date().toISOString(),
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: user.id,
        })
        .eq("id", notificationId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("[useTakeNotificationAction] Error:", error.message);
        toast.error("Fehler beim Verarbeiten");
        return null;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["admin-notifications", user?.id, identity.tenantId] 
      });
    },
  });
}
