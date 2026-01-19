import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Fetch roles
    const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

    if (error || !roles) {
        // Fail closed
        console.error("Failed to fetch roles", error);
        redirect("/");
    }

    const roleNames = roles.map((r) => r.role);
    const isAdmin = roleNames.includes("admin") || roleNames.includes("superadmin");

    if (!isAdmin) {
        // Optionally: redirect to a specific unauthorized page
        // For now, simple home redirect
        redirect("/");
    }

    return { user, roles: roleNames };
}
