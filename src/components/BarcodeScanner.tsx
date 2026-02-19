import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flashlight, FlashlightOff, SwitchCamera, Volume2, VolumeX, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerSuccessHaptic, triggerHaptic } from "@/lib/haptics";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string, format: string) => void;
  onScanError: (error: string) => void;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
}

// Success sound (short beep)
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    // Silently fail - sound is optional
  }
};

export const BarcodeScanner = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanError,
  soundEnabled = true,
  onSoundToggle,
}: BarcodeScannerProps) => {
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lensFacing, setLensFacing] = useState<'back' | 'front'>('back');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>("");
  const scannerRef = useRef<any>(null);

  // Dynamic import of MLKit to avoid SSR issues
  const startScanning = useCallback(async () => {
    try {
      // @ts-ignore - Dynamic import for Capacitor plugin
      const { BarcodeScanner: MLKitScanner, BarcodeFormat, LensFacing } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );
      scannerRef.current = MLKitScanner;

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
            setLastScannedBarcode(result.barcode.rawValue);
            
            // Trigger haptic feedback
            triggerSuccessHaptic();
            
            // Play sound if enabled
            if (soundEnabled) {
              playSuccessSound();
            }
            
            // Show success animation
            setShowSuccess(true);
            
            // Delay before closing to show animation
            setTimeout(() => {
              onScanSuccess(result.barcode.rawValue, result.barcode.format);
              stopScanning();
            }, 600);
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
          BarcodeFormat.QrCode,
        ],
        lensFacing: lensFacing === 'back' ? LensFacing.Back : LensFacing.Front,
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
  }, [onScanSuccess, onScanError, lensFacing, soundEnabled]);

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stopScan();
      } else {
        // @ts-ignore
        const { BarcodeScanner: MLKitScanner } = await import(
          "@capacitor-mlkit/barcode-scanning"
        );
        await MLKitScanner.stopScan();
      }
      setIsScanning(false);
      setTorchEnabled(false);
      setShowSuccess(false);
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
      triggerHaptic('light');
      if (scannerRef.current) {
        await scannerRef.current.toggleTorch();
      } else {
        // @ts-ignore
        const { BarcodeScanner: MLKitScanner } = await import(
          "@capacitor-mlkit/barcode-scanning"
        );
        await MLKitScanner.toggleTorch();
      }
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error("Error toggling torch:", error);
    }
  };

  const toggleCamera = async () => {
    try {
      triggerHaptic('medium');
      await stopScanning();
      setLensFacing(prev => prev === 'back' ? 'front' : 'back');
      // Will restart with new lens facing due to dependency
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  };

  // Restart scanner when lens facing changes
  useEffect(() => {
    if (isOpen && permissionGranted) {
      startScanning();
    }
  }, [lensFacing]);

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

          {/* Header with controls */}
          <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
            <div className="flex items-center justify-between px-4 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-11 w-11 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
              >
                <X className="h-6 w-6" />
              </Button>

              <h2 className="text-white font-semibold text-lg">Scan Barcode</h2>

              <div className="flex gap-2">
                {/* Sound toggle */}
                {onSoundToggle && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      triggerHaptic('light');
                      onSoundToggle();
                    }}
                    className="h-11 w-11 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Scanning guide overlay - Premium animated frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-48">
              {/* Animated corner guides */}
              <motion.div 
                className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-primary rounded-tl-2xl"
                animate={{ 
                  opacity: showSuccess ? 1 : [0.6, 1, 0.6],
                  scale: showSuccess ? 1.1 : [1, 1.05, 1],
                  borderColor: showSuccess ? 'hsl(142 76% 36%)' : 'hsl(212 100% 49%)'
                }}
                transition={{ 
                  duration: showSuccess ? 0.3 : 1.5, 
                  repeat: showSuccess ? 0 : Infinity, 
                  ease: "easeInOut" 
                }}
              />
              <motion.div 
                className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-primary rounded-tr-2xl"
                animate={{ 
                  opacity: showSuccess ? 1 : [0.6, 1, 0.6],
                  scale: showSuccess ? 1.1 : [1, 1.05, 1],
                  borderColor: showSuccess ? 'hsl(142 76% 36%)' : 'hsl(212 100% 49%)'
                }}
                transition={{ 
                  duration: showSuccess ? 0.3 : 1.5, 
                  repeat: showSuccess ? 0 : Infinity, 
                  ease: "easeInOut",
                  delay: showSuccess ? 0 : 0.2
                }}
              />
              <motion.div 
                className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-primary rounded-bl-2xl"
                animate={{ 
                  opacity: showSuccess ? 1 : [0.6, 1, 0.6],
                  scale: showSuccess ? 1.1 : [1, 1.05, 1],
                  borderColor: showSuccess ? 'hsl(142 76% 36%)' : 'hsl(212 100% 49%)'
                }}
                transition={{ 
                  duration: showSuccess ? 0.3 : 1.5, 
                  repeat: showSuccess ? 0 : Infinity, 
                  ease: "easeInOut",
                  delay: showSuccess ? 0 : 0.4
                }}
              />
              <motion.div 
                className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-primary rounded-br-2xl"
                animate={{ 
                  opacity: showSuccess ? 1 : [0.6, 1, 0.6],
                  scale: showSuccess ? 1.1 : [1, 1.05, 1],
                  borderColor: showSuccess ? 'hsl(142 76% 36%)' : 'hsl(212 100% 49%)'
                }}
                transition={{ 
                  duration: showSuccess ? 0.3 : 1.5, 
                  repeat: showSuccess ? 0 : Infinity, 
                  ease: "easeInOut",
                  delay: showSuccess ? 0 : 0.6
                }}
              />

              {/* Scanning line animation - hidden on success */}
              <AnimatePresence>
                {!showSuccess && (
                  <motion.div
                    className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </AnimatePresence>

              {/* Success checkmark overlay */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="w-20 h-20 rounded-full bg-success/90 flex items-center justify-center">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom controls and instructions */}
          <div className="absolute bottom-0 left-0 right-0 pb-safe">
            <div className="px-4 pb-8">
              {/* Control buttons */}
              <div className="flex justify-center gap-4 mb-6">
                {/* Camera flip */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCamera}
                  className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20"
                >
                  <SwitchCamera className="h-6 w-6" />
                </Button>

                {/* Torch */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTorch}
                  className={`h-14 w-14 rounded-full backdrop-blur-sm border transition-colors ${
                    torchEnabled 
                      ? 'bg-primary text-white border-primary hover:bg-primary/90' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  {torchEnabled ? (
                    <FlashlightOff className="h-6 w-6" />
                  ) : (
                    <Flashlight className="h-6 w-6" />
                  )}
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-center">
                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <p className="text-success font-semibold text-lg mb-1">
                        Barcode Detected!
                      </p>
                      <p className="text-white/80 text-sm font-mono">
                        {lastScannedBarcode}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="instructions"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <p className="text-white/90 font-medium mb-2">
                        Position barcode within the frame
                      </p>
                      <p className="text-white/60 text-sm">
                        Works with UPC, EAN, QR codes, and PSA cert barcodes
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Permission denied state */}
          {permissionGranted === false && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-black/95"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center px-8">
                <motion.div 
                  className="w-20 h-20 mx-auto rounded-3xl bg-destructive/20 flex items-center justify-center mb-6"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <X className="w-10 h-10 text-destructive" />
                </motion.div>
                <h3 className="text-white font-semibold text-xl mb-3">
                  Camera Access Required
                </h3>
                <p className="text-white/60 text-sm mb-8 max-w-xs mx-auto">
                  To scan barcodes, please enable camera access in your device Settings → CardLedger → Camera
                </p>
                <Button 
                  onClick={handleClose} 
                  className="rounded-xl h-12 px-8"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
