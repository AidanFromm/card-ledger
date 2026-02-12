import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderPlus,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share2,
  Box,
  Tag,
  Heart,
  Award,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFolders, type FolderWithItems } from "@/hooks/useFolders";
import { cn } from "@/lib/utils";

// Available folder icons
const FOLDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  box: Box,
  tag: Tag,
  heart: Heart,
  award: Award,
};

// Available folder colors
const FOLDER_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
];

interface FoldersPanelProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onShareFolder?: (folderId: string) => void;
  className?: string;
}

export const FoldersPanel = ({
  selectedFolderId,
  onSelectFolder,
  onShareFolder,
  className,
}: FoldersPanelProps) => {
  const { folders, loading, createFolder, updateFolder, deleteFolder } = useFolders();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderWithItems | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [newFolderIcon, setNewFolderIcon] = useState("folder");

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    await createFolder(newFolderName.trim(), newFolderColor, newFolderIcon);
    setNewFolderName("");
    setNewFolderColor(FOLDER_COLORS[0]);
    setNewFolderIcon("folder");
    setIsCreateDialogOpen(false);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;
    
    await updateFolder(editingFolder.id, {
      name: newFolderName.trim(),
      color: newFolderColor,
      icon: newFolderIcon,
    });
    setEditingFolder(null);
  };

  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId);
    if (selectedFolderId === folderId) {
      onSelectFolder(null);
    }
  };

  const openEditDialog = (folder: FolderWithItems) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color);
    setNewFolderIcon(folder.icon);
  };

  const getFolderIcon = (iconName: string) => {
    const Icon = FOLDER_ICONS[iconName] || Folder;
    return Icon;
  };

  if (loading) {
    return (
      <div className={cn("space-y-2 p-2", className)}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-secondary/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {/* All Cards Option */}
      <button
        onClick={() => onSelectFolder(null)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
          selectedFolderId === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-secondary/60 text-foreground"
        )}
      >
        <Box className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 font-medium truncate">All Cards</span>
      </button>

      {/* Folder List */}
      <AnimatePresence>
        {folders.map((folder) => {
          const Icon = getFolderIcon(folder.icon);
          return (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="group relative"
            >
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                  selectedFolderId === folder.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary/60 text-foreground"
                )}
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
                <span className="flex-1 font-medium truncate">{folder.name}</span>
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    selectedFolderId === folder.id
                      ? "bg-primary-foreground/20"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {folder.item_count || 0}
                </span>
              </button>

              {/* Context Menu */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {onShareFolder && (
                      <DropdownMenuItem onClick={() => onShareFolder(folder.id)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Folder
                      </DropdownMenuItem>
                    )}
                    {!folder.is_default && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteFolder(folder.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Create Folder Button */}
      <button
        onClick={() => setIsCreateDialogOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
      >
        <FolderPlus className="h-5 w-5" />
        <span className="font-medium">New Folder</span>
      </button>

      {/* Create/Edit Folder Dialog */}
      <Dialog
        open={isCreateDialogOpen || editingFolder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingFolder(null);
            setNewFolderName("");
            setNewFolderColor(FOLDER_COLORS[0]);
            setNewFolderIcon("folder");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? "Edit Folder" : "Create New Folder"}
            </DialogTitle>
            <DialogDescription>
              {editingFolder
                ? "Update the folder name, color, and icon."
                : "Create a new folder to organize your cards."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Folder Name */}
            <div className="space-y-2">
              <Label htmlFor="folder-name">Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                autoFocus
              />
            </div>

            {/* Folder Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewFolderColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      newFolderColor === color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {newFolderColor === color && (
                      <Check className="h-4 w-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Folder Icon */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(FOLDER_ICONS).map(([iconName, Icon]) => (
                  <button
                    key={iconName}
                    onClick={() => setNewFolderIcon(iconName)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                      newFolderIcon === iconName
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center"
                  style={{ backgroundColor: newFolderColor + "20" }}
                >
                  {(() => {
                    const PreviewIcon = FOLDER_ICONS[newFolderIcon] || Folder;
                    return (
                      <PreviewIcon
                        className="h-5 w-5"
                        style={{ color: newFolderColor }}
                      />
                    );
                  })()}
                </div>
                <span className="font-medium">
                  {newFolderName || "Folder name"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingFolder(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              {editingFolder ? "Save Changes" : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoldersPanel;
