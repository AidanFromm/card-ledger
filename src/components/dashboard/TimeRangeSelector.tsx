import { memo } from "react";
import { motion } from "framer-motion";
import type { TimeRange } from "@/hooks/usePortfolioHistory";

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

export const TimeRangeSelector = memo(({ selected, onChange }: TimeRangeSelectorProps) => {
  return (
    <div className="flex justify-center gap-1">
      {TIME_RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className="relative px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors"
        >
          {/* Active background indicator */}
          {selected === range && (
            <motion.div
              layoutId="activeTimeRange"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span 
            className={`relative z-10 ${
              selected === range 
                ? 'text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {range}
          </span>
        </button>
      ))}
    </div>
  );
});

TimeRangeSelector.displayName = "TimeRangeSelector";

export default TimeRangeSelector;
