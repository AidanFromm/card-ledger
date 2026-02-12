# CardLedger V3 — Master Plan
## "The Ultimate Collectibles Portfolio App"

**Mission:** Beat Collectr. Become the #1 portfolio tracker for card collectors, investors, and vendors.

**Competitor Status:**
- Collectr: 80k+ reviews, 4.9★ — BUT weak on sports cards, poor condition tracking, no purchase history
- CollX: Sports-focused, has marketplace
- Ludex: Great scan accuracy, sports + TCG

**Our Edge:** Full-stack solution with slab generator, better condition tracking, vendor features, and premium UX.

---

## 🎯 V3 CORE FEATURES

### 1. LANDING PAGE (Priority: CRITICAL)
**Goal:** Best landing page ever. Better than Vantix. Conversion machine.

**Elements:**
- [ ] Hero section with animated gradient + 3D card mockup
- [ ] "Your Cards. One Ledger." headline with typewriter effect
- [ ] Live portfolio value counter (fake demo data animating)
- [ ] Feature showcase with scroll animations
- [ ] App screenshots in device mockups (iPhone + MacBook)
- [ ] TCG logos carousel (Pokemon, Magic, Yu-Gi-Oh, Sports, One Piece)
- [ ] Social proof section (testimonials, review count)
- [ ] Pricing tiers with feature comparison
- [ ] FAQ accordion
- [ ] Footer with links + newsletter signup
- [ ] Mobile-first, blazing fast

**Inspiration:** 
- Robinhood landing
- Linear.app
- Vercel.com
- Raycast.com

### 2. SLAB IMAGE GENERATOR (Priority: HIGH)
**Goal:** User adds card with grade → generates professional slab mockup image

**Grading Companies:**
- [ ] PSA (grades 1-10, Authentic, Altered)
- [ ] BGS/BVG (1-10 with subgrades)
- [ ] CGC (1-10 with subgrades)
- [ ] SGC (1-10)
- [ ] TAG (1-10)
- [ ] CSG (1-10)

**Technical Approach:**
1. Create SVG templates for each slab type
2. Dynamic text injection (card name, grade, cert number)
3. Card image composited into slab window
4. Export as PNG/JPG for sharing

**Database needed:**
- Slab dimensions per company
- Label colors per grade (PSA 10 = gem mint green, etc.)
- Font styles per company

### 3. SCANNING & RECOGNITION (Priority: HIGH)
**Goal:** Best-in-class accuracy. Identify card + set + variant instantly.

**Approach:**
- [ ] Integrate Pokemon TCG API (free, comprehensive)
- [ ] Integrate Scryfall API for MTG (free)
- [ ] Build/integrate sports card database
- [ ] AI image recognition for card matching
- [ ] Barcode scanning for sealed products
- [ ] Bulk scan mode (rapid-fire scanning)

### 4. DASHBOARD REDESIGN (Priority: HIGH)
**Goal:** Robinhood-level polish. At-a-glance portfolio insights.

**Sections:**
- [ ] Portfolio hero (total value, 24h change, graph)
- [ ] Top movers (cards gaining/losing value)
- [ ] Recent activity feed
- [ ] Category breakdown (pie chart)
- [ ] Grade distribution chart
- [ ] Quick actions (Scan, Add, Share)
- [ ] Price alerts summary

### 5. INVENTORY SYSTEM (Priority: HIGH)
**Features:**
- [ ] Grid/list view toggle
- [ ] Advanced filters (TCG, grade, value range, condition)
- [ ] Sort by (value, name, date added, gain/loss)
- [ ] Bulk select for actions
- [ ] Swipe actions (sell, delete, share)
- [ ] Purchase price + date tracking
- [ ] Profit/loss per item
- [ ] Condition notes
- [ ] Custom tags/folders

### 6. PRICE ALERTS (Priority: MEDIUM)
**Features:**
- [ ] Set alerts for any card
- [ ] "Notify when below $X"
- [ ] "Notify when above $X"
- [ ] Push notifications (mobile)
- [ ] Email digest option
- [ ] Alert history

