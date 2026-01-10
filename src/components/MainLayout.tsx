import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppFooter } from "@/components/AppFooter";
import { PublisherModal } from "@/components/PublisherModal";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { usePOSMode } from "@/contexts/POSModeContext";
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

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const { branding } = useTenantBranding();
  const { isPOSMode } = usePOSMode();

  // Apply branding primary color as CSS variable
  const brandingStyle = branding.primaryColor 
    ? { "--tenant-primary": branding.primaryColor } as React.CSSProperties
    : undefined;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={brandingStyle}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* VVL Notification Banner */}
          <VVLNotificationBanner />
          
          {/* Header */}
          <header className={cn(
            "h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-40",
            isPOSMode && "h-12 px-2"
          )}>
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex flex-col">
              {branding.logoUrl ? (
                  <img 
                    src={branding.logoUrl} 
                    alt={branding.companyName || "Logo"} 
                    className="h-10 md:h-12 w-auto max-w-[180px] object-contain"
                  />
                ) : (
                  <span className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                    {branding.companyName || PUBLISHER.displayName}
                  </span>
                )}
                {!isPOSMode && (
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {PUBLISHER.subline}
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
              {/* Follow-up Reminders Bell Icon - only for logged in users, hidden in POS mode */}
              {user && !isPOSMode && (
                <FollowupReminders compact />
              )}
              
              {/* About/Publisher Info */}
              {!isPOSMode && <PublisherModal />}
              
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

          {/* Main content */}
          <main className={cn(
            "flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden",
            isPOSMode && "p-2 md:p-3"
          )}>
            <div className="max-w-screen-2xl mx-auto">
              {children}
            </div>
          </main>
          
          {/* Global Footer */}
          {!isPOSMode && <AppFooter />}
        </div>
      </div>
    </SidebarProvider>
  );
}
