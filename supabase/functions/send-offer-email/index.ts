// ============================================
// Send Offer Email Edge Function
// DSGVO-Compliant (German Data Protection Law)
// ============================================
//
// Sends offer PDFs via email using Resend.
// Includes:
// - DSGVO-compliant footer with legal notices
// - Rate limiting (max 10 emails per hour per user)
// - Full audit logging
// - Mandatory consent validation
//
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: Max emails per hour
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Request interface
interface SendOfferEmailRequest {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  subject: string;
  message?: string;
  pdfBase64: string;
  pdfFilename: string;
  offerId?: string;
  sharedOfferId?: string;
  // DSGVO fields (required)
  gdprConsentGiven: boolean;
  gdprConsentTimestamp?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyName?: string;
  };
  // Legal information for imprint
  companyLegal?: {
    companyName?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    registerNumber?: string;
    ceo?: string;
    vatId?: string;
    dataProtectionEmail?: string;
  };
}

// Generate HTML email template with DSGVO-compliant footer
function generateEmailHtml(params: {
  recipientName: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  message?: string;
  primaryColor: string;
  companyName: string;
  companyLegal?: SendOfferEmailRequest["companyLegal"];
}): string {
  const { recipientName, senderName, senderEmail, senderPhone, message, primaryColor, companyName, companyLegal } = params;
  
  const currentDate = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Build legal footer based on available data
  const legalCompanyName = companyLegal?.companyName || companyName;
  const street = companyLegal?.street || "";
  const city = companyLegal?.city || "";
  const postalCode = companyLegal?.postalCode || "";
  const registerNumber = companyLegal?.registerNumber || "";
  const ceo = companyLegal?.ceo || "";
  const vatId = companyLegal?.vatId || "";
  const dataProtectionEmail = companyLegal?.dataProtectionEmail || `datenschutz@${companyName.toLowerCase().replace(/\s/g, '')}.de`;

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihr Angebot von ${companyName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background-color: ${primaryColor};
      padding: 30px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      margin-top: 8px;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .message {
      margin: 24px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid ${primaryColor};
    }
    .attachment-notice {
      margin: 24px 0;
      padding: 16px 20px;
      background: #e8f5e9;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .attachment-icon {
      font-size: 24px;
    }
    .attachment-text {
      font-size: 14px;
      color: #2e7d32;
    }
    .cta-section {
      margin: 32px 0;
      text-align: center;
    }
    .cta-text {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }
    .signature {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e5e5;
    }
    .signature-name {
      font-weight: 600;
      color: #333;
    }
    .signature-contact {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    .footer {
      background: #f8f9fa;
      padding: 24px 40px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .footer-brand {
      color: ${primaryColor};
      font-weight: 600;
    }
    .legal {
      margin-top: 16px;
      font-size: 11px;
      color: #aaa;
    }
    /* DSGVO-konformer Footer */
    .gdpr-footer {
      margin-top: 32px;
      padding: 24px 40px;
      background: #fafafa;
      border-top: 1px solid #e5e5e5;
    }
    .gdpr-section {
      margin-bottom: 16px;
    }
    .gdpr-title {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      margin-bottom: 4px;
    }
    .gdpr-text {
      font-size: 11px;
      color: #888;
      line-height: 1.5;
    }
    .imprint {
      padding: 20px 40px;
      background: #f0f0f0;
      border-top: 1px solid #e5e5e5;
    }
    .imprint-title {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
    }
    .imprint-text {
      font-size: 11px;
      color: #888;
      line-height: 1.5;
    }
    .unsubscribe {
      padding: 16px 40px;
      background: #fff3cd;
      text-align: center;
      font-size: 11px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${companyName}</h1>
      <div class="header-subtitle">Vodafone Business Partner</div>
    </div>
    
    <div class="content">
      <p class="greeting">Guten Tag ${recipientName || 'Kunde'},</p>
      
      <p>
        vielen Dank für Ihr Interesse an unseren Vodafone Business-Lösungen. 
        Anbei finden Sie Ihr persönliches Angebot, das wir auf Basis Ihrer Anforderungen erstellt haben.
      </p>
      
      ${message ? `
      <div class="message">
        <strong>Persönliche Nachricht:</strong><br>
        ${message.replace(/\n/g, '<br>')}
      </div>
      ` : ''}
      
      <div class="attachment-notice">
        <span class="attachment-icon">📎</span>
        <span class="attachment-text">
          <strong>Ihr Angebot im Anhang</strong><br>
          Das Angebots-PDF finden Sie als Anhang dieser E-Mail.
        </span>
      </div>
      
      <div class="cta-section">
        <p class="cta-text">
          Bei Fragen stehe ich Ihnen gerne zur Verfügung.<br>
          Rufen Sie mich einfach an oder antworten Sie auf diese E-Mail.
        </p>
      </div>
      
      <div class="signature">
        <p>Mit freundlichen Grüßen</p>
        <p class="signature-name">${senderName}</p>
        <p class="signature-contact">
          ${companyName} • Vodafone Business Partner<br>
          ${senderEmail ? `E-Mail: ${senderEmail}` : ''}
          ${senderPhone ? `<br>Telefon: ${senderPhone}` : ''}
        </p>
      </div>
    </div>
    
    <!-- DSGVO-konformer Datenschutz-Footer -->
    <div class="gdpr-footer">
      <div class="gdpr-section">
        <div class="gdpr-title">Datenschutzhinweis gemäß Art. 13 DSGVO</div>
        <div class="gdpr-text">
          Diese E-Mail wurde auf Ihre ausdrückliche Anfrage hin versendet. 
          Rechtsgrundlage für die Verarbeitung Ihrer personenbezogenen Daten ist 
          Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) sowie Ihre Einwilligung 
          gemäß Art. 6 Abs. 1 lit. a DSGVO.
        </div>
      </div>
      
      <div class="gdpr-section">
        <div class="gdpr-title">Ihre Rechte</div>
        <div class="gdpr-text">
          Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), 
          Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO), 
          Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch (Art. 21 DSGVO).<br><br>
          <strong>Kontakt Datenschutz:</strong> ${dataProtectionEmail}
        </div>
      </div>
    </div>
    
    <!-- Impressum -->
    <div class="imprint">
      <div class="imprint-title">Impressum</div>
      <div class="imprint-text">
        ${legalCompanyName}${street ? `<br>${street}` : ''}${postalCode || city ? `<br>${postalCode} ${city}` : ''}${registerNumber ? `<br>Handelsregister: ${registerNumber}` : ''}${ceo ? `<br>Geschäftsführung: ${ceo}` : ''}${vatId ? `<br>USt-IdNr.: ${vatId}` : ''}
      </div>
    </div>
    
    <!-- Abmeldung -->
    <div class="unsubscribe">
      <strong>Keine weiteren E-Mails erwünscht?</strong><br>
      Antworten Sie auf diese E-Mail mit dem Betreff "ABMELDEN", 
      und wir werden Sie aus unserer Kontaktliste entfernen.
    </div>
    
    <div class="footer">
      <p>
        Diese E-Mail wurde über <span class="footer-brand">${companyName}</span> gesendet.
      </p>
      <p class="legal">
        Alle Preise im Angebot verstehen sich zzgl. MwSt. sofern nicht anders angegeben.
        Das Angebot ist unverbindlich und freibleibend.
      </p>
      <p class="legal">
        Datum: ${currentDate}
      </p>
    </div>
  </div>
</body>
</html>
`;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("[send-offer-email] Supabase not configured");
      return new Response(
        JSON.stringify({ error: "Backend not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-offer-email] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Parse request body
    const body: SendOfferEmailRequest = await req.json();
    
    // DSGVO: Validate consent (REQUIRED)
    if (!body.gdprConsentGiven) {
      console.error("[send-offer-email] GDPR consent not given");
      return new Response(
        JSON.stringify({ 
          error: "DSGVO-Einwilligung erforderlich",
          code: "GDPR_CONSENT_REQUIRED"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate required fields
    if (!body.recipientEmail || !body.subject || !body.pdfBase64) {
      console.error("[send-offer-email] Missing required fields");
      return new Response(
        JSON.stringify({ error: "Fehlende Pflichtfelder: recipientEmail, subject, pdfBase64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strict email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(body.recipientEmail)) {
      console.error("[send-offer-email] Invalid email format:", body.recipientEmail);
      return new Response(
        JSON.stringify({ error: "Ungültige E-Mail-Adresse" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Rate limiting: Check recent emails from this user
    if (userId) {
      const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
      
      const { count, error: countError } = await supabase
        .from("offer_emails")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", oneHourAgo);
      
      if (!countError && count !== null && count >= RATE_LIMIT_MAX) {
        console.warn(`[send-offer-email] Rate limit exceeded for user ${userId}: ${count} emails in last hour`);
        return new Response(
          JSON.stringify({ 
            error: `E-Mail-Limit erreicht (max. ${RATE_LIMIT_MAX} pro Stunde). Bitte warten Sie.`,
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: 3600
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Extract branding or use defaults
    const primaryColor = body.branding?.primaryColor || "#e4002b";
    const companyName = body.branding?.companyName || "MargenKalkulator";

    // Generate HTML email with DSGVO-compliant footer
    const htmlContent = generateEmailHtml({
      recipientName: body.recipientName,
      senderName: body.senderName,
      senderEmail: body.senderEmail,
      senderPhone: body.senderPhone,
      message: body.message,
      primaryColor,
      companyName,
      companyLegal: body.companyLegal,
    });

    // Convert base64 PDF to buffer for size check
    const pdfBuffer = Uint8Array.from(atob(body.pdfBase64), c => c.charCodeAt(0));
    
    // Check attachment size (max 10MB)
    const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
    if (pdfBuffer.length > MAX_ATTACHMENT_SIZE) {
      console.error(`[send-offer-email] Attachment too large: ${pdfBuffer.length} bytes`);
      return new Response(
        JSON.stringify({ error: "PDF-Anhang zu groß (max. 10 MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-offer-email] Sending to ${body.recipientEmail}, attachment size: ${pdfBuffer.length} bytes`);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [body.recipientEmail],
      subject: body.subject,
      html: htmlContent,
      attachments: [
        {
          filename: body.pdfFilename || "Angebot.pdf",
          content: body.pdfBase64,
        },
      ],
    });

    const elapsed = Date.now() - startTime;
    console.log(`[send-offer-email] Email sent successfully in ${elapsed}ms:`, emailResponse);

    // Log to offer_emails table with GDPR fields
    try {
      if (userId) {
        await supabase.from("offer_emails").insert({
          user_id: userId,
          recipient_email: body.recipientEmail,
          recipient_name: body.recipientName || null,
          subject: body.subject,
          message: body.message || null,
          status: "sent",
          resend_message_id: emailResponse.data?.id || null,
          gdpr_consent_given: body.gdprConsentGiven,
          gdpr_consent_timestamp: body.gdprConsentTimestamp || new Date().toISOString(),
          sender_employee_name: body.senderName,
          sender_employee_email: body.senderEmail || null,
          sender_employee_phone: body.senderPhone || null,
          shared_offer_id: body.sharedOfferId || null,
        });
      }
    } catch (logError) {
      console.warn("[send-offer-email] Failed to log email:", logError);
    }

    // Log to security events for audit
    try {
      await supabase.from("security_events").insert({
        event_type: "offer_email_sent",
        user_id: userId,
        risk_level: "info",
        details: {
          recipient: body.recipientEmail,
          subject: body.subject,
          elapsed_ms: elapsed,
          attachment_size: pdfBuffer.length,
          gdpr_consent_given: body.gdprConsentGiven,
          offer_id: body.offerId,
        },
      });
    } catch (eventError) {
      console.warn("[send-offer-email] Failed to log security event:", eventError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResponse.data?.id,
        elapsed_ms: elapsed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[send-offer-email] Error after ${elapsed}ms:`, error);

    return new Response(
      JSON.stringify({
        error: error.message || "E-Mail konnte nicht gesendet werden",
        elapsed_ms: elapsed,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
