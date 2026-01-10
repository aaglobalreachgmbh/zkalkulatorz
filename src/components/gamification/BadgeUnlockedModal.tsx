/**
 * Badge Unlocked Modal
 * 
 * Celebratory modal when user earns a new badge.
 */

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeDefinition } from "@/hooks/useGamification";
import confetti from "canvas-confetti";

interface BadgeUnlockedModalProps {
  badge: BadgeDefinition | null;
  onClose: () => void;
}

export function BadgeUnlockedModal({ badge, onClose }: BadgeUnlockedModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (badge) {
      setIsOpen(true);
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"],
      });
    }
  }, [badge]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!badge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="py-6 space-y-4">
          {/* Celebration header */}
          <div className="text-4xl animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-primary">Neuer Badge!</h2>

          {/* Badge display */}
          <div className="flex flex-col items-center py-6">
            <div className="text-8xl mb-4 animate-pulse">{badge.icon}</div>
            <h3 className="text-xl font-semibold">{badge.name}</h3>
            <p className="text-muted-foreground mt-2 max-w-[280px]">
              {badge.description}
            </p>
          </div>

          {/* Bonus points */}
          {badge.points_reward > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-lg px-4 py-2">
              +{badge.points_reward} Bonus-Punkte! ⭐
            </Badge>
          )}

          {/* Close button */}
          <Button onClick={handleClose} className="mt-4 w-full sm:w-auto">
            Toll! 🎊
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
