/**
 * Benachrichtigungs-Einstellungen Komponente
 */

import { useState } from "react";
import {
  Mail,
  Calendar,
  Bell,
  Clock,
  AlertCircle,
  RefreshCw,
  MapPin,
  CalendarDays,
  Check,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotificationPreferences, NotificationTypes } from "@/hooks/useNotificationPreferences";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const REMINDER_OPTIONS = [
  { value: "5", label: "5 Minuten" },
  { value: "15", label: "15 Minuten" },
  { value: "30", label: "30 Minuten" },
  { value: "60", label: "1 Stunde" },
  { value: "1440", label: "1 Tag" },
];

const NOTIFICATION_TYPE_LABELS: Record<keyof NotificationTypes, { label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  visit_reminder: {
    label: "Besuchserinnerungen",
    description: "Erinnerung vor geplanten Kundenbesuchen",
    icon: MapPin,
  },
  visit_overdue: {
    label: "Überfällige Berichte",
    description: "Warnung bei ausstehenden Besuchsberichten",
    icon: AlertCircle,
  },
  sync_pending: {
    label: "Ausstehende Sync",
    description: "Hinweis bei nicht synchronisierten Daten (> 24h)",
    icon: RefreshCw,
  },
  sync_failed: {
    label: "Sync-Fehler",
    description: "Benachrichtigung bei fehlgeschlagener Synchronisation",
    icon: AlertCircle,
  },
  appointment_reminder: {
    label: "Terminerinnerungen",
    description: "Erinnerung vor Kalenderterminen",
    icon: CalendarDays,
  },
  vvl_reminder: {
    label: "VVL-Erinnerungen",
    description: "Erinnerung 7 Tage vor Vertragsverlängerung",
    icon: Clock,
  },
};

export function NotificationSettings() {
  const { 
    preferences, 
    isLoading, 
    updatePreferences, 
    toggleNotificationType,
    isUpdating 
  } = useNotificationPreferences();
  
  const [copied, setCopied] = useState(false);

  const handleCopyCalendarLink = async () => {
    // Placeholder for future calendar subscription link
    const link = `${window.location.origin}/api/calendar/subscribe`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Benachrichtigungen
        </CardTitle>
        <CardDescription>
          Konfigurieren Sie, wie und wann Sie benachrichtigt werden möchten.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* E-Mail Einstellungen */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            E-Mail-Benachrichtigungen
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>E-Mail aktiviert</Label>
              <p className="text-sm text-muted-foreground">
                Erhalten Sie wichtige Benachrichtigungen per E-Mail
              </p>
            </div>
            <Switch
              checked={preferences?.email_enabled ?? true}
              onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
              disabled={isUpdating}
            />
          </div>
        </div>

        <Separator />

        {/* Erinnerungs-Timing */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Erinnerungs-Timing
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Erinnerung vor Termin</Label>
              <p className="text-sm text-muted-foreground">
                Wie früh sollen Sie erinnert werden?
              </p>
            </div>
            <Select
              value={String(preferences?.reminder_before_minutes ?? 15)}
              onValueChange={(value) => updatePreferences({ reminder_before_minutes: parseInt(value) })}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Benachrichtigungstypen */}
        <div className="space-y-4">
          <h4 className="font-medium">Benachrichtigungstypen</h4>
          
          <div className="space-y-3">
            {(Object.entries(NOTIFICATION_TYPE_LABELS) as Array<[keyof NotificationTypes, typeof NOTIFICATION_TYPE_LABELS[keyof NotificationTypes]]>).map(
              ([key, { label, description, icon: Icon }]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{label}</Label>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notification_types?.[key] ?? true}
                    onCheckedChange={() => toggleNotificationType(key)}
                    disabled={isUpdating || !preferences?.email_enabled}
                  />
                </div>
              )
            )}
          </div>
        </div>

        <Separator />

        {/* Kalender-Integration */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Kalender-Integration
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Kalender-Sync aktiviert</Label>
              <p className="text-sm text-muted-foreground">
                Exportieren Sie Termine als .ics Dateien
              </p>
            </div>
            <Switch
              checked={preferences?.calendar_sync_enabled ?? false}
              onCheckedChange={(checked) => updatePreferences({ calendar_sync_enabled: checked })}
              disabled={isUpdating}
            />
          </div>
          
          {preferences?.calendar_sync_enabled && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">
                Kopieren Sie den Link, um Termine in Ihrem Kalender zu abonnieren:
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyCalendarLink}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Kalender-Abo-Link kopieren
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationSettings;
