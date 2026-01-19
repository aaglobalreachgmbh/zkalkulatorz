"use server";

import { createClient } from "@/utils/supabase/server";
import { logAudit } from "@/lib/audit";
import { randomUUID } from "crypto";

export async function createInviteAction(email: string, role: string, tenantId?: string) {
    const supabase = await createClient(); // Authenticated Admin User

    // License Check
    if (tenantId) {
        // 1. Get License Limit
        const { data: license } = await supabase
            .from("licenses")
            .select("max_seats")
            .eq("tenant_id", tenantId)
            .single();

        if (license) {
            // 2. Count Active Users
            const { count: userCount } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId);

            // 3. Count Pending Invites
            const { count: inviteCount } = await supabase
                .from("invite_tokens")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .eq("accepted", false);

            const totalAllocated = (userCount || 0) + (inviteCount || 0);

            if (totalAllocated >= (license.max_seats || 1)) {
                throw new Error(`License limit reached (${license.max_seats} seats). Upgrade plan to invite more users.`);
            }
        }
    }

    // Generate Token
    const token = randomUUID();

    const { error } = await supabase
        .from("invite_tokens")
        .insert({
            email,
            role,
            tenant_id: tenantId || null,
            token
        });

    if (error) throw new Error(error.message);

    // In a real app, send email here via SendGrid/Resend
    // For now, return the link to the admin to copy-paste
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/accept-invite?token=${token}`;

    await logAudit("INVITE_CREATED", email, { role, tenantId });

    return { success: true, link };
}
