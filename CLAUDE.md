# CardLedger - Project Memory

## What is CardLedger?
CardLedger is a mobile-first app for **collectors and resellers** to track collectibles (sports cards, Pokemon, trading cards), manage inventory, enable easy importing, and view portfolio analytics. Primary target is **iOS App Store launch**.

## Target Users
- **Collectors**: Track personal collection value, see portfolio growth
- **Resellers/Vendors**: Track inventory, cost basis, profit/loss, FIFO accounting
- **Sports card enthusiasts**: Not just Pokemon/TCG - also sports cards

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Radix UI + Tailwind CSS + Framer Motion
- **State/Data**: TanStack React Query
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Mobile**: Capacitor 7 for iOS/Android native apps
- **Offline**: IndexedDB via custom cache.ts wrapper
- **Virtualization**: @tanstack/react-virtual for large lists
- **CSV**: papaparse for import/export
- **Barcode Scanning**: @capacitor-mlkit/barcode-scanning v7.5.0

## Supabase Project (NEW - February 2026)
- **Project ID**: vbedydaozlvujkpcojct
- **URL**: https://vbedydaozlvujkpcojct.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZWR5ZGFvemx2dWprcGNvamN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjg5MjIsImV4cCI6MjA4NTY0NDkyMn0.dkF1RBdAOCqQIOHbF04o6bcit6L9vlLWz98Wo5VE-dc
- **Support Email**: cardledger.llc@gmail.com
- **Previous Project**: gcxgpqrszcwwnrxwbwfu (deprecated)

### API Keys (for Edge Function Secrets)
- **POKEMON_TCG_API_KEY**: d4cd202b-25d1-4ddd-abc1-bfb6064f7b2f
- **TAVILY_API_KEY**: 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
- **PSA_API_KEY**: nVNpWjd4eH-3HHvET3awSfgPF1gWOpPLHvw-5aBjW6fvjJk1p3nUR0k2mTauz3KdkvCDifrDONy3tWhN-KVNsRvmh5GhpUdJ8fMUZkH1JiSvKjGEOb7CnkFz0cWbB_0g9-qRhK-7e9aEi7DggDvwaXDNL4hvJZxzpVdeKN3FNvxAfXCWCq53Rx5LIruaLmOvUa1Gl_XTQAgC-NsL7LOvUr_Y9FimD_Qvo8T-gYsEK86ZWaZAQryXL3MUOfEkb_VrRG-pa75tWPRGvuTlmzjQ2k05Ufu4rjhmaSE5RqoGDGEOgyxo
- **SCRYDEX_API_KEY**: b7891ddad6f669b4cf23c4424e958e476a8286a7e572527c8bc625d866c82a76
- **SCRYDEX_TEAM_ID**: cardledger
- **GMAIL_APP_PASSWORD**: qzlk wbnw uies amkh (for SMTP - not recommended)
- **RESEND_API_KEY**: re_4Ype946q_6w9Nva9jAxDFLej8ddJXZqkD (recommended for transactional emails)

### Database Schema Features
The new database includes:
- 6+ tables: profiles, inventory_items, purchase_entries, sales, watchlist, client_lists, products, search_cache
- grading_company ENUM: raw, psa, bgs, cgc, sgc, ace, tag
- sport_type ENUM: baseball, basketball, football, hockey, soccer, other
- scan_source_type ENUM: manual, barcode, ai_vision, import
- 20+ performance indexes including pg_trgm trigram indexes
- Row Level Security (RLS) on all tables
- Auto-updating timestamps triggers
- Auto-create profile on user signup
- Watchlist 25-item limit enforcement trigger
- FIFO tracking via purchase_entries table
- Full-text search (tsvector) on products table

## Business Model (Planned)
- **Free Trial**: 7 days, full features
- **Personal**: $4.99/month - Advanced analytics, price alerts, priority support
- **Business**: $14.99/month - Unlimited client lists, bulk import, API access, team features

---

## SEARCH ENGINE ARCHITECTURE (February 2026 Rewrite)

### Overview
The search system uses a multi-source aggregation approach with automatic sports card detection and Tavily AI as a universal fallback.

### Search Flow
```
Frontend (ScanCard.tsx)
        │
        │ 500ms debounce
        ▼
products-search Edge Function
        │
        ├─► TCG Type Detection (detectTCGType)
        │         │
        │         ├─► one_piece  → Dedicated One Piece Search (Tavily)
        │         ├─► yugioh     → Tavily with YGO domains
        │         ├─► magic      → Tavily with MTG domains
        │         └─► pokemon    → Pokemon TCG API + Scrydex
        │
        ├─► Sports Detection Algorithm
        │         │
        │         ├─► isSports: true  → Tavily Sports Search
        │         └─► isSports: false → (use TCG detection above)
        │
        ├─► Local DB Search (always)
        │
        └─► No images in results? → Universal Tavily Fallback
                                      │
                                      ▼
                              Merge + Dedupe + Sort
                                      │
                                      ▼
                              Return max 50 results
                              (cached for 6 hours)
```

