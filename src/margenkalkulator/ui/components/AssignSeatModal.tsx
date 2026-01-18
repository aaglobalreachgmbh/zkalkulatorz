// ============================================
// Assign Seat Modal
// Modal zum Zuweisen von Seats an Mitarbeiter
// ============================================

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { useCloudSeats } from "@/hooks/useCloudSeats";
import { toast } from "sonner";

interface AssignSeatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignSeatModal({ open, onOpenChange }: AssignSeatModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { assignSeat, seatUsage, seats } = useCloudSeats();
  

  const resetForm = () => {
    setEmail("");
    setName("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError("E-Mail-Adresse ist erforderlich");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ungültige E-Mail-Adresse");
      return;
    }

    // Check if already assigned
    if (seats.some(s => s.userEmail.toLowerCase() === email.toLowerCase())) {
      setError("Diese E-Mail-Adresse hat bereits einen Seat");
      return;
    }

    // Check seat limit
    if (seatUsage.available <= 0) {
      setError("Kein Seat mehr verfügbar. Bitte upgraden Sie Ihre Lizenz.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Note: For now we use email as a placeholder for userId
      // In production, this would look up the user by email first
      await assignSeat(email, email, name || undefined);
      
      toast.success("Seat zugewiesen", { description: `${name || email} hat nun Zugang zum System.` });

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Zuweisen des Seats");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Seat zuweisen
          </DialogTitle>
          <DialogDescription>
            Weisen Sie einem Mitarbeiter einen Seat zu, um Zugang zum System zu gewähren.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seat availability info */}
          <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
            Verfügbare Seats: <strong>{seatUsage.available}</strong> von {seatUsage.limit}
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="seat-name">Name (optional)</Label>
            <Input
              id="seat-name"
              placeholder="Max Mustermann"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="seat-email">E-Mail-Adresse *</Label>
            <Input
              id="seat-email"
              type="email"
              placeholder="max@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || seatUsage.available <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird zugewiesen...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Seat zuweisen
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
