import { getTenantsAction, updateLicenseAction } from "@/actions/admin-tenants";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { TenantList } from "./components/TenantList";

export default async function AdminTenantsPage() {
    await requireAdmin();
    const tenants = await getTenantsAction();

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tenant Management</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Manage Companies and Licenses.
                </p>
            </div>

            <TenantList initialTenants={tenants} />
        </div>
    );
}