### TCG Type Detection (NEW - February 2026)
Located in `products-search/index.ts`:
```typescript
function detectTCGType(query: string): { tcgType: string; confidence: number }
```

**Supported TCGs**:
| TCG | Detection Keywords | Search Method |
|-----|-------------------|---------------|
| One Piece | luffy, zoro, nami, sanji, op-01, romance dawn, etc. | Dedicated Tavily search |
| Yu-Gi-Oh | yu-gi-oh, dark magician, blue eyes, exodia | Tavily with YGO domains |
| Magic | mtg, planeswalker, magic the gathering | Tavily with MTG domains |
| Pokemon | pikachu, charizard, pokemon | Pokemon TCG API + Scrydex |
| Sports | Player/team names, RC, Prizm, Topps | Tavily Sports Search |

**One Piece Character Detection**:
- Straw Hats: Luffy, Zoro, Nami, Sanji, Usopp, Chopper, Robin, Franky, Brook, Jinbe
- Villains/Others: Shanks, Ace, Whitebeard, Kaido, Big Mom, Blackbeard, Law
- Sets: OP01-OP08, Romance Dawn, Paramount War, etc.

### Sports Detection Algorithm
Located in `products-search/index.ts`:
```typescript
function detectSportsQuery(query: string): {
  isSports: boolean;
  confidence: number;
  detectedTerms: string[]
}
```

**Detection signals** (weighted):
- Player names: Tom Brady, LeBron James, Shohei Ohtani, etc.
- Team names: Patriots, Lakers, Yankees, etc.
- Brands: Topps, Panini, Prizm, Donruss, etc.
- Keywords: RC, rookie, auto, /99, /25, etc.
- Sports: baseball, basketball, football, hockey, soccer

**Threshold**: Confidence > 40 triggers sports mode

### API Sources

| Source | When Used | Timeout | Cost |
|--------|-----------|---------|------|
| Local DB (products table) | Always | 2000ms | Free |
| Pokemon TCG API | Pokemon queries only | 3000ms | Free |
| Scrydex | Pokemon queries only | 3000ms | $99/mo |
| Tavily (One Piece) | One Piece queries | 4000ms | ~$1/1000 |
| Tavily (Other TCG) | Yu-Gi-Oh, MTG, etc. | 4000ms | ~$1/1000 |
| Tavily (Sports) | Sports queries | 4000ms | ~$1/1000 |
| Tavily (Fallback) | No images in results | 5000ms | ~$1/1000 |

### Tavily Sports Search Features
- Searches: eBay, COMC, 130point, PSACard
- Returns images via `include_images: true`
- Extracts prices from text using regex
- Uses MEDIAN price (not average) for accuracy
- Filters out years (1990-2030), shipping costs, outliers

### Result Deduplication
Products are deduplicated by name similarity (70% threshold) to prevent multiple entries for same card.

### Caching
- Cache table: `search_cache`
- TTL: 6 hours
- Key: MD5 hash of query
- Invalidated on: TTL expiry

### "Reveal AI Price" Button
Located in `AddToInventoryDialog.tsx`:
- Shows when market price is "Not available"
- Calls `ai-price-search` edge function
- Displays AI summary with "(AI Est.)" label
- **Issue**: Requires `--no-verify-jwt` flag when deploying function

---

## API Integrations

