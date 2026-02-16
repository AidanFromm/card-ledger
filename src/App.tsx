import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { useBackgroundImageFetch } from "./hooks/useBackgroundImageFetch";
import { supabase } from "./integrations/supabase/client";

// Eager load critical pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load all other pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const ImportPage = lazy(() => import("./pages/ImportPage"));
const AddItem = lazy(() => import("./pages/AddItem"));
const ScanCard = lazy(() => import("./pages/ScanCard"));
const ScanBarcode = lazy(() => import("./pages/ScanBarcode"));
const ScanAI = lazy(() => import("./pages/ScanAI"));
const Sales = lazy(() => import("./pages/Sales"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const SetCompletion = lazy(() => import("./pages/SetCompletion"));
const GradingCenter = lazy(() => import("./pages/GradingCenter"));
const MarketTrends = lazy(() => import("./pages/MarketTrends"));
const MarketData = lazy(() => import("./pages/MarketData"));
const TradingHub = lazy(() => import("./pages/TradingHub"));
const Profile = lazy(() => import("./pages/Profile"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const Leaderboards = lazy(() => import("./pages/Leaderboards"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const ClientListView = lazy(() => import("./pages/ClientListView"));
const ClientLists = lazy(() => import("./pages/ClientLists"));
const ClientListDetail = lazy(() => import("./pages/ClientListDetail"));
const ShareView = lazy(() => import("./pages/ShareView"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Analytics = lazy(() => import("./pages/Analytics"));
const EbayConnect = lazy(() => import("./pages/EbayConnect"));
const EbayListings = lazy(() => import("./pages/EbayListings"));
const Settings = lazy(() => import("./pages/Settings"));
const TaxReports = lazy(() => import("./pages/TaxReports"));

// Lazy load protected route wrapper
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

// What's New modal for announcing features
import { WhatsNewModal } from "./components/WhatsNew";

// Global Search (replaces CommandPalette for Cmd+K)
import { GlobalSearch } from "./components/GlobalSearch";
import { useGlobalSearch } from "./hooks/useGlobalSearch";

// Keyboard shortcuts hint
import { KeyboardShortcutsHint } from "./components/KeyboardShortcuts";

const queryClient = new QueryClient();

// Loading fallback for lazy loaded components
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

// Component that handles background tasks
const BackgroundTasks = () => {
  const { startBackgroundFetch } = useBackgroundImageFetch();

  useEffect(() => {
    // Start background image fetch when user is authenticated
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Delay to let app settle
        setTimeout(() => {
          startBackgroundFetch();
        }, 3000);
      }
    };

    checkAuthAndFetch();

    // Also listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setTimeout(() => {
          startBackgroundFetch();
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  }, [startBackgroundFetch]);

  return null;
};

// Global Search Provider Component
const GlobalSearchProvider = () => {
  const { isOpen, close } = useGlobalSearch();
  return <GlobalSearch isOpen={isOpen} onClose={close} />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="cardledger-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <BackgroundTasks />
            <OfflineIndicator />
            <WhatsNewModal />
            <GlobalSearchProvider />
            <KeyboardShortcutsHint />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes - eager loaded */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Public share routes - lazy loaded */}
                <Route path="/list/:shareToken" element={<ClientListView />} />
                <Route path="/share/:shareToken" element={<ShareView />} />
                <Route path="/u/:username" element={<PublicProfile />} />
                
                {/* Protected routes - lazy loaded */}
                <Route path="/home" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Index /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/dashboard" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/inventory" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Inventory /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/import" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><ImportPage /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/add" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><AddItem /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/scan" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><ScanCard /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/scan/barcode" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><ScanBarcode /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/scan/ai" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><ScanAI /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/sales" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Sales /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/alerts" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Alerts /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/wishlist" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Wishlist /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/sets" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><SetCompletion /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/grading" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><GradingCenter /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/market" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><MarketData /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/market-legacy" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><MarketTrends /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/trade" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><TradingHub /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/profile" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Profile /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/achievements" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><AchievementsPage /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/leaderboards" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Leaderboards /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/goals" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><GoalsPage /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/analytics" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Analytics /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/lists" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><ClientLists /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/lists/:id" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><ClientListDetail /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/ebay" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><EbayConnect /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/ebay/callback" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><EbayConnect /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/ebay/listings" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><EbayListings /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/settings" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><Settings /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/tax-reports" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute><TaxReports /></ProtectedRoute>
                  </Suspense>
                } />
                
                {/* 404 - eager loaded */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
