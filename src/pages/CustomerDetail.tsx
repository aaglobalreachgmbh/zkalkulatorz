import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { useCustomers, Customer } from "@/margenkalkulator/hooks/useCustomers";
import { useCustomerNotes, NoteType } from "@/margenkalkulator/hooks/useCustomerNotes";
import { useCloudOffers } from "@/margenkalkulator/hooks/useCloudOffers";
import { useCustomerEmails } from "@/margenkalkulator/hooks/useCustomerEmails";
import {
  useCustomerContracts,
  type CustomerContract,
  type ContractInput,
} from "@/margenkalkulator/hooks/useCustomerContracts";
import { ContractCard } from "./CustomerDetail/ContractCard";
import { OfferToContractDialog } from "./CustomerDetail/OfferToContractDialog";
import { CustomerEmailsTab } from "@/margenkalkulator/ui/components/CustomerEmailsTab";
import { CustomerTimeline } from "@/margenkalkulator/ui/components/CustomerTimeline";
import type { CloudOffer } from "@/margenkalkulator/hooks/useCloudOffers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Star,
  FileText,
  MessageSquare,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  ScrollText,
  History,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useCustomerMargins } from "@/margenkalkulator/hooks/useCustomerMargins";
import { MarginBadge } from "@/margenkalkulator/ui/components/MarginBadge";
import { 
  formatCurrency, 
  getProfitabilityStatus, 
  getStatusColors 
} from "@/margenkalkulator/lib/formatters";

const NOTE_TYPE_CONFIG = {
  info: { label: "Info", icon: "💬", color: "bg-blue-500/20 text-blue-600" },
  call: { label: "Telefonat", icon: "📞", color: "bg-green-500/20 text-green-600" },
  meeting: { label: "Meeting", icon: "🤝", color: "bg-purple-500/20 text-purple-600" },
  offer: { label: "Angebot", icon: "📄", color: "bg-amber-500/20 text-amber-600" },
  contract: { label: "Vertrag", icon: "✍️", color: "bg-emerald-500/20 text-emerald-600" },
} as const;

