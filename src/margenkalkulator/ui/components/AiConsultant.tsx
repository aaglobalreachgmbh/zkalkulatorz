import { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, Send, X, Bot, User, Loader2, ShieldAlert, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecureInput } from "@/components/ui/secure-input";
import { supabase } from "@/integrations/supabase/client";
import type { OfferOptionState, CalculationResult } from "@/margenkalkulator/engine/types";
import { createRateLimiter, logSecurityEvent } from "@/lib/securityUtils";

// LLM Security Layer imports
import {
  checkPromptInjection,
  sanitizeLlmInput,
  checkLlmOutput,
  filterLlmOutput,
  logLlmSecurityEvent,
} from "@/lib/llmSecurityLayer";

// Zero Defense Layer imports
import zeroDefenseLayer from "@/lib/zeroDefenseLayer";

interface AiConsultantProps {
  config: OfferOptionState;
  result: CalculationResult;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * AI Consultant Component with Zero-Trust Security Integration
 * 
 * Security Layers:
 * 1. Client-side rate limiting
 * 2. Zero Defense Layer (anomaly detection)
 * 3. LLM Security Layer (prompt injection detection)
 * 4. Input sanitization
 * 5. Output filtering
 */
export function AiConsultant({ config, result }: AiConsultantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hallo! Ich bin dein AI Margen-Berater mit **Thinking Mode**. Ich analysiere dein Angebot tiefgehend und zeige dir Optimierungspotenziale. Frag mich z.B.: \"Wie maximiere ich meine Marge bei diesem Angebot?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [securityBlocked, setSecurityBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rate limiter: 5 requests per minute (client-side)
  const rateLimiter = useMemo(() => createRateLimiter(5, 60 * 1000), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Reset rate limit indicator after delay
  useEffect(() => {
    if (isRateLimited) {
      const timeout = setTimeout(() => setIsRateLimited(false), 60000);
      return () => clearTimeout(timeout);
    }
  }, [isRateLimited]);

  // Reset security block after delay
  useEffect(() => {
    if (securityBlocked) {
      const timeout = setTimeout(() => setSecurityBlocked(false), 30000);
      return () => clearTimeout(timeout);
    }
  }, [securityBlocked]);

  const handleSend = async () => {
    const trimmed = input.trim();

    // Client-side validation
    if (!trimmed || isLoading) return;

    // =========================================================================
    // SECURITY LAYER 1: Check session quarantine status
    // =========================================================================
    const quarantineStatus = zeroDefenseLayer.isSessionQuarantined();
    if (quarantineStatus.quarantined) {
      setSecurityBlocked(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Deine Sitzung wurde aus Sicherheitsgründen temporär eingeschränkt. Bitte warte einen Moment.",
        },
      ]);
      console.warn("[Security] Session quarantined:", quarantineStatus.reason);
      return;
    }

    // =========================================================================
    // SECURITY LAYER 2: Client-side rate limiting
    // =========================================================================
    if (!rateLimiter.canMakeRequest()) {
      setIsRateLimited(true);
      const retryAfter = Math.ceil(rateLimiter.getRetryAfterMs() / 1000);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Zu viele Anfragen. Bitte warte ${retryAfter} Sekunden.`,
        },
      ]);
      logSecurityEvent("rate_limited", { category: "ai", severity: "warn" });
      return;
    }

    // =========================================================================
    // SECURITY LAYER 3: Zero Defense Layer - Behavioral anomaly detection
    // =========================================================================
    const anomalyResult = zeroDefenseLayer.analyzeAction("ai_chat", trimmed);
    
    if (anomalyResult.recommendation === "hard_block") {
      setSecurityBlocked(true);
      zeroDefenseLayer.quarantineSession("Critical anomaly detected in AI chat");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ungewöhnliches Verhalten erkannt. Anfrage blockiert.",
        },
      ]);
      console.warn("[Security] Anomaly hard block:", {
        score: anomalyResult.score,
        level: anomalyResult.level,
        factors: anomalyResult.factors.map((f) => f.name),
      });
      setInput("");
      return;
    }

    if (anomalyResult.recommendation === "soft_block") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Bitte verlangsame deine Anfragen etwas.",
        },
      ]);
      console.warn("[Security] Anomaly soft block:", {
        score: anomalyResult.score,
        level: anomalyResult.level,
      });
      return;
    }

    // =========================================================================
    // SECURITY LAYER 4: LLM Security - Prompt Injection Detection
    // =========================================================================
    const injectionCheck = checkPromptInjection(trimmed);
    
    if (!injectionCheck.safe) {
      logLlmSecurityEvent("injection_detected", {
        threats: injectionCheck.threats,
        riskLevel: injectionCheck.riskLevel,
      });

      // Critical/High risk: Block entirely
      if (injectionCheck.riskLevel === "critical" || injectionCheck.riskLevel === "high") {
        setSecurityBlocked(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Deine Nachricht enthält ungültige Muster und kann nicht verarbeitet werden.",
          },
        ]);
        setInput("");
        return;
      }

      // Medium risk: Warn but continue with sanitized input
      if (injectionCheck.riskLevel === "medium") {
        console.warn("[Security] Injection warning:", injectionCheck.threats);
      }
    }

    // =========================================================================
    // SECURITY LAYER 5: Input Sanitization
    // =========================================================================
    const sanitized = sanitizeLlmInput(trimmed, 1000);

    if (sanitized.length === 0) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Nachricht darf nicht leer sein." },
      ]);
      return;
    }

    if (sanitized.length > 1000) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Nachricht zu lang (max. 1000 Zeichen)." },
      ]);
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: sanitized }]);
    setIsLoading(true);

    try {
      // =========================================================================
      // API CALL: Edge Function handles server-side security
      // =========================================================================
      const response = await supabase.functions.invoke("ai-consultant", {
        body: {
          message: sanitized,
          config: {
            hardware: config.hardware,
            mobile: config.mobile,
            fixedNet: config.fixedNet,
          },
          result: {
            totals: result.totals,
            dealer: result.dealer,
            gkEligible: result.gkEligible,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Fehler");
      }

      // =========================================================================
      // SECURITY LAYER 6: Output Security Check & Filtering
      // =========================================================================
      let aiResponse = response.data?.response || "Es ist ein Fehler aufgetreten.";
      
      // Check AI output for security issues
      const outputCheck = checkLlmOutput(aiResponse);
      
      if (!outputCheck.safe) {
        logLlmSecurityEvent("output_filtered", {
          threats: outputCheck.threats,
          riskLevel: outputCheck.riskLevel,
        });
        
        // Filter the response to remove sensitive content
        aiResponse = filterLlmOutput(aiResponse);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error) {
      // Generic error logging (no sensitive data)
      let errorMessage = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";

      if (error instanceof Error) {
        if (error.message.includes("429") || error.message.includes("Zu viele")) {
          errorMessage = "Zu viele Anfragen. Bitte warte einen Moment.";
          setIsRateLimited(true);
        } else if (error.message.includes("402")) {
          errorMessage = "AI-Guthaben aufgebraucht.";
        } else if (error.message.includes("401")) {
          errorMessage = "Bitte melde dich erneut an.";
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  // Calculate trust score for UI indicator
  const trustScore = useMemo(() => zeroDefenseLayer.calculateTrustScore(), [messages.length]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-24 right-4 md:right-8 z-40 
          p-4 rounded-full shadow-elevated
          bg-gradient-to-r from-purple-600 via-primary to-pink-500 text-white
          transition-all duration-300 hover:scale-110 hover:shadow-lg
          flex items-center justify-center
          animate-pulse-soft
          ${isOpen ? "opacity-0 pointer-events-none scale-0" : "opacity-100"}
        `}
        aria-label="AI Margen-Berater öffnen"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      <div
        className={`
          fixed bottom-4 right-4 md:right-8 z-50
          w-[calc(100%-2rem)] md:w-[420px] max-h-[70vh]
          bg-card/95 backdrop-blur-md border border-border/50
          rounded-2xl shadow-elevated
          flex flex-col overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-purple-600/15 via-primary/10 to-pink-500/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 via-primary to-pink-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Margen-Berater</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Gemini 3 Pro</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 font-medium border border-purple-500/30">
                  Thinking Mode
                </span>
                {/* Security Trust Indicator */}
                <span 
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium flex items-center gap-1 ${
                    trustScore >= 80 
                      ? "bg-green-500/20 text-green-600 border border-green-500/30" 
                      : trustScore >= 50 
                        ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                        : "bg-red-500/20 text-red-600 border border-red-500/30"
                  }`}
                  title={`Vertrauensscore: ${trustScore}%`}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {trustScore}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="rounded-full hover:bg-background/50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Rate Limit Warning */}
        {isRateLimited && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-sm text-amber-600">
            <ShieldAlert className="w-4 h-4" />
            <span>Rate-Limit erreicht. Bitte warte einen Moment.</span>
          </div>
        )}

