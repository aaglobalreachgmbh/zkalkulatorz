import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, FileEdit, Download } from "lucide-react";
import { TimeTrackingOverview } from "@/components/time-tracking/TimeTrackingOverview";
import { useUserRole } from "@/hooks/useUserRole";

export default function TimeTracking() {
  const [activeTab, setActiveTab] = useState("my-time");
  const { isAdmin, isTenantAdmin } = useUserRole();
  const hasAdminAccess = isAdmin || isTenantAdmin;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Zeiterfassung
          </h1>
          <p className="text-muted-foreground">
            Arbeitszeiten erfassen, verwalten und exportieren
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-time" className="gap-2">
              <Clock className="h-4 w-4" />
              Meine Zeiten
            </TabsTrigger>
            {hasAdminAccess && (
              <>
                <TabsTrigger value="team" className="gap-2">
                  <Users className="h-4 w-4" />
                  Team
                </TabsTrigger>
                <TabsTrigger value="corrections" className="gap-2">
                  <FileEdit className="h-4 w-4" />
                  Korrekturen
                </TabsTrigger>
                <TabsTrigger value="export" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="my-time" className="mt-6">
            <TimeTrackingOverview />
          </TabsContent>

          {hasAdminAccess && (
            <>
              <TabsContent value="team" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Team-Übersicht kommt bald</p>
                </div>
              </TabsContent>

              <TabsContent value="corrections" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <FileEdit className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Korrekturanträge kommt bald</p>
                </div>
              </TabsContent>

              <TabsContent value="export" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Download className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Export-Funktion kommt bald</p>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
