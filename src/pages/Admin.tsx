// ============================================
// Admin Panel - Phase 3A Skeleton
// Organisation, Policies, Daten
// ============================================

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useIdentity, MOCK_IDENTITIES, type IdentityState } from "@/contexts/IdentityContext";
import { Building2, Settings, Database, Plus, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Storage keys for admin data
const ADMIN_STORAGE_KEYS = {
  DEPARTMENTS: "margenkalkulator_admin_departments",
  POLICIES: "margenkalkulator_admin_policies",
};

interface Department {
  id: string;
  name: string;
  description: string;
}

interface AdminPolicies {
  defaultViewMode: "dealer" | "customer";
  showCustomerSessionToggle: boolean;
  marginWarningThreshold: number;
  allowCustomerMode: boolean;
}

const DEFAULT_POLICIES: AdminPolicies = {
  defaultViewMode: "dealer",
  showCustomerSessionToggle: true,
  marginWarningThreshold: 0,
  allowCustomerMode: true,
};

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: "hq", name: "Hauptverwaltung", description: "Zentrale Administration" },
  { id: "store_berlin", name: "Store Berlin", description: "Filiale Berlin Mitte" },
  { id: "store_munich", name: "Store München", description: "Filiale München Zentrum" },
];

function loadDepartments(): Department[] {
  try {
    const json = localStorage.getItem(ADMIN_STORAGE_KEYS.DEPARTMENTS);
    return json ? JSON.parse(json) : DEFAULT_DEPARTMENTS;
  } catch {
    return DEFAULT_DEPARTMENTS;
  }
}

