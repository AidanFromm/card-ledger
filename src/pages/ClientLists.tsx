import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  List,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Link2,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  QrCode,
  BarChart3,
  Clock,
  Package,
  DollarSign,
  Users,
  Share2,
  FileDown,
  RefreshCw,
  Filter,
  Grid,
  ListIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { useClientLists, ClientList, ListVisibility } from "@/hooks/useClientLists";
import { useToast } from "@/hooks/use-toast";
import { CreateListDialog } from "@/components/clientlists/CreateListDialog";

const ClientLists = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lists, loading, deleteList, duplicateList, regenerateShareToken } = useClientLists();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | ListVisibility>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const [qrDialogList, setQrDialogList] = useState<ClientList | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const filteredLists = useMemo(() => {
    return lists.filter(list => {
      const matchesSearch = 
        list.list_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (list.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesVisibility = 
        visibilityFilter === "all" || list.visibility === visibilityFilter;

      return matchesSearch && matchesVisibility;
    });
  }, [lists, searchTerm, visibilityFilter]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getVisibilityIcon = (visibility: ListVisibility) => {
    switch (visibility) {
      case "public":
        return <Globe className="h-3.5 w-3.5" />;
      case "unlisted":
        return <Link2 className="h-3.5 w-3.5" />;
      case "private":
        return <Lock className="h-3.5 w-3.5" />;
    }
  };

  const getVisibilityColor = (visibility: ListVisibility) => {
    switch (visibility) {
      case "public":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "unlisted":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "private":
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  };

  const copyShareLink = (list: ClientList) => {
    const shareUrl = `${window.location.origin}/list/${list.share_token}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard",
    });
  };

  const handleDelete = async () => {
    if (!deleteListId) return;
    await deleteList(deleteListId);
    setDeleteListId(null);
  };

  const handleDuplicate = async (listId: string) => {
    setDuplicatingId(listId);
    await duplicateList(listId);
    setDuplicatingId(null);
  };

  const isExpired = (list: ClientList) => {
    if (!list.expires_at) return false;
    return new Date(list.expires_at) < new Date();
  };

  const stats = useMemo(() => {
    const totalViews = lists.reduce((sum, list) => sum + (list.view_count || 0), 0);
    const activeCount = lists.filter(l => !isExpired(l)).length;
    const publicCount = lists.filter(l => l.visibility === "public").length;
    
    return { totalViews, activeCount, publicCount };
  }, [lists]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Navbar />
        <div className="flex">
          <DesktopSidebar />
        
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <List className="h-5 w-5 text-primary" />
                </div>
                Client Lists
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage shareable lists for your clients
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Create List
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <List className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{lists.length}</p>
                    <p className="text-xs text-muted-foreground">Total Lists</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalViews}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeCount}</p>
                    <p className="text-xs text-muted-foreground">Active Lists</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.publicCount}</p>
                    <p className="text-xs text-muted-foreground">Public Lists</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={visibilityFilter} 
              onValueChange={(v) => setVisibilityFilter(v as typeof visibilityFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
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

          {/* Lists */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card/50">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredLists.length === 0 ? (
            <Card className="bg-card/50 border-dashed">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <List className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || visibilityFilter !== "all" 
                    ? "No lists found" 
                    : "No client lists yet"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || visibilityFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first list to share cards with clients"}
                </p>
                {!searchTerm && visibilityFilter === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First List
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredLists.map((list, index) => (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer group ${
                        isExpired(list) ? "opacity-60" : ""
                      }`}
                      onClick={() => navigate(`/lists/${list.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                              {list.list_name}
                            </h3>
                            {list.description && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {list.description}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/lists/${list.id}`);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit List
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                copyShareLink(list);
                              }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setQrDialogList(list);
                              }}>
                                <QrCode className="h-4 w-4 mr-2" />
                                Show QR Code
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/list/${list.share_token}`, "_blank");
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(list.id);
                                }}
                                disabled={duplicatingId === list.id}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                {duplicatingId === list.id ? "Duplicating..." : "Duplicate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteListId(list.id);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge 
                            variant="outline" 
                            className={getVisibilityColor(list.visibility)}
                          >
                            {getVisibilityIcon(list.visibility)}
                            <span className="ml-1 capitalize">{list.visibility}</span>
                          </Badge>
                          {isExpired(list) && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          )}
                          {list.allow_offers && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Offers
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {list.view_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(list.created_at)}
                            </span>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyShareLink(list);
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                          Copy Share Link
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="bg-card/50">
              <ScrollArea className="h-[600px]">
                <div className="divide-y divide-border">
                  {filteredLists.map((list) => (
                    <div
                      key={list.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        isExpired(list) ? "opacity-60" : ""
                      }`}
                      onClick={() => navigate(`/lists/${list.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold truncate">{list.list_name}</h3>
                            <Badge 
                              variant="outline" 
                              className={getVisibilityColor(list.visibility)}
                            >
                              {getVisibilityIcon(list.visibility)}
                              <span className="ml-1 capitalize">{list.visibility}</span>
                            </Badge>
                            {isExpired(list) && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                                Expired
                              </Badge>
                            )}
                          </div>
                          {list.description && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {list.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {list.view_count || 0}
                          </span>
                          <span>{formatDate(list.created_at)}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                copyShareLink(list);
                              }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setQrDialogList(list);
                              }}>
                                <QrCode className="h-4 w-4 mr-2" />
                                QR Code
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteListId(list.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </main>

        </div>
      <BottomNav />

        {/* Create List Dialog */}
        <CreateListDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
        />

        {/* QR Code Dialog */}
        <Dialog open={!!qrDialogList} onOpenChange={() => setQrDialogList(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Share QR Code</DialogTitle>
              <DialogDescription>
                Scan this code to view "{qrDialogList?.list_name}"
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
              <div className="p-4 bg-white rounded-2xl shadow-lg">
                <QRCodeSVG
                  value={`${window.location.origin}/list/${qrDialogList?.share_token}`}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (qrDialogList) copyShareLink(qrDialogList);
                }}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button onClick={() => setQrDialogList(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteListId} onOpenChange={() => setDeleteListId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client List?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The list and all its items will be permanently deleted.
                Any existing share links will stop working.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default ClientLists;
