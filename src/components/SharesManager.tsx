import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  QrCode,
  Link,
  MoreHorizontal,
  Folder,
  Box,
  CheckSquare,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  useSharing,
  type SharedCollectionWithDetails,
} from "@/hooks/useSharing";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface SharesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SharesManager = ({ open, onOpenChange }: SharesManagerProps) => {
  const { toast } = useToast();
  const { shares, loading, deleteShare, toggleShareActive, getShareUrl } =
    useSharing();
  const [selectedShare, setSelectedShare] =
    useState<SharedCollectionWithDetails | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (shareToken: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(getShareUrl(shareToken));
      setCopiedId(shareId);
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (shareId: string) => {
    await deleteShare(shareId);
    setDeleteConfirmId(null);
  };

  const getShareTypeIcon = (shareType: string) => {
    switch (shareType) {
      case "folder":
        return <Folder className="h-4 w-4" />;
      case "selection":
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <Box className="h-4 w-4" />;
    }
  };

  const getShareTypeLabel = (share: SharedCollectionWithDetails) => {
    switch (share.share_type) {
      case "folder":
        return share.folder_name || "Folder";
      case "selection":
        return `${share.item_count || 0} Cards`;
      default:
        return "All Cards";
    }
  };

  const isExpired = (share: SharedCollectionWithDetails) => {
    if (!share.expires_at) return false;
    return new Date(share.expires_at) < new Date();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Manage Shares
            </DialogTitle>
            <DialogDescription>
              View and manage your shared collection links.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-lg bg-secondary/50 animate-pulse"
                  />
                ))}
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-12">
                <Share2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">No Shares Yet</h3>
                <p className="text-muted-foreground text-sm">
                  Create a share link from your inventory to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {shares.map((share) => (
                    <motion.div
                      key={share.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-xl border ${
                        !share.is_active || isExpired(share)
                          ? "bg-secondary/30 border-border/50 opacity-60"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">
                              {share.title}
                            </h4>
                            {!share.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                            {isExpired(share) && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              {getShareTypeIcon(share.share_type)}
                              {getShareTypeLabel(share)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {share.view_count} views
                            </span>
                            {share.expires_at && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {isExpired(share)
                                    ? "Expired"
                                    : `Expires ${formatDistanceToNow(
                                        new Date(share.expires_at),
                                        { addSuffix: true }
                                      )}`}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <Input
                                value={getShareUrl(share.share_token)}
                                readOnly
                                className="h-8 text-xs font-mono bg-secondary/50"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() =>
                                handleCopy(share.share_token, share.id)
                              }
                            >
                              {copiedId === share.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => setSelectedShare(share)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  getShareUrl(share.share_token),
                                  "_blank"
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toggleShareActive(share.id, !share.is_active)
                              }
                            >
                              {share.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteConfirmId(share.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog
        open={selectedShare !== null}
        onOpenChange={(open) => !open && setSelectedShare(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>{selectedShare?.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedShare && (
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG
                  value={getShareUrl(selectedShare.share_token)}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code to view the shared collection
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Share Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the share link. Anyone with the link
              will no longer be able to view your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SharesManager;
