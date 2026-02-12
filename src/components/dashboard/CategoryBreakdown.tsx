import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { Layers } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category?: string | null;
  purchase_price: number;
  market_price: number | null;
  quantity: number;
}

interface CategoryBreakdownProps {
  items: InventoryItem[];
  onCategoryClick?: (category: string) => void;
}

// Premium category colors with gradients
const CATEGORY_COLORS: Record<string, { primary: string; glow: string }> = {
  'Pokemon': { primary: '#FBBF24', glow: 'rgba(251, 191, 36, 0.3)' },
  'Sports': { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)' },
  'One Piece': { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.3)' },
  'Magic': { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.3)' },
  'Yu-Gi-Oh!': { primary: '#F97316', glow: 'rgba(249, 115, 22, 0.3)' },
  'Dragon Ball': { primary: '#EC4899', glow: 'rgba(236, 72, 153, 0.3)' },
  'Lorcana': { primary: '#06B6D4', glow: 'rgba(6, 182, 212, 0.3)' },
  'Other': { primary: '#6B7280', glow: 'rgba(107, 114, 128, 0.3)' },
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 12px ${payload.glow})` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

export const CategoryBreakdown = memo(({ items, onCategoryClick }: CategoryBreakdownProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const categoryData = useMemo(() => {
    const categories = new Map<string, { value: number; count: number }>();
    
    items.forEach(item => {
      const category = item.category || 'Other';
      const value = (item.market_price || item.purchase_price) * item.quantity;
      const existing = categories.get(category) || { value: 0, count: 0 };
      categories.set(category, { 
        value: existing.value + value, 
        count: existing.count + item.quantity 
      });
    });

    return Array.from(categories.entries())
      .map(([name, data]) => {
        const colors = CATEGORY_COLORS[name] || CATEGORY_COLORS['Other'];
        return {
          name,
          value: data.value,
          count: data.count,
          color: colors.primary,
          glow: colors.glow,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const totalValue = categoryData.reduce((sum, cat) => sum + cat.value, 0);
  const totalCards = categoryData.reduce((sum, cat) => sum + cat.count, 0);

  if (categoryData.length === 0) {
    return null;
  }

  const activeCategory = activeIndex !== null ? categoryData[activeIndex] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-5 relative overflow-hidden"
    >
      {/* Background glow */}
      {activeCategory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 25% 50%, ${activeCategory.glow}, transparent 50%)` 
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 relative z-10">
        <div className="p-1.5 rounded-lg bg-zinc-800/50">
          <Layers className="h-4 w-4 text-zinc-400" />
        </div>
        <h3 className="text-base font-semibold text-white">By Category</h3>
      </div>
      
      <div className="flex items-center gap-6 relative z-10">
        {/* Donut Chart */}
        <div className="w-32 h-32 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={52}
                paddingAngle={3}
                dataKey="value"
                animationDuration={800}
                animationEasing="ease-out"
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(data) => onCategoryClick?.(data.name)}
                style={{ cursor: 'pointer' }}
              >
                {categoryData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.name}`} 
                    fill={entry.color}
                    style={{ filter: `drop-shadow(0 0 4px ${entry.glow})` }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              {activeCategory ? (
                <motion.div
                  key={activeCategory.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <p className="text-lg font-bold text-white">
                    {((activeCategory.value / totalValue) * 100).toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-zinc-400">{activeCategory.count} cards</p>
                </motion.div>
              ) : (
                <motion.div
                  key="total"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <p className="text-sm font-bold text-white">{totalCards}</p>
                  <p className="text-[10px] text-zinc-400">cards</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 max-h-[140px] overflow-y-auto scrollbar-hide pr-2">
          {categoryData.map((entry, index) => {
            const percentage = totalValue > 0 ? (entry.value / totalValue * 100) : 0;
            const isActive = activeIndex === index;
            
            return (
              <motion.div 
                key={entry.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex items-center justify-between p-2 rounded-xl cursor-pointer
                  transition-all duration-200
                  ${isActive ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40'}
                `}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() => onCategoryClick?.(entry.name)}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: entry.color,
                      boxShadow: isActive ? `0 0 8px ${entry.glow}` : 'none'
                    }}
                  />
                  <span className={`text-sm transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                    ${entry.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-zinc-500 w-10 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

CategoryBreakdown.displayName = "CategoryBreakdown";

export default CategoryBreakdown;