        {/* Security Block Warning */}
        {securityBlocked && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 flex items-center gap-2 text-sm text-red-600">
            <Shield className="w-4 h-4" />
            <span>Sicherheitsüberprüfung aktiv. Einige Anfragen sind eingeschränkt.</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 animate-fade-in ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                  ${msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gradient-to-r from-primary/20 to-purple-600/20 text-primary"
                  }
                `}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`
                  flex-1 px-4 py-3 rounded-2xl text-sm
                  ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                  }
                `}
              >
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-2" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 px-4 py-3 rounded-2xl rounded-bl-md bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20">
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="animate-pulse">Analysiere Profitabilität & Optionen...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50 bg-card/50">
          <div className="relative flex items-center">
            <SecureInput
              type="text"
              value={input}
              onChange={(e, sanitized) => setInput(sanitized.slice(0, 1000))}
              onKeyDown={handleKeyDown}
              placeholder="Frage z.B.: 'Wie kann ich die Marge verbessern?'"
              disabled={isLoading || isRateLimited || securityBlocked}
              maxLength={1000}
              className="w-full pl-4 pr-12 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50 transition-all"
              onThreatDetected={(threats) => {
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: "Deine Nachricht enthält ungültige Muster." },
                ]);
                setInput("");
              }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isLoading || !input.trim() || isRateLimited || securityBlocked}
              className="absolute right-2 rounded-lg w-8 h-8"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Gemini 3 Pro • Thinking Mode • Zero-Trust Security
          </p>
        </div>
      </div>
    </>
  );
}
