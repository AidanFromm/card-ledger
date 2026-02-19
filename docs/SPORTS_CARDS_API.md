# Sports Cards API Integration

## Overview

CardLedger now supports sports cards (Baseball, Basketball, Football, Hockey, Soccer) alongside Pokémon/TCG cards.

## Data Sources

After researching available APIs, here's what's available and what we're using:

### Available APIs (Research Summary)

| API | Free Tier | Pricing Data | Card Database | Images | Status |
|-----|-----------|--------------|---------------|--------|--------|
| **SportsCardsPro** | No (Paid subscription) | ✅ Excellent | ✅ Large | ❌ No | Not integrated (requires paid subscription) |
| **COMC** | No public API | N/A | N/A | N/A | No API available |
| **PSA Card API** | Partial | ❌ No pricing | ✅ Cert lookup only | ❌ No | Cert verification only |
| **Card Ladder** | No public API | N/A | N/A | N/A | No API available |
| **130Point** | No public API | N/A | N/A | N/A | No API available |
| **Beckett** | No public API | N/A | N/A | N/A | Manual lookup only |
| **eBay Browse API** | ✅ Yes (with limits) | ✅ Current market | ✅ Listings | ✅ Yes | **Primary source** |
| **PriceCharting** | ✅ Limited free | ✅ Historical | ✅ Some sports | ❌ Limited | **Secondary source** |

### What We're Using

1. **eBay Browse API** (Primary)
   - Already have credentials configured
   - Provides real-time market prices from active listings
   - Includes card images
   - Free tier available (rate limited)

2. **PriceCharting API** (Secondary)
   - Provides historical pricing data
   - Covers many sports cards
   - Used as backup/supplemental data

3. **Manual Lookup URLs** (Fallback)
   - When automated pricing isn't available
   - Links to SportsCardsPro, Beckett, PSA, eBay sold

## Architecture

### Frontend (`src/lib/sportsCardsApi.ts`)

Main API client that provides:

```typescript
// Search for sports cards
searchSportsCards(query, options?)
  → { cards: SportsCardSearchResult[], totalCount, lookupUrls }

// Search by player specifically
searchByPlayer(playerName, options?)

// Search by card set/brand
searchBySet(brand, year?, sport?)

// Get pricing for a specific card
getCardPricing(cardName, options?)

// Get manual lookup URLs
getLookupUrls(query)

// Get brands for a sport
getBrandsForSport(sport)
```

### Backend (Supabase Edge Functions)

- `supabase/functions/sportscards-prices/` - Fetches from PriceCharting
- `supabase/functions/ebay-sold-prices/` - Fetches from eBay Browse API

## Supported Card Data

The following fields are captured for sports cards:

| Field | Description | Example |
|-------|-------------|---------|
| `player` | Player name | "LeBron James" |
| `team` | Team name | "Lakers" |
| `sport` | Sport type | "basketball" |
| `year` | Card year | 2023 |
| `brand` | Card brand | "Panini Prizm" |
| `number` | Card number | "#25" |
| `parallel` | Variant type | "Silver", "Auto" |
| `rookie` | Rookie card indicator | true/false |
| `graded` | Grading info | { company: "PSA", grade: "10" } |

## Supported Sports & Brands

### Sports
- ⚾ Baseball
- 🏀 Basketball
- 🏈 Football
- 🏒 Hockey
- ⚽ Soccer

### Brands (by sport)
- **Baseball**: Topps, Bowman, Topps Chrome, Bowman Chrome, Upper Deck
- **Basketball**: Panini Prizm, Select, Optic, Mosaic, NBA Hoops, Fleer
- **Football**: Panini Prizm, Select, Optic, Mosaic, Donruss, Score, Contenders
- **Hockey**: Upper Deck, O-Pee-Chee
- **Soccer**: Panini

## UI Integration

### CardSearchPanel (`src/components/addcard/CardSearchPanel.tsx`)

When category is set to "sports":
- Shows sport filter (Baseball, Basketball, Football, Hockey, Soccer)
- Shows brand filter (context-aware based on selected sport)
- Shows year filter
- Displays sports-specific badges (RC for rookie, grading info, parallel)
- Includes external lookup links

### AddItem (`src/pages/AddItem.tsx`)

- Sports card fields section (expandable)
- Auto-populated from search results
- Brand dropdown with common brands
- Rookie card toggle

## Environment Variables

Required in `.env` or Supabase secrets:

```env
# eBay API (already configured)
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=

# Optional - enables higher rate limits
PRICECHARTING_API_KEY=

# Optional - if you get a SportsCardsPro subscription
SPORTSCARDSPRO_API_KEY=
```

## Future Improvements

1. **SportsCardsPro Integration** - If budget allows, their API has excellent coverage
2. **Card Ladder** - Watch for API availability
3. **Image Recognition** - AI camera recognition for sports cards
4. **Price Alerts** - Alert when card hits target price
5. **Population Reports** - PSA/BGS population data integration

## API Rate Limits

- **eBay Browse API**: 5000 calls/day (free tier)
- **PriceCharting**: Varies by plan
- **Our caching**: 15 minutes for search results

## Usage Example

```typescript
import { searchSportsCards, getBrandsForSport } from '@/lib/sportsCardsApi';

// Search for a player
const results = await searchSportsCards("Patrick Mahomes", {
  sport: "football",
  year: 2023
});

// Get brands for basketball
const brands = getBrandsForSport("basketball");
// → [{ value: "prizm", label: "Panini Prizm", ... }, ...]

// Get lookup URLs for manual research
const urls = getLookupUrls("2023 Prizm Victor Wembanyama RC");
// → { sportscardspro: "...", beckett: "...", ebay: "...", ... }
```
