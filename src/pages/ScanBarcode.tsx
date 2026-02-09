import { useState, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "@/components/BarcodeScanner";
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
  | "not_found";

interface LookupResult {
  product: any;
  source: string;
}

const ScanBarcode = () => {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleStartScan = () => {
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
        } else {
          setScanState("not_found");
        }
      } catch (error: any) {
        console.error("Barcode lookup error:", error);
        setErrorMessage(error.message || "Failed to lookup barcode");
        setScanState("error");
      }
    },
    []
  );

  const handleScanError = (error: string) => {
    document.body.classList.remove("barcode-scanner-active");
    setIsScannerOpen(false);
    setErrorMessage(error);
    setScanState("error");
  };

  const handleAddToInventory = () => {
    if (lookupResult?.product) {
      setIsDialogOpen(true);
    }
  };

  const handleReset = () => {
    setScanState("idle");
    setScannedBarcode(null);
    setLookupResult(null);
    setErrorMessage("");
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
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/15 flex items-center justify-center mb-6">
                    <Package className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Ready to Scan</h2>
                  <p className="text-muted-foreground mb-6">
                    Point your camera at a product barcode or PSA certification
                    label
                  </p>
                  <Button
                    onClick={handleStartScan}
                    className="w-full h-14 rounded-xl text-lg font-semibold"
                  >
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
                      Sealed Products
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
                <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/15 flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  Looking Up Product
                </h2>
                <p className="text-muted-foreground">
                  Searching databases for barcode: {scannedBarcode}
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
                {/* Product Card */}
                <div className="glass-card overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {lookupResult.product.image_url ? (
                      <img
                        src={lookupResult.product.image_url}
                        alt={lookupResult.product.name}
                        className="w-24 h-32 object-contain rounded-lg bg-secondary/30"
                      />
                    ) : (
                      <div className="w-24 h-32 rounded-lg bg-secondary/30 flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
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
                        <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                      </div>
                      {lookupResult.product.market_price && (
                        <p className="text-lg font-bold text-success mt-2">
                          ${lookupResult.product.market_price.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Source: {lookupResult.source}
                      </p>
                    </div>
                  </div>
                </div>

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
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-warning/15 flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-warning" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Product Not Found
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    Barcode: {scannedBarcode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This product isn't in our database yet. You can add it
                    manually.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Scan Another
                  </Button>
                  <Button
                    onClick={() => navigate("/add")}
                    className="flex-1 h-12 rounded-xl"
                  >
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
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-destructive/15 flex items-center justify-center mb-6">
                    <XCircle className="w-10 h-10 text-destructive" />
                  </div>
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
