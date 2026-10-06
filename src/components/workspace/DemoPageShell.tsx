import type { ReactNode } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Badge } from "@/components/ui/badge";

interface DemoPageShellProps {
  title: string;
  description: string;
  demo?: boolean;
  children: ReactNode;
}

/** Einheitlicher Rahmen für die neuen Vertriebs-Werkzeuge. */
export function DemoPageShell({ title, description, demo = true, children }: DemoPageShellProps) {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {demo && (
            <Badge variant="secondary" className="text-muted-foreground">
              Demo – Beispieldaten
            </Badge>
          )}
        </div>
        {children}
      </div>
    </MainLayout>
  );
}
