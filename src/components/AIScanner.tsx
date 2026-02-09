import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera as CameraIcon,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCapture: (base64Image: string) => void;
}

export const AIScanner = ({
  isOpen,
  onClose,
  onImageCapture,
}: AIScannerProps) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureFromCamera = async () => {
    setIsCapturing(true);
    try {
      // @ts-ignore - Dynamic import for Capacitor Camera
      const { Camera, CameraResultType, CameraSource } = await import(
        "@capacitor/camera"
      );

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024,
        correctOrientation: true,
      });

      if (image.base64String) {
        setCapturedImage(`data:image/jpeg;base64,${image.base64String}`);
      }
    } catch (error: any) {
      console.error("Camera capture error:", error);
      // Check if we're in browser (not native)
      if (
        error.message?.includes("not implemented") ||
        !window.hasOwnProperty("Capacitor")
      ) {
        // Fallback to file input for web testing
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setCapturedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const selectFromGallery = async () => {
    setIsCapturing(true);
    try {
      // @ts-ignore
      const { Camera, CameraResultType, CameraSource } = await import(
        "@capacitor/camera"
      );

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        width: 1024,
        height: 1024,
      });

      if (image.base64String) {
        setCapturedImage(`data:image/jpeg;base64,${image.base64String}`);
      }
    } catch (error: any) {
      console.error("Gallery selection error:", error);
      // Fallback for web
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setCapturedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      // Extract base64 without data URL prefix
      const base64 = capturedImage.replace(/^data:image\/\w+;base64,/, "");
      onImageCapture(base64);
      handleReset();
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Header */}
          <div className="pt-safe">
            <div className="flex items-center justify-between px-4 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-11 w-11 rounded-xl"
              >
                <X className="h-6 w-6" />
              </Button>

              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Scanner
              </h2>

              <div className="w-11" /> {/* Spacer for centering */}
            </div>
          </div>

          <div className="px-4 pb-safe">
            <AnimatePresence mode="wait">
              {!capturedImage ? (
                /* Capture Options */
                <motion.div
                  key="capture"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Instructions */}
                  <div className="text-center py-8">
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-primary/15 flex items-center justify-center mb-6">
                      <Sparkles className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">
                      Identify Any Card
                    </h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      Take a photo or select from your gallery. Our AI will
                      identify the card and fetch pricing.
                    </p>
                  </div>

                  {/* Capture Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={captureFromCamera}
                      disabled={isCapturing}
                      className="h-32 rounded-2xl flex flex-col items-center justify-center gap-3"
                    >
                      <CameraIcon className="w-10 h-10" />
                      <span className="font-medium">Take Photo</span>
                    </Button>
                    <Button
                      onClick={selectFromGallery}
                      disabled={isCapturing}
                      variant="secondary"
                      className="h-32 rounded-2xl flex flex-col items-center justify-center gap-3"
                    >
                      <ImageIcon className="w-10 h-10" />
                      <span className="font-medium">From Gallery</span>
                    </Button>
                  </div>

                  {/* Tips */}
                  <div className="glass-card p-4">
                    <h3 className="font-medium mb-3 text-sm">
                      Tips for Best Results
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-success">✓</span>
                        Center the card in frame
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success">✓</span>
                        Good lighting, avoid glare
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success">✓</span>
                        Card should fill most of the image
                      </li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                /* Preview & Confirm */
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Image Preview */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary/30">
                    <img
                      src={capturedImage}
                      alt="Captured card"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="flex-1 h-14 rounded-xl"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Retake
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      className="flex-1 h-14 rounded-xl"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Identify Card
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
