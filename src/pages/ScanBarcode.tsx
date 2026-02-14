import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Clock,
  Barcode,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { supabase } from "@/integrations/supabase/client";
import { AddToInventoryDialog } from "@/components/AddToInventoryDialog";
import { PageTransition } from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import CardImage from "@/components/CardImage";
import { triggerSuccessHaptic, triggerHaptic, triggerDestructiveHaptic } from "@/lib/haptics";

type ScanState =
  | "idle"
  | "scanning"
  | "processing"
  | "success"
  | "error"
  | "not_found";

interface LookupResult {
  product: any;
  source: string;
}

interface ScanHistoryItem {
  barcode: string;
  format: string;
  timestamp: number;
  productName?: string;
  found: boolean;
}

const SCAN_HISTORY_KEY = "cardledger_scan_history";
const SOUND_ENABLED_KEY = "cardledger_scan_sound";
const MAX_HISTORY_ITEMS = 10;

// Load scan history from localStorage
const loadScanHistory = (): ScanHistoryItem[] => {
  try {
    const stored = localStorage.getItem(SCAN_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save scan history to localStorage
const saveScanHistory = (history: ScanHistoryItem[]) => {
  try {
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    // Storage full or unavailable
  }
};

// Load sound preference
const loadSoundEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored !== null ? JSON.parse(stored) : true;
  } catch {
    return true;
  }
};

const ScanBarcode = () => {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load history and preferences on mount
  useEffect(() => {
    setScanHistory(loadScanHistory());
    setSoundEnabled(loadSoundEnabled());
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(newValue));
  };

  const handleStartScan = () => {
    triggerHaptic('light');
    document.body.classList.add("barcode-scanner-active");
    setIsScannerOpen(true);
    setScanState("scanning");
  };

  const handleScannerClose = () => {
    document.body.classList.remove("barcode-scanner-active");
    setIsScannerOpen(false);
    if (scanState === "scanning") {
      setScanState("idle");
    }
  };

  const addToHistory = (barcode: string, format: string, productName?: string, found: boolean = false) => {
    const newItem: ScanHistoryItem = {
      barcode,
      format,
      timestamp: Date.now(),
      productName,
      found,
    };
    
    // Remove duplicate if exists
    const filteredHistory = scanHistory.filter(item => item.barcode !== barcode);
    const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    
    setScanHistory(newHistory);
    saveScanHistory(newHistory);
  };

  const handleScanSuccess = useCallback(
    async (barcode: string, format: string) => {
      document.body.classList.remove("barcode-scanner-active");
      setIsScannerOpen(false);
      setScannedBarcode(barcode);
      setScanState("processing");

      try {
        // Call edge function to lookup barcode
        const { data, error } = await supabase.functions.invoke(
          "barcode-lookup",
          {
            body: { barcode, format },
          }
        );

        if (error) throw error;

        if (data?.product) {
          setLookupResult({ product: data.product, source: data.source });
          setScanState("success");
          triggerSuccessHaptic();
          addToHistory(barcode, format, data.product.name, true);
        } else {
          setScanState("not_found");
          triggerHaptic('warning');
          addToHistory(barcode, format, undefined, false);
        }
      } catch (error: any) {
        console.error("Barcode lookup error:", error);
        setErrorMessage(error.message || "Failed to lookup barcode");
        setScanState("error");
        triggerDestructiveHaptic();
        addToHistory(barcode, format, undefined, false);
      }
    },
    [scanHistory]
  );

  const handleScanError = (error: string) => {
    document.body.classList.remove("barcode-scanner-active");
    setIsScannerOpen(false);
    setErrorMessage(error);
    setScanState("error");
    triggerDestructiveHaptic();
  };

  const handleAddToInventory = () => {
    if (lookupResult?.product) {
      triggerHaptic('medium');
      setIsDialogOpen(true);
    }
  };

  const handleReset = () => {
    triggerHaptic('light');
    setScanState("idle");
    setScannedBarcode(null);
    setLookupResult(null);
    setErrorMessage("");
  };

  const handleRescan = (item: ScanHistoryItem) => {
    triggerHaptic('medium');
    handleScanSuccess(item.barcode, item.format);
  };

  const clearHistory = () => {
    triggerDestructiveHaptic();
    setScanHistory([]);
    localStorage.removeItem(SCAN_HISTORY_KEY);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
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
            <div>
              <h1 className="text-2xl font-bold">Scan Barcode</h1>
              <p className="text-sm text-muted-foreground">
                Scan product UPC or PSA cert barcode
              </p>
            </div>
          </div>

          {/* State-based content */}
          <AnimatePresence mode="wait">
            {/* Idle State - Ready to scan */}
            {scanState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="glass-card p-8 text-center">
                  <motion.div 
                    className="w-20 h-20 mx-auto rounded-3xl bg-primary/15 flex items-center justify-center mb-6"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Barcode className="w-10 h-10 text-primary" />
                  </motion.div>
                  <h2 className="text-xl font-semibold mb-2">Ready to Scan</h2>
                  <p className="text-muted-foreground mb-6">
                    Point your camera at a product barcode or PSA certification
                    label
                  </p>
                  <Button
                    onClick={handleStartScan}
                    className="w-full h-14 rounded-xl text-lg font-semibold"
                  >
                    <Barcode className="w-5 h-5 mr-2" />
                    Start Scanning
                  </Button>
                </div>

                {/* Supported formats */}
                <div className="glass-card p-4">
                  <h3 className="font-medium mb-3">Supported Formats</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      UPC-A / UPC-E
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      EAN-13 / EAN-8
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      PSA Cert Labels
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      QR Codes
                    </div>
                  </div>
                </div>

                {/* Recent Scans History */}
                {scanHistory.length > 0 && (
                  <div className="glass-card overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-medium">Recent Scans</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="text-muted-foreground hover:text-destructive h-8 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="divide-y divide-border/30">
                      {scanHistory.slice(0, 5).map((item, index) => (
                        <motion.div
                          key={item.barcode + item.timestamp}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            item.found ? 'bg-success/15' : 'bg-warning/15'
                          }`}>
                            {item.found ? (
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            ) : (
                              <Search className="w-5 h-5 text-warning" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.productName || item.barcode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.productName ? item.barcode + ' • ' : ''}{formatTime(item.timestamp)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRescan(item)}
                            className="h-9 w-9 rounded-lg flex-shrink-0"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
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
                <motion.div 
                  className="w-20 h-20 mx-auto rounded-3xl bg-primary/15 flex items-center justify-center mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-10 h-10 text-primary" />
                </motion.div>
                <h2 className="text-xl font-semibold mb-2">
                  Looking Up Product
                </h2>
                <p className="text-muted-foreground mb-4">
                  Searching databases for barcode
                </p>
                <p className="font-mono text-sm bg-secondary/50 px-4 py-2 rounded-lg inline-block">
                  {scannedBarcode}
                </p>
              </motion.div>
            )}

            {/* Success State - Product Found */}
            {scanState === "success" && lookupResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Success badge */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex justify-center"
                >
                  <div className="bg-success/15 text-success px-4 py-2 rounded-full flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Product Found</span>
                  </div>
                </motion.div>

                {/* Product Card */}
                <motion.div 
                  className="glass-card overflow-hidden"
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex gap-4 p-4">
                    <CardImage
                      src={lookupResult.product.image_url}
                      alt={lookupResult.product.name}
                      size="lg"
                      rounded="xl"
                      containerClassName="w-24 h-32 bg-secondary/30"
                      className="w-full h-full object-contain"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold line-clamp-2">
                            {lookupResult.product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {lookupResult.product.set_name}
                          </p>
                        </div>
                      </div>
                      {lookupResult.product.market_price && (
                        <motion.p 
                          className="text-2xl font-bold text-success mt-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          ${lookupResult.product.market_price.toFixed(2)}
                        </motion.p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 bg-secondary/50 px-2 py-1 rounded inline-block">
                        Source: {lookupResult.source}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div 
                  className="flex gap-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <Barcode className="w-5 h-5 mr-2" />
                    Scan Another
                  </Button>
                  <Button
                    onClick={handleAddToInventory}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Inventory
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Not Found State */}
            {scanState === "not_found" && (
              <motion.div
                key="not_found"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="glass-card p-8 text-center">
                  <motion.div 
                    className="w-20 h-20 mx-auto rounded-3xl bg-warning/15 flex items-center justify-center mb-6"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: 2 }}
                  >
                    <Search className="w-10 h-10 text-warning" />
                  </motion.div>
                  <h2 className="text-xl font-semibold mb-2">
                    Product Not Found
                  </h2>
                  <p className="font-mono text-sm bg-secondary/50 px-4 py-2 rounded-lg inline-block mb-4">
                    {scannedBarcode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This product isn't in our database yet. You can add it
                    manually or try scanning again.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <Barcode className="w-5 h-5 mr-2" />
                    Scan Another
                  </Button>
                  <Button
                    onClick={() => navigate("/add")}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Manually
                  </Button>
                </div>
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
                  <motion.div 
                    className="w-20 h-20 mx-auto rounded-3xl bg-destructive/15 flex items-center justify-center mb-6"
                    animate={{ x: [0, -5, 5, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <XCircle className="w-10 h-10 text-destructive" />
                  </motion.div>
                  <h2 className="text-xl font-semibold mb-2">Scan Error</h2>
                  <p className="text-muted-foreground">
                    {errorMessage || "Something went wrong. Please try again."}
                  </p>
                </div>

                <Button
                  onClick={handleReset}
                  className="w-full h-12 rounded-xl"
                >
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </PageTransition>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={handleScannerClose}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
        soundEnabled={soundEnabled}
        onSoundToggle={toggleSound}
      />

      {/* Add to Inventory Dialog */}
      <AddToInventoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={lookupResult?.product || null}
      />

      <BottomNav />
    </div>
  );
};

export default ScanBarcode;
