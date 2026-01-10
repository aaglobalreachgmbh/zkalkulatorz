// ============================================
// Headline Widget - "Wie möchten Sie kalkulieren?"
// ============================================

import { useTenantBranding } from "@/hooks/useTenantBranding";

export function HeadlineWidget() {
  const { branding } = useTenantBranding();

  return (
    <div className="text-center py-2">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
        Wie möchten Sie{" "}
        <span 
          className="text-primary"
          style={{ color: branding.primaryColor || undefined }}
        >
          kalkulieren
        </span>?
      </h2>
      <p className="text-muted-foreground text-sm max-w-xl mx-auto">
        Wählen Sie zwischen der detaillierten Einzelkonfiguration oder unseren
        optimierten Best-Practice Lösungen.
      </p>
    </div>
  );
}