### Current APIs (Configured & Active)
| API | Cost | Status | Secret Name |
|-----|------|--------|-------------|
| **Pokemon TCG API** | FREE | ✅ Active | `POKEMON_TCG_API_KEY` |
| **Tavily AI Search** | ~$1/1000 searches | ✅ Active | `TAVILY_API_KEY` |
| **Scrydex** | $99/mo | ✅ Active | `SCRYDEX_API_KEY`, `SCRYDEX_TEAM_ID` |
| **eBay Browse API** | FREE | ⏳ Pending approval | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` |
| **PSA Public API** | FREE | ✅ Configured | `PSA_API_KEY` |
| **Ximilar** | Free 3000/mo | ⏳ Needs setup | `XIMILAR_API_KEY` |

### OAuth Providers (Need Supabase Config)
| Provider | Status | Notes |
|----------|--------|-------|
| **Apple Sign In** | ⏳ Needs config | Required for iOS App Store |
| **Google Sign In** | ⏳ Needs config | Recommended for convenience |

### API Details

**Pokemon TCG API** (FREE - 20,000 req/day with key)
- Provides TCGPlayer market prices for Pokemon cards
- Price variants: holofoil, reverseHolofoil, normal
- Edge function: `pokemon-tcg-prices`
- Docs: https://dev.pokemontcg.io/

**Tavily AI Search** (1,000 free searches/month)
- AI-powered web search for real-time pricing
- Searches TCGPlayer, eBay, PriceCharting, 130point, PSACard, mavin.io
- Uses MEDIAN price calculation (not average)
- Filters outliers (years 1990-2030, prices < $0.50, > $50,000)
- Returns images when `include_images: true`
- Edge functions: `ai-price-search`, `products-search` (fallback)
- Docs: https://tavily.com

**Scrydex** ($99/mo)
- Primary source for sealed products (booster boxes, ETBs)
- **LIMITATION**: Only returns prices for sealed products, NOT individual cards
- Edge functions: `scrydex-price`, `products-search`

**eBay Browse API** (FREE - 5,000 calls/day)
- Real market listings and sold prices
- OAuth authentication required
- Edge function: `ebay-sold-prices`
- Status: Awaiting developer account approval

### Edge Functions (Supabase)
```
supabase/functions/
├── products-search/        # Main unified search (REWRITTEN Feb 2026)
│                           #   - Sports auto-detection
│                           #   - Parallel API calls with timeouts
│                           #   - Tavily universal fallback
│                           #   - 6-hour caching
├── ai-price-search/        # Tavily AI price discovery (IMPROVED Feb 2026)
│                           #   - MEDIAN price calculation
│                           #   - Better domain filtering
│                           #   - Outlier filtering
├── record-price-snapshots/ # Daily price history recording (NEW Feb 2026)
│                           #   - Records snapshots to price_history table
│                           #   - Refreshes ~10% of prices per run
│                           #   - Runs cleanup for old records
│                           #   - ⚠️ REQUIRES: Deploy + schedule via pg_cron
├── pokemon-tcg-prices/     # Pokemon TCG API integration
├── aggregate-prices/       # Multi-source price aggregation
├── ebay-sold-prices/       # eBay market listings (pending)
├── psa-cert-lookup/        # PSA cert verification
├── sportscards-prices/     # Legacy sports card pricing
├── scrydex-price/          # Direct Scrydex queries (FIXED Feb 2026 - timeout protection)
├── search-products/        # Legacy search
├── barcode-lookup/         # UPC barcode lookup (Phase 4)
└── ximilar-recognize/      # AI card recognition (Phase 4)
```

---

## Database Schema (Key Tables)

### inventory_items
Main inventory table with sports card fields (Phase 4):
```sql
id, user_id, name, set_name, card_number, grading_company, grade,
quantity, purchase_price, market_price, lowest_listed, image_url, notes,
-- Sports card fields (Phase 4)
player TEXT,
team TEXT,
sport sport_type,  -- baseball, basketball, football, hockey, soccer, other
year INTEGER,
brand TEXT,
rookie BOOLEAN DEFAULT false,
-- Scanning fields (Phase 4)
barcode TEXT,
scan_source scan_source_type DEFAULT 'manual',  -- manual, barcode, ai_vision, import
created_at, updated_at
```

### products
Search results cache with full-text search:
```sql
id, name, set_name, card_number, image_url, market_price, rarity,
subtypes, artist, pokemon_tcg_id, category,
-- Sports fields
player TEXT, team TEXT, sport TEXT, year INTEGER, brand TEXT, rookie BOOLEAN,
-- Search optimization
search_text TEXT,  -- Concatenated searchable fields (auto-updated via trigger)
fts_vector tsvector  -- Full-text search vector (auto-updated via trigger)
```

### search_cache
Query result caching:
```sql
id, query_hash TEXT UNIQUE, query TEXT, results JSONB,
result_count INTEGER, created_at, expires_at (6 hours TTL)
```

### price_history (NEW - February 2026)
Price tracking for portfolio P&L analysis:
```sql
id, inventory_item_id (FK), item_name, set_name, grading_company, grade,
market_price, lowest_listed, price_source, recorded_at, recorded_date
-- Indexes: item_date, recorded_date
-- RLS: Users view own item history only
-- Retention: 90 days daily → weekly → monthly snapshots
```

### client_lists
Shareable inventory lists:
```sql
id, user_id, list_name, notes, share_token, created_at, updated_at
-- Note: Columns renamed from 'name'→'list_name', 'description'→'notes' (Feb 2026)
```

### Other Tables
- `sales`: Track sold items for profit/loss
- `purchase_entries`: Track individual purchases for FIFO
- `client_list_items`: Items in shareable lists (FK to client_lists)
- `watchlist`: Cards user wants to buy (25 item limit)
- `profiles`: User profile data

---

## CSV Import System (REWRITTEN February 2026)

### Intelligent Column Detection (`src/lib/csvIntelligence.ts`)

**CSV Intelligence v2** - Complete rewrite for robust column detection:

**Detection Priority Order:**
1. **Exact Header Match** (confidence: 1.0) - Direct mapping from header name to column type
2. **Pattern Match** (confidence: 0.95) - Prefix matching (e.g., "Market Price (As of...)")
3. **Data Analysis** (confidence: 0.7) - Analyze sample data when header unknown

**Key Fix (February 3, 2026):** Card numbers showing as "#0.0000" was caused by data pattern analysis overriding header detection. Fixed by making exact header matching highest priority.

This allows importing from ANY CSV format regardless of column order or naming.

### Detected Column Types
| Type | Example Headers | Data Patterns |
|------|-----------------|---------------|
| `card_name` | name, product name, card, title | Text 2-80 chars, starts uppercase |
| `set_name` | set, expansion, series | Text 3-60 chars, contains set keywords |
| `card_number` | number, #, card no | `146/132`, `#146`, `SV146`, `TG15/TG30` |
| `quantity` | qty, quantity, count | Integer 1-1000 |
| `purchase_price` | cost, price, paid | `$5.99`, `5.99`, `$1,234.56` |
| `market_price` | market price, value | Same as purchase_price |
| `rarity` | rarity | common, rare, illustration rare, etc. |
| `condition` | condition | NM, LP, MP, HP, mint, near mint |
| `grading_company` | grader, grading | PSA, BGS, CGC, SGC, raw |
| `grade` | grade, score | 10, 9.5, PSA 10 |

