# CardLedger Builder Log

## 2026-02-21 2:35 AM MST
**Task:** Add DesktopSidebar navigation to all core pages
**Changes:** Modified 6 pages (Dashboard, Inventory, ScanCard, Sales, Profile, Analytics) to render the `DesktopSidebar` component on md+ screens. Previously only Stats and Trends had it — meaning desktop users had no sidebar navigation on the most important pages. Also created `AppLayout.tsx` wrapper component for future use.
**Impact:** Desktop users now have consistent sidebar navigation across all core pages. This is a major UX fix — previously desktop users could only navigate via the mobile bottom nav or URL bar on 6 out of 8 main pages.
**Next suggestion:** Add DesktopSidebar to remaining secondary pages (Wishlist, Settings, Help, MarketData, GradingCenter, etc.) or migrate all pages to use the AppLayout wrapper for consistency.
