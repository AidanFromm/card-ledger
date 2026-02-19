import { memo, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, Tooltip, ReferenceDot } from "recharts";

interface SparklineDataPoint {
  value: number;
  date?: string;
  label?: string;
}

interface SparklineProps {
  data: SparklineDataPoint[];
  height?: number;
  color?: string;
  gradientOpacity?: number;
  strokeWidth?: number;
  showTooltip?: boolean;
  showGlow?: boolean;
  animated?: boolean;
  onHover?: (value: number | null, date?: string) => void;
  className?: string;
}

export const Sparkline = memo(({
  data,
  height = 80,
  color = "#627d98",
  gradientOpacity = 0.3,
  strokeWidth = 2,
  showTooltip = true,
  showGlow = true,
  animated = true,
  onHover,
  className = "",
}: SparklineProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  
  // Determine if data trend is positive
  const isPositive = useMemo(() => {
    if (data.length < 2) return true;
    return data[data.length - 1].value >= data[0].value;
  }, [data]);

  const activeColor = color || (isPositive ? "#627d98" : "#ef4444");
  const gradientId = `sparklineGradient-${Math.random().toString(36).substr(2, 9)}`;

  const handleMouseMove = useCallback((e: any) => {
    if (e?.activePayload?.[0]) {
      const payload = e.activePayload[0].payload;
      setHoveredValue(payload.value);
      setHoveredIndex(e.activeTooltipIndex);
      onHover?.(payload.value, payload.date);
    }
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    setHoveredValue(null);
    setHoveredIndex(null);
    onHover?.(null);
  }, [onHover]);

  if (data.length < 2) {
    return (
      <div 
        className={`flex items-center justify-center text-zinc-600 text-sm ${className}`}
        style={{ height }}
      >
        Not enough data
      </div>
    );
  }

  return (
    <motion.div 
      initial={animated ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
      style={{ height }}
    >
      {/* Glow effect */}
      {showGlow && (
        <div 
          className="absolute inset-0 blur-2xl opacity-30 pointer-events-none"
          style={{ 
            background: `radial-gradient(ellipse at bottom, ${activeColor}40, transparent 70%)` 
          }}
        />
      )}

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity={gradientOpacity} />
              <stop offset="50%" stopColor={activeColor} stopOpacity={gradientOpacity * 0.5} />
              <stop offset="100%" stopColor={activeColor} stopOpacity={0} />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {showTooltip && (
            <Tooltip
              content={() => null}
              cursor={{
                stroke: activeColor,
                strokeWidth: 1,
                strokeDasharray: "4 4",
                opacity: 0.5,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            fill={`url(#${gradientId})`}
            animationDuration={animated ? 1500 : 0}
            animationEasing="ease-out"
            filter={showGlow ? "url(#glow)" : undefined}
          />

          {/* Hover dot */}
          {hoveredIndex !== null && data[hoveredIndex] && (
            <ReferenceDot
              x={hoveredIndex}
              y={data[hoveredIndex].value}
              r={6}
              fill={activeColor}
              stroke="white"
              strokeWidth={2}
              isFront
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Hover value tooltip */}
      <AnimatePresence>
        {hoveredValue !== null && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 bg-zinc-800/90 backdrop-blur-sm rounded-lg border border-zinc-700/50 shadow-xl"
          >
            <span className="text-sm font-semibold text-white">
              ${hoveredValue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

Sparkline.displayName = "Sparkline";

// Mini sparkline for cards (no interactivity)
interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const MiniSparkline = memo(({
  data,
  width = 80,
  height = 30,
  color,
  className = "",
}: MiniSparklineProps) => {
  const isPositive = data.length >= 2 && data[data.length - 1] >= data[0];
  const activeColor = color || (isPositive ? "#627d98" : "#ef4444");
  
  const points = useMemo(() => {
    if (data.length < 2) return "";
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    return data
      .map((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - min) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (data.length < 2) return null;

  return (
    <motion.svg
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{ opacity: 1, pathLength: 1 }}
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={`miniGradient-${points.slice(0, 10)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={activeColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={activeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      
      {/* Fill area */}
      <motion.polygon
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        points={`2,${height - 2} ${points} ${width - 2},${height - 2}`}
        fill={`url(#miniGradient-${points.slice(0, 10)})`}
      />
      
      {/* Line */}
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        points={points}
        fill="none"
        stroke={activeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* End dot */}
      <motion.circle
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        cx={width - 2}
        cy={2 + (height - 4) - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 4)}
        r={3}
        fill={activeColor}
      />
    </motion.svg>
  );
});

MiniSparkline.displayName = "MiniSparkline";

export default Sparkline;
