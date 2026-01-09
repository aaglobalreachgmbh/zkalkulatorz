// ============================================
// Shared Offers Hook - DSGVO Compliant Sharing
// ============================================

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateOfferId, generateAccessToken, generateOfferQrCode } from "../utils/qrCodeGenerator";
import { toast } from "sonner";

export interface SharedOfferData {
  // Customer-visible data only
  customerName?: string;
  customerEmail?: string;
  tariffName?: string;
  hardwareName?: string;
  monthlyPrice?: number;
  oneTimePrice?: number;
  contractLength?: number;
  offerItems?: Array<{
    type: 'mobile' | 'hardware' | 'fixednet';
    name: string;
    quantity: number;
    monthlyPrice: number;
    oneTimePrice?: number;
  }>;
  validDays: number;
  createdAt: string;
}

export interface SaveSharedOfferResult {
  success: boolean;
  offerId?: string;
  accessToken?: string;
  qrCodeDataUrl?: string;
  shareUrl?: string;
  expiresAt?: Date;
  error?: string;
}

export interface SharedOffer {
  id: string;
  offer_id: string;
  customer_name: string | null;
  offer_data: SharedOfferData;
  expires_at: string;
  valid_days: number;
  view_count: number;
  is_revoked: boolean;
  created_at: string;
}

export function useSharedOffers() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  /**
   * Saves an offer for public sharing (QR code access)
   * IMPORTANT: Only customer-visible data, NO dealer/margin info!
   */
  const saveSharedOffer = useCallback(async (
    offerData: SharedOfferData,
    customerName?: string,
    customerEmail?: string
  ): Promise<SaveSharedOfferResult> => {
    if (!user) {
      return { success: false, error: "Nicht authentifiziert" };
    }

    setIsSaving(true);
    
    try {
      const offerId = generateOfferId();
      const accessToken = generateAccessToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + offerData.validDays);
      
      // Generate QR code
      const qrCodeDataUrl = await generateOfferQrCode(offerId, accessToken);
      
      // Build share URL
      const shareUrl = `${window.location.origin}/share/offer/${encodeURIComponent(offerId)}?token=${encodeURIComponent(accessToken)}`;
      
      // Save to database (only customer-visible data!)
      const { error } = await supabase
        .from("shared_offers")
        .insert([{
          offer_id: offerId,
          access_token: accessToken,
          customer_name: customerName || null,
          customer_email: customerEmail || null,
          offer_data: JSON.parse(JSON.stringify(offerData)),
          valid_days: offerData.validDays,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
          gdpr_notice_accepted: true,
        }]);

      if (error) {
        console.error("[useSharedOffers] Save error:", error);
        toast.error("Angebot konnte nicht gespeichert werden");
        return { success: false, error: error.message };
      }

      return {
        success: true,
        offerId,
        accessToken,
        qrCodeDataUrl,
        shareUrl,
        expiresAt,
      };
    } catch (err: any) {
      console.error("[useSharedOffers] Unexpected error:", err);
      toast.error("Fehler beim Speichern des Angebots");
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  /**
   * Gets a shared offer by ID and token (public access)
   */
  const getSharedOffer = useCallback(async (
    offerId: string, 
    accessToken: string
  ): Promise<SharedOffer | null> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .rpc("get_shared_offer_public", {
          p_offer_id: offerId,
          p_access_token: accessToken,
        });

      if (error) {
        console.error("[useSharedOffers] Fetch error:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const row = data[0];
      return {
        id: row.id,
        offer_id: row.offer_id,
        customer_name: row.customer_name,
        offer_data: row.offer_data as unknown as SharedOfferData,
        expires_at: row.expires_at,
        valid_days: row.valid_days,
        view_count: row.view_count,
        is_revoked: false,
        created_at: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("[useSharedOffers] Unexpected error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Revokes a shared offer (soft delete)
   */
  const revokeSharedOffer = useCallback(async (offerId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("shared_offers")
        .update({ is_revoked: true })
        .eq("offer_id", offerId)
        .eq("created_by", user.id);

      if (error) {
        console.error("[useSharedOffers] Revoke error:", error);
        toast.error("Angebot konnte nicht widerrufen werden");
        return false;
      }

      toast.success("Angebot wurde widerrufen");
      return true;
    } catch (err: any) {
      console.error("[useSharedOffers] Unexpected error:", err);
      return false;
    }
  }, [user]);

  /**
   * Gets all shared offers for the current user
   */
  const getMySharedOffers = useCallback(async (): Promise<SharedOffer[]> => {
    if (!user) return [];

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("shared_offers")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useSharedOffers] List error:", error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        offer_id: row.offer_id,
        customer_name: row.customer_name,
        offer_data: row.offer_data as unknown as SharedOfferData,
        expires_at: row.expires_at,
        valid_days: row.valid_days ?? 14,
        view_count: row.view_count ?? 0,
        is_revoked: row.is_revoked || false,
        created_at: row.created_at,
      }));
    } catch (err: any) {
      console.error("[useSharedOffers] Unexpected error:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    saveSharedOffer,
    getSharedOffer,
    revokeSharedOffer,
    getMySharedOffers,
    isSaving,
    isLoading,
  };
}
