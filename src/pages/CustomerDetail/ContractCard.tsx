import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Phone,
  Calendar,
  Trash2,
  Pencil,
  RefreshCw,
  FileText,
  Euro,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  getVVLUrgency,
  getVVLUrgencyConfig,
  getRemainingDays,
  getRemainingTime,
  NETZ_CONFIG,
  type CustomerContract,
} from "@/margenkalkulator/hooks/useCustomerContracts";

interface ContractCardProps {
  contract: CustomerContract;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<CustomerContract>) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
  customerId: string;
}

const STATUS_CONFIG = {
  aktiv: { label: "Aktiv", color: "bg-green-500/20 text-green-600 border-green-500/30" },
  gekündigt: { label: "Gekündigt", color: "bg-red-500/20 text-red-600 border-red-500/30" },
  verlängert: { label: "Verlängert", color: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  auslaufend: { label: "Auslaufend", color: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
} as const;

export function ContractCard({
  contract,
  onDelete,
  onUpdate,
  isDeleting,
  isUpdating,
  customerId,
}: ContractCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVVLDialogOpen, setIsVVLDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(contract);
  const [newVVLDate, setNewVVLDate] = useState("");

  const urgency = getVVLUrgency(contract.vvl_datum);
  const urgencyConfig = getVVLUrgencyConfig(urgency);
  const vvlRemainingDays = getRemainingDays(contract.vvl_datum);
  const contractEndDays = getRemainingDays(contract.vertragsende);
  const contractEndTime = getRemainingTime(contract.vertragsende);
  const netzConfig = NETZ_CONFIG[contract.netz as keyof typeof NETZ_CONFIG] || NETZ_CONFIG.vodafone;
  const statusConfig = STATUS_CONFIG[contract.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.aktiv;

  // Calculate progress for visual bars (24 months = 100%)
  const calculateProgress = (startDate: string | null, endDate: string | null): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  const contractProgress = calculateProgress(contract.vertragsbeginn, contract.vertragsende);

  const handleSaveEdit = () => {
    onUpdate(contract.id, {
      tarif_name: editForm.tarif_name,
      hardware_name: editForm.hardware_name,
      handy_nr: editForm.handy_nr,
      monatspreis: editForm.monatspreis,
      ek_preis: editForm.ek_preis,
      provision_erhalten: editForm.provision_erhalten,
      vertragsbeginn: editForm.vertragsbeginn,
      vertragsende: editForm.vertragsende,
      vvl_datum: editForm.vvl_datum,
      status: editForm.status,
      notes: editForm.notes,
    });
    setIsEditDialogOpen(false);
  };

  const handleVVLDone = () => {
    if (!newVVLDate) return;
    // Calculate new end date (24 months from new VVL date)
    const vvlDate = new Date(newVVLDate);
    const newEndDate = new Date(vvlDate);
    newEndDate.setMonth(newEndDate.getMonth() + 24);
    
    onUpdate(contract.id, {
      status: "verlängert",
      vertragsbeginn: newVVLDate,
      vertragsende: newEndDate.toISOString().split("T")[0],
      vvl_datum: new Date(newEndDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    setIsVVLDialogOpen(false);
    setNewVVLDate("");
  };

  const handleCreateOffer = () => {
    // Navigate to calculator with pre-filled data
    const params = new URLSearchParams({
      customer: customerId,
      tariff: contract.tarif_name || "",
      hardware: contract.hardware_name || "",
    });
    navigate(`/?${params.toString()}`);
  };

  return (
    <>
      <Card className={`group border-l-4 ${urgencyConfig.dotColor.replace("bg-", "border-")}`}>
        <CardContent className="py-4 space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Netz Badge */}
              <Badge variant="outline" className={`text-xs font-medium ${netzConfig.textColor}`}>
                {netzConfig.label}
              </Badge>

              {/* Status Badge */}
              <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>

              {/* Contract Info */}
              <div>
                <div className="flex items-center gap-2">
                  {contract.tarif_name && (
                    <span className="font-semibold">{contract.tarif_name}</span>
                  )}
                  {contract.hardware_name && (
                    <span className="text-sm text-muted-foreground">
                      • {contract.hardware_name}
                    </span>
                  )}
                </div>
                {contract.handy_nr && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <Phone className="h-3 w-3" />
                    {contract.handy_nr}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bearbeiten</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => setIsVVLDialogOpen(true)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>VVL durchgeführt</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:text-primary/80"
                      onClick={handleCreateOffer}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Angebot erstellen</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDelete(contract.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Löschen</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Dates & Financials Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Vertragsbeginn</span>
              <p className="font-medium">
                {contract.vertragsbeginn
                  ? format(new Date(contract.vertragsbeginn), "dd.MM.yyyy")
                  : "–"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Vertragsende</span>
              <p className="font-medium">
                {contract.vertragsende
                  ? format(new Date(contract.vertragsende), "dd.MM.yyyy")
                  : "–"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">VVL-Datum</span>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {contract.vvl_datum
                    ? format(new Date(contract.vvl_datum), "dd.MM.yyyy")
                    : "–"}
                </p>
                {vvlRemainingDays !== null && (
                  <Badge className={`text-xs ${urgencyConfig.color}`}>
                    {vvlRemainingDays <= 0
                      ? `${Math.abs(vvlRemainingDays)}d überfällig`
                      : `${vvlRemainingDays}d`}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Monatspreis</span>
              <p className="font-medium">
                {contract.monatspreis ? `${contract.monatspreis.toFixed(2)}€` : "–"}
              </p>
            </div>
          </div>

          {/* Progress Bars */}
          {(contract.vertragsbeginn || contract.vertragsende) && (
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Vertragslaufzeit</span>
                  <span className="text-muted-foreground">
                    {contractEndTime
                      ? `Noch ${contractEndTime.months} Monate, ${contractEndTime.days % 30} Tage`
                      : "–"}
                  </span>
                </div>
                <Progress value={contractProgress} className="h-2" />
              </div>
            </div>
          )}

          {/* Expandable Section */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center pt-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Weniger anzeigen
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Mehr Details
              </>
            )}
          </button>

          {isExpanded && (
            <div className="pt-2 border-t space-y-3">
              {/* Financial Details (Dealer Info) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground text-xs">EK-Preis</span>
                    <p className="font-medium">
                      {contract.ek_preis ? `${contract.ek_preis.toFixed(2)}€` : "–"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="text-muted-foreground text-xs">Provision erhalten</span>
                    <p className="font-medium text-green-600">
                      {contract.provision_erhalten
                        ? `${contract.provision_erhalten.toFixed(2)}€`
                        : "–"}
                    </p>
                  </div>
                </div>
                {contract.ek_preis && contract.provision_erhalten && (
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground text-xs">Marge</span>
                      <p
                        className={`font-medium ${
                          contract.provision_erhalten - contract.ek_preis >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(contract.provision_erhalten - contract.ek_preis).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {contract.notes && (
                <div className="bg-muted/50 rounded-md p-3 text-sm">
                  <span className="text-xs text-muted-foreground font-medium">Notizen:</span>
                  <p className="mt-1 whitespace-pre-wrap">{contract.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vertrag bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarif</Label>
                <Input
                  value={editForm.tarif_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, tarif_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hardware</Label>
                <Input
                  value={editForm.hardware_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, hardware_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rufnummer</Label>
                <Input
                  value={editForm.handy_nr || ""}
                  onChange={(e) => setEditForm({ ...editForm, handy_nr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktiv">Aktiv</SelectItem>
                    <SelectItem value="gekündigt">Gekündigt</SelectItem>
                    <SelectItem value="verlängert">Verlängert</SelectItem>
                    <SelectItem value="auslaufend">Auslaufend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Vertragsbeginn</Label>
                <Input
                  type="date"
                  value={editForm.vertragsbeginn || ""}
                  onChange={(e) => setEditForm({ ...editForm, vertragsbeginn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vertragsende</Label>
                <Input
                  type="date"
                  value={editForm.vertragsende || ""}
                  onChange={(e) => setEditForm({ ...editForm, vertragsende: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>VVL-Datum</Label>
                <Input
                  type="date"
                  value={editForm.vvl_datum || ""}
                  onChange={(e) => setEditForm({ ...editForm, vvl_datum: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Monatspreis (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.monatspreis || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, monatspreis: parseFloat(e.target.value) || undefined })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>EK-Preis (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.ek_preis || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, ek_preis: parseFloat(e.target.value) || undefined })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Provision erhalten (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.provision_erhalten || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      provision_erhalten: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VVL Done Dialog */}
      <Dialog open={isVVLDialogOpen} onOpenChange={setIsVVLDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>VVL durchgeführt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Geben Sie das Datum der Vertragsverlängerung ein. Der Vertrag wird automatisch auf
              24 Monate verlängert und das neue VVL-Datum berechnet.
            </p>
            <div className="space-y-2">
              <Label>Neues Vertragsbeginn-Datum</Label>
              <Input
                type="date"
                value={newVVLDate}
                onChange={(e) => setNewVVLDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVVLDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleVVLDone} disabled={!newVVLDate || isUpdating}>
              <RefreshCw className="h-4 w-4 mr-2" />
              VVL bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
