import { useState } from "react";
import {
  Folder,
  FolderPlus,
  Check,
  Box,
  Tag,
  Heart,
  Award,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useFolders } from "@/hooks/useFolders";
import { cn } from "@/lib/utils";

// Available folder icons
const FOLDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  box: Box,
  tag: Tag,
  heart: Heart,
  award: Award,
};

interface FolderDropdownProps {
  inventoryItemId: string;
  children?: React.ReactNode;
  onFolderChange?: () => void;
  className?: string;
}

export const FolderDropdown = ({
  inventoryItemId,
  children,
  onFolderChange,
  className,
}: FolderDropdownProps) => {
  const {
    folders,
    addItemToFolder,
    removeItemFromFolder,
    getItemFolders,
  } = useFolders();

  const [isOpen, setIsOpen] = useState(false);
  
  const itemFolderIds = getItemFolders(inventoryItemId);

  const handleToggleFolder = async (folderId: string) => {
    const isInFolder = itemFolderIds.includes(folderId);
    
    if (isInFolder) {
      await removeItemFromFolder(folderId, inventoryItemId);
    } else {
      await addItemToFolder(folderId, inventoryItemId);
    }
    
    onFolderChange?.();
  };

  const getFolderIcon = (iconName: string) => {
    return FOLDER_ICONS[iconName] || Folder;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Folder className="h-4 w-4" />
            {itemFolderIds.length > 0 ? `${itemFolderIds.length} Folders` : "Add to Folder"}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Add to folders
        </div>
        <DropdownMenuSeparator />
        {folders.map((folder) => {
          const Icon = getFolderIcon(folder.icon);
          const isInFolder = itemFolderIds.includes(folder.id);
          
          return (
            <DropdownMenuItem
              key={folder.id}
              onClick={(e) => {
                e.preventDefault();
                handleToggleFolder(folder.id);
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: folder.color + "20" }}
              >
                <Icon
                  className="h-3.5 w-3.5"
                  style={{ color: folder.color }}
                />
              </div>
              <span className="flex-1">{folder.name}</span>
              {isInFolder && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Bulk folder assignment for multiple items
interface BulkFolderDropdownProps {
  inventoryItemIds: string[];
  children?: React.ReactNode;
  onFolderChange?: () => void;
  className?: string;
}

export const BulkFolderDropdown = ({
  inventoryItemIds,
  children,
  onFolderChange,
  className,
}: BulkFolderDropdownProps) => {
  const { folders, addItemsToFolder, removeItemsFromFolder } = useFolders();
  const [isOpen, setIsOpen] = useState(false);

  const handleAddToFolder = async (folderId: string) => {
    await addItemsToFolder(folderId, inventoryItemIds);
    onFolderChange?.();
    setIsOpen(false);
  };

  const getFolderIcon = (iconName: string) => {
    return FOLDER_ICONS[iconName] || Folder;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <FolderPlus className="h-4 w-4" />
            Add to Folder
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Add {inventoryItemIds.length} items to folder
        </div>
        <DropdownMenuSeparator />
        {folders.map((folder) => {
          const Icon = getFolderIcon(folder.icon);
          
          return (
            <DropdownMenuItem
              key={folder.id}
              onClick={() => handleAddToFolder(folder.id)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: folder.color + "20" }}
              >
                <Icon
                  className="h-3.5 w-3.5"
                  style={{ color: folder.color }}
                />
              </div>
              <span className="flex-1">{folder.name}</span>
              <span className="text-xs text-muted-foreground">
                {folder.item_count || 0}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FolderDropdown;
