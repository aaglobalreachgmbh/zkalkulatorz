import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
    await requireAdmin();
    const supabase = await createClient();

    // Fetch logs with actor email if possible
    // Since actor_id links to auth.users, we can't join directly in standard query unless we have a view or join on profiles.
    // Let's join on profiles for now.

    // Check if profiles exists? Yes.
    const { data: logs } = await supabase
        .from("audit_logs")
        .select(`
            id,
            action,
            target,
            metadata,
            created_at,
            profiles ( display_name, email )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Audit Log</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Recent system activities (Last 50).
                </p>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Metadata</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs?.map((log: any) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap opacity-70">
                                    {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{log.profiles?.email}</span>
                                        <span className="text-xs text-muted-foreground">{log.profiles?.display_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {log.action}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm font-mono text-muted-foreground">
                                    {log.target}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground font-mono max-w-[300px] truncate">
                                    {JSON.stringify(log.metadata)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
