# CardLedger Image/Card UI System — Mega Plan

## 📐 Card Image Fundamentals

### Standard Card Aspect Ratio
- **Pokemon/TCG cards:** 2.5" × 3.5" = **ratio 0.714 (5:7)**
- **Sports cards:** Same ratio (2.5" × 3.5")
- **Graded slabs:** Slightly taller due to case (~0.65 ratio)

### Image Sources
- Pokemon TCG API: `small` (245×342) and `large` (734×1024)
- eBay listings: Variable
- User uploads: Need to enforce aspect ratio

---

## 🎯 Size System (Consistent Across App)

| Size Name | Width | Height | Use Case |
|-----------|-------|--------|----------|
| **xs** | 40px | 56px | Inline mentions, activity feed |
| **sm** | 60px | 84px | List view rows, search results compact |
| **md** | 80px | 112px | Grid cards (mobile), top movers |
| **lg** | 120px | 168px | Grid cards (desktop), detail preview |
| **xl** | 160px | 224px | Featured cards, hero sections |
| **2xl** | 200px | 280px | Full detail view, modal |
| **full** | 300px | 420px | Zoom view, image viewer |

### CSS Classes to Create
```css
.card-img-xs { width: 40px; height: 56px; }
.card-img-sm { width: 60px; height: 84px; }
.card-img-md { width: 80px; height: 112px; }
.card-img-lg { width: 120px; height: 168px; }
.card-img-xl { width: 160px; height: 224px; }
.card-img-2xl { width: 200px; height: 280px; }
.card-img-full { width: 300px; height: 420px; }
```

---

## 📍 Image Placement by Page

### 1. Dashboard
| Component | Size | Notes |
|-----------|------|-------|
| Top Movers cards | **md** (80×112) | Horizontal scroll, 4-6 visible |
| Best Performer | **lg** (120×168) | Featured with glow effect |
| Activity feed | **xs** (40×56) | Inline with text |
| Quick stats | **sm** (60×84) | If showing card preview |

### 2. Inventory
| View | Size | Notes |
|------|------|-------|
| Grid (mobile) | **md** (80×112) | 3 columns |
| Grid (tablet) | **lg** (120×168) | 4 columns |
| Grid (desktop) | **lg** (120×168) | 5-6 columns |
| List view | **sm** (60×84) | Left-aligned with details |
| Table view | **xs** (40×56) | Compact row |

### 3. Add Card / Search
| Component | Size | Notes |
|-----------|------|-------|
| Search results | **sm** (60×84) | List format |
| Selected card preview | **xl** (160×224) | Centered, prominent |
| Recent searches | **xs** (40×56) | Compact list |

### 4. Card Detail Modal
| Component | Size | Notes |
|-----------|------|-------|
| Main image | **2xl** (200×280) | Centered, tap to zoom |
| Zoom view | **full** (300×420) | Fullscreen overlay |
| Related cards | **sm** (60×84) | Horizontal scroll |

### 5. Wishlist
| View | Size | Notes |
|------|------|-------|
| Grid | **md** (80×112) | Same as inventory |
| Target price overlay | — | Badge on image |

### 6. Grading Center
| Component | Size | Notes |
|-----------|------|-------|
| Pipeline cards | **sm** (60×84) | Compact for Kanban |
| Submission detail | **lg** (120×168) | Side panel |
| Slab overlay | — | PSA/CGC case frame |

### 7. Trading Hub
| Component | Size | Notes |
|-----------|------|-------|
| Trade calculator cards | **md** (80×112) | Two columns |
| Trade history | **sm** (60×84) | Compact rows |

### 8. Set Completion
| Component | Size | Notes |
|-----------|------|-------|
| Set grid | **md** (80×112) | Show owned/missing |
| Grayscale for missing | — | CSS filter |

### 9. Market Data
| Component | Size | Notes |
|-----------|------|-------|
| Trending cards | **md** (80×112) | Horizontal scroll |
| Search results | **lg** (120×168) | Detail view |

