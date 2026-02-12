import { useRef, useState, useEffect } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { InventoryCard } from "./InventoryCard";
import { InventoryListCard } from "./InventoryListCard";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type ViewMode = 'grid' | 'list';

interface VirtualizedInventoryGridProps {
  items: InventoryItem[];
  selectionMode: boolean;
  selectedItems: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (item: InventoryItem) => void;
  onSell: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  viewMode?: ViewMode;
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
  const rowHeight = viewMode === 'grid' ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT;

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
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
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
                  paddingBottom: GAP,
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
                      />
                    ))}
                  </div>
                ) : (
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
