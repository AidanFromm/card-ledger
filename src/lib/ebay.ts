/**
 * eBay API Integration for CardLedger
 * 
 * Features:
 * - OAuth 2.0 user authorization flow
 * - Token management (refresh tokens)
 * - Browse API: Search for items, get item details
 * - Sell API: Get user's active listings
 * - Fulfillment API: Get sold items
 */

import { supabase } from "@/integrations/supabase/client";

// eBay API endpoints
const EBAY_AUTH_URL = "https://auth.ebay.com/oauth2/authorize";
const EBAY_SANDBOX_AUTH_URL = "https://auth.sandbox.ebay.com/oauth2/authorize";

// Use production by default
const IS_PRODUCTION = true;
const AUTH_URL = IS_PRODUCTION ? EBAY_AUTH_URL : EBAY_SANDBOX_AUTH_URL;

// eBay OAuth scopes needed for our features
const EBAY_SCOPES = [
  "https://api.ebay.com/oauth/api_scope", // Basic access
  "https://api.ebay.com/oauth/api_scope/sell.inventory", // Manage inventory
  "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly", // Read inventory
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment", // Order/sold data
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly", // Read orders
  "https://api.ebay.com/oauth/api_scope/sell.account.readonly", // Read account info
].join(" ");

// eBay listing item structure
export interface EbayListing {
  itemId: string;
  title: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  quantity: number;
  quantityAvailable: number;
  condition: string;
  listingStatus: string;
  createdAt: string;
  endDate?: string;
  viewCount?: number;
  watchCount?: number;
  categoryId?: string;
  categoryName?: string;
}

// eBay sold item structure
export interface EbaySoldItem {
  orderId: string;
  itemId: string;
  title: string;
  imageUrl: string | null;
  salePrice: number;
  shippingCost: number;
  totalPrice: number;
  currency: string;
  quantity: number;
  soldDate: string;
  buyerUsername: string;
  orderStatus: string;
}

// eBay connection status
export interface EbayConnectionStatus {
  connected: boolean;
  username?: string;
  userId?: string;
  expiresAt?: string;
  tokenValid?: boolean;
}

// Price lookup result
export interface EbayPriceLookup {
  searchQuery: string;
  averagePrice: number;
  medianPrice: number;
  lowPrice: number;
  highPrice: number;
  sampleSize: number;
  recentSales: Array<{
    title: string;
    price: number;
    soldDate: string;
    imageUrl?: string;
    itemUrl?: string;
  }>;
}

/**
 * Get the eBay OAuth authorization URL
 * User will be redirected here to authorize our app
 */
export function getEbayAuthUrl(): string {
  const clientId = import.meta.env.VITE_EBAY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_EBAY_REDIRECT_URI || `${window.location.origin}/ebay/callback`;
  
  if (!clientId) {
    throw new Error("eBay Client ID not configured. Set VITE_EBAY_CLIENT_ID environment variable.");
  }
  
  const state = generateState();
  // Store state in sessionStorage for verification
  sessionStorage.setItem("ebay_oauth_state", state);
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: EBAY_SCOPES,
    state: state,
  });
  
  return `${AUTH_URL}?${params.toString()}`;
}

/**
 * Generate a random state parameter for OAuth
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify OAuth state parameter
 */
export function verifyOAuthState(state: string): boolean {
  const storedState = sessionStorage.getItem("ebay_oauth_state");
  sessionStorage.removeItem("ebay_oauth_state"); // Clean up
  return state === storedState;
}

/**
 * Exchange authorization code for tokens
 * This should be called after the user is redirected back from eBay
 */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("ebay-oauth-exchange", {
    body: { code },
  });
  
  if (error) {
    throw new Error(error.message || "Failed to exchange authorization code");
  }
  
  if (!data.success) {
    throw new Error(data.error || "Token exchange failed");
  }
}

/**
 * Check if the current user has connected their eBay account
 */
