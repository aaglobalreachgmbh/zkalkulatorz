import confetti from "canvas-confetti";

/**
 * Fire a confetti celebration effect
 * @param options.duration - How long the confetti runs in milliseconds (default: 3000)
 */
export function fireConfetti(options?: { duration?: number }) {
  const duration = options?.duration ?? 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#e11d48", "#f59e0b", "#10b981"],
    });
    confetti({
      particleCount: 3,
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
