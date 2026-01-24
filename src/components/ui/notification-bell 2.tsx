"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getNotificationsAction, markReadAction } from "@/actions/notifications";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Poll every 60s
        const fetch = async () => {
            const data = await getNotificationsAction();
            setNotifications(data);
        };
        fetch();
        const interval = setInterval(fetch, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkRead = async (id: string) => {
        await markReadAction(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <h4 className="font-medium mb-2">Notifications</h4>
                <div className="space-y-2 max-h-64 overflow-auto">
                    {notifications.map(n => (
                        <div key={n.id} className="text-sm p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 relative group">
                            <p className="font-semibold">{n.title}</p>
                            <p className="text-muted-foreground text-xs mt-1">{n.message}</p>
                            <button
                                onClick={() => handleMarkRead(n.id)}
                                className="absolute top-2 right-2 text-xs text-blue-500 opacity-0 group-hover:opacity-100"
                            >
                                Mark read
                            </button>
                        </div>
                    ))}
                    {notifications.length === 0 && <p className="text-sm text-slate-500">No new notifications.</p>}
                </div>
            </PopoverContent>
        </Popover>
    );
}
