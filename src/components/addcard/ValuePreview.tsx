import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Award, Sparkles } from "lucide-react";
import { CONDITIONS } from "./ConditionSelector";

interface ValuePreviewProps {
  rawValue?: number;
  gradedValue?: number;
  condition: string;
  costBasis?: number;
  isGraded?: boolean;
  grade?: string;
}

export const ValuePreview = ({
  rawValue,
  gradedValue,
  condition,
  costBasis,
  isGraded = false,
  grade,
}: ValuePreviewProps) => {
  const selectedCondition = CONDITIONS.find(c => c.value === condition);
  
  // Calculate adjusted raw value based on condition
  const adjustedRawValue = rawValue && selectedCondition 
    ? rawValue * selectedCondition.valueMultiplier 
    : rawValue;
  
  // Determine displayed value
  const displayValue = isGraded && gradedValue ? gradedValue : adjustedRawValue;
  
  // Calculate profit/loss
  const profitLoss = displayValue && costBasis ? displayValue - costBasis : null;
  const profitPercent = profitLoss && costBasis ? ((profitLoss / costBasis) * 100) : null;
  const isProfitable = profitLoss !== null && profitLoss >= 0;

  if (!rawValue && !gradedValue) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        Value Estimate
      </h4>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Raw Value */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border transition-all ${
            !isGraded 
              ? 'border-primary bg-primary/10' 
              : 'border-border/50 bg-secondary/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Raw Value
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${!isGraded ? 'text-primary' : 'text-foreground'}`}>
              ${adjustedRawValue?.toFixed(2) || '--'}
            </span>
            {rawValue && selectedCondition && selectedCondition.valueMultiplier < 1 && (
              <span className="text-xs text-muted-foreground">
                ({selectedCondition.abbrev})
              </span>
            )}
          </div>
          
          {rawValue && selectedCondition && selectedCondition.valueMultiplier < 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              Mint: ${rawValue.toFixed(2)} × {Math.round(selectedCondition.valueMultiplier * 100)}%
            </p>
          )}
        </motion.div>

        {/* Graded Value */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`p-4 rounded-xl border transition-all ${
            isGraded 
              ? 'border-primary bg-primary/10' 
              : 'border-border/50 bg-secondary/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Graded Value
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${isGraded ? 'text-primary' : 'text-foreground'}`}>
              ${gradedValue?.toFixed(2) || '--'}
            </span>
            {isGraded && grade && (
              <span className="text-xs text-muted-foreground">
                (Grade {grade})
              </span>
            )}
          </div>
          
          {!isGraded && gradedValue && (
            <p className="text-xs text-muted-foreground mt-1">
              If graded (PSA 10 estimate)
            </p>
          )}
        </motion.div>
      </div>

      {/* Profit/Loss Indicator */}
      {costBasis && costBasis > 0 && displayValue && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-4 rounded-xl border ${
            isProfitable 
              ? 'border-emerald-500/50 bg-emerald-500/10' 
              : 'border-red-500/50 bg-red-500/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProfitable ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {isProfitable ? 'Potential Profit' : 'Potential Loss'}
              </span>
            </div>
            
            <div className="text-right">
              <p className={`text-lg font-bold ${isProfitable ? 'text-emerald-500' : 'text-red-500'}`}>
                {isProfitable ? '+' : ''}{profitLoss?.toFixed(2)}
              </p>
              <p className={`text-xs ${isProfitable ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                {isProfitable ? '+' : ''}{profitPercent?.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-current/20 flex justify-between text-xs text-muted-foreground">
            <span>Cost: ${costBasis.toFixed(2)}</span>
            <span>Value: ${displayValue.toFixed(2)}</span>
          </div>
        </motion.div>
      )}

      {/* Value Tips */}
      <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
        <p className="flex items-center gap-1.5">
          <span className="text-primary">💡</span>
          Values are estimates based on recent market data. Actual selling prices may vary.
        </p>
      </div>
    </div>
  );
};

export default ValuePreview;
