// ============================================
// Add Widget Panel for Dashboard Editing
// ============================================

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_WIDGETS,
  WIDGET_CATEGORIES,
  WidgetCategory,
  WidgetDefinition,
  WidgetLayout,
  getWidgetsByCategory,
} from "@/margenkalkulator/config/dashboardWidgets";

interface AddWidgetPanelProps {
  currentLayout: WidgetLayout[];
  onAddWidget: (widgetId: string) => void;
}

export function AddWidgetPanel({ currentLayout, onAddWidget }: AddWidgetPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | "all">("all");

  const widgetsByCategory = getWidgetsByCategory();
  
  // Get widgets that are hidden or not in layout
  const availableWidgets = Object.values(DASHBOARD_WIDGETS).filter(widget => {
    const inLayout = currentLayout.find(item => item.id === widget.id);
    return !inLayout || !inLayout.visible;
  });

  const filteredWidgets = selectedCategory === "all"
    ? availableWidgets
    : availableWidgets.filter(w => w.category === selectedCategory);

  const handleAddWidget = (widgetId: string) => {
    onAddWidget(widgetId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={cn(
          "border-2 border-dashed border-muted-foreground/30 rounded-lg",
          "flex items-center justify-center p-8",
          "cursor-pointer hover:border-primary/50 hover:bg-accent/50",
          "transition-colors duration-200"
        )}>
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Widget hinzufügen</span>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Widget hinzufügen
          </DialogTitle>
          <DialogDescription>
            Wählen Sie ein Widget aus, um es zu Ihrem Dashboard hinzuzufügen.
          </DialogDescription>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            Alle
          </Button>
          {Object.entries(WIDGET_CATEGORIES).map(([key, { name, icon: Icon }]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key as WidgetCategory)}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {name}
            </Button>
          ))}
        </div>

        {/* Widget Grid */}
        <ScrollArea className="h-[400px] pr-4">
          {filteredWidgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p className="text-sm">Alle Widgets sind bereits aktiv</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredWidgets.map((widget) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  onAdd={() => handleAddWidget(widget.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface WidgetCardProps {
  widget: WidgetDefinition;
  onAdd: () => void;
}

function WidgetCard({ widget, onAdd }: WidgetCardProps) {
  const Icon = widget.icon;
  const categoryInfo = WIDGET_CATEGORIES[widget.category];

  return (
    <button
      onClick={onAdd}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        "text-left transition-all duration-200",
        "hover:border-primary hover:bg-accent/50 hover:shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
    >
      <div className={cn(
        "p-2 rounded-md bg-primary/10 text-primary shrink-0"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{widget.name}</span>
          {widget.isNew && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              Neu
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {widget.description}
        </p>
        <div className="flex items-center gap-1 mt-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {categoryInfo.name}
          </Badge>
        </div>
      </div>
    </button>
  );
}
