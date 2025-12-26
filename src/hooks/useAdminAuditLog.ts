import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AdminAction =
  | "role_change"
  | "mfa_disable"
  | "mfa_enable"
  | "policy_change"
  | "ip_block"
  | "ip_unblock"
  | "dataset_approve"
  | "dataset_reject"
  | "settings_change"
  | "user_delete"
  | "threat_feed_toggle"
  | "security_scan_trigger"
  | "backup_codes_regenerate";

interface AuditLogParams {
  action: AdminAction;
  targetTable?: string;
  targetId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

// Simple hash function for fingerprinting
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 12);
}

function getClientFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ];
  return hashString(components.join("|"));
}

function getUserAgentHash(): string {
  return hashString(navigator.userAgent);
}

export function useAdminAuditLog() {
  const { user } = useAuth();

  const logAdminAction = useCallback(
    async ({
      action,
      targetTable,
      targetId,
      oldValues,
      newValues,
    }: AuditLogParams): Promise<boolean> => {
      if (!user) {
        console.warn("Cannot log admin action: No user logged in");
        return false;
      }

      try {
        const { error } = await supabase.from("admin_audit_log").insert([{
          admin_id: user.id,
          action,
          target_table: targetTable ?? null,
          target_id: targetId ?? null,
          old_values: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
          new_values: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
          ip_hash: getClientFingerprint(),
          user_agent_hash: getUserAgentHash(),
        }]);

        if (error) {
          console.error("Failed to log admin action:", error);
          return false;
        }

        console.log(`Admin action logged: ${action}`, {
          targetTable,
          targetId,
        });
        return true;
      } catch (err) {
        console.error("Error logging admin action:", err);
        return false;
      }
    },
    [user]
  );

  const getRecentAuditLogs = useCallback(
    async (limit = 50) => {
      try {
        const { data, error } = await supabase
          .from("admin_audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
        return [];
      }
    },
    []
  );

  const getAuditLogsByAdmin = useCallback(
    async (adminId: string, limit = 50) => {
      try {
        const { data, error } = await supabase
          .from("admin_audit_log")
          .select("*")
          .eq("admin_id", adminId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Failed to fetch admin audit logs:", err);
        return [];
      }
    },
    []
  );

  return {
    logAdminAction,
    getRecentAuditLogs,
    getAuditLogsByAdmin,
  };
}

// Action descriptions for UI display
export function formatAdminAction(action: AdminAction): string {
  const descriptions: Record<AdminAction, string> = {
    role_change: "Benutzerrolle geändert",
    mfa_disable: "MFA deaktiviert",
    mfa_enable: "MFA aktiviert",
    policy_change: "Richtlinie geändert",
    ip_block: "IP-Adresse blockiert",
    ip_unblock: "IP-Adresse entsperrt",
    dataset_approve: "Dataset genehmigt",
    dataset_reject: "Dataset abgelehnt",
    settings_change: "Einstellungen geändert",
    user_delete: "Benutzer gelöscht",
    threat_feed_toggle: "Threat-Feed umgeschaltet",
    security_scan_trigger: "Sicherheitsscan ausgelöst",
    backup_codes_regenerate: "Backup-Codes neu generiert",
  };
  return descriptions[action] || action;
}
