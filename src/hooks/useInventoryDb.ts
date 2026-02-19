import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cacheSet, cacheGet, cacheGetWithTimestamp, isOnline } from "@/lib/cache";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryInsert = Database["public"]["Tables"]["inventory_items"]["Insert"];

const CACHE_KEY = "inventory_items";

export const useInventoryDb = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const { toast } = useToast();

  // Load from cache first, then sync from server
  const loadFromCache = useCallback(async () => {
    try {
      const cached = await cacheGetWithTimestamp<InventoryItem[]>(CACHE_KEY);
      if (cached && cached.data.length > 0) {
        setItems(cached.data);
        setLastSyncTime(cached.timestamp);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading from cache:", error);
    }
  }, []);

  const fetchItems = useCallback(async (showLoading = true) => {
    if (!isOnline()) {
      // Offline - just use cached data
      setLoading(false);
      return;
    }

    if (showLoading && items.length === 0) {
      setLoading(true);
    }
    setIsSyncing(true);

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const inventoryData = data || [];
      setItems(inventoryData);

      // Cache the data
      await cacheSet(CACHE_KEY, inventoryData);
      setLastSyncTime(Date.now());
    } catch (error: any) {
      // Only show error if we don't have cached data
      if (items.length === 0) {
        toast({
          variant: "destructive",
          title: "Couldn't load your collection",
          description: error.message || "Check your connection and try again.",
        });
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [items.length, toast]);

  useEffect(() => {
    // Load from cache first (instant)
    loadFromCache().then(() => {
      // Then sync from server in background
      fetchItems(false);
    });

    // Subscribe to realtime changes
    const channel = supabase
      .channel("inventory_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_items",
        },
        () => {
          fetchItems(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addItem = async (item: Omit<InventoryInsert, "user_id">) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("inventory_items").insert({
        ...item,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Added to your collection! 🎉",
        description: `${item.name || "Card"} is now in your inventory.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Couldn't add that card",
        description: error.message || "Check your connection and try again.",
      });
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>, options?: { silent?: boolean }) => {
    try {
      const { error, data } = await supabase
        .from("inventory_items")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;

      // Only show toast if not silent
      if (!options?.silent) {
        toast({
          title: "Changes saved ✓",
          description: "Your card details have been updated.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Couldn't save changes",
        description: error.message || "Check your connection and try again.",
      });
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Card removed",
        description: "Removed from your collection.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Couldn't remove card",
        description: error.message || "Check your connection and try again.",
      });
      throw error;
    }
  };

  const checkForDuplicates = async (
    name: string,
    set_name: string,
    grading_company: string,
    grade: string | null
  ): Promise<{ exists: boolean; quantity: number; id: string | null }> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { exists: false, quantity: 0, id: null };

      const { data: existingItems } = await supabase
        .from("inventory_items")
        .select("id, quantity, grade")
        .eq("user_id", user.id)
        .eq("name", name)
        .eq("set_name", set_name)
        .eq("grading_company", grading_company);

      if (!existingItems || existingItems.length === 0) {
        return { exists: false, quantity: 0, id: null };
      }

      // Find matching item by comparing normalized grades
      const normalizedGrade = grade?.trim() || null;
      const existingItem = existingItems.find((item) => {
        const itemGrade = item.grade?.trim() || null;
        return itemGrade === normalizedGrade;
      });

      if (existingItem) {
        return { exists: true, quantity: existingItem.quantity, id: existingItem.id };
      }

      return { exists: false, quantity: 0, id: null };
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return { exists: false, quantity: 0, id: null };
    }
  };

  const uploadCardImage = async (file: File): Promise<string> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("card-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("card-images").getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Image upload failed",
        description: error.message || "Try a smaller image or check your connection.",
      });
      throw error;
    }
  };

  return {
    items,
    loading,
    isSyncing,
    lastSyncTime,
    addItem,
    updateItem,
    deleteItem,
    uploadCardImage,
    checkForDuplicates,
    refetch: async () => {
      await fetchItems(false);
    },
  };
};
