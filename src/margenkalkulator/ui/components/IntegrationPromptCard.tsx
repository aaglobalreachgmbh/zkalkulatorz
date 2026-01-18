// ============================================
// Integration Prompt Card - Encourages users to connect integrations
// ============================================

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Plus, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GmailIcon,
  IonosIcon,
  GoogleCalendarIcon,
  OutlookIcon,
  GenericMailIcon,
  GenericCalendarIcon,
} from "./icons/IntegrationIcons";

export type IntegrationType = "gmail" | "ionos" | "google-calendar" | "outlook" | "mail" | "calendar";

interface IntegrationConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  brandColor: string;
  bgColor: string;
}

const INTEGRATION_CONFIG: Record<IntegrationType, IntegrationConfig> = {
  gmail: {
    icon: GmailIcon,
    label: "Gmail",
    description: "E-Mails synchronisieren",
    brandColor: "border-[#EA4335]/30 hover:border-[#EA4335]/50",
    bgColor: "bg-[#EA4335]/5 hover:bg-[#EA4335]/10",
  },
  ionos: {
    icon: IonosIcon,
    label: "IONOS Webmail",
    description: "Geschäfts-E-Mails",
    brandColor: "border-[#003D8F]/30 hover:border-[#003D8F]/50",
    bgColor: "bg-[#003D8F]/5 hover:bg-[#003D8F]/10",
  },
  "google-calendar": {
    icon: GoogleCalendarIcon,
    label: "Google Kalender",
    description: "Termine synchronisieren",
    brandColor: "border-[#4285F4]/30 hover:border-[#4285F4]/50",
    bgColor: "bg-[#4285F4]/5 hover:bg-[#4285F4]/10",
  },
  outlook: {
    icon: OutlookIcon,
    label: "Outlook",
    description: "Microsoft Kalender",
    brandColor: "border-[#0078D4]/30 hover:border-[#0078D4]/50",
    bgColor: "bg-[#0078D4]/5 hover:bg-[#0078D4]/10",
  },
  mail: {
    icon: GenericMailIcon,
    label: "E-Mail",
    description: "E-Mail verbinden",
    brandColor: "border-primary/30 hover:border-primary/50",
    bgColor: "bg-primary/5 hover:bg-primary/10",
  },
  calendar: {
    icon: GenericCalendarIcon,
    label: "Kalender",
    description: "Kalender verbinden",
    brandColor: "border-primary/30 hover:border-primary/50",
    bgColor: "bg-primary/5 hover:bg-primary/10",
  },
};

interface IntegrationPromptCardProps {
  type: IntegrationType;
  onConnect: () => void;
  variant?: "card" | "inline" | "minimal" | "dashed";
  isConnected?: boolean;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
}

export function IntegrationPromptCard({
  type,
  onConnect,
  variant = "card",
  isConnected = false,
  isLoading = false,
  className,
  compact = false,
}: IntegrationPromptCardProps) {
  const config = INTEGRATION_CONFIG[type];
  const Icon = config.icon;

  // Minimal variant - just icon button
  if (variant === "minimal") {
    return (
      <Button
        variant={isConnected ? "outline" : "ghost"}
        size="sm"
        onClick={onConnect}
        disabled={isLoading || isConnected}
        className={cn(
          "gap-2",
          isConnected && "text-success border-success/30",
          className
        )}
      >
        <Icon className="w-4 h-4" />
        {isConnected ? (
          <>
            <CheckCircle className="w-3 h-3" />
            Verbunden
          </>
        ) : (
          config.label
        )}
      </Button>
    );
  }

  // Inline variant - horizontal layout
  if (variant === "inline") {
    return (
      <button
        onClick={onConnect}
        disabled={isLoading || isConnected}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all",
          isConnected 
            ? "border-success/30 bg-success/5 cursor-default"
            : config.brandColor + " " + config.bgColor + " cursor-pointer",
          className
        )}
      >
        <Icon className={cn("w-8 h-8", compact && "w-6 h-6")} />
        <div className="flex-1 text-left">
          <p className="font-medium text-sm">{config.label}</p>
          <p className="text-xs text-muted-foreground">
            {isConnected ? "Verbunden" : config.description}
          </p>
        </div>
        {isConnected ? (
          <CheckCircle className="w-5 h-5 text-success" />
        ) : (
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    );
  }

  // Dashed variant - shows available but not connected
  if (variant === "dashed") {
    return (
      <button
        onClick={onConnect}
        disabled={isLoading}
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed transition-all",
          "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/50",
          "min-w-[140px]",
          className
        )}
      >
        <div className="relative">
          <Icon className="w-10 h-10 opacity-60" />
          <Plus className="absolute -bottom-1 -right-1 w-4 h-4 text-primary bg-background rounded-full" />
        </div>
        <p className="text-xs text-muted-foreground font-medium">{config.label}</p>
      </button>
    );
  }

  // Card variant (default) - full card layout
  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all cursor-pointer",
        isConnected
          ? "border-success/30 bg-success/5"
          : config.brandColor + " " + config.bgColor,
        className
      )}
      onClick={isConnected || isLoading ? undefined : onConnect}
    >
      <div className={cn("p-5 flex flex-col items-center text-center", compact && "p-4")}>
        <div className="mb-3 relative">
          <Icon className={cn("w-12 h-12", compact && "w-10 h-10")} />
          {!isConnected && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm animate-pulse">
              <Plus className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
          {isConnected && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle className="w-3 h-3 text-success-foreground" />
            </div>
          )}
        </div>
        
        <h4 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
          {config.label}
        </h4>
        <p className={cn("text-muted-foreground mt-1", compact ? "text-xs" : "text-sm")}>
          {isConnected ? "Verbunden" : config.description}
        </p>
        
        {!isConnected && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            disabled={isLoading}
          >
            <ArrowRight className="w-3 h-3" />
            Verbinden
          </Button>
        )}
      </div>
    </Card>
  );
}

// Export a group component for showing multiple integrations
interface IntegrationPromptGroupProps {
  integrations: Array<{
    type: IntegrationType;
    isConnected?: boolean;
    onConnect: () => void;
  }>;
  variant?: "card" | "inline" | "dashed";
  compact?: boolean;
  className?: string;
}

export function IntegrationPromptGroup({
  integrations,
  variant = "card",
  compact = false,
  className,
}: IntegrationPromptGroupProps) {
  return (
    <div className={cn(
      "grid gap-4",
      variant === "card" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
      className
    )}>
      {integrations.map((integration) => (
        <IntegrationPromptCard
          key={integration.type}
          type={integration.type}
          isConnected={integration.isConnected}
          onConnect={integration.onConnect}
          variant={variant}
          compact={compact}
        />
      ))}
    </div>
  );
}
