// ============================================
// Centralized Error Handling Utilities
// Consistent error messages and retry logic
// ============================================

import { toast } from "sonner";

// Error types with German messages
export const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: "Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.",
  TIMEOUT: "Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.",
  
  // Auth errors
  AUTH_REQUIRED: "Bitte melden Sie sich an, um fortzufahren.",
  SESSION_EXPIRED: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  PERMISSION_DENIED: "Sie haben keine Berechtigung für diese Aktion.",
  
  // CRUD errors
  LOAD_ERROR: "Daten konnten nicht geladen werden.",
  SAVE_ERROR: "Speichern fehlgeschlagen.",
  DELETE_ERROR: "Löschen fehlgeschlagen.",
  UPDATE_ERROR: "Aktualisierung fehlgeschlagen.",
  
  // Validation errors
  VALIDATION_ERROR: "Bitte überprüfen Sie Ihre Eingaben.",
  DUPLICATE_ERROR: "Ein Eintrag mit diesen Daten existiert bereits.",
  
  // Generic
  UNKNOWN_ERROR: "Ein unbekannter Fehler ist aufgetreten.",
};

/**
 * Parse error and return user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;
  
  // Handle Supabase errors
  if (typeof error === "object" && error !== null) {
    const err = error as { message?: string; code?: string; status?: number };
    
    // Check for common Supabase error codes
    if (err.code === "PGRST301" || err.status === 401) {
      return ERROR_MESSAGES.AUTH_REQUIRED;
    }
    if (err.code === "PGRST204" || err.status === 403) {
      return ERROR_MESSAGES.PERMISSION_DENIED;
    }
    if (err.code === "23505") {
      return ERROR_MESSAGES.DUPLICATE_ERROR;
    }
    
    // Return message if available
    if (err.message) {
      // Translate common Supabase messages
      if (err.message.includes("JWT expired")) {
        return ERROR_MESSAGES.SESSION_EXPIRED;
      }
      if (err.message.includes("network") || err.message.includes("fetch")) {
        return ERROR_MESSAGES.NETWORK_ERROR;
      }
      return err.message;
    }
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Show error toast with consistent styling
 */
export function showErrorToast(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const fullMessage = context ? `${context}: ${message}` : message;
  
  toast.error(fullMessage, {
    duration: 5000,
  });
}

/**
 * Show success toast with consistent styling
 */
export function showSuccessToast(message: string): void {
  toast.success(message, {
    duration: 3000,
  });
}

/**
 * Show loading toast that can be updated
 */
export function showLoadingToast(message: string): string | number {
  return toast.loading(message);
}

/**
 * Dismiss a toast by ID
 */
export function dismissToast(toastId: string | number): void {
  toast.dismiss(toastId);
}

/**
 * Execute async function with automatic error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    context?: string;
    successMessage?: string;
    showLoading?: boolean;
    loadingMessage?: string;
  }
): Promise<T | null> {
  let toastId: string | number | undefined;
  
  try {
    if (options?.showLoading) {
      toastId = showLoadingToast(options.loadingMessage || "Laden...");
    }
    
    const result = await fn();
    
    if (toastId) {
      dismissToast(toastId);
    }
    
    if (options?.successMessage) {
      showSuccessToast(options.successMessage);
    }
    
    return result;
  } catch (error) {
    if (toastId) {
      dismissToast(toastId);
    }
    
    showErrorToast(error, options?.context);
    console.error(`[Error] ${options?.context || "Operation failed"}:`, error);
    return null;
  }
}

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        options?.onRetry?.(attempt + 1, error);
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
