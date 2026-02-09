import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const priceChartingApiKey = Deno.env.get('PRICECHARTING_API_KEY');
    
    if (!priceChartingApiKey) {
      throw new Error('PriceCharting API key not configured');
    }

    console.log('Searching PriceCharting for:', query);

    // Search PriceCharting API
    const searchUrl = `https://www.pricecharting.com/api/products?t=${priceChartingApiKey}&q=${encodeURIComponent(query)}&type=pokemon-card`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`PriceCharting API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('PriceCharting response:', data);

    // Transform the response to our format and fetch images from Pokemon TCG API
    // Note: PriceCharting returns prices in CENTS, so divide by 100
    // Limit to top 8 results for cleaner UI
    const limitedProducts = (data.products || []).slice(0, 8);
    const priceProducts = await Promise.all(
      limitedProducts.map(async (product: any) => {
        const cardName = product['product-name'];
        const setName = product['console-name'] || 'Unknown Set';
        
        // Try to find card image using Pokemon TCG API (more reliable)
        let imageUrl = null;
        let pokemonTcgId: string | null = null;
        try {
          const tcgQuery = `name:"${cardName}"`;
          const tcgUrl = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(tcgQuery)}`;
          const tcgResponse = await fetch(tcgUrl, { headers: { 'Accept': 'application/json' } });
          if (tcgResponse.ok) {
            const tcgData = await tcgResponse.json();
            if (tcgData.data && tcgData.data.length > 0) {
              const first = tcgData.data[0];
              imageUrl = first.images?.large || first.images?.small;
              pokemonTcgId = first.id || null;
              console.log(`Found Pokemon TCG image for ${cardName}:`, imageUrl);
            }
          } else {
            console.warn('Pokemon TCG API search failed:', tcgResponse.status);
          }
        } catch (error) {
          console.error(`Error fetching image for ${cardName}:`, error);
        }

        // Try multiple price fields that PriceCharting might use for Pokemon cards
        const marketPrice = product['loose-price'] || 
                           product['cib-price'] || 
                           product['new-price'] ||
                           product['used-price'] ||
                           product['graded-price'] ||
                           product['box-only-price'];

        return {
          id: product.id,
          name: cardName,
          set_name: setName,
          image_url: imageUrl,
          market_price: marketPrice ? marketPrice / 100 : null,
          source: 'pricecharting',
          barcode: product.upc || null,
          pokemon_tcg_id: pokemonTcgId,
        };
      })
    );

    // Fallback: if PriceCharting has no results, use Pokemon TCG API directly
    let products = priceProducts;
    if (!products || products.length === 0) {
      console.log('No PriceCharting results; falling back to Pokemon TCG API for query:', query);
      try {
        const fallbackQuery = `name:"${query}"`;
        const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(fallbackQuery)}&orderBy=name&limit=8`;
        const tcgResp = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (tcgResp.ok) {
          const tcgData = await tcgResp.json();
          products = (tcgData.data || []).map((card: any) => {
            const tcgPrices = card?.tcgplayer?.prices || {};
            
            // Use mid/low price for better market representation
            const getPriceFromVariant = (variant: any) => {
              if (!variant) return null;
              return variant.mid || variant.low || variant.market || null;
            };
            
            const market = 
              getPriceFromVariant(tcgPrices.normal) ||
              getPriceFromVariant(tcgPrices.holofoil) ||
              getPriceFromVariant(tcgPrices.reverseHolofoil) ||
              null;
            return {
              id: card.id,
              name: card.name,
              set_name: card.set?.name || 'Unknown Set',
              image_url: card.images?.large || card.images?.small || null,
              market_price: market,
              source: 'pokemon-tcg',
              barcode: null,
              pokemon_tcg_id: card.id,
            };
          });
        } else {
          console.warn('Pokemon TCG fallback failed:', tcgResp.status);
          products = [];
        }
      } catch (e) {
        console.error('Pokemon TCG fallback error:', e);
        products = [];
      }
    }

    return new Response(
      JSON.stringify({ products }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error searching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
