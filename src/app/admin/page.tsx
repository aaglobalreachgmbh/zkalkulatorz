"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, FileText, AlertTriangle } from "lucide-react";
import { ActivityChart } from "@/admin/components/ActivityChart";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        users: 0,
        pdfs: 0,
        errors: 0
    });

    useEffect(() => {
        async function fetchStats() {
            // Parallel Fetching for speed
            const [usersRes, pdfsRes, errorsRes] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('user_events').select('*', { count: 'exact', head: true }).eq('event', 'pdf_export'),
                supabase.from('api_logs').select('*', { count: 'exact', head: true }).gte('status_code', 400)
            ]);

            setStats({
                users: usersRes.count || 0,
                pdfs: pdfsRes.count || 0,
                errors: errorsRes.count || 0
            });
        }
        fetchStats();
    }, []);

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Echtzeit-Überwachung der Systemaktivitäten und Telemetrie.
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Users" value={stats.users.toString()} icon={Users} color="text-blue-500" />
                <KpiCard title="PDF Export (Gesamt)" value={stats.pdfs.toString()} icon={FileText} color="text-emerald-500" />
                <KpiCard title="API Fehler (Total)" value={stats.errors.toString()} icon={AlertTriangle} color="text-rose-500" />
                <KpiCard title="Health Score" value={stats.errors > 0 ? "98%" : "100%"} icon={Activity} color="text-violet-500" />
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>System Aktivität (30 Tage)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ActivityChart />
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Neueste User</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UserListPreview />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function UserListPreview() {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        async function fetchNewUsers() {
            const { data } = await supabase
                .from('profiles')
                .select('display_name, email, created_at')
                .order('created_at', { ascending: false })
                .limit(5);
            if (data) setUsers(data);
        }
        fetchNewUsers();
    }, []);

    if (users.length === 0) return <p className="text-sm text-muted-foreground">Keine User gefunden.</p>;

    return (
        <div className="space-y-4">
            {users.map((u, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 border-slate-100 dark:border-slate-800">
                    <div>
                        <p className="text-sm font-medium">{u.display_name || 'Unbekannt'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                    </span>
                </div>
            ))}
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
