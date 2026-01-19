import { getFeaturesAction } from "@/actions/admin-features";
import { FeatureMatrix } from "./components/FeatureMatrix";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminFeaturesPage() {
    await requireAdmin();
    const flags = await getFeaturesAction();

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Feature Flags</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Manage features per tenant.
                </p>
            </div>

            <FeatureMatrix initialFlags={flags || []} />
        </div>
    );
}
