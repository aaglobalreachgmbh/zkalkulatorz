import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, FileText, AlertTriangle } from "lucide-react";
import { ActivityChart } from "@/admin/components/ActivityChart"; // This likely needs to be a client component wrapper or compatible
import { ActivityTimeline } from "./components/ActivityTimeline";
import { createClient } from "@/utils/supabase/server"; // Server Client
import { requireAdmin } from "@/lib/auth/requireAdmin";

// Force Dynamic Rendering
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    // 1. Security Check (Throws Redirect if fail)
    await requireAdmin();

    // 2. Data Fetching (Server-Side)
    const supabase = await createClient();

    // Parallel fetching from Views
    const [activeUsersRes, pdfsRes, errorsRes] = await Promise.all([
        supabase.from('view_active_users_7d').select('count').single(),
        supabase.from('view_pdf_export_daily').select('count').eq('day', new Date().toISOString().split('T')[0]).single(), // Strict check for Today
        // Actually, for "Total PDF Export" (cumulative) or "Today"? The UI says "Gesamt".
        // Let's assume the previous code wanted total count.
        // Let's adjust: fetch total count from user_events for "Total", 
        // and fetch view for specific analytics if needed.
        // For efficiency, views are better.
        // Let's stick to the previous simple 'count' method with head:true for totals.
        // But the user requested "KPI Expansion".
        // Let's fetch: 
        // 1. Active Users (7d) -> Uses View
        // 2. PDF Exports (Total) -> Count head
        // 3. Errors (24h) -> Uses View

        supabase.from('view_active_users_7d').select('count').single(),
        supabase.from('user_events').select('*', { count: 'exact', head: true }).eq('event', 'pdf_export'),
        supabase.from('view_error_stats_24h').select('count').single()
    ]);

    const stats = {
        activeUsers: activeUsersRes.data?.count || 0,
        pdfs: pdfsRes.count || 0,
        errors24h: errorsRes.data?.count || 0
    };

    // Fetch recent audit logs for Timeline
    const { data: recentActivity } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Echtzeit-Überwachung der Systemaktivitäten und Telemetrie (Server-Side Secure).
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Active Users (7d)" value={stats.activeUsers.toString()} icon={Users} color="text-blue-500" />
                <KpiCard title="PDF Export (Gesamt)" value={stats.pdfs.toString()} icon={FileText} color="text-emerald-500" />
                <KpiCard title="Errors (24h)" value={stats.errors24h.toString()} icon={AlertTriangle} color="text-rose-500" />
                <KpiCard title="System Health" value={stats.errors24h > 0 ? "Degraded" : "Healthy"} icon={Activity} color="text-violet-500" />
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>System Aktivität (30 Tage)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {/* ActivityChart must be a Client Component if it uses Recharts */}
                        <ActivityChart />
                    </CardContent>
                </Card>

                {/* New Row for Timeline */}<Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Audit Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ActivityTimeline activities={recentActivity || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) {
    return (
        <Card>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-full bg-slate-100 dark:bg-slate-800 ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
    );
}
