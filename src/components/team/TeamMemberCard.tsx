// ============================================
// Team Member Card Component
// Displays individual team member with actions
// ============================================

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Shield,
  ShieldCheck,
  User,
  UserMinus,
  Mail,
  Clock,
  RefreshCw,
  Trash2,
  Crown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

// Member types
export interface TeamMemberData {
  id: string;
  type: "member" | "invitation";
  name: string;
  email: string;
  role: string;
  joinedAt?: string;
  expiresAt?: string;
  isCurrentUser?: boolean;
  avatarUrl?: string;
}

interface TeamMemberCardProps {
  member: TeamMemberData;
  canManage: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onPromote?: () => void;
  onDemote?: () => void;
  onRemove?: () => void;
  onResendInvitation?: () => void;
  onRevokeInvitation?: () => void;
}

const roleConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" }> = {
  owner: { label: "Inhaber", icon: <Crown className="h-3 w-3" />, variant: "default" },
  tenant_admin: { label: "Admin", icon: <ShieldCheck className="h-3 w-3" />, variant: "default" },
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" />, variant: "secondary" },
  user: { label: "Mitarbeiter", icon: <User className="h-3 w-3" />, variant: "outline" },
  member: { label: "Mitglied", icon: <User className="h-3 w-3" />, variant: "outline" },
  sales: { label: "Vertrieb", icon: <User className="h-3 w-3" />, variant: "outline" },
};

export function TeamMemberCard({
  member,
  canManage,
  isDragging = false,
  onClick,
  onPromote,
  onDemote,
  onRemove,
  onResendInvitation,
  onRevokeInvitation,
}: TeamMemberCardProps) {
  const roleInfo = roleConfig[member.role] || roleConfig.user;
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const isExpiringSoon = member.type === "invitation" && member.expiresAt
    ? new Date(member.expiresAt) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
    : false;

  const isExpired = member.type === "invitation" && member.expiresAt
    ? new Date(member.expiresAt) < new Date()
    : false;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on buttons or dropdown
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return;
    onClick?.();
  };

  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-lg bg-card border hover:shadow-md transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      } ${isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback 
            className={`text-sm font-medium ${
              member.type === "invitation" 
                ? "bg-amber-100 text-amber-700" 
                : "bg-primary/10 text-primary"
            }`}
          >
            {member.type === "invitation" ? <Mail className="h-4 w-4" /> : initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">
              {member.name}
              {member.isCurrentUser && (
                <span className="text-muted-foreground ml-1">(Sie)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {member.type === "invitation" ? (
              <>
                <Mail className="h-3 w-3" />
                <span className="truncate">{member.email}</span>
                {isExpired ? (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Abgelaufen
                  </Badge>
                ) : isExpiringSoon ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    Läuft ab
                  </Badge>
                ) : null}
              </>
            ) : (
              <>
                <span className="truncate">{member.email}</span>
                {member.joinedAt && (
                  <>
                    <span>•</span>
                    <span>Seit {formatDistanceToNow(new Date(member.joinedAt), { locale: de })}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role Badge & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={roleInfo.variant} className="gap-1 text-xs">
          {roleInfo.icon}
          {roleInfo.label}
        </Badge>

        {canManage && !member.isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {member.type === "invitation" ? (
                <>
                  <DropdownMenuItem onClick={onResendInvitation}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Erneut senden
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onRevokeInvitation} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Einladung löschen
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {member.role !== "owner" && member.role !== "tenant_admin" && onPromote && (
                    <DropdownMenuItem onClick={onPromote}>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Zum Admin befördern
                    </DropdownMenuItem>
                  )}
                  {(member.role === "admin" || member.role === "tenant_admin") && onDemote && (
                    <DropdownMenuItem onClick={onDemote}>
                      <User className="h-4 w-4 mr-2" />
                      Zum Mitarbeiter herabstufen
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onRemove} className="text-destructive">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Entfernen
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
