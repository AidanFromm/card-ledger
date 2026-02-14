import { useRef, useState, useEffect } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { InventoryCard } from "./InventoryCard";
import { InventoryListCard } from "./InventoryListCard";
import { InventoryTableCard } from "./InventoryTableCard";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type ViewMode = 'grid' | 'list' | 'table';

interface VirtualizedInventoryGridProps {
  items: InventoryItem[];
  selectionMode: boolean;
  selectedItems: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (item: InventoryItem) => void;
  onSell: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  viewMode?: ViewMode;
  onLongPress?: (id: string) => void;
}

// Responsive breakpoints for column count (grid mode)
const getColumnCount = (width: number): number => {
  if (width >= 1280) return 6; // xl
  if (width >= 1024) return 5; // lg
  if (width >= 768) return 4;  // md
  return 2; // default (mobile)
};

// Row heights
const GRID_ROW_HEIGHT = 340;
const LIST_ROW_HEIGHT = 92;
const TABLE_ROW_HEIGHT = 56;
const TABLE_HEADER_HEIGHT = 40;
const GAP = 12;

export const VirtualizedInventoryGrid = ({
  items,
  selectionMode,
  selectedItems,
  onToggleSelect,
  onOpenDetail,
  onSell,
  onDelete,
  viewMode = 'grid',
  onLongPress,
}: VirtualizedInventoryGridProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(2);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Update column count and scroll margin on resize
  useEffect(() => {
    const updateLayout = () => {
      if (listRef.current) {
        setColumnCount(viewMode === 'grid' ? getColumnCount(listRef.current.offsetWidth) : 1);
        setScrollMargin(listRef.current.offsetTop);
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    const timer = setTimeout(updateLayout, 100);

    return () => {
      window.removeEventListener('resize', updateLayout);
      clearTimeout(timer);
    };
  }, [viewMode]);

  // Calculate rows
  const effectiveColumnCount = viewMode === 'grid' ? columnCount : 1;
  const rowCount = Math.ceil(items.length / effectiveColumnCount);
  const rowHeight = viewMode === 'grid' ? GRID_ROW_HEIGHT : viewMode === 'list' ? LIST_ROW_HEIGHT : TABLE_ROW_HEIGHT;

  // Use window virtualizer so the entire page scrolls together
  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 5,
    scrollMargin,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <motion.div 
      ref={listRef}
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Table Header for table view */}
      {viewMode === 'table' && items.length > 0 && (
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 items-center px-3 py-2 bg-secondary/30 border-b border-border/50 text-xs font-medium text-muted-foreground sticky top-0 z-10 rounded-t-xl">
          {selectionMode && <div className="w-5" />}
          <div>Card</div>
          <div className="text-center w-16">Condition</div>
          <div className="text-center w-16">Grade</div>
          <div className="text-right w-20">Cost</div>
          <div className="text-right w-20">Value</div>
          <div className="text-right w-24">P&L / ROI</div>
        </div>
      )}

      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
        className={viewMode === 'table' ? 'bg-card rounded-b-xl border border-t-0 border-border/50 overflow-hidden' : ''}
      >
        <AnimatePresence mode="popLayout">
          {virtualRows.map((virtualRow) => {
            const rowIndex = virtualRow.index;
            const startIndex = rowIndex * effectiveColumnCount;
            const rowItems = items.slice(startIndex, startIndex + effectiveColumnCount);

            return (
              <motion.div
                key={`${viewMode}-${virtualRow.key}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: rowHeight,
                  transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                  paddingBottom: viewMode === 'table' ? 0 : GAP,
                }}
              >
                {viewMode === 'grid' ? (
                  <div
                    className="grid items-stretch"
                    style={{
                      gridTemplateColumns: `repeat(${effectiveColumnCount}, minmax(0, 1fr))`,
                      gap: GAP,
                    }}
                  >
                    {rowItems.map((item) => (
                      <InventoryCard
                        key={item.id}
                        item={item}
                        selectionMode={selectionMode}
                        isSelected={selectedItems.has(item.id)}
                        onSelect={() => onToggleSelect(item.id)}
                        onOpenDetail={() => onOpenDetail(item)}
                        onSell={() => onSell(item)}
                        onDelete={() => onDelete(item.id)}
                        onLongPress={() => onLongPress?.(item.id)}
                      />
                    ))}
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-2">
                    {rowItems.map((item) => (
                      <InventoryListCard
                        key={item.id}
                        item={item}
                        selectionMode={selectionMode}
                        isSelected={selectedItems.has(item.id)}
                        onSelect={() => onToggleSelect(item.id)}
                        onOpenDetail={() => onOpenDetail(item)}
                        onSell={() => onSell(item)}
                        onDelete={() => onDelete(item.id)}
                        onLongPress={() => onLongPress?.(item.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {rowItems.map((item) => (
                      <InventoryTableCard
                        key={item.id}
                        item={item}
                        selectionMode={selectionMode}
                        isSelected={selectedItems.has(item.id)}
                        onSelect={() => onToggleSelect(item.id)}
                        onOpenDetail={() => onOpenDetail(item)}
                        onSell={() => onSell(item)}
                        onDelete={() => onDelete(item.id)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
