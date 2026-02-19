import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { motion } from "framer-motion";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type SortKey = 'name' | 'set_name' | 'grade' | 'quantity' | 'purchase_price' | 'market_price' | 'pnl' | 'created_at';
type SortDir = 'asc' | 'desc';

interface InventoryTableViewProps {
  items: InventoryItem[];
  selectionMode: boolean;
  selectedItems: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (item: InventoryItem) => void;
}

export const InventoryTableView = ({ items, selectionMode, selectedItems, onToggleSelect, onOpenDetail }: InventoryTableViewProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'set_name': cmp = a.set_name.localeCompare(b.set_name); break;
        case 'grade': cmp = (a.grade || '').localeCompare(b.grade || ''); break;
        case 'quantity': cmp = a.quantity - b.quantity; break;
        case 'purchase_price': cmp = a.purchase_price - b.purchase_price; break;
        case 'market_price': cmp = (a.market_price || 0) - (b.market_price || 0); break;
        case 'pnl': {
          const pnlA = ((a.market_price || a.purchase_price) - a.purchase_price) * a.quantity;
          const pnlB = ((b.market_price || b.purchase_price) - b.purchase_price) * b.quantity;
          cmp = pnlA - pnlB; break;
        }
        case 'created_at': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const columns: { key: SortKey; label: string; className?: string; sticky?: boolean }[] = [
    { key: 'name', label: 'Name', className: 'text-left min-w-[150px]', sticky: true },
    { key: 'set_name', label: 'Set', className: 'text-left min-w-[120px] hidden sm:table-cell' },
    { key: 'grade', label: 'Grade', className: 'text-left min-w-[80px]' },
    { key: 'quantity', label: 'Qty', className: 'text-right w-[60px]' },
    { key: 'purchase_price', label: 'Cost', className: 'text-right w-[80px]' },
    { key: 'market_price', label: 'Market', className: 'text-right w-[80px]' },
    { key: 'pnl', label: 'P&L', className: 'text-right w-[90px]' },
    { key: 'created_at', label: 'Added', className: 'text-right w-[90px] hidden lg:table-cell' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto rounded-2xl border border-border/20 -mx-4 sm:mx-0"
      role="region"
      aria-label="Inventory table"
      tabIndex={0}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/20 bg-secondary/20">
            {selectionMode && <th className="w-10 px-3 py-3" />}
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className={`px-3 py-3 font-semibold text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none ${col.className || ''} ${col.sticky ? 'sticky left-0 z-10 bg-secondary/20 backdrop-blur-sm' : ''}`}
              >
                <div className={`flex items-center gap-1 ${col.className?.includes('text-right') ? 'justify-end' : ''}`}>
                  {col.label}
                  <SortIcon col={col.key} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const market = (item.market_price || item.purchase_price) * item.quantity;
            const cost = item.purchase_price * item.quantity;
            const pnl = market - cost;
            const isSelected = selectedItems.has(item.id);
            return (
              <tr
                key={item.id}
                onClick={() => selectionMode ? onToggleSelect(item.id) : onOpenDetail(item)}
                className={`border-b border-border/10 cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/5' : 'hover:bg-secondary/20'
                }`}
              >
                {selectionMode && (
                  <td className="px-3 py-2.5">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {isSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>}
                    </div>
                  </td>
                )}
                <td className="px-3 py-2.5 sticky left-0 z-10 bg-card backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    {item.card_image_url && <img src={item.card_image_url} alt="" className="w-7 h-10 object-contain rounded flex-shrink-0" />}
                    <span className="font-medium truncate max-w-[180px]">{item.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[150px] hidden sm:table-cell">{item.set_name}</td>
                <td className="px-3 py-2.5">
                  {item.grading_company !== 'raw' ? (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                      {item.grading_company?.toUpperCase()} {item.grade}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Raw</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-medium">{item.quantity}</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">${fmt(cost)}</td>
                <td className="px-3 py-2.5 text-right font-medium">${fmt(market)}</td>
                <td className={`px-3 py-2.5 text-right font-semibold ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {pnl >= 0 ? '+' : ''}${fmt(Math.abs(pnl))}
                </td>
                <td className="px-3 py-2.5 text-right text-muted-foreground text-xs hidden lg:table-cell">
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground/50 text-sm">No items to display</div>
      )}
    </motion.div>
  );
};

export default InventoryTableView;
