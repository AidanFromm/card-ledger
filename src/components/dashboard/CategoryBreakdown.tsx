import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'Pokemon': '#FBBF24',      // Yellow
  'Sports': '#3B82F6',       // Blue  
  'One Piece': '#EF4444',    // Red
  'Magic': '#8B5CF6',        // Purple
  'Yu-Gi-Oh!': '#F97316',    // Orange
  'Dragon Ball': '#EC4899',  // Pink
  'Lorcana': '#06B6D4',      // Cyan
  'Other': '#6B7280',        // Gray
};

export const CategoryBreakdown = memo(({ items }: CategoryBreakdownProps) => {
  const categoryData = useMemo(() => {
    const categories = new Map<string, number>();
    
    items.forEach(item => {
      const category = item.category || 'Other';
      const value = (item.market_price || item.purchase_price) * item.quantity;
      categories.set(category, (categories.get(category) || 0) + value);
    });

    return Array.from(categories.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Other'],
      }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const totalValue = categoryData.reduce((sum, cat) => sum + cat.value, 0);

  if (categoryData.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">By Category</h3>
      
      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
                animationDuration={500}
              >
                {categoryData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [
                  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  'Value'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 max-h-[120px] overflow-y-auto scrollbar-hide">
          {categoryData.map((entry) => {
            const percentage = totalValue > 0 ? (entry.value / totalValue * 100) : 0;
            return (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-foreground">{entry.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

CategoryBreakdown.displayName = "CategoryBreakdown";

export default CategoryBreakdown;
