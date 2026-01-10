// ============================================
// Create Tenant Modal für Super-Admin
// Erstellt neuen Kunden mit Lizenz und Einladung
// ============================================

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, Building2, Mail, Phone, Key, Users, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTenants, CreateTenantInput } from "@/margenkalkulator/hooks/useTenants";

const formSchema = z.object({
  company_name: z.string().min(2, "Firmenname muss mindestens 2 Zeichen haben"),
  contact_email: z.string().email("Ungültige E-Mail-Adresse"),
  contact_phone: z.string().optional(),
  admin_email: z.string().email("Ungültige Admin E-Mail-Adresse"),
  admin_name: z.string().optional(),
  plan: z.enum(["starter", "professional", "enterprise", "internal"]),
  seat_limit: z.number().min(1).max(1000),
  valid_until: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTenantModalProps {
  trigger?: React.ReactNode;
}

export function CreateTenantModal({ trigger }: CreateTenantModalProps) {
  const [open, setOpen] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const { createTenant, isCreating } = useTenants();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: "",
      contact_email: "",
      contact_phone: "",
      admin_email: "",
      admin_name: "",
      plan: "professional",
      seat_limit: 5,
      valid_until: "",
    },
  });

  const handleAddDomain = () => {
    const domain = domainInput.trim().toLowerCase();
    if (domain && !domains.includes(domain) && domain.includes(".")) {
      setDomains([...domains, domain]);
      setDomainInput("");
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setDomains(domains.filter((d) => d !== domain));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const input: CreateTenantInput = {
        company_name: values.company_name,
        contact_email: values.contact_email,
        contact_phone: values.contact_phone,
        admin_email: values.admin_email,
        admin_name: values.admin_name,
        plan: values.plan,
        seat_limit: values.seat_limit,
        valid_until: values.valid_until || undefined,
        allowed_domains: domains,
      };

      await createTenant(input);
      setOpen(false);
      form.reset();
      setDomains([]);
    } catch (error) {
      console.error("Failed to create tenant:", error);
    }
  };

  // Auto-extract domain from admin email
  const handleAdminEmailChange = (email: string) => {
    form.setValue("admin_email", email);
    const domain = email.split("@")[1];
    if (domain && domain.includes(".") && !domains.includes(domain)) {
      // Suggest adding domain
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Neuen Kunden anlegen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Neuen Kunden anlegen
          </DialogTitle>
          <DialogDescription>
            Erstelle einen neuen Kunden mit Lizenz. Der Haupt-Admin erhält eine Einladungs-E-Mail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Firmendaten</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Firmenname *</Label>
                <Input
                  id="company_name"
                  placeholder="Vodafone Shop Mustermann GmbH"
                  {...form.register("company_name")}
                />
                {form.formState.errors.company_name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.company_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Kontakt E-Mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_email"
                    type="email"
                    className="pl-10"
                    placeholder="info@firma.de"
                    {...form.register("contact_email")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefon (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_phone"
                    type="tel"
                    className="pl-10"
                    placeholder="0221 12345678"
                    {...form.register("contact_phone")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Haupt-Administrator</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin E-Mail *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  placeholder="geschaeftsfuehrer@firma.de"
                  onChange={(e) => handleAdminEmailChange(e.target.value)}
                />
                {form.formState.errors.admin_email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.admin_email.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Diese Person erhält die Einladungs-E-Mail und wird Tenant-Admin.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_name">Admin Name (optional)</Label>
                <Input
                  id="admin_name"
                  placeholder="Max Mustermann"
                  {...form.register("admin_name")}
                />
              </div>
            </div>
          </div>

          {/* License Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Key className="h-4 w-4" />
              Lizenz
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Plan *</Label>
                <Select
                  value={form.watch("plan")}
                  onValueChange={(value) => form.setValue("plan", value as FormValues["plan"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="internal">Internal (unbegrenzt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seat_limit">Seat-Limit *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="seat_limit"
                    type="number"
                    min={1}
                    max={1000}
                    className="pl-10"
                    {...form.register("seat_limit", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Gültig bis (optional)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="valid_until"
                    type="date"
                    className="pl-10"
                    {...form.register("valid_until")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Allowed Domains */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Erlaubte E-Mail-Domains
            </h3>
            <p className="text-xs text-muted-foreground">
              Mitarbeiter mit diesen E-Mail-Domains können sich registrieren.
            </p>
            
            <div className="flex gap-2">
              <Input
                placeholder="firma.de"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDomain())}
              />
              <Button type="button" variant="secondary" onClick={handleAddDomain}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {domains.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {domains.map((domain) => (
                  <Badge key={domain} variant="secondary" className="gap-1">
                    @{domain}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Erstelle...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Kunde anlegen
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
