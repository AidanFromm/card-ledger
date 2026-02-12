import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Download, 
  Share2, 
  Sparkles, 
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { triggerSuccessHaptic, triggerHaptic } from "@/lib/haptics";
import { 
  SlabGenerator, 
  useSlabGenerator,
  SlabConfig, 
  GradingCompany, 
  BGSSubgrades,
  downloadSlabImage,
  generateSlabDataURL
} from "@/components/slab-generator";

// Grade options for each company
const GRADE_OPTIONS: Record<GradingCompany, string[]> = {
  PSA: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5.5', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1', 'Authentic', 'Altered'],
  BGS: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5', '4', '3', '2', '1'],
  CGC: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5', '4', '3', '2', '1'],
  SGC: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5', '4', '3', '2', '1'],
};

const COMPANY_STYLES: Record<GradingCompany, { gradient: string; accent: string; name: string }> = {
  PSA: { gradient: 'from-red-600 to-red-800', accent: 'bg-red-500', name: 'Professional Sports Authenticator' },
  BGS: { gradient: 'from-amber-500 to-amber-700', accent: 'bg-amber-500', name: 'Beckett Grading Services' },
  CGC: { gradient: 'from-teal-500 to-teal-700', accent: 'bg-teal-500', name: 'Certified Guaranty Company' },
  SGC: { gradient: 'from-gray-700 to-gray-900', accent: 'bg-gray-600', name: 'Sportscard Guaranty' },
};

interface SlabGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName: string;
  setName: string;
  cardNumber?: string | null;
  cardImage?: string | null;
  year?: string;
  existingGrade?: string | null;
  existingCompany?: string | null;
}

