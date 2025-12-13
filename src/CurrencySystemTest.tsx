import React, { useEffect, useState } from 'react';
import { Currency } from '@/components/ui/currency';
import { currencyService } from '@/services/currencyService';

const CurrencySystemTest: React.FC = () => {
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await currencyService.getCurrencySettings(true);
        setCurrentSettings(settings);
      } catch (error) {
        console.error('Failed to load currency settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const testAmounts = [
    123.45,
    1234.56,
    33331.34,
    1390.75,
    1590.00,
    2250.00,
    875.25
  ];

  if (loading) {
    return <div className="p-8">Loading currency settings...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Currency System Test</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Current Currency Settings:</h2>
        <pre className="text-sm">{JSON.stringify(currentSettings, null, 2)}</pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Test Amounts (should show ₹ if INR is configured):</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {testAmounts.map((amount, index) => (
            <div key={index} className="bg-white p-4 rounded border">
              <div className="text-sm text-gray-500">Amount {index + 1}:</div>
              <div className="text-lg font-semibold">
                <Currency value={amount} />
              </div>
              <div className="text-xs text-gray-400">Raw: {amount}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Expected Behavior:</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>If currency is set to INR in settings, all amounts should show ₹ symbol</li>
          <li>If currency is set to USD, amounts should show $ symbol</li>
          <li>The formatting should respect thousands separator and decimal places settings</li>
        </ul>
      </div>
    </div>
  );
};

export default CurrencySystemTest;
