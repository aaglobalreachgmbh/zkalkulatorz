// ============================================
// Mitarbeiter-Berechtigungen Dashboard
// Tenant-Admin kann hier Mitarbeiter-Rechte verwalten
// ============================================

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";
import {
  Users,
  Shield,
  Check,
  X,
  Loader2,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  Calculator,
  FileText,
  Building2,
  ClipboardList,
  Calendar,
  Megaphone,
  Package,
  Inbox,
  BarChart3,
  Eye,
  Download,
  UserCog,
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MENU_ITEMS, type MenuItemId } from "@/hooks/usePermissions";

// ============================================
// Berechtigungs-Konfiguration mit Icons
// ============================================
const FUNCTION_PERMISSIONS = [
  { 
    key: "can_use_calculator", 
    label: "Kalkulator nutzen",
    description: "Darf Angebote berechnen",
    icon: Calculator,
    defaultValue: true,
  },
  { 
    key: "can_create_offers", 
    label: "Angebote erstellen",
    description: "Darf Angebote speichern und versenden",
    icon: FileText,
    defaultValue: true,
  },
  { 
    key: "can_manage_customers", 
    label: "Kunden verwalten",
    description: "Darf Kunden anlegen und bearbeiten",
    icon: Building2,
    defaultValue: true,
  },
  { 
    key: "can_view_margins", 
    label: "Margen einsehen",
    description: "Sieht EK-Preise und Provisionen",
    icon: Eye,
    defaultValue: false,
  },
  { 
    key: "can_export_pdf", 
    label: "Händler-PDF exportieren",
    description: "Darf PDF mit internen Daten exportieren",
    icon: Download,
    defaultValue: false,
  },
  { 
    key: "can_view_reporting", 
    label: "Auswertungen einsehen",
    description: "Zugriff auf Statistiken und Reports",
    icon: BarChart3,
    defaultValue: false,
  },
  { 
    key: "can_view_team", 
    label: "Team-Übersicht",
    description: "Sieht andere Team-Mitglieder",
    icon: Users,
    defaultValue: false,
  },
  { 
    key: "can_use_inbox", 
    label: "Posteingang nutzen",
    description: "Zugriff auf E-Mail-Integration",
    icon: Inbox,
    defaultValue: false,
  },
  { 
    key: "can_use_bundles", 
    label: "Bundles konfigurieren",
    description: "Darf Paket-Konfigurationen erstellen",
    icon: Package,
    defaultValue: false,
  },
];

const MENU_ITEM_CONFIG: Record<MenuItemId, { icon: React.ComponentType<any>; label: string }> = {
  calculator: { icon: Calculator, label: "Kalkulator" },
  offers: { icon: FileText, label: "Angebote" },
  customers: { icon: Building2, label: "Kunden" },
  contracts: { icon: ClipboardList, label: "Verträge" },
  calendar: { icon: Calendar, label: "Kalender" },
  news: { icon: Megaphone, label: "News & Aktionen" },
  bundles: { icon: Package, label: "Bundles" },
  inbox: { icon: Inbox, label: "Posteingang" },
  reporting: { icon: BarChart3, label: "Auswertungen" },
  team: { icon: Users, label: "Team" },
};

// ============================================
// Types
// ============================================
interface TeamMember {
  id: string;
  user_id: string;
  display_name: string | null;
  department: string | null;
  tenant_id: string;
  // Berechtigungen
  allowed_menu_items: string[] | null;
  can_use_calculator: boolean | null;
  can_create_offers: boolean | null;
  can_view_margins: boolean | null;
  can_export_pdf: boolean | null;
  can_manage_customers: boolean | null;
  can_view_reporting: boolean | null;
  can_view_team: boolean | null;
  can_use_inbox: boolean | null;
  can_use_bundles: boolean | null;
}

