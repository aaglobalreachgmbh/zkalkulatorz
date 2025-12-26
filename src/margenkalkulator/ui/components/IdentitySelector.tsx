// ============================================
// Identity Selector (Mock Login for Dev)
// Phase 3A: Quick identity switch in wizard
// ============================================

import { User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIdentity, MOCK_IDENTITIES } from "@/contexts/IdentityContext";

export function IdentitySelector() {
  const { identity, setMockIdentity, clearIdentity } = useIdentity();

  const roleColors: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    manager: "bg-blue-500 text-white",
    sales: "bg-emerald-500 text-white",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="w-4 h-4" />
          {identity ? (
            <>
              <span className="hidden sm:inline">{identity.displayName}</span>
              <Badge 
                className={`text-xs ${roleColors[identity.role] || ""}`}
                variant="secondary"
              >
                {identity.role}
              </Badge>
            </>
          ) : (
            <span>Gast</span>
          )}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Benutzer wechseln</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MOCK_IDENTITIES.map((id) => (
          <DropdownMenuItem
            key={id.userId}
            onClick={() => setMockIdentity(id)}
            className="flex items-center justify-between"
          >
            <span>{id.displayName}</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${identity?.userId === id.userId ? "border-primary" : ""}`}
            >
              {id.role}
            </Badge>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={clearIdentity} className="text-muted-foreground">
          Abmelden (Gast)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
