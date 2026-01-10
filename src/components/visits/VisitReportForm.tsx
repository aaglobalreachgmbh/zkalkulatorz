/**
 * Formular zum Erstellen/Bearbeiten eines Besuchsberichts
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Camera, 
  Image as ImageIcon, 
  Loader2,
  Save,
  Send,
  Navigation,
  CheckCircle,
  X,
  WifiOff,
} from "lucide-react";
import { useVisitReports, type CreateVisitReportInput, type GeoPosition } from "@/hooks/useVisitReports";
import { useVisitChecklists, type ChecklistResponse } from "@/hooks/useVisitChecklists";
import { useVisitPhotos } from "@/hooks/useVisitPhotos";
import { useCustomers } from "@/margenkalkulator/hooks/useCustomers";
import { ChecklistRenderer } from "./ChecklistRenderer";
import { VisitPhotoGrid } from "./VisitPhotoGrid";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VisitReportFormProps {
  reportId?: string;
  customerId?: string;
  onSuccess?: () => void;
}

export function VisitReportForm({ reportId, customerId, onSuccess }: VisitReportFormProps) {
  const navigate = useNavigate();
  const { createReport, updateReport, submitReport, captureLocation, reverseGeocode, isOnline } = useVisitReports();
  const { checklists, templates } = useVisitChecklists();
  const { captureFromCamera, selectFromGallery, uploadPhoto } = useVisitPhotos();
  const { customers, isLoading: customersLoading } = useCustomers();

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || "");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState<GeoPosition | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedChecklistId, setSelectedChecklistId] = useState("");
  const [checklistResponses, setChecklistResponses] = useState<ChecklistResponse>({});
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-capture location on mount (if allowed)
  useEffect(() => {
    const autoCapture = async () => {
      try {
        await handleCaptureLocation();
      } catch (e) {
        // Silently fail - user can manually capture
        console.log("[VisitReportForm] Auto-capture failed:", e);
      }
    };
    
    // Only auto-capture for new reports
    if (!reportId) {
      autoCapture();
    }
  }, []);

  const handleCaptureLocation = async () => {
    setIsCapturingLocation(true);
    try {
      const pos = await captureLocation();
      
      // Try to get address
      const address = await reverseGeocode(pos.latitude, pos.longitude);
      
      setLocation({
        ...pos,
        address: address || undefined,
      });
      
      toast.success("Standort erfasst");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    const file = await captureFromCamera();
    if (file) {
      setPendingPhotos((prev) => [...prev, file]);
    }
  };

  const handleSelectPhoto = async () => {
    const file = await selectFromGallery();
    if (file) {
      setPendingPhotos((prev) => [...prev, file]);
    }
  };

  const handleRemovePendingPhoto = (index: number) => {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (submit = false) => {
    if (submit) {
      setIsSubmitting(true);
    } else {
      setIsSaving(true);
    }

    try {
      const input: CreateVisitReportInput = {
        customer_id: selectedCustomerId || undefined,
        visit_date: new Date(visitDate).toISOString(),
        location_lat: location?.latitude,
        location_lng: location?.longitude,
        location_address: location?.address,
        notes: notes || undefined,
        checklist_id: selectedChecklistId || undefined,
        checklist_responses: checklistResponses,
        status: submit ? "submitted" : "draft",
      };

      let newReportId: string;

      if (reportId) {
        await updateReport.mutateAsync({ id: reportId, ...input });
        newReportId = reportId;
      } else {
        newReportId = await createReport.mutateAsync(input);
      }

      // Upload pending photos (only if online)
      if (isOnline && pendingPhotos.length > 0) {
        for (const file of pendingPhotos) {
          await uploadPhoto.mutateAsync({
            visitReportId: newReportId,
            file,
          });
        }
        setPendingPhotos([]);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/visits");
      }
    } catch (error) {
      console.error("[VisitReportForm] Save error:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  const selectedChecklist = checklists.find((c) => c.id === selectedChecklistId);

  return (
    <div className="space-y-6">
      {/* Offline-Indicator */}
      {!isOnline && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="py-3 flex items-center gap-2 text-warning">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              Offline-Modus - Bericht wird lokal gespeichert
            </span>
          </CardContent>
        </Card>
      )}

      {/* Kunde */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kunde</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Kunde auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {customersLoading ? (
                <div className="p-2 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Lade...
                </div>
              ) : (
                customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_name}
                    {customer.contact_name && (
                      <span className="text-muted-foreground ml-2">
                        ({customer.contact_name})
                      </span>
                    )}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Standort */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Standort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {location ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Erfasst
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ±{Math.round(location.accuracy)}m Genauigkeit
                </span>
              </div>
              {location.address && (
                <p className="text-sm">{location.address}</p>
              )}
              <p className="text-xs text-muted-foreground font-mono">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCaptureLocation}
                disabled={isCapturingLocation}
              >
                {isCapturingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Neu erfassen
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleCaptureLocation}
              disabled={isCapturingLocation}
              className="w-full"
            >
              {isCapturingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              Standort erfassen
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Fotos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Fotos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTakePhoto} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Foto aufnehmen
            </Button>
            <Button variant="outline" onClick={handleSelectPhoto} className="flex-1">
              <ImageIcon className="h-4 w-4 mr-2" />
              Aus Galerie
            </Button>
          </div>

          {/* Pending Photos Preview */}
          {pendingPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {pendingPhotos.map((file, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => handleRemovePendingPhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Existing Photos (for edit mode) */}
          {reportId && <VisitPhotoGrid reportId={reportId} />}
        </CardContent>
      </Card>

      {/* Notizen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Notizen zum Besuch..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Checkliste */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Beratungs-Checkliste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
            <SelectTrigger>
              <SelectValue placeholder="Checkliste auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {templates.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground text-sm">
                  Keine Checklisten verfügbar
                </div>
              ) : (
                templates.map((cl) => (
                  <SelectItem key={cl.id} value={cl.id}>
                    {cl.name}
                    {cl.description && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        - {cl.description}
                      </span>
                    )}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {selectedChecklist && (
            <>
              <Separator />
              <ChecklistRenderer
                checklist={selectedChecklist}
                responses={checklistResponses}
                onChange={setChecklistResponses}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Datum/Zeit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Besuchszeitpunkt</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="datetime-local"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleSave(false)}
          disabled={isSaving || isSubmitting}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Entwurf speichern
        </Button>
        <Button
          className="flex-1"
          onClick={() => handleSave(true)}
          disabled={isSaving || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Einreichen
        </Button>
      </div>
    </div>
  );
}
