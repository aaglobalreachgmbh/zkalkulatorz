/**
 * Bundle Content Icons
 * 
 * Shows visual icons for what's included in a bundle
 * based on analysis of the config object
 */

import {
  Smartphone,
  CreditCard,
  Wifi,
  Cloud,
  Shield,
  Phone,
  Monitor,
  Headphones,
  Router,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OfferOptionState } from "@/margenkalkulator/engine/types";

interface BundleContentIconsProps {
  config: OfferOptionState;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

interface ContentItem {
  id: string;
  label: string;
  icon: typeof Smartphone;
  color: string;
}

/**
 * Analyze bundle config and return list of included items
 */
function analyzeConfig(config: OfferOptionState): ContentItem[] {
  const items: ContentItem[] = [];

  // Hardware check - use ekNet which is the correct property
  if (config.hardware?.name || config.hardware?.ekNet !== undefined) {
    items.push({
      id: "hardware",
      label: "Hardware",
      icon: Smartphone,
      color: "text-blue-500",
    });
  }

  // Mobile tariff / SIM check
  if (config.mobile?.tariffId) {
    items.push({
      id: "sim",
      label: "Mobilfunk SIM",
      icon: CreditCard,
      color: "text-green-500",
    });
  }

  // Fixed net check - use productId which is the correct property
  if (config.fixedNet?.enabled || config.fixedNet?.productId) {
    items.push({
      id: "fixednet",
      label: "Festnetz/Kabel",
      icon: Phone,
      color: "text-orange-500",
    });
  }

  return items;
}

const sizeClasses = {
  sm: {
    container: "gap-1.5",
    icon: "h-3.5 w-3.5",
    text: "text-xs",
    padding: "px-1.5 py-0.5",
  },
  md: {
    container: "gap-2",
    icon: "h-4 w-4",
    text: "text-xs",
    padding: "px-2 py-1",
  },
  lg: {
    container: "gap-3",
    icon: "h-5 w-5",
    text: "text-sm",
    padding: "px-3 py-1.5",
  },
};

export function BundleContentIcons({
  config,
  size = "md",
  showLabels = false,
}: BundleContentIconsProps) {
  const items = analyzeConfig(config);
  const classes = sizeClasses[size];

  if (items.length === 0) {
    return (
      <div className={`flex items-center ${classes.container} text-muted-foreground`}>
        <span className={classes.text}>Konfiguration</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center flex-wrap ${classes.container} bg-muted/50 rounded-lg ${classes.padding}`}
    >
      {items.map((item) => {
        const Icon = item.icon;

        if (showLabels) {
          return (
            <div
              key={item.id}
              className={`flex items-center gap-1 ${item.color}`}
            >
              <Icon className={classes.icon} />
              <span className={`${classes.text} text-muted-foreground`}>
                {item.label}
              </span>
            </div>
          );
        }

        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <div className={`${item.color} cursor-default`}>
                <Icon className={classes.icon} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export { analyzeConfig };
export type { ContentItem };
