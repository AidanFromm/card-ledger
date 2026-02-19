import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Plus, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFolders } from "@/hooks/useFolders";

interface FolderSelectorProps {
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
}

export const FolderSelector = ({
  selectedFolderId,
  onSelect,
}: FolderSelectorProps) => {
  const { folders, createFolder, loading } = useFolders();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsCreating(true);
    try {
      const newFolder = await createFolder(newFolderName.trim());
      if (newFolder) {
        onSelect(newFolder.id);
        setNewFolderName("");
        setShowNewFolder(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Add to Folder
      </label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-secondary/30"
          >
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span>
                {selectedFolder?.name || "No folder (All Cards)"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[300px] p-2" align="start">
          {/* No Folder Option */}
          <button
            onClick={() => {
              onSelect(null);
              setIsOpen(false);
            }}
            className={`
              w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left
              ${!selectedFolderId ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'}
            `}
          >
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Folder className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">No Folder</p>
              <p className="text-xs text-muted-foreground">Add to All Cards only</p>
            </div>
            {!selectedFolderId && <Check className="h-4 w-4" />}
          </button>

          <div className="my-2 border-t border-border/50" />

          {/* Existing Folders */}
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading folders...
              </div>
            ) : folders.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No folders yet
              </div>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    onSelect(folder.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left
                    ${selectedFolderId === folder.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'}
                  `}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${folder.color}20` }}
                  >
                    <Folder className="h-4 w-4" style={{ color: folder.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {folder.item_count || 0} cards
                    </p>
                  </div>
                  {selectedFolderId === folder.id && <Check className="h-4 w-4" />}
                </button>
              ))
            )}
          </div>

          <div className="my-2 border-t border-border/50" />

          {/* Create New Folder */}
          <AnimatePresence>
            {showNewFolder ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Input
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setShowNewFolder(false);
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowNewFolder(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setShowNewFolder(true)}
              >
                <Plus className="h-4 w-4" />
                Create New Folder
              </Button>
            )}
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FolderSelector;
