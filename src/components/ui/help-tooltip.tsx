"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export function HelpTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const GLOSSARY: Record<string, string> = {
  provision: "Der prozentuale Anteil der Provision, der beim Distributor verbleibt. Der Rest wird an den Partner ausgeschüttet.",
  default: "Zu diesem Begriff liegt keine Erklärung vor."
};

export function HelpLabel({ term, children }: { term: string; children: React.ReactNode }) {
  const text = GLOSSARY[term] || GLOSSARY.default;
  return (
    <span className="flex items-center gap-1.5">
      {children}
      <HelpTooltip content={text} />
    </span>
  );
}
