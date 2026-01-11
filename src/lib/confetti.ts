import confetti from "canvas-confetti";

/**
 * Fire a confetti celebration effect
 * @param options.duration - How long the confetti runs in milliseconds (default: 3000)
 * @param options.quick - Quick mode with reduced particles and duration (for rapid workflows)
 * @param options.disabled - Skip confetti entirely (for settings/preferences)
 */
export function fireConfetti(options?: { 
  duration?: number;
  quick?: boolean;
  disabled?: boolean;
}) {
  // Allow disabling confetti for rapid workflows
  if (options?.disabled) return;

  const isQuick = options?.quick ?? false;
  const duration = isQuick ? 500 : (options?.duration ?? 3000);
  const particleCount = isQuick ? 2 : 3;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#e11d48", "#f59e0b", "#10b981"],
    });
    confetti({
      particleCount,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#e11d48", "#f59e0b", "#10b981"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
