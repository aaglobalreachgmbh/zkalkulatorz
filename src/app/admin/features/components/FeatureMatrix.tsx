"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleFeatureAction } from "@/actions/admin-features";
import { toast } from "sonner";

// Mock tenants for now if DB is empty, but generally provided by props
interface FeatureFlag {
    id: string;
    tenant_id: string;
    feature_key: string;
    enabled: boolean;
    tenants: { name: string } | { name: string }[] | null;
}

export function FeatureMatrix({ initialFlags }: { initialFlags: FeatureFlag[] }) {
    // Group by Tenant
    const tenantGroups = initialFlags.reduce((acc, flag) => {
        const tId = flag.tenant_id;
        const tenantName = Array.isArray(flag.tenants) ? flag.tenants[0]?.name : flag.tenants?.name;
        if (!acc[tId]) acc[tId] = { name: tenantName || 'Unknown', flags: [] };
        acc[tId].flags.push(flag);
        return acc;
    }, {} as Record<string, { name: string, flags: FeatureFlag[] }>);

    const handleToggle = async (tenantId: string, key: string, currentVal: boolean) => {
        try {
            await toggleFeatureAction(tenantId, key, !currentVal);
            toast.success("Feature updated");
        } catch (e) {
            toast.error("Update failed");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(tenantGroups).map(([tId, data]) => (
                <Card key={tId}>
                    <CardHeader>
                        <CardTitle>{data.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.flags.map(f => (
                            <div key={f.feature_key} className="flex items-center justify-between">
                                <span className="text-sm font-medium">{f.feature_key}</span>
                                <Switch
                                    checked={f.enabled}
                                    onCheckedChange={() => handleToggle(tId, f.feature_key, f.enabled)}
                                />
                            </div>
                        ))}
                        {data.flags.length === 0 && <p className="text-muted-foreground text-sm">No flags set.</p>}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
