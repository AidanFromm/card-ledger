import { useState, useMemo } from "react";
import { Bell, BellOff, BellRing, Trash2, TrendingUp, TrendingDown, Filter, Plus, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { usePriceAlerts, PriceAlert } from "@/hooks/usePriceAlerts";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { useNavigate } from "react-router-dom";
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

type FilterType = 'all' | 'active' | 'triggered' | 'paused';

const Alerts = () => {
  const navigate = useNavigate();
  const { 
    alerts, 
    loading, 
    toggleAlert, 
    deleteAlert, 
    refetch,
    activeCount,
    triggeredCount,
    totalCount,
  } = usePriceAlerts();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<PriceAlert | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case 'active':
        return alerts.filter(a => a.is_active && !a.triggered_at);
      case 'triggered':
        return alerts.filter(a => a.triggered_at);
      case 'paused':
        return alerts.filter(a => !a.is_active);
      default:
        return alerts;
    }
  }, [alerts, filter]);

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: totalCount,
    active: activeCount,
    triggered: triggeredCount,
    paused: alerts.filter(a => !a.is_active).length,
  }), [alerts, totalCount, activeCount, triggeredCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteClick = (alert: PriceAlert) => {
    setAlertToDelete(alert);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (alertToDelete) {
      await deleteAlert(alertToDelete.id);
      setAlertToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted/30 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-20 bg-muted/20 rounded-full" />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted/20 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <BellRing className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Price Alerts</h1>
                <p className="text-sm text-muted-foreground">
                  {activeCount} active • {triggeredCount} triggered
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {(['all', 'active', 'triggered', 'paused'] as FilterType[]).map((filterType) => {
              const isSelected = filter === filterType;
              const count = filterCounts[filterType];
              const icons = {
                all: Bell,
                active: BellRing,
                triggered: TrendingUp,
                paused: BellOff,
              };
              const Icon = icons[filterType];
              
              return (
                <motion.button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="capitalize">{filterType}</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    isSelected ? 'bg-primary-foreground/20' : 'bg-muted/50'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Alerts List */}
          {filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredAlerts.map((alert, index) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    index={index}
                    onToggle={() => toggleAlert(alert.id)}
                    onDelete={() => handleDeleteClick(alert)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState filter={filter} onCreateAlert={() => navigate('/scan')} />
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="bg-card border-2 border-border/50">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Alert?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove the price alert for {alertToDelete?.card_name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

// Alert Card Component
interface AlertCardProps {
  alert: PriceAlert;
  index: number;
  onToggle: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number | null) => string;
  formatDate: (date: string) => string;
}

const AlertCard = ({ alert, index, onToggle, onDelete, formatCurrency, formatDate }: AlertCardProps) => {
  const isTriggered = !!alert.triggered_at;
  const isPaused = !alert.is_active;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.03 }}
      className={`relative p-4 rounded-2xl border-2 transition-all ${
        isTriggered
          ? 'bg-amber-500/10 border-amber-500/40'
          : isPaused
            ? 'bg-muted/20 border-border/30 opacity-60'
            : 'bg-card/50 border-border/40 hover:border-primary/30'
      }`}
    >
      {/* Triggered Badge */}
      {isTriggered && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg">
          TRIGGERED
        </div>
      )}

      <div className="flex gap-3">
        {/* Card Image */}
        {alert.card_image_url ? (
          <img
            src={alert.card_image_url}
            alt={alert.card_name}
            className="w-16 h-22 object-contain rounded-lg border border-border/40 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-22 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        {/* Alert Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{alert.card_name}</h3>
          {alert.set_name && (
            <p className="text-xs text-muted-foreground truncate">{alert.set_name}</p>
          )}

          {/* Price Info */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              {alert.direction === 'below' ? (
                <TrendingDown className="h-4 w-4 text-navy-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-sm font-semibold">
                {alert.direction} {formatCurrency(alert.target_price)}
              </span>
            </div>
            
            {alert.current_price && (
              <div className="text-xs text-muted-foreground">
                <span>Current: </span>
                <span className="font-semibold">{formatCurrency(alert.current_price)}</span>
              </div>
            )}
          </div>

          {/* Meta Info */}
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {isTriggered 
              ? `Triggered ${formatDate(alert.triggered_at!)}`
              : `Created ${formatDate(alert.created_at)}`
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5">
          <motion.button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-all ${
              alert.is_active
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}
            whileTap={{ scale: 0.9 }}
            title={alert.is_active ? 'Pause alert' : 'Activate alert'}
          >
            {alert.is_active ? (
              <BellRing className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </motion.button>
          
          <motion.button
            onClick={onDelete}
            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
            whileTap={{ scale: 0.9 }}
            title="Delete alert"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Empty State Component
const EmptyState = ({ filter, onCreateAlert }: { filter: FilterType; onCreateAlert: () => void }) => {
  const messages = {
    all: {
      icon: Bell,
      title: "No Price Alerts",
      description: "Set alerts on cards to get notified when prices change.",
    },
    active: {
      icon: BellRing,
      title: "No Active Alerts",
      description: "All your alerts are either triggered or paused.",
    },
    triggered: {
      icon: TrendingUp,
      title: "No Triggered Alerts",
      description: "Your alerts haven't been triggered yet. We'll notify you when prices hit your targets.",
    },
    paused: {
      icon: BellOff,
      title: "No Paused Alerts",
      description: "All your alerts are currently active.",
    },
  };

  const { icon: Icon, title, description } = messages[filter];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
        <Icon className="h-10 w-10 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
        {description}
      </p>
      {filter === 'all' && (
        <Button
          onClick={onCreateAlert}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Search Cards
        </Button>
      )}
    </motion.div>
  );
};

export default Alerts;
