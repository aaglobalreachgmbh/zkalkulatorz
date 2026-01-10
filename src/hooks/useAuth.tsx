import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearSessionKey } from "@/lib/secureStorage";

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
    console.log("[useAuth] Setting up auth listener...");
    
    // Track if initial session has been checked
    let initialSessionChecked = false;
    
    // Helper to clear corrupt session
    const clearCorruptSession = async (reason: string) => {
      console.warn("[useAuth] Clearing corrupt session:", reason);
      clearSessionKey();
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("[useAuth] Error during signOut:", e);
      }
      setSession(null);
      setUser(null);
      setRequiresMFA(false);
      setMfaStatus(null);
      setIsLoading(false);
      
      // CRITICAL: Redirect to auth page to avoid stuck states
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/pending-approval') {
        console.log("[useAuth] Redirecting to /auth after clearing corrupt session");
        window.location.href = '/auth';
      }
    };
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[useAuth] Auth state change:", event, "session:", !!session, "initialChecked:", initialSessionChecked);
        
        // Handle token refresh failures - clear corrupt session
        if (event === 'TOKEN_REFRESHED' && !session) {
          await clearCorruptSession("TOKEN_REFRESHED without session");
          return;
        }
        
        // Always update session and user state
        setSession(session);
        setUser(session?.user ?? null);
        
        // CRITICAL FIX: Only set isLoading to false AFTER initial session check
        // OR on explicit login/logout events
        if (initialSessionChecked || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          console.log("[useAuth] Setting isLoading to false after event:", event);
          setIsLoading(false);
        }
        
        // Check MFA status after auth state change
        if (session?.user) {
          setTimeout(() => {
            checkMFAStatus();
          }, 0);
        } else {
          setRequiresMFA(false);
          setMfaStatus(null);
        }
      }
    );

    // THEN check for existing session - THIS is the authoritative source
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("[useAuth] Initial session check complete:", !!session, session?.user?.id, "error:", error?.message);
        
        // Detect corrupt session (refresh token not found)
        if (error?.message?.includes('refresh_token') || 
            error?.message?.includes('Refresh Token Not Found') ||
            error?.code === 'refresh_token_not_found' ||
            (error as any)?.code === 'refresh_token_not_found') {
          await clearCorruptSession("refresh_token_not_found");
          return;
        }
        
        // If there's any error but no session, just clear and continue
        if (error && !session) {
          console.warn("[useAuth] Session error without session, clearing:", error.message);
          await clearCorruptSession("session_error_no_session");
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        initialSessionChecked = true;
        setIsLoading(false); // ONLY here after definitive check
        
        if (session?.user) {
          await checkMFAStatus();
        }
      } catch (err) {
        console.error("[useAuth] Session check failed:", err);
        // On any session retrieval error, clear potentially corrupt data
        await clearCorruptSession("session check exception");
      }
    };
    
    initSession();

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split("@")[0],
        },
      },
    });
    
    // Notify admin about new registration (fire and forget)
    if (!error && data.user) {
      supabase.functions.invoke("notify-admin-registration", {
        body: {
          userId: data.user.id,
          email: data.user.email,
          displayName: displayName || email.split("@")[0],
        },
      }).catch((err) => {
        console.error("Failed to notify admin about registration:", err);
      });
    }
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    setRequiresMFA(false);
    setMfaStatus(null);
    // SECURITY: Clear session key to make encrypted local storage inaccessible
    clearSessionKey();
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

const SAFE_DEFAULT_AUTH: AuthContextType = {
  user: null,
  session: null,
  isLoading: false,
  requiresMFA: false,
  mfaStatus: null,
  signIn: async () => ({ error: new Error("Auth not available") }),
  signUp: async () => ({ error: new Error("Auth not available") }),
  signOut: async () => {},
  checkMFAStatus: async () => false,
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn("[useAuth] Used outside AuthProvider, returning safe default");
    return SAFE_DEFAULT_AUTH;
  }
  return context;
}
