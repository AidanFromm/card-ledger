import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ImportPage from "./pages/ImportPage";
import AddItem from "./pages/AddItem";
import ScanCard from "./pages/ScanCard";
import ScanBarcode from "./pages/ScanBarcode";
import ScanAI from "./pages/ScanAI";
import Sales from "./pages/Sales";
import Alerts from "./pages/Alerts";
import GradingTracker from "./pages/GradingTracker";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ClientListView from "./pages/ClientListView";
import ShareView from "./pages/ShareView";
import ProtectedRoute from "./components/ProtectedRoute";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { useBackgroundImageFetch } from "./hooks/useBackgroundImageFetch";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="cardledger-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OfflineIndicator />
          <BackgroundTasks />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Landing />} />
            <Route path="/loading" element={<Index />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
            <Route path="/add" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><ScanCard /></ProtectedRoute>} />
            <Route path="/scan/barcode" element={<ProtectedRoute><ScanBarcode /></ProtectedRoute>} />
            <Route path="/scan/ai" element={<ProtectedRoute><ScanAI /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/grading" element={<ProtectedRoute><GradingTracker /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/client-list/:shareToken" element={<ClientListView />} />
            <Route path="/share/:shareToken" element={<ShareView />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
