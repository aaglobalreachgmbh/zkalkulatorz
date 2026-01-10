/**
 * Rendert eine Checkliste zum Ausfüllen
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Upload } from "lucide-react";
import type { VisitChecklist, ChecklistResponse, ChecklistItem } from "@/hooks/useVisitChecklists";
import { cn } from "@/lib/utils";

interface ChecklistRendererProps {
  checklist: VisitChecklist;
  responses: ChecklistResponse;
  onChange: (responses: ChecklistResponse) => void;
  readOnly?: boolean;
}

export function ChecklistRenderer({
  checklist,
  responses,
  onChange,
  readOnly = false,
}: ChecklistRendererProps) {
  const handleChange = (itemId: string, value: unknown) => {
    onChange({
      ...responses,
      [itemId]: value as ChecklistResponse[string],
    });
  };

  return (
    <div className="space-y-4">
      {checklist.items.map((item) => (
        <ChecklistItemRenderer
          key={item.id}
          item={item}
          value={responses[item.id]}
          onChange={(value) => handleChange(item.id, value)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

interface ChecklistItemRendererProps {
  item: ChecklistItem;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
}

function ChecklistItemRenderer({
  item,
  value,
  onChange,
  readOnly,
}: ChecklistItemRendererProps) {
  switch (item.type) {
    case "checkbox":
      return (
        <div className="flex items-start gap-3">
          <Checkbox
            id={item.id}
            checked={!!value}
            onCheckedChange={onChange}
            disabled={readOnly}
          />
          <Label
            htmlFor={item.id}
            className={cn(
              "text-sm cursor-pointer leading-relaxed",
              value && "line-through text-muted-foreground"
            )}
          >
            {item.label}
            {item.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      );

    case "text":
      return (
        <div className="space-y-2">
          <Label htmlFor={item.id} className="text-sm">
            {item.label}
            {item.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={item.id}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={item.placeholder || ""}
            disabled={readOnly}
            rows={3}
          />
        </div>
      );

    case "rating":
      return (
        <div className="space-y-2">
          <Label className="text-sm">
            {item.label}
            {item.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => !readOnly && onChange(star)}
                disabled={readOnly}
                className={cn(
                  "p-1 rounded transition-colors",
                  !readOnly && "hover:bg-muted",
                  readOnly && "cursor-default"
                )}
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    (value as number) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={item.id} className="text-sm">
            {item.label}
            {item.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={(value as string) || ""}
            onValueChange={onChange}
            disabled={readOnly}
          >
            <SelectTrigger id={item.id}>
              <SelectValue placeholder="Bitte wählen..." />
            </SelectTrigger>
            <SelectContent>
              {item.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "upload":
      return (
        <div className="space-y-2">
          <Label htmlFor={item.id} className="text-sm">
            {item.label}
            {item.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {value ? (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <span className="text-sm truncate flex-1">
                {typeof value === "string" ? value : "Datei hochgeladen"}
              </span>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(null)}
                >
                  Entfernen
                </Button>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={readOnly}
              onClick={() => {
                // File upload would be handled here
                // For now, just mark as "pending upload"
                onChange("pending_upload");
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Datei auswählen
            </Button>
          )}
        </div>
      );

    default:
      return null;
  }
}
