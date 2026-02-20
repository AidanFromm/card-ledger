# CardLedger Complete Overhaul Plan
## Date: 2026-02-20

### Priority 1: Critical Bugs (Broken Functionality)

#### 1A. Search Results Show Empty Cards
- **Problem**: Searching "158" shows 4 blank skeleton cards with no images
- **Root Cause**: Local Supabase `products` table returns cards matching `card_number.ilike.%158%` but those records have no `image_url`. The img `onError` handler hides the image, leaving blank cards.
- **Fix**: 
  - Add proper placeholder/fallback image when `image_url` is missing or fails
  - Show card name prominently when no image available
  - Prioritize API results (which have images) over local DB results (which may not)
  - In ScanCard.tsx, improve the image fallback UI

#### 1B. Prices Not Updating (Stale for 2 Weeks)
- **Problem**: Inventory prices haven't updated since cards were added
- **Root Cause**: Need to check if there's a price refresh mechanism or if it's purely static
- **Fix**: Implement periodic price refresh, or at minimum refresh on page load

#### 1C. Analytics "For You" Images Not Loading
- **Problem**: AI-powered recommendations show CardLedger logo instead of card images
- **Root Cause**: SmartRecommendations component likely using placeholder or failing to load images
- **Fix**: Ensure recommendation cards pull real images from API

### Priority 2: UI/UX Overhaul

#### 2A. Onboarding Flow
- **Problems**: AI-generated images look bad, too much text, buttons are ugly
- **Fix**: 
  - Replace AI images with clean icons or animated illustrations
  - Reduce text to single compelling sentences
  - Modern pill buttons, smooth page transitions
  - Add subtle animations (not gifs necessarily, but motion)

#### 2B. Login/Auth Page
- **Problems**: Logo at top doesn't blend well
- **Fix**: 
  - Use actual CardLedger logo properly styled
  - Polish the overall layout
  - Ensure glassmorphism card looks premium

#### 2C. Search Result Cards & Selection UI
- **Problems**: Card grid looks cheap, selection dialog is ugly
- **Fix**: 
  - Better card shadows, hover states
  - Improved image display with proper fallbacks
  - Cleaner selection/detail dialog
  - Better typography and spacing

#### 2D. Overall Polish
- Every page needs consistency check
- Ensure navy blue theme is consistent
- Improve empty states
- Better loading states (not just gray blocks)

### Execution Order
1. Fix search image fallbacks (ScanCard.tsx) ← MOST VISIBLE BUG
2. Fix Analytics "For You" images
3. Overhaul onboarding flow
4. Polish Auth page
5. Price refresh mechanism
6. Full page QA pass
