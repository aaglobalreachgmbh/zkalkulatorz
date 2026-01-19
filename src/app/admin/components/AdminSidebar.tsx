"use client";

import {
    LayoutDashboard,
    Users,
    Activity,
    Settings,
    LogOut,
    ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "User Management", icon: Users },
        { href: "/admin/telemetry", label: "Telemetry & Logs", icon: Activity },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col border-r border-slate-800">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
                <div>
                    <h1 className="font-bold text-white tracking-tight">COMMAND CENTER</h1>
                    <p className="text-xs text-rose-500 font-mono">SUPREME ADMIN</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? "bg-rose-600 text-white"
                                : "hover:bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5" />
                    Abmelden
                </Button>
            </div>
        </aside>
    );
}
