import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
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
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* VVL Notification Banner */}
          <VVLNotificationBanner />
          
          {/* Header */}
          <header className={cn(
            "h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-40",
            isPOSMode && "h-12 px-2"
          )}>
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              {branding.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt={branding.companyName || "Logo"} 
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <span className="font-semibold text-foreground">
                  {branding.companyName || "MargenKalkulator"}
                </span>
              )}
              {isPOSMode && (
                <Badge variant="secondary" className="ml-2 gap-1 text-xs">
                  <Monitor className="h-3 w-3" />
                  POS
                </Badge>
              )}
            </div>
            
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
          </header>

          {/* Main content */}
          <main className={cn(
            "flex-1 p-4 md:p-6 overflow-auto",
            isPOSMode && "p-2 md:p-3"
          )}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
