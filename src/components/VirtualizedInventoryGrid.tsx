import { useRef, useState, useEffect } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { InventoryCard } from "./InventoryCard";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface VirtualizedInventoryGridProps {
  items: InventoryItem[];
  selectionMode: boolean;
  selectedItems: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (item: InventoryItem) => void;
  onSell: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

const getColumnCount = (width: number): number => {
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
};

const ROW_HEIGHT = 380;
const GAP = 16;

export const VirtualizedInventoryGrid = ({
  items,
  selectionMode,
  selectedItems,
  onToggleSelect,
  onOpenDetail,
  onSell,
  onDelete,
}: VirtualizedInventoryGridProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(2);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const updateLayout = () => {
      if (listRef.current) {
        setColumnCount(getColumnCount(listRef.current.offsetWidth));
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
  }, []);

  const rowCount = Math.ceil(items.length / columnCount);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
    scrollMargin,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div ref={listRef} className="px-4 md:px-0" role="grid" aria-label="Card inventory grid">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const startIndex = rowIndex * columnCount;
          const rowItems = items.slice(startIndex, startIndex + columnCount);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: ROW_HEIGHT,
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                paddingBottom: GAP,
              }}
            >
              <div
                className="grid items-stretch"
                role="row"
                style={{
                  gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  gap: GAP,
                }}
              >
                {rowItems.map((item, i) => (
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
