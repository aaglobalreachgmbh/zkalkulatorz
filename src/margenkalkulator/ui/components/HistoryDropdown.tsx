// ============================================
// History Dropdown Component
// Quick access to last 10 configurations
// ============================================

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, Clock } from "lucide-react";
import type { OfferOptionState } from "../../engine/types";
import type { HistoryEntry } from "../../storage/types";
import { loadHistory, clearHistory } from "../../storage/history";
import { useToast } from "@/hooks/use-toast";

interface HistoryDropdownProps {
  onLoadHistory: (config: OfferOptionState) => void;
}

export function HistoryDropdown({ onLoadHistory }: HistoryDropdownProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  
  // Refresh history when dropdown opens
  useEffect(() => {
    if (open) {
      setHistory(loadHistory());
    }
  }, [open]);
  
  const handleLoad = (entry: HistoryEntry) => {
    onLoadHistory(entry.config);
    toast({
      title: "Verlauf geladen",
      description: entry.summary,
    });
    setOpen(false);
  };
  
  const handleClear = () => {
    clearHistory();
    setHistory([]);
    toast({
      title: "Verlauf gelöscht",
    });
  };
  
  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return "Gerade eben";
    if (minutes < 60) return `vor ${minutes} Min.`;
    if (hours < 24) return `vor ${hours} Std.`;
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <History className="w-4 h-4" />
          {history.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
              {history.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-popover">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Verlauf</span>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleClear}
            >
              Löschen
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {history.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Kein Verlauf vorhanden
          </div>
        ) : (
          history.map((entry) => (
            <DropdownMenuItem
              key={entry.id}
              onClick={() => handleLoad(entry)}
              className="flex flex-col items-start gap-1 cursor-pointer"
            >
              <span className="font-medium text-foreground truncate max-w-full">
                {entry.summary}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTime(entry.timestamp)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
