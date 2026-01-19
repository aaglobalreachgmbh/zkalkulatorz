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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLicenseAction } from "@/actions/admin-tenants";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function TenantList({ initialTenants }: { initialTenants: any[] }) {
    const [tenants] = useState(initialTenants);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tenants.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.name}</TableCell>
                            <TableCell>{t.license?.plan || "Free"}</TableCell>
                            <TableCell>{t.license?.max_seats || 1}</TableCell>
                            <TableCell>{t.license?.expires_at ? new Date(t.license.expires_at).toLocaleDateString() : "-"}</TableCell>
                            <TableCell>
                                <LicenseEditDialog tenant={t} />
                            </TableCell>
                        </TableRow>
                    ))}
                    {tenants.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                No tenants found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function LicenseEditDialog({ tenant }: { tenant: any }) {
    const [open, setOpen] = useState(false);
    const [seats, setSeats] = useState(tenant.license?.max_seats || 1);
    const [expiry, setExpiry] = useState(tenant.license?.expires_at?.split('T')[0] || "");

    const handleSave = async () => {
        try {
            await updateLicenseAction(tenant.id, Number(seats), new Date(expiry).toISOString());
            toast.success("License updated");
            setOpen(false);
        } catch (e) {
            toast.error("Failed to update");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit License: {tenant.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Max Seats</label>
                        <Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Expiration Date</label>
                        <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                    </div>
                    <Button onClick={handleSave} className="w-full">Save Changes</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
