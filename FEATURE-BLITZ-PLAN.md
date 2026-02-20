# CardLedger Feature Blitz - Master Plan
*Created: 2026-02-19 | Target: Ship ALL 15 features*

## 🎯 Mission
Add every missing feature to make CardLedger the #1 card portfolio app. No shortcuts, do it right.

---

## Feature Breakdown by Priority

### WAVE 1: High Impact (Ship First)
| # | Feature | Complexity | Agent | Status |
|---|---------|------------|-------|--------|
| 1 | Trade Analyzer | Medium | SCOUT | 🔴 TODO |
| 2 | Price Alerts | Medium | SCOUT | 🔴 TODO |
| 3 | Bulk Entry Mode | Medium | CODE | 🔴 TODO |
| 4 | Insurance/PDF Reports | Medium | CODE | 🔴 TODO |
| 5 | Public Profile Sharing | Medium | CODE | 🔴 TODO |

### WAVE 2: Differentiators
| # | Feature | Complexity | Agent | Status |
|---|---------|------------|-------|--------|
| 6 | Centering Tool | High | SCOUT+CODE | 🔴 TODO |
| 7 | Population Reports | High | SCOUT | 🔴 TODO |
| 8 | Sealed Product Tracking | Medium | CODE | 🔴 TODO |
| 9 | Multi-Source Price Comparison | High | SCOUT | 🔴 TODO |
| 10 | Trending Cards Dashboard | Medium | SCOUT | 🔴 TODO |

### WAVE 3: Nice to Have
| # | Feature | Complexity | Agent | Status |
|---|---------|------------|-------|--------|
| 11 | eBay Direct Listing | High | SCOUT | 🔴 TODO |
| 12 | Smart Recommendations | Medium | CODE | 🔴 TODO |
| 13 | Parallel/Variant Detection | Medium | CODE | 🔴 TODO |
| 14 | Watch List | Low | CODE | 🔴 TODO |
| 15 | Collection Goals V2 | Low | CODE | 🔴 TODO |

---

## Detailed Feature Specs

### 1. Trade Analyzer ⚖️
**What:** Compare two sets of cards to see if a trade is fair
**UI Location:** New page `/trade-analyzer` + button in inventory
**Components:**
- TradeAnalyzer.tsx - Main page
- TradeCard.tsx - Draggable card component
- TradeSummary.tsx - Value comparison display
**Logic:**
- Drag cards to "Giving" and "Receiving" columns
- Real-time value calculation using JustTCG prices
- Show difference: "You're getting $45 more value" or "You're losing $12"
- Fairness meter (visual indicator)
- Save/share trade proposals
**Data needed:** Existing inventory + JustTCG API (already have)

### 2. Price Alerts 🔔
**What:** Get notified when a card hits your target price
**UI Location:** Settings + per-card in ItemDetailDialog
**Components:**
- PriceAlertDialog.tsx - Set alert modal
- AlertsPage.tsx - Manage all alerts
- useAlerts.ts - Alert logic hook
**Logic:**
- Set target price (above/below current)
- Check prices on app open + background sync
- Push notification or in-app alert
- Alert history
**Data needed:** 
- Price checking (JustTCG API - already have)
- Push notifications (need to research - Firebase? OneSignal?)

### 3. Bulk Entry Mode 📦
**What:** Fast data entry for large collections
**UI Location:** Add Item → "Bulk Mode" toggle
**Components:**
- BulkEntryDialog.tsx - Main bulk entry interface
- BulkEntryRow.tsx - Single row component
- BulkImportPreview.tsx - Preview before save
**Logic:**
- Table view with columns: Name, Set, Condition, Qty, Cost
- Auto-complete as you type
- Paste from spreadsheet support
- Barcode scanner rapid-fire mode
- Import 100+ cards in minutes
**Data needed:** Existing search API

### 4. Insurance/PDF Reports 📄
**What:** Generate professional PDFs for insurance claims
**UI Location:** Settings → Export → "Insurance Report"
**Components:**
- InsuranceReportDialog.tsx - Configuration
- InsuranceReportPDF.tsx - PDF template (react-pdf)
**Logic:**
- Include: Card images, names, conditions, values, dates
- Total collection value
- Timestamp + signature line
- Multiple formats (detailed, summary)
- Add custom notes/policy numbers
**Dependencies:** react-pdf or jsPDF library

