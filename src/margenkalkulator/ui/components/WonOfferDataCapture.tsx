// ============================================
// Won Offer Data Capture Dialog
// Phase 4: Backoffice-Daten für gewonnene Angebote
// ============================================

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  User,
  MapPin,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  Send,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  type WonOfferData,
  type LegalForm,
  type RegisterType,
  type SimType,
  type Salutation,
  LEGAL_FORM_OPTIONS,
  REGISTER_TYPE_OPTIONS,
  SIM_TYPE_OPTIONS,
  formatIBAN,
  validateWonOfferData,
  DEFAULT_WON_OFFER_DATA,
} from "@/margenkalkulator/storage/wonDataTypes";

// ============================================
// Validation Schema
// ============================================

const wonDataSchema = z.object({
  company: z.object({
    name: z.string().min(1, "Firmenname ist erforderlich"),
    legalForm: z.string(),
    registerType: z.string().optional(),
    registerNumber: z.string().optional(),
    registerPlace: z.string().optional(),
    taxId: z.string().optional(),
    vatId: z.string().optional(),
  }),
  contact: z.object({
    salutation: z.string(),
    firstName: z.string().min(1, "Vorname ist erforderlich"),
    lastName: z.string().min(1, "Nachname ist erforderlich"),
    email: z.string().email("Ungültige E-Mail-Adresse"),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    position: z.string().optional(),
  }),
  billingAddress: z.object({
    street: z.string().min(1, "Straße ist erforderlich"),
    houseNumber: z.string().min(1, "Hausnummer ist erforderlich"),
    addressLine2: z.string().optional(),
    zipCode: z.string().regex(/^\d{5}$/, "PLZ muss 5 Ziffern haben"),
    city: z.string().min(1, "Ort ist erforderlich"),
    country: z.string().default("Deutschland"),
  }),
  payment: z.object({
    iban: z.string().optional(),
    bic: z.string().optional(),
    accountHolder: z.string().optional(),
    bankName: z.string().optional(),
    sepaMandateAccepted: z.boolean().optional(),
  }).optional(),
  simOptions: z.object({
    type: z.string(),
    quantity: z.number().min(1),
    wunschrufnummer: z.string().optional(),
    wunschrufnummerDisclaimer: z.boolean(),
    portNumber: z.boolean().optional(),
    existingNumber: z.string().optional(),
    currentProvider: z.string().optional(),
  }),
  customerPassword: z.string().optional(),
  internalNotes: z.string().optional(),
});

type WonDataFormValues = z.infer<typeof wonDataSchema>;

// ============================================
// Props
// ============================================

interface WonOfferDataCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  offerName: string;
  onSave?: (data: Partial<WonOfferData>) => Promise<void>;
  onSubmit?: (data: WonOfferData) => Promise<void>;
  initialData?: Partial<WonOfferData>;
}

// ============================================
// Component
// ============================================

