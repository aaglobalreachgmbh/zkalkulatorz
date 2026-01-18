// ============================================
// Empty State Card - Motivating placeholders
// ============================================

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  variant?: "primary" | "success" | "muted";
  pulse?: boolean;
  className?: string;
  compact?: boolean;
}

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  action,
  variant = "primary",
  pulse = true,
  className,
  compact = false,
}: EmptyStateCardProps) {
  const navigate = useNavigate();

  const variantStyles = {
    primary: {
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      buttonVariant: "default" as const,
    },
    success: {
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
      buttonVariant: "outline" as const,
    },
    muted: {
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      buttonVariant: "ghost" as const,
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-2" : "py-4",
      className
    )}>
      <motion.div
        className={cn(
          "rounded-full flex items-center justify-center mb-3",
          compact ? "w-10 h-10" : "w-14 h-14",
          styles.iconBg
        )}
        animate={pulse ? { scale: [1, 1.08, 1] } : undefined}
        transition={pulse ? {
          repeat: Infinity,
          duration: 2.5,
          ease: "easeInOut",
        } : undefined}
      >
        <Icon className={cn(
          compact ? "w-5 h-5" : "w-7 h-7",
          styles.iconColor
        )} />
      </motion.div>
      
      <h4 className={cn(
        "font-semibold",
        compact ? "text-sm" : "text-base"
      )}>
        {title}
      </h4>
      
      <p className={cn(
        "text-muted-foreground mt-1 max-w-[200px]",
        compact ? "text-xs" : "text-sm"
      )}>
        {description}
      </p>
      
      {action && (
        <Button
          variant={styles.buttonVariant}
          size={compact ? "sm" : "default"}
          className="mt-3"
          onClick={(e) => {
            e.stopPropagation();
            navigate(action.href);
          }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
