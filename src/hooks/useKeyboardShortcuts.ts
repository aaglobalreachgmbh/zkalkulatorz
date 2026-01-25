import { useEffect } from "react";

type KeyCombo = {
    key: string;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
};

export function useKeyboardShortcuts(
    shortcuts: Record<string, () => void>
) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore inputs
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            Object.entries(shortcuts).forEach(([comboString, action]) => {
                const parts = comboString.toLowerCase().split("+");
                const key = parts[parts.length - 1];
                const metaRequired = parts.includes("meta") || parts.includes("ctrl") || parts.includes("cmd");
                const shiftRequired = parts.includes("shift");
                const altRequired = parts.includes("alt");

                const metaPressed = event.metaKey || event.ctrlKey;
                const shiftPressed = event.shiftKey;
                const altPressed = event.altKey;

                if (
                    event.key.toLowerCase() === key &&
                    metaPressed === metaRequired &&
                    shiftPressed === shiftRequired &&
                    altPressed === altRequired
                ) {
                    event.preventDefault();
                    action();
                }
            });
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [shortcuts]);
}
