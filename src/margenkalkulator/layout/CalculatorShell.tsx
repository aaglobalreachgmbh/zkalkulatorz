// ============================================
// CalculatorShell - Clean Layout Grid
// Redesign: Step-based layout with fixed sidebar
// ============================================

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CalculatorShellProps {
  children: ReactNode;
  sidebar: ReactNode;
  headerActions?: ReactNode;
  mobileFooter?: ReactNode;
  stepIndicator?: ReactNode;
  title?: string;
  className?: string;
}

export function CalculatorShell({
  children,
  sidebar,
  headerActions,
  mobileFooter,
  stepIndicator,
  title = "Kalkulator",
  className,
}: CalculatorShellProps) {
  return (
    <div className={cn("flex flex-col h-full w-full overflow-hidden", className)}>
      {/* Header - Slim 56px */}
      <header className="flex-none h-14 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between z-30">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <div className="flex items-center gap-2 lg:gap-3">
          {headerActions}
        </div>
      </header>

      {/* Step Indicator Bar */}
      {stepIndicator && (
        <div className="flex-none bg-white border-b border-gray-100 px-4 lg:px-6 py-2">
          {stepIndicator}
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] overflow-hidden bg-gray-50">
        {/* Left: Scrollable Content */}
        <main className="h-full overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>

        {/* Right: Fixed Sidebar */}
        <aside className="hidden lg:flex flex-col h-full border-l border-gray-200 bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {sidebar}
          </div>
        </aside>

        {/* Mobile Footer */}
        {mobileFooter && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            {mobileFooter}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components kept for backwards compat
export function SidebarActionFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-none p-4 border-t border-gray-200 bg-gray-50/50", className)}>
      {children}
    </div>
  );
}

export function MobileSummaryBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {children}
    </div>
  );
}
