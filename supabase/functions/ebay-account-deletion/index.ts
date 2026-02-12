import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VERIFICATION_TOKEN = "cardledgerverificationtoken2026productionebayapi";
const ENDPOINT_URL = "https://vbedydaozlvujkpcojct.supabase.co/functions/v1/ebay-account-deletion";

serve(async (req) => {
  // Handle eBay's challenge verification (GET request)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const challengeCode = url.searchParams.get("challenge_code");
    
    if (challengeCode) {
      // Hash: challengeCode + verificationToken + endpoint (in that order)
      const encoder = new TextEncoder();
      const data = encoder.encode(challengeCode + VERIFICATION_TOKEN + ENDPOINT_URL);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const challengeResponse = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      
      console.log("Challenge code:", challengeCode);
      console.log("Challenge response:", challengeResponse);
      
      return new Response(
        JSON.stringify({ challengeResponse }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
    
    return new Response("OK", { status: 200 });
  }

  // Handle actual deletion notifications (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("eBay account deletion notification received:", JSON.stringify(body));
      
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    } catch (error) {
      console.error("Error processing eBay deletion notification:", error);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("OK", { status: 200 });
});
