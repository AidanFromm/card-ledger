import { useMemo } from "react";
import { motion } from "framer-motion";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
  positive?: boolean; // Force color regardless of data trend
  showArea?: boolean;
  animate?: boolean;
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  className = "",
  strokeWidth = 2,
  positive,
  showArea = true,
  animate = true,
}: SparklineProps) {
  // Calculate if trend is positive (last value > first value)
  const isPositive = positive ?? (data.length > 1 ? data[data.length - 1] >= data[0] : true);

  // Generate SVG path from data points
  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) {
      return { linePath: "", areaPath: "" };
    }

    const padding = strokeWidth;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Prevent division by zero

    // Scale data points to fit in chart area
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create smooth curve using Catmull-Rom spline
    let linePath = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Catmull-Rom to Bezier conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    // Create area path (line path + close to bottom)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { linePath, areaPath };
  }, [data, width, height, strokeWidth]);

  if (data.length < 2) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    );
  }

  const strokeColor = isPositive ? "#00C853" : "#FF5252";
  const fillColor = isPositive ? "rgba(0, 200, 83, 0.15)" : "rgba(255, 82, 82, 0.15)";

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`sparkline-gradient-${isPositive}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? "#00C853" : "#FF5252"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isPositive ? "#00C853" : "#FF5252"} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && (
        <motion.path
          d={areaPath}
          fill={`url(#sparkline-gradient-${isPositive})`}
          initial={animate ? { opacity: 0 } : undefined}
          animate={animate ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Line stroke */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

// Mini sparkline badge for use in cards
interface SparklineBadgeProps {
  data: number[];
  className?: string;
}

export function SparklineBadge({ data, className = "" }: SparklineBadgeProps) {
  const isPositive = data.length > 1 ? data[data.length - 1] >= data[0] : true;
  const changePercent = data.length > 1 
    ? ((data[data.length - 1] - data[0]) / data[0] * 100)
    : 0;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Sparkline
        data={data}
        width={40}
        height={16}
        strokeWidth={1.5}
        showArea={false}
        animate={false}
      />
      <span className={`text-xs font-medium ${isPositive ? "text-navy-500" : "text-red-500"}`}>
        {isPositive ? "+" : ""}{changePercent.toFixed(1)}%
      </span>
    </div>
  );
}
