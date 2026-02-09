import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Clock, AlertTriangle } from "lucide-react";
import { ClientList, ClientListItem } from "@/hooks/useClientLists";
import { Logo } from "@/components/Logo";

export default function ClientListView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [list, setList] = useState<ClientList | null>(null);
  const [items, setItems] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      if (!shareToken) return;

      try {
        // Fetch list
        const { data: listData, error: listError } = await supabase
          .from("client_lists")
          .select("*")
          .eq("share_token", shareToken)
          .single();

        if (listError) throw listError;

        // Check if list is expired
        if (listData.expires_at && new Date(listData.expires_at) < new Date()) {
          setIsExpired(true);
          setLoading(false);
          return;
        }

        setList(listData);

        // Increment view count
        try {
          await supabase.rpc('increment_list_view_count', { p_share_token: shareToken });
        } catch (viewErr) {
          console.warn("Could not increment view count:", viewErr);
        }

        // Fetch items
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatGrading = (company: string, grade: string | null) => {
    if (company === "raw") return "Raw";
    return grade ? `${company.toUpperCase()} ${grade}` : company.toUpperCase();
  };

  const calculateOfferPrice = (marketPrice: number) => {
    if (discountPercent === 0) return marketPrice;
    return marketPrice * (discountPercent / 100);
  };

  const totalMarketValue = items.reduce(
    (sum, item) => sum + (item.market_price * item.quantity),
    0
  );

  const totalOfferValue = items.reduce(
    (sum, item) => sum + (calculateOfferPrice(item.market_price) * item.quantity),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-8 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <Logo size={40} showText={true} />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                {list.list_name}
              </h1>
              {list.notes && (
                <p className="text-muted-foreground text-lg">{list.notes}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} • Total Market Value: ${formatNumber(totalMarketValue)}
              </p>
            </div>
          </div>
        </Card>

        {/* Offer Calculator */}
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="discount" className="text-lg font-semibold">
                Calculate Your Offer
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the percentage of market value you'd like to offer
              </p>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="discount" className="text-sm">
                  Offer Percentage
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent || ""}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    placeholder="0"
                    className="pr-8 text-lg"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <Label className="text-sm">Your Total Offer</Label>
                <div className="text-3xl font-bold text-primary mt-1">
                  ${formatNumber(totalOfferValue)}
                </div>
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="text-sm text-muted-foreground">
                You're offering {discountPercent}% of the total market value (${formatNumber(totalMarketValue)})
              </div>
            )}
          </div>
        </Card>

        {/* Items List */}
        <Card className="p-6 border-primary/20">
          <h2 className="text-xl font-bold mb-4">Items in This List</h2>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {items.map((item) => {
                const itemMarketTotal = item.market_price * item.quantity;
                const itemOfferTotal = calculateOfferPrice(item.market_price) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="flex gap-6 p-5 bg-card border border-border/50 rounded-lg hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                  >
                    {item.card_image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.card_image_url}
                          alt={item.item_name}
                          className="w-28 h-auto object-contain p-3 rounded-lg border border-border/30 shadow-md"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{item.item_name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{item.set_name}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="font-semibold">
                          {formatGrading(item.grading_company, item.grade)}
                        </Badge>
                        <Badge variant="outline">Qty: {item.quantity}</Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-3 flex-shrink-0">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Market Price</p>
                        <p className="text-xl font-bold text-primary">
                          ${formatNumber(itemMarketTotal)}
                        </p>
                      </div>
                      {discountPercent > 0 && (
                        <div className="pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Your Offer</p>
                          <p className="text-xl font-bold text-green-500">
                            ${formatNumber(itemOfferTotal)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
