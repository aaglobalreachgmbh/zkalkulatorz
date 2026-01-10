// ============================================
// Sortable Team Member Card Component
// Wrapper for DnD functionality
// ============================================

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TeamMemberCard, TeamMemberData } from "./TeamMemberCard";
import { GripVertical } from "lucide-react";

interface SortableTeamMemberCardProps {
  member: TeamMemberData;
  canManage: boolean;
  isDragDisabled?: boolean;
  onPromote?: () => void;
  onDemote?: () => void;
  onRemove?: () => void;
  onResendInvitation?: () => void;
  onRevokeInvitation?: () => void;
  onClick?: () => void;
}

export function SortableTeamMemberCard({
  member,
  canManage,
  isDragDisabled = false,
  onPromote,
  onDemote,
  onRemove,
  onResendInvitation,
  onRevokeInvitation,
  onClick,
}: SortableTeamMemberCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: member.id,
    disabled: isDragDisabled || member.type === "invitation" || member.isCurrentUser,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const canDrag = canManage && member.type !== "invitation" && !member.isCurrentUser;

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle */}
      {canDrag && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Card with padding for drag handle */}
      <div className={canDrag ? "pl-6" : ""}>
        <TeamMemberCard
          member={member}
          canManage={canManage}
          isDragging={isDragging}
          onClick={onClick}
          onPromote={onPromote}
          onDemote={onDemote}
          onRemove={onRemove}
          onResendInvitation={onResendInvitation}
          onRevokeInvitation={onRevokeInvitation}
        />
      </div>
    </div>
  );
}
