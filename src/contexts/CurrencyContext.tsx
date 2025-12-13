import React, { createContext, useContext, useEffect } from 'react';
import { currencyService } from '@/services/currencyService';
import { useCurrencySettings } from '@/hooks/useCurrency';

interface CurrencyContextType {
  settings: any;
  loading: boolean;
  error: string | null;
  refreshSettings: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrencyContext = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const { settings, loading, error, refreshSettings } = useCurrencySettings();

  // Preload currency settings on app start
  useEffect(() => {
    currencyService.preloadSettings();
  }, []);

  const value = {
    settings,
    loading,
    error,
    refreshSettings,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
