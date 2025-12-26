// ============================================
// Admin Panel - Phase 3B Complete
// Organisation, Policies, Daten, Protokoll
// ============================================

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIdentity, MOCK_IDENTITIES, type IdentityState } from "@/contexts/IdentityContext";
import { Building2, Settings, Database, Plus, Trash2, Users, FileText, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Organisation imports
import { 
  loadDepartments, 
  createDepartment, 
  deleteDepartment,
  type Department 
} from "@/lib/organisation";

// Policies imports
import { 
  getEffectivePolicy,
  updateTenantPolicyField,
  updateDeptPolicyField,
  loadDeptPolicy,
  clearDeptPolicy,
  type Policy,
  DEFAULT_POLICY
} from "@/lib/policies";

// Audit imports
import { 
  getRecentAuditEvents, 
  formatAuditAction,
  logDepartmentAction,
  logPolicyChange,
  type AuditEvent 
} from "@/lib/auditLog";

import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { identity, setMockIdentity, canAccessAdmin } = useIdentity();
  
  // State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [policy, setPolicy] = useState<Policy>(DEFAULT_POLICY);
  const [newDeptName, setNewDeptName] = useState("");
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [selectedDeptForPolicy, setSelectedDeptForPolicy] = useState<string | null>(null);

  // Load data on mount and identity change
  useEffect(() => {
    if (!canAccessAdmin) {
      navigate("/");
      return;
    }
    
    // Load departments
    const depts = loadDepartments(identity.tenantId);
    setDepartments(depts);
    
    // Load effective policy
    const eff = getEffectivePolicy(identity.tenantId, identity.departmentId);
    setPolicy(eff);
    
    // Load audit log
    const log = getRecentAuditEvents(identity.tenantId, identity.departmentId, 50);
    setAuditLog(log);
  }, [canAccessAdmin, identity.tenantId, identity.departmentId, navigate]);

  // Department CRUD
  const handleAddDepartment = useCallback(() => {
    if (!newDeptName.trim()) return;
    
    const newDept = createDepartment(identity.tenantId, newDeptName.trim());
    setDepartments(prev => [...prev, newDept]);
    setNewDeptName("");
    
    // Audit log
    logDepartmentAction(
      identity.tenantId,
      identity.departmentId,
      identity.userId,
      identity.displayName,
      identity.role,
      "department_create",
      newDept.id,
      { name: newDept.name }
    );
    
    toast({ title: "Abteilung hinzugefügt", description: newDept.name });
  }, [identity, newDeptName, toast]);

  const handleDeleteDepartment = useCallback((id: string) => {
    const dept = departments.find(d => d.id === id);
    if (!dept) return;
    
    deleteDepartment(identity.tenantId, id);
    setDepartments(prev => prev.filter(d => d.id !== id));
    
    // Audit log
    logDepartmentAction(
      identity.tenantId,
      identity.departmentId,
      identity.userId,
      identity.displayName,
      identity.role,
      "department_delete",
      id,
      { name: dept.name }
    );
    
    toast({ title: "Abteilung gelöscht" });
  }, [identity, departments, toast]);

  // Policy updates
  const handlePolicyChange = useCallback(<K extends keyof Policy>(key: K, value: Policy[K]) => {
    const oldValue = policy[key];
    
    if (selectedDeptForPolicy) {
      updateDeptPolicyField(identity.tenantId, selectedDeptForPolicy, key, value);
    } else {
      updateTenantPolicyField(identity.tenantId, key, value);
    }
    
    // Audit log
    logPolicyChange(
      identity.tenantId,
      identity.departmentId,
      identity.userId,
      identity.displayName,
      identity.role,
      selectedDeptForPolicy ? "department" : "tenant",
      { [key]: { from: oldValue, to: value } }
    );
    
    // Refresh policy
    const newPolicy = getEffectivePolicy(
      identity.tenantId, 
      selectedDeptForPolicy || identity.departmentId
    );
    setPolicy(newPolicy);
  }, [identity, policy, selectedDeptForPolicy]);

  const switchToIdentity = useCallback((id: IdentityState) => {
    setMockIdentity(id);
    toast({ 
      title: "Benutzer gewechselt", 
      description: `Angemeldet als ${id.displayName} (${id.role})` 
    });
  }, [setMockIdentity, toast]);

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
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="protokoll" className="gap-2">
              <FileText className="w-4 h-4" />
              Protokoll
            </TabsTrigger>
          </TabsList>

          {/* Organisation Tab */}
          <TabsContent value="organisation" className="space-y-6">
            {/* Departments */}
            <Card>
              <CardHeader>
                <CardTitle>Abteilungen</CardTitle>
                <CardDescription>
                  Verwalten Sie die Abteilungsstruktur (Tenant: {identity.tenantId})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Neue Abteilung..."
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddDepartment()}
                  />
                  <Button onClick={handleAddDepartment} className="gap-2">
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
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mock User Switcher */}
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
                <CardTitle>Richtlinien-Scope</CardTitle>
                <CardDescription>
                  Wählen Sie, ob Sie Tenant-weite oder Abteilungs-spezifische Richtlinien bearbeiten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedDeptForPolicy === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedDeptForPolicy(null);
                      setPolicy(getEffectivePolicy(identity.tenantId, identity.departmentId));
                    }}
                  >
                    Tenant-weit
                  </Button>
                  {departments.map(dept => (
                    <Button
                      key={dept.id}
                      variant={selectedDeptForPolicy === dept.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedDeptForPolicy(dept.id);
                        setPolicy(getEffectivePolicy(identity.tenantId, dept.id));
                      }}
                    >
                      {dept.name}
                    </Button>
                  ))}
                </div>
                {selectedDeptForPolicy && (
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        clearDeptPolicy(identity.tenantId, selectedDeptForPolicy);
                        setPolicy(getEffectivePolicy(identity.tenantId, selectedDeptForPolicy));
                        toast({ title: "Abteilungs-Overrides entfernt" });
                      }}
                    >
                      Abteilungs-Overrides löschen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anzeigerichtlinien</CardTitle>
                <CardDescription>
                  {selectedDeptForPolicy 
                    ? `Overrides für ${departments.find(d => d.id === selectedDeptForPolicy)?.name}` 
                    : "Tenant-weite Standardeinstellungen"}
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
                      variant={policy.defaultViewMode === "dealer" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePolicyChange("defaultViewMode", "dealer")}
                    >
                      Händler
                    </Button>
                    <Button
                      variant={policy.defaultViewMode === "customer" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePolicyChange("defaultViewMode", "customer")}
                    >
                      Kunde
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Allow Customer Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Kunden-Modus erlauben</Label>
                    <p className="text-sm text-muted-foreground">
                      Können Mitarbeiter in den Kunden-Modus wechseln?
                    </p>
                  </div>
                  <Switch
                    checked={policy.allowCustomerMode}
                    onCheckedChange={(checked) => handlePolicyChange("allowCustomerMode", checked)}
                  />
                </div>

                {/* Show Customer Session Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Kundensitzung-Toggle anzeigen</Label>
                    <p className="text-sm text-muted-foreground">
                      Soll der "Kundensitzung"-Schalter sichtbar sein?
                    </p>
                  </div>
                  <Switch
                    checked={policy.showCustomerSessionToggle}
                    onCheckedChange={(checked) => handlePolicyChange("showCustomerSessionToggle", checked)}
                  />
                </div>

                {/* Require Customer Session When Customer Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Kundensitzung bei Kunden-Modus erzwingen</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatisch Kundensitzung aktivieren wenn Kunden-Modus gewählt wird
                    </p>
                  </div>
                  <Switch
                    checked={policy.requireCustomerSessionWhenCustomerMode}
                    onCheckedChange={(checked) => handlePolicyChange("requireCustomerSessionWhenCustomerMode", checked)}
                  />
                </div>

                {/* Require Confirm on Dealer Switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bestätigung beim Dealer-Wechsel</Label>
                    <p className="text-sm text-muted-foreground">
                      Warnung anzeigen beim Wechsel von Kunde zu Händler
                    </p>
                  </div>
                  <Switch
                    checked={policy.requireConfirmOnDealerSwitch}
                    onCheckedChange={(checked) => handlePolicyChange("requireConfirmOnDealerSwitch", checked)}
                  />
                </div>

                <Separator />

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
                    value={policy.marginWarningThreshold}
                    onChange={(e) => handlePolicyChange("marginWarningThreshold", Number(e.target.value))}
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
                  Verwalten Sie Tarife, Hardware und andere Stammdaten mit Governance-Workflow
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

          {/* Protokoll Tab */}
          <TabsContent value="protokoll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Änderungsprotokoll</CardTitle>
                <CardDescription>
                  Letzte 50 Aktionen für {identity.tenantId} / {identity.departmentId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {auditLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Keine Protokolleinträge vorhanden
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {auditLog.map((event) => (
                        <div key={event.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Badge variant="outline" className="mb-1">
                                {formatAuditAction(event.action)}
                              </Badge>
                              <p className="text-sm font-medium">{event.target}</p>
                              {event.meta && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {JSON.stringify(event.meta).slice(0, 100)}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <div className="flex items-center gap-1 justify-end">
                                <User className="w-3 h-3" />
                                {event.actorDisplayName}
                              </div>
                              <div className="flex items-center gap-1 justify-end mt-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(event.ts), { addSuffix: true, locale: de })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
