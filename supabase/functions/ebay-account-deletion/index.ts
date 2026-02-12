import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * eBay Marketplace Account Deletion Webhook
 * Required for eBay API compliance
 * This endpoint receives notifications when users delete their eBay accounts
 * Since CardLedger doesn't store eBay user data, we just acknowledge the request
 */

serve(async (req) => {
  // Handle eBay's challenge verification (GET request)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const challengeCode = url.searchParams.get("challenge_code");
    
    if (challengeCode) {
      // eBay sends a challenge code to verify the endpoint
      // We need to hash it with our verification token and return it
      const verificationToken = Deno.env.get("EBAY_VERIFICATION_TOKEN") || "cardledger-verification-token";
      const endpoint = url.origin + url.pathname;
      
      // Create the challenge response hash
      const encoder = new TextEncoder();
      const data = encoder.encode(challengeCode + verificationToken + endpoint);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const challengeResponse = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      
      return new Response(
        JSON.stringify({ challengeResponse }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
  }

  // Handle actual deletion notifications (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("eBay account deletion notification received:", JSON.stringify(body));
      
      // CardLedger doesn't store eBay user credentials or personal data
      // We only cache anonymized price data, so no action needed
      // Just acknowledge receipt
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notification acknowledged. No user data stored." 
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    } catch (error) {
      console.error("Error processing eBay deletion notification:", error);
      return new Response(
        JSON.stringify({ success: true }), // Still return 200 to prevent retries
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Method not allowed
  return new Response("Method not allowed", { status: 405 });
});
