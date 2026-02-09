import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIScanner } from "@/components/AIScanner";
import { supabase } from "@/integrations/supabase/client";
import { AddToInventoryDialog } from "@/components/AddToInventoryDialog";
import { PageTransition } from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

type ScanState =
  | "idle"
  | "scanning"
  | "processing"
  | "success"
  | "error"
  | "not_configured";

interface RecognitionResult {
  card: {
    name: string;
    set_name: string;
    card_number?: string;
    image_url?: string;
    market_price?: number;
    category?: string;
    player?: string;
    team?: string;
    year?: number;
    brand?: string;
  };
  confidence: number;
  alternatives?: any[];
}

const ScanAI = () => {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [recognitionResult, setRecognitionResult] =
    useState<RecognitionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleStartScan = () => {
    setIsScannerOpen(true);
    setScanState("scanning");
  };

  const handleScannerClose = () => {
    setIsScannerOpen(false);
    if (scanState === "scanning") {
      setScanState("idle");
    }
  };

  const handleImageCapture = useCallback(async (base64Image: string) => {
    setIsScannerOpen(false);
    setScanState("processing");

    try {
      // Call Ximilar edge function
      const { data, error } = await supabase.functions.invoke(
        "ximilar-recognize",
        {
          body: { image: base64Image },
        }
      );

      if (error) throw error;

      // Check if API is not configured
      if (data?.setup_required) {
        setScanState("not_configured");
        return;
      }

      if (data?.card) {
        setRecognitionResult({
          card: data.card,
          confidence: data.confidence || 0,
          alternatives: data.alternatives,
        });
        setScanState("success");
      } else {
        setErrorMessage(
          "Could not identify the card. Please try again with a clearer image."
        );
        setScanState("error");
      }
    } catch (error: any) {
      console.error("AI recognition error:", error);
      setErrorMessage(error.message || "Failed to identify card");
      setScanState("error");
    }
  }, []);

  const handleAddToInventory = () => {
    if (recognitionResult?.card) {
      setIsDialogOpen(true);
    }
  };

  const handleReset = () => {
    setScanState("idle");
    setRecognitionResult(null);
    setErrorMessage("");
  };

  // Format product for AddToInventoryDialog
  const productForDialog = recognitionResult?.card
    ? {
        id: `ai-${Date.now()}`,
        name: recognitionResult.card.name,
        set_name: recognitionResult.card.set_name,
        card_number: recognitionResult.card.card_number || null,
        image_url: recognitionResult.card.image_url || null,
        market_price: recognitionResult.card.market_price || null,
        category: recognitionResult.card.category || "raw",
      }
    : null;

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-11 w-11 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                AI Scanner
                <Sparkles className="w-6 h-6 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Identify cards instantly with AI
              </p>
            </div>
          </div>

          {/* State-based content */}
          <AnimatePresence mode="wait">
            {/* Idle State */}
            {scanState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="glass-card p-8 text-center">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/15 flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    AI Card Recognition
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Take a photo of any trading card and let AI identify it
                    instantly
                  </p>
                  <Button
                    onClick={handleStartScan}
                    className="w-full h-14 rounded-xl text-lg font-semibold"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Scan Card
                  </Button>
                </div>

                {/* Supported card types */}
                <div className="glass-card p-4">
                  <h3 className="font-medium mb-3">Supported Card Types</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Pokemon TCG
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Sports Cards
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Magic: The Gathering
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Yu-Gi-Oh!
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      One Piece
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Disney Lorcana
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Processing State */}
            {scanState === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-8 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/15 flex items-center justify-center mb-6 relative">
                  <Sparkles className="w-10 h-10 text-primary" />
                  <motion.div
                    className="absolute inset-0 rounded-3xl border-2 border-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <h2 className="text-xl font-semibold mb-2">Identifying Card</h2>
                <p className="text-muted-foreground">
                  AI is analyzing your image...
                </p>
                <div className="mt-4 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              </motion.div>
            )}

            {/* Success State */}
            {scanState === "success" && recognitionResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Confidence indicator */}
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm text-muted-foreground">
                    Confidence: {recognitionResult.confidence}%
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>

                {/* Recognized Card */}
                <div className="glass-card overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {recognitionResult.card.image_url ? (
                      <img
                        src={recognitionResult.card.image_url}
                        alt={recognitionResult.card.name}
                        className="w-24 h-32 object-contain rounded-lg bg-secondary/30"
                      />
                    ) : (
                      <div className="w-24 h-32 rounded-lg bg-secondary/30 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-2">
                        {recognitionResult.card.name}
                        {recognitionResult.card.card_number && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            #{recognitionResult.card.card_number}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {recognitionResult.card.set_name}
                      </p>

                      {/* Sports card info */}
                      {recognitionResult.card.player && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {recognitionResult.card.player}
                          {recognitionResult.card.team &&
                            ` • ${recognitionResult.card.team}`}
                        </p>
                      )}

                      {recognitionResult.card.market_price && (
                        <p className="text-lg font-bold text-success mt-2">
                          ${recognitionResult.card.market_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alternative matches */}
                {recognitionResult.alternatives &&
                  recognitionResult.alternatives.length > 0 && (
                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium mb-3">
                        Other Possible Matches
                      </h4>
                      <div className="space-y-2">
                        {recognitionResult.alternatives
                          .slice(0, 3)
                          .map((alt, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                            >
                              <span className="text-sm">{alt.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {alt.confidence}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Scan Another
                  </Button>
                  <Button
                    onClick={handleAddToInventory}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Inventory
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Not Configured State */}
            {scanState === "not_configured" && (
              <motion.div
                key="not_configured"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="glass-card p-8 text-center">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-warning/15 flex items-center justify-center mb-6">
                    <Settings className="w-10 h-10 text-warning" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Setup Required</h2>
                  <p className="text-muted-foreground mb-4">
                    AI card recognition requires Ximilar API configuration.
                  </p>
                  <div className="text-left bg-secondary/30 rounded-xl p-4 text-sm">
                    <p className="font-medium mb-2">To enable AI scanning:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Sign up at ximilar.com (free tier: 3,000 credits/mo)</li>
                      <li>Get your API key from the dashboard</li>
                      <li>Add XIMILAR_API_KEY to Supabase secrets</li>
                    </ol>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full h-12 rounded-xl"
                >
                  Go Back
                </Button>
              </motion.div>
            )}

            {/* Error State */}
            {scanState === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="glass-card p-8 text-center">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-destructive/15 flex items-center justify-center mb-6">
                    <XCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Recognition Failed
                  </h2>
                  <p className="text-muted-foreground">
                    {errorMessage ||
                      "Could not identify the card. Please try again."}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/add")}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Add Manually
                  </Button>
                  <Button
                    onClick={handleReset}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </PageTransition>

      {/* AI Scanner Modal */}
      <AIScanner
        isOpen={isScannerOpen}
        onClose={handleScannerClose}
        onImageCapture={handleImageCapture}
      />

      {/* Add to Inventory Dialog */}
      <AddToInventoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={productForDialog}
      />

      <BottomNav />
    </div>
  );
};

export default ScanAI;
