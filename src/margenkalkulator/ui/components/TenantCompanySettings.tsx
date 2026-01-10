// ============================================
// Tenant Company Settings Component
// Admin-Portal für Unternehmens- und Rechnungsinformationen
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Building2, CreditCard, UserCheck, Save, Eye } from "lucide-react";
import { useTenantCompanySettings, type CompanyInfo, type BillingInfo, type PdfContact } from "@/hooks/useTenantCompanySettings";
import { cn } from "@/lib/utils";

// ============================================
// Preview Component
// ============================================

function PdfPreview({ 
  companyInfo, 
  billingInfo, 
  pdfContact 
}: { 
  companyInfo: CompanyInfo; 
  billingInfo: BillingInfo; 
  pdfContact: PdfContact;
}) {
  const hasCompanyData = companyInfo.name || companyInfo.street || companyInfo.city;
  const hasBillingData = billingInfo.ustId || billingInfo.iban || billingInfo.registrationNumber;
  const hasContactData = pdfContact.name || pdfContact.email;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Live-Vorschau: PDF-Darstellung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header Preview */}
        {hasCompanyData && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-1">PDF-Header:</p>
            <div className="text-sm">
              <p className="font-bold">{companyInfo.name || "Firmenname"}</p>
              {companyInfo.street && <p className="text-muted-foreground">{companyInfo.street}</p>}
              {(companyInfo.zip || companyInfo.city) && (
                <p className="text-muted-foreground">{companyInfo.zip} {companyInfo.city}</p>
              )}
              {companyInfo.phone && <p className="text-muted-foreground">📞 {companyInfo.phone}</p>}
              {companyInfo.email && <p className="text-muted-foreground">✉ {companyInfo.email}</p>}
            </div>
          </div>
        )}

        {/* Contact Preview */}
        {hasContactData && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Ansprechpartner:</p>
            <div className="text-sm">
              <p className="font-medium">{pdfContact.name || "Name"}</p>
              {pdfContact.position && <p className="text-muted-foreground">{pdfContact.position}</p>}
              {pdfContact.email && <p className="text-muted-foreground">✉ {pdfContact.email}</p>}
              {pdfContact.phone && <p className="text-muted-foreground">📞 {pdfContact.phone}</p>}
            </div>
          </div>
        )}

        {/* Footer Preview */}
        {hasBillingData && (
          <div className="p-3 bg-muted/50 rounded-lg border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-1">PDF-Footer:</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {companyInfo.name} • {companyInfo.street} • {companyInfo.zip} {companyInfo.city}
              <br />
              {billingInfo.ustId && `USt-IdNr.: ${billingInfo.ustId}`}
              {billingInfo.registrationNumber && ` • ${billingInfo.registrationCourt} ${billingInfo.registrationNumber}`}
              <br />
              {billingInfo.bankName && billingInfo.iban && (
                <>{billingInfo.bankName} • IBAN: {billingInfo.iban}{billingInfo.bic && ` • BIC: ${billingInfo.bic}`}</>
              )}
            </p>
          </div>
        )}

        {!hasCompanyData && !hasBillingData && !hasContactData && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Füllen Sie die Felder aus, um eine Vorschau zu sehen
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export function TenantCompanySettings() {
  const {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    updateCompanyInfo,
    updateBillingInfo,
    updatePdfContact,
  } = useTenantCompanySettings();

  const [activeTab, setActiveTab] = useState("company");

  const handleSave = async () => {
    await saveSettings(settings);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Laden...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Unternehmen
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Rechnungsdaten
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            PDF-Kontakt
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Unternehmensinfos
                </CardTitle>
                <CardDescription>
                  Diese Daten erscheinen im PDF-Header und Footer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Firmenname *</Label>
                  <Input
                    id="company-name"
                    placeholder="Mustermann Telekommunikation GmbH"
                    value={settings.companyInfo.name}
                    onChange={(e) => updateCompanyInfo({ name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-street">Straße + Hausnummer</Label>
                  <Input
                    id="company-street"
                    placeholder="Musterstraße 123"
                    value={settings.companyInfo.street}
                    onChange={(e) => updateCompanyInfo({ street: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-zip">PLZ</Label>
                    <Input
                      id="company-zip"
                      placeholder="12345"
                      value={settings.companyInfo.zip}
                      onChange={(e) => updateCompanyInfo({ zip: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="company-city">Stadt</Label>
                    <Input
                      id="company-city"
                      placeholder="Musterstadt"
                      value={settings.companyInfo.city}
                      onChange={(e) => updateCompanyInfo({ city: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="company-phone">Telefon</Label>
                  <Input
                    id="company-phone"
                    placeholder="+49 123 456789"
                    value={settings.companyInfo.phone}
                    onChange={(e) => updateCompanyInfo({ phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-email">E-Mail</Label>
                  <Input
                    id="company-email"
                    type="email"
                    placeholder="info@musterfirma.de"
                    value={settings.companyInfo.email}
                    onChange={(e) => updateCompanyInfo({ email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-website">Website</Label>
                  <Input
                    id="company-website"
                    placeholder="www.musterfirma.de"
                    value={settings.companyInfo.website}
                    onChange={(e) => updateCompanyInfo({ website: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <PdfPreview 
              companyInfo={settings.companyInfo} 
              billingInfo={settings.billingInfo}
              pdfContact={settings.pdfContact}
            />
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Rechnungsdaten
                </CardTitle>
                <CardDescription>
                  Steuer- und Bankdaten für den PDF-Footer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing-ustid">USt-IdNr.</Label>
                    <Input
                      id="billing-ustid"
                      placeholder="DE123456789"
                      value={settings.billingInfo.ustId}
                      onChange={(e) => updateBillingInfo({ ustId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-taxnumber">Steuernummer</Label>
                    <Input
                      id="billing-taxnumber"
                      placeholder="12/345/67890"
                      value={settings.billingInfo.taxNumber}
                      onChange={(e) => updateBillingInfo({ taxNumber: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing-court">Registergericht</Label>
                    <Input
                      id="billing-court"
                      placeholder="AG Musterstadt"
                      value={settings.billingInfo.registrationCourt}
                      onChange={(e) => updateBillingInfo({ registrationCourt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-hrb">HRB-Nummer</Label>
                    <Input
                      id="billing-hrb"
                      placeholder="HRB 12345"
                      value={settings.billingInfo.registrationNumber}
                      onChange={(e) => updateBillingInfo({ registrationNumber: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="billing-bankname">Bankname</Label>
                  <Input
                    id="billing-bankname"
                    placeholder="Sparkasse Musterstadt"
                    value={settings.billingInfo.bankName}
                    onChange={(e) => updateBillingInfo({ bankName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing-iban">IBAN</Label>
                  <Input
                    id="billing-iban"
                    placeholder="DE12 3456 7890 1234 5678 90"
                    value={settings.billingInfo.iban}
                    onChange={(e) => updateBillingInfo({ iban: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing-bic">BIC</Label>
                  <Input
                    id="billing-bic"
                    placeholder="ABCDEFGH"
                    value={settings.billingInfo.bic}
                    onChange={(e) => updateBillingInfo({ bic: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <PdfPreview 
              companyInfo={settings.companyInfo} 
              billingInfo={settings.billingInfo}
              pdfContact={settings.pdfContact}
            />
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Standard-Ansprechpartner
                </CardTitle>
                <CardDescription>
                  Dieser Kontakt wird automatisch in PDFs als Ansprechpartner angezeigt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name *</Label>
                  <Input
                    id="contact-name"
                    placeholder="Max Mustermann"
                    value={settings.pdfContact.name}
                    onChange={(e) => updatePdfContact({ name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-position">Position</Label>
                  <Input
                    id="contact-position"
                    placeholder="Vertriebsleiter"
                    value={settings.pdfContact.position}
                    onChange={(e) => updatePdfContact({ position: e.target.value })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="contact-email">E-Mail</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="vertrieb@musterfirma.de"
                    value={settings.pdfContact.email}
                    onChange={(e) => updatePdfContact({ email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Telefon (direkt)</Label>
                  <Input
                    id="contact-phone"
                    placeholder="+49 123 456789-0"
                    value={settings.pdfContact.phone}
                    onChange={(e) => updatePdfContact({ phone: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <PdfPreview 
              companyInfo={settings.companyInfo} 
              billingInfo={settings.billingInfo}
              pdfContact={settings.pdfContact}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Speichern..." : "Alle Änderungen speichern"}
        </Button>
      </div>
    </div>
  );
}
