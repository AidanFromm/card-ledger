import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Barcode Lookup Edge Function
 *
 * Looks up products by UPC barcode across multiple sources:
 * 1. Local products database (cached results)
 * 2. PSA Cert lookup (for graded card barcodes - 8-10 digits)
 * 3. Go-UPC API (general products) - optional
 *
 * SETUP:
 * - PSA_API_KEY: Already configured for PSA cert lookups
 * - GO_UPC_API_KEY: Optional for general UPC lookups
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode, format } = await req.json();

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: "barcode required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Barcode lookup: ${barcode} (format: ${format})`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PSA_API_KEY = Deno.env.get("PSA_API_KEY");
    const GO_UPC_API_KEY = Deno.env.get("GO_UPC_API_KEY");

    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Backend not configured");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Check local database first (cached lookups)
    const { data: cachedProduct } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (cachedProduct) {
      console.log(`Found cached product: ${cachedProduct.name}`);
      return new Response(
        JSON.stringify({
          product: {
            id: cachedProduct.id,
            name: cachedProduct.name,
            set_name: cachedProduct.set_name,
            card_number: cachedProduct.card_number,
            image_url: cachedProduct.image_url,
            market_price: cachedProduct.market_price,
            category: cachedProduct.category,
            barcode: cachedProduct.barcode,
          },
          source: "database_cache",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if this looks like a PSA cert number (8-10 digits)
    if (/^\d{8,10}$/.test(barcode) && PSA_API_KEY) {
      try {
        console.log("Attempting PSA cert lookup...");
        const psaResult = await lookupPSACert(barcode, PSA_API_KEY);
        if (psaResult) {
          // Cache the result
          await cacheProductLookup(supabase, barcode, psaResult);
          return new Response(
            JSON.stringify({ product: psaResult, source: "psa_api" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.warn("PSA lookup failed:", e);
      }
    }

    // 3. Try Go-UPC API for general products (if configured)
    if (GO_UPC_API_KEY) {
      try {
        console.log("Attempting Go-UPC lookup...");
        const goUpcResult = await lookupGoUPC(barcode, GO_UPC_API_KEY);
        if (goUpcResult) {
          // Cache the result
          await cacheProductLookup(supabase, barcode, goUpcResult);
          return new Response(
            JSON.stringify({ product: goUpcResult, source: "go_upc" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.warn("Go-UPC lookup failed:", e);
      }
    }

    // 4. Search our products database by name pattern (fallback)
    // Try to find matching sealed products
    const { data: sealedProducts } = await supabase
      .from("products")
      .select("*")
      .eq("category", "sealed")
      .limit(1);

    if (sealedProducts && sealedProducts.length > 0) {
      // Return first sealed product as a suggestion
      const product = sealedProducts[0];
      return new Response(
        JSON.stringify({
          product: {
            id: product.id,
            name: product.name,
            set_name: product.set_name,
            image_url: product.image_url,
            market_price: product.market_price,
            category: product.category,
            barcode: barcode,
          },
          source: "database_suggestion",
          note: "Product not found by barcode. This is a suggestion based on category.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Not found in any source
    return new Response(
      JSON.stringify({
        product: null,
        barcode,
        message: "Product not found in any database",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Barcode lookup error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Lookup PSA cert by barcode/cert number
 */
async function lookupPSACert(
  certNumber: string,
  apiKey: string
): Promise<any | null> {
  const response = await fetch(
    `https://api.psacard.com/publicapi/cert/GetByCertNumber/${certNumber}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const cert = data.PSACert;

  if (!cert) return null;

  return {
    name: cert.Subject || "Unknown Card",
    set_name: `${cert.Year || ""} ${cert.Brand || ""} ${cert.Series || ""}`.trim(),
    card_number: cert.CardNumber || null,
    image_url: null,
    market_price: null,
    category: "graded",
    barcode: certNumber,
    grading_company: "psa",
    grade: cert.CardGrade,
    player: cert.Subject,
    year: cert.Year ? parseInt(cert.Year) : null,
    brand: cert.Brand,
  };
}

/**
 * Lookup product using Go-UPC API
 */
async function lookupGoUPC(
  barcode: string,
  apiKey: string
): Promise<any | null> {
  const response = await fetch(`https://go-upc.com/api/v1/code/${barcode}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) return null;

  const data = await response.json();

  if (!data.product) return null;

  return {
    name: data.product.name,
    set_name: data.product.brand || data.product.category || "Unknown",
    image_url: data.product.imageUrl || null,
    market_price: null, // Go-UPC doesn't provide pricing
    category: "sealed",
    barcode: barcode,
  };
}

/**
 * Cache product lookup result
 */
async function cacheProductLookup(
  supabase: any,
  barcode: string,
  product: any
): Promise<void> {
  try {
    await supabase.from("products").upsert(
      {
        name: product.name,
        set_name: product.set_name,
        card_number: product.card_number,
        image_url: product.image_url,
        market_price: product.market_price,
        category: product.category || "raw",
        barcode: barcode,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "barcode",
        ignoreDuplicates: false,
      }
    );
  } catch (e) {
    console.warn("Failed to cache product:", e);
  }
}
