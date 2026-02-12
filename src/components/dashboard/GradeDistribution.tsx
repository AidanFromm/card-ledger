import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Award, Star } from "lucide-react";

interface InventoryItem {
  id: string;
  grading_company?: string | null;
  grade?: string | null;
  quantity: number;
}

interface GradeDistributionProps {
  items: InventoryItem[];
}

// Grade to color mapping with glows
const getGradeStyle = (grade: string): { color: string; glow: string; label: string } => {
  const numericGrade = parseFloat(grade);
  
  if (isNaN(numericGrade)) {
    return { 
      color: '#3B82F6', 
      glow: 'rgba(59, 130, 246, 0.4)', 
      label: grade 
    };
  }
  
  if (numericGrade === 10) {
    return { 
      color: '#22C55E', 
      glow: 'rgba(34, 197, 94, 0.5)', 
      label: 'Gem Mint' 
    };
  }
  if (numericGrade >= 9.5) {
    return { 
      color: '#4ADE80', 
      glow: 'rgba(74, 222, 128, 0.4)', 
      label: 'Gem' 
    };
  }
  if (numericGrade >= 9) {
    return { 
      color: '#84CC16', 
      glow: 'rgba(132, 204, 22, 0.4)', 
      label: 'Mint' 
    };
  }
  if (numericGrade >= 8) {
    return { 
      color: '#EAB308', 
      glow: 'rgba(234, 179, 8, 0.4)', 
      label: 'NM-MT' 
    };
  }
  if (numericGrade >= 7) {
    return { 
      color: '#F97316', 
      glow: 'rgba(249, 115, 22, 0.4)', 
      label: 'NM' 
    };
  }
  return { 
    color: '#EF4444', 
    glow: 'rgba(239, 68, 68, 0.4)', 
    label: 'Lower' 
  };
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  
  const data = payload[0].payload;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl px-4 py-3 shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-1">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: data.color, boxShadow: `0 0 8px ${data.glow}` }}
        />
        <span className="text-sm font-semibold text-white">Grade {data.grade}</span>
      </div>
      <p className="text-xs text-zinc-400">{data.label}</p>
      <p className="text-sm font-bold text-white mt-1">
        {data.count} {data.count === 1 ? 'card' : 'cards'}
      </p>
    </motion.div>
  );
};

export const GradeDistribution = memo(({ items }: GradeDistributionProps) => {
  const [hoveredGrade, setHoveredGrade] = useState<string | null>(null);

  const { gradeData, rawCount, totalGraded } = useMemo(() => {
    const graded = items.filter(item => 
      item.grading_company && 
      item.grading_company.toLowerCase() !== 'raw' && 
      item.grade
    );

    const raw = items.filter(item => 
      !item.grading_company || 
      item.grading_company.toLowerCase() === 'raw' ||
      !item.grade
    );

    const rawTotal = raw.reduce((sum, item) => sum + item.quantity, 0);

    const gradeCounts = new Map<string, number>();
    graded.forEach(item => {
      const grade = item.grade || 'Unknown';
      gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + item.quantity);
    });

    const data = Array.from(gradeCounts.entries())
      .map(([grade, count]) => {
        const style = getGradeStyle(grade);
        return {
          grade,
          count,
          ...style,
        };
      })
      .sort((a, b) => {
        const gradeA = parseFloat(a.grade) || 0;
        const gradeB = parseFloat(b.grade) || 0;
        return gradeB - gradeA;
      });

    return { 
      gradeData: data, 
      rawCount: rawTotal,
      totalGraded: graded.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [items]);

  if (gradeData.length === 0 && rawCount === 0) {
    return null;
  }

  // Find highest count for bar width calculation
  const maxCount = Math.max(...gradeData.map(d => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-5 relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-800/50">
            <Award className="h-4 w-4 text-zinc-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Grade Distribution</h3>
        </div>
        
        {/* Stats pills */}
        <div className="flex items-center gap-2">
          {totalGraded > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-1">
              <Star className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">{totalGraded} graded</span>
            </div>
          )}
          {rawCount > 0 && (
            <div className="bg-zinc-800/50 rounded-full px-2.5 py-1">
              <span className="text-xs font-medium text-zinc-400">{rawCount} raw</span>
            </div>
          )}
        </div>
      </div>

      {gradeData.length > 0 ? (
        <>
          {/* Responsive Bar Chart */}
          <div className="h-[180px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={gradeData} 
                margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
                onMouseMove={(e) => {
                  if (e?.activePayload?.[0]?.payload) {
                    setHoveredGrade(e.activePayload[0].payload.grade);
                  }
                }}
                onMouseLeave={() => setHoveredGrade(null)}
              >
                <XAxis
                  dataKey="grade"
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 11, 
                    fill: 'rgb(161, 161, 170)',
                    fontWeight: 500
                  }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 11, 
                    fill: 'rgb(113, 113, 122)' 
                  }}
                  allowDecimals={false}
                  width={35}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {gradeData.map((entry, index) => {
                    const isHovered = hoveredGrade === entry.grade;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        opacity={hoveredGrade && !isHovered ? 0.4 : 1}
                        style={{
                          filter: isHovered ? `drop-shadow(0 0 8px ${entry.glow})` : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Grade Legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            {gradeData.slice(0, 4).map((entry, index) => (
              <motion.div
                key={entry.grade}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                  transition-all duration-200
                  ${hoveredGrade === entry.grade ? 'bg-zinc-800' : 'bg-zinc-800/30'}
                `}
                onMouseEnter={() => setHoveredGrade(entry.grade)}
                onMouseLeave={() => setHoveredGrade(null)}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ 
                    backgroundColor: entry.color,
                    boxShadow: hoveredGrade === entry.grade ? `0 0 8px ${entry.glow}` : 'none'
                  }}
                />
                <span className="text-xs font-medium text-zinc-300">
                  {entry.grade}
                </span>
                <span className="text-xs text-zinc-500">
                  ({entry.count})
                </span>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[120px] flex items-center justify-center">
          <p className="text-sm text-zinc-500">No graded cards yet</p>
        </div>
      )}
    </motion.div>
  );
});

GradeDistribution.displayName = "GradeDistribution";

export default GradeDistribution;
