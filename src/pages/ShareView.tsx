import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Share2,
  Eye,
  Calendar,
  Package,
  Award,
  Box,
  AlertCircle,
  Home,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicShare } from "@/hooks/useSharing";
import { Logo } from "@/components/Logo";

const ShareView = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { share, items, loading, error } = usePublicShare(shareToken || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Share Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "This share link may have expired or been removed."}
          </p>
          <Link to="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Go to CardLedger
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const totalValue = share.show_values
    ? items.reduce((sum, item) => {
        const price = item.market_price || 0;
        return sum + price * item.quantity;
      }, 0)
    : null;

  const totalCost = share.show_purchase_prices
    ? items.reduce((sum, item) => sum + item.purchase_price * item.quantity, 0)
    : null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const getGradingBadge = (item: typeof items[0]) => {
    if (item.grading_company === "raw") {
      return (
        <Badge variant="secondary" className="text-xs">
          <Package className="h-3 w-3 mr-1" />
          Raw
        </Badge>
      );
    }
    return (
      <Badge className="text-xs bg-primary/80">
        <Award className="h-3 w-3 mr-1" />
        {item.grading_company.toUpperCase()} {item.grade}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo className="h-8 w-8" />
              <span className="font-semibold text-lg">CardLedger</span>
            </Link>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {share.view_count} views
              </span>
              {share.expires_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Expires {new Date(share.expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{share.title}</h1>
              {share.description && (
                <p className="text-muted-foreground">{share.description}</p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50">
              <Box className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{totalItems} Cards</span>
            </div>
            {totalValue !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success">
                <DollarSign className="h-5 w-5" />
                <span className="font-medium">
                  ${totalValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm opacity-80">Market Value</span>
              </div>
            )}
            {totalCost !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50">
                <span className="font-medium">
                  ${totalCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm text-muted-foreground">Cost Basis</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cards Grid */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Box className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Cards</h2>
            <p className="text-muted-foreground">
              This collection doesn't have any cards yet.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="group relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg"
              >
                {/* Card Image */}
                <div className="aspect-[3/4] bg-secondary/30 relative overflow-hidden">
                  {item.card_image_url ? (
                    <img
                      src={item.card_image_url}
                      alt={item.name}
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
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-medium">
                      ×{item.quantity}
                    </div>
                  )}

                  {/* Grading Badge */}
                  <div className="absolute bottom-2 left-2">
                    {getGradingBadge(item)}
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate mb-1" title={item.name}>
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {item.set_name}
                  </p>

                  {/* Price Info */}
                  {share.show_values && item.market_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-success">
                        ${item.market_price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {share.show_purchase_prices && (
                        <span className="text-xs text-muted-foreground">
                          Cost: ${item.purchase_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Logo className="h-5 w-5" />
            <span>Powered by CardLedger</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Track, organize, and share your card collection
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ShareView;
