import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flashlight, FlashlightOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string, format: string) => void;
  onScanError: (error: string) => void;
}

export const BarcodeScanner = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanError,
}: BarcodeScannerProps) => {
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Dynamic import of MLKit to avoid SSR issues
  const startScanning = useCallback(async () => {
    try {
      // @ts-ignore - Dynamic import for Capacitor plugin
      const { BarcodeScanner: MLKitScanner, BarcodeFormat, LensFacing } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );

      // Request permissions
      const { camera } = await MLKitScanner.requestPermissions();
      if (camera !== "granted") {
        setPermissionGranted(false);
        onScanError("Camera permission denied. Please enable camera access in Settings.");
        return;
      }
      setPermissionGranted(true);

      // Check if supported
      const { supported } = await MLKitScanner.isSupported();
      if (!supported) {
        onScanError("Barcode scanning is not supported on this device.");
        return;
      }

      setIsScanning(true);

      // Add listener for barcode detection
      const listener = await MLKitScanner.addListener(
        "barcodeScanned",
        (result: any) => {
          if (result.barcode) {
            // Haptic feedback on scan
            if (navigator.vibrate) navigator.vibrate(50);

            onScanSuccess(result.barcode.rawValue, result.barcode.format);
            stopScanning();
          }
        }
      );

      // Start the scanner
      await MLKitScanner.startScan({
        formats: [
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.Code128,
        ],
        lensFacing: LensFacing.Back,
      });

      return () => {
        listener.remove();
      };
    } catch (error: any) {
      console.error("Scanner error:", error);
      // Check if we're in a browser (not native)
      if (error.message?.includes("not implemented") || !window.hasOwnProperty("Capacitor")) {
        onScanError("Barcode scanning requires the native iOS app. Please test on a physical device.");
      } else {
        onScanError(error.message || "Failed to start scanner");
      }
    }
  }, [onScanSuccess, onScanError]);

  const stopScanning = async () => {
    try {
      // @ts-ignore
      const { BarcodeScanner: MLKitScanner } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );
      await MLKitScanner.stopScan();
      setIsScanning(false);
      setTorchEnabled(false);
    } catch (error) {
      console.error("Error stopping scan:", error);
    }
  };

  // Start scanning when modal opens
  useEffect(() => {
    if (!isOpen) return;

    startScanning();

    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning]);

  const toggleTorch = async () => {
    try {
      // @ts-ignore
      const { BarcodeScanner: MLKitScanner } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );
      await MLKitScanner.toggleTorch();
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error("Error toggling torch:", error);
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black scanner-visible"
        >
          {/* Camera view is rendered natively behind WebView */}
          {/* This container provides the UI overlay */}

          {/* Header with close button */}
          <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
            <div className="flex items-center justify-between px-4 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-11 w-11 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-6 w-6" />
              </Button>

              <h2 className="text-white font-semibold text-lg">Scan Barcode</h2>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTorch}
                className="h-11 w-11 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                {torchEnabled ? (
                  <FlashlightOff className="h-6 w-6" />
                ) : (
                  <Flashlight className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Scanning guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-48">
              {/* Corner guides */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />

              {/* Scanning line animation */}
              <motion.div
                className="absolute left-2 right-2 h-0.5 bg-primary"
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-0 left-0 right-0 pb-safe">
            <div className="text-center pb-8 px-4">
              <p className="text-white/90 font-medium mb-2">
                Position barcode within the frame
              </p>
              <p className="text-white/60 text-sm">
                Works with UPC, EAN, and PSA cert barcodes
              </p>
            </div>
          </div>

          {/* Permission denied state */}
          {permissionGranted === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90">
              <div className="text-center px-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/20 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Camera Access Required
                </h3>
                <p className="text-white/60 text-sm mb-6">
                  Please enable camera access in your device Settings to scan
                  barcodes.
                </p>
                <Button onClick={handleClose} className="rounded-xl">
                  Close
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
