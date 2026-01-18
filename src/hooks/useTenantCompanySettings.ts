// ============================================
// Hook: Tenant Company Settings
// Lädt/speichert Unternehmens-, Rechnungs- und Kontaktinformationen
// ============================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

export interface CompanyInfo {
  name: string;
  street: string;
  zip: string;
  city: string;
  phone: string;
  email: string;
  website: string;
}

export interface BillingInfo {
  ustId: string;
  taxNumber: string;
  bankName: string;
  iban: string;
  bic: string;
  registrationCourt: string;
  registrationNumber: string;
}

export interface PdfContact {
  name: string;
  position: string;
  email: string;
  phone: string;
}

export interface TenantCompanySettings {
  companyInfo: CompanyInfo;
  billingInfo: BillingInfo;
  pdfContact: PdfContact;
}

// ============================================
// Default Values
// ============================================

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "",
  street: "",
  zip: "",
  city: "",
  phone: "",
  email: "",
  website: "",
};

const DEFAULT_BILLING_INFO: BillingInfo = {
  ustId: "",
  taxNumber: "",
  bankName: "",
  iban: "",
  bic: "",
  registrationCourt: "",
  registrationNumber: "",
};

const DEFAULT_PDF_CONTACT: PdfContact = {
  name: "",
  position: "",
  email: "",
  phone: "",
};

const DEFAULT_SETTINGS: TenantCompanySettings = {
  companyInfo: DEFAULT_COMPANY_INFO,
  billingInfo: DEFAULT_BILLING_INFO,
  pdfContact: DEFAULT_PDF_CONTACT,
};

// ============================================
// Hook
// ============================================

export function useTenantCompanySettings() {
  const { identity } = useIdentity();
  const [settings, setSettings] = useState<TenantCompanySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!identity.tenantId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("tenant_settings")
          .select("company_info, billing_info, pdf_contact")
          .eq("tenant_id", identity.tenantId)
          .maybeSingle();

        if (fetchError) {
          console.error("Error loading company settings:", fetchError);
          setError(fetchError.message);
          return;
        }

        if (data) {
          setSettings({
            companyInfo: {
              ...DEFAULT_COMPANY_INFO,
              ...(typeof data.company_info === "object" ? data.company_info : {}),
            } as CompanyInfo,
            billingInfo: {
              ...DEFAULT_BILLING_INFO,
              ...(typeof data.billing_info === "object" ? data.billing_info : {}),
            } as BillingInfo,
            pdfContact: {
              ...DEFAULT_PDF_CONTACT,
              ...(typeof data.pdf_contact === "object" ? data.pdf_contact : {}),
            } as PdfContact,
          });
        }
      } catch (err) {
        console.error("Error loading company settings:", err);
        setError("Fehler beim Laden der Einstellungen");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [identity.tenantId]);

  // Save settings
  const saveSettings = useCallback(
    async (newSettings: Partial<TenantCompanySettings>) => {
      if (!identity.tenantId || !identity.userId) {
        toast.error("Keine Berechtigung zum Speichern");
        return false;
      }

      try {
        setIsSaving(true);
        setError(null);

        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
          updated_by: identity.userId,
        };

        if (newSettings.companyInfo) {
          updateData.company_info = newSettings.companyInfo;
        }
        if (newSettings.billingInfo) {
          updateData.billing_info = newSettings.billingInfo;
        }
        if (newSettings.pdfContact) {
          updateData.pdf_contact = newSettings.pdfContact;
        }

        const { error: upsertError } = await supabase
          .from("tenant_settings")
          .upsert(
            {
              tenant_id: identity.tenantId,
              ...updateData,
            },
            { onConflict: "tenant_id" }
          );

        if (upsertError) {
          console.error("Error saving company settings:", upsertError);
          toast.error("Fehler beim Speichern");
          setError(upsertError.message);
          return false;
        }

        // Update local state
        setSettings((prev) => ({
          ...prev,
          ...newSettings,
        }));

        toast.success("Einstellungen gespeichert");
        return true;
      } catch (err) {
        console.error("Error saving company settings:", err);
        toast.error("Fehler beim Speichern");
        setError("Fehler beim Speichern der Einstellungen");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [identity.tenantId, identity.userId]
  );

  // Update single field helpers
  const updateCompanyInfo = useCallback(
    (updates: Partial<CompanyInfo>) => {
      const newCompanyInfo = { ...settings.companyInfo, ...updates };
      setSettings((prev) => ({ ...prev, companyInfo: newCompanyInfo }));
    },
    [settings.companyInfo]
  );

  const updateBillingInfo = useCallback(
    (updates: Partial<BillingInfo>) => {
      const newBillingInfo = { ...settings.billingInfo, ...updates };
      setSettings((prev) => ({ ...prev, billingInfo: newBillingInfo }));
    },
    [settings.billingInfo]
  );

  const updatePdfContact = useCallback(
    (updates: Partial<PdfContact>) => {
      const newPdfContact = { ...settings.pdfContact, ...updates };
      setSettings((prev) => ({ ...prev, pdfContact: newPdfContact }));
    },
    [settings.pdfContact]
  );

  return {
    settings,
    isLoading,
    isSaving,
    error,
    saveSettings,
    updateCompanyInfo,
    updateBillingInfo,
    updatePdfContact,
  };
}
