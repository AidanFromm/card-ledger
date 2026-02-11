import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera as CameraIcon,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Sparkles,
  Crop,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

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
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCropMode, setShowCropMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

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
        resetTransforms();
      }
    } catch (error: any) {
      console.error("Camera capture error:", error);
      // Fallback for web
      if (
        error.message?.includes("not implemented") ||
        !window.hasOwnProperty("Capacitor")
      ) {
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
              resetTransforms();
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
        resetTransforms();
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
            resetTransforms();
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const resetTransforms = () => {
    setRotation(0);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setShowCropMode(false);
  };

  const handleRotateLeft = () => setRotation((r) => r - 90);
  const handleRotateRight = () => setRotation((r) => r + 90);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!showCropMode) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - position.x, y: clientY - position.y };
  }, [showCropMode, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const processImage = async (): Promise<string> => {
    return new Promise((resolve) => {
      if (!capturedImage) {
        resolve("");
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        
        // Set canvas size (card aspect ratio roughly 2.5:3.5)
        const size = 1024;
        canvas.width = size;
        canvas.height = size;

        // Clear canvas
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, size, size);

        // Apply transforms
        ctx.save();
        ctx.translate(size / 2 + position.x, size / 2 + position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        // Draw image centered
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();

        // Get base64
        const base64 = canvas.toDataURL("image/jpeg", 0.9);
        resolve(base64.replace(/^data:image\/\w+;base64,/, ""));
      };
      img.src = capturedImage;
    });
  };

  const handleConfirm = async () => {
    const base64 = await processImage();
    if (base64) {
      onImageCapture(base64);
      handleReset();
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    resetTransforms();
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

              <div className="w-11" />
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
                  {/* Card Overlay Guide */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary/20 border-2 border-dashed border-primary/30">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Card outline */}
                      <div className="relative w-[70%] aspect-[2.5/3.5] border-2 border-primary/50 rounded-xl">
                        {/* Corner guides */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                        
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                          <Sparkles className="w-12 h-12 text-primary/40 mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Position your card within this frame
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Capture Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={captureFromCamera}
                      disabled={isCapturing}
                      className="h-24 rounded-2xl flex flex-col items-center justify-center gap-2 text-base"
                    >
                      <CameraIcon className="w-8 h-8" />
                      <span className="font-medium">Take Photo</span>
                    </Button>
                    <Button
                      onClick={selectFromGallery}
                      disabled={isCapturing}
                      variant="secondary"
                      className="h-24 rounded-2xl flex flex-col items-center justify-center gap-2 text-base"
                    >
                      <ImageIcon className="w-8 h-8" />
                      <span className="font-medium">Gallery</span>
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
                        Center the card within the frame
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success">✓</span>
                        Use good lighting, avoid glare
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success">✓</span>
                        Card should fill most of the frame
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success">✓</span>
                        Keep camera steady for clear image
                      </li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                /* Preview & Edit */
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Image Preview with transforms */}
                  <div
                    className="relative aspect-square rounded-2xl overflow-hidden bg-black"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    style={{ cursor: showCropMode ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                  >
                    <img
                      ref={imageRef}
                      src={capturedImage}
                      alt="Captured card"
                      className="w-full h-full object-contain transition-transform duration-200"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                      }}
                      draggable={false}
                    />
                    
                    {/* Crop overlay guide */}
                    {showCropMode && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-black/50" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] aspect-[2.5/3.5] bg-transparent border-2 border-white/80 rounded-lg shadow-lg">
                          <div className="absolute inset-0 bg-black/0" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                        </div>
                        {/* Crop mode indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/70 rounded-full">
                          <p className="text-xs text-white flex items-center gap-2">
                            <Move className="w-3 h-3" />
                            Drag to reposition
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit Tools */}
                  <div className="glass-card p-4 space-y-4">
                    {/* Rotation Controls */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Rotate</span>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={handleRotateLeft}
                          className="h-10 w-10 rounded-xl"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={handleRotateRight}
                          className="h-10 w-10 rounded-xl"
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Zoom Controls */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Zoom</span>
                        <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleZoomOut}
                          className="h-8 w-8"
                          disabled={zoom <= 0.5}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Slider
                          value={[zoom]}
                          onValueChange={([v]) => setZoom(v)}
                          min={0.5}
                          max={3}
                          step={0.1}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleZoomIn}
                          className="h-8 w-8"
                          disabled={zoom >= 3}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Crop Mode Toggle */}
                    <Button
                      variant={showCropMode ? "default" : "secondary"}
                      onClick={() => setShowCropMode(!showCropMode)}
                      className="w-full h-10 rounded-xl"
                    >
                      <Crop className="w-4 h-4 mr-2" />
                      {showCropMode ? "Exit Crop Mode" : "Adjust Position"}
                    </Button>
                  </div>

                  {/* Action Buttons */}
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
