// ============================================
// Department Indicator - Phase 3B.1
// Shows active department in header
// ============================================

import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIdentity } from "@/contexts/IdentityContext";
import { getDepartmentById } from "@/lib/organisation";

interface DepartmentIndicatorProps {
  className?: string;
}

export function DepartmentIndicator({ className }: DepartmentIndicatorProps) {
  const { identity } = useIdentity();
  
  // Try to get department name from storage
  const department = getDepartmentById(identity.tenantId, identity.departmentId);
  const displayName = department?.name || identity.departmentId;
  
  return (
    <Badge variant="outline" className={className}>
      <Building2 className="w-3 h-3 mr-1" />
      {displayName}
    </Badge>
  );
}
