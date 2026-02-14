import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ScanBarcode, 
  Camera, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BarcodeScanPanelProps {
  onScanComplete: (barcode: string, type: string) => void;
  onCancel: () => void;
}

export const BarcodeScanPanel = ({
  onScanComplete,
  onCancel,
}: BarcodeScanPanelProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [hasCapacitor, setHasCapacitor] = useState(false);

  useEffect(() => {
    // Check if we're in a Capacitor environment
    const checkCapacitor = async () => {
      try {
        const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
        setHasCapacitor(true);
      } catch {
        setHasCapacitor(false);
      }
    };
    checkCapacitor();
  }, []);

  const startScan = useCallback(async () => {
    setIsScanning(true);
    setScanError(null);
    setScannedCode(null);

    try {
      const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
      
      // Request permission
      const { camera } = await BarcodeScanner.requestPermissions();
      
      if (camera !== 'granted') {
        setScanError('Camera permission is required to scan barcodes');
        setIsScanning(false);
        return;
      }

      // Start scanning
      const { barcodes } = await BarcodeScanner.scan();
      
      if (barcodes && barcodes.length > 0) {
        const barcode = barcodes[0];
        setScannedCode(barcode.rawValue || '');
        
        // Wait a moment to show success state
        setTimeout(() => {
          onScanComplete(barcode.rawValue || '', barcode.format || 'unknown');
        }, 500);
      } else {
        setScanError('No barcode detected. Please try again.');
      }
    } catch (error: any) {
      console.error('Barcode scan error:', error);
      setScanError(error.message || 'Failed to scan barcode');
    } finally {
      setIsScanning(false);
    }
  }, [onScanComplete]);

  // Web fallback - manual entry
  const [manualCode, setManualCode] = useState('');

  if (!hasCapacitor) {
    return (
      <div className="space-y-4">
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            Barcode scanning requires the mobile app. You can enter the code manually.
          </AlertDescription>
        </Alert>

        <div className="p-6 rounded-xl bg-secondary/30 border border-border/50 text-center">
          <ScanBarcode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Enter barcode manually
          </p>
          <input
            type="text"
            placeholder="Enter barcode number..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background text-center text-lg font-mono"
          />
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => onScanComplete(manualCode, 'manual')}
              disabled={!manualCode}
              className="flex-1"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scan Area */}
      <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-black">
        {/* Scanner Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isScanning ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-white text-sm">Point camera at barcode...</p>
            </motion.div>
          ) : scannedCode ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-white font-mono text-lg">{scannedCode}</p>
            </motion.div>
          ) : (
            <div className="text-center p-8">
              <ScanBarcode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Tap to start scanning</p>
            </div>
          )}
        </div>

        {/* Scan Frame Corners */}
        {isScanning && (
          <>
            <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-primary rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-primary rounded-br-lg" />
            
            {/* Scanning Line Animation */}
            <motion.div
              initial={{ top: '20%' }}
              animate={{ top: ['20%', '80%', '20%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute left-4 right-4 h-0.5 bg-primary"
            />
          </>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {scanError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                {scanError}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={startScan}
          disabled={isScanning}
          className="flex-1 gap-2"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              {scannedCode ? 'Scan Again' : 'Start Scan'}
            </>
          )}
        </Button>
      </div>

      {/* Tips */}
      <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3 space-y-1">
        <p className="font-medium">Tips for best results:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Hold the camera steady</li>
          <li>Ensure good lighting</li>
          <li>Center the barcode in the frame</li>
          <li>Works with PSA, CGC, BGS slabs</li>
        </ul>
      </div>
    </div>
  );
};

export default BarcodeScanPanel;
