/**
 * Activity Tracker Hook
 * 
 * Zentraler Hook für das Tracking aller Benutzeraktivitäten.
 * Speichert Activities in der user_activity_log Tabelle.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";

// =====================================================
// Types
// =====================================================

export type ActivityAction = 
  // Offer Actions
  | "offer_create"
  | "offer_update"
  | "offer_delete"
  | "offer_view"
  | "offer_export"
  | "offer_rename"
  // Customer Actions
  | "customer_create"
  | "customer_update"
  | "customer_delete"
  | "customer_import"
  | "customer_view"
  // Template Actions
  | "template_create"
  | "template_update"
  | "template_delete"
  | "template_use"
  | "template_duplicate"
  | "template_move"
  // Draft Actions
  | "draft_create"
  | "draft_update"
  | "draft_restore"
  | "draft_delete"
  // Settings Actions
  | "settings_change"
  | "dataset_import"
  // Export Actions
  | "pdf_export"
  | "csv_export"
  // Auth Actions
  | "login"
  | "logout"
  // Folder Actions
  | "folder_create"
  | "folder_rename"
  | "folder_delete";

export type ResourceType = 
  | "offer"
  | "customer"
  | "template"
  | "draft"
  | "folder"
  | "settings"
  | "dataset"
  | "pdf"
  | "csv"
  | "session";

export interface ActivityParams {
  action: ActivityAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceName?: string;
  summary?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  tenant_id: string;
  department_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  summary: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// =====================================================
// Hook
// =====================================================

export function useActivityTracker() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  
  /**
   * Hauptfunktion zum Tracken von Aktivitäten
   */
  const trackActivity = useCallback(async (params: ActivityParams): Promise<boolean> => {
    if (!user?.id) {
      console.warn("[ActivityTracker] No user authenticated, skipping activity tracking");
      return false;
    }
    
    try {
      // Use type assertion since user_activity_log is a new table
      const { error } = await supabase
        .from("user_activity_log" as any)
        .insert({
          user_id: user.id,
          tenant_id: identity.tenantId,
          department_id: identity.departmentId || null,
          action: params.action,
          resource_type: params.resourceType,
          resource_id: params.resourceId || null,
          resource_name: params.resourceName || null,
          summary: params.summary || null,
          old_values: params.oldValues || null,
          new_values: params.newValues || null,
          metadata: params.metadata || {},
        } as any);
      
      if (error) {
        console.error("[ActivityTracker] Failed to track activity:", error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("[ActivityTracker] Error:", error);
      return false;
    }
  }, [user?.id, identity.tenantId, identity.departmentId]);

  // =====================================================
  // Convenience Methods - Offers
  // =====================================================

  const trackOfferCreated = useCallback(
    (offerId: string, offerName: string, metadata?: Record<string, unknown>) => 
      trackActivity({
        action: "offer_create",
        resourceType: "offer",
        resourceId: offerId,
        resourceName: offerName,
        summary: `Angebot "${offerName}" erstellt`,
        metadata,
      }),
    [trackActivity]
  );

  const trackOfferUpdated = useCallback(
    (offerId: string, offerName: string, changes?: Record<string, unknown>) => 
      trackActivity({
        action: "offer_update",
        resourceType: "offer",
        resourceId: offerId,
        resourceName: offerName,
        summary: `Angebot "${offerName}" aktualisiert`,
        newValues: changes,
      }),
    [trackActivity]
  );

  const trackOfferDeleted = useCallback(
    (offerId: string, offerName: string) => 
      trackActivity({
        action: "offer_delete",
        resourceType: "offer",
        resourceId: offerId,
        resourceName: offerName,
        summary: `Angebot "${offerName}" gelöscht`,
      }),
    [trackActivity]
  );

  const trackOfferRenamed = useCallback(
    (offerId: string, oldName: string, newName: string) => 
      trackActivity({
        action: "offer_rename",
        resourceType: "offer",
        resourceId: offerId,
        resourceName: newName,
        summary: `Angebot umbenannt: "${oldName}" → "${newName}"`,
        oldValues: { name: oldName },
        newValues: { name: newName },
      }),
    [trackActivity]
  );

  // =====================================================
  // Convenience Methods - Customers
  // =====================================================

  const trackCustomerCreated = useCallback(
    (customerId: string, customerName: string) => 
      trackActivity({
        action: "customer_create",
        resourceType: "customer",
        resourceId: customerId,
        resourceName: customerName,
        summary: `Kunde "${customerName}" erstellt`,
      }),
    [trackActivity]
  );

  const trackCustomerUpdated = useCallback(
    (customerId: string, customerName: string, changes?: Record<string, unknown>) => 
      trackActivity({
        action: "customer_update",
        resourceType: "customer",
        resourceId: customerId,
        resourceName: customerName,
        summary: `Kunde "${customerName}" aktualisiert`,
        newValues: changes,
      }),
    [trackActivity]
  );

  const trackCustomerDeleted = useCallback(
    (customerId: string, customerName: string) => 
      trackActivity({
        action: "customer_delete",
        resourceType: "customer",
        resourceId: customerId,
        resourceName: customerName,
        summary: `Kunde "${customerName}" gelöscht`,
      }),
    [trackActivity]
  );

  const trackCustomerImport = useCallback(
    (importedCount: number, source: string) => 
      trackActivity({
        action: "customer_import",
        resourceType: "customer",
        summary: `${importedCount} Kunden aus ${source} importiert`,
        metadata: { count: importedCount, source },
      }),
    [trackActivity]
  );

  // =====================================================
  // Convenience Methods - Templates
  // =====================================================

  const trackTemplateCreated = useCallback(
    (templateId: string, templateName: string) => 
      trackActivity({
        action: "template_create",
        resourceType: "template",
        resourceId: templateId,
        resourceName: templateName,
        summary: `Vorlage "${templateName}" erstellt`,
      }),
    [trackActivity]
  );

  const trackTemplateUsed = useCallback(
    (templateId: string, templateName: string) => 
      trackActivity({
        action: "template_use",
        resourceType: "template",
        resourceId: templateId,
        resourceName: templateName,
        summary: `Vorlage "${templateName}" verwendet`,
      }),
    [trackActivity]
  );

  const trackTemplateDeleted = useCallback(
    (templateId: string, templateName: string) => 
      trackActivity({
        action: "template_delete",
        resourceType: "template",
        resourceId: templateId,
        resourceName: templateName,
        summary: `Vorlage "${templateName}" gelöscht`,
      }),
    [trackActivity]
  );

  const trackTemplateDuplicated = useCallback(
    (templateId: string, templateName: string, newName: string) => 
      trackActivity({
        action: "template_duplicate",
        resourceType: "template",
        resourceId: templateId,
        resourceName: newName,
        summary: `Vorlage "${templateName}" dupliziert als "${newName}"`,
        metadata: { originalName: templateName },
      }),
    [trackActivity]
  );

  // =====================================================
  // Convenience Methods - Drafts
  // =====================================================

  const trackDraftCreated = useCallback(
    (draftId: string, draftName: string) => 
      trackActivity({
        action: "draft_create",
        resourceType: "draft",
        resourceId: draftId,
        resourceName: draftName,
        summary: `Entwurf "${draftName}" gespeichert`,
      }),
    [trackActivity]
  );

  const trackDraftRestored = useCallback(
    (draftId: string, draftName: string) => 
      trackActivity({
        action: "draft_restore",
        resourceType: "draft",
        resourceId: draftId,
        resourceName: draftName,
        summary: `Entwurf "${draftName}" wiederhergestellt`,
      }),
    [trackActivity]
  );

  const trackDraftDeleted = useCallback(
    (draftId: string, draftName: string) => 
      trackActivity({
        action: "draft_delete",
        resourceType: "draft",
        resourceId: draftId,
        resourceName: draftName,
        summary: `Entwurf "${draftName}" gelöscht`,
      }),
    [trackActivity]
  );

  // =====================================================
  // Convenience Methods - Exports
  // =====================================================

  const trackPdfExported = useCallback(
    (offerId: string, offerName: string) => 
      trackActivity({
        action: "pdf_export",
        resourceType: "pdf",
        resourceId: offerId,
        resourceName: offerName,
        summary: `PDF für "${offerName}" exportiert`,
      }),
    [trackActivity]
  );

  const trackCsvExported = useCallback(
    (resourceType: ResourceType, count: number) => 
      trackActivity({
        action: "csv_export",
        resourceType: "csv",
        summary: `CSV-Export: ${count} ${resourceType === "customer" ? "Kunden" : "Einträge"}`,
        metadata: { exportedCount: count, exportedType: resourceType },
      }),
    [trackActivity]
  );

  // =====================================================
  // Convenience Methods - Settings & Data
  // =====================================================

  const trackSettingsChanged = useCallback(
    (settingName: string, oldValue?: unknown, newValue?: unknown) => 
      trackActivity({
        action: "settings_change",
        resourceType: "settings",
        resourceName: settingName,
        summary: `Einstellung "${settingName}" geändert`,
        oldValues: oldValue !== undefined ? { [settingName]: oldValue } : undefined,
        newValues: newValue !== undefined ? { [settingName]: newValue } : undefined,
      }),
    [trackActivity]
  );

  const trackDatasetImported = useCallback(
    (datasetType: string, itemCount: number) => 
      trackActivity({
        action: "dataset_import",
        resourceType: "dataset",
        resourceName: datasetType,
        summary: `${datasetType}: ${itemCount} Einträge importiert`,
        metadata: { type: datasetType, count: itemCount },
      }),
    [trackActivity]
  );

  // =====================================================
  // Convenience Methods - Folders
  // =====================================================

  const trackFolderCreated = useCallback(
    (folderId: string, folderName: string) => 
      trackActivity({
        action: "folder_create",
        resourceType: "folder",
        resourceId: folderId,
        resourceName: folderName,
        summary: `Ordner "${folderName}" erstellt`,
      }),
    [trackActivity]
  );

  const trackFolderRenamed = useCallback(
    (folderId: string, oldName: string, newName: string) => 
      trackActivity({
        action: "folder_rename",
        resourceType: "folder",
        resourceId: folderId,
        resourceName: newName,
        summary: `Ordner umbenannt: "${oldName}" → "${newName}"`,
        oldValues: { name: oldName },
        newValues: { name: newName },
      }),
    [trackActivity]
  );

  const trackFolderDeleted = useCallback(
    (folderId: string, folderName: string) => 
      trackActivity({
        action: "folder_delete",
        resourceType: "folder",
        resourceId: folderId,
        resourceName: folderName,
        summary: `Ordner "${folderName}" gelöscht`,
      }),
    [trackActivity]
  );

  return {
    // Core function
    trackActivity,
    
    // Offer methods
    trackOfferCreated,
    trackOfferUpdated,
    trackOfferDeleted,
    trackOfferRenamed,
    
    // Customer methods
    trackCustomerCreated,
    trackCustomerUpdated,
    trackCustomerDeleted,
    trackCustomerImport,
    
    // Template methods
    trackTemplateCreated,
    trackTemplateUsed,
    trackTemplateDeleted,
    trackTemplateDuplicated,
    
    // Draft methods
    trackDraftCreated,
    trackDraftRestored,
    trackDraftDeleted,
    
    // Export methods
    trackPdfExported,
    trackCsvExported,
    
    // Settings & Data methods
    trackSettingsChanged,
    trackDatasetImported,
    
    // Folder methods
    trackFolderCreated,
    trackFolderRenamed,
    trackFolderDeleted,
  };
}
