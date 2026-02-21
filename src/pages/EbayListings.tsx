import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import BottomNav from "@/components/BottomNav";
import CardImage from "@/components/CardImage";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  ArrowLeft,
  RefreshCw,
  Search,
  Download,
  Loader2,
  ExternalLink,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ImageOff,
} from "lucide-react";
import {
  getActiveListings,
  mapEbayListingToInventory,
  EbayListing,
} from "@/lib/ebay";

const EbayListings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [listings, setListings] = useState<EbayListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const { listings: data, totalCount: count } = await getActiveListings(100, 0);
      setListings(data);
      setTotalCount(count);
    } catch (error) {
      console.error("Error loading listings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load listings",
      });
      
      // If auth error, redirect to connection page
      if (error instanceof Error && error.message.includes("authorization")) {
        navigate("/ebay");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (itemId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const filteredIds = filteredListings.map(l => l.itemId);
    setSelectedIds(new Set(filteredIds));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) {
      toast({
        variant: "destructive",
        title: "No items selected",
        description: "Please select at least one listing to import",
      });
      return;
    }

    setImporting(true);
    const selectedListings = listings.filter(l => selectedIds.has(l.itemId));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Map listings to inventory items
      const inventoryItems = selectedListings.map(listing => {
        const mapped = mapEbayListingToInventory(listing);
        return {
          ...mapped,
          user_id: user.id,
        };
      });

      // Insert into inventory
      const { error } = await supabase
        .from("inventory_items")
        .insert(inventoryItems);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${inventoryItems.length} items to your inventory`,
      });

      // Clear selection
      setSelectedIds(new Set());

      // Navigate to inventory
      navigate("/inventory");
    } catch (error) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import listings",
      });
    } finally {
      setImporting(false);
    }
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
        <div className="flex">
          <DesktopSidebar />
      
      <div className="container max-w-4xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ebay")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">eBay Listings</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} active listings
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadListings}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={loading}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              disabled={loading || selectedIds.size === 0}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Import Button */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <Button
                className="w-full"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Import {selectedIds.size} Selected to Inventory
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listings */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your eBay listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Listings Found</h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery
                  ? "No listings match your search"
                  : "You don't have any active eBay listings"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.itemId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedIds.has(listing.itemId)
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleSelect(listing.itemId)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedIds.has(listing.itemId)}
                          onCheckedChange={() => toggleSelect(listing.itemId)}
                        />
                      </div>

                      {/* Image */}
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                        <CardImage
                          src={listing.imageUrl}
                          alt={listing.title}
                          size="md"
                          rounded="lg"
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-2 text-sm">
                          {listing.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatPrice(listing.price, listing.currency)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Qty: {listing.quantityAvailable}
                          </Badge>
                          {listing.listingStatus === "ACTIVE" ? (
                            <Badge className="text-xs bg-green-500/10 text-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {listing.listingStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Note */}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Import listings to your inventory to track them.
            <br />
            You'll need to set the purchase price after importing.
          </p>
        </div>
      </div>

      </div>
      <BottomNav />
    </div>
  );
};

export default EbayListings;
