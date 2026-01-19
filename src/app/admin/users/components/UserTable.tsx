"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { updateUserRoleAction } from "@/actions/admin-users";
import { toast } from "sonner";

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    last_sign_in_at: string;
}

export function UserTable({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [search, setSearch] = useState("");
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    const filteredUsers = users.filter((u) =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleRoleChange = async (userId: string, newRole: string) => {
        setLoadingMap((prev) => ({ ...prev, [userId]: true }));
        try {
            await updateUserRoleAction(userId, newRole);
            toast.success(`Rolle zu ${newRole} geändert`);
            // Optimistic update
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
            );
        } catch (error) {
            toast.error("Fehler beim Ändern der Rolle");
        } finally {
            setLoadingMap((prev) => ({ ...prev, [userId]: false }));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Suche nach E-Mail oder Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Rolle</TableHead>
                            <TableHead>Registriert am</TableHead>
                            <TableHead>Letzter Login</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name || "Unbekannt"}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={user.role}
                                            onValueChange={(val) => handleRoleChange(user.id, val)}
                                            disabled={loadingMap[user.id]}
                                        >
                                            <SelectTrigger className="w-[140px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="moderator">Moderator</SelectItem>
                                                <SelectItem value="master">Master</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="superadmin">Superadmin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {loadingMap[user.id] && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                                    </div>
                                </TableCell>
                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    {user.last_sign_in_at
                                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                                        : "-"}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Keine Ergebnisse.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
