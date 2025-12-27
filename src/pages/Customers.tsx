import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { useCustomers, Customer, CustomerInput } from "@/margenkalkulator/hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, MoreHorizontal, Pencil, Trash2, Building2, Loader2, Upload } from "lucide-react";

export default function Customers() {
  const navigate = useNavigate();
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerInput>({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    industry: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      industry: "",
      notes: "",
    });
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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kunden</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Geschäftskunden</p>
          </div>
          <div className="flex gap-2">
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
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingCustomer ? "Kunde bearbeiten" : "Neuen Kunden anlegen"}
                  </DialogTitle>
                  <DialogDescription>
                    Füllen Sie die Kundendaten aus. Nur der Firmenname ist erforderlich.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company_name">Firmenname *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({ ...formData, company_name: e.target.value })
                      }
                      placeholder="Muster GmbH"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contact_name">Ansprechpartner</Label>
                      <Input
                        id="contact_name"
                        value={formData.contact_name}
                        onChange={(e) =>
                          setFormData({ ...formData, contact_name: e.target.value })
                        }
                        placeholder="Max Mustermann"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="industry">Branche</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) =>
                          setFormData({ ...formData, industry: e.target.value })
                        }
                        placeholder="IT & Telekommunikation"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="kontakt@muster.de"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+49 123 456789"
                      />
                    </div>
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
                </div>
                <DialogFooter>
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
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Kunden vorhanden</p>
                <p className="text-sm">Erstellen Sie Ihren ersten Kunden</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    <TableHead>Ansprechpartner</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Branche</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.company_name}</TableCell>
                      <TableCell>{customer.contact_name || "-"}</TableCell>
                      <TableCell>{customer.email || "-"}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell>{customer.industry || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
