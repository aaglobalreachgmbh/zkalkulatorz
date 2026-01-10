/**
 * Canvas-Stil Editor für Checklisten
 * Drag-and-Drop zum Sortieren der Items
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  CheckSquare,
  Type,
  Upload,
  Star,
  List,
  X,
  Save,
} from "lucide-react";
import { useVisitChecklists, type ChecklistItem, type ChecklistItemType } from "@/hooks/useVisitChecklists";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChecklistEditorProps {
  checklistId?: string;
  onSave?: (name: string, items: ChecklistItem[]) => void;
  onCancel?: () => void;
}

const ITEM_TYPE_CONFIG: Record<
  ChecklistItemType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  checkbox: { label: "Checkbox", icon: <CheckSquare className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
  text: { label: "Textfeld", icon: <Type className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  upload: { label: "Upload", icon: <Upload className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  rating: { label: "Bewertung", icon: <Star className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-700" },
  select: { label: "Auswahl", icon: <List className="h-4 w-4" />, color: "bg-orange-100 text-orange-700" },
};

export function ChecklistEditor({ checklistId, onSave, onCancel }: ChecklistEditorProps) {
  const { useChecklist, createNewItem } = useVisitChecklists();
  const { data: existingChecklist } = useChecklist(checklistId);

  const [name, setName] = useState(existingChecklist?.name || "");
  const [description, setDescription] = useState(existingChecklist?.description || "");
  const [items, setItems] = useState<ChecklistItem[]>(existingChecklist?.items || []);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddItem = (type: ChecklistItemType) => {
    const newItem = createNewItem(type);
    setItems([...items, newItem]);
    setEditingItem(newItem);
  };

  const handleUpdateItem = (updatedItem: ChecklistItem) => {
    setItems(items.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    if (items.length === 0) {
      toast.error("Fügen Sie mindestens ein Element hinzu");
      return;
    }

    // Check all items have labels
    const missingLabels = items.filter((i) => !i.label.trim());
    if (missingLabels.length > 0) {
      toast.error("Alle Elemente benötigen eine Beschriftung");
      return;
    }

    onSave?.(name, items);
  };

  return (
    <div className="space-y-6">
      {/* Name & Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Checklisten-Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Neukundenberatung"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionale Beschreibung..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Item Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elemente hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ITEM_TYPE_CONFIG).map(([type, config]) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => handleAddItem(type as ChecklistItemType)}
                className="gap-2"
              >
                {config.icon}
                {config.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Elemente ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Noch keine Elemente. Fügen Sie oben Elemente hinzu.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onEdit={() => setEditingItem(item)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Abbrechen
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setIsPreviewOpen(true)}
          disabled={items.length === 0}
        >
          Vorschau
        </Button>
        <Button onClick={handleSave} className="flex-1 gap-2">
          <Save className="h-4 w-4" />
          Speichern
        </Button>
      </div>

      {/* Edit Item Dialog */}
      <ItemEditDialog
        item={editingItem}
        onSave={handleUpdateItem}
        onClose={() => setEditingItem(null)}
      />

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vorschau: {name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {items.map((item) => (
              <div key={item.id} className="text-sm">
                <span className="font-medium">{item.label}</span>
                {item.required && <span className="text-destructive ml-1">*</span>}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {ITEM_TYPE_CONFIG[item.type].label}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sortable Item Component
interface SortableItemProps {
  item: ChecklistItem;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableItem({ item, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = ITEM_TYPE_CONFIG[item.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 bg-muted/50 rounded-lg border",
        isDragging && "opacity-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <Badge variant="secondary" className={cn("gap-1", config.color)}>
        {config.icon}
        {config.label}
      </Badge>

      <span className="flex-1 truncate">
        {item.label || <span className="italic text-muted-foreground">Ohne Beschriftung</span>}
      </span>

      {item.required && (
        <Badge variant="outline" className="text-xs">
          Pflicht
        </Badge>
      )}

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Item Edit Dialog
interface ItemEditDialogProps {
  item: ChecklistItem | null;
  onSave: (item: ChecklistItem) => void;
  onClose: () => void;
}

function ItemEditDialog({ item, onSave, onClose }: ItemEditDialogProps) {
  const [editedItem, setEditedItem] = useState<ChecklistItem | null>(null);

  // Update state when item changes
  useState(() => {
    if (item) {
      setEditedItem({ ...item });
    }
  });

  if (!item) return null;

  const handleSave = () => {
    if (editedItem) {
      onSave(editedItem);
    }
    onClose();
  };

  const currentItem = editedItem || item;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Element bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-label">Beschriftung *</Label>
            <Input
              id="item-label"
              value={currentItem.label}
              onChange={(e) =>
                setEditedItem({ ...currentItem, label: e.target.value })
              }
              placeholder="z.B. Produktdemo durchgeführt"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="item-required"
              checked={currentItem.required || false}
              onCheckedChange={(checked) =>
                setEditedItem({ ...currentItem, required: checked })
              }
            />
            <Label htmlFor="item-required">Pflichtfeld</Label>
          </div>

          {currentItem.type === "text" && (
            <div className="space-y-2">
              <Label htmlFor="item-placeholder">Platzhalter</Label>
              <Input
                id="item-placeholder"
                value={currentItem.placeholder || ""}
                onChange={(e) =>
                  setEditedItem({ ...currentItem, placeholder: e.target.value })
                }
                placeholder="Platzhaltertext..."
              />
            </div>
          )}

          {currentItem.type === "select" && (
            <div className="space-y-2">
              <Label>Optionen (eine pro Zeile)</Label>
              <Textarea
                value={(currentItem.options || []).join("\n")}
                onChange={(e) =>
                  setEditedItem({
                    ...currentItem,
                    options: e.target.value.split("\n").filter((o) => o.trim()),
                  })
                }
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
