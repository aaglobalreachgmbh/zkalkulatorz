// ============================================
// Setup Complete Screen
// ============================================

import { motion } from "framer-motion";
import { CheckCircle, Rocket, ArrowRight, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import Confetti from "canvas-confetti";
import { useEffect } from "react";

interface SetupCompleteProps {
  onFinish: () => void;
}

export function SetupComplete({ onFinish }: SetupCompleteProps) {
  // Confetti beim Laden
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      Confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      Confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6 inline-flex"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -top-2 -right-2"
            >
              <PartyPopper className="w-8 h-8 text-yellow-500" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-foreground mb-3"
        >
          Einrichtung abgeschlossen!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-8"
        >
          Ihr MargenKalkulator ist jetzt einsatzbereit. 
          Sie können sofort mit der ersten Kalkulation starten.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">✓</div>
              <div className="text-xs text-muted-foreground">Provisionen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">✓</div>
              <div className="text-xs text-muted-foreground">Hardware</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">✓</div>
              <div className="text-xs text-muted-foreground">Regeln</div>
            </div>
          </div>

          <Button onClick={onFinish} size="lg" className="w-full gap-2">
            <Rocket className="w-5 h-5" />
            Zum Kalkulator
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-xs text-muted-foreground">
            Sie können alle Einstellungen jederzeit im Admin-Bereich anpassen.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
