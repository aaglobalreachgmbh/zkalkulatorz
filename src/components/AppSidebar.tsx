import { useEffect, useState } from "react";
import { 
  Calculator, 
  Users, 
  BarChart3, 
  Building2, 
  Shield, 
  Database, 
  Settings, 
  Package, 
  Key, 
  ChevronRight, 
  Monitor, 
  FileText,
  Inbox,
  ClipboardList,
  LayoutDashboard,
  UserCog,
  HardDrive
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useIdentity, MOCK_IDENTITIES } from "@/contexts/IdentityContext";
import { useTenantAdmin } from "@/hooks/useTenantAdmin";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { usePOSMode } from "@/contexts/POSModeContext";
import { PUBLISHER } from "@/margenkalkulator/publisherConfig";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { User, ChevronDown } from "lucide-react";

// ============================================
// NAVIGATION STRUCTURE - Logically grouped
// ============================================

// SALES - Core business functions
const salesItems = [
  { title: "Kalkulator", url: "/calculator", icon: Calculator },
  { title: "Angebote", url: "/offers", icon: FileText },
  { title: "Kunden", url: "/customers", icon: Building2 },
  { title: "Verträge", url: "/contracts", icon: ClipboardList },
  { title: "Bundles", url: "/bundles", icon: Package },
];

// ORGANIZATION - Team & resources
const orgItems = [
  { title: "Team", url: "/team", icon: Users },
  { title: "Meine Daten", url: "/daten", icon: Database },
];

// SYSTEM - Backend tools
const systemItems = [
  { title: "Posteingang", url: "/inbox", icon: Inbox },
];

// SETTINGS - User settings (collapsible)
const settingsItems = [
  { title: "Sicherheit", url: "/settings/security", icon: Shield },
  { title: "Lizenz", url: "/license", icon: Key },
];

// ADMIN - Administration (collapsible, role-gated)
const adminItems = [
  { title: "Stammdaten", url: "/tenant-admin", icon: Settings, requiresTenantAdmin: true },
  { title: "Benutzerverwaltung", url: "/admin/users", icon: UserCog, requiresAdmin: true },
  { title: "Datenmanager", url: "/data-manager", icon: HardDrive },
  { title: "Reporting", url: "/reporting", icon: BarChart3 },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin, role } = useUserRole();
  const { identity, canAccessAdmin, setMockIdentity, clearMockIdentity, isSupabaseAuth } = useIdentity();
  const { isTenantAdmin } = useTenantAdmin();
  const { branding } = useTenantBranding();
  const { isPOSMode, togglePOSMode } = usePOSMode();
  
  // Collapsible section states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  
  // Show admin section if user has admin role, tenant admin, OR can access admin via identity
  const showAdminSection = isAdmin || canAccessAdmin || isTenantAdmin;
  
  // Auto-open section if active route is inside
  useEffect(() => {
    const path = location.pathname;
    if (settingsItems.some(item => path.startsWith(item.url))) {
      setSettingsOpen(true);
    }
    if (
      adminItems.some(item => path.startsWith(item.url)) ||
      path.startsWith("/admin") ||
      path.startsWith("/tenant-admin")
    ) {
      setAdminOpen(true);
    }
  }, [location.pathname]);

  // Auto-collapse sidebar when POS mode is active
  useEffect(() => {
    if (isPOSMode) {
      setOpen(false);
    }
  }, [isPOSMode, setOpen]);

  const handlePOSToggle = () => {
    togglePOSMode();
    if (!isPOSMode) {
      setOpen(false);
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    manager: "bg-blue-500 text-white",
    sales: "bg-emerald-500 text-white",
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Filter admin items based on user permissions
  const visibleAdminItems = adminItems.filter(item => {
    if (item.requiresAdmin && !isAdmin) return false;
    if (item.requiresTenantAdmin && !isTenantAdmin && !isAdmin) return false;
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo area with tenant branding */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-4 border-b border-sidebar-border",
          collapsed && "justify-center px-2"
        )}>
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.companyName || "Logo"}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div 
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: branding.primaryColor || "hsl(var(--primary))" }}
            >
              <Calculator className="h-4 w-4 text-white" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                {branding.companyName || PUBLISHER.displayName}
              </span>
              <span className="text-xs text-muted-foreground/70">by {PUBLISHER.name}</span>
            </div>
          )}
        </div>

        {/* Dashboard - Main entry point */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/")}
                  tooltip={collapsed ? "Dashboard" : undefined}
                  className={cn(
                    "transition-all",
                    isActive("/") 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <NavLink to="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sales - Core business functions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70">Vertrieb</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                    className={cn(
                      "transition-all",
                      isActive(item.url) 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Organization - Team & Resources */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70">Organisation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {orgItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                    className={cn(
                      "transition-all",
                      isActive(item.url) 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                    className={cn(
                      "transition-all",
                      isActive(item.url) 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings section - collapsible */}
        <SidebarGroup>
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground text-muted-foreground/70">
                <span>Einstellungen</span>
                {!collapsed && (
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-transform",
                    settingsOpen && "rotate-90"
                  )} />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={collapsed ? item.title : undefined}
                        className={cn(
                          "transition-all",
                          isActive(item.url) 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <NavLink to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Admin section - collapsible, only for admins/managers/tenant admins */}
        {showAdminSection && visibleAdminItems.length > 0 && (
          <SidebarGroup>
            <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground text-muted-foreground/70">
                  <span>Administration</span>
                  {!collapsed && (
                    <ChevronRight className={cn(
                      "h-3 w-3 transition-transform",
                      adminOpen && "rotate-90"
                    )} />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleAdminItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive(item.url)}
                          tooltip={collapsed ? item.title : undefined}
                          className={cn(
                            "transition-all",
                            isActive(item.url) 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <NavLink to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      {/* Footer with POS Toggle and Identity Selector */}
      <SidebarFooter className="border-t border-sidebar-border space-y-2">
        {/* POS Mode Toggle */}
        <div className={cn(
          "flex items-center justify-between px-3 py-2",
          collapsed && "justify-center px-2"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
              <Monitor className="h-4 w-4" />
              <span>POS-Modus</span>
            </div>
          )}
          <Switch
            checked={isPOSMode}
            onCheckedChange={handlePOSToggle}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Identity Selector - only for dev mode */}
        {!isSupabaseAuth && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center px-2"
              )}>
                <User className="h-4 w-4" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate text-muted-foreground/70">{identity.displayName}</span>
                    <Badge 
                      className={`text-xs ${roleColors[identity.role] || ""}`}
                      variant="secondary"
                    >
                      {identity.role}
                    </Badge>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Benutzer wechseln</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MOCK_IDENTITIES.map((id) => (
                <DropdownMenuItem
                  key={id.userId}
                  onClick={() => setMockIdentity(id)}
                  className="flex items-center justify-between"
                >
                  <span>{id.displayName}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${identity?.userId === id.userId ? "border-primary" : ""}`}
                  >
                    {id.role}
                  </Badge>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearMockIdentity} className="text-muted-foreground/70">
                Abmelden (Gast)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
