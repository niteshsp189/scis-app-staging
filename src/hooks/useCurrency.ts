import { useState, useEffect, useCallback } from 'react';
import { currencyService, type CurrencySettings } from '@/services/currencyService';

export const useCurrencySettings = () => {
  const [settings, setSettings] = useState<CurrencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const currencySettings = await currencyService.getCurrencySettings(forceRefresh);
      setSettings(currencySettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load currency settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    
    // Subscribe to cache refresh events
    const unsubscribe = currencyService.onRefresh(() => {
      loadSettings(true);
    });

    return unsubscribe;
  }, [loadSettings]);

  const refreshSettings = useCallback(() => {
    loadSettings(true);
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    refreshSettings,
  };
};

export const useCurrencyFormatter = () => {
  const { settings, loading } = useCurrencySettings();

  const formatCurrency = useCallback(
    (value: number | string, overrideCurrency?: string): string => {
      if (loading || !settings) {
        // Return a basic format while loading
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: overrideCurrency || 'USD',
        }).format(isNaN(numValue) ? 0 : numValue);
      }

      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return currencyService.formatCurrencySync(
        isNaN(numValue) ? 0 : numValue,
        settings,
        overrideCurrency
      );
    },
    [settings, loading]
  );

  const parseCurrency = useCallback(
    (formattedValue: string): number => {
      if (loading || !settings) {
        // Basic parsing while loading
        return parseFloat(formattedValue.replace(/[^\d.-]/g, '')) || 0;
      }

      return currencyService.parseCurrencySync(formattedValue, settings);
    },
    [settings, loading]
  );

  return {
    formatCurrency,
    parseCurrency,
    settings,
    loading,
  };
};
