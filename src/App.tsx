import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { WhatsNew } from "./components/WhatsNew";
import { useBackgroundImageFetch } from "./hooks/useBackgroundImageFetch";
import { supabase } from "./integrations/supabase/client";

// Lazy-loaded route pages
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const AddItem = lazy(() => import("./pages/AddItem"));
const ScanCard = lazy(() => import("./pages/ScanCard"));
const ScanBarcode = lazy(() => import("./pages/ScanBarcode"));
const ScanAI = lazy(() => import("./pages/ScanAI"));
const Sales = lazy(() => import("./pages/Sales"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ClientListView = lazy(() => import("./pages/ClientListView"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const Stats = lazy(() => import("./pages/Stats"));
const Trends = lazy(() => import("./pages/Trends"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Loading fallback for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Component that handles background tasks
const BackgroundTasks = () => {
  const { startBackgroundFetch } = useBackgroundImageFetch();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setTimeout(() => {
          startBackgroundFetch();
        }, 3000);
      }
    };

    checkAuthAndFetch();

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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="cardledger-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OfflineIndicator />
            <WhatsNew />
            <BackgroundTasks />
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><Dashboard /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/inventory" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><Inventory /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/add" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><AddItem /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/scan" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><ScanCard /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/scan/barcode" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><ScanBarcode /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/scan/ai" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><ScanAI /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/sales" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><Sales /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/profile" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><Profile /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/stats" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><Stats /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/trends" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><Trends /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/client-list/:shareToken" element={<ClientListView />} />
                  <Route path="/onboarding" element={<OnboardingFlow />} />
                  <Route path="/help" element={
                    <Suspense fallback={<PageLoader />}><ProtectedRoute><Help /></ProtectedRoute></Suspense>
                  } />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
