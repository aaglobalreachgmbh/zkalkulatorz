import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Users, CheckCircle } from "lucide-react";
import { ProvisionDashboard } from "@/components/provisions/ProvisionDashboard";
import { useUserRole } from "@/hooks/useUserRole";

export default function Provisions() {
  const [activeTab, setActiveTab] = useState("my-provisions");
  const { isAdmin, isTenantAdmin } = useUserRole();
  const hasAdminAccess = isAdmin || isTenantAdmin;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-provisions" className="gap-2">
              <Wallet className="h-4 w-4" />
              Meine Provision
            </TabsTrigger>
            {hasAdminAccess && (
              <>
                <TabsTrigger value="team" className="gap-2">
                  <Users className="h-4 w-4" />
                  Team
                </TabsTrigger>
                <TabsTrigger value="approval" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Freigabe
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="my-provisions" className="mt-6">
            <ProvisionDashboard />
          </TabsContent>

          {hasAdminAccess && (
            <>
              <TabsContent value="team" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Team-Übersicht kommt bald</p>
                </div>
              </TabsContent>

              <TabsContent value="approval" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Freigabe-Workflow kommt bald</p>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
