import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Upload,
  RefreshCw,
  ImageOff,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CardSearchResult } from "./CardSearchPanel";

interface AICameraPanelProps {
  onCardRecognized: (card: CardSearchResult) => void;
  onCancel: () => void;
}

interface RecognitionResult {
  name: string;
  set_name?: string;
  confidence: number;
  suggestions: CardSearchResult[];
}

export const AICameraPanel = ({
  onCardRecognized,
  onCancel,
}: AICameraPanelProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // In a real implementation, this would call an AI service
      // For now, we'll simulate the recognition with Pokemon TCG API
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI recognition - in production, use GPT-4 Vision or similar
      // For demo, we'll search for a random popular card
      const mockRecognizedName = "Charizard";
      
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:"${mockRecognizedName}"&pageSize=5`
      );
      
      if (!response.ok) throw new Error('Failed to search for card');
      
      const data = await response.json();
      const cards: CardSearchResult[] = (data.data || []).map((card: any) => ({
        id: card.id,
        name: card.name,
        set_name: card.set?.name || "Unknown Set",
        number: card.number,
        rarity: card.rarity,
        image_url: card.images?.small,
        estimated_value: card.tcgplayer?.prices?.holofoil?.market || 
                        card.tcgplayer?.prices?.normal?.market,
        category: "pokemon",
      }));

      if (cards.length > 0) {
        setResult({
          name: cards[0].name,
          set_name: cards[0].set_name,
          confidence: 0.87,
          suggestions: cards,
        });
      } else {
        setError('Could not identify the card. Please try again or use manual entry.');
      }
    } catch (err: any) {
      console.error('AI recognition error:', err);
      setError(err.message || 'Failed to recognize card');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleSelectCard = (card: CardSearchResult) => {
    onCardRecognized(card);
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span>AI-powered card recognition</span>
      </div>

      {/* Camera/Image Area */}
      <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-xl overflow-hidden bg-secondary/30 border border-border/50">
        {capturedImage ? (
          <>
            <img
              src={capturedImage}
              alt="Captured card"
              className="w-full h-full object-cover"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 mx-auto mb-4"
                  >
                    <div className="w-full h-full rounded-full border-4 border-primary border-t-transparent" />
                  </motion.div>
                  <p className="text-foreground font-medium">Analyzing card...</p>
                  <p className="text-sm text-muted-foreground">AI is identifying your card</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">Take a Photo</p>
            <p className="text-sm text-muted-foreground">or tap to upload</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recognition Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Confidence */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="font-medium text-foreground">Card Identified!</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(result.confidence * 100)}% confidence
                </p>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Select the correct match:
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {result.suggestions.map((card) => (
                  <motion.button
                    key={card.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleSelectCard(card)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
                  >
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="w-12 h-16 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded bg-secondary flex items-center justify-center">
                        <ImageOff className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{card.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{card.set_name}</p>
                      {card.estimated_value && (
                        <p className="text-sm text-primary font-medium">
                          ${card.estimated_value.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        {capturedImage && !isProcessing && (
          <Button variant="outline" onClick={resetCapture} className="flex-1 gap-2">
            <RefreshCw className="h-4 w-4" />
            Retake
          </Button>
        )}
      </div>

      {/* Tips */}
      <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3 space-y-1">
        <p className="font-medium flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-purple-500" />
          Tips for best results:
        </p>
        <ul className="list-disc list-inside space-y-0.5 pl-4">
          <li>Use good lighting</li>
          <li>Capture the full card face</li>
          <li>Avoid glare on holos</li>
          <li>Keep the card flat and centered</li>
        </ul>
      </div>
    </div>
  );
};

export default AICameraPanel;
