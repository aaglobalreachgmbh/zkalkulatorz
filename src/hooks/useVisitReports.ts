/**
 * Hook für Besuchsberichte
 * 
 * Verwaltet Kundenbesuche mit GPS, Fotos und Checklisten.
 * Unterstützt Offline-Erstellung und spätere Synchronisierung.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity, type IdentityState } from "@/contexts/IdentityContext";
import { offlineStorage } from "@/lib/offlineStorage";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface VisitReport {
  id: string;
  tenant_id: string;
  user_id: string;
  customer_id: string | null;
  visit_date: string;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  notes: string | null;
  checklist_id: string | null;
  checklist_responses: Record<string, unknown>;
  status: "draft" | "submitted" | "reviewed";
  reviewed_by: string | null;
  reviewed_at: string | null;
  offline_id: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: {
    id: string;
    company_name: string;
    contact_name: string | null;
  } | null;
  photos?: VisitPhoto[];
}

export interface VisitPhoto {
  id: string;
  visit_report_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface CreateVisitReportInput {
  customer_id?: string;
  visit_date?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  notes?: string;
  checklist_id?: string;
  checklist_responses?: Record<string, unknown>;
  status?: "draft" | "submitted";
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

export function useVisitReports() {
  const queryClient = useQueryClient();
  const { identity } = useIdentity();
  const { userId, tenantId } = identity;
  const { isOnline } = useNetworkStatus();

  // Alle Berichte laden
  const reportsQuery = useQuery({
    queryKey: ["visit-reports", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_reports")
        .select(`
          *,
          customer:customers(id, company_name, contact_name)
        `)
        .order("visit_date", { ascending: false })
        .limit(100);

      if (error) {
        console.warn("[useVisitReports] Query error:", error.message);
        return [];
      }

      return (data || []) as VisitReport[];
    },
    enabled: !!userId && isOnline,
  });

  // Einzelnen Bericht laden
  const useReport = (reportId: string | undefined) => {
    return useQuery({
      queryKey: ["visit-report", reportId],
      queryFn: async () => {
        if (!reportId) return null;

        const { data, error } = await supabase
          .from("visit_reports")
          .select(`
            *,
            customer:customers(id, company_name, contact_name),
            photos:visit_photos(*)
          `)
          .eq("id", reportId)
          .maybeSingle();

        if (error) {
          console.warn("[useVisitReports] Single report error:", error.message);
          return null;
        }

        return data as VisitReport | null;
      },
      enabled: !!reportId && isOnline,
    });
  };

  // Bericht erstellen (mit Offline-Support)
  const createReport = useMutation({
    mutationFn: async (input: CreateVisitReportInput): Promise<string> => {
      if (!userId || !tenantId) {
        console.warn("[useVisitReports] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return "";
      }

      // Offline: Lokal speichern
      if (!isOnline) {
        const offlineId = await offlineStorage.addPendingVisit({
          customerId: input.customer_id ?? "",
          visitDate: input.visit_date || new Date().toISOString(),
          locationLat: input.location_lat ?? undefined,
          locationLng: input.location_lng ?? undefined,
          locationAddress: input.location_address ?? undefined,
          notes: input.notes ?? undefined,
          checklistId: input.checklist_id ?? undefined,
          checklistResponses: (input.checklist_responses || {}) as Record<string, unknown>,
        });
        toast.info("Besuchsbericht offline gespeichert");
        return offlineId;
      }

      // Online: Direkt in DB speichern
      const { data, error } = await supabase
        .from("visit_reports")
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          customer_id: input.customer_id || null,
          visit_date: input.visit_date || new Date().toISOString(),
          location_lat: input.location_lat || null,
          location_lng: input.location_lng || null,
          location_address: input.location_address || null,
          notes: input.notes || null,
          checklist_id: input.checklist_id || null,
          checklist_responses: (input.checklist_responses || {}) as Json,
          status: input.status || "draft",
        })
        .select("id")
        .single();

      if (error) {
        console.warn("[useVisitReports] Create error:", error);
        throw error;
      }
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit-reports"] });
      toast.success("Besuchsbericht erstellt");
    },
    onError: (error) => {
      console.error("[useVisitReports] Create error:", error);
      toast.error("Fehler beim Erstellen des Berichts");
    },
  });

  // Bericht aktualisieren
  const updateReport = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CreateVisitReportInput> & { id: string }) => {
      const { error } = await supabase
        .from("visit_reports")
        .update({
          ...updates,
          checklist_responses: updates.checklist_responses
            ? (updates.checklist_responses as Json)
            : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.warn("[useVisitReports] Update error:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visit-reports"] });
      queryClient.invalidateQueries({ queryKey: ["visit-report", variables.id] });
      toast.success("Besuchsbericht aktualisiert");
    },
    onError: (error) => {
      console.error("[useVisitReports] Update error:", error);
      toast.error("Fehler beim Aktualisieren");
    },
  });

  // Bericht einreichen
  const submitReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("visit_reports")
        .update({
          status: "submitted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: (_, reportId) => {
      queryClient.invalidateQueries({ queryKey: ["visit-reports"] });
      queryClient.invalidateQueries({ queryKey: ["visit-report", reportId] });
      toast.success("Besuchsbericht eingereicht");
    },
  });

  // Bericht löschen
  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("visit_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit-reports"] });
      toast.success("Besuchsbericht gelöscht");
    },
  });

  // GPS-Position erfassen
  const captureLocation = (): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation nicht unterstützt"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error("[useVisitReports] Geolocation error:", error);
          reject(new Error(getGeolocationErrorMessage(error)));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  // Reverse Geocoding (Adresse aus Koordinaten)
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      // Verwende Nominatim (OpenStreetMap) für Reverse Geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "de",
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.display_name || null;
    } catch (error) {
      console.warn("[useVisitReports] Reverse geocode failed:", error);
      return null;
    }
  };

  return {
    // Queries
    reports: reportsQuery.data || [],
    isLoading: reportsQuery.isLoading,
    isError: reportsQuery.isError,
    useReport,

    // Mutations
    createReport,
    updateReport,
    submitReport,
    deleteReport,

    // Utilities
    captureLocation,
    reverseGeocode,
    isOnline,
  };
}

// Helper: Geolocation Fehlermeldungen
function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Standortzugriff verweigert. Bitte erlauben Sie den Zugriff in den Browsereinstellungen.";
    case error.POSITION_UNAVAILABLE:
      return "Standort konnte nicht ermittelt werden.";
    case error.TIMEOUT:
      return "Zeitüberschreitung bei der Standortermittlung.";
    default:
      return "Unbekannter Fehler bei der Standortermittlung.";
  }
}
