/**
 * Notification Service
 * 
 * Zentrale Verwaltung für E-Mail-Benachrichtigungen, In-App Notifications
 * und Kalender-Exporte.
 */

import { supabase } from "@/integrations/supabase/client";
import { generateICSFile, downloadICSFile, CalendarEvent } from "./calendarExport";

export type NotificationType = 
  | "visit_reminder"
  | "visit_overdue"
  | "sync_pending"
  | "sync_failed"
  | "appointment_reminder"
  | "vvl_reminder";

interface NotificationInput {
  userId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface ScheduledNotificationInput {
  userId: string;
  tenantId: string;
  type: NotificationType;
  scheduledFor: Date;
  relatedId?: string;
  relatedType?: string;
  payload: Record<string, unknown>;
}

interface EmailReminderInput {
  userId: string;
  type: NotificationType;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  data: Record<string, unknown>;
}

export const notificationService = {
  /**
   * Erstellt eine In-App Benachrichtigung
   */
  async createInAppNotification(input: NotificationInput): Promise<string | null> {
    try {
      const insertData = {
        user_id: input.userId,
        tenant_id: input.tenantId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: (input.metadata || {}) as Record<string, unknown>,
        is_read: false,
      };
      
      const { data, error } = await supabase
        .from("notifications")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        console.error("[notificationService] Create notification error:", error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error("[notificationService] Unexpected error:", error);
      return null;
    }
  },

  /**
   * Plant eine zukünftige Benachrichtigung
   */
  async scheduleNotification(input: ScheduledNotificationInput): Promise<string | null> {
    try {
      const insertData = {
        user_id: input.userId,
        tenant_id: input.tenantId,
        notification_type: input.type,
        scheduled_for: input.scheduledFor.toISOString(),
        related_id: input.relatedId,
        related_type: input.relatedType,
        payload: input.payload as Record<string, unknown>,
        status: "pending",
      };
      
      const { data, error } = await supabase
        .from("scheduled_notifications")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        console.error("[notificationService] Schedule notification error:", error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error("[notificationService] Unexpected error:", error);
      return null;
    }
  },

  /**
   * Sendet eine E-Mail-Benachrichtigung über Edge Function
   */
  async sendEmailReminder(input: EmailReminderInput): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke("send-notification-email", {
        body: {
          type: input.type,
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          subject: input.subject,
          data: input.data,
        },
      });

      if (error) {
        console.error("[notificationService] Email send error:", error);
        return false;
      }

      return data?.success === true;
    } catch (error) {
      console.error("[notificationService] Unexpected email error:", error);
      return false;
    }
  },

  /**
   * Generiert und lädt eine ICS-Datei herunter
   */
  downloadCalendarEvent(event: CalendarEvent): void {
    downloadICSFile(event);
  },

  /**
   * Generiert ICS-Content als String
   */
  generateCalendarICS(event: CalendarEvent): string {
    return generateICSFile(event);
  },

  /**
   * Erstellt Besuchserinnerung
   */
  async createVisitReminder(
    userId: string,
    tenantId: string,
    customerId: string,
    customerName: string,
    visitDate: Date,
    reminderMinutes: number = 60
  ): Promise<string | null> {
    const reminderTime = new Date(visitDate.getTime() - reminderMinutes * 60 * 1000);
    
    // Nur planen wenn der Zeitpunkt in der Zukunft liegt
    if (reminderTime <= new Date()) {
      return null;
    }

    return this.scheduleNotification({
      userId,
      tenantId,
      type: "visit_reminder",
      scheduledFor: reminderTime,
      relatedId: customerId,
      relatedType: "customer",
      payload: {
        customerName,
        visitDate: visitDate.toISOString(),
      },
    });
  },

  /**
   * Erstellt VVL-Erinnerung
   */
  async createVVLReminder(
    userId: string,
    tenantId: string,
    contractId: string,
    customerName: string,
    vvlDate: Date,
    daysBeforeReminder: number = 7
  ): Promise<string | null> {
    const reminderTime = new Date(vvlDate);
    reminderTime.setDate(reminderTime.getDate() - daysBeforeReminder);
    reminderTime.setHours(9, 0, 0, 0); // 9:00 Uhr
    
    if (reminderTime <= new Date()) {
      return null;
    }

    return this.scheduleNotification({
      userId,
      tenantId,
      type: "vvl_reminder",
      scheduledFor: reminderTime,
      relatedId: contractId,
      relatedType: "contract",
      payload: {
        customerName,
        vvlDate: vvlDate.toISOString(),
        daysRemaining: daysBeforeReminder,
      },
    });
  },

  /**
   * Markiert geplante Benachrichtigung als gesendet
   */
  async markNotificationSent(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("scheduled_notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Löscht geplante Benachrichtigung
   */
  async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("scheduled_notifications")
        .delete()
        .eq("id", notificationId);

      return !error;
    } catch {
      return false;
    }
  },
};
