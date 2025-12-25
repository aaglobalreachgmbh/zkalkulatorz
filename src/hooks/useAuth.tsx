import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface MFAStatus {
  currentLevel: "aal1" | "aal2";
  nextLevel: "aal1" | "aal2" | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  requiresMFA: boolean;
  mfaStatus: MFAStatus | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requiresMFA?: boolean }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkMFAStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);

  // Check MFA assurance level
  const checkMFAStatus = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        console.error("Error checking MFA status:", error);
        return false;
      }
      
      const status: MFAStatus = {
        currentLevel: data.currentLevel as "aal1" | "aal2",
        nextLevel: data.nextLevel as "aal1" | "aal2" | null,
      };
      setMfaStatus(status);
      
      // If currentLevel is aal1 and nextLevel is aal2, MFA is required
      const mfaRequired = data.currentLevel === "aal1" && data.nextLevel === "aal2";
      setRequiresMFA(mfaRequired);
      return mfaRequired;
    } catch (error) {
      console.error("Error checking MFA status:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Check MFA status after auth state change
        if (session?.user) {
          // Defer to avoid blocking
          setTimeout(() => {
            checkMFAStatus();
          }, 0);
        } else {
          setRequiresMFA(false);
          setMfaStatus(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        await checkMFAStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkMFAStatus]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { error: error as Error };
    }
    
    // Check if MFA is required after successful login
    const mfaRequired = await checkMFAStatus();
    
    return { error: null, requiresMFA: mfaRequired };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split("@")[ 0],
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    setRequiresMFA(false);
    setMfaStatus(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      requiresMFA,
      mfaStatus,
      signIn, 
      signUp, 
      signOut,
      checkMFAStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
