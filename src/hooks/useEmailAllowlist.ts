// ============================================
// Email Allowlist Hook
// Prüft ob eine E-Mail zur Registrierung berechtigt ist
// ============================================

import { supabase } from "@/integrations/supabase/client";

interface EmailCheckResult {
  allowed: boolean;
  tenantId: string | null;
  role: string | null;
}

interface InviteValidationResult {
  valid: boolean;
  email: string | null;
  tenantId: string | null;
  role: string | null;
  companyName: string | null;
}

/**
 * Check if an email is allowed to register
 * Checks against tenant_allowed_emails and tenant_allowed_domains
 */
export async function checkEmailAllowed(email: string): Promise<EmailCheckResult> {
  try {
    const { data, error } = await supabase.rpc("check_email_allowed", {
      p_email: email.toLowerCase(),
    });

    if (error) {
      console.warn("[checkEmailAllowed] RPC error:", error);
      // Fallback: Allow registration to tenant_default
      return { allowed: true, tenantId: "tenant_default", role: "user" };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        allowed: result.allowed,
        tenantId: result.tenant_id,
        role: result.role,
      };
    }

    // Not in allowlist
    return { allowed: false, tenantId: null, role: null };
  } catch (error) {
    console.error("[checkEmailAllowed] Unexpected error:", error);
    // Fallback: Allow registration to tenant_default
    return { allowed: true, tenantId: "tenant_default", role: "user" };
  }
}

/**
 * Validate an invite token
 * Returns the associated email, tenant, and role if valid
 */
export async function validateInviteToken(token: string): Promise<InviteValidationResult> {
  try {
    const { data, error } = await supabase.rpc("validate_invite_token", {
      p_token: token,
    });

    if (error) {
      console.warn("[validateInviteToken] RPC error:", error);
      return { valid: false, email: null, tenantId: null, role: null, companyName: null };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        valid: result.valid,
        email: result.email,
        tenantId: result.tenant_id,
        role: result.role,
        companyName: result.company_name,
      };
    }

    return { valid: false, email: null, tenantId: null, role: null, companyName: null };
  } catch (error) {
    console.error("[validateInviteToken] Unexpected error:", error);
    return { valid: false, email: null, tenantId: null, role: null, companyName: null };
  }
}

/**
 * Get invite info from URL params
 */
export function getInviteFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("invite");
}
