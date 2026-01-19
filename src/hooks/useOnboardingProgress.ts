// ============================================
// Onboarding Progress Hook
// Track new employee onboarding checklist
// ============================================

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIdentity } from "@/contexts/IdentityContext";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  auto_check?: string; // Key for auto-completion check
  link?: string;
}

export interface OnboardingTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  steps: OnboardingStep[];
  created_at: string;
  updated_at: string;
}

export interface OnboardingProgress {
  id: string;
  tenant_id: string;
  user_id: string;
  template_id: string | null;
  completed_steps: string[];
  started_at: string;
  completed_at: string | null;
  skipped_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  template?: OnboardingTemplate;
  user?: { id: string; display_name: string | null; email: string | null };
}

const PROGRESS_KEY = ["onboarding-progress"];
const TEMPLATES_KEY = ["onboarding-templates"];

export function useOnboardingProgress() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Fetch my progress
  const {
    data: progress,
    isLoading: isLoadingProgress,
    refetch: refetchProgress,
  } = useQuery({
    queryKey: [...PROGRESS_KEY, user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("onboarding_progress")
          .select(`*, template:onboarding_templates(*)`)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.warn("[useOnboardingProgress] Query error:", error.message);
          return null;
        }

        if (!data) return null;

        return {
          ...data,
          template: data.template ? {
            ...data.template,
            steps: (data.template.steps || []) as unknown as OnboardingStep[]
          } : null
        } as unknown as OnboardingProgress;
      } catch (err) {
        console.error("[useOnboardingProgress] Unexpected error:", err);
        return null;
      }
    },
    enabled: !!user,
  });

  // Fetch all team onboarding (for admins)
  const {
    data: teamProgress = [],
    isLoading: isLoadingTeam,
  } = useQuery({
    queryKey: [...PROGRESS_KEY, "team"],
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("onboarding_progress")
          .select(`*, template:onboarding_templates(*)`)
          .is("completed_at", null)
          .is("skipped_at", null)
          .order("started_at", { ascending: false });

        if (error) {
          console.warn("[useOnboardingProgress] Team query error:", error.message);
          return [];
        }

        return (data || []).map(d => ({
          ...d,
          template: d.template ? {
            ...d.template,
            steps: (d.template.steps || []) as unknown as OnboardingStep[]
          } : null
        })) as unknown as OnboardingProgress[];
      } catch (err) {
        console.error("[useOnboardingProgress] Team unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch templates (only for authenticated users)
  const { data: templates = [] } = useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("onboarding_templates")
          .select("*")
          .order("is_default", { ascending: false });

        if (error) {
          console.warn("[useOnboardingProgress] Templates query error:", error.message);
          return [];
        }

        return (data || []).map(t => ({
          ...t,
          steps: t.steps as unknown as OnboardingStep[]
        })) as OnboardingTemplate[];
      } catch (err) {
        console.error("[useOnboardingProgress] Templates unexpected error:", err);
        return [];
      }
    },
    // SECURITY: Only fetch templates for authenticated users
    enabled: !!user,
  });

  // Calculate my progress
  const myProgressData = useMemo(() => {
    if (!progress?.template) return { completed: 0, total: 0, percent: 0, isComplete: false };

    const steps = progress.template.steps || [];
    const completed = progress.completed_steps?.length || 0;
    const total = steps.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      total,
      percent,
      isComplete: progress.completed_at !== null,
      isSkipped: progress.skipped_at !== null,
    };
  }, [progress]);

  // Is onboarding active for current user
  const isOnboarding = useMemo(() => {
    if (!progress) return false;
    return !progress.completed_at && !progress.skipped_at;
  }, [progress]);

  // Complete step mutation
  const completeStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      if (!user || !progress) {
        console.warn("[useOnboardingProgress] No progress found");
        return null;
      }

      const newCompletedSteps = [...(progress.completed_steps || [])];
      if (!newCompletedSteps.includes(stepId)) {
        newCompletedSteps.push(stepId);
      }

      const isComplete = progress.template?.steps?.length === newCompletedSteps.length;

      const { data, error } = await supabase
        .from("onboarding_progress")
        .update({
          completed_steps: newCompletedSteps,
          completed_at: isComplete ? new Date().toISOString() : null,
        })
        .eq("id", progress.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEY });
    },
  });

  // Skip onboarding mutation
  const skipOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!user || !progress) {
        console.warn("[useOnboardingProgress] No progress found");
        return null;
      }

      const { data, error } = await supabase
        .from("onboarding_progress")
        .update({ skipped_at: new Date().toISOString() })
        .eq("id", progress.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEY });
    },
  });

  // Start onboarding for user (admin action or auto on signup)
  const startOnboarding = async (userId: string, templateId?: string) => {
    try {
      // Get default template if not specified
      let useTemplateId = templateId;
      if (!useTemplateId) {
        const defaultTemplate = templates.find(t => t.is_default);
        useTemplateId = defaultTemplate?.id;
      }

      const { error } = await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: userId,
          tenant_id: identity.tenantId || "",
          template_id: useTemplateId || null,
          completed_steps: [],
          started_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (error) {
        console.warn("[useOnboardingProgress] Start error:", error.message);
        return false;
      }

      queryClient.invalidateQueries({ queryKey: PROGRESS_KEY });
      return true;
    } catch (err) {
      console.error("[useOnboardingProgress] Start unexpected error:", err);
      return false;
    }
  };

  return {
    progress,
    myProgressData,
    isOnboarding,
    teamProgress,
    templates,
    isLoading: isLoadingProgress,
    isLoadingTeam,
    refetch: refetchProgress,
    completeStep: completeStepMutation.mutateAsync,
    skipOnboarding: skipOnboardingMutation.mutateAsync,
    startOnboarding,
    isCompletingStep: completeStepMutation.isPending,
  };
}
