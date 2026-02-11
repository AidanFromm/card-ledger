import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface InventoryItem {
  id: string;
  grading_company?: string | null;
  grade?: string | null;
  quantity: number;
}

interface GradeDistributionProps {
  items: InventoryItem[];
}

// Grade to color mapping (higher grades = more gold/green)
const getGradeColor = (grade: string): string => {
  const numericGrade = parseFloat(grade);
  if (isNaN(numericGrade)) return 'hsl(212, 100%, 49%)'; // Default blue
  
  if (numericGrade >= 9.5) return '#22C55E';  // Green - Gem Mint
  if (numericGrade >= 9) return '#84CC16';    // Lime
  if (numericGrade >= 8) return '#EAB308';    // Yellow
  if (numericGrade >= 7) return '#F97316';    // Orange
  return '#EF4444';                           // Red - Lower grades
};

export const GradeDistribution = memo(({ items }: GradeDistributionProps) => {
  const gradeData = useMemo(() => {
    // Only include graded items (not raw)
    const graded = items.filter(item => 
      item.grading_company && 
      item.grading_company.toLowerCase() !== 'raw' && 
      item.grade
    );

    // Count by grade
    const gradeCounts = new Map<string, number>();
    graded.forEach(item => {
      const grade = item.grade || 'Unknown';
      gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + item.quantity);
    });

    return Array.from(gradeCounts.entries())
      .map(([grade, count]) => ({
        grade,
        count,
        color: getGradeColor(grade),
      }))
      .sort((a, b) => {
        // Sort by numeric grade descending
        const gradeA = parseFloat(a.grade) || 0;
        const gradeB = parseFloat(b.grade) || 0;
        return gradeB - gradeA;
      });
  }, [items]);

  if (gradeData.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">Grade Distribution</h3>
      
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={gradeData} 
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="grade"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                fontSize: '13px',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} ${value === 1 ? 'card' : 'cards'}`,
                `Grade ${props.payload.grade}`
              ]}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar 
              dataKey="count" 
              radius={[6, 6, 0, 0]}
              animationDuration={500}
            >
              {gradeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});

GradeDistribution.displayName = "GradeDistribution";

export default GradeDistribution;
