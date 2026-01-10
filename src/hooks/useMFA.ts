// ============================================
// MFA Hook - Multi-Factor Authentication
// Handles TOTP enrollment, verification, and backup codes
// ============================================

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: "totp" | "phone";
  status: "verified" | "unverified";
  created_at: string;
}

export interface BackupCode {
  id: string;
  used: boolean;
  used_at: string | null;
}

export interface EnrollmentResult {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export function useMFA() {
  const { user } = useAuth();
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [backupCodesCount, setBackupCodesCount] = useState(0);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentResult | null>(null);

  // Check if MFA is enabled (has verified TOTP factor)
  const hasMFA = factors.some(f => f.factor_type === "totp" && f.status === "verified");

  // Fetch MFA factors
  const fetchFactors = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      setFactors(data.totp.map(f => ({
        id: f.id,
        friendly_name: f.friendly_name,
        factor_type: "totp" as const,
        status: f.status as "verified" | "unverified",
        created_at: f.created_at,
      })));
    } catch (error) {
      console.error("Error fetching MFA factors:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch backup codes count
  const fetchBackupCodesCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from("mfa_backup_codes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("used", false);
      
      if (error) throw error;
      setBackupCodesCount(count || 0);
    } catch (error) {
      console.error("Error fetching backup codes count:", error);
    }
  }, [user]);

  // Start TOTP enrollment
  const enrollTOTP = useCallback(async (friendlyName: string = "Authenticator App"): Promise<EnrollmentResult | null> => {
    if (!user) return null;
    
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });
      
      if (error) throw error;
      
      const result: EnrollmentResult = {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      };
      
      setEnrollmentData(result);
      return result;
    } catch (error: any) {
      console.error("Error enrolling TOTP:", error);
      toast.error(`MFA-Einrichtung fehlgeschlagen: ${error.message}`);
      return null;
    } finally {
      setIsEnrolling(false);
    }
  }, [user]);

  // Verify TOTP code during enrollment
  const verifyEnrollment = useCallback(async (factorId: string, code: string): Promise<boolean> => {
    setIsVerifying(true);
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      
      if (challengeError) throw challengeError;
      
      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      
      if (verifyError) throw verifyError;
      
      setEnrollmentData(null);
      await fetchFactors();
      toast.success("2FA erfolgreich aktiviert!");
      return true;
    } catch (error: any) {
      console.error("Error verifying TOTP:", error);
      toast.error(`Code ungültig: ${error.message}`);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [fetchFactors]);

  // Challenge and verify for login
  const challengeAndVerify = useCallback(async (code: string): Promise<boolean> => {
    setIsVerifying(true);
    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      
      const totpFactor = factorsData.totp.find(f => f.status === "verified");
      if (!totpFactor) {
        console.warn("[useMFA] No verified TOTP factor found");
        toast.error("Kein verifizierter TOTP-Faktor gefunden");
        return false;
      }
      
      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      
      if (challengeError) throw challengeError;
      
      // Verify
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code,
      });
      
      if (verifyError) throw verifyError;
      
      return true;
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast.error(`2FA-Verifizierung fehlgeschlagen: ${error.message}`);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Unenroll TOTP
  const unenrollTOTP = useCallback(async (factorId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      
      await fetchFactors();
      toast.success("2FA deaktiviert");
      return true;
    } catch (error: any) {
      console.error("Error unenrolling TOTP:", error);
      toast.error(`Fehler beim Deaktivieren: ${error.message}`);
      return false;
    }
  }, [fetchFactors]);

  // Generate backup codes
  const generateBackupCodes = useCallback(async (): Promise<string[]> => {
    if (!user) return [];
    
    try {
      // Generate 10 random backup codes
      const codes: string[] = [];
      for (let i = 0; i < 10; i++) {
        const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();
        codes.push(code);
      }
      
      // Delete existing backup codes
      await supabase
        .from("mfa_backup_codes")
        .delete()
        .eq("user_id", user.id);
      
      // Store hashed backup codes
      const hashedCodes = await Promise.all(
        codes.map(async (code) => {
          // Simple hash using SubtleCrypto
          const encoder = new TextEncoder();
          const data = encoder.encode(code + user.id);
          const hashBuffer = await crypto.subtle.digest("SHA-256", data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
          return hashHex;
        })
      );
      
      const { error } = await supabase
        .from("mfa_backup_codes")
        .insert(hashedCodes.map(hash => ({
          user_id: user.id,
          code_hash: hash,
        })));
      
      if (error) throw error;
      
      await fetchBackupCodesCount();
      return codes;
    } catch (error: any) {
      console.error("Error generating backup codes:", error);
      toast.error("Fehler beim Generieren der Backup-Codes");
      return [];
    }
  }, [user, fetchBackupCodesCount]);

  // Verify backup code
  const verifyBackupCode = useCallback(async (code: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Hash the code
      const encoder = new TextEncoder();
      const data = encoder.encode(code.toUpperCase() + user.id);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      
      // Check if code exists and is unused
      const { data: codeData, error: fetchError } = await supabase
        .from("mfa_backup_codes")
        .select("id")
        .eq("user_id", user.id)
        .eq("code_hash", hashHex)
        .eq("used", false)
        .single();
      
      if (fetchError || !codeData) {
        toast.error("Ungültiger oder bereits verwendeter Backup-Code");
        return false;
      }
      
      // Mark as used
      const { error: updateError } = await supabase
        .from("mfa_backup_codes")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("id", codeData.id);
      
      if (updateError) throw updateError;
      
      await fetchBackupCodesCount();
      return true;
    } catch (error: any) {
      console.error("Error verifying backup code:", error);
      toast.error("Fehler bei der Backup-Code-Verifizierung");
      return false;
    }
  }, [user, fetchBackupCodesCount]);

  // Check if MFA challenge is required
  const getAssuranceLevel = useCallback(async (): Promise<{
    currentLevel: "aal1" | "aal2";
    nextLevel: "aal1" | "aal2" | null;
  }> => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      console.error("Error getting assurance level:", error);
      return { currentLevel: "aal1", nextLevel: null };
    }
    return {
      currentLevel: data.currentLevel as "aal1" | "aal2",
      nextLevel: data.nextLevel as "aal1" | "aal2" | null,
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchFactors();
      fetchBackupCodesCount();
    }
  }, [user, fetchFactors, fetchBackupCodesCount]);

  return {
    factors,
    hasMFA,
    backupCodesCount,
    isLoading,
    isEnrolling,
    isVerifying,
    enrollmentData,
    enrollTOTP,
    verifyEnrollment,
    challengeAndVerify,
    unenrollTOTP,
    generateBackupCodes,
    verifyBackupCode,
    getAssuranceLevel,
    fetchFactors,
    cancelEnrollment: () => setEnrollmentData(null),
  };
}
