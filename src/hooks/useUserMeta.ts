// ============================================
// User Meta Hook (Admin-only write access)
// SECURITY: Reads user_meta, writes only via RPC
// NOTE: Requires user_meta table from Phase A2 migration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserMeta {
  id: string;
  user_id: string;
  subscription_status: "active" | "suspended" | "cancelled" | "trial";
  discount_tier: "standard" | "bronze" | "silver" | "gold" | "platinum";
  feature_flags: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to read current user's meta data
 * NOTE: Will return null until user_meta table is created via migration
 */
export function useUserMeta() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-meta", user?.id],
    queryFn: async (): Promise<UserMeta | null> => {
      if (!user?.id) return null;

      try {
        // Use raw query since table may not exist yet in types
        const { data, error } = await (supabase as any)
          .from("user_meta")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          // Table might not exist yet
          if (error.code === "42P01") {
            console.warn("[useUserMeta] Table user_meta does not exist yet");
            return null;
          }
          throw error;
        }

        return data as UserMeta | null;
      } catch (err) {
        console.error("[useUserMeta] Error:", err);
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update user meta (Admin only via RPC)
 * NOTE: Requires update_user_meta function from Phase A2 migration
 */
export function useUpdateUserMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      subscriptionStatus?: string;
      discountTier?: string;
      featureFlags?: Record<string, boolean>;
    }) => {
      // Use raw rpc call since function may not exist yet in types
      const { data, error } = await (supabase as any).rpc("update_user_meta", {
        _user_id: params.userId,
        _subscription_status: params.subscriptionStatus ?? null,
        _discount_tier: params.discountTier ?? null,
        _feature_flags: params.featureFlags ?? null,
      });

      if (error) {
        console.error("[useUpdateUserMeta] Error:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-meta", variables.userId] });
    },
  });
}

/**
 * Hook to get specific user's meta (for Admin panel)
 */
export function useUserMetaById(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-meta", userId],
    queryFn: async (): Promise<UserMeta | null> => {
      if (!userId) return null;

      try {
        const { data, error } = await (supabase as any)
          .from("user_meta")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          if (error.code === "42P01") return null;
          throw error;
        }
        return data as UserMeta | null;
      } catch {
        return null;
      }
    },
    enabled: !!userId,
  });
}
