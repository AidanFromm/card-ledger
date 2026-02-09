import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * PSA Cert Verification API - FREE
 * Docs: https://www.psacard.com/publicapi/documentation
 *
 * Features:
 * - Verify PSA certification by cert number
 * - Get card details, grade, and authenticity
 * - Access population report data
 *
 * SETUP REQUIRED:
 * 1. Register at PSA: https://www.psacard.com/publicapi
 * 2. Get API credentials
 * 3. Set PSA_API_KEY in Supabase secrets
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { certNumber, barcode } = await req.json();

    if (!certNumber && !barcode) {
      return new Response(
        JSON.stringify({ error: "certNumber or barcode required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PSA_API_KEY = Deno.env.get("PSA_API_KEY");

    // PSA has a public cert lookup that doesn't require API key
    // We'll use both approaches

    if (PSA_API_KEY) {
      // Use official API if key is available
      const url = `https://api.psacard.com/publicapi/cert/GetByCertNumber/${certNumber}`;

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${PSA_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        return new Response(
          JSON.stringify({
            verified: true,
            cert: {
              certNumber: data.PSACert?.CertNumber,
              grade: data.PSACert?.CardGrade,
              gradeDescription: getGradeDescription(data.PSACert?.CardGrade),
              year: data.PSACert?.Year,
              brand: data.PSACert?.Brand,
              series: data.PSACert?.Series,
              cardNumber: data.PSACert?.CardNumber,
              player: data.PSACert?.Subject,
              category: data.PSACert?.Category,
              variety: data.PSACert?.Variety,
              labelType: data.PSACert?.LabelType,
              reverseBarcode: data.PSACert?.ReverseBarCode,
              // Population data if available
              populationHigher: data.PSACert?.PopulationHigher,
              populationSame: data.PSACert?.PopulationSame,
            },
            source: "psa_api",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback: Public cert verification (no API key needed)
    // This uses the public PSA website verification endpoint
    const publicUrl = `https://www.psacard.com/cert/${certNumber}`;

    console.log(`PSA lookup for cert: ${certNumber}`);

    // We can't scrape the website, but we can return the verification URL
    // and let the client handle verification display
    return new Response(
      JSON.stringify({
        verified: null, // Unknown - needs manual verification
        certNumber,
        verificationUrl: publicUrl,
        message: "PSA API key not configured. Use verification URL for manual lookup.",
        setup_required: !PSA_API_KEY,
        setup_url: "https://www.psacard.com/publicapi",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PSA lookup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getGradeDescription(grade: string | number): string {
  const descriptions: Record<string, string> = {
    "10": "Gem Mint",
    "9": "Mint",
    "8": "Near Mint-Mint",
    "7": "Near Mint",
    "6": "Excellent-Mint",
    "5": "Excellent",
    "4": "Very Good-Excellent",
    "3": "Very Good",
    "2": "Good",
    "1": "Poor",
    "A": "Authentic (Altered)",
  };
  return descriptions[String(grade)] || "Unknown";
}
