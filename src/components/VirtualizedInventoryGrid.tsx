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

// Responsive breakpoints for column count
const getColumnCount = (width: number): number => {
  if (width >= 1280) return 6; // xl
  if (width >= 1024) return 5; // lg
  if (width >= 768) return 4;  // md
  return 2; // default (mobile)
};

// Row height must be consistent - card height + gap
const ROW_HEIGHT = 340;
const GAP = 12;

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

  // Update column count and scroll margin on resize
  useEffect(() => {
    const updateLayout = () => {
      if (listRef.current) {
        setColumnCount(getColumnCount(listRef.current.offsetWidth));
        setScrollMargin(listRef.current.offsetTop);
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    // Also update after a short delay to catch late layout changes
    const timer = setTimeout(updateLayout, 100);

    return () => {
      window.removeEventListener('resize', updateLayout);
      clearTimeout(timer);
    };
  }, []);

  // Calculate rows
  const rowCount = Math.ceil(items.length / columnCount);

  // Use window virtualizer so the entire page scrolls together
  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    scrollMargin,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div ref={listRef}>
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
                style={{
                  gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
