import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImportProgressBanner() {
  const [importState, setImportState] = useState<any>(null);

  useEffect(() => {
    const checkProgress = () => {
      try {
        const saved = localStorage.getItem("productsImportState");
        if (saved) {
          const state = JSON.parse(saved);
          setImportState(state);
        } else {
          setImportState(null);
        }
      } catch {
        setImportState(null);
      }
    };

    // Check immediately
    checkProgress();

    // Update every 2 seconds while import is running
    const interval = setInterval(checkProgress, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!importState?.running) {
    return null;
  }

  const { currentPage = 1, totalPages = 1, totals = { imported: 0, updated: 0 } } = importState;
  const progress = totalPages > 0 ? Math.min(100, (currentPage / totalPages) * 100) : 0;
  const isComplete = currentPage >= totalPages;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/40 bg-card backdrop-blur-sm mb-6">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      
      <CardContent className="pt-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
              ) : (
                <Download className="h-6 w-6 text-primary animate-pulse shrink-0" />
              )}
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {isComplete ? "Import Complete!" : "Importing Product Database"}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isComplete 
                    ? `Successfully imported ${totals.imported.toLocaleString()} new cards and updated ${totals.updated.toLocaleString()}`
                    : `Processing page ${currentPage} of ${totalPages}...`
                  }
                </p>
              </div>
            </div>
            {isComplete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("productsImportState");
                  setImportState(null);
                }}
              >
                Dismiss
              </Button>
            )}
          </div>

          {!isComplete && (
            <>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {Math.round(progress)}% complete
                </span>
                <span className="font-medium text-primary">
                  {totals.imported.toLocaleString()} new · {totals.updated.toLocaleString()} updated
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </Card>
  );
}
