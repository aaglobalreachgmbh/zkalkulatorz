import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminGuardProps {
    children: React.ReactNode;
}

/**
 * Protects routes for Admins only.
 * Redirects to home if user does not have 'admin' or 'superadmin' role.
 * 
 * @deprecated Use Server Components and `requireAdmin()` for route protection.
 * This component is only for client-side fallbacks or legacy pages.
 */
export function AdminGuard({ children }: AdminGuardProps) {
    const { isAdmin, isLoading, error } = useUserRole();
    const router = useRouter();

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.warn("[AdminGuard] Deprecated: server-side `requireAdmin` should be used for route protection.");
        }
        if (!isLoading && !isAdmin) {
            toast.error("Zugriff verweigert: Nur für Administratoren.");
            router.push("/");
        }
    }, [isAdmin, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    <p className="text-sm text-slate-500">Überprüfe Berechtigungen...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-rose-50 dark:bg-rose-950">
                <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-rose-200 dark:border-rose-900">
                    <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">Authentifizierungsfehler</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Konnte Benutzerrolle nicht laden.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
                    >
                        Neu laden
                    </button>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