function saveDepartments(departments: Department[]): void {
  localStorage.setItem(ADMIN_STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
}

function loadPolicies(): AdminPolicies {
  try {
    const json = localStorage.getItem(ADMIN_STORAGE_KEYS.POLICIES);
    return json ? { ...DEFAULT_POLICIES, ...JSON.parse(json) } : DEFAULT_POLICIES;
  } catch {
    return DEFAULT_POLICIES;
  }
}

function savePolicies(policies: AdminPolicies): void {
  localStorage.setItem(ADMIN_STORAGE_KEYS.POLICIES, JSON.stringify(policies));
}

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { identity, setMockIdentity, canAccessAdmin } = useIdentity();
  
  const [departments, setDepartments] = useState<Department[]>(loadDepartments);
  const [policies, setPolicies] = useState<AdminPolicies>(loadPolicies);
  const [newDeptName, setNewDeptName] = useState("");

  // Redirect non-admin users
  useEffect(() => {
    if (!canAccessAdmin) {
      navigate("/");
    }
  }, [canAccessAdmin, navigate]);

  // Save on change
  useEffect(() => {
    saveDepartments(departments);
  }, [departments]);

  useEffect(() => {
    savePolicies(policies);
  }, [policies]);

  const addDepartment = () => {
    if (!newDeptName.trim()) return;
    const newDept: Department = {
      id: `dept_${Date.now()}`,
      name: newDeptName.trim(),
      description: "",
    };
    setDepartments([...departments, newDept]);
    setNewDeptName("");
    toast({ title: "Abteilung hinzugefügt", description: newDept.name });
  };

  const deleteDepartment = (id: string) => {
    setDepartments(departments.filter((d) => d.id !== id));
    toast({ title: "Abteilung gelöscht" });
  };

  const updatePolicy = <K extends keyof AdminPolicies>(key: K, value: AdminPolicies[K]) => {
    setPolicies((prev) => ({ ...prev, [key]: value }));
  };

  const switchToIdentity = (id: IdentityState) => {
    setMockIdentity(id);
    toast({ 
      title: "Benutzer gewechselt", 
      description: `Angemeldet als ${id.displayName} (${id.role})` 
    });
  };

  if (!canAccessAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Organisation, Richtlinien und Daten
          </p>
        </div>

        <Tabs defaultValue="organisation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="organisation" className="gap-2">
              <Building2 className="w-4 h-4" />
              Organisation
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-2">
              <Settings className="w-4 h-4" />
              Richtlinien
            </TabsTrigger>
            <TabsTrigger value="daten" className="gap-2">
              <Database className="w-4 h-4" />
              Daten
            </TabsTrigger>
          </TabsList>

          {/* Organisation Tab */}
          <TabsContent value="organisation" className="space-y-6">
            {/* Departments */}
            <Card>
              <CardHeader>
                <CardTitle>Abteilungen</CardTitle>
                <CardDescription>
                  Verwalten Sie die Abteilungsstruktur für Scoping von Angeboten und Daten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Neue Abteilung..."
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addDepartment()}
                  />
                  <Button onClick={addDepartment} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Hinzufügen
                  </Button>
                </div>

                <div className="divide-y">
                  {departments.map((dept) => (
                    <div key={dept.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">{dept.description || dept.id}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDepartment(dept.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mock User Switcher (Dev) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Benutzer-Simulation (Entwicklung)
                </CardTitle>
                <CardDescription>
                  Wechseln Sie zwischen Mock-Benutzern um verschiedene Rollen zu testen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_IDENTITIES.map((id) => (
                    <button
                      key={id.userId}
                      onClick={() => switchToIdentity(id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        identity?.userId === id.userId
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{id.displayName}</span>
                        <Badge variant={id.role === "admin" ? "default" : "secondary"}>
                          {id.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {id.departmentId} • {id.tenantId}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Anzeigerichtlinien</CardTitle>
                <CardDescription>
                  Steuern Sie das Standardverhalten der Anwendung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default View Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Standard-Ansichtsmodus</Label>
                    <p className="text-sm text-muted-foreground">
                      Welcher Modus soll beim Öffnen aktiv sein?
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={policies.defaultViewMode === "dealer" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updatePolicy("defaultViewMode", "dealer")}
                    >
                      Händler
                    </Button>
                    <Button
                      variant={policies.defaultViewMode === "customer" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updatePolicy("defaultViewMode", "customer")}
                    >
                      Kunde
                    </Button>
                  </div>
                </div>

                {/* Allow Customer Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Kunden-Modus erlauben</Label>
                    <p className="text-sm text-muted-foreground">
                      Können Mitarbeiter in den Kunden-Modus wechseln?
                    </p>
                  </div>
                  <Switch
                    checked={policies.allowCustomerMode}
                    onCheckedChange={(checked) => updatePolicy("allowCustomerMode", checked)}
                  />
                </div>

                {/* Show Customer Session Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Kundensitzung-Toggle anzeigen</Label>
                    <p className="text-sm text-muted-foreground">
                      Soll der "Kundensitzung"-Schalter im Kalkulator sichtbar sein?
                    </p>
                  </div>
                  <Switch
                    checked={policies.showCustomerSessionToggle}
                    onCheckedChange={(checked) => updatePolicy("showCustomerSessionToggle", checked)}
                  />
                </div>

                {/* Margin Warning Threshold */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marge-Warnung ab (€)</Label>
                    <p className="text-sm text-muted-foreground">
                      Warnung anzeigen wenn Marge unter diesem Wert liegt
                    </p>
                  </div>
                  <Input
                    type="number"
                    value={policies.marginWarningThreshold}
                    onChange={(e) => updatePolicy("marginWarningThreshold", Number(e.target.value))}
                    className="w-24 text-right"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daten Tab */}
          <TabsContent value="daten" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Datenverwaltung</CardTitle>
                <CardDescription>
                  Verwalten Sie Tarife, Hardware und andere Stammdaten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => navigate("/data-manager")} className="gap-2">
                  <Database className="w-4 h-4" />
                  Zum Datenmanager
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/data-manager/hardware")} 
                  className="gap-2 ml-2"
                >
                  Hardware verwalten
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
