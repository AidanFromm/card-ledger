import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type SharedCollection = Database["public"]["Tables"]["shared_collections"]["Row"];
type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

export interface SharedCollectionWithDetails extends SharedCollection {
  folder_name?: string;
  item_count?: number;
}

export type ShareType = "collection" | "folder" | "selection";
export type ExpirationType = "24h" | "7d" | "30d" | "never";

export interface CreateShareOptions {
  title: string;
  description?: string;
  shareType: ShareType;
  folderId?: string;
  selectedItemIds?: string[];
  showValues: boolean;
  showPurchasePrices: boolean;
  expiration: ExpirationType;
}

// Generate a unique share token
const generateShareToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Calculate expiration date based on type
const getExpirationDate = (expiration: ExpirationType): Date | null => {
  if (expiration === "never") return null;
  
  const now = new Date();
  switch (expiration) {
    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

export const useSharing = () => {
  const [shares, setShares] = useState<SharedCollectionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchShares = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch shared collections with folder names
      const { data: sharesData, error: sharesError } = await supabase
        .from("shared_collections")
        .select(`
          *,
          folders (name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sharesError) throw sharesError;

      // Fetch item counts for selection-type shares
      const selectionShares = (sharesData || []).filter(s => s.share_type === 'selection');
      let itemCounts: Record<string, number> = {};

      if (selectionShares.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("shared_collection_items")
          .select("shared_collection_id");

        if (!itemsError && itemsData) {
          itemsData.forEach(item => {
            itemCounts[item.shared_collection_id] = (itemCounts[item.shared_collection_id] || 0) + 1;
          });
        }
      }

      const sharesWithDetails = (sharesData || []).map((share: any) => ({
        ...share,
        folder_name: share.folders?.name,
        item_count: share.share_type === 'selection' ? itemCounts[share.id] || 0 : undefined,
      }));

      setShares(sharesWithDetails);
    } catch (error) {
      console.error("Error fetching shares:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShares();

    // Set up realtime subscription
    const channel = supabase
      .channel("shared_collections_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_collections" },
        () => fetchShares()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchShares]);

  const createShare = async (options: CreateShareOptions): Promise<SharedCollection | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const shareToken = generateShareToken();
      const expiresAt = getExpirationDate(options.expiration);

      // Create the shared collection
      const { data: shareData, error: shareError } = await supabase
        .from("shared_collections")
        .insert({
          user_id: user.id,
          share_token: shareToken,
          title: options.title,
          description: options.description || null,
          share_type: options.shareType,
          folder_id: options.shareType === 'folder' ? options.folderId : null,
          show_values: options.showValues,
          show_purchase_prices: options.showPurchasePrices,
          expires_at: expiresAt?.toISOString() || null,
        })
        .select()
        .single();

      if (shareError) throw shareError;

      // If selection type, add the selected items
      if (options.shareType === 'selection' && options.selectedItemIds?.length) {
        const items = options.selectedItemIds.map(itemId => ({
          shared_collection_id: shareData.id,
          inventory_item_id: itemId,
        }));

        const { error: itemsError } = await supabase
          .from("shared_collection_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Share link created",
        description: "Your collection share link is ready to copy",
      });

      return shareData;
    } catch (error) {
      console.error("Error creating share:", error);
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateShare = async (shareId: string, updates: Partial<SharedCollection>) => {
    try {
      const { error } = await supabase
        .from("shared_collections")
        .update(updates)
        .eq("id", shareId);

      if (error) throw error;

      toast({
        title: "Share updated",
        description: "Share settings have been updated",
      });
    } catch (error) {
      console.error("Error updating share:", error);
      toast({
        title: "Error",
        description: "Failed to update share",
        variant: "destructive",
      });
    }
  };

  const deleteShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from("shared_collections")
        .delete()
        .eq("id", shareId);

      if (error) throw error;

      toast({
        title: "Share deleted",
        description: "Share link has been deleted",
      });
    } catch (error) {
      console.error("Error deleting share:", error);
      toast({
        title: "Error",
        description: "Failed to delete share",
        variant: "destructive",
      });
    }
  };

  const toggleShareActive = async (shareId: string, isActive: boolean) => {
    await updateShare(shareId, { is_active: isActive });
  };

  const getShareUrl = (shareToken: string): string => {
    return `${window.location.origin}/share/${shareToken}`;
  };

  return {
    shares,
    loading,
    createShare,
    updateShare,
    deleteShare,
    toggleShareActive,
    getShareUrl,
    refetch: fetchShares,
  };
};

// Hook for public view of shared collection
export const usePublicShare = (shareToken: string) => {
  const [share, setShare] = useState<SharedCollection | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicShare = async () => {
      try {
        // Fetch the shared collection
        const { data: shareData, error: shareError } = await supabase
          .from("shared_collections")
          .select("*")
          .eq("share_token", shareToken)
          .eq("is_active", true)
          .single();

        if (shareError) {
          if (shareError.code === 'PGRST116') {
            setError("Share link not found or has expired");
          } else {
            throw shareError;
          }
          return;
        }

        // Check if expired
        if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
          setError("This share link has expired");
          return;
        }

        setShare(shareData);

        // Increment view count
        await supabase.rpc('increment_share_view_count', { token: shareToken });

        // Fetch items based on share type
        let itemsData: InventoryItem[] = [];

        if (shareData.share_type === 'collection') {
          // Get all items for the user
          const { data, error } = await supabase
            .from("inventory_items")
            .select("*")
            .eq("user_id", shareData.user_id)
            .gt("quantity", 0)
            .order("created_at", { ascending: false });

          if (error) throw error;
          itemsData = data || [];
        } else if (shareData.share_type === 'folder' && shareData.folder_id) {
          // Get items in the folder
          const { data: folderItems, error: fiError } = await supabase
            .from("folder_items")
            .select("inventory_item_id")
            .eq("folder_id", shareData.folder_id);

          if (fiError) throw fiError;

          if (folderItems && folderItems.length > 0) {
            const itemIds = folderItems.map(fi => fi.inventory_item_id);
            const { data, error } = await supabase
              .from("inventory_items")
              .select("*")
              .in("id", itemIds)
              .gt("quantity", 0)
              .order("created_at", { ascending: false });

            if (error) throw error;
            itemsData = data || [];
          }
        } else if (shareData.share_type === 'selection') {
          // Get selected items
          const { data: selectionItems, error: siError } = await supabase
            .from("shared_collection_items")
            .select("inventory_item_id")
            .eq("shared_collection_id", shareData.id);

          if (siError) throw siError;

          if (selectionItems && selectionItems.length > 0) {
            const itemIds = selectionItems.map(si => si.inventory_item_id);
            const { data, error } = await supabase
              .from("inventory_items")
              .select("*")
              .in("id", itemIds)
              .gt("quantity", 0)
              .order("created_at", { ascending: false });

            if (error) throw error;
            itemsData = data || [];
          }
        }

        setItems(itemsData);
      } catch (err) {
        console.error("Error fetching public share:", err);
        setError("Failed to load shared collection");
      } finally {
        setLoading(false);
      }
    };

    if (shareToken) {
      fetchPublicShare();
    }
  }, [shareToken]);

  return { share, items, loading, error };
};