export function WonOfferDataCapture({
  open,
  onOpenChange,
  offerId,
  offerName,
  onSave,
  onSubmit,
  initialData,
}: WonOfferDataCaptureProps) {
  const [activeTab, setActiveTab] = useState("company");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<WonDataFormValues>({
    resolver: zodResolver(wonDataSchema),
    defaultValues: {
      company: initialData?.company ?? DEFAULT_WON_OFFER_DATA.company,
      contact: initialData?.contact ?? DEFAULT_WON_OFFER_DATA.contact,
      billingAddress: initialData?.billingAddress ?? DEFAULT_WON_OFFER_DATA.billingAddress,
      payment: initialData?.payment,
      simOptions: initialData?.simOptions ?? DEFAULT_WON_OFFER_DATA.simOptions,
      customerPassword: initialData?.customerPassword,
      internalNotes: initialData?.internalNotes,
    },
  });
  
  const { control, handleSubmit, watch, formState: { errors, isDirty } } = form;
  
  const watchedData = watch();
  const validation = validateWonOfferData(watchedData as Partial<WonOfferData>);
  
  // Tab completion status
  const tabStatus = {
    company: !errors.company,
    contact: !errors.contact,
    address: !errors.billingAddress,
    payment: true, // Optional
    sim: !errors.simOptions,
  };
  
  const handleSaveDraft = useCallback(async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(watchedData as Partial<WonOfferData>);
      toast.success("Entwurf gespeichert");
    } catch (e) {
      toast.error("Fehler beim Speichern");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, watchedData]);
  
  const handleFormSubmit = useCallback(async (data: WonDataFormValues) => {
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        offerId,
        tenantId: "", // Will be set by backend
        capturedAt: new Date().toISOString(),
        capturedBy: "", // Will be set by backend
        status: "complete",
      } as WonOfferData);
      toast.success("Daten erfolgreich übermittelt");
      onOpenChange(false);
    } catch (e) {
      toast.error("Fehler beim Übermitteln");
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, offerId, onOpenChange]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Angebot gewonnen: {offerName}
          </DialogTitle>
          <DialogDescription>
            Erfassen Sie die Kundendaten für die Vertragsabwicklung
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="company" className="gap-1 text-xs">
                <Building2 className="w-3 h-3" />
                <span className="hidden sm:inline">Firma</span>
                {tabStatus.company && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-1 text-xs">
                <User className="w-3 h-3" />
                <span className="hidden sm:inline">Kontakt</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="gap-1 text-xs">
                <MapPin className="w-3 h-3" />
                <span className="hidden sm:inline">Adresse</span>
              </TabsTrigger>
              <TabsTrigger value="payment" className="gap-1 text-xs">
                <CreditCard className="w-3 h-3" />
                <span className="hidden sm:inline">Zahlung</span>
              </TabsTrigger>
              <TabsTrigger value="sim" className="gap-1 text-xs">
                <Smartphone className="w-3 h-3" />
                <span className="hidden sm:inline">SIM</span>
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 mt-4">
              {/* Company Tab */}
              <TabsContent value="company" className="space-y-4 m-0">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company.name">Firmenname *</Label>
                    <Controller
                      control={control}
                      name="company.name"
                      render={({ field }) => (
                        <Input {...field} placeholder="Muster GmbH" />
                      )}
                    />
                    {errors.company?.name && (
                      <p className="text-xs text-destructive">{errors.company.name.message}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rechtsform</Label>
                      <Controller
                        control={control}
                        name="company.legalForm"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEGAL_FORM_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Registerart</Label>
                      <Controller
                        control={control}
                        name="company.registerType"
                        render={({ field }) => (
                          <Select value={field.value ?? ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Wählen..." />
                            </SelectTrigger>
                            <SelectContent>
                              {REGISTER_TYPE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Registernummer</Label>
                      <Controller
                        control={control}
                        name="company.registerNumber"
                        render={({ field }) => (
                          <Input {...field} placeholder="123456" />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amtsgericht</Label>
                      <Controller
                        control={control}
                        name="company.registerPlace"
                        render={({ field }) => (
                          <Input {...field} placeholder="München" />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Steuernummer</Label>
                      <Controller
                        control={control}
                        name="company.taxId"
                        render={({ field }) => (
                          <Input {...field} placeholder="123/456/78901" />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>USt-IdNr.</Label>
                      <Controller
                        control={control}
                        name="company.vatId"
                        render={({ field }) => (
                          <Input {...field} placeholder="DE123456789" />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-4 m-0">
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Anrede</Label>
                      <Controller
                        control={control}
                        name="contact.salutation"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Herr">Herr</SelectItem>
                              <SelectItem value="Frau">Frau</SelectItem>
                              <SelectItem value="Divers">Divers</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vorname *</Label>
                      <Controller
                        control={control}
                        name="contact.firstName"
                        render={({ field }) => (
                          <Input {...field} placeholder="Max" />
                        )}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Nachname *</Label>
                      <Controller
                        control={control}
                        name="contact.lastName"
                        render={({ field }) => (
                          <Input {...field} placeholder="Mustermann" />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>E-Mail *</Label>
                    <Controller
                      control={control}
                      name="contact.email"
                      render={({ field }) => (
                        <Input {...field} type="email" placeholder="max@musterfirma.de" />
                      )}
                    />
                    {errors.contact?.email && (
                      <p className="text-xs text-destructive">{errors.contact.email.message}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Controller
                        control={control}
                        name="contact.phone"
                        render={({ field }) => (
                          <Input {...field} placeholder="+49 89 12345678" />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobil</Label>
                      <Controller
                        control={control}
                        name="contact.mobile"
                        render={({ field }) => (
                          <Input {...field} placeholder="+49 171 1234567" />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Controller
                      control={control}
                      name="contact.position"
                      render={({ field }) => (
                        <Input {...field} placeholder="Geschäftsführer" />
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Address Tab */}
              <TabsContent value="address" className="space-y-4 m-0">
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2 col-span-3">
                      <Label>Straße *</Label>
                      <Controller
                        control={control}
                        name="billingAddress.street"
                        render={({ field }) => (
                          <Input {...field} placeholder="Musterstraße" />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nr. *</Label>
                      <Controller
                        control={control}
                        name="billingAddress.houseNumber"
                        render={({ field }) => (
                          <Input {...field} placeholder="123" />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Adresszusatz</Label>
                    <Controller
                      control={control}
                      name="billingAddress.addressLine2"
                      render={({ field }) => (
                        <Input {...field} placeholder="Gebäude B, 3. OG" />
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>PLZ *</Label>
                      <Controller
                        control={control}
                        name="billingAddress.zipCode"
                        render={({ field }) => (
                          <Input {...field} placeholder="80331" maxLength={5} />
                        )}
                      />
                      {errors.billingAddress?.zipCode && (
                        <p className="text-xs text-destructive">{errors.billingAddress.zipCode.message}</p>
                      )}
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Ort *</Label>
                      <Controller
                        control={control}
                        name="billingAddress.city"
                        render={({ field }) => (
                          <Input {...field} placeholder="München" />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Land</Label>
                    <Controller
                      control={control}
                      name="billingAddress.country"
                      render={({ field }) => (
                        <Input {...field} disabled />
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Payment Tab */}
              <TabsContent value="payment" className="space-y-4 m-0">
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Zahlungsdaten sind optional und können später ergänzt werden.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Controller
                      control={control}
                      name="payment.iban"
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          placeholder="DE89 3704 0044 0532 0130 00"
                          onChange={e => field.onChange(formatIBAN(e.target.value))}
                        />
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>BIC</Label>
                      <Controller
                        control={control}
                        name="payment.bic"
                        render={({ field }) => (
                          <Input {...field} placeholder="COBADEFFXXX" />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank</Label>
                      <Controller
                        control={control}
                        name="payment.bankName"
                        render={({ field }) => (
                          <Input {...field} placeholder="Commerzbank" />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Kontoinhaber</Label>
                    <Controller
                      control={control}
                      name="payment.accountHolder"
                      render={({ field }) => (
                        <Input {...field} placeholder="Muster GmbH" />
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Controller
                      control={control}
                      name="payment.sepaMandateAccepted"
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label className="text-sm font-normal">
                      SEPA-Lastschriftmandat erteilt
                    </Label>
                  </div>
                </div>
              </TabsContent>
              
              {/* SIM Tab */}
              <TabsContent value="sim" className="space-y-4 m-0">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SIM-Typ</Label>
                      <Controller
                        control={control}
                        name="simOptions.type"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SIM_TYPE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div>
                                    <div>{opt.label}</div>
                                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Anzahl</Label>
                      <Controller
                        control={control}
                        name="simOptions.quantity"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            min={1} 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Wunschrufnummer</Label>
                    <Controller
                      control={control}
                      name="simOptions.wunschrufnummer"
                      render={({ field }) => (
                        <Input {...field} placeholder="0176 12345678" />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Hinweis: Wunschrufnummern sind nicht garantiert verfügbar
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name="simOptions.wunschrufnummerDisclaimer"
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label className="text-sm font-normal">
                      Kunde wurde informiert, dass Wunschrufnummer nicht garantiert ist
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Controller
                      control={control}
                      name="simOptions.portNumber"
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label className="text-sm font-normal">
                      Rufnummernmitnahme (Portierung)
                    </Label>
                  </div>
                  
                  {watchedData.simOptions?.portNumber && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label>Bisherige Nummer</Label>
                        <Controller
                          control={control}
                          name="simOptions.existingNumber"
                          render={({ field }) => (
                            <Input {...field} placeholder="+49 171 1234567" />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bisheriger Anbieter</Label>
                        <Controller
                          control={control}
                          name="simOptions.currentProvider"
                          render={({ field }) => (
                            <Input {...field} placeholder="Telekom" />
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 pt-4">
                    <Label>Kundenpasswort (für Vodafone Portal)</Label>
                    <Controller
                      control={control}
                      name="customerPassword"
                      render={({ field }) => (
                        <Input {...field} type="password" placeholder="••••••••" />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optionales Passwort für den Vodafone Kundenportal-Zugang
                    </p>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label>Interne Notizen</Label>
                    <Controller
                      control={control}
                      name="internalNotes"
                      render={({ field }) => (
                        <Textarea 
                          {...field} 
                          placeholder="Notizen für die interne Bearbeitung..."
                          rows={3}
                        />
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <DialogFooter className="mt-4 pt-4 border-t flex-col sm:flex-row gap-2">
            {/* Validation Status */}
            <div className="flex-1 flex items-center gap-2">
              {validation.isValid ? (
                <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  Vollständig
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                  <AlertTriangle className="w-3 h-3" />
                  {Object.keys(validation.errors).length} Pflichtfelder fehlen
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Entwurf speichern
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting || !validation.isValid}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Absenden
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
