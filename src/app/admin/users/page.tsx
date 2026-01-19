import { getUsersAction } from "@/actions/admin-users";
import { UserTable } from "./components/UserTable";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminUsersPage() {
    await requireAdmin();

    const users = await getUsersAction();

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">User Management</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Verwaltung aller registrierten Benutzer und ihrer Systemrollen.
                </p>
            </div>

            <UserTable initialUsers={users} />
        </div>
    );
}
