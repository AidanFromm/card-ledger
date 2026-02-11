# CardLedger V2 — Full Version Upgrade Plan

**Created:** February 11, 2026  
**Status:** Research Complete → Ready for Implementation  
**Goal:** Become the #1 collectibles portfolio app, beating Collectr

---

## 🎯 COMPETITOR ANALYSIS: COLLECTR

### What They Do Well
- **80,000+ reviews** with 4.9★ rating
- 200,000+ product database across 25+ TCGs
- Real-time market valuations with charts/trends
- Multi-currency support (including crypto!)
- Card scanning with AI
- Clean portfolio summaries
- "Trade Analyzer" feature
- Historical graded POP reports
- Ambassador program (influencer marketing)
- API access for developers

### What They Do Poorly (Our Opportunities)
1. **Condition tracking is weak** — Users complain it's "catered for mint/graded cards only"
2. **Limited context on cards** — Can't add notes, history, where purchased
3. **Sports cards still "coming soon"** — Not fully supported yet
4. **No vendor-specific features** — Doesn't help sellers, just collectors
5. **Website is basic** — Their web app lacks features vs mobile
6. **No FIFO/tax reporting** — Critical for resellers
7. **No profit tracking per item** — Can't see what you paid vs what it's worth now
8. **No purchase history** — When did I buy this? How much?

### Their Pricing
- **Free:** Limited scanning, basic features
- **Pro Monthly:** $7.99/mo
- **Pro Annual:** $59.99/yr (~$5/mo)

---

## 🎨 ROBINHOOD UI PRINCIPLES (Our Design Guide)

### Core Design Philosophy
> "Leverage bold colors and typography to create visual hierarchy, focusing user attention and reducing confusion."

### Key Patterns to Implement

| Pattern | How It Works | CardLedger Application |
|---------|--------------|------------------------|
| **Color = Status** | Green = gains, Red = losses | Portfolio value color, individual card P&L |
| **Cards for Everything** | Group related info in expandable cards | Inventory items, stats, news |
| **Animated Transitions** | Cards expand from their origin point | Item detail opens from card position |
| **Large Hero Numbers** | Primary value is huge and prominent | Portfolio total, card value |
| **Touch Ripples** | Visual feedback on every tap | All buttons and interactive elements |
| **Progress Bars** | Subtle, low-profile during loading | Scanning, price fetching, imports |
| **Swipe Actions** | Swipe left to dismiss/delete | Inventory items, notifications |
| **Snackbar Notifications** | Brief feedback at bottom | "Card added", "Price updated" |
| **Contextual Illustrations** | Visual hints for tasks | Onboarding, empty states |
| **Time-Based Color** | Background shifts after hours | Maybe: "Market closed" indicator |

### Typography & Visual Hierarchy
- **SF Pro** font family (iOS native)
- **Bold, large numbers** for values
- **Muted secondary text** for labels
- **Tabular figures** for aligned numbers
- **High contrast** for readability

### Animation Principles
- **Purposeful motion** — Every animation has meaning
- **60fps smooth** — No janky transitions
- **Quick but not instant** — 200-300ms transitions
- **Spring physics** — Organic, natural feel
- **Micro-interactions** — Buttons react, numbers animate when changing

---

## 🚀 FEATURE ROADMAP: V2

### Phase 1: Foundation (Week 1-2)
**Goal:** Solid base with Robinhood-style polish

- [ ] **New Design System**
  - Color palette refinement (keep blue, add semantic colors)
  - Typography scale with SF Pro
  - Spacing system (4px base unit)
  - Component library update (buttons, cards, inputs)
  - Dark/light mode polish

- [ ] **Home Screen Overhaul**
  - Hero portfolio value (massive number)
  - Daily change with color (green/red)
  - Sparkline chart preview
  - Quick action buttons (Scan, Add, Search)
  - Recent activity feed

- [ ] **Portfolio Value Animation**
  - Numbers animate when changing
  - Color pulses on significant moves
  - Confetti on milestones ($1k, $10k, $100k)

### Phase 2: Search & Scanning (Week 2-3)
**Goal:** Best-in-class card discovery

- [ ] **Search Improvements**
  - Instant search with debounce
  - Filter chips (TCG type, graded/raw/sealed)
  - Recent searches
  - Popular/trending cards section
  - Voice search (stretch goal)

- [ ] **Barcode Scanner Polish**
  - Camera viewfinder with animated frame
  - Haptic feedback on scan
  - Instant product lookup
  - "Not found" helpful state

- [ ] **AI Scanner** (Pro Feature)
  - Card recognition from photo
  - Condition assessment suggestion
  - Auto-fill all fields
  - Confidence indicator

### Phase 3: Inventory Mastery (Week 3-4)
**Goal:** Superior tracking vs Collectr

- [ ] **Inventory Card Redesign**
  - Robinhood-style cards
  - Swipe actions (sell, delete)
  - P&L indicator per card (green/red badge)
  - Tap to expand with smooth animation

- [ ] **Item Detail Overhaul**
  - Full-screen modal from card origin
  - Price history chart (30/90/365 days)
  - Purchase history timeline
  - Edit all fields inline
  - Quick sell button
  - Share card button

- [ ] **Condition Tracking** (Beat Collectr here!)
  - Detailed condition picker (NM, LP, MP, HP, DMG)
  - Condition notes field
  - Photo attachments for damage
  - Condition affects value estimate

- [ ] **Bulk Operations**
  - Multi-select mode
  - Bulk price update
  - Bulk delete
  - Bulk add to list
  - Bulk export

### Phase 4: Analytics & Insights (Week 4-5)
**Goal:** Bloomberg terminal for cards

