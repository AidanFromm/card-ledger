import { useState, useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Award, Package, Calendar, DollarSign, Crown, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { PageTransition } from "@/components/PageTransition";
import { motion } from "framer-motion";

const COLORS = [
  'hsl(212, 100%, 49%)', 'hsl(142, 76%, 45%)', 'hsl(271, 81%, 56%)',
  'hsl(47, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(180, 70%, 45%)',
  'hsl(320, 70%, 50%)', 'hsl(30, 90%, 55%)', 'hsl(160, 60%, 40%)',
  'hsl(240, 60%, 60%)',
];

const Stats = () => {
  const { items, loading } = useInventoryDb();
  const [expandedSection, setExpandedSection] = useState<string | null>("sets");

  const unsoldItems = useMemo(() => items.filter(item => !item.sale_price && item.quantity > 0), [items]);

  // By Set
  const bySet = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    unsoldItems.forEach(item => {
      const set = item.set_name || "Unknown";
      if (!map[set]) map[set] = { count: 0, value: 0 };
      map[set].count += item.quantity;
      map[set].value += (item.market_price || item.purchase_price) * item.quantity;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [unsoldItems]);

  // By Year
  const byYear = useMemo(() => {
    const map: Record<string, number> = {};
    unsoldItems.forEach(item => {
      const year = item.created_at ? new Date(item.created_at).getFullYear().toString() : "Unknown";
      map[year] = (map[year] || 0) + item.quantity;
    });
    return Object.entries(map)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [unsoldItems]);

  // By Grading Company
  const byGrading = useMemo(() => {
    const map: Record<string, number> = {};
    unsoldItems.forEach(item => {
      const co = (item.grading_company || 'raw').toUpperCase();
      map[co] = (map[co] || 0) + item.quantity;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [unsoldItems]);

  // Price Distribution
  const priceDistribution = useMemo(() => {
    const buckets = [
      { label: '$0-5', min: 0, max: 5 },
      { label: '$5-25', min: 5, max: 25 },
      { label: '$25-50', min: 25, max: 50 },
      { label: '$50-100', min: 50, max: 100 },
      { label: '$100-250', min: 100, max: 250 },
      { label: '$250-500', min: 250, max: 500 },
      { label: '$500+', min: 500, max: Infinity },
    ];
    return buckets.map(b => ({
      range: b.label,
      count: unsoldItems.filter(item => {
        const price = (item.market_price || item.purchase_price) * item.quantity;
        return price >= b.min && price < b.max;
      }).length,
    }));
  }, [unsoldItems]);

  // Most / Least Valuable
  const sorted = useMemo(() =>
    [...unsoldItems].sort((a, b) =>
      ((b.market_price || b.purchase_price) * b.quantity) - ((a.market_price || a.purchase_price) * a.quantity)
    ), [unsoldItems]);
  const mostValuable = sorted.slice(0, 10);
  const leastValuable = sorted.slice(-10).reverse();

  // Set Completion (simple: based on unique card_numbers per set)
  const setCompletion = useMemo(() => {
    const sets: Record<string, Set<string>> = {};
    unsoldItems.forEach(item => {
      const set = item.set_name || "Unknown";
      if (!sets[set]) sets[set] = new Set();
      if (item.card_number) sets[set].add(item.card_number);
    });
    return Object.entries(sets)
      .map(([name, cards]) => ({ name, unique: cards.size }))
      .sort((a, b) => b.unique - a.unique)
      .slice(0, 15);
  }, [unsoldItems]);

  const totalCards = unsoldItems.reduce((s, i) => s + i.quantity, 0);
  const totalValue = unsoldItems.reduce((s, i) => s + (i.market_price || i.purchase_price) * i.quantity, 0);
  const totalCost = unsoldItems.reduce((s, i) => s + i.purchase_price * i.quantity, 0);
  const avgCardValue = totalCards > 0 ? totalValue / totalCards : 0;
  const formatCurrency = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const toggle = (section: string) => setExpandedSection(prev => prev === section ? null : section);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <div className="flex">
          <DesktopSidebar />
          <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 flex-1">
            <div className="h-8 w-48 bg-muted/30 rounded-xl animate-pulse mb-6" />
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted/20 rounded-2xl animate-pulse" />)}
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <div className="flex">
        <DesktopSidebar />
        <PageTransition>
          <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 flex-1">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Collection Statistics</h1>
              <p className="text-sm text-muted-foreground/60 mb-6">{totalCards} cards across {bySet.length} sets</p>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Cards', value: totalCards.toString(), icon: Package },
                { label: 'Total Value', value: `$${formatCurrency(totalValue)}`, icon: DollarSign },
                { label: 'Avg Card Value', value: `$${formatCurrency(avgCardValue)}`, icon: TrendingUp },
                { label: 'Total P&L', value: `${totalValue - totalCost >= 0 ? '+' : ''}$${formatCurrency(Math.abs(totalValue - totalCost))}`, icon: totalValue - totalCost >= 0 ? TrendingUp : TrendingDown },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="card-clean-elevated p-4 rounded-2xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <p className="label-metric">{label}</p>
                  </div>
                  <p className="text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* Cards by Set */}
            <CollapsibleSection title="Cards by Set" icon={<Package className="h-4 w-4" />} expanded={expandedSection === 'sets'} onToggle={() => toggle('sets')}>
              {bySet.length > 0 ? (
                <div className="space-y-2">
                  {bySet.slice(0, 20).map((set, i) => (
                    <div key={set.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{set.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{set.count} cards</span>
                        </div>
                        <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((set.value / (bySet[0]?.value || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-success flex-shrink-0">${formatCurrency(set.value)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
            </CollapsibleSection>

            {/* Price Distribution */}
            <CollapsibleSection title="Price Distribution" icon={<BarChart3 className="h-4 w-4" />} expanded={expandedSection === 'price'} onToggle={() => toggle('price')}>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceDistribution}>
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '14px', fontSize: '13px' }} />
                    <Bar dataKey="count" fill="hsl(212, 100%, 49%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CollapsibleSection>

            {/* By Grading Company */}
            <CollapsibleSection title="By Grading Company" icon={<Award className="h-4 w-4" />} expanded={expandedSection === 'grading'} onToggle={() => toggle('grading')}>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byGrading} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {byGrading.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {byGrading.map((entry, i) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm">{entry.name}</span>
                      </div>
                      <span className="text-sm font-bold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {/* By Year Added */}
            <CollapsibleSection title="By Year Added" icon={<Calendar className="h-4 w-4" />} expanded={expandedSection === 'year'} onToggle={() => toggle('year')}>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byYear}>
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '14px', fontSize: '13px' }} />
                    <Bar dataKey="count" fill="hsl(142, 76%, 45%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CollapsibleSection>

            {/* Most Valuable */}
            <CollapsibleSection title="Most Valuable Cards" icon={<Crown className="h-4 w-4" />} expanded={expandedSection === 'most'} onToggle={() => toggle('most')}>
              <div className="space-y-2">
                {mostValuable.map((item, i) => {
                  const val = (item.market_price || item.purchase_price) * item.quantity;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                        {item.card_image_url && <img src={item.card_image_url} alt="" className="w-8 h-11 object-contain rounded" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{item.set_name} {item.grading_company !== 'raw' ? `• ${item.grading_company?.toUpperCase()} ${item.grade}` : ''}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-success flex-shrink-0">${formatCurrency(val)}</span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* Least Valuable */}
            <CollapsibleSection title="Least Valuable Cards" icon={<TrendingDown className="h-4 w-4" />} expanded={expandedSection === 'least'} onToggle={() => toggle('least')}>
              <div className="space-y-2">
                {leastValuable.map((item, i) => {
                  const val = (item.market_price || item.purchase_price) * item.quantity;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{item.set_name}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0">${formatCurrency(val)}</span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* Set Completion */}
            <CollapsibleSection title="Set Completion (Unique Cards)" icon={<Package className="h-4 w-4" />} expanded={expandedSection === 'completion'} onToggle={() => toggle('completion')}>
              <div className="space-y-2">
                {setCompletion.map(set => (
                  <div key={set.name} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1 mr-2">{set.name}</span>
                    <span className="text-sm font-bold flex-shrink-0">{set.unique} unique</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </main>
        </PageTransition>
      </div>
      <BottomNav />
    </div>
  );
};

const CollapsibleSection = ({ title, icon, expanded, onToggle, children }: {
  title: string; icon: React.ReactNode; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-clean-elevated rounded-2xl mb-3 overflow-hidden">
    <button onClick={onToggle} className="flex items-center justify-between w-full p-4 text-left">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold text-sm">{title}</span>
      </div>
      {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
    {expanded && <div className="px-4 pb-4">{children}</div>}
  </motion.div>
);

export default Stats;
