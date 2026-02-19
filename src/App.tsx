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
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

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
import ProtectedRoute from "./components/ProtectedRoute";
const Stats = lazy(() => import("./pages/Stats"));
const Trends = lazy(() => import("./pages/Trends"));
const Help = lazy(() => import("./pages/Help"));
const Legal = lazy(() => import("./pages/Legal"));
const GradingGuide = lazy(() => import("./pages/GradingGuide"));
const OnboardingFlow = lazy(() => import("./components/OnboardingFlow"));

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

// Keyboard shortcuts wrapper (needs to be inside BrowserRouter)
const KeyboardShortcutsProvider = ({ children }: { children: React.ReactNode }) => {
  useKeyboardShortcuts();
  return <>{children}</>;
};

// Screen reader announcer for accessibility
const ScreenReaderAnnouncer = () => {
  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.className = "sr-only";
    el.id = "sr-announcer";
    document.body.appendChild(el);
    return () => { el.remove(); };
  }, []);
  return null;
};

export const announce = (message: string) => {
  const el = document.getElementById("sr-announcer");
  if (el) {
    el.textContent = "";
    requestAnimationFrame(() => { el.textContent = message; });
  }
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="cardledger-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <KeyboardShortcutsProvider>
              <OfflineIndicator />
              <WhatsNew />
              <BackgroundTasks />
              <ScreenReaderAnnouncer />
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                    <Route path="/add" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
                    <Route path="/scan" element={<ProtectedRoute><ScanCard /></ProtectedRoute>} />
                    <Route path="/scan/barcode" element={<ProtectedRoute><ScanBarcode /></ProtectedRoute>} />
                    <Route path="/scan/ai" element={<ProtectedRoute><ScanAI /></ProtectedRoute>} />
                    <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                    <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
                    <Route path="/grading-guide" element={<GradingGuide />} />
                    <Route path="/client-list/:shareToken" element={<ClientListView />} />
                    <Route path="/onboarding" element={<OnboardingFlow />} />
                    <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                    <Route path="/legal" element={<Legal />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </Suspense>
            </KeyboardShortcutsProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
