import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

/**
 * Logs a critical action to the audit_logs table.
 * @param action Description of action (e.g. 'USER_ROLE_UPDATE')
 * @param target Identifier of affected object (e.g. user_id: '123')
 * @param metadata Additional context
 */
export async function logAudit(action: string, target?: string, metadata: Record<string, any> = {}) {
    try {
        const supabase = await createClient();

        // Get Actor
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Anonymous actions logic?

        // Get IP (best effort)
        const headerStore = await headers();
        const ip = headerStore.get('x-forwarded-for') || 'unknown';

        await supabase.from("audit_logs").insert({
            actor_id: user.id,
            action,
            target,
            metadata,
            ip_address: ip
        });
    } catch (e) {
        console.error("Failed to log audit:", e);
        // Fail open? Usually yes for UX, but log to stderr.
    }
}
