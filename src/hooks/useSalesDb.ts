import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Sale {
  id: string;
  user_id: string;
  inventory_item_id: string | null;
  item_name: string;
  quantity_sold: number;
  purchase_price: number;
  sale_price: number;
  profit?: number;
  client_name: string | null;
  event_name: string | null;
  platform: string | null;
  sale_date: string;
  notes: string | null;
  sale_group_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleInsert {
  inventory_item_id?: string;
  item_name: string;
  quantity_sold: number;
  purchase_price: number;
  sale_price: number;
  profit?: number;
  client_name?: string;
  event_name?: string;
  platform?: string;
  sale_date?: string;
  notes?: string;
  sale_group_id?: string;
}

export const useSalesDb = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSales = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("user_id", user.id)
        .order("sale_date", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      console.error("Error fetching sales:", error);
      toast({
        title: "Couldn't load sales",
        description: error.message || "Check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    const channel = supabase
      .channel("sales_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sales",
        },
        () => {
          fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addSale = async (sale: SaleInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase.from("sales").insert({
        ...sale,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Sale recorded! 💰",
        description: "Nice move — your profit is updated.",
      });
    } catch (error: any) {
      console.error("Error adding sale:", error);
      toast({
        title: "Couldn't record sale",
        description: error.message || "Check your connection and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSale = async (id: string, updates: Partial<Sale>) => {
    try {
      const { error } = await supabase
        .from("sales")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sale updated ✓",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      console.error("Error updating sale:", error);
      toast({
        title: "Couldn't update sale",
        description: error.message || "Check your connection and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { error } = await supabase.from("sales").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Sale removed",
        description: "The sale record has been deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting sale:", error);
      toast({
        title: "Couldn't delete sale",
        description: error.message || "Check your connection and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBulkSale = async (saleGroupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Delete all sales with this sale_group_id
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("sale_group_id", saleGroupId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Bulk sale removed",
        description: "All items in that sale have been deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting bulk sale:", error);
      toast({
        title: "Couldn't delete bulk sale",
        description: error.message || "Check your connection and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    sales,
    loading,
    addSale,
    updateSale,
    deleteSale,
    deleteBulkSale,
  };
};
