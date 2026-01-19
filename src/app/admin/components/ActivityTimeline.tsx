"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

// Props passed from Server Component
export function ActivityTimeline({ activities }: { activities: any[] }) {
    return (
        <ScrollArea className="h-[300px]">
            <div className="space-y-4 p-4">
                {activities.map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">{item.action}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleString()} - {item.target || 'System'}
                            </p>
                        </div>
                    </div>
                ))}
                {activities.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
            </div>
        </ScrollArea>
    );
}
