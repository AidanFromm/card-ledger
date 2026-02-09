import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, setName, cardNumber, gradingCompany, grade } = await req.json();
    
    const PRICECHARTING_API_KEY = Deno.env.get('PRICECHARTING_API_KEY');
    if (!PRICECHARTING_API_KEY) {
      throw new Error('PriceCharting API key not configured');
    }

    console.log(`Fetching prices for: ${productName} ${cardNumber ? `#${cardNumber}` : ''} (${setName}), ${gradingCompany} ${grade}`);

    // For raw/ungraded cards, try Pokemon TCG API first (uses TCGPlayer prices)
    if (gradingCompany.toLowerCase() === 'raw' && cardNumber) {
      try {
        console.log('Trying Pokemon TCG API for accurate TCGPlayer pricing...');
        const pokemonApiUrl = `https://api.pokemontcg.io/v2/cards?q=name:"${productName}" number:${cardNumber} set.name:"${setName}"`;
        
        const pokemonResponse = await fetch(pokemonApiUrl);
        const pokemonData = await pokemonResponse.json();
        
        if (pokemonData.data && pokemonData.data.length > 0) {
          const card = pokemonData.data[0];
          
          // Use mid/low price for more realistic market representation instead of Near Mint market price
          const getPriceFromVariant = (variant: any) => {
            if (!variant) return null;
            return variant.mid || variant.low || variant.market || null;
          };
          
          const tcgplayerPrice = 
            getPriceFromVariant(card.tcgplayer?.prices?.normal) ||
            getPriceFromVariant(card.tcgplayer?.prices?.holofoil) ||
            getPriceFromVariant(card.tcgplayer?.prices?.reverseHolofoil) ||
            getPriceFromVariant(card.tcgplayer?.prices?.['1stEditionHolofoil']) ||
            null;
          
          if (tcgplayerPrice) {
            const priceInCents = Math.round(tcgplayerPrice * 100);
            console.log(`Found TCGPlayer market price from Pokemon TCG API: $${tcgplayerPrice} (${priceInCents} cents)`);
            return new Response(
              JSON.stringify({ ungradedPrice: priceInCents }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        console.log('Pokemon TCG API returned no results or no pricing');
      } catch (pokemonApiError) {
        console.log('Pokemon TCG API error, falling back to PriceCharting:', pokemonApiError);
      }
    }

    // Fallback to PriceCharting API for graded cards or if Pokemon TCG API fails
    // Search for the product on PriceCharting - include card number for better matching
    const searchQuery = cardNumber 
      ? `${productName} #${cardNumber} ${setName}` 
      : (setName ? `${productName} ${setName}` : productName);
    const searchUrl = `https://www.pricecharting.com/api/products?t=${PRICECHARTING_API_KEY}&q=${encodeURIComponent(searchQuery)}`;
    console.log('Search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    console.log('Search response:', JSON.stringify(searchData, null, 2));

    if (!searchData.products || searchData.products.length === 0) {
      console.log('No products found');
      return new Response(
        JSON.stringify({ error: 'Product not found on PriceCharting' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the best match by comparing product name, card number, and set
    let product = searchData.products[0];
    
    // Priority 1: Exact card number match (if provided)
    if (cardNumber) {
      const cardNumMatch = searchData.products.find((p: any) => {
        const pcName = p['product-name'].toLowerCase();
        // Match card number in format "#123" or just "123"
        const hasCardNum = pcName.includes(`#${cardNumber.toLowerCase()}`) || 
                          pcName.includes(` ${cardNumber.toLowerCase()} `) ||
                          pcName.endsWith(` ${cardNumber.toLowerCase()}`);
        const nameMatch = pcName.includes(productName.toLowerCase());
        return hasCardNum && nameMatch;
      });
      
      if (cardNumMatch) {
        product = cardNumMatch;
        console.log('Found exact card number match');
      }
    }
    
    // Priority 2: If no card number match, try name + set match
    if (!cardNumber || product === searchData.products[0]) {
      if (setName) {
        const exactMatch = searchData.products.find((p: any) => {
          const productNameMatch = p['product-name'].toLowerCase().includes(productName.toLowerCase());
          const setNameMatch = p['console-name'].toLowerCase().includes(setName.toLowerCase());
          return productNameMatch && setNameMatch;
        });
        
        if (exactMatch) {
          product = exactMatch;
          console.log('Found exact match with set name');
        }
      }
    }
    
    // If requesting ungraded/raw price, fetch it from PriceCharting
    if (gradingCompany.toLowerCase() === 'raw') {
      const priceUrl = `https://www.pricecharting.com/api/product?t=${PRICECHARTING_API_KEY}&id=${product.id}`;
      const priceResponse = await fetch(priceUrl);
      const priceData = await priceResponse.json();
      
      const ungradedPrice = priceData['loose-price'] || priceData['price'];
      
      console.log(`Raw/ungraded price: ${ungradedPrice}`);
      
      return new Response(
        JSON.stringify({ 
          ungradedPrice: ungradedPrice || null,
          productId: product.id,
          productName: product['product-name']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Map grading company and grade to PriceCharting field names for graded cards
    const gradeKey = `${gradingCompany.toLowerCase()}-${grade}`;
    
    // PriceCharting API field mappings for cards:
    const fieldMappings: { [key: string]: string } = {
      'psa-10': 'manual-only-price',
      'psa-9': 'graded-price',
      'psa-8': 'new-price',
      'psa-7': 'cib-price',
      'bgs-10': 'bgs-10-price',
      'bgs-9.5': 'box-only-price',
      'bgs-9': 'graded-price',
      'bgs-8.5': 'new-price',
      'bgs-8': 'new-price',
      'cgc-10': 'condition-17-price',
      'cgc-9.5': 'box-only-price',
      'cgc-9': 'graded-price',
      'cgc-8.5': 'new-price',
      'cgc-8': 'new-price',
    };

    const priceField = fieldMappings[gradeKey];
    
    if (!priceField) {
      console.log(`No mapping found for ${gradeKey}`);
      return new Response(
        JSON.stringify({ error: `Grade ${gradingCompany.toUpperCase()} ${grade} not available` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function to fetch and check if product has graded price
    const checkProductForGradedPrice = async (prod: any) => {
      const priceUrl = `https://www.pricecharting.com/api/product?t=${PRICECHARTING_API_KEY}&id=${prod.id}`;
      const priceResponse = await fetch(priceUrl);
      const priceData = await priceResponse.json();
      
      const ungradedPrice = priceData['loose-price'] || priceData['price'];
      const gradedPrice = priceData[priceField];
      
      return { priceData, ungradedPrice, gradedPrice };
    };

    // For graded cards, ONLY use the exact variant match - do NOT fall back to other variants
    // Different print types (Holo, Reverse Holo, etc.) have different graded values
    let productId = product.id;
    console.log(`Using exact product: ${productId} - ${product['product-name']} (${product['console-name']})`);

    const result = await checkProductForGradedPrice(product);
    const { priceData, ungradedPrice, gradedPrice } = result;

    if (!gradedPrice) {
      console.log(`No ${gradingCompany.toUpperCase()} ${grade} price available for this specific variant`);
      return new Response(
        JSON.stringify({ 
          error: `${gradingCompany.toUpperCase()} ${grade} price not available`,
          ungradedPrice: ungradedPrice || null,
          message: 'This specific card variant does not have graded pricing data'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        gradedPrice,
        ungradedPrice: ungradedPrice || null,
        productId,
        productName: product['product-name']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching graded prices:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});