const initialContractForm: ContractInput = {
  customer_id: "",
  netz: "vodafone",
  tarif_name: "",
  handy_nr: "",
  vertragsbeginn: "",
  vertragsende: "",
  vvl_datum: "",
  status: "aktiv",
  hardware_name: "",
  monatspreis: undefined,
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { notes, isLoading: notesLoading, createNote, deleteNote, noteTypes } = useCustomerNotes(id);
  const { offers, isLoading: offersLoading } = useCloudOffers();
  const { contracts, isLoading: contractsLoading, createContract, updateContract, deleteContract } = useCustomerContracts(id);
  const { emails, isLoading: emailsLoading } = useCustomerEmails(id);
  const { entries: marginEntries, stats: marginStats, isLoading: marginsLoading } = useCustomerMargins(id || "");

  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<NoteType>("info");
  
  // Contract Dialog State
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [contractForm, setContractForm] = useState<ContractInput>(initialContractForm);

  // Offer → Contract Dialog State
  const [offerToConvert, setOfferToConvert] = useState<CloudOffer | null>(null);

  const customer = customers.find((c) => c.id === id);
  const customerOffers = offers.filter((o) => o.customer_id === id);

  if (customersLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!customer) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Kundenliste
          </Button>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Kunde nicht gefunden.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleCreateNote = async () => {
    if (!newNoteContent.trim() || !id) return;
    await createNote.mutateAsync({
      customer_id: id,
      content: newNoteContent,
      note_type: newNoteType,
    });
    setNewNoteContent("");
    setNewNoteType("info");
  };

  const handleCreateContract = async () => {
    if (!id) return;
    await createContract.mutateAsync({
      ...contractForm,
      customer_id: id,
    });
    setContractForm({ ...initialContractForm, customer_id: id });
    setIsContractDialogOpen(false);
  };

  const handleCreateContractFromOffer = async (input: ContractInput) => {
    await createContract.mutateAsync(input);
    setOfferToConvert(null);
  };

  const openContractDialog = () => {
    setContractForm({ ...initialContractForm, customer_id: id || "" });
    setIsContractDialogOpen(true);
  };

  const getFullName = () => {
    const parts = [customer.anrede, customer.vorname, customer.nachname].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : customer.contact_name || null;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "aktiv":
        return <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">Aktiv</Badge>;
      case "inaktiv":
        return <Badge variant="secondary">Inaktiv</Badge>;
      case "interessent":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Interessent</Badge>;
      default:
        return null;
    }
  };

  const formatAddress = () => {
    const street = [customer.strasse, customer.hausnummer].filter(Boolean).join(" ");
    const city = [customer.plz, customer.ort].filter(Boolean).join(" ");
    if (!street && !city) return null;
    return [street, city].filter(Boolean).join(", ");
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Kundenliste
          </Button>
        </div>

        {/* Customer Header Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">{customer.company_name}</CardTitle>
                  {customer.vip_kunde && (
                    <Badge className="bg-amber-500/20 text-amber-600">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      VIP
                    </Badge>
                  )}
                  {getStatusBadge(customer.customer_status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  {getFullName() && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {getFullName()}
                    </span>
                  )}
                  {(customer.phone || customer.handy_nr) && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone || customer.handy_nr}
                    </span>
                  )}
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 max-w-4xl">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="stammdaten" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Stammdaten
            </TabsTrigger>
            <TabsTrigger value="vertraege" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Verträge ({contracts.length})
            </TabsTrigger>
            <TabsTrigger value="angebote" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Angebote ({customerOffers.length})
            </TabsTrigger>
            <TabsTrigger value="margen" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Margen
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-Mails ({emails.length})
            </TabsTrigger>
            <TabsTrigger value="notizen" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notizen ({notes.length})
            </TabsTrigger>
          </TabsList>

          {/* Stammdaten Tab */}
          <TabsContent value="stammdaten" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Firma */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Firmendaten
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Firma:</span>
                    <span className="font-medium">{customer.company_name}</span>
                  </div>
                  {customer.industry && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branche:</span>
                      <span>{customer.industry}</span>
                    </div>
                  )}
                  {customer.mocca_customer_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mocca-Nr.:</span>
                      <span className="font-mono text-xs">{customer.mocca_customer_number}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ansprechpartner */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Ansprechpartner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {getFullName() && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{getFullName()}</span>
                    </div>
                  )}
                  {customer.geburtstag && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Geburtstag:</span>
                      <span>{format(new Date(customer.geburtstag), "dd.MM.yyyy")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Kontakt */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Kontaktdaten
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {customer.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">E-Mail:</span>
                      <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefon:</span>
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.festnetz && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Festnetz:</span>
                      <span>{customer.festnetz}</span>
                    </div>
                  )}
                  {customer.handy_nr && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Handy:</span>
                      <span>{customer.handy_nr}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Adresse */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {formatAddress() ? (
                    <p>{formatAddress()}</p>
                  ) : (
                    <p className="text-muted-foreground">Keine Adresse hinterlegt</p>
                  )}
                </CardContent>
              </Card>

              {/* Marketing-Opt-ins */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Marketing-Einwilligungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      {customer.marketing_email ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={customer.marketing_email ? "" : "text-muted-foreground"}>
                        E-Mail
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {customer.marketing_sms ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={customer.marketing_sms ? "" : "text-muted-foreground"}>
                        SMS
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {customer.marketing_brief ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={customer.marketing_brief ? "" : "text-muted-foreground"}>
                        Brief
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notizen */}
              {customer.notes && (
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Interne Notizen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Verträge Tab */}
          <TabsContent value="vertraege" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Kundenverträge</h3>
              <Button onClick={openContractDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Vertrag
              </Button>
            </div>

            {contractsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contracts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Noch keine Verträge für diesen Kunden.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {contracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    customerId={id!}
                    onDelete={(contractId) => deleteContract.mutate(contractId)}
                    onUpdate={(contractId, data) => updateContract.mutate({ id: contractId, ...data })}
                    isDeleting={deleteContract.isPending}
                    isUpdating={updateContract.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Angebote Tab */}
          <TabsContent value="angebote" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Verknüpfte Angebote</h3>
              <Button onClick={() => navigate(`/calculator?customer=${id}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Neues Angebot
              </Button>
            </div>

            {offersLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : customerOffers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Noch keine Angebote für diesen Kunden.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {customerOffers.map((offer) => (
                  <Card key={offer.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{offer.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {offer.preview && (
                            <>
                              <span>{offer.preview.hardware}</span>
                              <span>•</span>
                              <span>{offer.preview.tariff}</span>
                              <span>•</span>
                              <span>{offer.preview.avgMonthly?.toFixed(2)}€/Monat</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(offer.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setOfferToConvert(offer)}
                        >
                          <ScrollText className="h-4 w-4 mr-1" />
                          Als Vertrag anlegen
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/offers`)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notizen Tab */}
          <TabsContent value="notizen" className="space-y-4">
            {/* Neue Notiz erstellen */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Neue Notiz hinzufügen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Select value={newNoteType} onValueChange={(v) => setNewNoteType(v as NoteType)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Notiz eingeben..."
                    rows={2}
                    className="flex-1"
                  />
                </div>
                <Button
                  onClick={handleCreateNote}
                  disabled={!newNoteContent.trim() || createNote.isPending}
                  className="w-full"
                >
                  {createNote.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Notiz hinzufügen
                </Button>
              </CardContent>
            </Card>

            {/* Timeline */}
            {notesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Noch keine Notizen vorhanden.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const config = NOTE_TYPE_CONFIG[note.note_type as keyof typeof NOTE_TYPE_CONFIG] || NOTE_TYPE_CONFIG.info;
                  return (
                    <Card key={note.id} className="relative group">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Badge className={config.color}>
                            <span className="mr-1">{config.icon}</span>
                            {config.label}
                          </Badge>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(note.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteNote.mutate(note.id)}
                            disabled={deleteNote.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Margen Tab */}
          <TabsContent value="margen" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Margen-Historie</h3>
              <p className="text-sm text-muted-foreground">
                Profitabilität aller Angebote für diesen Kunden
              </p>
            </div>

            {marginsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : marginEntries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Noch keine Angebote mit Marge-Daten vorhanden.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Durchschnitt</p>
                      <p className="text-2xl font-bold">{formatCurrency(marginStats.averageMargin)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Beste Marge</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(marginStats.bestMargin)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Schlechteste</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(marginStats.worstMargin)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Angebote</p>
                      <p className="text-2xl font-bold">{marginStats.totalOffers}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Margin Entries Table */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2 font-medium">Datum</th>
                            <th className="text-left py-2 px-2 font-medium">Angebot</th>
                            <th className="text-right py-2 px-2 font-medium">Marge</th>
                            <th className="text-right py-2 px-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {marginEntries.map((entry) => {
                            const statusColors = getStatusColors(entry.status);
                            return (
                              <tr 
                                key={entry.offerId} 
                                className="border-b hover:bg-muted/30 cursor-pointer"
                                onClick={() => navigate(`/offers/${entry.offerId}`)}
                              >
                                <td className="py-2 px-2 text-muted-foreground">
                                  {format(new Date(entry.date), "dd.MM.yyyy", { locale: de })}
                                </td>
                                <td className="py-2 px-2 font-medium">{entry.offerName}</td>
                                <td className="py-2 px-2 text-right">
                                  <MarginBadge margin={entry.margin} size="sm" />
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                    {entry.status === "positive" ? "✓" : entry.status === "warning" ? "⚠" : "✗"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* E-Mails Tab */}
          <TabsContent value="emails" className="space-y-4">
            <CustomerEmailsTab customerId={id!} />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Kunden-Historie</h3>
              <p className="text-sm text-muted-foreground">
                Alle Aktivitäten chronologisch
              </p>
            </div>
            <CustomerTimeline
              offers={customerOffers}
              emails={emails}
              contracts={contracts}
              notes={notes.map(n => ({
                id: n.id,
                content: n.content,
                note_type: n.note_type,
                created_at: n.created_at,
              }))}
              onOfferClick={() => navigate("/offers")}
            />
          </TabsContent>
        </Tabs>

        {/* Contract Dialog */}
        <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Neuer Vertrag</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Netz</Label>
                  <Select
                    value={contractForm.netz}
                    onValueChange={(v) => setContractForm({ ...contractForm, netz: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vodafone">Vodafone</SelectItem>
                      <SelectItem value="o2">O2</SelectItem>
                      <SelectItem value="telekom">Telekom</SelectItem>
                      <SelectItem value="freenet">Freenet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={contractForm.status}
                    onValueChange={(v) => setContractForm({ ...contractForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktiv">Aktiv</SelectItem>
                      <SelectItem value="gekuendigt">Gekündigt</SelectItem>
                      <SelectItem value="verlaengert">Verlängert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tarifname</Label>
                <Input
                  value={contractForm.tarif_name || ""}
                  onChange={(e) => setContractForm({ ...contractForm, tarif_name: e.target.value })}
                  placeholder="z.B. Business Prime M"
                />
              </div>
              <div className="space-y-2">
                <Label>Rufnummer</Label>
                <Input
                  value={contractForm.handy_nr || ""}
                  onChange={(e) => setContractForm({ ...contractForm, handy_nr: e.target.value })}
                  placeholder="z.B. +49 170 1234567"
                />
              </div>
              <div className="space-y-2">
                <Label>Hardware</Label>
                <Input
                  value={contractForm.hardware_name || ""}
                  onChange={(e) => setContractForm({ ...contractForm, hardware_name: e.target.value })}
                  placeholder="z.B. iPhone 15 Pro"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Vertragsbeginn</Label>
                  <Input
                    type="date"
                    value={contractForm.vertragsbeginn || ""}
                    onChange={(e) => setContractForm({ ...contractForm, vertragsbeginn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vertragsende</Label>
                  <Input
                    type="date"
                    value={contractForm.vertragsende || ""}
                    onChange={(e) => setContractForm({ ...contractForm, vertragsende: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>VVL-Datum</Label>
                  <Input
                    type="date"
                    value={contractForm.vvl_datum || ""}
                    onChange={(e) => setContractForm({ ...contractForm, vvl_datum: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Monatspreis (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={contractForm.monatspreis || ""}
                  onChange={(e) => setContractForm({ ...contractForm, monatspreis: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="z.B. 39.99"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateContract} disabled={createContract.isPending}>
                {createContract.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Vertrag anlegen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Offer to Contract Dialog */}
        <OfferToContractDialog
          offer={offerToConvert}
          isOpen={!!offerToConvert}
          onClose={() => setOfferToConvert(null)}
          onCreate={handleCreateContractFromOffer}
          isCreating={createContract.isPending}
        />
      </div>
    </MainLayout>
  );
}
