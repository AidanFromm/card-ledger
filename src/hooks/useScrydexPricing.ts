import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

type PriceSource = 'scrydex' | 'pokemon_tcg' | 'tavily' | 'database' | null;

interface PriceResult {
  market_price: number | null;
  lowest_listed: number | null;
  graded_price: number | null;
  ungraded_price: number | null;
  price_source?: PriceSource;
  price_confidence?: number | null;
}

interface RefreshProgress {
  current: number;
  total: number;
  itemName: string;
}

export const useScrydexPricing = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState<RefreshProgress | null>(null);
  const { toast } = useToast();

  // Fetch price for a single item
  const fetchPrice = useCallback(async (item: InventoryItem): Promise<PriceResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("scrydex-price", {
        body: {
          name: item.name,
          setName: item.set_name,
          cardNumber: item.card_number,
          category: item.category,
          gradingCompany: item.grading_company,
          grade: item.grade,
        },
      });

      if (error) {
        console.error("Scrydex price fetch error:", error);
        return null;
      }

      return {
        market_price: data?.market_price ?? null,
        lowest_listed: data?.lowest_listed ?? null,
        graded_price: data?.graded_price ?? null,
        ungraded_price: data?.ungraded_price ?? null,
        price_source: data?.price_source ?? null,
        price_confidence: data?.price_confidence ?? null,
      };
    } catch (error) {
      console.error("Error fetching price:", error);
      return null;
    }
  }, []);

  // Update a single item's price in the database
  const updateItemPrice = useCallback(async (
    itemId: string,
    priceData: PriceResult
  ): Promise<boolean> => {
    try {
      const updates: Partial<InventoryItem> = {
        updated_at: new Date().toISOString(),
      };

      // Set market_price based on grading status
      if (priceData.market_price !== null) {
        updates.market_price = priceData.market_price;
      }
      if (priceData.lowest_listed !== null) {
        updates.lowest_listed = priceData.lowest_listed;
      }

      const { error } = await supabase
        .from("inventory_items")
        .update(updates)
        .eq("id", itemId);

      if (error) {
        console.error("Error updating price:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating price:", error);
      return false;
    }
  }, []);

  // Refresh prices for all items
  const refreshAllPrices = useCallback(async (items: InventoryItem[]): Promise<{
    success: number;
    failed: number;
    bySource: Record<string, number>;
  }> => {
    if (isRefreshing || items.length === 0) {
      return { success: 0, failed: 0, bySource: {} };
    }

    setIsRefreshing(true);
    setProgress({ current: 0, total: items.length, itemName: "" });

    let success = 0;
    let failed = 0;
    const bySource: Record<string, number> = {};

    // Process items in batches to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (item, batchIndex) => {
          const index = i + batchIndex;
          setProgress({
            current: index + 1,
            total: items.length,
            itemName: item.name,
          });

          const priceData = await fetchPrice(item);
          if (priceData && priceData.market_price !== null) {
            const updated = await updateItemPrice(item.id, priceData);
            if (updated) {
              success++;
              // Track price source
              const source = priceData.price_source || 'unknown';
              bySource[source] = (bySource[source] || 0) + 1;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setIsRefreshing(false);
    setProgress(null);

    // Build descriptive toast message showing sources
    const sourceDetails: string[] = [];
    if (bySource.scrydex) sourceDetails.push(`${bySource.scrydex} from Scrydex`);
    if (bySource.pokemon_tcg) sourceDetails.push(`${bySource.pokemon_tcg} from TCGPlayer`);
    if (bySource.tavily) sourceDetails.push(`${bySource.tavily} from AI`);

    const description = sourceDetails.length > 0
      ? `Updated ${success} items (${sourceDetails.join(', ')}), ${failed} unavailable`
      : `Updated ${success} items, ${failed} unavailable`;

    toast({
      title: "Price refresh complete",
      description,
    });

    return { success, failed, bySource };
  }, [isRefreshing, fetchPrice, updateItemPrice, toast]);

  // Refresh price for a single item
  const refreshSinglePrice = useCallback(async (item: InventoryItem): Promise<boolean> => {
    const priceData = await fetchPrice(item);
    if (priceData && priceData.market_price !== null) {
      return await updateItemPrice(item.id, priceData);
    }
    return false;
  }, [fetchPrice, updateItemPrice]);

  return {
    isRefreshing,
    progress,
    fetchPrice,
    refreshAllPrices,
    refreshSinglePrice,
  };
};
