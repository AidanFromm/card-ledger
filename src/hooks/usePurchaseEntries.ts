import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PurchaseEntry {
  id: string;
  user_id: string;
  inventory_item_id: string | null;
  item_name: string;
  set_name: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const usePurchaseEntries = (inventoryItemId?: string) => {
  const [entries, setEntries] = useState<PurchaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let query = supabase
        .from("purchase_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false });

      if (inventoryItemId) {
        query = query.eq("inventory_item_id", inventoryItemId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching purchase entries:", error);
      toast({
        title: "Error loading purchase history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [inventoryItemId]);

  const addEntry = async (entry: Omit<PurchaseEntry, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase.from("purchase_entries").insert({
        ...entry,
        user_id: user.id,
      });

      if (error) throw error;
      fetchEntries();
    } catch (error: any) {
      console.error("Error adding purchase entry:", error);
      throw error;
    }
  };

  const updateEntry = async (entryId: string, updates: { quantity?: number; purchase_price?: number }) => {
    try {
      const { error } = await supabase
        .from("purchase_entries")
        .update(updates)
        .eq("id", entryId);

      if (error) throw error;
      
      toast({
        title: "Purchase updated",
        description: "Purchase entry has been updated successfully",
      });
      
      fetchEntries();
    } catch (error: any) {
      console.error("Error updating purchase entry:", error);
      toast({
        title: "Error updating purchase",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from("purchase_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;
      
      toast({
        title: "Purchase deleted",
        description: "Purchase entry has been removed",
      });
      
      fetchEntries();
    } catch (error: any) {
      console.error("Error deleting purchase entry:", error);
      toast({
        title: "Error deleting purchase",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries,
  };
};
