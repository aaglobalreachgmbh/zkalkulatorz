// ============================================
// Index - Calculator Route with Zero-Scroll Layout
// Phase 12.3: Cockpit Enterprise Implementation
// ============================================

import { Wizard } from "@/margenkalkulator/ui/Wizard";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PublisherModal } from "@/components/PublisherModal";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useWorkplaceMode } from "@/contexts/WorkplaceModeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VVLNotificationBanner } from "@/components/VVLNotificationBanner";
import { FollowupReminders } from "@/margenkalkulator/ui/components/FollowupReminders";
import { PUBLISHER } from "@/margenkalkulator/publisherConfig";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";
import { isTestModeActive, disableTestMode } from "@/lib/testMode";

/**
 * Calculator Index Page - Zero-Scroll Cockpit Layout
 * 
 * IMPORTANT: This page does NOT use MainLayout.
 * It implements the Phase 12 "Zero-Scroll Contract":
 * - h-screen enforced (no body scroll on 1366x768)
 * - Internal scroll only within CalculatorShell panels
 * - CTA always visible without scrolling
 */
const Index = () => {
  const { user, signOut } = useAuth();
  const { branding } = useTenantBranding();
  const { isPOS: isPOSMode } = useWorkplaceMode();

  // Apply branding primary color as CSS variable
  const brandingStyle = branding.primaryColor 
    ? { "--tenant-primary": branding.primaryColor } as React.CSSProperties
    : undefined;

  return (
    <SidebarProvider>
      {/* PHASE 12: h-screen container - NO overflow on body */}
      <div 
        className="h-screen flex w-full overflow-hidden" 
        style={brandingStyle}
      >
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* VVL Notification Banner (flex-none) */}
          <VVLNotificationBanner />
          {!user && isTestModeActive() && (
            <div className="mobile-short-hide flex flex-none items-center justify-between gap-2 border-b border-warning bg-warning/15 px-3 py-1.5 text-xs text-foreground">
              <span className="truncate font-medium">Vorschau ohne Anmeldung</span>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { disableTestMode(); window.location.href = "/auth"; }}>
                Beenden
              </Button>
            </div>
          )}
          
          {/* Header (flex-none, fixed height) */}
          <header className={cn(
            "flex-none h-12 md:h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-2 md:px-4 z-40",
            isPOSMode && "h-12 px-2"
          )}>
            <div className="flex min-w-0 items-center gap-2 md:gap-4">
              <SidebarTrigger />
              <div className="flex min-w-0 flex-col">
                {/* Publisher-Text oben */}
                {!isPOSMode && (
                  <span className="hidden text-[10px] text-muted-foreground leading-tight md:block">
                    {PUBLISHER.subline}
                  </span>
                )}
                
                {/* Logo oder Firmenname */}
                {branding.logoUrl ? (
                  <BrandLogo
                    src={branding.logoUrl}
                    alt={branding.companyName || "Firmenlogo"}
                    className="h-7 w-[min(8rem,38vw)] md:mt-0.5 md:h-10 md:w-[clamp(6.5rem,16vw,11.25rem)]"
                    imageClassName="object-left"
                    showFallback={false}
                  />
                ) : (
                  <span className="truncate text-sm font-bold text-foreground md:text-lg">
                    {branding.companyName || PUBLISHER.displayName}
                  </span>
                )}
                {!user && isTestModeActive() && (
                  <span className="mobile-short-only items-center text-[10px] font-medium text-warning">
                    Vorschau
                  </span>
                )}
              </div>
              {isPOSMode && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Monitor className="h-3 w-3" />
                  POS
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Follow-up Reminders - hidden in POS mode */}
              {user && !isPOSMode && (
                <FollowupReminders compact />
              )}
              
              {/* About/Publisher Info */}
              {!isPOSMode && <div className="hidden sm:block"><PublisherModal /></div>}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size={isPOSMode ? "icon" : "sm"} className="gap-2">
                    <User className="h-4 w-4" />
                    {!isPOSMode && (
                      <span className="hidden sm:inline">{user?.email?.split("@")[0]}</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Wizard Area (flex-1, internal scroll handled by CalculatorShell) */}
          <div className="flex-1 overflow-hidden">
            <Wizard />
          </div>
          
          {/* NO Footer - Zero-Scroll Contract: No elements below Wizard */}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