### 10. Client Lists
| Component | Size | Notes |
|-----------|------|-------|
| List grid | **md** (80×112) | Standard grid |
| Public share view | **lg** (120×168) | Professional display |

### 11. Analytics
| Component | Size | Notes |
|-----------|------|-------|
| Top performers | **sm** (60×84) | Table rows |
| Portfolio preview | **md** (80×112) | If showing cards |

### 12. Sales
| Component | Size | Notes |
|-----------|------|-------|
| Sale history | **sm** (60×84) | Table rows |
| Record sale dialog | **lg** (120×168) | Selected card |

---

## 🎨 Image Component Features

### CardImage Component Props
```tsx
interface CardImageProps {
  src: string;
  alt: string;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  graded?: {
    company: 'PSA' | 'CGC' | 'BGS' | 'SGC';
    grade: number;
  };
  condition?: 'mint' | 'nm' | 'lp' | 'mp' | 'hp' | 'damaged';
  owned?: boolean; // false = grayscale
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  className?: string;
}
```

### Visual Features
1. **Lazy loading** — Images load as they scroll into view
2. **Placeholder skeleton** — Shimmer effect while loading
3. **Error fallback** — Generic card back image if load fails
4. **Graded slab overlay** — PSA/CGC case frame around image
5. **Condition badge** — Corner badge showing condition
6. **Owned/Missing state** — Grayscale + opacity for missing
7. **Hover zoom** — Slight scale up on hover
8. **Tap to expand** — Opens full-size modal

### Graded Slab Overlays
- PSA: Red case frame
- CGC: Black case frame  
- BGS: Gold/black case frame
- SGC: Teal case frame
- Include grade number badge

---

## 🔧 Technical Implementation

### 1. Create CardImage Component
```
src/components/CardImage.tsx
```
- Handles all sizing
- Lazy loading with IntersectionObserver
- Skeleton placeholder
- Error fallback
- Graded overlay
- Condition badge

### 2. Create CSS Classes
```
src/index.css
```
- Add .card-img-* classes
- Add .card-slab-* for graded overlays
- Add .card-grayscale for missing cards

### 3. Update All Pages
- Replace all `<img>` tags for cards with `<CardImage>`
- Apply consistent sizing per the table above

### 4. Image Optimization
- Use `small` API images for thumbnails (xs-md)
- Use `large` API images for detail views (lg+)
- Implement srcset for responsive images
- Add loading="lazy" to all below-fold images

### 5. Fallback Images
```
public/card-back.png — Generic card back
public/card-placeholder.png — Loading placeholder
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Grid Columns | Card Size |
|------------|--------------|-----------|
| < 480px (mobile) | 3 | md |
| 480-768px (tablet) | 4 | md |
| 768-1024px (small desktop) | 5 | lg |
| > 1024px (desktop) | 6 | lg |

---

## ✅ Execution Checklist

### Phase 1: Foundation
- [ ] Create CardImage component with all props
- [ ] Add CSS classes for sizes
- [ ] Create placeholder/fallback images
- [ ] Add graded slab overlay SVGs

### Phase 2: Update Pages
- [ ] Dashboard — Top movers, activity feed
- [ ] Inventory — Grid, list, table views
- [ ] Add Card — Search results, preview
- [ ] Detail Modal — Main image, zoom
- [ ] Wishlist — Grid with price overlay
- [ ] Grading Center — Pipeline cards
- [ ] Trading Hub — Calculator cards
- [ ] Set Completion — Owned/missing grid
- [ ] Market Data — Trending, search
- [ ] Client Lists — Grid and public view
- [ ] Analytics — Top performers
- [ ] Sales — History table

### Phase 3: Polish
- [ ] Test all loading states
- [ ] Verify lazy loading works
- [ ] Check mobile responsiveness
- [ ] Verify graded overlays look good
- [ ] Test error fallbacks

---

*Created: 2026-02-14*
*Goal: Consistent, professional card images across the entire app*