- [ ] **Dashboard 2.0**
  - Total portfolio value (hero)
  - Today's change ($$$ and %)
  - 7D/30D/90D/1Y/ALL time selector
  - Performance chart (area chart)
  - Top gainers/losers cards
  - Category breakdown pie chart

- [ ] **Individual Card Analytics**
  - Price history graph
  - "You paid $X, now worth $Y" (clear P&L)
  - Market trend indicator
  - PSA population data (where available)
  - Price alerts setup

- [ ] **Tax/Profit Reports** (Beat Collectr!)
  - FIFO cost basis calculation
  - Realized vs unrealized gains
  - Export for tax season (CSV)
  - Year-over-year comparison

### Phase 5: Pro Features (Week 5-6)
**Goal:** Clear value for subscription

- [ ] **Free Tier**
  - 50 items max
  - Basic search
  - Manual entry only
  - Standard support

- [ ] **Pro Tier ($6.99/mo or $49.99/yr)**
  - Unlimited items
  - AI card scanner
  - Price alerts
  - Data exports (CSV, JSON)
  - Price history charts
  - Priority support

- [ ] **Business Tier ($14.99/mo)**
  - Everything in Pro
  - Team members (up to 5)
  - Client lists (shareable inventory)
  - API access
  - Tax reports
  - Bulk operations
  - White-label options?

### Phase 6: Polish & Launch (Week 6-7)
**Goal:** App Store ready

- [ ] **Onboarding Flow**
  - Animated walkthrough (3-4 screens)
  - Import from other apps option
  - Quick add first card tutorial
  - Skip option for returning users

- [ ] **Empty States**
  - Encouraging illustrations
  - Clear call-to-action
  - "Get started" guidance

- [ ] **Settings & Profile**
  - Account management
  - Subscription management
  - Notification preferences
  - Theme toggle
  - Currency selector
  - Data management (export, delete)

- [ ] **Performance**
  - 60fps animations
  - Fast startup (<2s)
  - Offline-first with sync
  - Image lazy loading
  - Virtual lists for large collections

---

## 📱 API REQUIREMENTS

### Currently Have
| API | Status | Data |
|-----|--------|------|
| Pokemon TCG API | ✅ Active | Pokemon cards + TCGPlayer prices |
| Scrydex | ✅ Active ($99/mo) | Sealed products |
| Tavily AI | ✅ Active | Price discovery fallback |
| PSA API | ✅ Configured | Cert verification |

### Need to Add
| API | Priority | Data | Cost |
|-----|----------|------|------|
| **TCGPlayer API** | 🔴 Critical | Official pricing for all TCGs | Apply for access |
| **eBay Browse API** | 🟡 High | Sold comps validation | Free (5k/day) |
| **PSA POP Reports** | 🟡 High | Population data | Unknown |
| **130point** | 🟡 High | Sports card comps | Unknown |
| **Mavin.io** | 🟢 Medium | Cross-platform price aggregation | Unknown |
| **PriceCharting** | 🟢 Medium | Video game cards | $30-100/mo |

### TCGPlayer API (Critical)
- This is the gold standard for TCG pricing
- Collectr likely uses this
- Apply at: https://developer.tcgplayer.com/
- Would give us: Official market prices, price history, product catalog

---

## 🎨 COLOR PALETTE (Refined)

```
Primary Blue:    #0074fb (keep current)
Success Green:   #00C853 (gains, positive)
Loss Red:        #FF5252 (losses, negative)
Warning Amber:   #FFB300 (alerts)
Background:      #0D0D0D (dark) / #FAFAFA (light)
Card Surface:    #1A1A1A (dark) / #FFFFFF (light)
Muted Text:      #8E8E93
Border:          #2C2C2E (dark) / #E5E5EA (light)
```

### Semantic Colors
- **Portfolio Up:** Green glow/tint
- **Portfolio Down:** Red glow/tint  
- **Graded Card:** Gold accent
- **Sealed Product:** Purple accent
- **Raw Card:** Blue (default)

---

## 📊 SUCCESS METRICS

### Beat Collectr On:
1. ✅ Condition tracking (detailed, with photos)
2. ✅ Purchase history & profit tracking
3. ✅ Sports cards (fully supported)
4. ✅ Tax/profit reports
5. ✅ Vendor features (client lists, bulk ops)
6. ✅ Web app quality (parity with mobile)

### App Store Goals:
- 4.8+ star rating
- Featured in "New Apps We Love"
- Top 10 in Reference category

---

## 📁 FOLDER STRUCTURE (Proposed)

```
cardledger/
├── ios/                    # Capacitor iOS (current)
├── ios-native/             # Swift iOS (future, after web done)
├── web/                    # Marketing website
│   ├── landing/
│   └── pricing/
├── src/                    # React app (current)
│   ├── components/
│   │   ├── ui/             # Base components (shadcn)
│   │   ├── cards/          # Card-related components
│   │   ├── charts/         # Analytics charts
│   │   └── layout/         # Navigation, shells
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   └── styles/
└── supabase/
    ├── functions/
    └── migrations/
```

---

## 🗓️ TIMELINE

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Design system + Home | New components, hero portfolio |
| 2 | Search + Scanning | Polished search, barcode scanner |
| 3 | Inventory | Card redesign, item detail, conditions |
| 4 | Analytics | Dashboard 2.0, price charts |
| 5 | Pro features | Tiers, AI scanner, exports |
| 6 | Polish | Onboarding, empty states, performance |
| 7 | Launch prep | Testing, App Store assets, submission |

---

## 📝 NOTES

- **No sneakers** — This is collectibles only (Pokemon, sports cards, TCGs)
- **Dave App reference** — Use similar scan-to-price flow
- **Swift rebuild** — After web is complete, rebuild iOS natively
- **Marketplace idea** — Future feature, not V2 scope

---

*This document will be updated as we progress. Let's build the #1 app.* 🚀
