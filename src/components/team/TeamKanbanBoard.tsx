// ============================================
// Team Kanban Board Component
// Main Kanban-style layout for team management with Drag-and-Drop
// ============================================

import { useState } from "react";
import { Shield, Users, Mail, UserX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamColumnHeader } from "./TeamColumnHeader";
import { TeamMemberData } from "./TeamMemberCard";
import { SortableTeamMemberCard } from "./SortableTeamMemberCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

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
  onMemberClick?: (member: TeamMemberData) => void;
}

type TabValue = "all" | "invitations" | "inactive";
type ColumnId = "admins" | "members" | "invitations" | "inactive";

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
  onMemberClick,
}: TeamKanbanBoardProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<ColumnId | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Column configurations
  const columns = [
    {
      id: "admins" as ColumnId,
      title: "Admins",
      icon: Shield,
      color: "bg-blue-100 text-blue-700",
      items: admins,
      showIn: ["all"] as TabValue[],
    },
    {
      id: "members" as ColumnId,
      title: "Mitarbeiter",
      icon: Users,
      color: "bg-primary/10 text-primary",
      items: members,
      showIn: ["all"] as TabValue[],
    },
    {
      id: "invitations" as ColumnId,
      title: "Einladungen",
      icon: Mail,
      color: "bg-amber-100 text-amber-700",
      items: invitations,
      showIn: ["all", "invitations"] as TabValue[],
    },
    {
      id: "inactive" as ColumnId,
      title: "Inaktiv",
      icon: UserX,
      color: "bg-muted text-muted-foreground",
      items: inactive,
      showIn: ["inactive"] as TabValue[],
    },
  ];

  const visibleColumns = columns.filter((col) => col.showIn.includes(activeTab));

  // Find member being dragged
  const activeMember = activeDragId
    ? [...admins, ...members, ...inactive].find((m) => m.id === activeDragId)
    : null;

  // Get column for a member
  const getColumnForMember = (memberId: string): ColumnId | null => {
    if (admins.find((m) => m.id === memberId)) return "admins";
    if (members.find((m) => m.id === memberId)) return "members";
    if (inactive.find((m) => m.id === memberId)) return "inactive";
    return null;
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      // Check if over a column
      const columnId = over.id as string;
      if (["admins", "members", "inactive"].includes(columnId)) {
        setOverColumnId(columnId as ColumnId);
      } else {
        // Over an item - find its column
        const itemColumn = getColumnForMember(over.id as string);
        if (itemColumn) {
          setOverColumnId(itemColumn);
        }
      }
    } else {
      setOverColumnId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverColumnId(null);

    if (!over || !canManage) return;

    const memberId = active.id as string;
    const sourceColumn = getColumnForMember(memberId);
    
    // Determine target column
    let targetColumn: ColumnId | null = null;
    const overId = over.id as string;
    
    if (["admins", "members", "inactive"].includes(overId)) {
      targetColumn = overId as ColumnId;
    } else {
      targetColumn = getColumnForMember(overId);
    }

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) return;

    const member = [...admins, ...members, ...inactive].find((m) => m.id === memberId);
    if (!member) return;

    // Perform action based on movement
    if (targetColumn === "admins" && sourceColumn !== "admins") {
      onPromote?.(member);
    } else if (targetColumn === "members" && sourceColumn === "admins") {
      onDemote?.(member);
    } else if (targetColumn === "inactive") {
      onRemove?.(member);
    } else if (targetColumn === "members" && sourceColumn === "inactive") {
      // Reactivate - could add a callback here
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setOverColumnId(null);
  };

  // Render column content
  const renderColumnContent = (column: typeof columns[0]) => {
    const isDropTarget = overColumnId === column.id && activeDragId;
    const itemIds = column.items.map((item) => item.id);

    return (
      <div
        key={column.id}
        id={column.id}
        className={`flex flex-col bg-muted/30 rounded-xl border min-h-[400px] transition-all duration-200 ${
          isDropTarget ? "ring-2 ring-primary/50 bg-primary/5" : ""
        }`}
      >
        <TeamColumnHeader
          title={column.title}
          count={column.items.length}
          icon={column.icon}
          color={column.color}
        />
        <ScrollArea className="flex-1 p-3">
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {column.items.length === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center py-8 text-muted-foreground ${
                    isDropTarget ? "border-2 border-dashed border-primary/30 rounded-lg" : ""
                  }`}
                >
                  <column.icon className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">
                    {isDropTarget ? "Hier ablegen" : `Keine ${column.title}`}
                  </p>
                </div>
              ) : (
                column.items.map((item) => (
                  <SortableTeamMemberCard
                    key={item.id}
                    member={item}
                    canManage={canManage}
                    isDragDisabled={column.id === "invitations"}
                    onClick={onMemberClick && item.type === "member" ? () => onMemberClick(item) : undefined}
                    onPromote={onPromote ? () => onPromote(item) : undefined}
                    onDemote={onDemote ? () => onDemote(item) : undefined}
                    onRemove={onRemove ? () => onRemove(item) : undefined}
                    onResendInvitation={onResendInvitation ? () => onResendInvitation(item) : undefined}
                    onRevokeInvitation={onRevokeInvitation ? () => onRevokeInvitation(item) : undefined}
                  />
                ))
              )}
            </div>
          </SortableContext>
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
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
        <div
          className="hidden md:grid gap-6"
          style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, 1fr)` }}
        >
          {visibleColumns.map(renderColumnContent)}
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
                    <SortableTeamMemberCard
                      key={item.id}
                      member={item}
                      canManage={canManage}
                      isDragDisabled={true}
                      onClick={onMemberClick && item.type === "member" ? () => onMemberClick(item) : undefined}
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

        {/* Drag Overlay */}
        <DragOverlay>
          {activeMember && (
            <div className="transform scale-105">
              <div className="p-3 rounded-lg bg-card border shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {activeMember.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{activeMember.name}</p>
                    <p className="text-xs text-muted-foreground">{activeMember.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
