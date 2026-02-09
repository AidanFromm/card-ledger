import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClientList {
  id: string;
  user_id: string;
  list_name: string;
  share_token: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientListItem {
  id: string;
  list_id: string;
  inventory_item_id: string | null;
  item_name: string;
  set_name: string;
  card_image_url: string | null;
  grading_company: string;
  grade: string | null;
  market_price: number;
  quantity: number;
  created_at: string;
}

export const useClientLists = () => {
  const [lists, setLists] = useState<ClientList[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("client_lists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error("Error fetching lists:", error);
      toast({
        title: "Error",
        description: "Failed to fetch client lists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();

    const channel = supabase
      .channel("client_lists_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_lists" },
        () => {
          fetchLists();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createList = async (
    listName: string,
    selectedItems: any[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Generate unique share token
      const shareToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);

      // Create the list
      const { data: listData, error: listError } = await supabase
        .from("client_lists")
        .insert({
          user_id: user.id,
          list_name: listName,
          share_token: shareToken,
        })
        .select()
        .single();

      if (listError) throw listError;

      // Add items to the list
      const listItems = selectedItems.map((item) => ({
        list_id: listData.id,
        inventory_item_id: item.id,
        item_name: item.name,
        set_name: item.set_name,
        card_image_url: item.card_image_url,
        grading_company: item.grading_company,
        grade: item.grade,
        market_price: item.market_price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("client_list_items")
        .insert(listItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Client list created successfully",
      });

      return listData;
    } catch (error) {
      console.error("Error creating list:", error);
      toast({
        title: "Error",
        description: "Failed to create client list",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from("client_lists")
        .delete()
        .eq("id", listId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client list deleted",
      });
    } catch (error) {
      console.error("Error deleting list:", error);
      toast({
        title: "Error",
        description: "Failed to delete client list",
        variant: "destructive",
      });
    }
  };

  return { lists, loading, createList, deleteList, fetchLists };
};
