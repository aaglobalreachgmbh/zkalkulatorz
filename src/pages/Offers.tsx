import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useCloudOffers, CloudOffer } from "@/margenkalkulator/hooks/useCloudOffers";
import { useCustomers } from "@/margenkalkulator/hooks/useCustomers";
import { useTeams } from "@/margenkalkulator/hooks/useTeams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share2,
  FileText,
  Loader2,
  Search,
  Users,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Offers() {
  const navigate = useNavigate();
  const { offers, isLoading, deleteOffer, renameOffer } = useCloudOffers();
  const { customers } = useCustomers();
  const { teams } = useTeams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CloudOffer | null>(null);
  const [newName, setNewName] = useState("");
  const [shareTeamId, setShareTeamId] = useState<string>("");

  const filteredOffers = offers.filter(
    (offer) =>
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.preview?.tariffName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (offer: CloudOffer) => {
    if (window.confirm(`Angebot "${offer.name}" wirklich löschen?`)) {
      await deleteOffer.mutateAsync(offer.id);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !newName.trim()) return;
    await renameOffer.mutateAsync({ id: selectedOffer.id, name: newName });
    setIsRenameDialogOpen(false);
    setSelectedOffer(null);
    setNewName("");
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !shareTeamId) return;

    try {
      const { error } = await supabase
        .from("saved_offers")
        .update({
          team_id: shareTeamId,
          visibility: "team",
        })
        .eq("id", selectedOffer.id);

      if (error) throw error;
      toast.success("Angebot mit Team geteilt");
      setIsShareDialogOpen(false);
      setSelectedOffer(null);
      setShareTeamId("");
    } catch (error) {
      toast.error("Fehler beim Teilen");
    }
  };

  const handleLoad = (offer: CloudOffer) => {
    // Store in sessionStorage for the Wizard to pick up
    sessionStorage.setItem("loadOffer", JSON.stringify(offer.config));
    navigate("/");
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return null;
    const customer = customers.find((c) => c.id === customerId);
    return customer?.company_name;
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return null;
    const team = teams.find((t) => t.id === teamId);
    return team?.name;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meine Angebote</h1>
            <p className="text-muted-foreground">
              Alle gespeicherten Angebote ({filteredOffers.length})
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Angebote durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent>
            <form onSubmit={handleRename}>
              <DialogHeader>
                <DialogTitle>Angebot umbenennen</DialogTitle>
                <DialogDescription>Geben Sie einen neuen Namen für das Angebot ein.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Neuer Name..."
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={renameOffer.isPending}>
                  {renameOffer.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Speichern
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent>
            <form onSubmit={handleShare}>
              <DialogHeader>
                <DialogTitle>Angebot teilen</DialogTitle>
                <DialogDescription>
                  Teilen Sie "{selectedOffer?.name}" mit einem Team.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="share-team">Team auswählen</Label>
                <Select value={shareTeamId} onValueChange={setShareTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Team wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {teams.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Sie sind noch keinem Team beigetreten.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={!shareTeamId}>
                  Teilen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Angebotsliste
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Angebote gefunden</p>
                <p className="text-sm">
                  {searchQuery ? "Versuchen Sie eine andere Suche" : "Erstellen Sie Ihr erstes Angebot im Kalkulator"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tarif</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Sichtbarkeit</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Monatlich</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.map((offer) => (
                    <TableRow key={offer.id} className="cursor-pointer" onClick={() => handleLoad(offer)}>
                      <TableCell className="font-medium">{offer.name}</TableCell>
                      <TableCell>
                        {offer.preview?.tariffName || "-"}
                        {offer.preview?.hardwareName && (
                          <span className="text-muted-foreground text-xs block">
                            + {offer.preview.hardwareName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getCustomerName(offer.customer_id) || "-"}</TableCell>
                      <TableCell>
                        {offer.visibility === "team" ? (
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            {getTeamName(offer.team_id) || "Team"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Privat
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(offer.created_at), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell>
                        {offer.preview?.avgMonthlyNet
                          ? `${offer.preview.avgMonthlyNet.toFixed(2)} €`
                          : "-"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOffer(offer);
                                setNewName(offer.name);
                                setIsRenameDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Umbenennen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOffer(offer);
                                setIsShareDialogOpen(true);
                              }}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Mit Team teilen
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(offer)}
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
