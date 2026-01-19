"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getFeaturesAction() {
    const supabase = await createClient();

    // Fetch all flags joined with tenants
    const { data, error } = await supabase
        .from("feature_flags")
        .select(`
            id,
            tenant_id,
            feature_key,
            enabled,
            tenants ( name )
        `);

    if (error) throw new Error(error.message);
    return data;
}

export async function toggleFeatureAction(tenantId: string, featureKey: string, enabled: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("feature_flags")
        .upsert({
            tenant_id: tenantId,
            feature_key: featureKey,
            enabled: enabled,
            updated_at: new Date().toISOString()
        }, { onConflict: "tenant_id, feature_key" });

    if (error) throw new Error(error.message);
    revalidatePath("/admin/features");
}
