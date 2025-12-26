/**
 * Activity Tracker Hook
 * 
 * Aktualisiert die letzte Aktivität des Benutzers für DSGVO-Tracking.
 * Wird bei wichtigen Aktionen aufgerufen.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useActivityTracker() {
  const { user } = useAuth();
  
  /**
   * Aktualisiert last_activity_at für den aktuellen Benutzer
   */
  const trackActivity = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Update last_activity_at (Trigger setzt automatisch auf now())
      const { error } = await supabase
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", user.id);
      
      if (error) {
        console.warn("[ActivityTracker] Failed to update activity:", error.message);
      }
    } catch (error) {
      console.warn("[ActivityTracker] Error:", error);
    }
  }, [user?.id]);
  
  /**
   * Debounced version - nur alle 5 Minuten ein Update
   */
  const trackActivityDebounced = useCallback(() => {
    const DEBOUNCE_KEY = "last_activity_tracked";
    const DEBOUNCE_MS = 5 * 60 * 1000; // 5 Minuten
    
    const lastTracked = sessionStorage.getItem(DEBOUNCE_KEY);
    const now = Date.now();
    
    if (lastTracked && now - parseInt(lastTracked, 10) < DEBOUNCE_MS) {
      return; // Noch nicht fällig
    }
    
    sessionStorage.setItem(DEBOUNCE_KEY, now.toString());
    trackActivity();
  }, [trackActivity]);
  
  return {
    trackActivity,
    trackActivityDebounced,
  };
}
