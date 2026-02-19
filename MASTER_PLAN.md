# CardLedger Master Plan
## "Your Cards | One Ledger" — Best-in-Class Portfolio Tracker

**Goal:** Launch the #1 collectible card portfolio tracker on iOS App Store
**Timeline:** Website V2 first → Native iOS Swift rebuild
**Target Market:** Card collectors, vendors, resellers (Pokemon, Sports Cards, TCGs, One Piece)

---

## 🔍 Competitor Analysis

### 1. Collectr (getcollectr.com) — MAIN COMPETITOR
**Stats:** 2M+ users, 80K+ reviews, 4.9★ rating
**Pricing:** Free (limited) / PRO $7.99/mo or $59.99/yr

**Features:**
- ✅ 1M+ product database (25+ TCGs)
- ✅ Real-time market pricing
- ✅ Raw, graded, sealed tracking
- ✅ AI-powered card scanning
- ✅ Multi-currency (including crypto)
- ✅ Biggest gains/losses tracking
- ✅ Data exports (PRO)
- ✅ Social feed
- ✅ Ambassador program
- ✅ API access for developers
- ✅ Trade analyzer

**Weaknesses:**
- Generic design, not Robinhood-sleek
- No wholesale/vendor features
- No eBay integration
- No advanced analytics (ROI, cost basis)

### 2. pkmn.gg — Pokemon-Only
**Features:**
- ✅ Free
- ✅ Deck builder with validation
- ✅ Custom lists (trade binder, wishlist)
- ✅ Pokédex integration
- ✅ Friend system
- ✅ TCGplayer price integration
- ✅ Collection completion tracking

**Weaknesses:**
- Pokemon only
- Web only (no native app)
- No grading integration

### 3. PokeData (pokedata.io)
**Features:**
- ✅ Cards + sealed product tracking
- ✅ Price history charts
- ✅ Watchlist
- ✅ Clean UI

**Weaknesses:**
- Pokemon only
- Limited features
- Smaller database

### 4. TCGplayer
**Features:**
- ✅ Massive marketplace
- ✅ Collection integration with buying
- ✅ Price guides

**Weaknesses:**
- Marketplace-first, collection tracker secondary
- Not mobile-native

---

## 🎯 CardLedger Differentiators (What Makes Us #1)

### 1. **Robinhood-Style UI** (Premium Feel)
- Clean, dark theme with teal accents
- Animated counters and charts
- Swipe interactions
- Portfolio hero with sparklines
- "Top movers" like stock apps

### 2. **Wholesale/Vendor Features** (Untapped Market)
- Bulk import from CSV/Excel
- Client lists (share portfolios with buyers)
- Invoice generation
- Margin/ROI tracking per card
- Cost basis management
- **eBay integration** (auto-import listings, sold prices)

### 3. **Advanced Analytics**
- True P&L (cost basis vs current value)
- ROI by card/set/category
- Portfolio allocation pie charts
- Historical performance (1D, 1W, 1M, 1Y, ALL)
- Volatility indicators
- Price alerts (notify when card hits target)

### 4. **Multi-Platform Price Aggregation**
- TCGplayer
- eBay (sold listings) ← **We have API keys**
- PSA/CGC marketplace data
- Card market (EU)

### 5. **Grading Pipeline**
- Track submissions to PSA, CGC, BGS
- Estimated grades based on condition
- Grading ROI calculator (raw vs graded value)
- Population reports

### 6. **Sports Cards Focus** (Less Competition)
- Sports cards market is HUGE
- Less competition than Pokemon-only apps
- Panini, Topps, Bowman support

---

## 📋 Feature Roadmap

### Phase 1: Core Website Rebuild (THIS WEEK)

