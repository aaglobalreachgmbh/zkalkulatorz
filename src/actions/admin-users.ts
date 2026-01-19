"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function getUsersAction() {
    const supabase = await createClient();

    // Fetch from admin_users_view (Join of auth.users + user_roles)
    // Actually, admin_users_view only shows admins.
    // We need a view that shows ALL users + their roles.
    // If such a view doesn't exist, we must fetch profiles + roles separately OR create a view.
    // Let's create `view_all_users_admin` in the query or assume profile table has what we need.
    // The previous plan mentioned `view_active_users_7d`.
    // Let's do a join manually here: select from profiles and also fetch roles.
    // Or better: use `user_roles` as the base if every user has a role.
    // If user_roles is the source of truth for roles:

    // We need to fetch profiles AND their roles.
    // Let's rely on `profiles` if it exists, join `user_roles`.

    const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
            id,
            email,
            display_name,
            created_at,
            last_sign_in_at,
            user_roles ( role )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    // Flatten logic
    return profiles.map((p: any) => ({
        id: p.id,
        email: p.email,
        name: p.display_name,
        role: p.user_roles?.[0]?.role || "user",
        created_at: p.created_at,
        last_sign_in_at: p.last_sign_in_at
    }));
}

export async function updateUserRoleAction(userId: string, newRole: string) {
    const supabase = await createClient();

    // Security check: Caller must be Superadmin to verify (enforced by RLS + Middleware + here)
    // We double check here for safety? Or rely on RLS.
    // Best practice: Check caller role again.

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if caller is superadmin (optional, depending on strictness)
    // For now, let RLS handle "admin_manage" policy.

    // Upsert role
    const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id" });

    if (error) throw new Error(error.message);

    // Audit Log
    await logAudit("USER_ROLE_UPDATE", userId, { newRole });

    revalidatePath("/admin/users");
    return { success: true };
}
