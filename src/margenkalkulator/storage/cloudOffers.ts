// ============================================
// Cloud Offers Storage - Supabase Integration
// ============================================

import { supabase } from "@/integrations/supabase/client";
import type { OfferOptionState } from "../engine/types";
import type { OfferDraft } from "./types";

// Type for database row
interface SavedOfferRow {
  id: string;
  user_id: string;
  name: string;
  config: OfferOptionState;
  preview: OfferDraft["preview"] | null;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Convert DB row to OfferDraft format
 */
function rowToDraft(row: SavedOfferRow): OfferDraft {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    config: row.config,
    preview: row.preview || {
      hardware: "Unbekannt",
      tariff: "Unbekannt",
      avgMonthly: 0,
      quantity: 1,
    },
  };
}

/**
 * Create preview from config
 */
function createPreview(config: OfferOptionState, avgMonthly: number): OfferDraft["preview"] {
  return {
    hardware: config.hardware.name || "SIM Only",
    tariff: config.mobile.tariffId || "Kein Tarif",
    avgMonthly,
    quantity: config.mobile.quantity,
  };
}

/**
 * Load all offers from cloud for current user
 */
export async function loadCloudOffers(): Promise<OfferDraft[]> {
  const { data, error } = await supabase
    .from("saved_offers")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to load cloud offers:", error);
    throw new Error("Laden fehlgeschlagen: " + error.message);
  }

  return (data || []).map((row) => rowToDraft(row as unknown as SavedOfferRow));
}

/**
 * Create new offer in cloud
 */
export async function createCloudOffer(
  name: string,
  config: OfferOptionState,
  avgMonthly: number
): Promise<OfferDraft> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("Nicht eingeloggt");
  }

  const preview = createPreview(config, avgMonthly);

  const { data, error } = await supabase
    .from("saved_offers")
    .insert({
      user_id: userData.user.id,
      name,
      config: JSON.parse(JSON.stringify(config)),
      preview: JSON.parse(JSON.stringify(preview)),
      is_draft: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create cloud offer:", error);
    throw new Error("Speichern fehlgeschlagen: " + error.message);
  }

  return rowToDraft(data as unknown as SavedOfferRow);
}

/**
 * Update existing offer in cloud
 */
export async function updateCloudOffer(
  id: string,
  config: OfferOptionState,
  avgMonthly: number
): Promise<OfferDraft> {
  const preview = createPreview(config, avgMonthly);

  const { data, error } = await supabase
    .from("saved_offers")
    .update({
      config: JSON.parse(JSON.stringify(config)),
      preview: JSON.parse(JSON.stringify(preview)),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update cloud offer:", error);
    throw new Error("Aktualisieren fehlgeschlagen: " + error.message);
  }

  return rowToDraft(data as unknown as SavedOfferRow);
}

/**
 * Delete offer from cloud
 */
export async function deleteCloudOffer(id: string): Promise<void> {
  const { error } = await supabase
    .from("saved_offers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete cloud offer:", error);
    throw new Error("Löschen fehlgeschlagen: " + error.message);
  }
}

/**
 * Rename offer in cloud
 */
export async function renameCloudOffer(id: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from("saved_offers")
    .update({ name: newName })
    .eq("id", id);

  if (error) {
    console.error("Failed to rename cloud offer:", error);
    throw new Error("Umbenennen fehlgeschlagen: " + error.message);
  }
}

/**
 * Check if user has any cloud offers
 */
export async function hasCloudOffers(): Promise<boolean> {
  const { count, error } = await supabase
    .from("saved_offers")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Failed to check cloud offers:", error);
    return false;
  }

  return (count || 0) > 0;
}
