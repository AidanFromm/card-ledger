import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, CheckCircle2, Minimize2 } from "lucide-react";

interface ImportProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportProductsDialog({ open, onOpenChange }: ImportProductsDialogProps) {
  // Card import state
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [totalImported, setTotalImported] = useState(0);
  const [totalUpdated, setTotalUpdated] = useState(0);
  const [backgroundImport, setBackgroundImport] = useState(false);
  
  // Price refresh state
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [pricesRefreshed, setPricesRefreshed] = useState(0);
  const [pricesFailed, setPricesFailed] = useState(0);
  
  const { toast } = useToast();

  // Persist progress so we can resume after refresh or sandbox rebuilds
  const saveState = (key: string, state: any) => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  };
  const loadState = (key: string) => {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
  };

  useEffect(() => {
    const savedCards = loadState("productsImportState");
    if (savedCards?.running) {
      // Auto-resume cards import
      handleImport(true, savedCards.currentPage || 1, savedCards.totalPages || 1, savedCards.totals || { imported: 0, updated: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImport = async (
    continueInBackground = false,
    startPage = 1,
    knownTotalPages = 1,
    totals: { imported: number; updated: number } = { imported: 0, updated: 0 }
  ) => {
    setImporting(true);
    setProgress(startPage > 1 && knownTotalPages > 1 ? (startPage / knownTotalPages) * 100 : 0);
    setTotalImported(totals.imported);
    setTotalUpdated(totals.updated);
    setStatus(startPage > 1 ? `Resuming from page ${startPage}...` : "Starting import...");
    setBackgroundImport(continueInBackground);

    if (continueInBackground) {
      onOpenChange(false);
      toast({
        title: "Card import running in background",
        description: "You'll be notified when it completes",
      });
    }

    let currentPage = startPage;
    let hasMore = true;
    let totalPages = knownTotalPages;
    let accumulatedImported = totals.imported;
    let accumulatedUpdated = totals.updated;
    const PARALLEL_REQUESTS = 3;

    try {
      while (hasMore) {
        const pageBatch: number[] = [];
        for (let i = 0; i < PARALLEL_REQUESTS && (currentPage + i) <= totalPages; i++) {
          pageBatch.push(currentPage + i);
        }

        setStatus(`Processing pages ${pageBatch[0]}-${pageBatch[pageBatch.length - 1]} of ${totalPages}...`);

        const results = await Promise.allSettled(
          pageBatch.map(async (pageNum) => {
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
              try {
                const response = await supabase.functions.invoke('index-products', {
                  body: { page: pageNum }
                });

                if (response.error) throw new Error(response.error.message || "Unknown error");

                const data = response.data;
                return { 
                  page: pageNum,
                  imported: data?.imported || 0, 
                  updated: data?.updated || 0,
                  totalPages: data?.totalPages,
                  hasMore: data?.hasMore
                };
              } catch (error: any) {
                retryCount++;
                if (retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount - 1), 5000)));
                } else {
                  throw error;
                }
              }
            }
            throw new Error(`Page ${pageNum} failed after ${maxRetries} attempts`);
          })
        );

        let batchImported = 0;
        let batchUpdated = 0;

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            batchImported += result.value.imported;
            batchUpdated += result.value.updated;
            if (result.value.totalPages) totalPages = result.value.totalPages;
            if (result.value.hasMore !== undefined) hasMore = result.value.hasMore;
          }
        });

        accumulatedImported += batchImported;
        accumulatedUpdated += batchUpdated;
        setTotalImported(accumulatedImported);
        setTotalUpdated(accumulatedUpdated);

        currentPage += pageBatch.length;
        setProgress(Math.min(100, (currentPage / totalPages) * 100));

        saveState("productsImportState", { 
          running: true, 
          currentPage, 
          totalPages, 
          totals: { imported: accumulatedImported, updated: accumulatedUpdated } 
        });

        if (currentPage > totalPages || !hasMore) {
          setStatus("Import complete!");
          setProgress(100);
          saveState("productsImportState", { running: false, currentPage: 1, totalPages: 1, totals: { imported: 0, updated: 0 } });
          toast({
            title: "Card import successful!",
            description: `Imported ${accumulatedImported.toLocaleString()} new cards, updated ${accumulatedUpdated.toLocaleString()}`,
          });
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      toast({
        title: "Card import stopped",
        description: `Stopped at page ${currentPage}. Click Import Cards to resume.`,
        variant: "destructive",
      });
      setStatus(`Stopped at page ${currentPage} - click Import Cards to resume`);
    } finally {
      setImporting(false);
      setBackgroundImport(false);
    }
  };


  const handlePriceRefresh = async () => {
    setRefreshingPrices(true);
    setPricesRefreshed(0);
    setPricesFailed(0);

    try {
      let hasMore = true;
      let totalRefreshed = 0;
      let totalFailed = 0;

      while (hasMore) {
        const { data, error } = await supabase.functions.invoke("refresh-market-prices");

        if (error) throw error;

        totalRefreshed += data.updated || 0;
        totalFailed += data.failed || 0;
        hasMore = data.hasMore || false;

        setPricesRefreshed(totalRefreshed);
        setPricesFailed(totalFailed);

        if (!hasMore) {
          toast({
            title: "Price refresh complete!",
            description: `Updated ${totalRefreshed} prices, ${totalFailed} failed`,
          });
        }

        // Small delay between batches
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error: any) {
      toast({
        title: "Price refresh failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRefreshingPrices(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Import Pokemon Products
          </DialogTitle>
          <DialogDescription>
            Import cards to build your searchable catalog. Sealed products are fetched live from Scrydex API when you search.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="prices">
              <Download className="w-4 h-4 mr-2" />
              Prices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-4 py-4">
            {!importing && totalImported === 0 && totalUpdated === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Import ~19,750 Pokemon cards with official images from Pokemon TCG API
                </p>
                <Button 
                  onClick={() => handleImport(false)}
                  className="w-full shadow-gold hover:shadow-gold-strong"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Start Card Import
                </Button>
              </div>
            )}

            {importing && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{status}</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">New Cards</p>
                    <p className="text-2xl font-bold text-primary">{totalImported}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Updated</p>
                    <p className="text-2xl font-bold text-primary">{totalUpdated}</p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setBackgroundImport(true);
                    onOpenChange(false);
                    toast({
                      title: "Import continues in background",
                      description: "You can keep using the app",
                    });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Run in Background
                </Button>
              </div>
            )}

            {!importing && (totalImported > 0 || totalUpdated > 0) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">{status}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-muted/20 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">New Cards</p>
                    <p className="text-2xl font-bold text-primary">{totalImported}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Updated</p>
                    <p className="text-2xl font-bold text-primary">{totalUpdated}</p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    saveState("productsImportState", { running: false, currentPage: 1, totalPages: 1, totals: { imported: 0, updated: 0 } });
                    setTotalImported(0);
                    setTotalUpdated(0);
                    setProgress(0);
                    setStatus("");
                    handleImport(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Restart Import from Beginning
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="prices" className="space-y-4 py-4">
            {!refreshingPrices && pricesRefreshed === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Refresh market prices for all cards in your database. This fetches current TCG market prices and stores them for instant loading.
                </p>
                <Button 
                  onClick={handlePriceRefresh}
                  className="w-full shadow-gold hover:shadow-gold-strong"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Refresh Market Prices
                </Button>
              </div>
            )}

            {refreshingPrices && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Fetching prices from Pokemon TCG API...</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Updated</p>
                    <p className="text-2xl font-bold text-primary">{pricesRefreshed}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-destructive">{pricesFailed}</p>
                  </div>
                </div>
              </div>
            )}

            {!refreshingPrices && pricesRefreshed > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">Price refresh complete!</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-muted/20 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Updated</p>
                    <p className="text-2xl font-bold text-primary">{pricesRefreshed}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-destructive">{pricesFailed}</p>
                  </div>
                </div>

                <Button 
                  onClick={handlePriceRefresh}
                  variant="outline"
                  className="w-full"
                >
                  Refresh Again
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
