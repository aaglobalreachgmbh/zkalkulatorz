import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { useCustomers, Customer, CustomerInput } from "@/margenkalkulator/hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MoreHorizontal, Pencil, Trash2, Building2, Loader2, Upload, Star, User, MapPin, Phone, Mail, Download, Calculator, Send } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { exportToCSV, CUSTOMER_COLUMNS } from "@/lib/csvExport";
import { usePOSMode } from "@/contexts/POSModeContext";
import { getCustomerStatus } from "@/lib/statusBadges";
import { cn } from "@/lib/utils";

const initialFormData: CustomerInput = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  industry: "",
  notes: "",
  anrede: "",
  vorname: "",
  nachname: "",
  strasse: "",
  hausnummer: "",
  plz: "",
  ort: "",
  festnetz: "",
  handy_nr: "",
  geburtstag: "",
  customer_status: "aktiv",
  vip_kunde: false,
  marketing_sms: false,
  marketing_email: false,
  marketing_brief: false,
};

export default function Customers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { isPOSMode } = usePOSMode();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerInput>(initialFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVipOnly, setShowVipOnly] = useState(false);

  // Handle ?action=new query parameter
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsDialogOpen(true);
      // Clear the query parameter after opening dialog
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCustomer(null);
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        company_name: customer.company_name,
        contact_name: customer.contact_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        industry: customer.industry || "",
        notes: customer.notes || "",
        anrede: customer.anrede || "",
        vorname: customer.vorname || "",
        nachname: customer.nachname || "",
        strasse: customer.strasse || "",
        hausnummer: customer.hausnummer || "",
        plz: customer.plz || "",
        ort: customer.ort || "",
        festnetz: customer.festnetz || "",
        handy_nr: customer.handy_nr || "",
        geburtstag: customer.geburtstag || "",
        customer_status: customer.customer_status || "aktiv",
        vip_kunde: customer.vip_kunde ?? false,
        marketing_sms: customer.marketing_sms ?? false,
        marketing_email: customer.marketing_email ?? false,
        marketing_brief: customer.marketing_brief ?? false,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) return;

    if (editingCustomer) {
      await updateCustomer.mutateAsync({ ...formData, id: editingCustomer.id });
    } else {
      await createCustomer.mutateAsync(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (customer: { id: string; company_name: string }) => {
    if (window.confirm("Kunde wirklich löschen?")) {
      await deleteCustomer.mutateAsync(customer);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const config = getCustomerStatus(status);
    const StatusIcon = config.icon;
    return (
      <Badge className={cn(config.bgColor, config.color, "gap-1")}>
        <StatusIcon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Quick Actions
  const handleQuickOffer = (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/calculator?customerId=${customerId}`);
  };

  const handleQuickEmail = (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/customers/${customerId}?tab=emails`);
  };

  const getFullName = (customer: Customer) => {
    const parts = [customer.anrede, customer.vorname, customer.nachname].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : customer.contact_name || "-";
  };

  // Filter customers by search and VIP status
  const filteredCustomers = customers.filter((customer) => {
    // VIP filter
    if (showVipOnly && !customer.vip_kunde) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        customer.company_name.toLowerCase().includes(query) ||
        (customer.vorname?.toLowerCase().includes(query) ?? false) ||
        (customer.nachname?.toLowerCase().includes(query) ?? false) ||
        (customer.email?.toLowerCase().includes(query) ?? false) ||
        (customer.plz?.includes(query) ?? false) ||
        (customer.ort?.toLowerCase().includes(query) ?? false)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const exportData = filteredCustomers.map(customer => ({
      company_name: customer.company_name,
      anrede: customer.anrede || "",
      vorname: customer.vorname || "",
      nachname: customer.nachname || "",
      email: customer.email || "",
      phone: customer.phone || "",
      handy_nr: customer.handy_nr || "",
      festnetz: customer.festnetz || "",
      strasse: customer.strasse || "",
      hausnummer: customer.hausnummer || "",
      plz: customer.plz || "",
      ort: customer.ort || "",
      industry: customer.industry || "",
      customer_status: customer.customer_status || "",
      vip_kunde: customer.vip_kunde ? "Ja" : "Nein",
      created_at: format(new Date(customer.created_at), "dd.MM.yyyy", { locale: de }),
    }));
    
    exportToCSV(exportData, CUSTOMER_COLUMNS as unknown as { key: keyof typeof exportData[0]; label: string }[], `kunden_${format(new Date(), "yyyy-MM-dd")}`);
    toast.success(`${exportData.length} Kunden exportiert`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kunden</h1>
            <p className="text-muted-foreground">
              {filteredCustomers.length} von {customers.length} Kunden
              {showVipOnly && " (nur VIP)"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={filteredCustomers.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>
            <Button variant="outline" onClick={() => navigate("/customers/import")}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Kunde
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCustomer ? "Kunde bearbeiten" : "Neuen Kunden anlegen"}
                    </DialogTitle>
                    <DialogDescription>
                      Füllen Sie die Kundendaten aus. Nur der Firmenname ist erforderlich.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="firma" className="mt-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="firma" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        Firma
                      </TabsTrigger>
                      <TabsTrigger value="person" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        Person
                      </TabsTrigger>
                      <TabsTrigger value="adresse" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        Adresse
                      </TabsTrigger>
                      <TabsTrigger value="optionen" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Optionen
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab: Firma */}
                    <TabsContent value="firma" className="space-y-4 mt-4">
                      <div className="grid gap-2">
                        <Label htmlFor="company_name">Firmenname *</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          placeholder="Muster GmbH"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="industry">Branche</Label>
                        <Input
                          id="industry"
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          placeholder="IT & Telekommunikation"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notizen</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Interne Notizen zum Kunden..."
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    {/* Tab: Person */}
                    <TabsContent value="person" className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="anrede">Anrede</Label>
                          <Select
                            value={formData.anrede}
                            onValueChange={(value) => setFormData({ ...formData, anrede: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Herr">Herr</SelectItem>
                              <SelectItem value="Frau">Frau</SelectItem>
                              <SelectItem value="Divers">Divers</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="vorname">Vorname</Label>
                          <Input
                            id="vorname"
                            value={formData.vorname}
                            onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                            placeholder="Max"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="nachname">Nachname</Label>
                          <Input
                            id="nachname"
                            value={formData.nachname}
                            onChange={(e) => setFormData({ ...formData, nachname: e.target.value })}
                            placeholder="Mustermann"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contact_name">Ansprechpartner (alt)</Label>
                        <Input
                          id="contact_name"
                          value={formData.contact_name}
                          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                          placeholder="Für Legacy-Daten"
                          className="opacity-60"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="geburtstag">Geburtstag</Label>
                        <Input
                          id="geburtstag"
                          type="date"
                          value={formData.geburtstag}
                          onChange={(e) => setFormData({ ...formData, geburtstag: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">
                            <Mail className="h-3 w-3 inline mr-1" />
                            E-Mail
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="kontakt@muster.de"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">
                            <Phone className="h-3 w-3 inline mr-1" />
                            Telefon (Haupt)
                          </Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+49 123 456789"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="festnetz">Festnetz</Label>
                          <Input
                            id="festnetz"
                            value={formData.festnetz}
                            onChange={(e) => setFormData({ ...formData, festnetz: e.target.value })}
                            placeholder="+49 30 123456"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="handy_nr">Handy</Label>
                          <Input
                            id="handy_nr"
                            value={formData.handy_nr}
                            onChange={(e) => setFormData({ ...formData, handy_nr: e.target.value })}
                            placeholder="+49 170 1234567"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab: Adresse */}
                    <TabsContent value="adresse" className="space-y-4 mt-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 grid gap-2">
                          <Label htmlFor="strasse">Straße</Label>
                          <Input
                            id="strasse"
                            value={formData.strasse}
                            onChange={(e) => setFormData({ ...formData, strasse: e.target.value })}
                            placeholder="Musterstraße"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="hausnummer">Nr.</Label>
                          <Input
                            id="hausnummer"
                            value={formData.hausnummer}
                            onChange={(e) => setFormData({ ...formData, hausnummer: e.target.value })}
                            placeholder="123"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="plz">PLZ</Label>
                          <Input
                            id="plz"
                            value={formData.plz}
                            onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                            placeholder="12345"
                            maxLength={5}
                          />
                        </div>
                        <div className="col-span-2 grid gap-2">
                          <Label htmlFor="ort">Ort</Label>
                          <Input
                            id="ort"
                            value={formData.ort}
                            onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                            placeholder="Musterstadt"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab: Optionen */}
                    <TabsContent value="optionen" className="space-y-4 mt-4">
                      <div className="grid gap-2">
                        <Label htmlFor="customer_status">Kundenstatus</Label>
                        <Select
                          value={formData.customer_status}
                          onValueChange={(value) => setFormData({ ...formData, customer_status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aktiv">Aktiv</SelectItem>
                            <SelectItem value="inaktiv">Inaktiv</SelectItem>
                            <SelectItem value="interessent">Interessent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4 bg-amber-500/5 border-amber-500/20">
                        <div className="space-y-0.5">
                          <Label htmlFor="vip_kunde" className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            VIP-Kunde
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Markiert Kunden für Sonderkonditionen
                          </p>
                        </div>
                        <Switch
                          id="vip_kunde"
                          checked={formData.vip_kunde}
                          onCheckedChange={(checked) => setFormData({ ...formData, vip_kunde: checked })}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Marketing-Einwilligungen</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <Label htmlFor="marketing_email" className="text-sm">E-Mail Marketing</Label>
                              <p className="text-xs text-muted-foreground">Newsletter & Angebote per E-Mail</p>
                            </div>
                            <Switch
                              id="marketing_email"
                              checked={formData.marketing_email}
                              onCheckedChange={(checked) => setFormData({ ...formData, marketing_email: checked })}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <Label htmlFor="marketing_sms" className="text-sm">SMS Marketing</Label>
                              <p className="text-xs text-muted-foreground">Angebote per SMS</p>
                            </div>
                            <Switch
                              id="marketing_sms"
                              checked={formData.marketing_sms}
                              onCheckedChange={(checked) => setFormData({ ...formData, marketing_sms: checked })}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <Label htmlFor="marketing_brief" className="text-sm">Post Marketing</Label>
                              <p className="text-xs text-muted-foreground">Werbung per Brief</p>
                            </div>
                            <Switch
                              id="marketing_brief"
                              checked={formData.marketing_brief}
                              onCheckedChange={(checked) => setFormData({ ...formData, marketing_brief: checked })}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCustomer.isPending || updateCustomer.isPending}
                    >
                      {(createCustomer.isPending || updateCustomer.isPending) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {editingCustomer ? "Speichern" : "Erstellen"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Suche nach Name, E-Mail, PLZ, Ort..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3"
            />
          </div>
          <Button
            variant={showVipOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowVipOnly(!showVipOnly)}
            className="gap-2"
          >
            <Star className={cn("h-4 w-4", showVipOnly && "fill-current")} />
            Nur VIP
          </Button>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Kundenliste
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{searchQuery || showVipOnly ? "Keine Kunden gefunden" : "Noch keine Kunden vorhanden"}</p>
                <p className="text-sm">{searchQuery || showVipOnly ? "Passen Sie Ihre Filter an" : "Erstellen Sie Ihren ersten Kunden"}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    <TableHead className={cn(isPOSMode && "hidden md:table-cell")}>Ansprechpartner</TableHead>
                    <TableHead className={cn(isPOSMode && "hidden lg:table-cell")}>E-Mail</TableHead>
                    <TableHead className={cn(isPOSMode && "hidden lg:table-cell")}>Telefon</TableHead>
                    <TableHead className={cn(isPOSMode && "hidden xl:table-cell")}>Ort</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quick-Actions</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {customer.vip_kunde && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                          {customer.company_name}
                        </div>
                      </TableCell>
                      <TableCell>{getFullName(customer)}</TableCell>
                      <TableCell className={cn(isPOSMode && "hidden md:table-cell")}>{getFullName(customer)}</TableCell>
                      <TableCell className={cn(isPOSMode && "hidden lg:table-cell")}>{customer.email || "-"}</TableCell>
                      <TableCell className={cn(isPOSMode && "hidden lg:table-cell")}>{customer.handy_nr || customer.phone || customer.festnetz || "-"}</TableCell>
                      <TableCell className={cn(isPOSMode && "hidden xl:table-cell")}>
                        {customer.plz && customer.ort 
                          ? `${customer.plz} ${customer.ort}` 
                          : customer.ort || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.customer_status)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size={isPOSMode ? "default" : "sm"}
                            className={cn(
                              "gap-1",
                              isPOSMode && "min-h-10 min-w-10"
                            )}
                            onClick={(e) => handleQuickOffer(customer.id, e)}
                          >
                            <Calculator className="h-4 w-4" />
                            {!isPOSMode && <span className="hidden sm:inline">Angebot</span>}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size={isPOSMode ? "default" : "sm"}
                            className={cn(
                              "gap-1",
                              isPOSMode && "min-h-10 min-w-10"
                            )}
                            onClick={(e) => handleQuickEmail(customer.id, e)}
                          >
                            <Send className="h-4 w-4" />
                            {!isPOSMode && <span className="hidden sm:inline">E-Mail</span>}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}`)}>
                              <Building2 className="h-4 w-4 mr-2" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(customer)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete({ id: customer.id, company_name: customer.company_name })}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