### Card Matching Engine (`src/lib/cardMatcher.ts`)

Multi-signal weighted scoring system:

| Signal | Max Points | Description |
|--------|------------|-------------|
| Name Exact | 40 | Normalized names match exactly |
| Name Contains | 30 | One name contains the other |
| Name Fuzzy | 25 | Levenshtein similarity > 80% |
| Set Exact | 30 | Normalized set names match |
| Set Contains | 20 | One set contains the other |
| Number Exact | 35 | Card numbers match (after normalization) |
| Rarity Match | 10 | Rarity types match |

**Bonuses:**
- Name+Set+Number all match: +20 points
- Name+Number match: +15 points
- Name+Set match: +10 points

**Minimum score:** 25 points required for a match

### Card Number Normalization
```
"146/132" → "146"
"#146" → "146"
"SV146" → "SV146"
"TG15/TG30" → "TG15"
```

### Background Image Matching

After import, the system:
1. Groups items by name+set+number
2. Searches products-search edge function (uses Scrydex, Pokemon TCG API, Tavily)
3. Scores all results using multi-signal matching
4. Applies best match's image if score >= 25

Console output shows detailed matching:
```
[1/125] Matching: "Marshadow" | Set: "Mega Evolution" | #146/132
  📊 Found 15 results with images
  ✅ MATCH [perfect] Score: 105 (name:40 set:30 num:35)
     → "Marshadow" | Mega Evolution | #146
```

### Batch Image Fetch (Inventory Page)

Click the **"Images"** button on Inventory page to batch-fetch images:
1. Finds all items without `card_image_url`
2. Groups by name+card_number to avoid duplicate API calls
3. Calls products-search for each unique card
4. Matches by card number (50 pts) + set name (30 pts) + name (20 pts)
5. Updates all matching items in database
6. Shows progress bar with "X found" counter
7. Auto-refreshes inventory grid when complete

### Auto-Fetch in Item Detail

When opening an item without an image:
1. Automatically searches products-search
2. Scores results by card number and set match
3. Saves best match image to database
4. Refreshes inventory grid
5. Click placeholder to manually retry if needed

### Category Handling
- Only explicit `sealed` in CSV sets category to sealed
- `graded` if grading_company is not "raw"
- Default: `raw`
- **Auto-detection removed** - categories are no longer guessed from product names

---

## Image Upgrade System (February 3, 2026)

### Problem Solved
Cards like "Bulbasaur (Mega Evolution Stamped) #133/132" now match "Bulbasaur #133" from the API because:
1. Parenthetical content `(Mega Evolution Stamped)` is stripped
2. Card number matching is prioritized as PRIMARY filter
3. Multiple search variations are tried automatically

### Card Name Utilities (`src/lib/cardNameUtils.ts`)

```typescript
// Strip parenthetical and bracket content
cleanCardName("Pikachu (Mega Evolution Stamped)") → "Pikachu"
cleanCardName("ETB [Glaceon/Vaporeon]") → "ETB"

// Extract base name (first 1-2 words)
getBaseName("Bulbasaur (Mega Evolution Stamped)") → "Bulbasaur"

// Normalize card numbers for comparison
normalizeCardNumber("133/132") → "133"
normalizeCardNumber("#133") → "133"
normalizeCardNumber("SV133") → "133"
normalizeCardNumber("TG15/TG30") → "15"

// Check if two card numbers match
cardNumbersMatch("133/132", "133") → true
cardNumbersMatch("SV133", "133") → true

// Get placeholder image based on item type
getPlaceholderForItem({ category: 'sealed' }) → '/placeholders/sealed-product.svg'
getPlaceholderForItem({ grading_company: 'psa' }) → '/placeholders/graded-slab.svg'
getPlaceholderForItem({ grading_company: 'raw' }) → '/placeholders/pokemon-card.svg'
```

### Search Strategy
When fetching images, the system tries multiple search variations in order:
1. `"CleanedName CardNumber"` (e.g., "Bulbasaur 133")
2. `"BaseName CardNumber"` (e.g., "Bulbasaur 133")
3. `"BaseName SetName"` (e.g., "Bulbasaur Mega Evolution")
4. `"CleanedName"` (e.g., "Bulbasaur")
5. `"BaseName"` (e.g., "Bulbasaur")
6. Original name as fallback

