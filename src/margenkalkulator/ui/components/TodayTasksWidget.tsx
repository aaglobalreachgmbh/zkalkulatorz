// ============================================
// Today Tasks Widget - Sales Cockpit Style
// Elegantes Karten-Layout mit farbigen Badges
// ============================================

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Phone,
  FileText,
  ChevronRight,
  ListTodo,
  ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  dueDate?: string;
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
          dueDate: `${daysUntil} Tage`,
          dueLabel: daysUntil === 0 ? "Heute" : daysUntil === 1 ? "Morgen" : `In ${daysUntil} Tagen`,
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
            subtitle: "Kunde kontaktieren",
            urgency: daysSinceCreated > 7 ? "critical" : "normal",
            dueDate: `${daysSinceCreated}d`,
            dueLabel: `Seit ${daysSinceCreated} Tagen offen`,
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
    }).slice(0, 5);
  }, [contracts, offers]);

  const totalOpen = tasks.length;
  const criticalCount = tasks.filter(t => t.urgency === "critical").length;

  // Badge styling based on type
  const getBadgeStyles = (type: TaskItem["type"], urgency: TaskItem["urgency"]) => {
    if (urgency === "critical") {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    switch (type) {
      case "vvl":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "followup":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getBadgeLabel = (type: TaskItem["type"], urgency: TaskItem["urgency"]) => {
    if (urgency === "critical") return "KRITISCH";
    switch (type) {
      case "vvl":
        return "VVL";
      case "followup":
        return "FOLLOW-UP";
      default:
        return "AUFGABE";
    }
  };

  // Don't render if no tasks
  if (totalOpen === 0) {
    return (
      <Card className="relative overflow-hidden border-0 bg-success/5 max-w-5xl mx-auto w-full mb-6 animate-fade-in">
        {/* Left Accent Border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
        
        <CardContent className="py-5 px-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="font-semibold text-success text-lg">Alles erledigt!</p>
              <p className="text-sm text-muted-foreground">
                Keine dringenden Aufgaben für heute
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 bg-card max-w-5xl mx-auto w-full mb-6 animate-fade-in shadow-md">
      {/* Left Accent Border */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1.5",
        criticalCount > 0 ? "bg-destructive" : "bg-primary"
      )} />
      
      <CardContent className="py-5 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              criticalCount > 0 ? "bg-destructive/10" : "bg-primary/10"
            )}>
              <ListTodo className={cn(
                "w-6 h-6",
                criticalCount > 0 ? "text-destructive" : "text-primary"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-foreground">
                  Heute zu erledigen
                </h3>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border",
                  criticalCount > 0 
                    ? "bg-destructive/10 text-destructive border-destructive/20" 
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {totalOpen} offen
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {criticalCount > 0 
                  ? `${criticalCount} kritische Aufgabe${criticalCount > 1 ? "n" : ""}`
                  : "Anstehende Aufgaben"
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/contracts")}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            Alle anzeigen
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Task Cards */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => navigate(task.href)}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left group",
                task.urgency === "critical"
                  ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40 hover:shadow-md"
                  : task.urgency === "soon"
                    ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 hover:shadow-md"
                    : "bg-muted/30 border-border hover:border-primary/40 hover:shadow-md"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                task.urgency === "critical"
                  ? "bg-destructive/10"
                  : task.urgency === "soon"
                    ? "bg-amber-500/10"
                    : "bg-muted"
              )}>
                <task.icon className={cn(
                  "w-5 h-5",
                  task.urgency === "critical"
                    ? "text-destructive"
                    : task.urgency === "soon"
                      ? "text-amber-500"
                      : "text-muted-foreground"
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Badge & Time Row */}
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                    getBadgeStyles(task.type, task.urgency)
                  )}>
                    {getBadgeLabel(task.type, task.urgency)}
                  </span>
                  <span className={cn(
                    "text-xs font-medium flex items-center gap-1",
                    task.urgency === "critical" 
                      ? "text-destructive" 
                      : task.urgency === "soon"
                        ? "text-amber-600"
                        : "text-muted-foreground"
                  )}>
                    <Clock className="w-3 h-3" />
                    {task.dueLabel}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                  {task.title}
                  {task.urgency === "critical" && (
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                  )}
                </h4>

                {/* Subtitle */}
                {task.subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {task.subtitle}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <div className="flex items-center self-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
