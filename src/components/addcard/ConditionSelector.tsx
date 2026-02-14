import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Check, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface Condition {
  value: string;
  label: string;
  abbrev: string;
  description: string;
  color: string;
  textColor: string;
  examples: string[];
  valueMultiplier: number; // % of mint value
}

export const CONDITIONS: Condition[] = [
  {
    value: "mint",
    label: "Mint",
    abbrev: "M",
    description: "Perfect condition. No visible wear, scratches, or defects. Corners are sharp, surface is pristine.",
    color: "bg-emerald-500",
    textColor: "text-emerald-500",
    examples: [
      "Fresh from pack",
      "Immediately sleeved",
      "Perfect centering",
      "No whitening on edges",
    ],
    valueMultiplier: 1.0,
  },
  {
    value: "near-mint",
    label: "Near Mint",
    abbrev: "NM",
    description: "Excellent condition. Very minor wear only visible on close inspection. Minimal edge wear.",
    color: "bg-green-500",
    textColor: "text-green-500",
    examples: [
      "Very light edge wear",
      "Minor corner whitening",
      "Surface is clean",
      "No creases or bends",
    ],
    valueMultiplier: 0.85,
  },
  {
    value: "lightly-played",
    label: "Lightly Played",
    abbrev: "LP",
    description: "Minor wear visible. Small scratches, light edge wear, or minor corner damage. Still looks great.",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    examples: [
      "Light scratches on holo",
      "Noticeable edge whitening",
      "Minor corner wear",
      "No major creases",
    ],
    valueMultiplier: 0.7,
  },
  {
    value: "moderately-played",
    label: "Moderately Played",
    abbrev: "MP",
    description: "Noticeable wear throughout. Scratches, edge wear, corner damage clearly visible. Still displayable.",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    examples: [
      "Multiple scratches",
      "Heavy edge wear",
      "Corner dings",
      "Light creases acceptable",
    ],
    valueMultiplier: 0.5,
  },
  {
    value: "heavily-played",
    label: "Heavily Played",
    abbrev: "HP",
    description: "Major wear and damage. Heavy scratches, significant corner damage, possible creases. Still intact.",
    color: "bg-red-400",
    textColor: "text-red-400",
    examples: [
      "Deep scratches",
      "Major corner damage",
      "Creases visible",
      "Surface scuffing",
    ],
    valueMultiplier: 0.3,
  },
  {
    value: "damaged",
    label: "Damaged",
    abbrev: "D",
    description: "Significant damage. Tears, major creases, water damage, or other structural issues.",
    color: "bg-red-600",
    textColor: "text-red-600",
    examples: [
      "Tears or holes",
      "Heavy creases",
      "Water damage",
      "Writing/stickers",
    ],
    valueMultiplier: 0.15,
  },
];

interface ConditionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  showValueImpact?: boolean;
  estimatedMintValue?: number;
}

export const ConditionSelector = ({
  value,
  onChange,
  showValueImpact = false,
  estimatedMintValue,
}: ConditionSelectorProps) => {
  const [showGuide, setShowGuide] = useState(false);
  
  const selectedCondition = CONDITIONS.find(c => c.value === value);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Condition
          </label>
          <Dialog open={showGuide} onOpenChange={setShowGuide}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs">Condition Guide</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Card Condition Guide</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {CONDITIONS.map((condition) => (
                  <div key={condition.value} className="p-4 rounded-xl border border-border/50 bg-secondary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg ${condition.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {condition.abbrev}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{condition.label}</h4>
                        <p className="text-xs text-muted-foreground">~{Math.round(condition.valueMultiplier * 100)}% of mint value</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{condition.description}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {condition.examples.map((example, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={`w-1.5 h-1.5 rounded-full ${condition.color}`} />
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Visual Condition Selector */}
        <div className="grid grid-cols-6 gap-2">
          {CONDITIONS.map((condition) => (
            <Tooltip key={condition.value}>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onChange(condition.value)}
                  className={`
                    relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all
                    ${value === condition.value
                      ? `border-current ${condition.textColor} bg-secondary/50`
                      : 'border-border/50 hover:border-border'
                    }
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg ${condition.color} flex items-center justify-center text-white font-bold text-xs mb-1`}>
                    {condition.abbrev}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {condition.label.split(' ')[0]}
                  </span>
                  
                  {value === condition.value && (
                    <motion.div
                      layoutId="condition-check"
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${condition.color} flex items-center justify-center`}
                    >
                      <Check className="h-2.5 w-2.5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-medium">{condition.label}</p>
                <p className="text-xs text-muted-foreground">{condition.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Selected Condition Details */}
        <AnimatePresence mode="wait">
          {selectedCondition && (
            <motion.div
              key={selectedCondition.value}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-xl bg-secondary/30 border border-border/30"
            >
              <div className="flex items-start gap-3">
                <Info className={`h-4 w-4 mt-0.5 flex-shrink-0 ${selectedCondition.textColor}`} />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {selectedCondition.description}
                  </p>
                  
                  {showValueImpact && estimatedMintValue && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Estimated Value:</span>
                        <span className={`font-semibold ${selectedCondition.textColor}`}>
                          ${(estimatedMintValue * selectedCondition.valueMultiplier).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-muted-foreground">({Math.round(selectedCondition.valueMultiplier * 100)}% of mint)</span>
                        <span className="text-muted-foreground">
                          Mint: ${estimatedMintValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};

export default ConditionSelector;
