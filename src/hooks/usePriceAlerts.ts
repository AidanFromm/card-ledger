/**
 * Price Alerts Hook
 * 
 * Manages price alerts for cards:
 * - Set target buy/sell prices
 * - Check alerts on price refresh
 * - Persistent storage
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// ============================================
// Types
// ============================================

export interface PriceAlert {
  id: string;
  itemId: string;
  itemName: string;
  setName: string;
  imageUrl?: string;
  type: 'above' | 'below';
  targetPrice: number;
  currentPrice?: number;
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
}

export interface UsePriceAlertsReturn {
  alerts: PriceAlert[];
  activeAlerts: PriceAlert[];
  triggeredAlerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  removeAlert: (id: string) => void;
  clearTriggered: () => void;
  checkAlerts: (prices: Map<string, number>) => PriceAlert[];
  hasAlert: (itemId: string) => boolean;
  getAlertForItem: (itemId: string) => PriceAlert | undefined;
}

// ============================================
// Storage
// ============================================

const STORAGE_KEY = 'cardledger_price_alerts';

function loadAlerts(): PriceAlert[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return [];
}

function saveAlerts(alerts: PriceAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // Storage full
  }
}

// ============================================
// Hook
// ============================================

export function usePriceAlerts(): UsePriceAlertsReturn {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const { toast } = useToast();

  // Load on mount
  useEffect(() => {
    const loaded = loadAlerts();
    setAlerts(loaded);
  }, []);

  // Save on change
  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  // Active alerts (not triggered)
  const activeAlerts = alerts.filter(a => !a.triggered);
  
  // Triggered alerts
  const triggeredAlerts = alerts.filter(a => a.triggered);

  // Add new alert
  const addAlert = useCallback((
    alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>
  ) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      triggered: false,
    };

    setAlerts(prev => [...prev, newAlert]);

    toast({
      title: 'Price alert set',
      description: `Alert when ${alertData.itemName} goes ${alertData.type} $${alertData.targetPrice}`,
    });
  }, [toast]);

  // Remove alert
  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Clear all triggered alerts
  const clearTriggered = useCallback(() => {
    setAlerts(prev => prev.filter(a => !a.triggered));
  }, []);

  // Check alerts against new prices
  const checkAlerts = useCallback((prices: Map<string, number>): PriceAlert[] => {
    const triggered: PriceAlert[] = [];

    setAlerts(prev => {
      const updated = prev.map(alert => {
        if (alert.triggered) return alert;

        const currentPrice = prices.get(alert.itemId);
        if (currentPrice === undefined) return alert;

        let shouldTrigger = false;
        if (alert.type === 'above' && currentPrice >= alert.targetPrice) {
          shouldTrigger = true;
        } else if (alert.type === 'below' && currentPrice <= alert.targetPrice) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          const triggeredAlert: PriceAlert = {
            ...alert,
            currentPrice,
            triggered: true,
            triggeredAt: Date.now(),
          };
          triggered.push(triggeredAlert);
          return triggeredAlert;
        }

        return { ...alert, currentPrice };
      });

      return updated;
    });

    // Show notifications for triggered alerts
    for (const alert of triggered) {
      toast({
        title: '🔔 Price Alert Triggered!',
        description: `${alert.itemName} is now $${alert.currentPrice?.toFixed(2)} (${alert.type} $${alert.targetPrice})`,
      });
    }

    return triggered;
  }, [toast]);

  // Check if item has an alert
  const hasAlert = useCallback((itemId: string) => {
    return alerts.some(a => a.itemId === itemId && !a.triggered);
  }, [alerts]);

  // Get alert for item
  const getAlertForItem = useCallback((itemId: string) => {
    return alerts.find(a => a.itemId === itemId && !a.triggered);
  }, [alerts]);

  return {
    alerts,
    activeAlerts,
    triggeredAlerts,
    addAlert,
    removeAlert,
    clearTriggered,
    checkAlerts,
    hasAlert,
    getAlertForItem,
  };
}

export default usePriceAlerts;
