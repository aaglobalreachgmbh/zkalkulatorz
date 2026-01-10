import { useEffect, useState } from "react";
import { 
  Calculator, 
  Users, 
  BarChart3, 
  Building2, 
  Shield, 
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
  HardDrive,
  Sparkles,
  Megaphone,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useIdentity, MOCK_IDENTITIES } from "@/contexts/IdentityContext";
import { useTenantAdmin } from "@/hooks/useTenantAdmin";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useWorkplaceMode } from "@/contexts/WorkplaceModeContext";
import { Store, Briefcase } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
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
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";

// ============================================
// NAVIGATION STRUCTURE - Klare deutsche Begriffe
// ============================================

// TAGESGESCHÄFT - Kernfunktionen für jeden Mitarbeiter
const dailyItems = [
  { id: "calculator", title: "Kalkulator", subtitle: "Angebote berechnen", url: "/calculator", icon: Calculator },
  { id: "offers", title: "Angebote", subtitle: "Erstellte Angebote", url: "/offers", icon: FileText },
  { id: "customers", title: "Kunden", subtitle: "Kundenstamm", url: "/customers", icon: Building2 },
  { id: "contracts", title: "Verträge", subtitle: "Laufende Verträge", url: "/contracts", icon: ClipboardList },
];

// WERKZEUGE - Unterstützende Funktionen
const toolItems = [
  { id: "calendar", title: "Kalender", subtitle: "Termine", url: "/calendar", icon: Calendar },
  { id: "news", title: "News & Aktionen", subtitle: "Aktuelle Infos", url: "/news", icon: Megaphone },
  { id: "bundles", title: "Bundles", subtitle: "Paket-Konfigurator", url: "/bundles", icon: Package },
  { id: "inbox", title: "Posteingang", subtitle: "Nachrichten", url: "/inbox", icon: Inbox },
];

// AUSWERTUNGEN - Statistiken und Team
const analyticsItems = [
  { id: "reporting", title: "Auswertungen", subtitle: "Statistiken", url: "/reporting", icon: BarChart3 },
  { id: "team", title: "Team", subtitle: "Mein Team", url: "/team", icon: Users },
];

// MEIN KONTO - Persönliche Einstellungen (immer sichtbar)
const accountItems = [
  { title: "Meine Daten", url: "/daten", icon: UserIcon },
  { title: "Sicherheit", url: "/settings/security", icon: Shield },
  { title: "Lizenz", url: "/license", icon: Key },
];

// SHOP-VERWALTUNG - Nur für Tenant-Admins
const shopAdminItems = [
  { title: "Shop-Einstellungen", subtitle: "Logo, Farben, Team", url: "/tenant-admin", icon: Settings },
  { title: "Mitarbeiter-Rechte", subtitle: "Wer darf was", url: "/admin/permissions", icon: UserCog },
  { title: "News verwalten", subtitle: "News für Mitarbeiter", url: "/admin/news", icon: Megaphone },
  { title: "Mengen-Boni", subtitle: "Staffelrabatte", url: "/admin/quantity-bonus", icon: Sparkles },
];

