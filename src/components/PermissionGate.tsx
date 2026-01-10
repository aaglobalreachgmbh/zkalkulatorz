// ============================================
// PermissionGate - Schützt Inhalte basierend auf Berechtigungen
// ============================================

import { ReactNode } from "react";
import { usePermissions, UserPermissions } from "@/hooks/usePermissions";
import { AccessDeniedCard } from "./AccessDeniedCard";
import { Loader2 } from "lucide-react";

// Typen für die verschiedenen Berechtigungsprüfungen
type PermissionKey = 
  | "canUseCalculator"
  | "canCreateOffers"
  | "canViewMargins"
  | "canExportPdf"
  | "canManageCustomers"
  | "canViewReporting"
  | "canViewTeam"
  | "canUseInbox"
  | "canUseBundles";

interface PermissionGateProps {
  /** Die zu prüfende Berechtigung */
  permission?: PermissionKey;
  /** Alternativ: Prüft ob ein bestimmter Menüpunkt erlaubt ist */
  menuId?: string;
  /** Der geschützte Inhalt */
  children: ReactNode;
  /** Optionaler Custom-Fallback wenn keine Berechtigung */
  fallback?: ReactNode;
  /** Custom Titel für "Kein Zugriff"-Karte */
  deniedTitle?: string;
  /** Custom Beschreibung für "Kein Zugriff"-Karte */
  deniedDescription?: string;
}

/**
 * PermissionGate - Wrapper-Komponente für Berechtigungsprüfungen
 * 
 * Verwendung:
 * ```tsx
 * <PermissionGate permission="canViewReporting">
 *   <ReportingContent />
 * </PermissionGate>
 * ```
 * 
 * Oder mit menuId:
 * ```tsx
 * <PermissionGate menuId="bundles">
 *   <BundlesContent />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  menuId,
  children,
  fallback,
  deniedTitle,
  deniedDescription,
}: PermissionGateProps) {
  const permissions = usePermissions();

  // Loading-State
  if (permissions.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Admins und Tenant-Admins haben immer Zugriff
  if (permissions.hasFullAccess) {
    return <>{children}</>;
  }

  // Prüfe Berechtigung
  let hasPermission = true;

  if (menuId) {
    hasPermission = permissions.canAccessMenu(menuId);
  } else if (permission) {
    hasPermission = permissions[permission] === true;
  }

  // Kein Zugriff
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AccessDeniedCard 
        title={deniedTitle}
        description={deniedDescription}
      />
    );
  }

  return <>{children}</>;
}

/**
 * Hook-basierte Variante für mehr Flexibilität
 * 
 * Verwendung:
 * ```tsx
 * const { hasAccess, isLoading } = usePermissionCheck("canViewReporting");
 * if (isLoading) return <Loading />;
 * if (!hasAccess) return <AccessDenied />;
 * return <Content />;
 * ```
 */
export function usePermissionCheck(
  permission?: PermissionKey,
  menuId?: string
): { hasAccess: boolean; isLoading: boolean; permissions: UserPermissions } {
  const permissions = usePermissions();

  if (permissions.isLoading) {
    return { hasAccess: false, isLoading: true, permissions };
  }

  // Admins haben immer Zugriff
  if (permissions.hasFullAccess) {
    return { hasAccess: true, isLoading: false, permissions };
  }

  let hasAccess = true;

  if (menuId) {
    hasAccess = permissions.canAccessMenu(menuId);
  } else if (permission) {
    hasAccess = permissions[permission] === true;
  }

  return { hasAccess, isLoading: false, permissions };
}