### 7. SHARING SYSTEM UPGRADE (Priority: MEDIUM)
**Current:** Basic sharing page
**V3:**
- [ ] Beautiful shareable collection pages
- [ ] Custom URLs (/u/username or /share/xyz)
- [ ] QR code generation
- [ ] Embed widget for websites
- [ ] PDF export for insurance
- [ ] CSV export for spreadsheets

### 8. SPEED & PERFORMANCE (Priority: HIGH)
**Goals:**
- [ ] < 1 second page loads
- [ ] Optimistic UI updates
- [ ] Image lazy loading + caching
- [ ] Code splitting by route
- [ ] Service worker for offline
- [ ] Compress all images

---

## 🎨 DESIGN SYSTEM V3

### Colors
```
Primary: #0074fb (current blue) — may shift to navy later
Success/Gain: #22c55e (green)
Error/Loss: #ef4444 (red)
Background: #0a0a0a (near black)
Card: #141414 (dark gray)
Border: #262626 (subtle gray)
Text: #ffffff / #a1a1aa (white / muted)
```

### Typography
- Headlines: Inter/Geist Bold
- Body: Inter/Geist Regular
- Numbers: Tabular (monospace for alignment)

### Components
- Glass cards with subtle borders
- Smooth 200-300ms transitions
- Touch ripple on mobile
- Skeleton loaders everywhere
- Micro-animations (numbers counting, cards sliding)

---

## 📱 PLATFORM STRATEGY

**Phase 1 (NOW):** Web app (React + Vite)
- Full responsive design
- PWA support (installable)

**Phase 2 (LATER):** Native iOS (Swift)
- Rebuild core features natively
- Better scanning performance
- Push notifications
- Apple Watch widget

**Phase 3 (FUTURE):** Android
- React Native or native Kotlin

---

## 🗂️ FILE STRUCTURE (Proposed)

```
src/
├── components/
│   ├── ui/              # shadcn components
│   ├── landing/         # Landing page sections
│   ├── dashboard/       # Dashboard widgets
│   ├── inventory/       # Inventory components
│   ├── scanner/         # Scanning components
│   ├── slab-generator/  # Slab mockup generator
│   └── shared/          # Shared components
├── pages/
│   ├── Landing.tsx      # NEW premium landing
│   ├── Dashboard.tsx    # Redesigned
│   ├── Inventory.tsx    # Enhanced
│   ├── Scanner.tsx      # Unified scanning
│   ├── Alerts.tsx       # NEW price alerts
│   ├── Share.tsx        # Enhanced sharing
│   └── Auth.tsx         # Login/signup
├── lib/
│   ├── api/             # API integrations
│   ├── slab-templates/  # SVG slab templates
│   └── utils/           # Helpers
└── hooks/               # Custom hooks
```

---

## 🚀 EXECUTION PLAN

### Wave 1: Foundation (Tonight)
1. [ ] Create new Landing.tsx (premium, conversion-focused)
2. [ ] Set up slab generator architecture
3. [ ] PSA slab template (grades 1-10)

### Wave 2: Core Features (This Week)
4. [ ] BGS slab template
5. [ ] CGC slab template
6. [ ] Dashboard V3 redesign
7. [ ] Inventory enhancements
8. [ ] Price alerts system

### Wave 3: Polish (Next Week)
9. [ ] SGC + other slab templates
10. [ ] Sharing system upgrade
11. [ ] Performance optimization
12. [ ] Testing + bug fixes

---

## 📊 SUCCESS METRICS

- Landing page conversion > 10%
- Scan accuracy > 95%
- Page load < 1 second
- User retention > 40% (7-day)
- App Store rating > 4.5★

---

## 🔗 API INTEGRATIONS

| API | Purpose | Status |
|-----|---------|--------|
| Pokemon TCG | Pokemon cards | ✅ Ready |
| Scryfall | Magic cards | ✅ Ready |
| PSA Cert | Verify PSA certs | 🔜 Need |
| eBay Sold | Price comps | 🔜 Need |
| TCGPlayer | Prices | ❌ Closed |
| Sports Card API | Sports cards | 🔜 Research |

---

*Created: 2026-02-11*
*Author: Botskii*
*Status: APPROVED — EXECUTING*
