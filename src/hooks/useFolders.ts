import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Folder = Database["public"]["Tables"]["folders"]["Row"];
type FolderItem = Database["public"]["Tables"]["folder_items"]["Row"];

export interface FolderWithItems extends Folder {
  item_count?: number;
}

export const useFolders = () => {
  const [folders, setFolders] = useState<FolderWithItems[]>([]);
  const [folderItems, setFolderItems] = useState<Record<string, string[]>>({}); // folder_id -> inventory_item_ids
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFolders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, ensure default folders exist
      await supabase.rpc('create_default_folders_for_user', { p_user_id: user.id });

      // Fetch folders with item counts
      const { data: foldersData, error: foldersError } = await supabase
        .from("folders")
        .select("*")
        .order("position", { ascending: true });

      if (foldersError) throw foldersError;

      // Fetch folder items
      const { data: itemsData, error: itemsError } = await supabase
        .from("folder_items")
        .select("folder_id, inventory_item_id");

      if (itemsError) throw itemsError;

      // Build folder items map
      const itemsMap: Record<string, string[]> = {};
      (itemsData || []).forEach((item) => {
        if (!itemsMap[item.folder_id]) {
          itemsMap[item.folder_id] = [];
        }
        itemsMap[item.folder_id].push(item.inventory_item_id);
      });
      setFolderItems(itemsMap);

      // Add item counts to folders
      const foldersWithCounts = (foldersData || []).map((folder) => ({
        ...folder,
        item_count: itemsMap[folder.id]?.length || 0,
      }));

      setFolders(foldersWithCounts);
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();

    // Set up realtime subscription
    const foldersChannel = supabase
      .channel("folders_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "folders" },
        () => fetchFolders()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "folder_items" },
        () => fetchFolders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(foldersChannel);
    };
  }, [fetchFolders]);

  const createFolder = async (name: string, color: string = "#6366f1", icon: string = "folder") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const maxPosition = Math.max(...folders.map(f => f.position), -1);

      const { data, error } = await supabase
        .from("folders")
        .insert({
          user_id: user.id,
          name,
          color,
          icon,
          position: maxPosition + 1,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Folder created",
        description: `"${name}" folder has been created`,
      });

      return data;
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateFolder = async (folderId: string, updates: Partial<Folder>) => {
    try {
      const { error } = await supabase
        .from("folders")
        .update(updates)
        .eq("id", folderId);

      if (error) throw error;

      toast({
        title: "Folder updated",
        description: "Folder has been updated",
      });
    } catch (error) {
      console.error("Error updating folder:", error);
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive",
      });
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const folder = folders.find(f => f.id === folderId);
      if (folder?.is_default) {
        toast({
          title: "Cannot delete",
          description: "Default folders cannot be deleted",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;

      toast({
        title: "Folder deleted",
        description: "Folder has been deleted",
      });
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  const addItemToFolder = async (folderId: string, inventoryItemId: string) => {
    try {
      const { error } = await supabase
        .from("folder_items")
        .insert({
          folder_id: folderId,
          inventory_item_id: inventoryItemId,
        });

      if (error) {
        if (error.code === '23505') {
          // Item already in folder, ignore
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Error adding item to folder:", error);
      toast({
        title: "Error",
        description: "Failed to add item to folder",
        variant: "destructive",
      });
    }
  };

  const addItemsToFolder = async (folderId: string, inventoryItemIds: string[]) => {
    try {
      const items = inventoryItemIds.map(id => ({
        folder_id: folderId,
        inventory_item_id: id,
      }));

      const { error } = await supabase
        .from("folder_items")
        .upsert(items, { onConflict: 'folder_id,inventory_item_id' });

      if (error) throw error;

      const folder = folders.find(f => f.id === folderId);
      toast({
        title: "Items added",
        description: `${inventoryItemIds.length} items added to "${folder?.name}"`,
      });
    } catch (error) {
      console.error("Error adding items to folder:", error);
      toast({
        title: "Error",
        description: "Failed to add items to folder",
        variant: "destructive",
      });
    }
  };

  const removeItemFromFolder = async (folderId: string, inventoryItemId: string) => {
    try {
      const { error } = await supabase
        .from("folder_items")
        .delete()
        .eq("folder_id", folderId)
        .eq("inventory_item_id", inventoryItemId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing item from folder:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from folder",
        variant: "destructive",
      });
    }
  };

  const removeItemsFromFolder = async (folderId: string, inventoryItemIds: string[]) => {
    try {
      const { error } = await supabase
        .from("folder_items")
        .delete()
        .eq("folder_id", folderId)
        .in("inventory_item_id", inventoryItemIds);

      if (error) throw error;

      const folder = folders.find(f => f.id === folderId);
      toast({
        title: "Items removed",
        description: `${inventoryItemIds.length} items removed from "${folder?.name}"`,
      });
    } catch (error) {
      console.error("Error removing items from folder:", error);
      toast({
        title: "Error",
        description: "Failed to remove items from folder",
        variant: "destructive",
      });
    }
  };

  const getItemFolders = (inventoryItemId: string): string[] => {
    const itemFolderIds: string[] = [];
    Object.entries(folderItems).forEach(([folderId, itemIds]) => {
      if (itemIds.includes(inventoryItemId)) {
        itemFolderIds.push(folderId);
      }
    });
    return itemFolderIds;
  };

  const getFolderItemIds = (folderId: string): string[] => {
    return folderItems[folderId] || [];
  };

  return {
    folders,
    folderItems,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    addItemToFolder,
    addItemsToFolder,
    removeItemFromFolder,
    removeItemsFromFolder,
    getItemFolders,
    getFolderItemIds,
    refetch: fetchFolders,
  };
};
