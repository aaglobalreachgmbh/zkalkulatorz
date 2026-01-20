// ============================================
// In-App Notifications Hook
// Realtime notifications with read/unread tracking
// ============================================

import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type NotificationType =
  | "promotion"
  | "demotion"
  | "permission_change"
  | "event_assigned"
  | "event_updated"
  | "event_cancelled"
  | "invitation_expiring"
  | "absence_approved"
  | "absence_rejected"
  | "shift_assigned"
  | "shift_swap_request"
  | "shift_swap_approved"
  | "goal_achieved"
  | "onboarding_reminder"
  | "system";

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

const QUERY_KEY = ["notifications"];

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.warn("[useNotifications] Query error:", error.message);
          return [];
        }

        return (data || []) as Notification[];
      } catch (err) {
        console.error("[useNotifications] Unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[useNotifications] New notification:", payload.new);
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) {
        console.warn("[useNotifications] Mark as read error:", error);
        // Do not throw, just log
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      console.error("[useNotifications] Mark as read error:", error);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.warn("[useNotifications] Mark all as read error:", error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      console.error("[useNotifications] Mark all as read error:", error);
    },
  });

  // Create notification (for internal use)
  const createNotification = async (input: {
    user_id: string;
    type: NotificationType;
    title: string;
    message?: string;
    link?: string;
    metadata?: Record<string, unknown>;
    tenant_id?: string;
  }) => {
    try {
      const { error } = await supabase.from("notifications").insert([{
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        message: input.message || null,
        link: input.link || null,
        metadata: (input.metadata || {}) as Record<string, never>,
        tenant_id: input.tenant_id || "",
      }]);

      if (error) {
        console.warn("[useNotifications] Create error:", error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error("[useNotifications] Create unexpected error:", err);
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    createNotification,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
}