export async function getEbayConnectionStatus(): Promise<EbayConnectionStatus> {
  const { data, error } = await supabase.functions.invoke("ebay-connection-status", {
    body: {},
  });
  
  if (error) {
    console.error("Error checking eBay connection:", error);
    return { connected: false };
  }
  
  return data;
}

/**
 * Disconnect eBay account (revoke tokens)
 */
export async function disconnectEbay(): Promise<void> {
  const { error } = await supabase.functions.invoke("ebay-disconnect", {
    body: {},
  });
  
  if (error) {
    throw new Error(error.message || "Failed to disconnect eBay account");
  }
}

/**
 * Get user's active eBay listings
 */
export async function getActiveListings(
  limit: number = 50,
  offset: number = 0
): Promise<{ listings: EbayListing[]; totalCount: number }> {
  const { data, error } = await supabase.functions.invoke("ebay-get-listings", {
    body: { limit, offset },
  });
  
  if (error) {
    throw new Error(error.message || "Failed to fetch eBay listings");
  }
  
  return data;
}

/**
 * Get user's sold items from eBay
 */
export async function getSoldItems(
  daysBack: number = 30,
  limit: number = 50,
  offset: number = 0
): Promise<{ soldItems: EbaySoldItem[]; totalCount: number }> {
  const { data, error } = await supabase.functions.invoke("ebay-get-sold", {
    body: { daysBack, limit, offset },
  });
  
  if (error) {
    throw new Error(error.message || "Failed to fetch sold items");
  }
  
  return data;
}

/**
 * Search eBay sold listings for price lookup
 * Uses Browse API (doesn't require user auth)
 */
export async function lookupEbayPrices(
  cardName: string,
  setName?: string,
  gradingCompany?: string,
  grade?: string,
  category?: "pokemon" | "sports" | "other"
): Promise<EbayPriceLookup | null> {
  const { data, error } = await supabase.functions.invoke("ebay-sold-prices", {
    body: {
      cardName,
      setName,
      gradingCompany,
      grade,
      category,
    },
  });
  
  if (error || !data) {
    console.error("Error looking up eBay prices:", error);
    return null;
  }
  
  // Transform the response
  if (!data.stats || data.products.length === 0) {
    return null;
  }
  
  return {
    searchQuery: cardName + (setName ? ` ${setName}` : ""),
    averagePrice: data.stats.average,
    medianPrice: data.stats.median,
    lowPrice: data.stats.low,
    highPrice: data.stats.high,
    sampleSize: data.stats.count,
    recentSales: data.products.slice(0, 10).map((p: any) => ({
      title: p.name,
      price: p.market_price,
      soldDate: new Date().toISOString(), // Browse API doesn't give sold date
      imageUrl: p.image_url,
      itemUrl: p.item_url,
    })),
  };
}

/**
 * Map an eBay listing to CardLedger inventory format
 */
export function mapEbayListingToInventory(listing: EbayListing): {
  name: string;
  set_name: string;
  purchase_price: number;
  market_price: number;
  quantity: number;
  card_image_url: string | null;
  notes: string;
  condition: string;
  grading_company: string;
  grade: string | null;
} {
  // Parse grading info from title
  const { gradingCompany, grade } = parseGradingFromTitle(listing.title);
  const setName = parseSetFromTitle(listing.title);
  
  return {
    name: cleanCardName(listing.title),
    set_name: setName || "Unknown Set",
    purchase_price: 0, // User needs to fill this in
    market_price: listing.price,
    quantity: listing.quantityAvailable,
    card_image_url: listing.imageUrl,
    notes: `Imported from eBay listing: ${listing.itemId}`,
    condition: mapEbayCondition(listing.condition),
    grading_company: gradingCompany || "Raw",
    grade: grade,
  };
}

/**
 * Map an eBay sold item to CardLedger sale format
 */
export function mapEbaySoldToSale(soldItem: EbaySoldItem): {
  sale_price: number;
  quantity: number;
  platform_sold: string;
  notes: string;
} {
  return {
    sale_price: soldItem.salePrice,
    quantity: soldItem.quantity,
    platform_sold: "eBay",
    notes: `eBay Order: ${soldItem.orderId}`,
  };
}

