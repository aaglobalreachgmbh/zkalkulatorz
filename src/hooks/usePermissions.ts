// ============================================
// Zentraler Berechtigungs-Hook
// Kombiniert Rollen + employee_settings für granulare Kontrolle
// ============================================

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { useIdentity } from "@/contexts/IdentityContext";

// ============================================
// Menüpunkt-IDs für Navigation
// ============================================
export const MENU_ITEMS = {
  // Tagesgeschäft
  calculator: { id: "calculator", label: "Kalkulator", category: "daily" },
  offers: { id: "offers", label: "Angebote", category: "daily" },
  customers: { id: "customers", label: "Kunden", category: "daily" },
  contracts: { id: "contracts", label: "Verträge", category: "daily" },
  
  // Werkzeuge
  calendar: { id: "calendar", label: "Kalender", category: "tools" },
  news: { id: "news", label: "News & Aktionen", category: "tools" },
  bundles: { id: "bundles", label: "Bundles", category: "tools" },
  inbox: { id: "inbox", label: "Posteingang", category: "tools" },
  
  // Auswertungen
  reporting: { id: "reporting", label: "Auswertungen", category: "analytics" },
  team: { id: "team", label: "Team", category: "analytics" },
} as const;

export type MenuItemId = keyof typeof MENU_ITEMS;

// ============================================
// Default-Berechtigungen für neue Mitarbeiter
// ============================================
export const DEFAULT_ALLOWED_MENUS: MenuItemId[] = [
  "calculator",
  "offers", 
  "customers",
  "contracts",
  "calendar",
  "news",
];

// ============================================
// Interface für Berechtigungen
// ============================================
export interface UserPermissions {
  // Laden-Status
  isLoading: boolean;
  
  // Rollen-basiert
  isAdmin: boolean;
  isTenantAdmin: boolean;
  isModerator: boolean;
  
  // Funktions-Berechtigungen
  canUseCalculator: boolean;
  canCreateOffers: boolean;
  canViewMargins: boolean;
  canExportPdf: boolean;
  canManageCustomers: boolean;
  canViewReporting: boolean;
  canViewTeam: boolean;
  canUseInbox: boolean;
  canUseBundles: boolean;
  
  // Sichtbare Menüpunkte
  allowedMenuItems: string[];
  
  // Helper-Funktionen
  canAccessMenu: (menuId: string) => boolean;
  hasFullAccess: boolean;
}

// ============================================
// Main Hook
// ============================================
export function usePermissions(): UserPermissions {
  const { user } = useAuth();
  const { isAdmin, isTenantAdmin, isModerator, isLoading: roleLoading } = useUserRole();
  const { identity, isSupabaseAuth } = useIdentity();
  
  // Fetch employee_settings für den aktuellen User
  const { data: employeeSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["employee-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("employee_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.warn("[usePermissions] Failed to load settings:", error.message);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id && isSupabaseAuth,
    staleTime: 1000 * 60 * 5, // 5 Minuten cache
  });
  
  // Berechne die finalen Berechtigungen
  const permissions = useMemo<UserPermissions>(() => {
    const isLoading = roleLoading || settingsLoading;
    
    // Admins und Tenant-Admins haben IMMER volle Rechte
    const hasFullAccess = isAdmin || isTenantAdmin;
    
    // Extrahiere Settings oder nutze Defaults
    const settings = employeeSettings as Record<string, unknown> | null;
    
    // Menüpunkte: Admin/TenantAdmin sehen alles, sonst aus Settings
    const allowedMenuItems = hasFullAccess 
      ? Object.keys(MENU_ITEMS)
      : (settings?.allowed_menu_items as string[] | null) || DEFAULT_ALLOWED_MENUS;
    
    // Berechtigungs-Checks
    const canUseCalculator = hasFullAccess || ((settings?.can_use_calculator as boolean | null) ?? true);
    const canCreateOffers = hasFullAccess || ((settings?.can_create_offers as boolean | null) ?? true);
    const canViewMargins = hasFullAccess || ((settings?.can_view_margins as boolean | null) ?? false);
    const canExportPdf = hasFullAccess || ((settings?.can_export_pdf as boolean | null) ?? false);
    const canManageCustomers = hasFullAccess || ((settings?.can_manage_customers as boolean | null) ?? true);
    const canViewReporting = hasFullAccess || ((settings?.can_view_reporting as boolean | null) ?? false);
    const canViewTeam = hasFullAccess || ((settings?.can_view_team as boolean | null) ?? false);
    const canUseInbox = hasFullAccess || ((settings?.can_use_inbox as boolean | null) ?? false);
    const canUseBundles = hasFullAccess || ((settings?.can_use_bundles as boolean | null) ?? false);
    
    // Helper: Prüft ob ein Menüpunkt sichtbar ist
    const canAccessMenu = (menuId: string): boolean => {
      if (hasFullAccess) return true;
      return allowedMenuItems.includes(menuId);
    };
    
    return {
      isLoading,
      isAdmin,
      isTenantAdmin,
      isModerator,
      canUseCalculator,
      canCreateOffers,
      canViewMargins,
      canExportPdf,
      canManageCustomers,
      canViewReporting,
      canViewTeam,
      canUseInbox,
      canUseBundles,
      allowedMenuItems,
      canAccessMenu,
      hasFullAccess,
    };
  }, [
    roleLoading,
    settingsLoading,
    isAdmin,
    isTenantAdmin,
    isModerator,
    employeeSettings,
  ]);
  
  return permissions;
}

// ============================================
// Hook um Berechtigungen eines anderen Users zu laden (für Admin-Dashboard)
// ============================================
export function useEmployeePermissions(userId: string | null) {
  return useQuery({
    queryKey: ["employee-permissions", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("employee_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.warn("[useEmployeePermissions] Failed:", error.message);
        return null;
      }
      
      // Ensure allowed_menu_items is an array
      return {
        ...data,
        allowed_menu_items: (data?.allowed_menu_items as string[] | null) || DEFAULT_ALLOWED_MENUS,
        can_use_calculator: data?.can_use_calculator ?? true,
        can_create_offers: data?.can_create_offers ?? true,
        can_view_margins: data?.can_view_margins ?? false,
        can_export_pdf: data?.can_export_pdf ?? false,
        can_manage_customers: data?.can_manage_customers ?? true,
        can_view_reporting: data?.can_view_reporting ?? false,
        can_view_team: data?.can_view_team ?? false,
        can_use_inbox: data?.can_use_inbox ?? false,
        can_use_bundles: data?.can_use_bundles ?? false,
      };
    },
    enabled: !!userId,
  });
}
