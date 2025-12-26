import { Calculator, Users, BarChart3, Building2, FolderOpen, Shield, Database, Settings, Home, Package, ShieldCheck } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useIdentity } from "@/contexts/IdentityContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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
];

const adminItems = [
  { title: "Administration", url: "/admin", icon: ShieldCheck },
  { title: "Datenmanager", url: "/data-manager", icon: Database },
  { title: "Security Dashboard", url: "/security", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { canAccessAdmin } = useIdentity();
  
  // Show admin section if user has admin role OR can access admin via identity
  const showAdminSection = isAdmin || canAccessAdmin;

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
    </Sidebar>
  );
}
