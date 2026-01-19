export const TOKENS = {
    colors: {
        primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
            hover: "hsl(var(--primary-hover))",
        },
        secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
        },
        background: "hsl(var(--background))",
        surface: {
            DEFAULT: "hsl(var(--surface))",
            glass: "rgba(255, 255, 255, 0.8)", // For backdrop-blur
        },
        border: "hsl(var(--border))",
        success: "#10B981", // Emerald 500
        warning: "#F59E0B", // Amber 500
        error: "#EF4444",   // Red 500
    },
    spacing: {
        container: {
            sm: "1rem",   // 16px
            md: "2rem",   // 32px
            lg: "4rem",   // 64px
        },
        element: {
            xs: "0.25rem", // 4px
            sm: "0.5rem",  // 8px
            md: "1rem",    // 16px
            lg: "1.5rem",  // 24px
        }
    },
    typography: {
        fontFamily: {
            sans: "var(--font-geist-sans)",
            mono: "var(--font-geist-mono)",
        },
        sizes: {
            h1: "2rem",    // 32px
            h2: "1.5rem",  // 24px
            h3: "1.25rem", // 20px
            body: "0.875rem", // 14px (Enterprise Standard)
            small: "0.75rem", // 12px
        }
    },
    effects: {
        glass: "backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl",
        shadow: {
            sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        }
    }
} as const;
