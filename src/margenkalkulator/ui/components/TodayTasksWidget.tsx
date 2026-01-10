// ============================================
// Today Tasks Widget - Clean, Modern Design
// Kompakte Aufgabenliste mit klarer Hierarchie
// ============================================

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone,
  FileText,
  ChevronRight,
  CalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVVLCounts, useCustomerContracts } from "@/margenkalkulator/hooks/useCustomerContracts";
import { useCloudOffers } from "@/margenkalkulator/hooks/useCloudOffers";
import { cn } from "@/lib/utils";

interface TaskItem {
  id: string;
  type: "vvl" | "followup" | "offer";
  title: string;
  subtitle?: string;
  urgency: "critical" | "soon" | "normal";
  dueLabel?: string;
  href: string;
  icon: React.ElementType;
}

export function TodayTasksWidget() {
  const navigate = useNavigate();
  const vvlCounts = useVVLCounts();
  const { contracts } = useCustomerContracts();
  const { offers } = useCloudOffers();

  const tasks = useMemo(() => {
    const taskList: TaskItem[] = [];

    // Add critical VVL tasks (< 30 days)
    if (contracts) {
      const criticalContracts = contracts.filter(c => {
        if (!c.vvl_datum) return false;
        const daysUntil = Math.ceil(
          (new Date(c.vvl_datum).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntil >= 0 && daysUntil < 30;
      }).slice(0, 3);

      criticalContracts.forEach(contract => {
        const daysUntil = Math.ceil(
          (new Date(contract.vvl_datum!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        taskList.push({
          id: `vvl-${contract.id}`,
          type: "vvl",
          title: contract.tarif_name || "Vertrag",
          subtitle: contract.handy_nr || undefined,
          urgency: daysUntil < 7 ? "critical" : daysUntil < 14 ? "soon" : "normal",
          dueLabel: daysUntil === 0 ? "Heute" : daysUntil === 1 ? "Morgen" : `${daysUntil} Tage`,
          href: `/contracts?highlight=${contract.id}`,
          icon: Phone,
        });
      });
    }

    // Add pending offers that might need follow-up
    if (offers) {
      const pendingOffers = offers
        .filter(o => o.status === "offen" || o.status === "gesendet")
        .slice(0, 2);

      pendingOffers.forEach(offer => {
        const daysSinceCreated = Math.floor(
          (new Date().getTime() - new Date(offer.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceCreated >= 3) {
          taskList.push({
            id: `followup-${offer.id}`,
            type: "followup",
            title: offer.name,
            subtitle: "Nachfassen empfohlen",
            urgency: daysSinceCreated > 7 ? "critical" : "normal",
            dueLabel: `${daysSinceCreated}d offen`,
            href: `/offers?id=${offer.id}`,
            icon: FileText,
          });
        }
      });
    }

    // Sort by urgency
    return taskList.sort((a, b) => {
      const urgencyOrder = { critical: 0, soon: 1, normal: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }).slice(0, 4);
  }, [contracts, offers]);

  const totalOpen = tasks.length;
  const criticalCount = tasks.filter(t => t.urgency === "critical").length;

  // Don't render if no tasks
  if (totalOpen === 0) {
    return (
      <div className="max-w-5xl mx-auto w-full mb-6 animate-fade-in">
        <div className="bg-success/5 border border-success/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Alles erledigt!</p>
              <p className="text-xs text-muted-foreground">
                Keine dringenden Aufgaben
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full mb-6 animate-fade-in">
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              criticalCount > 0 ? "bg-destructive/10" : "bg-amber-500/10"
            )}>
              <CalendarClock className={cn(
                "w-5 h-5",
                criticalCount > 0 ? "text-destructive" : "text-amber-500"
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                Anstehende Aufgaben
              </h3>
              <p className="text-xs text-muted-foreground">
                {criticalCount > 0 
                  ? `${criticalCount} kritisch · ${totalOpen} gesamt`
                  : `${totalOpen} offen`
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/contracts")}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
          >
            Alle
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </div>

        {/* Task List */}
        <div className="divide-y divide-border/30">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => navigate(task.href)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left group"
            >
              {/* Status Dot */}
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                task.urgency === "critical"
                  ? "bg-destructive"
                  : task.urgency === "soon"
                    ? "bg-amber-500"
                    : "bg-muted-foreground/50"
              )} />

              {/* Icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                task.urgency === "critical"
                  ? "bg-destructive/10"
                  : task.urgency === "soon"
                    ? "bg-amber-500/10"
                    : "bg-muted/50"
              )}>
                <task.icon className={cn(
                  "w-4 h-4",
                  task.urgency === "critical"
                    ? "text-destructive"
                    : task.urgency === "soon"
                      ? "text-amber-500"
                      : "text-muted-foreground"
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground truncate">
                    {task.title}
                  </span>
                  {task.urgency === "critical" && (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  )}
                </div>
                {task.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">
                    {task.subtitle}
                  </p>
                )}
              </div>

              {/* Due Label */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className={cn(
                  "text-xs font-medium",
                  task.urgency === "critical" 
                    ? "text-destructive" 
                    : task.urgency === "soon"
                      ? "text-amber-600"
                      : "text-muted-foreground"
                )}>
                  {task.dueLabel}
                </span>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