// ALLENETZE ADMIN - Nur für Super-Admins (role='admin')
const superAdminItems = [
  { title: "Alle Shops", subtitle: "Tenants verwalten", url: "/super-admin", icon: Building2 },
  { title: "Benutzer", subtitle: "Alle Benutzer", url: "/admin/users", icon: Users },
  { title: "Datenmanager", subtitle: "Tarifdaten", url: "/data-manager", icon: HardDrive },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { identity, canAccessAdmin, setMockIdentity, clearMockIdentity, isSupabaseAuth } = useIdentity();
  const { isTenantAdmin } = useTenantAdmin();
  const { branding } = useTenantBranding();
  const { workplaceMode, isPOS, toggleWorkplaceMode } = useWorkplaceMode();
  const { canAccessMenu, hasFullAccess } = usePermissions();
  
  // Collapsible section states
  const [accountOpen, setAccountOpen] = useState(false);
  const [shopAdminOpen, setShopAdminOpen] = useState(false);
  const [superAdminOpen, setSuperAdminOpen] = useState(false);
  
  // Show sections based on roles
  const showShopAdmin = isTenantAdmin || isAdmin || canAccessAdmin;
  const showSuperAdmin = isAdmin || canAccessAdmin;
  
  // Auto-open sections if active route is inside
  useEffect(() => {
    const path = location.pathname;
    if (accountItems.some(item => path.startsWith(item.url))) {
      setAccountOpen(true);
    }
    if (shopAdminItems.some(item => path.startsWith(item.url)) || path.startsWith("/tenant-admin")) {
      setShopAdminOpen(true);
    }
    if (superAdminItems.some(item => path.startsWith(item.url)) || path === "/super-admin") {
      setSuperAdminOpen(true);
    }
  }, [location.pathname]);

  // Auto-collapse sidebar when POS mode is active
  useEffect(() => {
    if (isPOS) {
      setOpen(false);
    }
  }, [isPOS, setOpen]);

  const handleWorkplaceModeToggle = () => {
    toggleWorkplaceMode();
    if (!isPOS) {
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

  // Filter items based on permissions
  const filterByPermission = <T extends { id?: string }>(items: T[]): T[] => {
    if (hasFullAccess) return items;
    return items.filter(item => !item.id || canAccessMenu(item.id));
  };

  const visibleDailyItems = filterByPermission(dailyItems);
  const visibleToolItems = filterByPermission(toolItems);
  const visibleAnalyticsItems = filterByPermission(analyticsItems);

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
              className="h-12 w-auto object-contain max-w-[180px]"
            />
          ) : (
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: branding.primaryColor || "hsl(var(--primary))" }}
            >
              <Calculator className="h-6 w-6 text-white" />
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

        {/* Dashboard - Haupteinstieg */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-[10px] tracking-wider">
            Startseite
          </SidebarGroupLabel>
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

        {/* Tagesgeschäft */}
        {visibleDailyItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-[10px] tracking-wider">
              Tagesgeschäft
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleDailyItems.map((item) => (
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
        )}

        {/* Werkzeuge */}
        {visibleToolItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-[10px] tracking-wider">
              Werkzeuge
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleToolItems.map((item) => (
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
        )}

        {/* Auswertungen */}
        {visibleAnalyticsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-[10px] tracking-wider">
              Auswertungen
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAnalyticsItems.map((item) => (
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
        )}

        {/* Trennlinie vor persönlichen Bereichen */}
        <div className="px-4 py-2">
          <Separator />
        </div>

        {/* Mein Konto - Collapsible */}
        <SidebarGroup>
          <Collapsible open={accountOpen} onOpenChange={setAccountOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground text-muted-foreground/70 uppercase text-[10px] tracking-wider">
                <span>Mein Konto</span>
                {!collapsed && (
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-transform",
                    accountOpen && "rotate-90"
                  )} />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {accountItems.map((item) => (
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

        {/* Shop-Verwaltung - Nur Tenant-Admins */}
        {showShopAdmin && (
          <SidebarGroup>
            <Collapsible open={shopAdminOpen} onOpenChange={setShopAdminOpen}>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground text-muted-foreground/70 uppercase text-[10px] tracking-wider">
                  <span>Shop-Verwaltung</span>
                  {!collapsed && (
                    <ChevronRight className={cn(
                      "h-3 w-3 transition-transform",
                      shopAdminOpen && "rotate-90"
                    )} />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {shopAdminItems.map((item) => (
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

        {/* Super-Admin - Nur für allenetze.de Admins */}
        {showSuperAdmin && (
          <SidebarGroup>
            <Collapsible open={superAdminOpen} onOpenChange={setSuperAdminOpen}>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground text-primary/70 uppercase text-[10px] tracking-wider font-semibold">
                  <span>⚡ Allenetze Admin</span>
                  {!collapsed && (
                    <ChevronRight className={cn(
                      "h-3 w-3 transition-transform",
                      superAdminOpen && "rotate-90"
                    )} />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {superAdminItems.map((item) => (
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
      
      {/* Footer with Workplace Mode Toggle and Identity Selector */}
      <SidebarFooter className="border-t border-sidebar-border space-y-2">
        {/* Workplace Mode Toggle: Shop vs Außendienst */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2",
          collapsed && "justify-center px-2"
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-1 w-full">
              <Button
                variant={isPOS ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex-1 gap-1.5 text-xs",
                  isPOS && "bg-primary text-primary-foreground"
                )}
                onClick={() => !isPOS && handleWorkplaceModeToggle()}
              >
                <Store className="h-3.5 w-3.5" />
                Shop
              </Button>
              <Button
                variant={!isPOS ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex-1 gap-1.5 text-xs",
                  !isPOS && "bg-primary text-primary-foreground"
                )}
                onClick={() => isPOS && handleWorkplaceModeToggle()}
              >
                <Briefcase className="h-3.5 w-3.5" />
                Außendienst
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleWorkplaceModeToggle}
              title={isPOS ? "Shop-Modus" : "Außendienst-Modus"}
            >
              {isPOS ? <Store className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Identity Selector - only for development mode */}
        {import.meta.env.DEV && !isSupabaseAuth && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center px-2"
              )}>
                <UserIcon className="h-4 w-4" />
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
