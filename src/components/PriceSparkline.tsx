/**
 * Simple SVG sparkline for price history in ItemDetailDialog
 */

interface PriceSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export const PriceSparkline = ({
  data,
  width = 200,
  height = 40,
  className = '',
}: PriceSparklineProps) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? '#10b981' : '#ef4444';

  // Build area fill path
  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
  const areaPath = `M${points.join(' L')} L${lastX},${height} L${firstX},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`spark-grad-${isUp ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#spark-grad-${isUp ? 'up' : 'down'})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
