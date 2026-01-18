// ============================================
// Branding Preview Component
// Shows how branding will look in PDFs
// ============================================

import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TenantBranding } from "@/hooks/useTenantBranding";

interface BrandingPreviewProps {
  branding: TenantBranding;
}

export function BrandingPreview({ branding }: BrandingPreviewProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Vorschau (PDF-Header)</label>
      
      <Card className="overflow-hidden">
        {/* Mock PDF Header */}
        <div 
          className="p-4 flex items-center gap-4"
          style={{ backgroundColor: branding.primaryColor }}
        >
          {branding.logoUrl ? (
            <div className="h-10 w-10 rounded bg-white/10 flex items-center justify-center overflow-hidden">
              <img 
                src={branding.logoUrl} 
                alt="Logo" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">
              {branding.companyName || "Firmenname"}
            </p>
            <p className="text-white/70 text-xs">Angebot vom {new Date().toLocaleDateString("de-DE")}</p>
          </div>
        </div>

        {/* Mock PDF Content */}
        <div className="p-4 bg-white space-y-3">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-2/3" />
          
          <div className="pt-2 grid grid-cols-2 gap-2">
            <div 
              className="h-8 rounded flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Button
            </div>
            <div 
              className="h-8 rounded flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: branding.secondaryColor }}
            >
              Sekundär
            </div>
          </div>
        </div>

        {/* Mock PDF Footer */}
        <div 
          className="px-4 py-2 text-xs text-white/80 flex justify-between"
          style={{ backgroundColor: branding.secondaryColor }}
        >
          <span>{branding.companyName || "Firmenname"}</span>
          <span>Seite 1 von 1</span>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        So wird Ihr Branding in generierten PDFs aussehen.
      </p>
    </div>
  );
}
