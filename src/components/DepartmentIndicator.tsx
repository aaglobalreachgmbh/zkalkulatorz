// ============================================
// Department Indicator - Hybrid Cloud/localStorage
// Shows active department in header
// ============================================

import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useCloudDepartments } from "@/hooks/useCloudDepartments";
import { getDepartmentById } from "@/lib/organisation";

interface DepartmentIndicatorProps {
  className?: string;
}

export function DepartmentIndicator({ className }: DepartmentIndicatorProps) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const cloudDepartments = useCloudDepartments();
  
  // Get department name based on auth state
  let displayName: string;
  
  if (user && cloudDepartments.currentUserDepartment) {
    // Cloud mode
    displayName = cloudDepartments.currentUserDepartment.name;
  } else {
    // Guest mode - localStorage fallback
    const department = getDepartmentById(identity.tenantId, identity.departmentId);
    displayName = department?.name || identity.departmentId;
  }
  
  return (
    <Badge variant="outline" className={className}>
      <Building2 className="w-3 h-3 mr-1" />
      {displayName}
    </Badge>
  );
}
