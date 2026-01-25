import React, { createContext, useContext, useState, useEffect } from "react";

export type DensityMode = "comfortable" | "compact";

interface DensityContextType {
    density: DensityMode;
    setDensity: (mode: DensityMode) => void;
    toggleDensity: () => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export function DensityProvider({ children }: { children: React.ReactNode }) {
    // Default to comfortable, but persist in localStorage
    const [density, setDensityState] = useState<DensityMode>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("ui-density") as DensityMode) || "comfortable";
        }
        return "comfortable";
    });

    const setDensity = (mode: DensityMode) => {
        setDensityState(mode);
        localStorage.setItem("ui-density", mode);

        // Apply dataset attribute to root for CSS variable adjustments if needed
        document.documentElement.dataset.density = mode;
    };

    const toggleDensity = () => {
        setDensity(density === "comfortable" ? "compact" : "comfortable");
    };

    // Sync on mount
    useEffect(() => {
        document.documentElement.dataset.density = density;
    }, [density]);

    return (
        <DensityContext.Provider value={{ density, setDensity, toggleDensity }}>
            {children}
        </DensityContext.Provider>
    );
}

export function useDensity() {
    const context = useContext(DensityContext);
    if (context === undefined) {
        throw new Error("useDensity must be used within a DensityProvider");
    }
    return context;
}
