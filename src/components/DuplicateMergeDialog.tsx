import { AlertTriangle, Merge, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface DuplicateMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingItem: InventoryItem;
  newQuantity: number;
  onMerge: () => void;
  onAddSeparate: () => void;
}

export const DuplicateMergeDialog = ({ open, onOpenChange, existingItem, newQuantity, onMerge, onAddSeparate }: DuplicateMergeDialogProps) => {
  const gradeDisplay = existingItem.grading_company !== 'raw'
    ? `${existingItem.grading_company?.toUpperCase()} ${existingItem.grade}`
    : 'Raw';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-border/30 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Possible Duplicate Found
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 mb-4">
            {existingItem.card_image_url && (
              <img src={existingItem.card_image_url} alt="" className="w-12 h-16 object-contain rounded-lg" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{existingItem.name}</p>
              <p className="text-xs text-muted-foreground truncate">{existingItem.set_name}</p>
              <p className="text-xs text-muted-foreground">{gradeDisplay} • Qty: {existingItem.quantity}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            You already have <strong>{existingItem.quantity}x {existingItem.name}</strong> ({gradeDisplay}) in your inventory.
            Would you like to add {newQuantity} more to the existing entry, or create a separate entry?
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onAddSeparate} className="flex-1 gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Add Separate
          </Button>
          <Button onClick={onMerge} className="flex-1 gap-2 rounded-xl bg-primary">
            <Merge className="h-4 w-4" /> Merge (+{newQuantity})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateMergeDialog;