### Card Number Priority
When results are found, card number match is the PRIMARY filter:
1. Filter results to only those with matching card numbers
2. If matches found, score ONLY within those matches
3. If no number matches, fall back to all results
4. Score by: name match (25pts) + set match (30pts) + card number (50pts)

### Branded Placeholders
Located in `public/placeholders/`:
- `pokemon-card.svg` - Gray card silhouette with Pokeball watermark
- `graded-slab.svg` - PSA-style slab outline with "10" grade
- `sealed-product.svg` - Box silhouette with sparkles

---

## Completed Features

### Phase 1 - iOS Launch Readiness
- [x] SGC and TAG grading companies added
- [x] iOS Privacy Manifest (PrivacyInfo.xcprivacy)
- [x] Duplicate detection when adding items
- [x] Virtualized inventory list for performance
- [x] Offline caching with IndexedDB
- [x] Offline indicator component

### Phase 2A - Scrydex API Integration
- [x] useScrydexPricing hook for live pricing
- [x] Refresh prices button in inventory
- [x] Batch price updates with progress indicator
- [x] Price change indicators on cards

### Phase 2B - Portfolio Analytics
- [x] Dashboard with multiple chart types (Area, Pie, Bar)
- [x] Portfolio allocation by grading company
- [x] Grade distribution visualization
- [x] Time range filtering (7D, 1M, 3M, 6M, 1Y, ALL)
- [x] Performance metrics (win rate, avg profit, margin, ROI)
- [x] FIFO cost basis calculation utilities

### Phase 2D - Import/Export
- [x] CSV export of inventory
- [x] CSV import with validation
- [x] Template download
- [x] Import preview before confirmation
- [x] JSON backup/restore
- [x] **External format support** (TCGPlayer, Scrydex Portfolio exports)
- [x] Comprehensive column mapping for external formats
- [x] Auto-detect CSV format and display to user
- [x] Category auto-detection (raw/graded/sealed from product name)
- [x] Tested with 1,963 items import ($85,524.50 value)

### Phase 3 - iOS Premium UI Overhaul
- [x] Glassmorphism card and component styles
- [x] 5-tab navigation: Search, Inventory, Analytics, Sales, Profile
- [x] Search/Scan as hero home screen (primary tab)
- [x] Quick actions grid on home screen
- [x] iOS-style segmented controls for filters
- [x] Premium stat cards with glassmorphism
- [x] ThemeProvider for dark/light mode toggle
- [x] Very rounded corners (20-24pt iOS 18 style)
- [x] SF Pro font stack
- [x] 44pt minimum tap targets
- [x] Confetti celebrations for valuable cards ($100+)
- [x] Watchlist feature (25 item limit)
- [x] iOS Safe Area support for Dynamic Island/notch

### Phase 3.5 - Search & Sales Improvements (February 2026)
- [x] Search filter chips (Category: All/Raw/Sealed, Set filter)
- [x] Client-side filtering of search results
- [x] Sales page profit over time chart (Recharts AreaChart)
- [x] Sales page best sellers section with rankings
- [x] Time range selector for sales analytics
- [x] Multi-source pricing engine with weighted aggregation
- [x] AI-powered price search via Tavily API
- [x] Pokemon TCG API integration for TCGPlayer prices

### Phase 3.6 - UI Polish & Profile Overhaul (February 2026)
- [x] Splash Screen Redesign (glassmorphism, auto-navigate)
- [x] Auth Screen Overhaul (tabbed, Apple/Google buttons)
- [x] Profile Page with Slide-in Sheets
- [x] UI Consistency Improvements

### Phase 4 - Sports Cards & Scanning (February 2026) - IN PROGRESS
- [x] Database migration for sports fields (`20260202_phase4_sports_scanning.sql`)
- [x] Database migration for search indexes (`20260202_fast_search_indexes.sql`)
- [x] Products table created with all required fields
- [x] pg_trgm extension enabled for fuzzy matching
- [x] Full-text search (tsvector) on products
- [x] Search cache table created
- [x] `products-search` edge function REWRITTEN
  - [x] Sports auto-detection algorithm
  - [x] Parallel API calls with timeouts
  - [x] Tavily universal fallback
  - [x] 6-hour caching
  - [x] 50 result limit
  - [x] Deduplication by name similarity
- [x] `ai-price-search` edge function IMPROVED
  - [x] MEDIAN price calculation
  - [x] Better domain filtering
  - [x] Outlier filtering
- [x] "Reveal AI Price" button in AddToInventoryDialog
- [x] ScanCard.tsx updated with AI Scanner + Barcode buttons
- [x] Routes added for /scan/ai and /scan/barcode
- [x] Capacitor 7 compatibility
- [x] @capacitor-mlkit/barcode-scanning v7.5.0 installed
- [x] **Search improvements deployed** (February 2026)
  - [x] Abbreviation expansion (ETB, BB, RC, FA, SR, PSA, etc.)
  - [x] Phonetic matching for typos (Charazard → Charizard)
  - [x] Word-order-independent token matching
  - [x] Smart deduplication with quality scoring
  - [x] Placeholder images for missing images in search results
