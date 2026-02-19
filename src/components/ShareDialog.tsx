import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2,
  Copy,
  Check,
  Link,
  QrCode,
  Eye,
  EyeOff,
  Clock,
  Folder,
  Box,
  CheckSquare,
  ExternalLink,
} from "lucide-react";
import { useSharing, type ShareType, type ExpirationType } from "@/hooks/useSharing";
import { useFolders } from "@/hooks/useFolders";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems?: InventoryItem[];
  preselectedFolderId?: string;
}

export const ShareDialog = ({
  open,
  onOpenChange,
  selectedItems = [],
  preselectedFolderId,
}: ShareDialogProps) => {
  const { toast } = useToast();
  const { createShare, getShareUrl } = useSharing();
  const { folders } = useFolders();

  const [title, setTitle] = useState("My Collection");
  const [description, setDescription] = useState("");
  const [shareType, setShareType] = useState<ShareType>(
    selectedItems.length > 0 ? "selection" : preselectedFolderId ? "folder" : "collection"
  );
  const [folderId, setFolderId] = useState(preselectedFolderId || "");
  const [showValues, setShowValues] = useState(true);
  const [showPurchasePrices, setShowPurchasePrices] = useState(false);
  const [expiration, setExpiration] = useState<ExpirationType>("never");
  const [isCreating, setIsCreating] = useState(false);
  const [createdShareToken, setCreatedShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "qr">("link");

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCreatedShareToken(null);
      setCopied(false);
      setTitle("My Collection");
      setDescription("");
      if (selectedItems.length > 0) {
        setShareType("selection");
        setTitle(`${selectedItems.length} Selected Cards`);
      } else if (preselectedFolderId) {
        setShareType("folder");
        setFolderId(preselectedFolderId);
        const folder = folders.find(f => f.id === preselectedFolderId);
        if (folder) setTitle(folder.name);
      } else {
        setShareType("collection");
      }
    }
  }, [open, selectedItems, preselectedFolderId, folders]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const share = await createShare({
        title,
        description: description || undefined,
        shareType,
        folderId: shareType === "folder" ? folderId : undefined,
        selectedItemIds: shareType === "selection" ? selectedItems.map(i => i.id) : undefined,
        showValues,
        showPurchasePrices,
        expiration,
      });

      if (share) {
        setCreatedShareToken(share.share_token);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdShareToken) return;
    
    try {
      await navigator.clipboard.writeText(getShareUrl(createdShareToken));
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareUrl = createdShareToken ? getShareUrl(createdShareToken) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {createdShareToken ? "Share Link Ready" : "Share Collection"}
          </DialogTitle>
          <DialogDescription>
            {createdShareToken
              ? "Your share link is ready. Copy it or scan the QR code."
              : "Create a shareable link to your collection."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!createdShareToken ? (
            <motion.div
              key="create"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 py-2"
            >
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Collection"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note for viewers..."
                  className="h-20 resize-none"
                />
              </div>

              {/* Share Type */}
              <div className="space-y-2">
                <Label>What to share</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setShareType("collection")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      shareType === "collection"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Box className="h-5 w-5" />
                    <span className="text-xs font-medium">All Cards</span>
                  </button>
                  <button
                    onClick={() => setShareType("folder")}
                    disabled={folders.length === 0}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      shareType === "folder"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${folders.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Folder className="h-5 w-5" />
                    <span className="text-xs font-medium">Folder</span>
                  </button>
                  <button
                    onClick={() => setShareType("selection")}
                    disabled={selectedItems.length === 0}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      shareType === "selection"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${selectedItems.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <CheckSquare className="h-5 w-5" />
                    <span className="text-xs font-medium">
                      {selectedItems.length > 0 ? `${selectedItems.length} Selected` : "Selection"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Folder Selection */}
              {shareType === "folder" && (
                <div className="space-y-2">
                  <Label>Select folder</Label>
                  <Select value={folderId} onValueChange={setFolderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: folder.color }}
                            />
                            {folder.name}
                            <span className="text-muted-foreground ml-1">
                              ({folder.item_count || 0})
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Display Options */}
              <div className="space-y-3">
                <Label>Display options</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="text-sm">Show market values</span>
                  </div>
                  <Switch checked={showValues} onCheckedChange={setShowValues} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    <span className="text-sm">Show purchase prices</span>
                  </div>
                  <Switch
                    checked={showPurchasePrices}
                    onCheckedChange={setShowPurchasePrices}
                  />
                </div>
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Link expires
                </Label>
                <Select
                  value={expiration}
                  onValueChange={(v) => setExpiration(v as ExpirationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">After 24 hours</SelectItem>
                    <SelectItem value="7d">After 7 days</SelectItem>
                    <SelectItem value="30d">After 30 days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4"
            >
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "link" | "qr")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="link" className="gap-2">
                    <Link className="h-4 w-4" />
                    Link
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(shareUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Preview Link
                  </Button>
                </TabsContent>

                <TabsContent value="qr" className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-xl">
                    <QRCodeSVG
                      value={shareUrl}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Scan this QR code to view the shared collection
                  </p>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          {!createdShareToken ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  isCreating ||
                  !title.trim() ||
                  (shareType === "folder" && !folderId)
                }
                className="gap-2"
              >
                {isCreating ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Create Share Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
