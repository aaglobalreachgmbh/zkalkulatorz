// ============================================
// Global App Footer with Publisher Info
// ============================================

import { PUBLISHER } from "@/margenkalkulator/publisherConfig";
import { ExternalLink } from "lucide-react";

interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className }: AppFooterProps) {
  return (
    <footer className={`border-t bg-muted/30 py-3 px-4 ${className ?? ""}`}>
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{PUBLISHER.getCopyright()}</span>
        
        <div className="flex items-center gap-4">
          <a
            href={PUBLISHER.links.impressum}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            Impressum
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={PUBLISHER.links.datenschutz}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            Datenschutz
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
