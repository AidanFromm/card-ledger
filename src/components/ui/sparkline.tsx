import { useMemo } from "react";
import { motion } from "framer-motion";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
  animate?: boolean;
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  strokeWidth = 1.5,
  color,
  fillOpacity = 0.2,
  className = "",
  animate = true,
}: SparklineProps) {
  const { path, fillPath, isPositive } = useMemo(() => {
    if (data.length < 2) {
      return { path: "", fillPath: "", isPositive: true };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    // Normalize data to fit in the SVG viewport with padding
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const points = data.map((value, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create SVG path
    const linePath = points
      .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");

    // Create fill path (closed polygon)
    const fillPathStr = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`;

    // Determine trend
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    
    return {
      path: linePath,
      fillPath: fillPathStr,
      isPositive: lastValue >= firstValue,
    };
  }, [data, width, height]);

  if (data.length < 2) {
    return null;
  }

  // Use navy-500 (#1e3a5f) for positive, red for negative (CardLedger brand)
  const strokeColor = color || (isPositive ? "#1e3a5f" : "#ef4444");
  const fillColor = color || (isPositive ? "#1e3a5f" : "#ef4444");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`sparkline-gradient-${isPositive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <motion.path
        d={fillPath}
        fill={`url(#sparkline-gradient-${isPositive})`}
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Line */}
      <motion.path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

// Mini sparkline for list items (smaller, no animation by default)
export function MiniSparkline({
  data,
  className = "",
}: {
  data: number[];
  className?: string;
}) {
  return (
    <Sparkline
      data={data}
      width={60}
      height={20}
      strokeWidth={1}
      fillOpacity={0.1}
      animate={false}
      className={className}
    />
  );
}
