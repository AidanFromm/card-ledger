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
  status?: "completed" | "pending" | "shipped";
  fees?: number;
  created_at: string;
  updated_at: string;
  // Extended fields from inventory
  card_image_url?: string;
  set_name?: string;
  condition?: string;
  grading_company?: string;
  grade?: string;
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
  status?: "completed" | "pending" | "shipped";
  fees?: number;
  // Extended fields
  card_image_url?: string;
  set_name?: string;
  condition?: string;
  grading_company?: string;
  grade?: string;
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

      // Prepare the sale data, handling extended fields
      const saleData: any = {
        user_id: user.id,
        inventory_item_id: sale.inventory_item_id,
        item_name: sale.item_name,
        quantity_sold: sale.quantity_sold,
        purchase_price: sale.purchase_price,
        sale_price: sale.sale_price,
        profit: sale.profit,
        client_name: sale.client_name,
        event_name: sale.event_name,
        platform: sale.platform,
        sale_date: sale.sale_date,
        notes: sale.notes,
        sale_group_id: sale.sale_group_id,
      };

      // Add extended fields if the database supports them
      if (sale.card_image_url) saleData.card_image_url = sale.card_image_url;
      if (sale.set_name) saleData.set_name = sale.set_name;
      if (sale.condition) saleData.condition = sale.condition;
      if (sale.grading_company) saleData.grading_company = sale.grading_company;
      if (sale.grade) saleData.grade = sale.grade;
      if (sale.status) saleData.status = sale.status;
      if (sale.fees !== undefined) saleData.fees = sale.fees;

      const { error } = await supabase.from("sales").insert(saleData);

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

  // Update sale status
  const updateSaleStatus = async (id: string, status: "completed" | "pending" | "shipped") => {
    try {
      const { error } = await supabase
        .from("sales")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Sale marked as ${status}`,
      });
    } catch (error: any) {
      console.error("Error updating sale status:", error);
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get sales statistics
  const getStats = () => {
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + sale.sale_price * sale.quantity_sold,
      0
    );
    const totalProfit = sales.reduce(
      (sum, sale) => sum + (sale.profit || 0) * sale.quantity_sold,
      0
    );
    const totalItemsSold = sales.reduce(
      (sum, sale) => sum + sale.quantity_sold,
      0
    );
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalProfit,
      totalItemsSold,
      averageMargin,
      transactionCount: sales.length,
    };
  };

  return {
    sales,
    loading,
    addSale,
    updateSale,
    deleteSale,
    deleteBulkSale,
    updateSaleStatus,
    getStats,
    refetch: fetchSales,
  };
};
