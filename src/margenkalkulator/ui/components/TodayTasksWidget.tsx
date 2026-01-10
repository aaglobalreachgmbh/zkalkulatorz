// ============================================
// Today Tasks Widget - Ersetzt DailyDeltaWidget
// Zeigt echte Aufgaben: VVL-Erinnerungen, Follow-ups
// ============================================

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Phone,
  FileText,
  Calendar,
  ChevronRight,
  ListTodo
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          title: `VVL: ${contract.tarif_name || "Vertrag"}`,
          subtitle: contract.handy_nr || undefined,
          urgency: daysUntil < 7 ? "critical" : daysUntil < 14 ? "soon" : "normal",
          dueDate: `${daysUntil} Tage`,
          href: `/contracts?highlight=${contract.id}`,
          icon: Phone,
        });
      });
    }

    // Add pending offers that might need follow-up (offen or gesendet status)
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
            title: `Follow-up: ${offer.name}`,
            subtitle: offer.customer_id ? "Kunde kontaktieren" : undefined,
            urgency: daysSinceCreated > 7 ? "critical" : "normal",
            dueDate: `${daysSinceCreated}d offen`,
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

  // Don't render if no tasks
  if (totalOpen === 0) {
    return (
      <Card className="max-w-5xl mx-auto w-full mb-6 animate-fade-in border-success/30 bg-success/5">
        <CardContent className="py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-success">Alles erledigt!</p>
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
    <Card className="max-w-5xl mx-auto w-full mb-6 animate-fade-in">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              criticalCount > 0 ? "bg-destructive/10" : "bg-primary/10"
            )}>
              <ListTodo className={cn(
                "w-5 h-5",
                criticalCount > 0 ? "text-destructive" : "text-primary"
              )} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Heute zu erledigen
                <Badge 
                  variant={criticalCount > 0 ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {totalOpen} offen
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {criticalCount > 0 
                  ? `${criticalCount} kritische Aufgaben`
                  : "Anstehende Aufgaben"
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/contracts")}
            className="text-muted-foreground hover:text-foreground"
          >
            Alle anzeigen
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => navigate(task.href)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left group",
                task.urgency === "critical"
                  ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                  : task.urgency === "soon"
                    ? "bg-warning/5 border-warning/20 hover:border-warning/40"
                    : "bg-card border-border hover:border-primary/40"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                task.urgency === "critical"
                  ? "bg-destructive/10"
                  : task.urgency === "soon"
                    ? "bg-warning/10"
                    : "bg-muted"
              )}>
                <task.icon className={cn(
                  "w-4 h-4",
                  task.urgency === "critical"
                    ? "text-destructive"
                    : task.urgency === "soon"
                      ? "text-warning"
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
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  )}
                </div>
                {task.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">
                    {task.subtitle}
                  </p>
                )}
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium flex-shrink-0",
                  task.urgency === "critical"
                    ? "text-destructive"
                    : task.urgency === "soon"
                      ? "text-warning"
                      : "text-muted-foreground"
                )}>
                  <Clock className="w-3 h-3" />
                  {task.dueDate}
                </div>
              )}

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
