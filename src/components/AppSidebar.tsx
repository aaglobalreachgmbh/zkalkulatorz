import { Calculator, Users, BarChart3, Building2, FolderOpen, Shield, Database, Settings, Home, Package, ShieldCheck, CreditCard, FileText, Radar, User, ChevronDown, Activity, UserX } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useIdentity, MOCK_IDENTITIES } from "@/contexts/IdentityContext";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Kalkulator", url: "/calculator", icon: Calculator },
  { title: "Bundles", url: "/bundles", icon: Package },
  { title: "Meine Angebote", url: "/offers", icon: FolderOpen },
  { title: "Kunden", url: "/customers", icon: Building2 },
  { title: "Team", url: "/team", icon: Users },
  { title: "Reporting", url: "/reporting", icon: BarChart3 },
];

const settingsItems = [
  { title: "Sicherheit", url: "/settings/security", icon: Settings },
  { title: "Lizenz", url: "/license", icon: CreditCard },
];

const adminItems = [
  { title: "Administration", url: "/admin", icon: ShieldCheck },
  { title: "Mitarbeiter", url: "/admin/employees", icon: Users },
  { title: "Push-Provisionen", url: "/admin/push-provisions", icon: CreditCard },
  { title: "Datenmanager", url: "/data-manager", icon: Database },
  { title: "Security Status", url: "/security/status", icon: Activity },
  { title: "Security Events", url: "/security", icon: Shield },
  { title: "Security Report", url: "/security/report", icon: FileText },
  { title: "Threat Intelligence", url: "/security/threat-intel", icon: Radar },
  { title: "DSGVO Dashboard", url: "/security/gdpr", icon: UserX },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { identity, canAccessAdmin, setMockIdentity, clearMockIdentity, isSupabaseAuth } = useIdentity();
  
  // Show admin section if user has admin role OR can access admin via identity
  const showAdminSection = isAdmin || canAccessAdmin;

  const roleColors: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    manager: "bg-blue-500 text-white",
    sales: "bg-emerald-500 text-white",
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo area */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-4 border-b border-sidebar-border",
          collapsed && "justify-center px-2"
        )}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Calculator className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">MargenKalkulator</span>
              <span className="text-xs text-muted-foreground">Business Partner</span>
            </div>
          )}
        </div>

        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
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

        {/* Settings section */}
        <SidebarGroup>
          <SidebarGroupLabel>Einstellungen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
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

        {/* Admin section */}
        {showAdminSection && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
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
      </SidebarContent>
      
      {/* Identity Selector in Footer */}
      {!isSupabaseAuth && (
        <SidebarFooter className="border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center px-2"
              )}>
                <User className="h-4 w-4" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{identity.displayName}</span>
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
              <DropdownMenuItem onClick={clearMockIdentity} className="text-muted-foreground">
                Abmelden (Gast)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
