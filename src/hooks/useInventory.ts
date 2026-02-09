import { useState, useEffect } from "react";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  condition: "mint" | "near-mint" | "lightly-played" | "moderately-played" | "heavily-played" | "damaged";
}

const STORAGE_KEY = "pokemon-inventory";

const sampleData: InventoryItem[] = [
  {
    id: "1",
    name: "Charizard Base Set 1st Edition",
    category: "Base Set",
    price: 15000,
    quantity: 1,
    condition: "near-mint",
  },
  {
    id: "2",
    name: "Pikachu VMAX",
    category: "Sword & Shield",
    price: 85,
    quantity: 12,
    condition: "mint",
  },
  {
    id: "3",
    name: "Mewtwo EX",
    category: "Base Set",
    price: 250,
    quantity: 3,
    condition: "lightly-played",
  },
];

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : sampleData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<InventoryItem, "id">) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
    };
    setItems([...items, newItem]);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return { items, addItem, deleteItem, updateItem };
};
