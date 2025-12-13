import React, { useEffect, useState } from 'react';
import { currencyService } from '@/services/currencyService';

const CurrencyDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        setLoading(true);
        
        // Clear cache first to get fresh data
        currencyService.clearCache();
        
        // Get currency settings
        const settings = await currencyService.getCurrencySettings(true);
        
        // Test formatting
        const testAmounts = [123.45, 1234.56, 123456.78];
        const formattedAmounts = await Promise.all(
          testAmounts.map(async (amount) => ({
            original: amount,
            formatted: await currencyService.formatCurrency(amount)
          }))
        );

        setDebugInfo({
          settings,
          formattedAmounts,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Debug error:', error);
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadDebugInfo();
  }, []);

  const handleRefresh = async () => {
    const loadDebugInfo = async () => {
      try {
        setLoading(true);
        
        // Clear cache first to get fresh data
        currencyService.clearCache();
        
        // Get currency settings
        const settings = await currencyService.getCurrencySettings(true);
        
        // Test formatting
        const testAmounts = [123.45, 1234.56, 123456.78];
        const formattedAmounts = await Promise.all(
          testAmounts.map(async (amount) => ({
            original: amount,
            formatted: await currencyService.formatCurrency(amount)
          }))
        );

        setDebugInfo({
          settings,
          formattedAmounts,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Debug error:', error);
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    await loadDebugInfo();
  };

  if (loading) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Currency Service Debug</h1>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default CurrencyDebug;
