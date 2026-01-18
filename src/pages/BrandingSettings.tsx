// ============================================
// Branding Settings Page
// Allows tenant admins to customize their branding
// ============================================

import { useState, useEffect } from "react";
import { Palette, Save, RotateCcw, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MainLayout } from "@/components/MainLayout";
import { LogoUpload } from "@/components/settings/LogoUpload";
import { ColorPicker } from "@/components/settings/ColorPicker";
import { BrandingPreview } from "@/components/settings/BrandingPreview";
import { useTenantBranding, DEFAULT_BRANDING, type TenantBranding } from "@/hooks/useTenantBranding";

export default function BrandingSettings() {
  const { branding, isLoading, saveBranding, isSaving, resetBranding } = useTenantBranding();
  
  // Local state for editing
  const [localBranding, setLocalBranding] = useState<TenantBranding>(DEFAULT_BRANDING);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with loaded branding
  useEffect(() => {
    if (branding) {
      setLocalBranding(branding);
      setHasChanges(false);
    }
  }, [branding]);

  // Check for changes
  useEffect(() => {
    if (branding) {
      const changed = 
        localBranding.logoUrl !== branding.logoUrl ||
        localBranding.primaryColor !== branding.primaryColor ||
        localBranding.secondaryColor !== branding.secondaryColor ||
        localBranding.companyName !== branding.companyName;
      setHasChanges(changed);
    }
  }, [localBranding, branding]);

  const handleSave = () => {
    saveBranding(localBranding);
  };

  const handleReset = () => {
    setLocalBranding(DEFAULT_BRANDING);
    setHasChanges(true);
  };

  const handleLogoChange = (url: string | null) => {
    setLocalBranding(prev => ({ ...prev, logoUrl: url }));
  };

  const handlePrimaryChange = (color: string) => {
    setLocalBranding(prev => ({ ...prev, primaryColor: color }));
  };

  const handleSecondaryChange = (color: string) => {
    setLocalBranding(prev => ({ ...prev, secondaryColor: color }));
  };

  const handleCompanyNameChange = (name: string) => {
    setLocalBranding(prev => ({ ...prev, companyName: name || null }));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Branding-Einstellungen
            </h1>
            <p className="text-muted-foreground">
              Passen Sie das Erscheinungsbild Ihrer Angebots-PDFs an
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Speichern
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo & Firmenname</CardTitle>
                <CardDescription>
                  Laden Sie Ihr Firmenlogo hoch und geben Sie Ihren Firmennamen ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <LogoUpload
                  currentLogoUrl={localBranding.logoUrl}
                  onLogoChange={handleLogoChange}
                  disabled={isSaving}
                />

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="company-name">Firmenname</Label>
                  <Input
                    id="company-name"
                    placeholder="z.B. Mustermann Telekommunikation"
                    value={localBranding.companyName || ""}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wird im PDF-Header und -Footer angezeigt
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Farbschema</CardTitle>
                <CardDescription>
                  Wählen Sie Ihre Unternehmensfarben für die PDF-Gestaltung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ColorPicker
                  primaryColor={localBranding.primaryColor}
                  secondaryColor={localBranding.secondaryColor}
                  onPrimaryChange={handlePrimaryChange}
                  onSecondaryChange={handleSecondaryChange}
                  disabled={isSaving}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle>Live-Vorschau</CardTitle>
                <CardDescription>
                  So wird Ihr Branding in PDFs aussehen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandingPreview branding={localBranding} />
              </CardContent>
            </Card>

            {hasChanges && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Sie haben ungespeicherte Änderungen. Klicken Sie auf "Speichern", um die Änderungen zu übernehmen.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