### 5. Public Profile Sharing 🌐
**What:** Shareable links to show off collections
**UI Location:** Profile → "Share Profile" button
**Components:**
- PublicProfile.tsx - Public view page
- ShareProfileDialog.tsx - Privacy settings
- ProfileBadge.tsx - Embeddable widget
**Logic:**
- Generate unique shareable URL
- Privacy controls (show values? show cost basis?)
- Custom profile themes
- Embed code for forums/Discord
**Data needed:** 
- Supabase public profiles table
- Unique URL generation

### 6. Centering Tool 🎯
**What:** Analyze card photos for PSA/BGS centering grades
**UI Location:** Inventory card → "Grade Check" button
**Components:**
- CenteringTool.tsx - Main analyzer
- CenteringOverlay.tsx - Visual overlay
- GradeEstimator.tsx - Predicted grade
**Logic:**
- Upload/capture card photo
- AI edge detection for borders
- Calculate L/R and T/B centering percentages
- Map to PSA/BGS/CGC centering grades
- "Worth grading?" recommendation based on value + centering
**Research needed:**
- OpenCV.js or TensorFlow.js for edge detection
- PSA/BGS centering standards
- Existing libraries/APIs

### 7. Population Reports 📊
**What:** Show PSA/BGS population data for graded cards
**UI Location:** Item Detail → "Population" tab
**Components:**
- PopulationReport.tsx - Pop report display
- PopulationChart.tsx - Visual breakdown
**Logic:**
- Display total graded population by grade
- Show percentage at each grade
- Historical pop data if available
- "Rarity score" based on pop
**Research needed:**
- PSA Cert Verification API?
- BGS population data source?
- Web scraping as fallback?

### 8. Sealed Product Tracking 📦
**What:** Track booster boxes, ETBs, collection boxes
**UI Location:** Inventory → "Sealed" category
**Components:**
- SealedProductCard.tsx - Display component
- AddSealedDialog.tsx - Add sealed items
**Logic:**
- Product types: Booster Box, ETB, Collection Box, Blister, Tin
- Track purchase price, current value
- "Open or Hold?" calculator based on EV
- Link to TCGPlayer/eBay sealed prices
**Data needed:**
- Sealed product database (research sources)
- Sealed product pricing API

### 9. Multi-Source Price Comparison 💰
**What:** Show prices across eBay, TCGPlayer, Troll&Toad
**UI Location:** Item Detail → "Prices" tab
**Components:**
- PriceComparison.tsx - Multi-source display
- PriceSourceBadge.tsx - Source indicator
**Logic:**
- Aggregate prices from multiple sources
- Show lowest/highest/average
- Direct links to buy
- Price history per source
**Research needed:**
- TCGPlayer API access
- eBay Browse API
- Troll and Toad (scraping?)
- CardMarket for EU

### 10. Trending Cards Dashboard 🔥
**What:** Show what's hot in the market right now
**UI Location:** New page `/trending` + widget on Dashboard
**Components:**
- TrendingPage.tsx - Full page
- TrendingWidget.tsx - Dashboard widget
- TrendingCard.tsx - Card display
**Logic:**
- Top gainers (% increase this week)
- Top losers
- Most searched/added
- New releases
- Filter by TCG type
**Data needed:**
- Price history analysis (JustTCG)
- Community activity data

### 11. eBay Direct Listing 🏷️
**What:** List cards for sale on eBay from the app
**UI Location:** Inventory card → "Sell on eBay"
**Components:**
- EbayListingDialog.tsx - Create listing
- EbayListingsPage.tsx - Manage listings
**Logic:**
- Connect eBay account (OAuth)
- Auto-fill listing from card data
- Suggested pricing based on comps
- Track listing status
- Mark as sold, sync inventory
**Research needed:**
- eBay Sell API
- OAuth flow
- Listing requirements

### 12. Smart Recommendations 🧠
**What:** "Based on your collection, you might like..."
**UI Location:** Dashboard widget + dedicated page
**Components:**
- RecommendationsWidget.tsx
- RecommendationCard.tsx
**Logic:**
- Analyze collection patterns
- Suggest cards to complete sets
- Suggest similar cards (same artist, type, era)
- "Collectors who own X also own Y"
- Price-based suggestions (under $X)
**Data needed:** Collection analysis algorithm

