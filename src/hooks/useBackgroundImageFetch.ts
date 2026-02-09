import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cleanCardName, getBaseName, cardNumbersMatch } from "@/lib/cardNameUtils";

interface FetchProgress {
  isRunning: boolean;
  current: number;
  total: number;
  found: number;
}

// Global state to persist across component mounts
let globalFetchStarted = false;
let globalFetchProgress: FetchProgress = { isRunning: false, current: 0, total: 0, found: 0 };

export const useBackgroundImageFetch = () => {
  const { toast } = useToast();
  const [progress, setProgress] = useState<FetchProgress>(globalFetchProgress);
  const fetchingRef = useRef(false);

  // Sync local state with global
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress({ ...globalFetchProgress });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const startBackgroundFetch = async () => {
    // Prevent multiple fetches
    if (globalFetchStarted || fetchingRef.current) return;

    globalFetchStarted = true;
    fetchingRef.current = true;

    try {
      // Get all items without images
      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('id, name, card_number, set_name, card_image_url, quantity, grading_company, grade')
        .is('card_image_url', null)
        .gt('quantity', 0)
        .limit(500);

      if (error || !items || items.length === 0) {
        globalFetchStarted = false;
        fetchingRef.current = false;
        return;
      }

      // Group by name+number to avoid duplicate API calls
      const uniqueNames = new Map<string, typeof items>();
      items.forEach(item => {
        const key = `${item.name.toLowerCase()}|${item.card_number || ''}`;
        if (!uniqueNames.has(key)) {
          uniqueNames.set(key, [item]);
        } else {
          uniqueNames.get(key)!.push(item);
        }
      });

      const uniqueGroups = Array.from(uniqueNames.values());
      let found = 0;
      let processed = 0;

      globalFetchProgress = { isRunning: true, current: 0, total: uniqueGroups.length, found: 0 };
      setProgress({ ...globalFetchProgress });

      for (const group of uniqueGroups) {
        const item = group[0];
        processed++;
        globalFetchProgress = { ...globalFetchProgress, current: processed };

        try {
          // Clean the name - strip parenthetical and bracket content
          const cleanedName = cleanCardName(item.name);
          const baseName = getBaseName(item.name);

          // Build smarter search variations
          const searchVariations: string[] = [];

          // 1. BEST: Full cleaned name + card number (most specific)
          if (item.card_number) {
            searchVariations.push(`${cleanedName} ${item.card_number.split('/')[0]}`);
          }

          // 2. Full cleaned name + set name
          if (item.set_name) {
            searchVariations.push(`${cleanedName} ${item.set_name}`);
          }

          // 3. Full cleaned name alone
          searchVariations.push(cleanedName);

          // 4. Base name + card number (for API variations)
          if (item.card_number && baseName !== cleanedName) {
            searchVariations.push(`${baseName} ${item.card_number.split('/')[0]}`);
          }

          // 5. Base name + set name
          if (item.set_name && baseName !== cleanedName) {
            searchVariations.push(`${baseName} ${item.set_name}`);
          }

          // 6. Base name alone (last resort)
          if (baseName !== cleanedName) {
            searchVariations.push(baseName);
          }

          // Remove duplicates and empty strings
          const uniqueQueries = [...new Set(searchVariations.filter(q => q && q.length > 2))];

          // Try each search variation until we find an image
          let data: any = null;
          let searchError: any = null;

          for (const searchQuery of uniqueQueries) {
            const result = await supabase.functions.invoke('products-search', {
              body: { query: searchQuery }
            });

            if (!result.error && result.data?.products?.length > 0) {
              data = result.data;
              break;
            }
            searchError = result.error;
          }

          // If no searches worked, skip this item
          if (!data?.products) {
            continue;
          }

          const withImages = data.products.filter((p: any) =>
            p.image_url && !p.image_url.includes('placehold')
          );

          if (withImages.length > 0) {
            // If card has a number, prioritize results with matching numbers
            let candidates = withImages;
            if (item.card_number) {
              const numberMatches = withImages.filter((p: any) =>
                cardNumbersMatch(item.card_number, p.card_number)
              );
              if (numberMatches.length > 0) {
                candidates = numberMatches;
              }
            }

            // Score candidates by name and set match
            let bestMatch = candidates[0];
            let bestScore = 0;

            for (const p of candidates) {
              let score = 0;

              // Card number match
              if (item.card_number && p.card_number && cardNumbersMatch(item.card_number, p.card_number)) {
                score += 50;
              }

              // Set name match
              if (item.set_name && p.set_name) {
                const importedSet = item.set_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const apiSet = p.set_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (importedSet === apiSet) {
                  score += 30;
                } else if (importedSet.includes(apiSet) || apiSet.includes(importedSet)) {
                  score += 15;
                }
              }

              // Name match (compare cleaned names)
              const apiCleanedName = cleanCardName(p.name || '').toLowerCase();
              if (apiCleanedName === cleanedName.toLowerCase()) {
                score += 25;
              } else if (apiCleanedName.includes(baseName.toLowerCase())) {
                score += 15;
              }

              if (score > bestScore) {
                bestScore = score;
                bestMatch = p;
              }
            }

            // Update all items in this group
            const ids = group.map(i => i.id);
            await supabase
              .from('inventory_items')
              .update({ card_image_url: bestMatch.image_url })
              .in('id', ids);

            found += group.length;
            globalFetchProgress = { ...globalFetchProgress, found };
          }
        } catch (err) {
          // Silently continue
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      globalFetchProgress = { isRunning: false, current: processed, total: uniqueGroups.length, found };
      setProgress({ ...globalFetchProgress });

      if (found > 0) {
        toast({
          title: "Images loaded",
          description: `Found ${found} images in background.`,
        });
      }

    } catch (err) {
      console.error('Background fetch error:', err);
    } finally {
      fetchingRef.current = false;
      globalFetchProgress = { ...globalFetchProgress, isRunning: false };
    }
  };

  return {
    progress,
    startBackgroundFetch,
    isRunning: progress.isRunning,
  };
};
