import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * CardLedger Email Service via Resend
 * 
 * SETUP:
 * 1. Create account at https://resend.com
 * 2. Get API key from dashboard
 * 3. Add RESEND_API_KEY to Supabase secrets
 * 4. Verify your domain (cardledger.com) for production
 * 
 * Email types:
 * - welcome: New user signup
 * - price_alert: Price target hit
 * - weekly_summary: Portfolio recap
 * - trade_match: New trade match found
 * - grading_update: Grading status change
 */

interface EmailRequest {
  type: "welcome" | "price_alert" | "weekly_summary" | "trade_match" | "grading_update";
  to: string;
  data: Record<string, any>;
}

const EMAIL_TEMPLATES: Record<string, { subject: string; html: (data: any) => string }> = {
  welcome: {
    subject: "Welcome to CardLedger",
    html: (data) => `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Welcome to CardLedger!</h1>
        <p>Hi ${data.name || "there"},</p>
        <p>Thanks for joining CardLedger. You're now ready to track your card collection like a pro.</p>
        <p><strong>Quick start:</strong></p>
        <ul>
          <li>Add your first card via scan or search</li>
          <li>Set up price alerts for cards you're watching</li>
          <li>Track your portfolio value on the dashboard</li>
        </ul>
        <p>Happy collecting!</p>
        <p>- The CardLedger Team</p>
      </div>
    `,
  },
  price_alert: {
    subject: "Price Alert: {cardName}",
    html: (data) => `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Price Alert Triggered</h1>
        <p><strong>${data.cardName}</strong> has hit your target price!</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Current Price:</strong> $${data.currentPrice}</p>
          <p style="margin: 0;"><strong>Your Target:</strong> $${data.targetPrice}</p>
          <p style="margin: 0;"><strong>Alert Type:</strong> ${data.alertType}</p>
        </div>
        <a href="https://usecardledger.com/alerts" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Alert</a>
      </div>
    `,
  },
  weekly_summary: {
    subject: "Your Weekly CardLedger Recap",
    html: (data) => `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Weekly Portfolio Recap</h1>
        <p>Here's how your collection performed this week:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Portfolio Value:</strong> $${data.totalValue}</p>
          <p style="margin: 0;"><strong>Weekly Change:</strong> ${data.weeklyChange > 0 ? '+' : ''}${data.weeklyChange}%</p>
          <p style="margin: 0;"><strong>Cards Tracked:</strong> ${data.cardCount}</p>
        </div>
        <h3>Top Movers</h3>
        <ul>
          ${(data.topMovers || []).map((m: any) => `<li>${m.name}: ${m.change > 0 ? '+' : ''}${m.change}%</li>`).join('')}
        </ul>
        <a href="https://usecardledger.com/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Dashboard</a>
      </div>
    `,
  },
  trade_match: {
    subject: "New Trade Match Found!",
    html: (data) => `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Trade Match Found</h1>
        <p>We found a collector who might want to trade with you!</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>They have:</strong> ${data.theyHave}</p>
          <p style="margin: 0;"><strong>They want:</strong> ${data.theyWant}</p>
          <p style="margin: 0;"><strong>Match Score:</strong> ${data.matchScore}</p>
        </div>
        <a href="https://usecardledger.com/trade" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Trade</a>
      </div>
    `,
  },
  grading_update: {
    subject: "Grading Update: {cardName}",
    html: (data) => `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Grading Status Update</h1>
        <p>Your submission for <strong>${data.cardName}</strong> has a new status:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Company:</strong> ${data.company}</p>
          <p style="margin: 0;"><strong>New Status:</strong> ${data.status}</p>
          ${data.grade ? `<p style="margin: 0;"><strong>Grade:</strong> ${data.grade}</p>` : ''}
        </div>
        <a href="https://usecardledger.com/grading" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Details</a>
      </div>
    `,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured", sent: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, to, data }: EmailRequest = await req.json();

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: "Missing type or to field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      return new Response(
        JSON.stringify({ error: `Unknown email type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build subject with data interpolation
    let subject = template.subject;
    Object.entries(data || {}).forEach(([key, value]) => {
      subject = subject.replace(`{${key}}`, String(value));
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CardLedger <noreply@cardledger.com>",
        to: [to],
        subject,
        html: template.html(data || {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log(`Email sent: ${type} to ${to}`);

    return new Response(
      JSON.stringify({ sent: true, id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
