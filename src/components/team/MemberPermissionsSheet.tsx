// ============================================
// Member Permissions Sheet Component
// Slide-over panel for editing member permissions
// ============================================

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { TeamMemberData } from "./TeamMemberCard";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Save,
  Loader2,
  Settings,
  Menu,
  Percent,
  Shield,
} from "lucide-react";
import { MENU_ITEMS, DEFAULT_ALLOWED_MENUS } from "@/hooks/usePermissions";

interface MemberPermissionsSheetProps {
  member: TeamMemberData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

interface EmployeeSettings {
  can_view_margins: boolean;
  can_export_pdf: boolean;
  can_view_reporting: boolean;
  can_view_team: boolean;
  can_use_inbox: boolean;
  can_use_bundles: boolean;
  can_create_offers: boolean;
  can_manage_customers: boolean;
  can_use_calculator: boolean;
  allowed_menu_items: string[];
  provision_deduction: number;
  provision_deduction_type: "percent" | "fixed";
}

const defaultSettings: EmployeeSettings = {
  can_view_margins: true,
  can_export_pdf: true,
  can_view_reporting: false,
  can_view_team: false,
  can_use_inbox: false,
  can_use_bundles: true,
  can_create_offers: true,
  can_manage_customers: true,
  can_use_calculator: true,
  allowed_menu_items: DEFAULT_ALLOWED_MENUS,
  provision_deduction: 0,
  provision_deduction_type: "percent",
};

const permissionLabels: Record<string, { label: string; description: string }> = {
  can_view_margins: { label: "Margen einsehen", description: "Kann Margen und Provisionen sehen" },
  can_export_pdf: { label: "PDF exportieren", description: "Kann Angebote als PDF exportieren" },
  can_view_reporting: { label: "Reporting einsehen", description: "Zugriff auf Auswertungen" },
  can_view_team: { label: "Team einsehen", description: "Kann Team-Übersicht sehen" },
  can_use_inbox: { label: "Inbox verwenden", description: "Zugriff auf E-Mail-Inbox" },
  can_use_bundles: { label: "Bundles verwenden", description: "Kann vordefinierte Bundles nutzen" },
  can_create_offers: { label: "Angebote erstellen", description: "Kann neue Angebote anlegen" },
  can_manage_customers: { label: "Kunden verwalten", description: "Kann Kunden anlegen/bearbeiten" },
  can_use_calculator: { label: "Kalkulator nutzen", description: "Zugriff auf den Kalkulator" },
};

export function MemberPermissionsSheet({
  member,
  open,
  onOpenChange,
  onSaved,
}: MemberPermissionsSheetProps) {
  const { identity } = useIdentity();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<EmployeeSettings>(defaultSettings);
  const [sectionsOpen, setSectionsOpen] = useState({
    permissions: true,
    menu: false,
    provision: false,
  });

  // Fetch current settings
  const settingsQuery = useQuery({
    queryKey: ["employee-settings", member?.id],
    queryFn: async () => {
      if (!member?.id) return null;

      const { data, error } = await supabase
        .from("employee_settings")
        .select("*")
        .eq("user_id", member.id)
        .maybeSingle();

      if (error) {
        console.warn("[MemberPermissionsSheet] Query error:", error.message);
        return null;
      }

      return data;
    },
    enabled: !!member?.id && open,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (settingsQuery.data) {
      setSettings({
        can_view_margins: settingsQuery.data.can_view_margins ?? defaultSettings.can_view_margins,
        can_export_pdf: settingsQuery.data.can_export_pdf ?? defaultSettings.can_export_pdf,
        can_view_reporting: settingsQuery.data.can_view_reporting ?? defaultSettings.can_view_reporting,
        can_view_team: settingsQuery.data.can_view_team ?? defaultSettings.can_view_team,
        can_use_inbox: settingsQuery.data.can_use_inbox ?? defaultSettings.can_use_inbox,
        can_use_bundles: settingsQuery.data.can_use_bundles ?? defaultSettings.can_use_bundles,
        can_create_offers: settingsQuery.data.can_create_offers ?? defaultSettings.can_create_offers,
        can_manage_customers: settingsQuery.data.can_manage_customers ?? defaultSettings.can_manage_customers,
        can_use_calculator: settingsQuery.data.can_use_calculator ?? defaultSettings.can_use_calculator,
        allowed_menu_items: settingsQuery.data.allowed_menu_items ?? DEFAULT_ALLOWED_MENUS,
        provision_deduction: settingsQuery.data.provision_deduction ?? 0,
        provision_deduction_type: (settingsQuery.data.provision_deduction_type as "percent" | "fixed") ?? "percent",
      });
    } else if (member && !settingsQuery.isLoading) {
      // Reset to defaults for new settings
      setSettings(defaultSettings);
    }
  }, [settingsQuery.data, settingsQuery.isLoading, member]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!member?.id || !identity.tenantId) throw new Error("Missing data");

      const { error } = await supabase
        .from("employee_settings")
        .upsert({
          user_id: member.id,
          tenant_id: identity.tenantId,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Berechtigungen für ${member?.name} gespeichert`);
      queryClient.invalidateQueries({ queryKey: ["employee-settings"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-members"] });
      onSaved?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("[MemberPermissionsSheet] Save error:", error);
      toast.error("Fehler beim Speichern");
    },
  });

  const togglePermission = (key: keyof EmployeeSettings) => {
    if (typeof settings[key] === "boolean") {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const toggleMenuItem = (itemId: string) => {
    setSettings((prev) => ({
      ...prev,
      allowed_menu_items: prev.allowed_menu_items.includes(itemId)
        ? prev.allowed_menu_items.filter((id) => id !== itemId)
        : [...prev.allowed_menu_items, itemId],
    }));
  };

  if (!member) return null;

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{member.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                {member.email}
                <Badge variant="outline" className="text-xs">
                  {member.role === "tenant_admin" ? "Admin" : "Mitarbeiter"}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-4">
          {/* General Permissions */}
          <Collapsible
            open={sectionsOpen.permissions}
            onOpenChange={(open) => setSectionsOpen((s) => ({ ...s, permissions: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Allgemeine Berechtigungen</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${sectionsOpen.permissions ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-2">
              {Object.entries(permissionLabels).map(([key, { label, description }]) => (
                <div
                  key={key}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => togglePermission(key as keyof EmployeeSettings)}
                >
                  <Checkbox
                    checked={settings[key as keyof EmployeeSettings] as boolean}
                    onCheckedChange={() => togglePermission(key as keyof EmployeeSettings)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Menu Access */}
          <Collapsible
            open={sectionsOpen.menu}
            onOpenChange={(open) => setSectionsOpen((s) => ({ ...s, menu: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Menu className="h-4 w-4 text-primary" />
                <span className="font-medium">Menü-Zugriff</span>
                <Badge variant="secondary" className="text-xs">
                  {settings.allowed_menu_items.length} aktiv
                </Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${sectionsOpen.menu ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(MENU_ITEMS).map(([key, { label }]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => toggleMenuItem(key)}
                  >
                    <Checkbox
                      checked={settings.allowed_menu_items.includes(key)}
                      onCheckedChange={() => toggleMenuItem(key)}
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Provision Deduction */}
          <Collapsible
            open={sectionsOpen.provision}
            onOpenChange={(open) => setSectionsOpen((s) => ({ ...s, provision: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                <span className="font-medium">Provisions-Abzug</span>
                {settings.provision_deduction > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {settings.provision_deduction}{settings.provision_deduction_type === "percent" ? "%" : "€"}
                  </Badge>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${sectionsOpen.provision ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="grid gap-2">
                <Label>Abzugstyp</Label>
                <Select
                  value={settings.provision_deduction_type}
                  onValueChange={(v) =>
                    setSettings((s) => ({ ...s, provision_deduction_type: v as "percent" | "fixed" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Prozent (%)</SelectItem>
                    <SelectItem value="fixed">Fester Betrag (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Abzugswert</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={settings.provision_deduction_type === "percent" ? 100 : undefined}
                    value={settings.provision_deduction}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, provision_deduction: parseFloat(e.target.value) || 0 }))
                    }
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">
                    {settings.provision_deduction_type === "percent" ? "%" : "€"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dieser Wert wird von der Provision des Mitarbeiters abgezogen.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Speichern
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
