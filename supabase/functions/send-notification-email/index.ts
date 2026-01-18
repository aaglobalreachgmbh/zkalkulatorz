import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const senderEmail = Deno.env.get("SENDER_EMAIL_ADDRESS") || "noreply@margenkalkulator.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  type: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  data: Record<string, unknown>;
}

// Email Templates
const templates: Record<string, (data: Record<string, unknown>, recipientName?: string) => string> = {
  visit_reminder: (data, recipientName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E60000;">🗓️ Besuchserinnerung</h2>
      <p>Hallo ${recipientName || ""},</p>
      <p>Sie haben einen anstehenden Kundenbesuch:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Kunde:</strong> ${data.customerName || "N/A"}</p>
        <p style="margin: 8px 0 0;"><strong>Datum:</strong> ${data.visitDate ? new Date(data.visitDate as string).toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}</p>
        ${data.address ? `<p style="margin: 8px 0 0;"><strong>Adresse:</strong> ${data.address}</p>` : ""}
      </div>
      <p>Viel Erfolg beim Termin!</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Diese E-Mail wurde automatisch vom MargenKalkulator gesendet.
      </p>
    </div>
  `,

  visit_overdue: (data, recipientName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E60000;">⚠️ Überfälliger Besuchsbericht</h2>
      <p>Hallo ${recipientName || ""},</p>
      <p>Es gibt einen ausstehenden Besuchsbericht:</p>
      <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ff9900;">
        <p style="margin: 0;"><strong>Kunde:</strong> ${data.customerName || "N/A"}</p>
        <p style="margin: 8px 0 0;"><strong>Besuchsdatum:</strong> ${data.visitDate ? new Date(data.visitDate as string).toLocaleDateString("de-DE") : "N/A"}</p>
        <p style="margin: 8px 0 0;"><strong>Überfällig seit:</strong> ${data.daysOverdue || 0} Tag(en)</p>
      </div>
      <p>Bitte vervollständigen Sie den Bericht so bald wie möglich.</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Diese E-Mail wurde automatisch vom MargenKalkulator gesendet.
      </p>
    </div>
  `,

  vvl_reminder: (data, recipientName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E60000;">📅 VVL-Erinnerung</h2>
      <p>Hallo ${recipientName || ""},</p>
      <p>Eine Vertragsverlängerung steht an:</p>
      <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #4caf50;">
        <p style="margin: 0;"><strong>Kunde:</strong> ${data.customerName || "N/A"}</p>
        <p style="margin: 8px 0 0;"><strong>VVL-Datum:</strong> ${data.vvlDate ? new Date(data.vvlDate as string).toLocaleDateString("de-DE") : "N/A"}</p>
        <p style="margin: 8px 0 0;"><strong>Noch:</strong> ${data.daysRemaining || 0} Tag(e)</p>
      </div>
      <p>Jetzt ist ein guter Zeitpunkt, den Kunden zu kontaktieren!</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Diese E-Mail wurde automatisch vom MargenKalkulator gesendet.
      </p>
    </div>
  `,

  sync_pending: (data, recipientName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E60000;">🔄 Ausstehende Synchronisation</h2>
      <p>Hallo ${recipientName || ""},</p>
      <p>Sie haben nicht synchronisierte Daten:</p>
      <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2196f3;">
        <p style="margin: 0;"><strong>Ausstehend:</strong> ${data.pendingCount || 0} Element(e)</p>
        <p style="margin: 8px 0 0;"><strong>Letzte Sync:</strong> ${data.lastSync ? new Date(data.lastSync as string).toLocaleString("de-DE") : "Nie"}</p>
      </div>
      <p>Bitte synchronisieren Sie Ihre Daten, wenn Sie wieder online sind.</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Diese E-Mail wurde automatisch vom MargenKalkulator gesendet.
      </p>
    </div>
  `,

  sync_failed: (data, recipientName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E60000;">❌ Synchronisation fehlgeschlagen</h2>
      <p>Hallo ${recipientName || ""},</p>
      <p>Die Datensynchronisation ist fehlgeschlagen:</p>
      <div style="background: #ffebee; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f44336;">
        <p style="margin: 0;"><strong>Fehler:</strong> ${data.errorMessage || "Unbekannter Fehler"}</p>
        <p style="margin: 8px 0 0;"><strong>Zeitpunkt:</strong> ${new Date().toLocaleString("de-DE")}</p>
      </div>
      <p>Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Diese E-Mail wurde automatisch vom MargenKalkulator gesendet.
      </p>
    </div>
  `,

  appointment_reminder: (data, recipientName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E60000;">📆 Terminerinnerung</h2>
      <p>Hallo ${recipientName || ""},</p>
      <p>Sie haben einen anstehenden Termin:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Titel:</strong> ${data.title || "N/A"}</p>
        <p style="margin: 8px 0 0;"><strong>Datum:</strong> ${data.startTime ? new Date(data.startTime as string).toLocaleString("de-DE") : "N/A"}</p>
        ${data.location ? `<p style="margin: 8px 0 0;"><strong>Ort:</strong> ${data.location}</p>` : ""}
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Diese E-Mail wurde automatisch vom MargenKalkulator gesendet.
      </p>
    </div>
  `,
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientEmail, recipientName, subject, data }: NotificationEmailRequest = await req.json();

    // Validate input
    if (!type || !recipientEmail || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, recipientEmail, subject" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get template
    const templateFn = templates[type];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: `Unknown notification type: ${type}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate HTML
    const html = templateFn(data, recipientName);

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `MargenKalkulator <${senderEmail}>`,
        to: [recipientEmail],
        subject: subject,
        html: html,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, id: emailResult?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