export const SlabGeneratorModal = ({
  open,
  onOpenChange,
  cardName,
  setName,
  cardNumber,
  cardImage,
  year,
  existingGrade,
  existingCompany,
}: SlabGeneratorModalProps) => {
  const { toast } = useToast();
  const { isGenerating } = useSlabGenerator();
  
  // Config state
  const [gradingCompany, setGradingCompany] = useState<GradingCompany>(
    (existingCompany?.toUpperCase() as GradingCompany) || 'PSA'
  );
  const [grade, setGrade] = useState(existingGrade || '10');
  const [certNumber, setCertNumber] = useState(generateCertNumber());
  const [customYear, setCustomYear] = useState(year || new Date().getFullYear().toString());
  
  // Subgrades for BGS/CGC
  const [subgrades, setSubgrades] = useState<BGSSubgrades>({
    centering: 9.5,
    corners: 9.5,
    edges: 9.5,
    surface: 10,
  });

  // UI state
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate random cert number
  function generateCertNumber() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  // Build slab config
  const slabConfig: SlabConfig = {
    cardImage: cardImage || '/placeholder-card.png',
    gradingCompany,
    grade,
    cardName,
    setName,
    year: customYear,
    certNumber,
    cardNumber: cardNumber || undefined,
    subgrades: (gradingCompany === 'BGS' || gradingCompany === 'CGC') ? subgrades : undefined,
  };

  // Handle company change
  const handleCompanyChange = (company: GradingCompany) => {
    triggerHaptic('light');
    setGradingCompany(company);
    // Reset grade if current grade doesn't exist in new company
    if (!GRADE_OPTIONS[company].includes(grade)) {
      setGrade('10');
    }
  };

  // Handle download
  const handleDownload = async () => {
    setIsDownloading(true);
    triggerHaptic('medium');
    
    try {
      const filename = `${cardName.replace(/\s+/g, '_')}_${gradingCompany}_${grade}`;
      const success = await downloadSlabImage(slabConfig, filename, { 
        width: 600, 
        height: 900,
        format: 'png',
        quality: 1.0
      });
      
      if (success) {
        triggerSuccessHaptic();
        toast({ title: "Slab image downloaded!" });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({ 
        title: "Download failed", 
        description: "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    triggerHaptic('medium');
    
    try {
      const dataUrl = await generateSlabDataURL(slabConfig, { width: 600, height: 900 });
      if (!dataUrl) throw new Error('Failed to generate image');

      if (navigator.share && navigator.canShare) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${cardName}_${gradingCompany}_${grade}.png`, { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${cardName} - ${gradingCompany} ${grade}`,
            text: `Check out my ${gradingCompany} ${grade} ${cardName}!`,
          });
          triggerSuccessHaptic();
          return;
        }
      }
      
      // Fallback: Copy data URL
      await navigator.clipboard.writeText(dataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Image data copied to clipboard" });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast({ title: "Share not available", variant: "destructive" });
      }
    }
  };

  // Regenerate cert number
  const handleRegenCert = () => {
    triggerHaptic('light');
    setCertNumber(generateCertNumber());
  };

  const companyStyle = COMPANY_STYLES[gradingCompany];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[95vh]">
        {/* Premium Header */}
        <motion.div 
          className={`relative px-6 py-5 bg-gradient-to-r ${companyStyle.gradient}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMjAgMjBsMjAgMjBIMHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-20" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Generate Slab Mockup
                </DialogTitle>
                <DialogDescription className="text-white/80 text-sm">
                  Create a professional graded card preview
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </motion.div>

        <div className="flex flex-col md:flex-row">
          {/* Preview Panel */}
          <motion.div 
            className="flex-1 p-6 bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className={`absolute -inset-4 rounded-2xl ${companyStyle.accent} opacity-20 blur-xl transition-colors duration-500`} />
              
              {/* Slab preview */}
              <motion.div
                key={`${gradingCompany}-${grade}`}
                initial={{ rotateY: -10, opacity: 0.8 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative rounded-lg overflow-hidden shadow-2xl"
                style={{ perspective: '1000px' }}
              >
                <SlabGenerator
                  config={slabConfig}
                  width={240}
                  height={360}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Controls Panel */}
          <motion.div 
            className="flex-1 p-6 border-t md:border-t-0 md:border-l space-y-5 max-h-[50vh] md:max-h-none overflow-y-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Grading Company */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Grading Company</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['PSA', 'BGS', 'CGC', 'SGC'] as GradingCompany[]).map((company) => (
                  <button
                    key={company}
                    onClick={() => handleCompanyChange(company)}
                    className={`py-2.5 px-3 rounded-lg font-bold text-sm transition-all border-2 ${
                      gradingCompany === company
                        ? `bg-gradient-to-r ${COMPANY_STYLES[company].gradient} text-white border-transparent shadow-lg scale-105`
                        : 'bg-muted/50 border-border hover:border-primary/50 hover:bg-muted'
                    }`}
                  >
                    {company}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{companyStyle.name}</p>
            </div>

            {/* Grade */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Grade</Label>
              <Select value={grade} onValueChange={(v) => { triggerHaptic('light'); setGrade(v); }}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS[gradingCompany].map((g) => (
                    <SelectItem key={g} value={g} className="font-medium">
                      {g === '10' ? '10 - Gem Mint ✨' : g === '9.5' ? '9.5 - Mint+' : g === '9' ? '9 - Mint' : g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subgrades for BGS/CGC */}
            <AnimatePresence>
              {(gradingCompany === 'BGS' || gradingCompany === 'CGC') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <Label className="text-sm font-medium">Subgrades</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['centering', 'corners', 'edges', 'surface'].map((key) => (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs capitalize text-muted-foreground">{key}</span>
                          <span className="text-sm font-bold">{subgrades[key as keyof BGSSubgrades].toFixed(1)}</span>
                        </div>
                        <Slider
                          value={[subgrades[key as keyof BGSSubgrades]]}
                          min={1}
                          max={10}
                          step={0.5}
                          onValueChange={(v) => {
                            setSubgrades(prev => ({ ...prev, [key]: v[0] }));
                          }}
                          className="py-1"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cert Number */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cert Number</Label>
              <div className="flex gap-2">
                <Input
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  placeholder="12345678"
                  className="font-mono h-11"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRegenCert}
                  className="h-11 w-11 shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Year</Label>
              <Input
                value={customYear}
                onChange={(e) => setCustomYear(e.target.value)}
                placeholder="2024"
                className="h-11"
              />
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div 
          className="p-4 border-t bg-muted/30 flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex-1 h-12 bg-gradient-to-r ${companyStyle.gradient} hover:opacity-90 text-white font-semibold`}
          >
            {isDownloading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            Download PNG
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShare}
            className="h-12 px-5"
          >
            {copied ? (
              <Check className="h-5 w-5" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default SlabGeneratorModal;
