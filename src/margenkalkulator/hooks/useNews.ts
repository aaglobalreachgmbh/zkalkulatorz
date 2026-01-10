/**
 * Hook for managing SalesWorld News
 * CRUD operations for news items from database
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIdentity } from "@/contexts/IdentityContext";
import { useIdentity } from "@/contexts/IdentityContext";

export type NewsType = "alert" | "info" | "training" | "promo" | "stock" | "urgent";

export interface NewsItem {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  content: string | null;
  type: NewsType;
  is_pinned: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateNewsParams {
  title: string;
  description?: string;
  content?: string;
  type?: NewsType;
  is_pinned?: boolean;
  valid_from?: string;
  valid_until?: string;
}

interface UpdateNewsParams {
  id: string;
  updates: Partial<CreateNewsParams>;
}

/**
 * Hook for managing news items
 */
export function useNews(options?: { includeExpired?: boolean }) {
  const queryClient = useQueryClient();
  const { identity } = useIdentity();
  const tenantId = identity?.tenantId || "";
  const { includeExpired = false } = options || {};

  // Query news items
  const { data: news = [], isLoading, error } = useQuery({
    queryKey: ["news-items", tenantId, includeExpired],
    queryFn: async (): Promise<NewsItem[]> => {
      let query = supabase
        .from("news_items")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (!includeExpired) {
        const today = new Date().toISOString().split("T")[0];
        query = query
          .lte("valid_from", today)
          .or(`valid_until.is.null,valid_until.gte.${today}`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn("[useNews] Query error:", error.message);
        return [];
      }

      return (data || []).map(item => ({
        ...item,
        type: item.type as NewsType,
        is_pinned: item.is_pinned ?? false,
      }));
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId,
  });

  // Create news mutation
  const createMutation = useMutation({
    mutationFn: async (params: CreateNewsParams) => {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("news_items")
        .insert({
          tenant_id: tenantId || "",
          title: params.title,
          description: params.description || null,
          content: params.content || null,
          type: params.type || "info",
          is_pinned: params.is_pinned || false,
          valid_from: params.valid_from || new Date().toISOString().split("T")[0],
          valid_until: params.valid_until || null,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-items"] });
      toast.success("News erstellt");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen");
    },
  });

  // Update news mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: UpdateNewsParams) => {
      const { data, error } = await supabase
        .from("news_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-items"] });
      toast.success("News aktualisiert");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Fehler beim Aktualisieren");
    },
  });

  // Delete news mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("news_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-items"] });
      toast.success("News gelöscht");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen");
    },
  });

  // Toggle pinned state
  const togglePinned = async (id: string, isPinned: boolean) => {
    await updateMutation.mutateAsync({
      id,
      updates: { is_pinned: isPinned },
    });
  };

  return {
    news,
    isLoading,
    error,
    createNews: createMutation.mutate,
    createNewsAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateNews: updateMutation.mutate,
    updateNewsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteNews: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    togglePinned,
  };
}

// News type display helpers
export const NEWS_TYPE_CONFIG: Record<NewsType, { color: string; bgColor: string; label: string; icon: string }> = {
  alert: {
    color: "text-red-600",
    bgColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "ALERT",
    icon: "AlertTriangle",
  },
  info: {
    color: "text-blue-600",
    bgColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    label: "INFO",
    icon: "Info",
  },
  training: {
    color: "text-purple-600",
    bgColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    label: "SCHULUNG",
    icon: "GraduationCap",
  },
  promo: {
    color: "text-green-600",
    bgColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    label: "AKTION",
    icon: "Gift",
  },
  stock: {
    color: "text-orange-600",
    bgColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    label: "LAGER",
    icon: "Package",
  },
  urgent: {
    color: "text-red-600",
    bgColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "DRINGEND",
    icon: "AlertCircle",
  },
};
