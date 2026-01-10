// ============================================
// Team Kanban Board Component
// Main Kanban-style layout for team management
// ============================================

import { useState } from "react";
import { Shield, Users, Mail, UserX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamColumnHeader } from "./TeamColumnHeader";
import { TeamMemberCard, TeamMemberData } from "./TeamMemberCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamKanbanBoardProps {
  admins: TeamMemberData[];
  members: TeamMemberData[];
  invitations: TeamMemberData[];
  inactive: TeamMemberData[];
  canManage: boolean;
  onPromote?: (member: TeamMemberData) => void;
  onDemote?: (member: TeamMemberData) => void;
  onRemove?: (member: TeamMemberData) => void;
  onResendInvitation?: (member: TeamMemberData) => void;
  onRevokeInvitation?: (member: TeamMemberData) => void;
  onAddMember?: () => void;
}

type TabValue = "all" | "invitations" | "inactive";

export function TeamKanbanBoard({
  admins,
  members,
  invitations,
  inactive,
  canManage,
  onPromote,
  onDemote,
  onRemove,
  onResendInvitation,
  onRevokeInvitation,
  onAddMember,
}: TeamKanbanBoardProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  // Column configurations
  const columns = [
    {
      id: "admins",
      title: "Admins",
      icon: Shield,
      color: "bg-blue-100 text-blue-700",
      items: admins,
      showIn: ["all"] as TabValue[],
    },
    {
      id: "members",
      title: "Mitarbeiter",
      icon: Users,
      color: "bg-primary/10 text-primary",
      items: members,
      showIn: ["all"] as TabValue[],
    },
    {
      id: "invitations",
      title: "Einladungen",
      icon: Mail,
      color: "bg-amber-100 text-amber-700",
      items: invitations,
      showIn: ["all", "invitations"] as TabValue[],
    },
    {
      id: "inactive",
      title: "Inaktiv",
      icon: UserX,
      color: "bg-muted text-muted-foreground",
      items: inactive,
      showIn: ["inactive"] as TabValue[],
    },
  ];

  const visibleColumns = columns.filter((col) => col.showIn.includes(activeTab));

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="bg-muted/50 p-1 rounded-full">
            <TabsTrigger value="all" className="rounded-full px-4">
              Alle Mitarbeiter
            </TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-full px-4">
              Einladungen
              {invitations.length > 0 && (
                <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {invitations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-full px-4">
              Inaktiv
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {canManage && onAddMember && (
          <Button onClick={onAddMember} className="gap-2">
            <Plus className="h-4 w-4" />
            Einladen
          </Button>
        )}
      </div>

      {/* Kanban Columns - Desktop */}
      <div className="hidden md:grid gap-6" style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, 1fr)` }}>
        {visibleColumns.map((column) => (
          <div key={column.id} className="flex flex-col bg-muted/30 rounded-xl border min-h-[400px]">
            <TeamColumnHeader
              title={column.title}
              count={column.items.length}
              icon={column.icon}
              color={column.color}
            />
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {column.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <column.icon className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Keine {column.title}</p>
                  </div>
                ) : (
                  column.items.map((item) => (
                    <TeamMemberCard
                      key={item.id}
                      member={item}
                      canManage={canManage}
                      onPromote={onPromote ? () => onPromote(item) : undefined}
                      onDemote={onDemote ? () => onDemote(item) : undefined}
                      onRemove={onRemove ? () => onRemove(item) : undefined}
                      onResendInvitation={onResendInvitation ? () => onResendInvitation(item) : undefined}
                      onRevokeInvitation={onRevokeInvitation ? () => onRevokeInvitation(item) : undefined}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
            
            {/* Quick Add Button in Column */}
            {canManage && column.id === "invitations" && onAddMember && (
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-dashed"
                  onClick={onAddMember}
                >
                  <Plus className="h-4 w-4" />
                  Mitarbeiter einladen
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile View - Stacked Cards */}
      <div className="md:hidden space-y-6">
        {visibleColumns.map((column) => (
          <div key={column.id} className="bg-muted/30 rounded-xl border">
            <TeamColumnHeader
              title={column.title}
              count={column.items.length}
              icon={column.icon}
              color={column.color}
            />
            <div className="p-3 space-y-2">
              {column.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <column.icon className="h-6 w-6 mb-2 opacity-30" />
                  <p className="text-sm">Keine {column.title}</p>
                </div>
              ) : (
                column.items.map((item) => (
                  <TeamMemberCard
                    key={item.id}
                    member={item}
                    canManage={canManage}
                    onPromote={onPromote ? () => onPromote(item) : undefined}
                    onDemote={onDemote ? () => onDemote(item) : undefined}
                    onRemove={onRemove ? () => onRemove(item) : undefined}
                    onResendInvitation={onResendInvitation ? () => onResendInvitation(item) : undefined}
                    onRevokeInvitation={onRevokeInvitation ? () => onRevokeInvitation(item) : undefined}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