- [x] **"Reveal AI Price" 401 error FIXED** (deployed with --no-verify-jwt)
- [x] **InventoryCard image placeholders** for cards without images
  - [x] Consistent card heights with placeholder area
  - [x] Package icon for sealed products
  - [x] ImageOff icon for regular cards
- [x] **ItemDetailDialog improvements** for imported items
  - [x] Graceful handling of missing condition field
  - [x] Better "No purchase history" UI for imported items
  - [x] Placeholder images in detail view
  - [x] **Edit item fields** (quantity, purchase price, market price)
  - [x] **Auto-fetch images** from Pokemon TCG API for items without images
  - [x] Fixed quantity/price display to use item values when no purchase entries
- [x] **Bottom nav highlight alignment** fixed (proper centering behind icon/label)
- [x] **One Piece TCG Support** (February 2026)
  - [x] TCG type detection function (detectTCGType)
  - [x] Dedicated One Piece search via Tavily
  - [x] Character name detection (Luffy, Zoro, Nami, etc.)
  - [x] Set detection (OP01-OP08, Romance Dawn, etc.)
  - [x] Image search from TCGPlayer, CardMarket, TCGRepublic
  - [x] Background image fetch improvements for One Piece imports
- [x] **Multi-TCG Support**
  - [x] Yu-Gi-Oh detection and search
  - [x] Magic: The Gathering detection and search
  - [x] Digimon, Lorcana, Weiss Schwarz detection
- [x] **Batch Image Fetch** (February 3, 2026)
  - [x] "Images" button on Inventory page
  - [x] Progress bar showing current/total and images found
  - [x] Groups items by name+number to avoid duplicate API calls
  - [x] Card number matching for accurate image selection
  - [x] Auto-refresh inventory grid after images saved
- [x] **Smart Image Fetch in ItemDetailDialog**
  - [x] Auto-fetches image when opening item without image
  - [x] Uses products-search edge function (cached, multiple sources)
  - [x] Clickable placeholder to manually trigger fetch
  - [x] Card number scoring for best match selection
  - [x] Refreshes inventory after saving image
- [x] **CSV Column Detection Fix** (February 3, 2026)
  - [x] Card numbers now display correctly as "146/132" instead of "#0.0000"
  - [x] Exact header matching takes priority over data pattern analysis
  - [x] Proper handling of TCGPlayer/Collectr export format
- [x] **Image Upgrade System** (February 3, 2026)
  - [x] `src/lib/cardNameUtils.ts` - Shared name cleaning utilities
  - [x] `cleanCardName()` - Strips parenthetical `()` and bracket `[]` content
  - [x] `getBaseName()` - Extracts first 1-2 words for Pokemon name
  - [x] `normalizeCardNumber()` - Normalizes card numbers (133/132 → 133, SV133 → 133)
  - [x] `cardNumbersMatch()` - Compares normalized card numbers
  - [x] `getPlaceholderForItem()` - Returns appropriate placeholder based on item type
  - [x] ItemDetailDialog: Always cleans names, tries multiple search variations
  - [x] ItemDetailDialog: Card number is PRIMARY filter (only matches same number first)
  - [x] useBackgroundImageFetch: Same smart name cleaning and matching
  - [x] Branded placeholder SVGs in `public/placeholders/`:
    - [x] `pokemon-card.svg` - Pokeball watermark for raw cards
    - [x] `graded-slab.svg` - PSA-style slab for graded cards
    - [x] `sealed-product.svg` - Box with sparkles for sealed products
  - [x] InventoryCard: Uses branded placeholders instead of icons
  - [x] **Result**: Cards like "Bulbasaur (Mega Evolution Stamped) #133" now match API results
- [x] **Price History Infrastructure** (February 3, 2026)
  - [x] `price_history` table migration (`20260204_price_history.sql`)
  - [x] `record-price-snapshots` edge function for daily snapshots
  - [x] `usePriceHistory` hook for fetching item price history
  - [x] Helper functions: `get_latest_prices_for_user()`, `get_yesterday_portfolio_value()`, `get_item_price_history()`
  - [x] Retention cleanup: 90 days daily → weekly → monthly
  - [ ] ⚠️ **NOT YET ACTIVE**: Requires deploy + pg_cron schedule
- [x] **Bug Fixes** (February 3, 2026)
  - [x] Fixed client_lists column mismatch (`name`→`list_name`, `description`→`notes`)
  - [x] Fixed sealed items appearing in Raw filter (added `category !== 'sealed'` check)
  - [x] Fixed inventory card grid alignment (`items-stretch` instead of `items-start`)
  - [x] Fixed filter buttons too wide (reduced padding: `px-3 py-2`)
  - [x] Fixed badge row wrapping causing height issues (removed `flex-wrap`)
  - [x] Fixed graded cards not fetching images (removed skip logic)
  - [x] Fixed scrydex-price edge function CORS/502 errors (added timeout protection)
  - [x] Made ItemDetailDialog more compact (reduced padding, 3-column grid)
  - [x] Added draggable Quick Sell slider (80%/90%/100% with track and ball)