// ============================================
// Component
// ============================================
export default function AdminPermissions() {
  const { identity } = useIdentity();
  const queryClient = useQueryClient();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<TeamMember>>>({});

  // Lade alle Team-Mitglieder des Tenants
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-permissions", identity.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_settings")
        .select("*")
        .eq("tenant_id", identity.tenantId);
      
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
    enabled: !!identity.tenantId,
  });

  // Mutation zum Speichern
  const saveMutation = useMutation({
    mutationFn: async ({ userId, changes }: { userId: string; changes: Partial<TeamMember> }) => {
      const { error } = await supabase
        .from("employee_settings")
        .update({
          ...changes,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("tenant_id", identity.tenantId);
      
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      toast.success("Berechtigungen gespeichert");
      setLocalChanges(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["team-permissions"] });
    },
    onError: (error) => {
      toast.error("Fehler beim Speichern: " + (error as Error).message);
    },
  });

  // Lokale Änderungen tracken
  const updateLocal = (userId: string, key: string, value: any) => {
    setLocalChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [key]: value,
      },
    }));
  };

  // Toggle Menüpunkt
  const toggleMenuItem = (userId: string, menuId: string, currentItems: string[]) => {
    const newItems = currentItems.includes(menuId)
      ? currentItems.filter(id => id !== menuId)
      : [...currentItems, menuId];
    updateLocal(userId, "allowed_menu_items", newItems);
  };

  // Berechne aktuelle Werte (DB + lokale Änderungen)
  const getCurrentValue = (member: TeamMember, key: keyof TeamMember) => {
    const localValue = localChanges[member.user_id]?.[key];
    return localValue !== undefined ? localValue : member[key];
  };

  const hasChanges = (userId: string) => {
    return Object.keys(localChanges[userId] || {}).length > 0;
  };

  const resetChanges = (userId: string) => {
    setLocalChanges(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Mitarbeiter-Berechtigungen</h1>
              <p className="text-sm text-muted-foreground">
                Legen Sie fest, wer auf welche Funktionen zugreifen darf
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Info */}
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Hinweis:</strong> Admins und Shop-Administratoren haben automatisch Zugriff auf alle Funktionen. 
              Die hier eingestellten Berechtigungen gelten nur für normale Mitarbeiter.
            </AlertDescription>
          </Alert>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!teamMembers || teamMembers.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-2">Noch keine Mitarbeiter</h3>
                <p className="text-muted-foreground text-sm">
                  Sobald Mitarbeiter Ihrem Shop beitreten, können Sie hier deren Berechtigungen verwalten.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Team Members */}
          <div className="space-y-4">
            {teamMembers?.map((member) => {
              const isExpanded = expandedUser === member.user_id;
              const currentMenuItems = (getCurrentValue(member, "allowed_menu_items") as string[]) || 
                                       Object.keys(MENU_ITEMS).slice(0, 6);
              
              return (
                <Card key={member.user_id} className={hasChanges(member.user_id) ? "ring-2 ring-primary" : ""}>
                  <Collapsible open={isExpanded} onOpenChange={() => setExpandedUser(isExpanded ? null : member.user_id)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {member.display_name || "Unbekannt"}
                              </CardTitle>
                              <CardDescription>
                                {member.department || "Keine Abteilung"}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasChanges(member.user_id) && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                Ungespeichert
                              </Badge>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-6">
                        <Separator />
                        
                        {/* Funktions-Berechtigungen */}
                        <div>
                          <h4 className="font-medium mb-4 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            Funktionen
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {FUNCTION_PERMISSIONS.map((perm) => {
                              const currentValue = getCurrentValue(member, perm.key as keyof TeamMember) ?? perm.defaultValue;
                              const Icon = perm.icon;
                              
                              return (
                                <label
                                  key={perm.key}
                                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                  <Checkbox
                                    checked={currentValue as boolean}
                                    onCheckedChange={(checked) => 
                                      updateLocal(member.user_id, perm.key, checked)
                                    }
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                      <Icon className="h-4 w-4 text-muted-foreground" />
                                      {perm.label}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {perm.description}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <Separator />

                        {/* Sichtbare Menüpunkte */}
                        <div>
                          <h4 className="font-medium mb-4 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            Sichtbare Menüpunkte
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(Object.keys(MENU_ITEMS) as MenuItemId[]).map((menuId) => {
                              const config = MENU_ITEM_CONFIG[menuId];
                              const isActive = currentMenuItems.includes(menuId);
                              const Icon = config.icon;
                              
                              return (
                                <Button
                                  key={menuId}
                                  variant={isActive ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleMenuItem(member.user_id, menuId, currentMenuItems)}
                                  className="gap-2"
                                >
                                  <Icon className="h-4 w-4" />
                                  {config.label}
                                  {isActive ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <X className="h-3 w-3 opacity-50" />
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        {hasChanges(member.user_id) && (
                          <>
                            <Separator />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => resetChanges(member.user_id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Zurücksetzen
                              </Button>
                              <Button
                                onClick={() => saveMutation.mutate({
                                  userId: member.user_id,
                                  changes: localChanges[member.user_id],
                                })}
                                disabled={saveMutation.isPending}
                              >
                                {saveMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 mr-2" />
                                )}
                                Speichern
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
