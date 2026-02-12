import { useState } from "react";
import { Heart, Bell, DollarSign, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWishlistDb, AddToWishlistParams } from "@/hooks/useWishlistDb";

interface AddToWishlistButtonProps {
  card: {
    id: string;
    name: string;
    set_name?: string;
    image_url?: string;
    market_price?: number | null;
    card_number?: string;
    rarity?: string;
    tcg_type?: string;
  };
  variant?: "icon" | "button" | "small";
  className?: string;
}

export const AddToWishlistButton = ({ card, variant = "icon", className = "" }: AddToWishlistButtonProps) => {
  const { addItem, isInWishlist, isFull } = useWishlistDb();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [createAlert, setCreateAlert] = useState(false);

  const inWishlist = isInWishlist(card.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWishlist || isFull) return;
    setDialogOpen(true);
    // Pre-fill target price slightly below market
    if (card.market_price) {
      setTargetPrice((card.market_price * 0.9).toFixed(2));
    }
  };

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      const params: AddToWishlistParams = {
        card_id: card.id,
        card_name: card.name,
        set_name: card.set_name,
        image_url: card.image_url,
        current_price: card.market_price,
        target_price: targetPrice ? parseFloat(targetPrice) : undefined,
        tcg_type: card.tcg_type || "pokemon",
        card_number: card.card_number,
        rarity: card.rarity,
      };
      
      await addItem(params, createAlert && !!targetPrice);
      setDialogOpen(false);
      setTargetPrice("");
      setCreateAlert(false);
    } finally {
      setIsAdding(false);
    }
  };

  // Icon only variant
  if (variant === "icon") {
    return (
      <>
        <motion.button
          onClick={handleClick}
          disabled={inWishlist || isFull}
          className={`p-2 rounded-full transition-all ${
            inWishlist
              ? "bg-pink-500 text-white cursor-default"
              : "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20"
          } ${className}`}
          whileTap={{ scale: 0.9 }}
          title={inWishlist ? "In Wishlist" : isFull ? "Wishlist Full" : "Add to Wishlist"}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
        </motion.button>

        <WishlistDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          card={card}
          targetPrice={targetPrice}
          setTargetPrice={setTargetPrice}
          createAlert={createAlert}
          setCreateAlert={setCreateAlert}
          onAdd={handleAdd}
          isAdding={isAdding}
        />
      </>
    );
  }

  // Small button variant
  if (variant === "small") {
    return (
      <>
        <Button
          size="sm"
          variant={inWishlist ? "secondary" : "outline"}
          onClick={handleClick}
          disabled={inWishlist || isFull}
          className={`gap-1.5 ${className}`}
        >
          <Heart className={`h-3.5 w-3.5 ${inWishlist ? "fill-current text-pink-500" : ""}`} />
          {inWishlist ? "In Wishlist" : "Wishlist"}
        </Button>

        <WishlistDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          card={card}
          targetPrice={targetPrice}
          setTargetPrice={setTargetPrice}
          createAlert={createAlert}
          setCreateAlert={setCreateAlert}
          onAdd={handleAdd}
          isAdding={isAdding}
        />
      </>
    );
  }

  // Full button variant
  return (
    <>
      <Button
        variant={inWishlist ? "secondary" : "default"}
        onClick={handleClick}
        disabled={inWishlist || isFull}
        className={`gap-2 ${inWishlist ? "" : "bg-pink-500 hover:bg-pink-600"} ${className}`}
      >
        <Heart className={`h-4 w-4 ${inWishlist ? "fill-current text-pink-500" : ""}`} />
        {inWishlist ? "In Wishlist" : "Add to Wishlist"}
      </Button>

      <WishlistDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={card}
        targetPrice={targetPrice}
        setTargetPrice={setTargetPrice}
        createAlert={createAlert}
        setCreateAlert={setCreateAlert}
        onAdd={handleAdd}
        isAdding={isAdding}
      />
    </>
  );
};

// Wishlist Dialog Component
interface WishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: {
    name: string;
    set_name?: string;
    image_url?: string;
    market_price?: number | null;
  };
  targetPrice: string;
  setTargetPrice: (price: string) => void;
  createAlert: boolean;
  setCreateAlert: (create: boolean) => void;
  onAdd: () => void;
  isAdding: boolean;
}

const WishlistDialog = ({
  open,
  onOpenChange,
  card,
  targetPrice,
  setTargetPrice,
  createAlert,
  setCreateAlert,
  onAdd,
  isAdding,
}: WishlistDialogProps) => {
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "—";
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-2 border-border/50 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Add to Wishlist
          </DialogTitle>
          <DialogDescription>
            Add {card.name} to your wishlist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Card Preview */}
          <div className="flex gap-3">
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className="w-20 h-auto rounded-lg border border-border/40"
              />
            ) : (
              <div className="w-20 h-28 rounded-lg bg-muted/30 flex items-center justify-center">
                <Heart className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm">{card.name}</h3>
              {card.set_name && (
                <p className="text-xs text-muted-foreground">{card.set_name}</p>
              )}
              {card.market_price && (
                <p className="text-sm font-bold mt-2">
                  {formatCurrency(card.market_price)}
                </p>
              )}
            </div>
          </div>

          {/* Target Price */}
          <div className="space-y-2">
            <Label className="text-sm">Target Price (optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Set a target price to track when this card hits your desired price point.
            </p>
          </div>

          {/* Create Alert Toggle */}
          {targetPrice && parseFloat(targetPrice) > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Create Price Alert</p>
                  <p className="text-[10px] text-muted-foreground">
                    Get notified when price drops to target
                  </p>
                </div>
              </div>
              <Switch
                checked={createAlert}
                onCheckedChange={setCreateAlert}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onAdd}
            disabled={isAdding}
            className="bg-pink-500 hover:bg-pink-600 gap-2"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            Add to Wishlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToWishlistButton;