### 13. Parallel/Variant Detection 🎨
**What:** Better handling of holos, reverses, special arts
**UI Location:** Add Item flow + Item Detail
**Components:**
- VariantSelector.tsx - Pick the exact variant
- VariantBadge.tsx - Display indicator
**Logic:**
- Detect card variants from scan
- Show all variants with prices
- Easy switching between variants
- Variant-specific pricing
**Data needed:** JustTCG variant data (may already have)

### 14. Watch List 👁️
**What:** Track cards you don't own but want to monitor
**UI Location:** New tab in Inventory or separate page
**Components:**
- WatchList.tsx - Main page
- AddToWatchlistButton.tsx - Quick add
- WatchlistCard.tsx - Display
**Logic:**
- Add any card without owning it
- Track price changes
- Set price alerts on watched cards
- "Buy now" suggestions when price drops
**Data needed:** Separate watchlist storage

### 15. Collection Goals V2 🎯
**What:** Enhanced goal tracking with deadlines
**UI Location:** Existing Goals page enhancement
**Components:**
- GoalTimeline.tsx - Visual timeline
- GoalMilestones.tsx - Milestone tracking
**Logic:**
- Set target date for goals
- Progress projections
- Milestone celebrations
- Shareable goal progress
- "On track" / "Behind" indicators
**Data needed:** Existing goals system

---

## API/Data Research Needed

### Push Notifications
- [ ] Firebase Cloud Messaging (free tier)
- [ ] OneSignal (generous free tier)
- [ ] Web Push API (native)

### Population Data
- [ ] PSA Cert Verification API
- [ ] BGS lookup options
- [ ] Third-party aggregators

### Sealed Products
- [ ] TCGPlayer sealed prices
- [ ] PriceCharting sealed data
- [ ] Manual database?

### Multi-Source Pricing
- [ ] TCGPlayer API (need partner access?)
- [ ] eBay Browse API (have key from CardLedger setup)
- [ ] CardMarket API (EU)

### eBay Selling
- [ ] eBay Sell APIs
- [ ] OAuth integration
- [ ] Sandbox testing

### Centering Analysis
- [ ] OpenCV.js
- [ ] TensorFlow.js
- [ ] Existing grading tools

---

## Agent Assignments

### BOTSKII (Coordinator)
- Create master plan ✅
- Coordinate agents
- Review PRs
- Handle blockers

### SCOUT (Research Agent)
- API research
- Competitor feature analysis
- Data source identification
- Documentation

### CODE (Implementation Agent)
- Component building
- Hook creation
- Page implementation
- Testing

### DESIGN (UI/UX Agent)
- Component styling
- Animation polish
- Mobile responsiveness
- Accessibility

---

## Execution Order

### Tonight (Wave 1 Start)
1. [ ] SCOUT: Research push notification options
2. [ ] SCOUT: Research population report data sources
3. [ ] CODE: Build Trade Analyzer page structure
4. [ ] CODE: Build Bulk Entry Mode dialog
5. [ ] CODE: Build Watch List (quick win)

### Tomorrow (Wave 1 Complete)
6. [ ] CODE: Complete Trade Analyzer with drag-drop
7. [ ] CODE: Price Alerts system + settings
8. [ ] CODE: Insurance PDF report generator
9. [ ] CODE: Public Profile sharing

### Day 3 (Wave 2)
10. [ ] Centering Tool (needs research first)
11. [ ] Population Reports (needs API research)
12. [ ] Sealed Product Tracking
13. [ ] Multi-Source Price Comparison
14. [ ] Trending Dashboard

### Day 4 (Wave 3 + Polish)
15. [ ] eBay Direct Listing
16. [ ] Smart Recommendations
17. [ ] Parallel/Variant Detection
18. [ ] Collection Goals V2
19. [ ] Full testing + bug fixes

---

## Success Metrics

- [ ] All 15 features implemented
- [ ] No TypeScript errors
- [ ] Mobile responsive
- [ ] Premium features properly gated
- [ ] Performance maintained (<3s load)
- [ ] Build successful

---

## Notes

- Use existing JustTCG API for pricing (already integrated)
- Leverage existing component patterns
- Keep bundle size in check (lazy load new pages)
- Document any new API keys needed

---

*Let's ship this. 🚀*
