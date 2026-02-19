import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Clock, AlertTriangle, Copy, Share2, Package, ImageOff } from "lucide-react";
import { ClientList, ClientListItem } from "@/hooks/useClientLists";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

export default function ClientListView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [list, setList] = useState<ClientList | null>(null);
  const [items, setItems] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchList = async () => {
      if (!shareToken) return;
      try {
        const { data: listData, error: listError } = await supabase
          .from("client_lists")
          .select("*")
          .eq("share_token", shareToken)
          .single();

        if (listError) throw listError;

        if (listData.expires_at && new Date(listData.expires_at) < new Date()) {
          setIsExpired(true);
          setLoading(false);
          return;
        }

        setList(listData);

        try {
          await supabase.rpc('increment_list_view_count', { p_share_token: shareToken });
        } catch {}

        const { data: itemsData, error: itemsError } = await supabase
          .from("client_list_items")
          .select("*")
          .eq("list_id", listData.id)
          .order("created_at", { ascending: true });

        if (itemsError) throw itemsError;
        setItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching list:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [shareToken]);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

  const formatGrading = (company: string, grade: string | null) => {
    if (company === "raw") return "Raw";
    return grade ? `${company.toUpperCase()} ${grade}` : company.toUpperCase();
  };

  const calculateOfferPrice = (marketPrice: number) =>
    discountPercent === 0 ? marketPrice : marketPrice * (discountPercent / 100);

  const totalMarketValue = items.reduce((sum, item) => sum + item.market_price * item.quantity, 0);
  const totalOfferValue = items.reduce((sum, item) => sum + calculateOfferPrice(item.market_price) * item.quantity, 0);
  const totalCards = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueCards = items.length;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied! 📋", description: "Share this link with anyone." });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading catalog...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md rounded-3xl">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-amber-500/20">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground">
            This share link has expired. Please contact the seller for a new link.
          </p>
        </Card>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md rounded-3xl">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-destructive/20">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">List Not Found</h1>
          <p className="text-muted-foreground">
            This client list does not exist or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Premium Header */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size={32} showText={true} />
          <Button variant="outline" size="sm" onClick={copyLink} className="rounded-xl gap-2">
            <Copy className="h-3.5 w-3.5" />
            Copy Link
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            {list.list_name}
          </h1>
          {list.notes && (
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">{list.notes}</p>
          )}
        </div>

        {/* Value Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Value</p>
            <p className="text-2xl md:text-3xl font-bold text-primary">${formatNumber(totalMarketValue)}</p>
          </Card>
          <Card className="p-5 rounded-2xl text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unique Cards</p>
            <p className="text-2xl md:text-3xl font-bold">{uniqueCards}</p>
          </Card>
          <Card className="p-5 rounded-2xl text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Qty</p>
            <p className="text-2xl md:text-3xl font-bold">{totalCards}</p>
          </Card>
          <Card className="p-5 rounded-2xl text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg / Card</p>
            <p className="text-2xl md:text-3xl font-bold">${totalCards > 0 ? formatNumber(totalMarketValue / totalCards) : '0.00'}</p>
          </Card>
        </div>

        {/* Offer Calculator */}
        <Card className="p-6 rounded-2xl border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="space-y-4">
            <div>
              <Label htmlFor="discount" className="text-lg font-semibold">Calculate Your Offer</Label>
              <p className="text-sm text-muted-foreground mt-1">Enter the percentage of market value you'd like to offer</p>
            </div>
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <Label htmlFor="discount" className="text-sm">Offer Percentage</Label>
                <div className="relative mt-1">
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent || ""}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    placeholder="0"
                    className="pr-8 text-lg rounded-xl"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm">Your Total Offer</Label>
                <div className="text-3xl font-bold text-primary mt-1">${formatNumber(totalOfferValue)}</div>
              </div>
            </div>
            {discountPercent > 0 && (
              <p className="text-sm text-muted-foreground">
                Offering {discountPercent}% of ${formatNumber(totalMarketValue)} market value
              </p>
            )}
          </div>
        </Card>

        {/* Card Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">{items.length} {items.length === 1 ? 'Item' : 'Items'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const itemMarketTotal = item.market_price * item.quantity;
              const itemOfferTotal = calculateOfferPrice(item.market_price) * item.quantity;

              return (
                <Card
                  key={item.id}
                  className="flex gap-4 p-4 rounded-2xl hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
                >
                  {/* Image */}
                  <div className="w-24 h-32 rounded-xl overflow-hidden bg-secondary/30 flex-shrink-0 flex items-center justify-center">
                    {item.card_image_url ? (
                      <img
                        src={item.card_image_url}
                        alt={item.item_name}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm leading-tight truncate">{item.item_name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.set_name}</p>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          {formatGrading(item.grading_company, item.grade)}
                        </Badge>
                        {item.quantity > 1 && (
                          <Badge variant="outline" className="text-[10px]">×{item.quantity}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Market</p>
                        <p className="text-lg font-bold text-primary">${formatNumber(itemMarketTotal)}</p>
                      </div>
                      {discountPercent > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Offer</p>
                          <p className="text-lg font-bold text-emerald-500">${formatNumber(itemOfferTotal)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Logo size={24} showText={false} />
            <span className="text-sm font-semibold text-muted-foreground">CardLedger</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Track, manage & share your card collection
          </p>
        </div>
      </div>
    </div>
  );
}
