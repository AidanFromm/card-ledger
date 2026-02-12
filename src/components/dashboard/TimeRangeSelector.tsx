import { memo } from "react";
import { motion } from "framer-motion";
import type { TimeRange } from "@/hooks/usePortfolioHistory";

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' },
];

export const TimeRangeSelector = memo(({ selected, onChange }: TimeRangeSelectorProps) => {
  return (
    <div className="relative flex items-center justify-center gap-1 p-1 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50">
      {ranges.map(({ value, label }) => {
        const isSelected = selected === value;
        return (
          <motion.button
            key={value}
            onClick={() => onChange(value)}
            className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-colors z-10 ${
              isSelected 
                ? 'text-white' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isSelected && (
              <motion.div
                layoutId="timeRangePill"
                className="absolute inset-0 bg-zinc-700/70 rounded-xl border border-zinc-600/50"
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 30 
                }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
});

TimeRangeSelector.displayName = "TimeRangeSelector";

export const getTimeRangeLabel = (range: TimeRange): string => {
  switch (range) {
    case '1D': return 'Today';
    case '1W': return 'Past Week';
    case '1M': return 'Past Month';
    case '3M': return 'Past 3 Months';
    case '1Y': return 'Past Year';
    case 'ALL': return 'All Time';
    default: return 'All Time';
  }
};

export default TimeRangeSelector;
