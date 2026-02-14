import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  AlertTriangle,
  Package,
  DollarSign,
  Mail,
  Phone,
  Eye,
  MessageSquare,
  Send,
  Check,
  X,
  Grid,
  List as ListIcon,
  FileDown,
  Search,
  SlidersHorizontal,
  Award,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { usePublicClientList, ClientListItem } from "@/hooks/useClientLists";
import { useToast } from "@/hooks/use-toast";

export default function ClientListView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { list, items, loading, error, submitInquiry, incrementItemView } = usePublicClientList(shareToken || null);
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "grade">("name");
  const [offerPercent, setOfferPercent] = useState(0);
  
  // Inquiry dialog
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [selectedItemForInquiry, setSelectedItemForInquiry] = useState<ClientListItem | null>(null);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryOffer, setInquiryOffer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        item =>
          item.item_name.toLowerCase().includes(term) ||
          item.set_name.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.item_name.localeCompare(b.item_name);
        case "price":
          return b.market_price - a.market_price;
        case "grade":
          return (b.grade || "").localeCompare(a.grade || "");
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchTerm, sortBy]);

  const calculatePrice = (item: ClientListItem) => {
    const basePrice = item.custom_price ?? item.market_price;
    if (list?.pricing_mode === "markup") {
      return basePrice * (1 + (list.markup_percent || 0) / 100);
    }
    return basePrice;
  };

  const totalMarketValue = useMemo(() => {
    return items.reduce((sum, item) => sum + calculatePrice(item) * item.quantity, 0);
  }, [items, list]);

  const totalOfferValue = useMemo(() => {
    if (offerPercent === 0) return totalMarketValue;
    return totalMarketValue * (offerPercent / 100);
  }, [totalMarketValue, offerPercent]);

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

  const handleItemClick = (item: ClientListItem) => {
    incrementItemView(item.id);
    // Could open a detail modal here in future
  };

  const openInquiry = (item?: ClientListItem) => {
    setSelectedItemForInquiry(item || null);
    setInquiryMessage(item ? `I'm interested in: ${item.item_name}` : "");
    setIsInquiryOpen(true);
  };

  const handleSubmitInquiry = async () => {
    if (!inquiryName || !inquiryEmail || !inquiryMessage) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await submitInquiry({
      itemId: selectedItemForInquiry?.id,
      name: inquiryName,
      email: inquiryEmail,
      phone: inquiryPhone || undefined,
      message: inquiryMessage,
      offerAmount: inquiryOffer ? parseFloat(inquiryOffer) : undefined,
    });

    setIsSubmitting(false);

    if (success) {
      setInquirySuccess(true);
      toast({
        title: "Inquiry Sent!",
        description: "The seller will get back to you soon.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetInquiry = () => {
    setInquiryName("");
    setInquiryEmail("");
    setInquiryPhone("");
    setInquiryMessage("");
    setInquiryOffer("");
    setSelectedItemForInquiry(null);
    setInquirySuccess(false);
    setIsInquiryOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error === "This link has expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Link Expired</h1>
          <p className="text-muted-foreground mb-6">
            This share link has expired. Please contact the seller for a new link.
          </p>
          <Link to="/">
            <Button className="gap-2">
              <Logo size={16} />
              Visit CardLedger
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-3">List Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "This list doesn't exist or has been removed."}
          </p>
          <Link to="/">
            <Button className="gap-2">
              <Logo size={16} />
              Visit CardLedger
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo size={28} showText />
            </Link>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {list.view_count} views
              </span>
              {list.expires_at && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Expires {new Date(list.expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-primary bg-clip-text text-transparent">
            {list.list_name}
          </h1>
          {list.description && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {list.description}
            </p>
          )}
          
          {/* Contact Info */}
          {(list.contact_email || list.contact_phone) && (
            <div className="flex items-center justify-center gap-6 pt-4">
              {list.contact_email && (
                <a
                  href={`mailto:${list.contact_email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {list.contact_email}
                </a>
              )}
              {list.contact_phone && (
                <a
                  href={`tel:${list.contact_phone}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {list.contact_phone}
                </a>
              )}
            </div>
          )}
        </motion.div>

        {/* Stats & Offer Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Stats */}
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{items.length}</p>
                  <p className="text-sm text-muted-foreground">Cards</p>
                </div>
                <div>
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-3xl font-bold">${formatNumber(totalMarketValue)}</p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
                <div>
                  <Award className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-3xl font-bold">
                    {items.filter(i => i.grading_company !== "raw").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Graded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offer Calculator */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Calculate Your Offer</h3>
                <Badge variant="secondary">{offerPercent}% of market</Badge>
              </div>
              
              <Slider
                value={[offerPercent]}
                onValueChange={([v]) => setOfferPercent(v)}
                min={0}
                max={100}
                step={5}
                className="my-4"
              />
              
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Offer</p>
                  <p className="text-4xl font-bold text-primary">
                    ${formatNumber(totalOfferValue)}
                  </p>
                </div>
                {list.allow_offers && (
                  <Button onClick={() => openInquiry()} className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Make an Offer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[160px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price (High-Low)</SelectItem>
              <SelectItem value="grade">Grade</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
            <TabsList>
              <TabsTrigger value="grid" className="px-3">
                <Grid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3">
                <ListIcon className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Items Display */}
        {filteredItems.length === 0 ? (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">
                {searchTerm ? "No cards found" : "No cards in this list"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try a different search term" : "This list doesn't have any cards yet"}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => {
                const price = calculatePrice(item);
                const offerPrice = price * (offerPercent / 100);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleItemClick(item)}
                    className="group"
                  >
                    <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer overflow-hidden">
                      {/* Card Image */}
                      <div className="aspect-[3/4] bg-muted/30 relative overflow-hidden">
                        {item.card_image_url ? (
                          <img
                            src={item.card_image_url}
                            alt={item.item_name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}

                        {/* Quantity Badge */}
                        {item.quantity > 1 && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-xs font-medium">
                            ×{item.quantity}
                          </div>
                        )}

                        {/* Grading Badge */}
                        <div className="absolute bottom-2 left-2">
                          <Badge
                            variant={item.grading_company === "raw" ? "secondary" : "default"}
                            className="text-xs"
                          >
                            {formatGrading(item.grading_company, item.grade)}
                          </Badge>
                        </div>
                      </div>

                      {/* Card Info */}
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm truncate mb-1">{item.item_name}</h4>
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          {item.set_name}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-primary">
                            ${formatNumber(price * item.quantity)}
                          </span>
                          {offerPercent > 0 && (
                            <span className="text-xs text-green-500 font-medium">
                              ${formatNumber(offerPrice * item.quantity)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <Card className="bg-card/50">
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-border">
                {filteredItems.map((item) => {
                  const price = calculatePrice(item);
                  const offerPrice = price * (offerPercent / 100);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      {item.card_image_url ? (
                        <img
                          src={item.card_image_url}
                          alt={item.item_name}
                          className="w-16 h-22 object-contain rounded"
                        />
                      ) : (
                        <div className="w-16 h-22 bg-muted rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{item.item_name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{item.set_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {formatGrading(item.grading_company, item.grade)}
                          </Badge>
                          {item.quantity > 1 && (
                            <Badge variant="outline" className="text-xs">
                              Qty: {item.quantity}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          ${formatNumber(price * item.quantity)}
                        </p>
                        {offerPercent > 0 && (
                          <p className="text-sm text-green-500">
                            Offer: ${formatNumber(offerPrice * item.quantity)}
                          </p>
                        )}
                      </div>

                      {list.allow_offers && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInquiry(item);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Floating Action Button (Mobile) */}
        {list.allow_offers && (
          <div className="fixed bottom-6 right-6 md:hidden">
            <Button
              size="lg"
              onClick={() => openInquiry()}
              className="rounded-full h-14 w-14 shadow-lg"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Logo size={20} />
            <span>Powered by CardLedger</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            The smart way to manage your card collection
          </p>
        </div>
      </footer>

      {/* Inquiry Dialog */}
      <Dialog open={isInquiryOpen} onOpenChange={(open) => !open && resetInquiry()}>
        <DialogContent className="max-w-md">
          {inquirySuccess ? (
            <>
              <DialogHeader>
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <DialogTitle className="text-center">Inquiry Sent!</DialogTitle>
                <DialogDescription className="text-center">
                  The seller will review your message and get back to you soon.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={resetInquiry} className="w-full">Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedItemForInquiry 
                    ? `Inquire About "${selectedItemForInquiry.item_name}"`
                    : "Send Inquiry"}
                </DialogTitle>
                <DialogDescription>
                  Fill out the form below and the seller will get back to you.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                {list.allow_offers && (
                  <div className="space-y-2">
                    <Label htmlFor="offer">Your Offer (optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="offer"
                        type="number"
                        step="0.01"
                        value={inquiryOffer}
                        onChange={(e) => setInquiryOffer(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="I'm interested in..."
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetInquiry}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitInquiry}
                  disabled={isSubmitting || !inquiryName || !inquiryEmail || !inquiryMessage}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Inquiry
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
