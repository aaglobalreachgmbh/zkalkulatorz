import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface POSModeContextType {
  isPOSMode: boolean;
  togglePOSMode: () => void;
  enablePOSMode: () => void;
  disablePOSMode: () => void;
}

const POSModeContext = createContext<POSModeContextType | undefined>(undefined);

interface POSModeProviderProps {
  children: ReactNode;
}

export function POSModeProvider({ children }: POSModeProviderProps) {
  const [isPOSMode, setIsPOSMode] = useState(false);

  const togglePOSMode = useCallback(() => {
    setIsPOSMode((prev) => !prev);
  }, []);

  const enablePOSMode = useCallback(() => {
    setIsPOSMode(true);
  }, []);

  const disablePOSMode = useCallback(() => {
    setIsPOSMode(false);
  }, []);

  return (
    <POSModeContext.Provider
      value={{
        isPOSMode,
        togglePOSMode,
        enablePOSMode,
        disablePOSMode,
      }}
    >
      {children}
    </POSModeContext.Provider>
  );
}

export function usePOSMode() {
  const context = useContext(POSModeContext);
  if (context === undefined) {
    // Return safe defaults if used outside provider
    return {
      isPOSMode: false,
      togglePOSMode: () => {},
      enablePOSMode: () => {},
      disablePOSMode: () => {},
    };
  }
  return context;
}