// Helper functions for parsing eBay data

function parseGradingFromTitle(title: string): { gradingCompany: string | null; grade: string | null } {
  const upperTitle = title.toUpperCase();
  
  // PSA patterns
  const psaMatch = upperTitle.match(/PSA\s*(\d+(?:\.\d+)?)/);
  if (psaMatch) {
    return { gradingCompany: "PSA", grade: psaMatch[1] };
  }
  
  // BGS/CGC patterns
  const bgsMatch = upperTitle.match(/BGS\s*(\d+(?:\.\d+)?)/);
  if (bgsMatch) {
    return { gradingCompany: "BGS", grade: bgsMatch[1] };
  }
  
  const cgcMatch = upperTitle.match(/CGC\s*(\d+(?:\.\d+)?)/);
  if (cgcMatch) {
    return { gradingCompany: "CGC", grade: cgcMatch[1] };
  }
  
  // SGC patterns
  const sgcMatch = upperTitle.match(/SGC\s*(\d+(?:\.\d+)?)/);
  if (sgcMatch) {
    return { gradingCompany: "SGC", grade: sgcMatch[1] };
  }
  
  return { gradingCompany: null, grade: null };
}

function parseSetFromTitle(title: string): string | null {
  // Common Pokemon set patterns
  const setPhrases = [
    /\b(Base Set|Jungle|Fossil|Team Rocket|Gym Heroes|Gym Challenge|Neo Genesis|Neo Discovery|Neo Revelation|Neo Destiny)\b/i,
    /\b(Sword & Shield|Sun & Moon|XY|Black & White|Diamond & Pearl|Platinum|HeartGold & SoulSilver)\b/i,
    /\b(Scarlet & Violet|Paldea Evolved|Obsidian Flames|151|Paradox Rift|Temporal Forces|Twilight Masquerade)\b/i,
    /\b(Crown Zenith|Silver Tempest|Lost Origin|Astral Radiance|Brilliant Stars|Fusion Strike|Evolving Skies)\b/i,
    /\b(Celebrations|Shining Fates|Champions Path|Hidden Fates|Cosmic Eclipse)\b/i,
  ];
  
  for (const pattern of setPhrases) {
    const match = title.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

function cleanCardName(title: string): string {
  // Remove common eBay listing additions
  let name = title
    .replace(/PSA\s*\d+(?:\.\d+)?/gi, "")
    .replace(/BGS\s*\d+(?:\.\d+)?/gi, "")
    .replace(/CGC\s*\d+(?:\.\d+)?/gi, "")
    .replace(/SGC\s*\d+(?:\.\d+)?/gi, "")
    .replace(/\bGEM\s*MINT\b/gi, "")
    .replace(/\bMINT\b/gi, "")
    .replace(/\bNM\b/gi, "")
    .replace(/\bNEAR\s*MINT\b/gi, "")
    .replace(/\bFREE\s*SHIPPING\b/gi, "")
    .replace(/\bAUTHENTIC\b/gi, "")
    .replace(/\bHOLO\b/gi, "Holo")
    .replace(/\bREVERSE\s*HOLO\b/gi, "Reverse Holo")
    .replace(/\#\d+\/\d+/g, "") // Remove card numbers like #25/102
    .replace(/\s+/g, " ")
    .trim();
  
  return name || title;
}

function mapEbayCondition(ebayCondition: string): string {
  const condition = ebayCondition?.toLowerCase() || "";
  
  if (condition.includes("new") || condition.includes("mint")) {
    return "near_mint";
  } else if (condition.includes("excellent") || condition.includes("like new")) {
    return "light_play";
  } else if (condition.includes("good") || condition.includes("very good")) {
    return "moderate_play";
  } else if (condition.includes("acceptable") || condition.includes("fair")) {
    return "heavy_play";
  } else if (condition.includes("poor") || condition.includes("damaged")) {
    return "damaged";
  }
  
  return "near_mint"; // Default
}
