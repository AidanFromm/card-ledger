# CardLedger API Setup Guide

This guide explains how to set up all the pricing APIs for CardLedger's multi-source pricing engine.

## Overview

CardLedger uses multiple data sources for accurate pricing:

| API | Cost | Setup Required | Data Provided |
|-----|------|----------------|---------------|
| **Pokemon TCG API** | FREE | Optional API key | Card data + TCGPlayer prices |
| **Scrydex** | $99/mo | Already configured | Sealed products + graded cards |
| **eBay Browse API** | FREE | Required | Real market listings |
| **PSA Public API** | FREE | Required | Cert verification + population |
| **PriceCharting** | Varies | Optional | Sports cards + video games |

---

## 1. Pokemon TCG API (FREE)

**Already partially integrated - just needs optimization**

### Get API Key (Optional but Recommended)
1. Go to https://dev.pokemontcg.io/
2. Sign up for free account
3. Copy your API key

### Add to Supabase
```bash
# In Supabase Dashboard > Project Settings > Edge Functions > Secrets
POKEMON_TCG_API_KEY=your-api-key-here
```

### Benefits
- Higher rate limits (no key = 1000 req/day, with key = 20,000 req/day)
- TCGPlayer market prices for all Pokemon cards
- Price variants (holofoil, reverse holo, 1st edition)

---

## 2. eBay Browse API (FREE)

**Provides real market data from actual listings**

### Setup Steps

1. **Create eBay Developer Account**
   - Go to https://developer.ebay.com/
   - Click "Join" to create account
   - Verify your email

2. **Create Application**
   - Go to https://developer.ebay.com/my/keys
   - Click "Create a keyset"
   - Select "Production" environment
   - App Name: "CardLedger"
   - Copy the **App ID (Client ID)** and **Cert ID (Client Secret)**

3. **Add to Supabase Secrets**
   ```bash
   EBAY_CLIENT_ID=your-client-id-here
   EBAY_CLIENT_SECRET=your-client-secret-here
   ```

### API Limits (Free Tier)
- 5,000 calls/day
- Sufficient for most users

---

## 3. PSA Cert Verification API (FREE)

**Verify PSA graded cards and get population data**

### Setup Steps

1. **Register for PSA API Access**
   - Go to https://www.psacard.com/publicapi
   - Create account or sign in
   - Request API access (usually approved within 24 hours)

2. **Get API Credentials**
   - Once approved, you'll receive API key via email
   - Or find it in your PSA account dashboard

3. **Add to Supabase Secrets**
   ```bash
   PSA_API_KEY=your-psa-api-key-here
   ```

### Features Available
- Cert number verification
- Grade lookup
- Card details (year, brand, player)
- Population report data

---

## 4. PriceCharting API (For Sports Cards)

**Best source for sports card pricing**

### Setup Steps

1. **Get API Access**
   - Go to https://www.pricecharting.com/api-documentation
   - Sign up for API access
   - Choose plan (free tier available with limits)

2. **Add to Supabase Secrets**
   ```bash
   PRICECHARTING_API_KEY=your-api-key-here
   ```

### Pricing Tiers
- Free: Limited requests
- Basic ($30/mo): 10,000 requests/month
- Pro ($100/mo): Unlimited requests

---

## 5. Scrydex API (Already Configured)

**Your current primary source for sealed products**

### Current Configuration
Already set up with:
- `SCRYDEX_API_KEY`
- `SCRYDEX_TEAM_ID`

### Coverage
- Pokemon sealed products (booster boxes, ETBs)
- Some graded card pricing
- Limited individual card pricing

---

## Adding Secrets to Supabase

### Via Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** (gear icon)
3. Click **Edge Functions** in sidebar
4. Click **Manage Secrets**
5. Add each secret:
   - Name: `POKEMON_TCG_API_KEY`
   - Value: `your-key-here`
6. Repeat for each API key

### Via CLI

```bash
# Install Supabase CLI if not already
npm install -g supabase

# Login
supabase login

# Set secrets
supabase secrets set POKEMON_TCG_API_KEY=your-key-here
supabase secrets set EBAY_CLIENT_ID=your-client-id
supabase secrets set EBAY_CLIENT_SECRET=your-client-secret
supabase secrets set PSA_API_KEY=your-psa-key
supabase secrets set PRICECHARTING_API_KEY=your-pricecharting-key
```

---

## Deploy Edge Functions

After adding secrets, deploy the new edge functions:

```bash
cd "/Users/aidanfromm/Downloads/card ledger/cardledger-main"

# Deploy all functions
supabase functions deploy pokemon-tcg-prices
supabase functions deploy ebay-sold-prices
supabase functions deploy psa-cert-lookup
supabase functions deploy sportscards-prices
supabase functions deploy aggregate-prices

# Or deploy all at once
supabase functions deploy
```

---

## Testing the APIs

### Test Pokemon TCG API
```bash
curl -X POST https://vbedydaozlvujkpcojct.supabase.co/functions/v1/pokemon-tcg-prices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"query": "Charizard"}'
```

### Test Aggregate Prices
```bash
curl -X POST https://vbedydaozlvujkpcojct.supabase.co/functions/v1/aggregate-prices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"query": "Charizard ex", "category": "pokemon"}'
```

---

## Expected Response (Aggregate Prices)

```json
{
  "market_price": 45.50,
  "lowest_listed": 38.00,
  "confidence": 85,
  "sources": [
    { "source": "pokemon_tcg_api", "price": 44.00, "weight": 0.3 },
    { "source": "scrydex", "price": 48.00, "weight": 0.35 },
    { "source": "ebay", "price": 45.00, "weight": 0.25 }
  ],
  "source_count": 3,
  "price_range": { "low": 44.00, "high": 48.00 },
  "card_type": "pokemon"
}
```

---

## Priority Order for Setup

1. **Pokemon TCG API** (5 min) - Biggest impact, already partially working
2. **eBay Browse API** (15 min) - Real market validation
3. **PSA API** (10 min) - For graded card verification
4. **PriceCharting** (5 min) - For sports cards (if needed)

---

## Troubleshooting

### "API not configured" error
- Check that secrets are added correctly in Supabase
- Redeploy the edge function after adding secrets

### Rate limit errors
- Pokemon TCG: Add API key for higher limits
- eBay: Stay under 5,000 calls/day
- Use caching to reduce API calls

### No prices returned
- Some cards may not have pricing data
- Check that the search query matches card names exactly
- Try searching by set name + card number

---

## Cost Summary

| API | Monthly Cost | Annual Cost |
|-----|--------------|-------------|
| Pokemon TCG API | $0 | $0 |
| eBay Browse API | $0 | $0 |
| PSA API | $0 | $0 |
| Scrydex | $99 | $1,188 |
| PriceCharting (optional) | $0-100 | $0-1,200 |
| **Total** | **$99-199** | **$1,188-2,388** |

---

## Next Steps

1. Set up the free APIs first (Pokemon TCG, eBay, PSA)
2. Test each endpoint
3. Update the search function to use aggregate pricing
4. Add confidence scores to the UI
5. Build historical price tracking (Phase 2)
