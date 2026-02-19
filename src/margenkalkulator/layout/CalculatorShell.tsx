// ============================================
// CalculatorShell - Complete Visual Rebuild
// Design: Screenshot-based flat layout
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
    <div className={cn("flex flex-col h-full w-full overflow-hidden bg-white", className)}>
      {/* Top Bar - 48px flat nav */}
      <header className="flex-none h-12 bg-gray-900 px-4 lg:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-6">
          <span className="text-white font-bold text-base tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
        </div>
      </header>

      {/* Step Navigation Bar - 44px */}
      {stepIndicator && (
        <div className="flex-none h-11 bg-gray-50 border-b border-gray-200 px-4 lg:px-6 flex items-center">
          {stepIndicator}
        </div>
      )}

      {/* Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] overflow-hidden">
        {/* Left: Scrollable Content Area */}
        <main className="h-full overflow-y-auto bg-gray-50 p-4 lg:p-6 pb-32 lg:pb-6">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>

        {/* Right: Fixed Sidebar */}
        <aside className="hidden lg:flex flex-col h-full border-l border-gray-200 bg-gray-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
