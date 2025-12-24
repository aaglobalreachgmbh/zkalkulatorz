import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { OfferOptionState, CalculationResult } from "@/margenkalkulator/engine/types";

interface AiConsultantProps {
  config: OfferOptionState;
  result: CalculationResult;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiConsultant({ config, result }: AiConsultantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hallo! Ich bin dein AI Margen-Berater. Ich analysiere dein aktuelles Angebot und helfe dir bei der Optimierung. Frag mich z.B.: \"Wie kann ich die Marge verbessern?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke("ai-consultant", {
        body: {
          message: userMessage,
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
        throw new Error(response.error.message);
      }

      const aiResponse = response.data?.response || "Es ist ein Fehler aufgetreten.";
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error) {
      console.error("AI Consultant error:", error);
      let errorMessage = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
      
      if (error instanceof Error) {
        if (error.message.includes("429")) {
          errorMessage = "Zu viele Anfragen. Bitte warte einen Moment.";
        } else if (error.message.includes("402")) {
          errorMessage = "AI-Guthaben aufgebraucht. Bitte lade dein Konto auf.";
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

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-24 right-4 md:right-8 z-40 
          p-4 rounded-full shadow-elevated
          bg-gradient-to-r from-primary to-purple-600 text-primary-foreground
          transition-all duration-300 hover:scale-110 
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
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-purple-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Margen-Berater</h3>
              <p className="text-xs text-muted-foreground">Powered by Gemini</p>
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-purple-600/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 px-4 py-3 rounded-2xl rounded-bl-md bg-muted">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analysiere...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50 bg-card/50">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Frage z.B.: 'Wie kann ich die Marge verbessern?'"
              disabled={isLoading}
              className="
                w-full pl-4 pr-12 py-3
                bg-background border border-border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                text-sm text-foreground placeholder:text-muted-foreground
                disabled:opacity-50
                transition-all
              "
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 rounded-lg w-8 h-8"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Gemini 2.5 Flash • Margen-Optimierung
          </p>
        </div>
      </div>
    </>
  );
}
