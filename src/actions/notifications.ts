"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNotificationsAction() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);
    return data || [];
}

export async function markReadAction(id: string) {
    const supabase = await createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    revalidatePath("/admin");
}
