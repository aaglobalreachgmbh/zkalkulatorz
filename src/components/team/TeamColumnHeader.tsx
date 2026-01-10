// ============================================
// Team Column Header Component
// Header for Kanban-style columns
// ============================================

import { LucideIcon } from "lucide-react";

interface TeamColumnHeaderProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: string;
}

export function TeamColumnHeader({ title, count, icon: Icon, color }: TeamColumnHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-t-xl border-b">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <span className="text-sm font-medium text-muted-foreground bg-background px-2.5 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  );
}
