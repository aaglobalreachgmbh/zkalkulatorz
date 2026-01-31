// ============================================
// CalculatorShell - Zero-Scroll Layout Grid
// Phase 2: Architecture Implementation
// ============================================

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CalculatorShellProps {
  /** Main content (Wizard steps) - renders in left panel */
  children: ReactNode;
  /** Summary sidebar content - renders in right panel (desktop) */
  sidebar: ReactNode;
  /** Optional header actions (ViewMode toggle, etc.) */
  headerActions?: ReactNode;
  /** Optional mobile footer content */
  mobileFooter?: ReactNode;
  /** Custom title (default: "Kalkulator") */
  title?: string;
  /** Additional className for root container */
  className?: string;
}

/**
 * CalculatorShell implements the "Zero-Scroll" layout contract:
 * - Root container fills 100vh, no browser scrollbars
 * - Left panel: Scrollable main content area
 * - Right panel: Fixed sidebar with summary (desktop only)
 * - Mobile footer: Fixed bottom bar for mobile CTAs
 * 
 * Layout Grid (Desktop lg+):
 * ┌────────────────────────────────────────────┐
 * │ HEADER (h-16, flex-none)                   │
 * ├─────────────────────────┬──────────────────┤
 * │ LEFT: Main Stage        │ RIGHT: Sidebar   │
 * │ (flex-1, scroll-y)      │ (w-[400px])      │
 * │                         │                  │
 * │ • Hardware Step         │ • Price Summary  │
 * │ • Mobile Step           │ • Breakdown      │
 * │ • FixedNet Step         │ ───────────────  │
 * │                         │ [ACTION FOOTER]  │
 * └─────────────────────────┴──────────────────┘
 * 
 * Layout (Mobile <lg):
 * ┌────────────────────────────────────────────┐
 * │ HEADER                                     │
 * ├────────────────────────────────────────────┤
 * │ MAIN CONTENT (scrollable)                  │
 * │                                            │
 * ├────────────────────────────────────────────┤
 * │ MOBILE FOOTER (fixed bottom)               │
 * └────────────────────────────────────────────┘
 */
export function CalculatorShell({
  children,
  sidebar,
  headerActions,
  mobileFooter,
  title = "Kalkulator",
  className,
}: CalculatorShellProps) {
  return (
    <div className={cn("flex flex-col h-full w-full bg-background", className)}>
      {/* 1. Header (Fixed, 64px) */}
      <header className="flex-none h-16 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between z-30">
        <h1 className="text-lg lg:text-xl font-semibold text-foreground">
          {title}
        </h1>
        {/* Header Actions Slot (ViewMode Toggle, etc.) */}
        <div className="flex items-center gap-2 lg:gap-4">
          {headerActions}
        </div>
      </header>

      {/* 2. Main Grid (Zero-Scroll Area) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] overflow-hidden relative">
        {/* Left Panel: Scrollable Content */}
        <main className="h-full overflow-y-auto p-4 lg:p-6 xl:p-8 scroll-smooth pb-32 lg:pb-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>

        {/* Right Panel: Sidebar (Desktop only) */}
        <aside className="hidden lg:flex flex-col h-full border-l border-border bg-card shadow-lg z-20 overflow-hidden">
          {/* Scrollable Sidebar Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {sidebar}
          </div>
          {/* 
           * Footer Space for 'Zum Angebot' Button (Desktop)
           * This is injected via the sidebar prop, not as a separate slot
           */}
        </aside>

        {/* Mobile Rescue Footer (Fixed Bottom, < lg only) */}
        {mobileFooter && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            {mobileFooter}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS (For Future Use)
// ============================================

/**
 * Wrapper for sidebar action footer
 */
export function SidebarActionFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-none p-4 border-t border-border bg-muted/30",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Wrapper for mobile summary display
 */
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
