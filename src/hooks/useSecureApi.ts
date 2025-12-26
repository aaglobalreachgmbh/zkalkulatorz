/**
 * useSecureApi Hook
 * 
 * React Hook für sichere API-Aufrufe.
 * Erzwingt die Verwendung des Zero-Trust API Gateway.
 * 
 * ALLE externen API-Calls sollten über diesen Hook laufen.
 */

import { useState, useCallback, useRef } from "react";
import { 
  secureApiCall, 
  validateApiUrl, 
  getRateLimitStatus,
  type ApiCategory,
  type HttpMethod,
  type ApiSecurityResult,
} from "@/lib/secureApiGateway";
import { 
  checkPromptInjection, 
  checkLlmOutput, 
  sanitizeLlmInput,
  filterLlmOutput,
} from "@/lib/llmSecurityLayer";
import { analyzeAction } from "@/lib/zeroDefenseLayer";

// ============================================================================
// TYPES
// ============================================================================

export interface SecureApiOptions {
  category: ApiCategory;
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
  // LLM-specific options
  isLlmRequest?: boolean;
  sanitizeLlmPrompt?: boolean;
  filterLlmResponse?: boolean;
}

export interface SecureApiState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  securityCheck: ApiSecurityResult | null;
}

export interface SecureApiActions<T> {
  execute: (url: string, method: HttpMethod, body?: unknown) => Promise<T | null>;
  reset: () => void;
  validateUrl: (url: string) => ApiSecurityResult;
  getRateLimit: () => { remaining: number; resetsIn: number };
}

// ============================================================================
// HOOK
// ============================================================================

export function useSecureApi<T = unknown>(
  options: SecureApiOptions
): [SecureApiState<T>, SecureApiActions<T>] {
  const [state, setState] = useState<SecureApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
    securityCheck: null,
  });
  
  const optionsRef = useRef(options);
  optionsRef.current = options;
  
  /**
   * Führt einen sicheren API-Call aus
   */
  const execute = useCallback(async (
    url: string,
    method: HttpMethod,
    body?: unknown
  ): Promise<T | null> => {
    const opts = optionsRef.current;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Zero-Day Defense: Analyze action
      const anomalyResult = analyzeAction("api_call", JSON.stringify(body || ""));
      if (anomalyResult.recommendation === "hard_block") {
        throw new Error("Security: Request blocked by anomaly detection");
      }
      
      // Pre-flight security check
      const securityCheck = validateApiUrl(url, opts.category);
      setState(prev => ({ ...prev, securityCheck }));
      
      if (!securityCheck.allowed) {
        throw new Error(`Security: ${securityCheck.reason}`);
      }
      
      // LLM-specific input processing
      let processedBody = body;
      if (opts.isLlmRequest && body && typeof body === "object") {
        const bodyObj = body as Record<string, unknown>;
        
        // Check for prompt injection
        if (bodyObj.messages && Array.isArray(bodyObj.messages)) {
          for (const msg of bodyObj.messages) {
            if (typeof msg === "object" && msg !== null && "content" in msg) {
              const content = (msg as { content: string }).content;
              const injectionCheck = checkPromptInjection(content);
              
              if (!injectionCheck.safe && injectionCheck.riskLevel === "critical") {
                throw new Error(`Security: Prompt injection detected - ${injectionCheck.threats.join(", ")}`);
              }
              
              // Warn but allow for lower risk levels
              if (!injectionCheck.safe) {
                console.warn("[useSecureApi] Potential prompt injection:", injectionCheck.threats);
              }
            }
          }
        }
        
        // Sanitize prompt if enabled
        if (opts.sanitizeLlmPrompt && bodyObj.messages && Array.isArray(bodyObj.messages)) {
          processedBody = {
            ...bodyObj,
            messages: bodyObj.messages.map((msg: unknown) => {
              if (typeof msg === "object" && msg !== null && "content" in msg) {
                const typedMsg = msg as { role: string; content: string };
                return {
                  ...typedMsg,
                  content: typedMsg.role === "user" 
                    ? sanitizeLlmInput(typedMsg.content)
                    : typedMsg.content,
                };
              }
              return msg;
            }),
          };
        }
      }
      
      // Execute secure API call
      const response = await secureApiCall<T>({
        url,
        method,
        body: processedBody,
        category: opts.category,
        timeout: opts.timeout,
        retries: opts.retries,
        validateResponse: opts.validateResponse,
      });
      
      // LLM-specific output processing
      let processedResponse: Awaited<T> = response;
      if (opts.isLlmRequest && opts.filterLlmResponse && response) {
        // Check and filter LLM output
        if (typeof response === "object" && response !== null) {
          const responseObj = response as Record<string, unknown>;
          
          if (responseObj.choices && Array.isArray(responseObj.choices)) {
            const outputCheck = checkLlmOutput(JSON.stringify(responseObj.choices));
            
            if (!outputCheck.safe) {
              console.warn("[useSecureApi] LLM output filtered:", outputCheck.threats);
              
              // Filter the response
              const filteredChoices = responseObj.choices.map((choice: unknown) => {
                if (typeof choice === "object" && choice !== null) {
                  const typedChoice = choice as { message?: { content?: string } };
                  if (typedChoice.message?.content) {
                    return {
                      ...typedChoice,
                      message: {
                        ...typedChoice.message,
                        content: filterLlmOutput(typedChoice.message.content),
                      },
                    };
                  }
                }
                return choice;
              });
              
              processedResponse = {
                ...responseObj,
                choices: filteredChoices,
              } as Awaited<T>;
            }
          }
        }
      }
      
      setState({
        data: processedResponse,
        error: null,
        isLoading: false,
        securityCheck,
      });
      
      return processedResponse;
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        data: null,
        error: err,
        isLoading: false,
      }));
      
      // Log security errors
      if (err.message.startsWith("Security:")) {
        console.error("[useSecureApi] Security error:", err.message);
      }
      
      return null;
    }
  }, []);
  
  /**
   * Setzt den State zurück
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      securityCheck: null,
    });
  }, []);
  
  /**
   * Validiert eine URL ohne Request
   */
  const validateUrl = useCallback((url: string): ApiSecurityResult => {
    return validateApiUrl(url, optionsRef.current.category);
  }, []);
  
  /**
   * Gibt den Rate Limit Status zurück
   */
  const getRateLimit = useCallback(() => {
    return getRateLimitStatus(optionsRef.current.category);
  }, []);
  
  return [
    state,
    { execute, reset, validateUrl, getRateLimit },
  ];
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook für AI/LLM API Calls
 */
export function useSecureLlmApi<T = unknown>() {
  return useSecureApi<T>({
    category: "ai",
    isLlmRequest: true,
    sanitizeLlmPrompt: true,
    filterLlmResponse: true,
    timeout: 60000, // LLM calls can take longer
  });
}

/**
 * Hook für Payment API Calls
 */
export function useSecurePaymentApi<T = unknown>() {
  return useSecureApi<T>({
    category: "payment",
    validateResponse: true,
    timeout: 30000,
  });
}

/**
 * Hook für Data/Supabase API Calls
 */
export function useSecureDataApi<T = unknown>() {
  return useSecureApi<T>({
    category: "data",
    timeout: 15000,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useSecureApi;
