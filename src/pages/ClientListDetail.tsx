import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  Copy,
  QrCode,
  Settings,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  BarChart3,
  Clock,
  Mail,
  Phone,
  DollarSign,
  Package,
  GripVertical,
  RefreshCw,
  Globe,
  Link2,
  Lock,
  AlertCircle,
  Check,
  X,
  MessageSquare,
  Search,
  Loader2,
  FileDown,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import {
  useClientLists,
  useClientListItems,
  useClientListAnalytics,
  ClientList,
  ClientListItem,
  ListVisibility,
  PricingMode,
} from "@/hooks/useClientLists";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ClientListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lists, updateList, deleteList, regenerateShareToken } = useClientLists();
  const { items, loading: itemsLoading, addItems, removeItem, updateItem, reorderItems } = useClientListItems(id || null);
  const { analytics, inquiries, updateInquiryStatus } = useClientListAnalytics(id || null);
  const { items: inventoryItems } = useInventoryDb();

  const [list, setList] = useState<ClientList | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("items");

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState<ListVisibility>("unlisted");
  const [editPricingMode, setEditPricingMode] = useState<PricingMode>("market");
  const [editMarkup, setEditMarkup] = useState(0);
  const [editAllowOffers, setEditAllowOffers] = useState(true);
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Add items dialog
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [selectedNewItems, setSelectedNewItems] = useState<Set<string>>(new Set());

  // QR dialog
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Delete confirmation
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reorder state
  const [orderedItems, setOrderedItems] = useState<ClientListItem[]>([]);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  // Fetch list data
  useEffect(() => {
    const fetchList = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("client_lists")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setList(data as ClientList);
        
        // Initialize edit states
        setEditName(data.list_name);
        setEditDescription(data.description || "");
        setEditVisibility(data.visibility || "unlisted");
        setEditPricingMode(data.pricing_mode || "market");
        setEditMarkup(data.markup_percent || 0);
        setEditAllowOffers(data.allow_offers ?? true);
        setEditContactEmail(data.contact_email || "");
        setEditContactPhone(data.contact_phone || "");
      } catch (error) {
        console.error("Error fetching list:", error);
        toast({
          title: "Error",
          description: "Failed to load list",
          variant: "destructive",
        });
        navigate("/lists");
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [id, navigate, toast]);

  const shareUrl = list ? `${window.location.origin}/list/${list.share_token}` : "";

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Copied!",
      description: "Share link copied to clipboard",
    });
  };

  const handleSaveChanges = async () => {
    if (!list) return;

    setIsSaving(true);
    const success = await updateList({
      listId: list.id,
      listName: editName,
      description: editDescription || undefined,
      visibility: editVisibility,
      pricingMode: editPricingMode,
      markupPercent: editMarkup,
      allowOffers: editAllowOffers,
      contactEmail: editContactEmail || null,
      contactPhone: editContactPhone || null,
    });

    if (success) {
      setList({
        ...list,
        list_name: editName,
        description: editDescription,
        visibility: editVisibility,
        pricing_mode: editPricingMode,
        markup_percent: editMarkup,
        allow_offers: editAllowOffers,
        contact_email: editContactEmail || null,
        contact_phone: editContactPhone || null,
      });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;
    setIsDeleting(true);
    await removeItem(deleteItemId);
    setDeleteItemId(null);
    setIsDeleting(false);
  };

  const handleAddItems = async () => {
    const itemsToAdd = inventoryItems
      .filter(item => selectedNewItems.has(item.id))
      .map(item => ({
        name: item.name,
        set_name: item.set_name,
        card_image_url: item.card_image_url,
        grading_company: item.grading_company,
        grade: item.grade,
        market_price: item.market_price,
        quantity: 1,
        inventory_item_id: item.id,
      }));

    await addItems(itemsToAdd);
    setSelectedNewItems(new Set());
    setIsAddItemsOpen(false);
  };

  const handleReorder = async (newOrder: ClientListItem[]) => {
    setOrderedItems(newOrder);
    await reorderItems(newOrder.map(item => item.id));
  };

  const handleRegenerateToken = async () => {
    if (!list) return;
    const newToken = await regenerateShareToken(list.id);
    if (newToken) {
      setList({ ...list, share_token: newToken });
    }
  };

  const filteredInventoryItems = useMemo(() => {
    const existingIds = new Set(items.map(i => i.inventory_item_id));
    let filtered = inventoryItems.filter(item => !existingIds.has(item.id));
    
    if (itemSearchTerm) {
      const term = itemSearchTerm.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(term) ||
          item.set_name.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [inventoryItems, items, itemSearchTerm]);

  const totalValue = useMemo(() => {
    return orderedItems.reduce((sum, item) => {
      const price = item.custom_price ?? item.market_price;
      const adjustedPrice = list?.pricing_mode === "markup"
        ? price * (1 + (list.markup_percent || 0) / 100)
        : price;
      return sum + adjustedPrice * item.quantity;
    }, 0);
  }, [orderedItems, list]);

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

  const getVisibilityIcon = (v: ListVisibility) => {
    switch (v) {
      case "public": return <Globe className="h-4 w-4" />;
      case "unlisted": return <Link2 className="h-4 w-4" />;
      case "private": return <Lock className="h-4 w-4" />;
    }
  };

  const isExpired = list?.expires_at ? new Date(list.expires_at) < new Date() : false;

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-24 md:pb-0">
          <Navbar />
          <main className="container mx-auto px-4 py-6 space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </main>
          <BottomNav />
        </div>
      </PageTransition>
    );
  }

  if (!list) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">List Not Found</h1>
            <p className="text-muted-foreground mb-4">
              This list doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/lists")}>Back to Lists</Button>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Navbar />

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/lists")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold truncate">{list.list_name}</h1>
                <Badge variant="outline" className="capitalize">
                  {getVisibilityIcon(list.visibility)}
                  <span className="ml-1">{list.visibility}</span>
                </Badge>
                {isExpired && (
                  <Badge variant="destructive">
                    <Clock className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
              </div>
              {list.description && (
                <p className="text-muted-foreground mt-1 truncate">{list.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" onClick={() => setIsQrOpen(true)} className="gap-2">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">QR Code</span>
              </Button>
              <Button onClick={copyShareLink} className="gap-2">
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy Link</span>
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orderedItems.length}</p>
                  <p className="text-xs text-muted-foreground">Items</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${formatNumber(totalValue)}</p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{list.view_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inquiries.length}</p>
                  <p className="text-xs text-muted-foreground">Inquiries</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="items" className="gap-1">
                <Package className="h-4 w-4 hidden sm:block" />
                Items
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1">
                <BarChart3 className="h-4 w-4 hidden sm:block" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="gap-1">
                <MessageSquare className="h-4 w-4 hidden sm:block" />
                Inquiries
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1">
                <Settings className="h-4 w-4 hidden sm:block" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">List Items</h3>
                <Button onClick={() => setIsAddItemsOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Items
                </Button>
              </div>

              {itemsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : orderedItems.length === 0 ? (
                <Card className="bg-card/50 border-dashed">
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No items yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add cards from your inventory to this list
                    </p>
                    <Button onClick={() => setIsAddItemsOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Items
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={orderedItems}
                  onReorder={handleReorder}
                  className="space-y-3"
                >
                  {orderedItems.map((item) => {
                    const displayPrice = item.custom_price ?? item.market_price;
                    const adjustedPrice = list.pricing_mode === "markup"
                      ? displayPrice * (1 + (list.markup_percent || 0) / 100)
                      : displayPrice;

                    return (
                      <Reorder.Item
                        key={item.id}
                        value={item}
                        className="list-none"
                      >
                        <Card className="bg-card/50 hover:bg-card/80 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="cursor-grab active:cursor-grabbing touch-none">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>

                              {item.card_image_url ? (
                                <img
                                  src={item.card_image_url}
                                  alt={item.item_name}
                                  className="w-16 h-22 object-contain rounded"
                                />
                              ) : (
                                <div className="w-16 h-22 bg-muted rounded flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{item.item_name}</h4>
                                <p className="text-sm text-muted-foreground truncate">
                                  {item.set_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {formatGrading(item.grading_company, item.grade)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Qty: {item.quantity}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  ${formatNumber(adjustedPrice * item.quantity)}
                                </p>
                                {item.quantity > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    ${formatNumber(adjustedPrice)} each
                                  </p>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteItemId(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      View Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {analytics?.totalViews || 0}
                    </div>
                    <p className="text-muted-foreground">Total page views</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Inquiries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {analytics?.totalInquiries || 0}
                    </div>
                    <p className="text-muted-foreground">Total inquiries received</p>
                  </CardContent>
                </Card>
              </div>

              {analytics?.topViewedItems && analytics.topViewedItems.length > 0 && (
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Most Viewed Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topViewedItems.map(({ item, views }) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.card_image_url ? (
                            <img
                              src={item.card_image_url}
                              alt={item.item_name}
                              className="w-10 h-14 object-contain rounded"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-muted rounded" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium truncate">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground">{item.set_name}</p>
                          </div>
                          <Badge variant="secondary">
                            <Eye className="h-3 w-3 mr-1" />
                            {views}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Inquiries Tab */}
            <TabsContent value="inquiries" className="space-y-4">
              {inquiries.length === 0 ? (
                <Card className="bg-card/50 border-dashed">
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No inquiries yet</h3>
                    <p className="text-muted-foreground">
                      When buyers show interest, their inquiries will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inquiry) => (
                    <Card key={inquiry.id} className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{inquiry.inquirer_name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {inquiry.inquirer_email}
                              </span>
                              {inquiry.inquirer_phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {inquiry.inquirer_phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <Select
                            value={inquiry.status}
                            onValueChange={(v) => updateInquiryStatus(inquiry.id, v as any)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <p className="text-sm mb-3">{inquiry.message}</p>
                        
                        {inquiry.offer_amount && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Offer: ${formatNumber(inquiry.offer_amount)}
                          </Badge>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(inquiry.created_at).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-card/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>List Settings</CardTitle>
                    {!isEditing && (
                      <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>List Name</Label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Visibility</Label>
                          <Select value={editVisibility} onValueChange={(v) => setEditVisibility(v as ListVisibility)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="unlisted">Unlisted</SelectItem>
                              <SelectItem value="public">Public</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Pricing Mode</Label>
                          <Select value={editPricingMode} onValueChange={(v) => setEditPricingMode(v as PricingMode)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="market">Market Price</SelectItem>
                              <SelectItem value="markup">Global Markup</SelectItem>
                              <SelectItem value="custom">Custom Prices</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {editPricingMode === "markup" && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Markup/Discount %</Label>
                              <span className="font-bold">
                                {editMarkup > 0 ? "+" : ""}{editMarkup}%
                              </span>
                            </div>
                            <Slider
                              value={[editMarkup]}
                              onValueChange={([v]) => setEditMarkup(v)}
                              min={-50}
                              max={100}
                              step={1}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Label>Allow Offers</Label>
                          <Switch
                            checked={editAllowOffers}
                            onCheckedChange={setEditAllowOffers}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Contact Email</Label>
                            <Input
                              type="email"
                              value={editContactEmail}
                              onChange={(e) => setEditContactEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Contact Phone</Label>
                            <Input
                              type="tel"
                              value={editContactPhone}
                              onChange={(e) => setEditContactPhone(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Visibility</p>
                          <p className="font-medium capitalize flex items-center gap-2">
                            {getVisibilityIcon(list.visibility)}
                            {list.visibility}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pricing</p>
                          <p className="font-medium capitalize">
                            {list.pricing_mode}
                            {list.pricing_mode === "markup" && ` (${list.markup_percent}%)`}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Allow Offers</p>
                          <p className="font-medium">{list.allow_offers ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Contact</p>
                          <p className="font-medium">
                            {list.contact_email || list.contact_phone || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Share Link Section */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle>Share Link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="font-mono text-sm" />
                    <Button variant="outline" onClick={copyShareLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open(shareUrl, "_blank")} className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="outline" onClick={handleRegenerateToken} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Regenerate Link
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-card/50 border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this list?")) {
                        deleteList(list.id).then(() => navigate("/lists"));
                      }
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete List
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <BottomNav />

        {/* QR Code Dialog */}
        <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Share QR Code</DialogTitle>
              <DialogDescription>
                Scan to view "{list.list_name}"
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
              <div className="p-4 bg-white rounded-2xl shadow-lg">
                <QRCodeSVG value={shareUrl} size={200} level="M" includeMargin />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={copyShareLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button onClick={() => setIsQrOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Items Dialog */}
        <Dialog open={isAddItemsOpen} onOpenChange={setIsAddItemsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Add Items from Inventory</DialogTitle>
              <DialogDescription>
                Select cards to add to this list
              </DialogDescription>
            </DialogHeader>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredInventoryItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No items available to add</p>
                  </div>
                ) : (
                  filteredInventoryItems.map((item) => {
                    const isSelected = selectedNewItems.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          const newSelected = new Set(selectedNewItems);
                          if (isSelected) {
                            newSelected.delete(item.id);
                          } else {
                            newSelected.add(item.id);
                          }
                          setSelectedNewItems(newSelected);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        
                        {item.card_image_url ? (
                          <img src={item.card_image_url} alt={item.name} className="w-10 h-14 object-contain rounded" />
                        ) : (
                          <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{item.set_name}</p>
                        </div>
                        
                        <p className="font-semibold text-primary">
                          ${formatNumber(item.market_price)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddItemsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddItems}
                disabled={selectedNewItems.size === 0}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add {selectedNewItems.size} Item{selectedNewItems.size !== 1 && "s"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Item Confirmation */}
        <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Item?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the item from this list. The item will remain in your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default ClientListDetail;
