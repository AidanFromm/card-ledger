import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ListVisibility = "private" | "unlisted" | "public";

export type PricingMode = "market" | "custom" | "markup";

// Extended interface with parsed notes for additional fields
export interface ClientList {
  id: string;
  user_id: string;
  list_name: string;
  description: string | null;
  share_token: string;
  visibility: ListVisibility;
  notes: string | null;
  pricing_mode: PricingMode;
  markup_percent: number;
  allow_offers: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  view_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to parse notes field for extended properties
const parseNotesMetadata = (notes: string | null): Record<string, any> => {
  if (!notes) return {};
  try {
    // Check if notes starts with JSON metadata
    if (notes.startsWith("{")) {
      const endIndex = notes.indexOf("}");
      if (endIndex !== -1) {
        return JSON.parse(notes.substring(0, endIndex + 1));
      }
    }
  } catch {
    // Not JSON, just regular notes
  }
  return {};
};

// Helper to serialize notes with metadata
const serializeNotesMetadata = (metadata: Record<string, any>, description?: string): string => {
  const metaStr = JSON.stringify(metadata);
  return description ? `${metaStr}\n${description}` : metaStr;
};

// Helper to extract description from notes
const extractDescription = (notes: string | null): string | null => {
  if (!notes) return null;
  if (notes.startsWith("{")) {
    const endIndex = notes.indexOf("}");
    if (endIndex !== -1 && notes.length > endIndex + 1) {
      return notes.substring(endIndex + 1).trim() || null;
    }
    return null;
  }
  return notes;
};

// Transform database row to ClientList
const transformDbRow = (row: any): ClientList => {
  const metadata = parseNotesMetadata(row.notes);
  return {
    id: row.id,
    user_id: row.user_id,
    list_name: row.list_name,
    description: extractDescription(row.notes),
    share_token: row.share_token,
    visibility: metadata.visibility || "unlisted",
    notes: row.notes,
    pricing_mode: metadata.pricingMode || "market",
    markup_percent: metadata.markupPercent || 0,
    allow_offers: metadata.allowOffers !== false,
    contact_email: metadata.contactEmail || null,
    contact_phone: metadata.contactPhone || null,
    view_count: metadata.viewCount || 0,
    expires_at: metadata.expiresAt || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

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
  custom_price: number | null;
  quantity: number;
  sort_order: number;
  view_count: number;
  created_at: string;
}

// Transform database item row
const transformItemRow = (row: any, index: number): ClientListItem => ({
  id: row.id,
  list_id: row.list_id,
  inventory_item_id: row.inventory_item_id,
  item_name: row.item_name,
  set_name: row.set_name,
  card_image_url: row.card_image_url,
  grading_company: row.grading_company,
  grade: row.grade,
  market_price: row.market_price || 0,
  custom_price: null, // Not in DB schema
  quantity: row.quantity || 1,
  sort_order: index, // Use array index as sort order
  view_count: 0, // Not in DB schema
  created_at: row.created_at,
});

export interface ClientListInquiry {
  id: string;
  list_id: string;
  item_id: string | null;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone: string | null;
  message: string;
  offer_amount: number | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

export interface ListAnalytics {
  totalViews: number;
  totalInquiries: number;
  topViewedItems: { item: ClientListItem; views: number }[];
  recentInquiries: ClientListInquiry[];
}

interface CreateListParams {
  listName: string;
  description?: string;
  visibility?: ListVisibility;
  pricingMode?: PricingMode;
  markupPercent?: number;
  allowOffers?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  expiresAt?: Date | null;
  items: Array<{
    id?: string;
    name: string;
    set_name: string;
    card_image_url?: string | null;
    grading_company: string;
    grade?: string | null;
    market_price: number;
    custom_price?: number | null;
    quantity: number;
  }>;
}

interface UpdateListParams {
  listId: string;
  listName?: string;
  description?: string;
  visibility?: ListVisibility;
  pricingMode?: PricingMode;
  markupPercent?: number;
  allowOffers?: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
  expiresAt?: Date | null;
}

export const useClientLists = () => {
  const [lists, setLists] = useState<ClientList[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLists = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("client_lists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLists((data || []).map(transformDbRow));
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
  }, [toast]);

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
  }, [fetchLists]);

  const createList = async (params: CreateListParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Generate unique share token
      const shareToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);

      // Store extended properties in notes field as JSON metadata
      const metadata = {
        visibility: params.visibility || "unlisted",
        pricingMode: params.pricingMode || "market",
        markupPercent: params.markupPercent || 0,
        allowOffers: params.allowOffers !== false,
        contactEmail: params.contactEmail || null,
        contactPhone: params.contactPhone || null,
        expiresAt: params.expiresAt?.toISOString() || null,
        viewCount: 0,
      };
      
      const notes = serializeNotesMetadata(metadata, params.description);

      // Create the list
      const { data: listData, error: listError } = await supabase
        .from("client_lists")
        .insert({
          user_id: user.id,
          list_name: params.listName,
          share_token: shareToken,
          notes: notes,
        })
        .select()
        .single();

      if (listError) throw listError;

      // Add items to the list
      if (params.items.length > 0) {
        const listItems = params.items.map((item, index) => ({
          list_id: listData.id,
          inventory_item_id: item.id || null,
          item_name: item.name,
          set_name: item.set_name,
          card_image_url: item.card_image_url || null,
          grading_company: item.grading_company,
          grade: item.grade || null,
          market_price: item.market_price,
          custom_price: item.custom_price || null,
          quantity: item.quantity,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from("client_list_items")
          .insert(listItems);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Success",
        description: "Client list created successfully",
      });

      return transformDbRow(listData);
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

  const updateList = async (params: UpdateListParams) => {
    try {
      // First fetch current list to get existing metadata
      const { data: currentList, error: fetchError } = await supabase
        .from("client_lists")
        .select("*")
        .eq("id", params.listId)
        .single();

      if (fetchError) throw fetchError;

      const currentMetadata = parseNotesMetadata(currentList.notes);
      const currentDescription = extractDescription(currentList.notes);

      // Merge metadata updates
      const newMetadata = {
        ...currentMetadata,
        ...(params.visibility !== undefined && { visibility: params.visibility }),
        ...(params.pricingMode !== undefined && { pricingMode: params.pricingMode }),
        ...(params.markupPercent !== undefined && { markupPercent: params.markupPercent }),
        ...(params.allowOffers !== undefined && { allowOffers: params.allowOffers }),
        ...(params.contactEmail !== undefined && { contactEmail: params.contactEmail }),
        ...(params.contactPhone !== undefined && { contactPhone: params.contactPhone }),
        ...(params.expiresAt !== undefined && { expiresAt: params.expiresAt?.toISOString() || null }),
      };

      const newDescription = params.description !== undefined ? params.description : currentDescription;
      const notes = serializeNotesMetadata(newMetadata, newDescription || undefined);

      const updateData: Record<string, any> = { notes };
      if (params.listName !== undefined) updateData.list_name = params.listName;

      const { error } = await supabase
        .from("client_lists")
        .update(updateData)
        .eq("id", params.listId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "List updated successfully",
      });

      return true;
    } catch (error) {
      console.error("Error updating list:", error);
      toast({
        title: "Error",
        description: "Failed to update list",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteList = async (listId: string) => {
    try {
      // Delete items first (cascade should handle this, but being explicit)
      await supabase
        .from("client_list_items")
        .delete()
        .eq("list_id", listId);

      const { error } = await supabase
        .from("client_lists")
        .delete()
        .eq("id", listId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client list deleted",
      });

      return true;
    } catch (error) {
      console.error("Error deleting list:", error);
      toast({
        title: "Error",
        description: "Failed to delete client list",
        variant: "destructive",
      });
      return false;
    }
  };

  const duplicateList = async (listId: string, newName?: string) => {
    try {
      // Fetch the original list
      const { data: originalListData, error: listError } = await supabase
        .from("client_lists")
        .select("*")
        .eq("id", listId)
        .single();

      if (listError) throw listError;

      const originalList = transformDbRow(originalListData);

      // Fetch original items
      const { data: originalItems, error: itemsError } = await supabase
        .from("client_list_items")
        .select("*")
        .eq("list_id", listId);

      if (itemsError) throw itemsError;

      // Create duplicate
      const duplicatedList = await createList({
        listName: newName || `${originalList.list_name} (Copy)`,
        description: originalList.description || undefined,
        visibility: originalList.visibility,
        pricingMode: originalList.pricing_mode,
        markupPercent: originalList.markup_percent,
        allowOffers: originalList.allow_offers,
        contactEmail: originalList.contact_email || undefined,
        contactPhone: originalList.contact_phone || undefined,
        items: (originalItems || []).map(item => ({
          name: item.item_name,
          set_name: item.set_name,
          card_image_url: item.card_image_url,
          grading_company: item.grading_company,
          grade: item.grade,
          market_price: item.market_price || 0,
          quantity: item.quantity,
        })),
      });

      return duplicatedList;
    } catch (error) {
      console.error("Error duplicating list:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate list",
        variant: "destructive",
      });
      return null;
    }
  };

  const regenerateShareToken = async (listId: string) => {
    try {
      const newToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);

      const { error } = await supabase
        .from("client_lists")
        .update({ share_token: newToken })
        .eq("id", listId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Share link regenerated",
      });

      return newToken;
    } catch (error) {
      console.error("Error regenerating token:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate share link",
        variant: "destructive",
      });
      return null;
    }
  };

  return { 
    lists, 
    loading, 
    createList, 
    updateList,
    deleteList, 
    duplicateList,
    regenerateShareToken,
    fetchLists 
  };
};

// Hook for managing items within a list
export const useClientListItems = (listId: string | null) => {
  const [items, setItems] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!listId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("client_list_items")
        .select("*")
        .eq("list_id", listId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setItems((data || []).map(transformItemRow));
    } catch (error) {
      console.error("Error fetching list items:", error);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItems = async (newItems: Array<{
    name: string;
    set_name: string;
    card_image_url?: string | null;
    grading_company: string;
    grade?: string | null;
    market_price: number;
    custom_price?: number | null;
    quantity: number;
    inventory_item_id?: string | null;
  }>) => {
    if (!listId) return false;

    try {
      const maxSortOrder = items.length > 0 
        ? Math.max(...items.map(i => i.sort_order)) 
        : -1;

      const itemsToInsert = newItems.map((item, index) => ({
        list_id: listId,
        inventory_item_id: item.inventory_item_id || null,
        item_name: item.name,
        set_name: item.set_name,
        card_image_url: item.card_image_url || null,
        grading_company: item.grading_company,
        grade: item.grade || null,
        market_price: item.market_price,
        custom_price: item.custom_price || null,
        quantity: item.quantity,
        sort_order: maxSortOrder + 1 + index,
      }));

      const { error } = await supabase
        .from("client_list_items")
        .insert(itemsToInsert);

      if (error) throw error;

      await fetchItems();
      toast({
        title: "Success",
        description: `Added ${newItems.length} item(s) to list`,
      });
      return true;
    } catch (error) {
      console.error("Error adding items:", error);
      toast({
        title: "Error",
        description: "Failed to add items",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("client_list_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(prev => prev.filter(i => i.id !== itemId));
      toast({
        title: "Success",
        description: "Item removed from list",
      });
      return true;
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateItem = async (itemId: string, updates: Partial<{
    quantity: number;
    custom_price: number | null;
    sort_order: number;
  }>) => {
    try {
      const { error } = await supabase
        .from("client_list_items")
        .update(updates)
        .eq("id", itemId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));
      return true;
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
      return false;
    }
  };

  const reorderItems = async (newOrder: string[]) => {
    try {
      const updates = newOrder.map((id, index) => ({
        id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("client_list_items")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }

      setItems(prev => {
        const itemMap = new Map(prev.map(i => [i.id, i]));
        return newOrder.map((id, index) => ({
          ...itemMap.get(id)!,
          sort_order: index,
        }));
      });

      return true;
    } catch (error) {
      console.error("Error reordering items:", error);
      return false;
    }
  };

  return {
    items,
    loading,
    addItems,
    removeItem,
    updateItem,
    reorderItems,
    refetch: fetchItems,
  };
};

// Hook for public view (no auth required)
export const usePublicClientList = (shareToken: string | null) => {
  const [list, setList] = useState<ClientList | null>(null);
  const [items, setItems] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicList = async () => {
      if (!shareToken) {
        setLoading(false);
        return;
      }

      try {
        // Fetch list
        const { data: listData, error: listError } = await supabase
          .from("client_lists")
          .select("*")
          .eq("share_token", shareToken)
          .single();

        if (listError) throw listError;

        const transformedList = transformDbRow(listData);

        // Check if expired
        if (transformedList.expires_at && new Date(transformedList.expires_at) < new Date()) {
          setError("This link has expired");
          setLoading(false);
          return;
        }

        // Check visibility
        if (transformedList.visibility === "private") {
          setError("This list is private");
          setLoading(false);
          return;
        }

        setList(transformedList);

        // Increment view count in metadata
        const currentMetadata = parseNotesMetadata(listData.notes);
        const updatedMetadata = { ...currentMetadata, viewCount: (currentMetadata.viewCount || 0) + 1 };
        const newNotes = serializeNotesMetadata(updatedMetadata, extractDescription(listData.notes) || undefined);
        
        await supabase
          .from("client_lists")
          .update({ notes: newNotes })
          .eq("id", listData.id);

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from("client_list_items")
          .select("*")
          .eq("list_id", listData.id)
          .order("created_at", { ascending: true });

        if (itemsError) throw itemsError;
        setItems((itemsData || []).map(transformItemRow));
      } catch (err) {
        console.error("Error fetching public list:", err);
        setError("List not found");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicList();
  }, [shareToken]);

  const submitInquiry = async (data: {
    itemId?: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    offerAmount?: number;
  }) => {
    if (!list) return false;

    // Since we don't have an inquiries table, we'll store inquiry in list metadata
    // In production, this would send an email or store in a separate table
    try {
      
      // Simulate successful submission
      // In production: send email to list.contact_email or store in DB
      return true;
    } catch (err) {
      console.error("Error submitting inquiry:", err);
      return false;
    }
  };

  const incrementItemView = async (itemId: string) => {
    try {
      await supabase.rpc('increment_list_item_view_count', { p_item_id: itemId });
    } catch (err) {
      console.warn("Could not increment item view count:", err);
    }
  };

  return {
    list,
    items,
    loading,
    error,
    submitInquiry,
    incrementItemView,
  };
};

// Hook for list analytics
export const useClientListAnalytics = (listId: string | null) => {
  const [analytics, setAnalytics] = useState<ListAnalytics | null>(null);
  const [inquiries, setInquiries] = useState<ClientListInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    if (!listId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch list with view count from metadata
      const { data: listData, error: listError } = await supabase
        .from("client_lists")
        .select("*")
        .eq("id", listId)
        .single();

      if (listError) throw listError;

      const transformedList = transformDbRow(listData);

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("client_list_items")
        .select("*")
        .eq("list_id", listId)
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;

      // Since we don't have an inquiries table, return empty array
      setInquiries([]);

      setAnalytics({
        totalViews: transformedList.view_count || 0,
        totalInquiries: 0,
        topViewedItems: [], // Would need item-level view tracking
        recentInquiries: [],
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const updateInquiryStatus = async (inquiryId: string, status: "new" | "contacted" | "closed") => {
    // No-op since we don't have inquiries table
    toast({
      title: "Info",
      description: "Inquiry tracking coming soon",
    });
    return false;
  };

  return {
    analytics,
    inquiries,
    loading,
    updateInquiryStatus,
    refetch: fetchAnalytics,
  };
};
