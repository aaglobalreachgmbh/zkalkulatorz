import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UseApprovalStatusResult {
  isApproved: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useApprovalStatus(): UseApprovalStatusResult {
  // TEMPORARY: Approval-Check deaktiviert bis Release
  // Alle User sind automatisch approved - wird bei Release wieder aktiviert
  // TODO: Reaktivieren wenn Lizenz-System vollständig konfiguriert ist
  return {
    isApproved: true,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
