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
  Crown,
  Lock,
  Search,
  RefreshCw,
  Zap,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AIScanner } from "@/components/AIScanner";
import { supabase } from "@/integrations/supabase/client";
import { AddToInventoryDialog } from "@/components/AddToInventoryDialog";
import { PageTransition } from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import CardImage from "@/components/CardImage";
import { useSubscription } from "@/hooks/useSubscription";

type ScanState =
  | "idle"
  | "scanning"
  | "processing"
  | "success"
  | "error"
  | "not_configured"
  | "limit_reached";

interface CardMatch {
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
}

interface RecognitionResult {
  card: CardMatch;
  confidence: number;
  alternatives?: Array<{ name: string; confidence: number; card?: CardMatch }>;
}

const processingMessages = [
  "Analyzing card image...",
  "Detecting card features...",
  "Matching against database...",
  "Finding best matches...",
  "Fetching pricing data...",
];

const ScanAI = () => {
  const navigate = useNavigate();
  const subscription = useSubscription();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [recognitionResult, setRecognitionResult] =
    useState<RecognitionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<CardMatch | null>(null);

  const handleStartScan = () => {
    // Check scan limit
    if (!subscription.canScan()) {
      setScanState("limit_reached");
      return;
    }
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
    setProcessingStep(0);

    // Animate through processing messages
    const messageInterval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev >= processingMessages.length - 1) {
          clearInterval(messageInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    try {
      // Call Ximilar edge function
      const { data, error } = await supabase.functions.invoke(
        "ximilar-recognize",
        {
          body: { image: base64Image },
        }
      );

      clearInterval(messageInterval);

      if (error) throw error;

      // Check if API is not configured
      if (data?.setup_required) {
        setScanState("not_configured");
        return;
      }

      if (data?.card) {
        // Increment scan count
        subscription.incrementScanCount();

        setRecognitionResult({
          card: data.card,
          confidence: data.confidence || 0,
          alternatives: data.alternatives,
        });
        setSelectedMatch(data.card);
        setScanState("success");
      } else {
        setErrorMessage(
          "Could not identify the card. Please try again with a clearer image."
        );
        setScanState("error");
      }
    } catch (error: any) {
      clearInterval(messageInterval);
      console.error("AI recognition error:", error);
      setErrorMessage(error.message || "Failed to identify card");
      setScanState("error");
    }
  }, [subscription]);

  const handleSelectAlternative = (alt: { name: string; confidence: number; card?: CardMatch }) => {
    if (alt.card) {
      setSelectedMatch(alt.card);
    }
  };

  const handleAddToInventory = () => {
    if (selectedMatch) {
      setIsDialogOpen(true);
    }
  };

  const handleReset = () => {
    setScanState("idle");
    setRecognitionResult(null);
    setSelectedMatch(null);
    setErrorMessage("");
    setProcessingStep(0);
  };

  const handleRejectMatch = () => {
    // Clear the selected match but keep alternatives visible
    setSelectedMatch(null);
  };

  // Format product for AddToInventoryDialog
  const productForDialog = selectedMatch
    ? {
        id: `ai-${Date.now()}`,
        name: selectedMatch.name,
        set_name: selectedMatch.set_name,
        card_number: selectedMatch.card_number || null,
        image_url: selectedMatch.image_url || null,
        market_price: selectedMatch.market_price || null,
        category: selectedMatch.category || "raw",
      }
    : null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-success";
    if (confidence >= 60) return "text-amber-500";
    return "text-destructive";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 85) return "High Confidence";
    if (confidence >= 60) return "Medium Confidence";
    return "Low Confidence";
  };

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
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                AI Scanner
                <Sparkles className="w-6 h-6 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Identify cards instantly with AI
              </p>
            </div>
            {/* Scan counter */}
            {!subscription.isPro && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Scans left</p>
                <p className="text-lg font-bold text-primary">
                  {subscription.scansRemaining()}
                </p>
              </div>
            )}
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
                    instantly with pricing data
                  </p>
                  <Button
                    onClick={handleStartScan}
                    className="w-full h-14 rounded-xl text-lg font-semibold"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Scan Card
                  </Button>
                </div>

                {/* Usage Info */}
                {!subscription.isPro && (
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Monthly Scans</span>
                      <span className="text-sm text-muted-foreground">
                        {subscription.scanCount} / {subscription.scanLimit}
                      </span>
                    </div>
                    <Progress 
                      value={(subscription.scanCount / subscription.scanLimit) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {subscription.plan === "trial" 
                        ? `Trial: ${subscription.trialDaysLeft} days remaining`
                        : "Upgrade to Pro for unlimited scans"}
                    </p>
                  </div>
                )}

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
                {/* Animated scanner icon */}
                <div className="w-32 h-32 mx-auto mb-6 relative">
                  {/* Outer rotating ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary/20"
                    style={{ borderTopColor: "hsl(var(--primary))" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Middle pulsing ring */}
                  <motion.div
                    className="absolute inset-3 rounded-full border-2 border-primary/40"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Inner icon */}
                  <div className="absolute inset-6 rounded-full bg-primary/15 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Sparkles className="w-10 h-10 text-primary" />
                    </motion.div>
                  </div>
                  {/* Scanning line */}
                  <motion.div
                    className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                    animate={{ top: ["20%", "80%", "20%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                <h2 className="text-xl font-semibold mb-2">Analyzing Card</h2>
                <motion.p
                  key={processingStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-muted-foreground"
                >
                  {processingMessages[processingStep]}
                </motion.p>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {processingMessages.map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i <= processingStep ? "bg-primary" : "bg-primary/20"
                      }`}
                      animate={i === processingStep ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  ))}
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
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getConfidenceColor(recognitionResult.confidence)}`}>
                      {getConfidenceLabel(recognitionResult.confidence)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({recognitionResult.confidence}%)
                    </span>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${getConfidenceColor(recognitionResult.confidence)}`} />
                </div>

                {/* Main Match Card */}
                {selectedMatch && (
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="glass-card overflow-hidden border-2 border-primary/30"
                  >
                    <div className="p-1 bg-primary/10 text-center">
                      <span className="text-xs font-medium text-primary">
                        {selectedMatch === recognitionResult.card ? "Best Match" : "Selected Match"}
                      </span>
                    </div>
                    <div className="flex gap-4 p-4">
                      <CardImage
                        src={selectedMatch.image_url}
                        alt={selectedMatch.name}
                        size="lg"
                        rounded="lg"
                        containerClassName="w-28 h-36 bg-secondary/30"
                        className="w-full h-full object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {selectedMatch.name}
                        </h3>
                        {selectedMatch.card_number && (
                          <p className="text-sm text-muted-foreground">
                            #{selectedMatch.card_number}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedMatch.set_name}
                        </p>

                        {/* Sports card info */}
                        {selectedMatch.player && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedMatch.player}
                            {selectedMatch.team && ` • ${selectedMatch.team}`}
                          </p>
                        )}

                        {selectedMatch.market_price ? (
                          <p className="text-2xl font-bold text-success mt-3">
                            ${selectedMatch.market_price.toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-3">
                            Price not available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Match confirmation buttons */}
                    <div className="flex border-t border-border/50">
                      <button
                        onClick={handleRejectMatch}
                        className="flex-1 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Not This Card
                      </button>
                      <div className="w-px bg-border/50" />
                      <button
                        onClick={handleAddToInventory}
                        className="flex-1 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Match
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Alternative matches - show if low confidence or user rejected */}
                {(recognitionResult.confidence < 85 || !selectedMatch) &&
                  recognitionResult.alternatives &&
                  recognitionResult.alternatives.length > 0 && (
                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        {!selectedMatch ? "Select the correct card:" : "Other Possible Matches"}
                      </h4>
                      <div className="space-y-2">
                        {recognitionResult.alternatives.slice(0, 3).map((alt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectAlternative(alt)}
                            className="w-full flex items-center justify-between py-3 px-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                          >
                            <div className="text-left">
                              <span className="text-sm font-medium block">{alt.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Tap to select this match
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${getConfidenceColor(alt.confidence)}`}>
                                {alt.confidence}%
                              </span>
                            </div>
                          </button>
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
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Scan Another
                  </Button>
                  <Button
                    onClick={handleAddToInventory}
                    disabled={!selectedMatch}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Inventory
                  </Button>
                </div>

                {/* Manual search fallback */}
                <Button
                  variant="ghost"
                  onClick={() => navigate("/add")}
                  className="w-full h-10 text-muted-foreground"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search manually instead
                </Button>
              </motion.div>
            )}

            {/* Scan Limit Reached State */}
            {scanState === "limit_reached" && (
              <motion.div
                key="limit_reached"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="glass-card p-8 text-center">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 flex items-center justify-center mb-6">
                    <Crown className="w-10 h-10 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Scan Limit Reached
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    You've used all your free scans this month. Upgrade to Pro for unlimited AI scanning!
                  </p>

                  {/* Pro Benefits */}
                  <div className="text-left bg-gradient-to-br from-amber-500/10 to-primary/10 rounded-2xl p-4 mb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Pro Benefits
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Unlimited AI card scans
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Priority processing speed
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Advanced price analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Price alerts & notifications
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => navigate("/profile")}
                    className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-amber-500 to-primary hover:opacity-90"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate("/add")}
                  className="w-full h-12 rounded-xl"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Manually Instead
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="w-full h-10 text-muted-foreground"
                >
                  Go Back
                </Button>
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
                  <p className="text-muted-foreground mb-4">
                    {errorMessage || "Could not identify the card. Please try again."}
                  </p>
                  <div className="text-left bg-secondary/30 rounded-xl p-4 text-sm">
                    <p className="font-medium mb-2">Tips for better results:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Ensure good lighting without glare</li>
                      <li>• Center the card in the frame</li>
                      <li>• Make sure the image is in focus</li>
                      <li>• Try a different angle</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/add")}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search Manually
                  </Button>
                  <Button
                    onClick={handleReset}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
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