- [ ] BarcodeScanner.tsx component (needs implementation)
- [ ] AIScanner.tsx component (needs implementation)
- [ ] ScanBarcode.tsx page (needs implementation)
- [ ] ScanAI.tsx page (needs implementation)
- [ ] Sports card UI fields in AddItem.tsx
- [ ] Rookie badge in InventoryCard.tsx
- [ ] Sport filter chips in Inventory.tsx
- [ ] iOS Info.plist camera permission
- [ ] Ximilar API integration (needs API key)

---

## Design System
- **Primary Color**: Blue (#0074fb)
- **Feel**: Premium/Luxury
- **Theme**: Both dark & light with toggle (default: dark)
- **Corners**: Very rounded (20-24pt) - `rounded-2xl`, `rounded-3xl`
- **Surfaces**: Glassmorphism (`glass-card`, `glass-nav`)
- **Motion**: Smooth Framer Motion animations
- **Typography**: SF Pro / Inter font stack
- **Empty States**: Encouraging tone ("Ready to..." not "No items yet")
- **Loading States**: Always show text label with spinner

---

## Project Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── InventoryCard.tsx      # Card display with animations
│   ├── VirtualizedInventoryGrid.tsx
│   ├── OfflineIndicator.tsx
│   ├── PageTransition.tsx     # Framer motion transitions
│   ├── EmptyState.tsx         # Empty state components
│   ├── SwipeableCard.tsx      # Swipe gestures
│   ├── PullToRefresh.tsx      # Pull to refresh
│   ├── ImportExportDialog.tsx # CSV import/export
│   ├── AddToInventoryDialog.tsx # Add card dialog with AI price button
│   ├── Navbar.tsx             # Desktop nav with animations
│   └── BottomNav.tsx          # iOS-style floating nav
├── hooks/
│   ├── useInventoryDb.ts      # Main inventory CRUD + caching
│   ├── useScrydexPricing.ts   # Live price updates from API
│   └── useWatchlist.ts        # Watchlist management
├── pages/
│   ├── Index.tsx              # Splash/loading screen
│   ├── Auth.tsx               # Sign in/up
│   ├── Dashboard.tsx          # Portfolio analytics
│   ├── Inventory.tsx          # Card grid + filters
│   ├── AddItem.tsx            # Add cards
│   ├── ScanCard.tsx           # Search/scan home (AI + Barcode buttons)
│   ├── ScanBarcode.tsx        # Barcode scanner page (needs impl)
│   ├── ScanAI.tsx             # AI scanner page (needs impl)
│   ├── Sales.tsx              # Sales tracking
│   └── Profile.tsx            # Settings
├── lib/
│   ├── cache.ts               # IndexedDB offline caching
│   ├── csv.ts                 # CSV import/export utilities
│   ├── csvIntelligence.ts     # Smart CSV column detection
│   ├── cardMatcher.ts         # Multi-signal card matching
│   ├── cardNameUtils.ts       # Name cleaning & card number normalization
│   ├── analytics.ts           # FIFO, ROI, metrics
│   └── utils.ts
supabase/
├── functions/                  # Edge functions
├── migrations/
│   ├── 20260202_phase4_sports_scanning.sql
│   ├── 20260202_fast_search_indexes.sql
│   ├── 20260204_price_history.sql          # Price history table + functions
│   └── 20260204_fix_client_lists_columns.sql  # Column renames + client_list_items
ios/                            # Capacitor iOS app
```

---

## Commands
```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Build for production
npx cap sync ios     # Sync Capacitor for iOS
npx cap open ios     # Open Xcode

# Deploy edge function (with public access for AI price)
supabase functions deploy ai-price-search --no-verify-jwt

# Deploy edge function (standard)
supabase functions deploy products-search
supabase functions deploy record-price-snapshots
supabase functions deploy scrydex-price

# Run price snapshots manually (to populate initial data)
curl -X POST https://vbedydaozlvujkpcojct.supabase.co/functions/v1/record-price-snapshots \
  -H "Authorization: Bearer <ANON_KEY>"
```

---

## Known Issues & Pending Fixes

### ~~"Reveal AI Price" Button 401 Error~~ ✅ FIXED
**Status**: Resolved on February 2, 2026
**Solution**: Deployed with `--no-verify-jwt` flag via `npx supabase functions deploy ai-price-search --no-verify-jwt`

### Ximilar Not Configured
**Issue**: AI card recognition not working.
**Fix**: Sign up at https://ximilar.com and add `XIMILAR_API_KEY` to Supabase secrets.

### eBay API Pending
**Issue**: eBay Browse API requires developer account approval.
**Status**: Waiting for approval.

### OAuth Not Configured
**Issue**: Apple and Google sign-in buttons are in UI but providers not configured in Supabase.
**Fix**: Configure OAuth providers in Supabase Dashboard.

### Price History Not Showing Data
**Issue**: Price history chart shows "Tracking started" but no data.
**Cause**: The `record-price-snapshots` edge function hasn't been deployed/scheduled.
**Fix**:
1. Apply migration: Run `20260204_price_history.sql` in Supabase SQL Editor
2. Deploy function: `supabase functions deploy record-price-snapshots`
3. Run manually once: `curl -X POST https://vbedydaozlvujkpcojct.supabase.co/functions/v1/record-price-snapshots -H "Authorization: Bearer <ANON_KEY>"`
4. (Optional) Schedule daily via pg_cron in Supabase Dashboard

---

## Session Resume Checklist

1. **Current Priority**: Phase 4 completion - Scanner Implementation
   - [x] ~~Fix "Reveal AI Price" 401 error~~ ✅ DONE
   - [x] ~~CSV Import for external formats~~ ✅ DONE
   - [x] ~~Inventory card image placeholders~~ ✅ DONE
   - [x] ~~Card number display fix~~ ✅ DONE (Feb 3, 2026)
   - [x] ~~Batch image fetch~~ ✅ DONE (Feb 3, 2026)
   - [x] ~~Auto-fetch images in detail dialog~~ ✅ DONE (Feb 3, 2026)
   - [x] ~~Image Upgrade System (smart name matching + branded placeholders)~~ ✅ DONE (Feb 3, 2026)
   - [ ] Implement scanner pages (ScanBarcode.tsx, ScanAI.tsx)
   - [ ] Add sports fields to AddItem.tsx
   - [ ] Add rookie badge to InventoryCard.tsx
   - [ ] Configure iOS camera permissions

2. **API Status**:
   - Pokemon TCG API: ✅ Working
   - Tavily API: ✅ Working
   - Scrydex: ✅ Working (primary source for images)
   - PSA API: ✅ Configured
   - eBay API: ⏳ Pending approval
   - Ximilar: ⏳ Needs signup + key

3. **Search System**: ✅ Fully enhanced and deployed
   - Sports detection: ✅
   - Parallel API calls: ✅
   - Tavily fallback: ✅
   - Caching: ✅
   - Abbreviation expansion: ✅
   - Phonetic matching: ✅
   - Smart deduplication: ✅

4. **Import System**: ✅ Fully working
   - TCGPlayer format: ✅
   - Scrydex Portfolio: ✅
   - Card number detection: ✅ (fixed Feb 3, 2026)
   - Tested with 1,376 items: ✅

5. **Image System**: ✅ Fully working (Feb 3, 2026)
   - Batch fetch from Inventory page: ✅
   - Auto-fetch in item detail: ✅
   - Card number matching: ✅
   - Inventory grid auto-refresh: ✅
   - Smart name cleaning (strips parenthetical/bracket content): ✅
   - Branded placeholders (pokemon-card, graded-slab, sealed-product): ✅
   - Graded cards now fetch images: ✅ (removed skip logic)

6. **Price History**: ⚠️ Infrastructure ready, needs activation
   - Database migration: ✅ Created
   - Edge function: ✅ Created
   - Frontend hook: ✅ Created
   - Deployed & Scheduled: ❌ **Needs manual deployment**

7. **Recent Bug Fixes** (Feb 3, 2026):
   - Sealed items in Raw filter: ✅ Fixed
   - Inventory card alignment: ✅ Fixed (items-stretch)
   - Filter buttons sizing: ✅ Fixed (compact padding)
   - ItemDetailDialog compactness: ✅ Fixed
   - Quick Sell slider: ✅ Draggable with track/ball

8. **CSV Import v3 Overhaul** (Feb 19, 2026):
   - CSV Intelligence v3 with 150+ header variations: ✅
   - Format detection: TCGPlayer, eBay, PSA, BGS, COMC, CardMarket: ✅
   - Smart delimiter detection (comma, semicolon, tab, pipe): ✅
   - Column mapping editor with manual reassignment: ✅
   - Confidence indicators (High/Med/Low) per mapping: ✅
   - Table preview of first 10 rows: ✅
   - Validation warnings (duplicates, missing fields, suspicious prices): ✅
   - Bulk import progress ("Importing card X of Y"): ✅
   - Import history with undo (delete all items from a batch): ✅
   - Premium client list public view with value summary: ✅
   - Social media share card generation (canvas-based PNG): ✅
   - Collection export utilities: ✅

---

## Coding Patterns
- Use shadcn/ui components from @/components/ui/
- Toast notifications via useToast() hook
- Supabase client from @/integrations/supabase/client
- Types from @/integrations/supabase/types
- Cache functions from @/lib/cache
- CSV utilities from @/lib/csv
- Analytics from @/lib/analytics
- Framer motion for animations
- Always handle offline state in data fetching
- Bottom sheets for profile settings (iOS pattern)
- Encouraging tone for empty states
- Loading text labels with spinners

---

## Notes
- App focuses on PERSONAL tracking, not marketplace selling
- Must support sports cards, Pokemon, One Piece, Yu-Gi-Oh, MTG, and other TCGs
- iOS is primary platform
- Offline-first approach for reliability
- Blue (#0074fb) primary accent with premium/luxury feel
- Glassmorphism design language
- Both dark and light mode supported (toggle in Profile)
- Search/Scan is the hero action (first tab)
