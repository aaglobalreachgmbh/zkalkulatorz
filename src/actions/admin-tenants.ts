"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function getTenantsAction() {
    const supabase = await createClient();

    // Check if tenants exist, otherwise we might fail.
    // Assuming tenants table is popluated.
    const { data, error } = await supabase
        .from("tenants")
        .select(`
            id,
            name,
            created_at,
            licenses (
                max_seats,
                expires_at,
                plan,
                status
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        // If tenants doesn't exist yet, return empty or helper error
        console.error("Fetch Tenants Error:", error);
        return [];
    }

    return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        created_at: t.created_at,
        license: t.licenses?.[0] || null
    }));
}

export async function updateLicenseAction(tenantId: string, seats: number, expiresAt: string) {
    const supabase = await createClient();

    // Upsert license
    const { error } = await supabase
        .from("licenses")
        .upsert({
            tenant_id: tenantId,
            max_seats: seats,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
        }, { onConflict: "tenant_id" });

    if (error) throw new Error(error.message);

    await logAudit("LICENSE_UPDATE", tenantId, { seats, expiresAt });
    revalidatePath("/admin/tenants");
}
