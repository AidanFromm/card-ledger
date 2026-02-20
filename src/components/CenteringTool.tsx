/**
 * Card Centering Tool
 * 
 * Analyzes card photos to calculate centering percentages for grading submissions.
 * Uses canvas-based edge detection to find card borders and calculate L/R, T/B ratios.
 * 
 * PSA Centering Standards:
 * - Gem Mint 10: 60/40 or better front, 75/25 or better back
 * - Mint 9: 65/35 or better front, 90/10 or better back
 * - NM-MT 8: 70/30 or better
 * - NM 7: 75/25 or better
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  Target,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Award,
  Info,
  ChevronDown,
  ChevronUp,
  Ruler,
  Grid3X3,
  Maximize2,
  ZoomIn,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface CenteringResult {
  leftRight: { left: number; right: number; ratio: string };
  topBottom: { top: number; bottom: number; ratio: string };
  overallScore: number;
  grade: CenteringGrade;
  isAcceptable: boolean;
}

interface CenteringGrade {
  psa: string;
  bgs: string;
  label: string;
  color: string;
}

interface CenteringToolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName?: string;
  onResult?: (result: CenteringResult) => void;
}

// ============================================
// Grading Standards
// ============================================

const CENTERING_STANDARDS = {
  PSA: [
    { grade: '10', label: 'Gem Mint', frontMax: 60, backMax: 75 },
    { grade: '9', label: 'Mint', frontMax: 65, backMax: 90 },
    { grade: '8', label: 'NM-MT', frontMax: 70, backMax: 90 },
    { grade: '7', label: 'NM', frontMax: 75, backMax: 90 },
    { grade: '6', label: 'EX-MT', frontMax: 80, backMax: 90 },
  ],
  BGS: [
    { grade: '10', label: 'Pristine', frontMax: 50, subGrade: 10 },
    { grade: '9.5', label: 'Gem Mint', frontMax: 55, subGrade: 9.5 },
    { grade: '9', label: 'Mint', frontMax: 60, subGrade: 9 },
    { grade: '8.5', label: 'NM-MT+', frontMax: 65, subGrade: 8.5 },
    { grade: '8', label: 'NM-MT', frontMax: 70, subGrade: 8 },
  ],
};

function getCenteringGrade(ratio: number): CenteringGrade {
  // ratio is the larger percentage (e.g., 60 from 60/40)
  if (ratio <= 52) return { psa: '10', bgs: '10', label: 'Perfect', color: 'text-yellow-500' };
  if (ratio <= 55) return { psa: '10', bgs: '9.5', label: 'Excellent', color: 'text-green-500' };
  if (ratio <= 60) return { psa: '10', bgs: '9', label: 'Great', color: 'text-green-400' };
  if (ratio <= 65) return { psa: '9', bgs: '8.5', label: 'Good', color: 'text-blue-500' };
  if (ratio <= 70) return { psa: '8', bgs: '8', label: 'Acceptable', color: 'text-blue-400' };
  if (ratio <= 75) return { psa: '7', bgs: '7.5', label: 'Below Average', color: 'text-orange-500' };
  return { psa: '6 or lower', bgs: '7 or lower', label: 'Poor', color: 'text-red-500' };
}

// ============================================
// Image Analysis
// ============================================

interface BorderMeasurements {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

async function analyzeCardCentering(imageData: ImageData): Promise<BorderMeasurements> {
  const { data, width, height } = imageData;
  
  // Convert to grayscale and find edges
  const grayscale = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    grayscale[idx] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
  }
  
  // Simple edge detection: find where brightness changes significantly
  // This is a simplified version - real implementation would use Canny or similar
  
  // Find left border (scan from left)
  let leftBorder = 0;
  for (let x = 0; x < width / 4; x++) {
    let edgeCount = 0;
    for (let y = height * 0.2; y < height * 0.8; y++) {
      const idx = Math.floor(y) * width + x;
      const nextIdx = idx + 1;
      if (Math.abs(grayscale[idx] - grayscale[nextIdx]) > 30) {
        edgeCount++;
      }
    }
    if (edgeCount > height * 0.3) {
      leftBorder = x;
      break;
    }
  }
  
  // Find right border (scan from right)
  let rightBorder = width;
  for (let x = width - 1; x > width * 0.75; x--) {
    let edgeCount = 0;
    for (let y = height * 0.2; y < height * 0.8; y++) {
      const idx = Math.floor(y) * width + x;
      const prevIdx = idx - 1;
      if (Math.abs(grayscale[idx] - grayscale[prevIdx]) > 30) {
        edgeCount++;
      }
    }
    if (edgeCount > height * 0.3) {
      rightBorder = x;
      break;
    }
  }
  
  // Find top border (scan from top)
  let topBorder = 0;
  for (let y = 0; y < height / 4; y++) {
    let edgeCount = 0;
    for (let x = width * 0.2; x < width * 0.8; x++) {
      const idx = y * width + Math.floor(x);
      const nextIdx = (y + 1) * width + Math.floor(x);
      if (Math.abs(grayscale[idx] - grayscale[nextIdx]) > 30) {
        edgeCount++;
      }
    }
    if (edgeCount > width * 0.3) {
      topBorder = y;
      break;
    }
  }
  
  // Find bottom border (scan from bottom)
  let bottomBorder = height;
  for (let y = height - 1; y > height * 0.75; y--) {
    let edgeCount = 0;
    for (let x = width * 0.2; x < width * 0.8; x++) {
      const idx = y * width + Math.floor(x);
      const prevIdx = (y - 1) * width + Math.floor(x);
      if (Math.abs(grayscale[idx] - grayscale[prevIdx]) > 30) {
        edgeCount++;
      }
    }
    if (edgeCount > width * 0.3) {
      bottomBorder = y;
      break;
    }
  }
  
  // Calculate border widths relative to card dimensions
  const cardWidth = rightBorder - leftBorder;
  const cardHeight = bottomBorder - topBorder;
  
  // Estimate actual border widths (assuming standard card has ~3% border)
  const leftWidth = leftBorder;
  const rightWidth = width - rightBorder;
  const topWidth = topBorder;
  const bottomWidth = height - bottomBorder;
  
  const totalHorizontal = leftWidth + rightWidth || 1;
  const totalVertical = topWidth + bottomWidth || 1;
  
  return {
    left: (leftWidth / totalHorizontal) * 100,
    right: (rightWidth / totalHorizontal) * 100,
    top: (topWidth / totalVertical) * 100,
    bottom: (bottomWidth / totalVertical) * 100,
  };
}

// ============================================
// Component
// ============================================

export const CenteringTool = ({
  open,
  onOpenChange,
  cardName,
  onResult,
}: CenteringToolProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CenteringResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualBorders, setManualBorders] = useState({ left: 50, top: 50 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);
  
  // Analyze the image
  const analyzeImage = useCallback(async () => {
    if (!image || !canvasRef.current) return;
    
    setAnalyzing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      
      // Load image
      const img = new Image();
      img.src = image;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Draw to canvas for analysis
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Get image data and analyze
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const borders = await analyzeCardCentering(imageData);
      
      // Calculate ratios
      const lrLarger = Math.max(borders.left, borders.right);
      const lrSmaller = Math.min(borders.left, borders.right);
      const tbLarger = Math.max(borders.top, borders.bottom);
      const tbSmaller = Math.min(borders.top, borders.bottom);
      
      // Overall centering score (100 = perfect 50/50)
      const lrDeviation = Math.abs(50 - lrLarger);
      const tbDeviation = Math.abs(50 - tbLarger);
      const overallScore = Math.max(0, 100 - (lrDeviation + tbDeviation));
      
      const grade = getCenteringGrade(Math.max(lrLarger, tbLarger));
      
      const centeringResult: CenteringResult = {
        leftRight: {
          left: Math.round(borders.left),
          right: Math.round(borders.right),
          ratio: `${Math.round(lrLarger)}/${Math.round(lrSmaller)}`,
        },
        topBottom: {
          top: Math.round(borders.top),
          bottom: Math.round(borders.bottom),
          ratio: `${Math.round(tbLarger)}/${Math.round(tbSmaller)}`,
        },
        overallScore,
        grade,
        isAcceptable: lrLarger <= 65 && tbLarger <= 65,
      };
      
      setResult(centeringResult);
      onResult?.(centeringResult);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [image, onResult]);
  
  // Manual adjustment handler
  const handleManualAdjust = useCallback(() => {
    const lrLarger = Math.max(manualBorders.left, 100 - manualBorders.left);
    const lrSmaller = Math.min(manualBorders.left, 100 - manualBorders.left);
    const tbLarger = Math.max(manualBorders.top, 100 - manualBorders.top);
    const tbSmaller = Math.min(manualBorders.top, 100 - manualBorders.top);
    
    const overallScore = Math.max(0, 100 - (Math.abs(50 - lrLarger) + Math.abs(50 - tbLarger)));
    const grade = getCenteringGrade(Math.max(lrLarger, tbLarger));
    
    const centeringResult: CenteringResult = {
      leftRight: {
        left: Math.round(manualBorders.left),
        right: Math.round(100 - manualBorders.left),
        ratio: `${Math.round(lrLarger)}/${Math.round(lrSmaller)}`,
      },
      topBottom: {
        top: Math.round(manualBorders.top),
        bottom: Math.round(100 - manualBorders.top),
        ratio: `${Math.round(tbLarger)}/${Math.round(tbSmaller)}`,
      },
      overallScore,
      grade,
      isAcceptable: lrLarger <= 65 && tbLarger <= 65,
    };
    
    setResult(centeringResult);
    onResult?.(centeringResult);
  }, [manualBorders, onResult]);
  
  // Reset
  const reset = useCallback(() => {
    setImage(null);
    setResult(null);
    setManualMode(false);
    setManualBorders({ left: 50, top: 50 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Centering Tool
          </DialogTitle>
          <DialogDescription>
            {cardName ? `Analyze centering for ${cardName}` : 'Upload a card photo to analyze centering'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Image Upload / Preview */}
          {!image ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Take or Upload Photo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Position card flat with good lighting
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Image Preview */}
              <div className="relative rounded-xl overflow-hidden bg-muted/20">
                <img
                  src={image}
                  alt="Card to analyze"
                  className="w-full max-h-[300px] object-contain"
                />
                
                {/* Overlay grid for centering reference */}
                {result && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Center crosshair */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/50" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/50" />
                  </div>
                )}
                
                {/* Reset button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={reset}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Analyze Button */}
              {!result && !manualMode && (
                <div className="flex gap-2">
                  <Button
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="flex-1"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Auto Analyze
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setManualMode(true)}
                  >
                    <Ruler className="h-4 w-4 mr-2" />
                    Manual
                  </Button>
                </div>
              )}
              
              {/* Manual Mode */}
              {manualMode && !result && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Adjust sliders to match your card's centering:
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Left/Right</span>
                        <span className="font-mono">{manualBorders.left}/{100 - manualBorders.left}</span>
                      </div>
                      <Slider
                        value={[manualBorders.left]}
                        onValueChange={([val]) => setManualBorders(prev => ({ ...prev, left: val }))}
                        min={30}
                        max={70}
                        step={1}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Top/Bottom</span>
                        <span className="font-mono">{manualBorders.top}/{100 - manualBorders.top}</span>
                      </div>
                      <Slider
                        value={[manualBorders.top]}
                        onValueChange={([val]) => setManualBorders(prev => ({ ...prev, top: val }))}
                        min={30}
                        max={70}
                        step={1}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleManualAdjust} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      Calculate Grade
                    </Button>
                    <Button variant="ghost" onClick={() => setManualMode(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Grade Badge */}
                <div className={cn(
                  "rounded-xl p-4 text-center",
                  result.isAcceptable ? "bg-green-500/10" : "bg-orange-500/10"
                )}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {result.isAcceptable ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                    <span className={cn("text-lg font-bold", result.grade.color)}>
                      {result.grade.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <Badge variant="outline" className="text-sm">
                      PSA: {result.grade.psa}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      BGS: {result.grade.bgs}
                    </Badge>
                  </div>
                </div>
                
                {/* Measurements */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">Left / Right</span>
                    </div>
                    <p className="text-xl font-bold font-mono">
                      {result.leftRight.ratio}
                    </p>
                  </div>
                  
                  <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">Top / Bottom</span>
                    </div>
                    <p className="text-xl font-bold font-mono">
                      {result.topBottom.ratio}
                    </p>
                  </div>
                </div>
                
                {/* Overall Score */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Centering Score</span>
                    <span className="font-medium">{Math.round(result.overallScore)}%</span>
                  </div>
                  <Progress value={result.overallScore} className="h-2" />
                </div>
                
                {/* Grading Recommendation */}
                <div className="bg-muted/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4" />
                    Grading Recommendation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {result.isAcceptable ? (
                      <>
                        Centering is good enough for PSA {result.grade.psa} or BGS {result.grade.bgs}.
                        {result.overallScore >= 90 && " Excellent candidate for gem mint!"}
                      </>
                    ) : (
                      <>
                        Centering may limit grade potential. Consider if other factors
                        (corners, surface) justify submission costs.
                      </>
                    )}
                  </p>
                </div>
                
                {/* Re-analyze */}
                <Button variant="outline" onClick={reset} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Analyze Another Card
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Centering Guide */}
          <div className="border-t border-border/50 pt-4">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                PSA/BGS Centering Standards
              </span>
              {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            <AnimatePresence>
              {showGuide && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">PSA 10 (Gem Mint):</strong> 60/40 front, 75/25 back</p>
                    <p><strong className="text-foreground">PSA 9 (Mint):</strong> 65/35 front, 90/10 back</p>
                    <p><strong className="text-foreground">BGS 10 (Pristine):</strong> 50/50 or very close</p>
                    <p><strong className="text-foreground">BGS 9.5 (Gem Mint):</strong> 55/45 or better</p>
                    <p className="pt-2 italic">
                      Note: Auto-detection is an estimate. For precise measurements,
                      use manual mode with calipers.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CenteringTool;
