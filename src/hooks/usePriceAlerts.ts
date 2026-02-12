import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PriceAlert {
  id: string;
  user_id: string;
  card_id: string;
  card_name: string;
  set_name: string | null;
  card_image_url: string | null;
  current_price: number | null;
  target_price: number;
  direction: 'above' | 'below';
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertParams {
  card_id: string;
  card_name: string;
  set_name?: string | null;
  card_image_url?: string | null;
  current_price?: number | null;
  target_price: number;
  direction: 'above' | 'below';
}

const ALERTS_LIMIT = 50; // Max alerts per user

export const usePriceAlerts = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAlerts([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAlerts((data as PriceAlert[]) || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching price alerts:', err);
      setError(err.message);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Create a new alert
  const createAlert = useCallback(async (params: CreateAlertParams): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not authenticated',
          description: 'Please sign in to set price alerts.',
        });
        return false;
      }

      // Check limit
      if (alerts.length >= ALERTS_LIMIT) {
        toast({
          variant: 'destructive',
          title: 'Alert limit reached',
          description: `You can only have up to ${ALERTS_LIMIT} price alerts.`,
        });
        return false;
      }

      // Check for existing alert on same card with same direction
      const existing = alerts.find(
        a => a.card_id === params.card_id && a.direction === params.direction && a.is_active
      );
      if (existing) {
        toast({
          variant: 'destructive',
          title: 'Alert already exists',
          description: `You already have an active "${params.direction}" alert for this card.`,
        });
        return false;
      }

      const { error: insertError } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          card_id: params.card_id,
          card_name: params.card_name,
          set_name: params.set_name || null,
          card_image_url: params.card_image_url || null,
          current_price: params.current_price || null,
          target_price: params.target_price,
          direction: params.direction,
          is_active: true,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Alert created',
        description: `You'll be notified when ${params.card_name} goes ${params.direction} $${params.target_price.toFixed(2)}`,
      });

      await fetchAlerts();
      return true;
    } catch (err: any) {
      console.error('Error creating alert:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to create alert',
        description: err.message,
      });
      return false;
    }
  }, [alerts, toast, fetchAlerts]);

  // Toggle alert active status
  const toggleAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      if (!alert) return false;

      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({ 
          is_active: !alert.is_active,
          triggered_at: null, // Reset triggered status when reactivating
        })
        .eq('id', alertId);

      if (updateError) throw updateError;

      toast({
        title: alert.is_active ? 'Alert paused' : 'Alert activated',
        description: alert.is_active 
          ? 'You won\'t receive notifications for this alert.'
          : 'Alert is now active and monitoring prices.',
      });

      await fetchAlerts();
      return true;
    } catch (err: any) {
      console.error('Error toggling alert:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to update alert',
        description: err.message,
      });
      return false;
    }
  }, [alerts, toast, fetchAlerts]);

  // Delete an alert
  const deleteAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Alert deleted',
        description: 'Price alert has been removed.',
      });

      await fetchAlerts();
      return true;
    } catch (err: any) {
      console.error('Error deleting alert:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to delete alert',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchAlerts]);

  // Update target price
  const updateTargetPrice = useCallback(async (alertId: string, newPrice: number): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({ 
          target_price: newPrice,
          triggered_at: null, // Reset triggered status when updating price
        })
        .eq('id', alertId);

      if (updateError) throw updateError;

      toast({
        title: 'Alert updated',
        description: `Target price changed to $${newPrice.toFixed(2)}`,
      });

      await fetchAlerts();
      return true;
    } catch (err: any) {
      console.error('Error updating alert:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to update alert',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchAlerts]);

  // Check if card has an active alert
  const hasAlert = useCallback((cardId: string, direction?: 'above' | 'below'): boolean => {
    return alerts.some(a => 
      a.card_id === cardId && 
      a.is_active && 
      (direction ? a.direction === direction : true)
    );
  }, [alerts]);

  // Get alert for a specific card
  const getAlertForCard = useCallback((cardId: string): PriceAlert | undefined => {
    return alerts.find(a => a.card_id === cardId);
  }, [alerts]);

  // Computed values
  const activeAlerts = alerts.filter(a => a.is_active && !a.triggered_at);
  const triggeredAlerts = alerts.filter(a => a.triggered_at);
  const pausedAlerts = alerts.filter(a => !a.is_active);

  return {
    alerts,
    loading,
    error,
    createAlert,
    toggleAlert,
    deleteAlert,
    updateTargetPrice,
    hasAlert,
    getAlertForCard,
    refetch: fetchAlerts,
    // Computed
    activeAlerts,
    triggeredAlerts,
    pausedAlerts,
    activeCount: activeAlerts.length,
    triggeredCount: triggeredAlerts.length,
    totalCount: alerts.length,
    limit: ALERTS_LIMIT,
    isFull: alerts.length >= ALERTS_LIMIT,
  };
};

export default usePriceAlerts;
