// ============================================
// Send Offer Email Edge Function
// ============================================
//
// Sends offer PDFs via email using Resend.
// Supports HTML email templates with dynamic branding.
//
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyName?: string;
  };
}

// Generate HTML email template with branding
function generateEmailHtml(params: {
  recipientName: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  message?: string;
  primaryColor: string;
  companyName: string;
}): string {
  const { recipientName, senderName, senderEmail, senderPhone, message, primaryColor, companyName } = params;
  
  const currentDate = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
    
    // Validate required fields
    if (!body.recipientEmail || !body.subject || !body.pdfBase64) {
      console.error("[send-offer-email] Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientEmail, subject, pdfBase64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.recipientEmail)) {
      console.error("[send-offer-email] Invalid email format:", body.recipientEmail);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract branding or use defaults
    const primaryColor = body.branding?.primaryColor || "#e4002b";
    const companyName = body.branding?.companyName || "MargenKalkulator";

    // Generate HTML email
    const htmlContent = generateEmailHtml({
      recipientName: body.recipientName,
      senderName: body.senderName,
      senderEmail: body.senderEmail,
      senderPhone: body.senderPhone,
      message: body.message,
      primaryColor,
      companyName,
    });

    // Convert base64 PDF to buffer
    const pdfBuffer = Uint8Array.from(atob(body.pdfBase64), c => c.charCodeAt(0));

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

    // Log to security events (optional, for audit)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("security_events").insert({
          event_type: "offer_email_sent",
          risk_level: "info",
          details: {
            recipient: body.recipientEmail,
            subject: body.subject,
            elapsed_ms: elapsed,
            attachment_size: pdfBuffer.length,
          },
        });
      }
    } catch (logError) {
      console.warn("[send-offer-email] Failed to log event:", logError);
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
        error: error.message || "Failed to send email",
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