#### Dashboard (Home)
- [ ] Portfolio hero with total value + 24h change
- [ ] Sparkline chart (7D, 1M, 3M, 1Y, ALL)
- [ ] Animated counters (total value, # cards, profit)
- [ ] Top gainers/losers cards (4-6 cards)
- [ ] Recent activity feed
- [ ] Quick actions (Add card, Scan, Import)

#### Inventory
- [ ] Grid/list view toggle
- [ ] Swipe-to-sell, swipe-to-delete
- [ ] Condition tracking with value multipliers
- [ ] Grading status badges
- [ ] Cost basis per card
- [ ] Filter by: Set, Condition, Grade, Category, Profit/Loss
- [ ] Sort by: Value, Name, Date Added, ROI
- [ ] Multi-select for bulk actions
- [ ] Search with autocomplete

#### Add Card
- [ ] Search database (Pokemon, Sports, TCGs)
- [ ] Barcode scanner
- [ ] AI image recognition (Snap to add)
- [ ] Manual entry
- [ ] Cost basis input
- [ ] Condition selector (Mint, NM, LP, MP, HP, D)
- [ ] Graded toggle (PSA, CGC, BGS + grade)
- [ ] Quantity input
- [ ] Notes field
- [ ] Folder/collection assignment

#### Portfolio Analytics
- [ ] Total P&L (realized + unrealized)
- [ ] ROI % overall and by category
- [ ] Allocation breakdown (pie chart)
- [ ] Top performers list
- [ ] Worst performers list
- [ ] Historical value chart
- [ ] Comparison to market indices

#### Sales Tracker
- [ ] Record sales (price, date, buyer, platform)
- [ ] Auto-calculate profit margin
- [ ] Sales history with totals
- [ ] Pending sales
- [ ] Export to CSV

#### Wishlist
- [ ] Price alerts
- [ ] Target price tracking
- [ ] "Notify when drops below $X"

#### Grading Center
- [ ] Submit new (select cards to grade)
- [ ] Track submissions (sent, received, graded)
- [ ] Estimated grade predictor
- [ ] ROI calculator (raw value vs graded value)
- [ ] Grading costs tracking

#### Market Data
- [ ] Trending cards
- [ ] Price alerts manager
- [ ] Set analytics
- [ ] Population reports (for graded)

### Phase 2: eBay Integration

- [ ] Connect eBay account (OAuth)
- [ ] Auto-import active listings
- [ ] Sync sold items to sales tracker
- [ ] Pull market prices from eBay sold listings
- [ ] Auto-add purchases to inventory

### Phase 3: Wholesale Features

- [ ] Client lists (create lists to share with buyers)
- [ ] Public share links
- [ ] Price sheet generation (PDF export)
- [ ] Bulk import from spreadsheet
- [ ] Margin management tools

### Phase 4: Native iOS App (Swift)

- [ ] Rebuild in Swift/SwiftUI
- [ ] Native barcode scanner (ultra fast)
- [ ] Native camera for AI scanning
- [ ] Push notifications for price alerts
- [ ] Widget support (home screen portfolio)
- [ ] Apple Watch companion (glanceable value)
- [ ] Offline mode with sync
- [ ] Face ID / Touch ID

---

## 🎨 Design System

**Theme:** Dark mode primary (Robinhood-inspired)
**Primary Color:** Teal (#10b981) — same as Vantix
**Secondary:** Navy (#0f172a)
**Background:** #0a0a0a / #121212
**Cards:** #1a1a1a with subtle borders
**Text:** White primary, gray-400 secondary

**Typography:**
- Headers: Inter Bold
- Body: Inter Regular
- Numbers: JetBrains Mono (monospace for prices)

**Animations:**
- Counter animations (number tick up)
- Sparklines with draw animation
- Swipe gestures with haptic feedback
- Pull-to-refresh
- Page transitions

---

## 💰 Monetization

### Free Tier
- Up to 100 cards
- Basic analytics
- Manual price lookup
- No exports

### Pro ($6.99/mo or $49.99/yr)
- Unlimited cards
- Full analytics & charts
- Price alerts
- Data exports
- eBay integration
- Priority support

### Business ($14.99/mo)
- Everything in Pro
- Client lists
- Share links
- Invoice generation
- API access
- White-label options

---

## 🏆 Success Metrics

1. **Launch Goal:** 1,000 users in first month
2. **App Store:** 4.8+ rating
3. **Conversion:** 5% free → Pro
4. **Retention:** 60% monthly active users

---

## 🔧 Tech Stack

**Website (Current):**
- React + TypeScript + Vite
- TailwindCSS + shadcn/ui
- Supabase (Auth + DB)
- Capacitor (current iOS wrapper)
- Framer Motion (animations)

**Data Sources:**
- TCGplayer API (prices)
- eBay Browse/Sell APIs (we have keys!)
- PSA/CGC population data (scrape)
- Card databases (Pokemon TCG API, Sports Card databases)

**iOS Native (Future):**
- Swift + SwiftUI
- Core Data (offline)
- CloudKit sync
- VisionKit (AI scanning)
- AVFoundation (barcode)

---

## 🚀 Tonight's Execution Plan

1. **Dashboard Rebuild** — Robinhood-style hero, sparklines, top movers
2. **Inventory Upgrade** — Swipe gestures, condition tracking, better filters
3. **Analytics Page** — P&L, ROI, allocation charts
4. **Sales Tracker** — Profit margin tracking
5. **UI Polish** — Animations, transitions, dark mode consistency
6. **eBay Integration** — Start OAuth + listing import

**Agents to spawn:**
- Dashboard rebuild agent
- Inventory upgrade agent
- Analytics page agent
- Sales tracker agent
- eBay integration agent
- UI/Animation polish agent

---

*Created: 2026-02-13*
*"Best of the best app on the App Store for the industry"*
