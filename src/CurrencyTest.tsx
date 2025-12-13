import React from 'react';
import { Currency, CurrencyInput, CurrencyComparison } from './components/ui/currency';

const CurrencyTest: React.FC = () => {
  const [amount, setAmount] = React.useState<number>(1234.56);
  const [inputValue, setInputValue] = React.useState<number>(0);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Currency System Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Currency Display Component</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Small amount:</label>
            <Currency amount={125.50} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Large amount:</label>
            <Currency amount={999999.99} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Zero amount:</label>
            <Currency amount={0} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Decimal amount:</label>
            <Currency amount={0.75} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Currency Input Component</h2>
        <div className="w-64">
          <label className="block text-sm font-medium mb-2">Enter amount:</label>
          <CurrencyInput
            value={inputValue}
            onChange={setInputValue}
            placeholder="Enter amount"
          />
          <p className="text-sm text-gray-600 mt-2">
            Current value: <Currency amount={inputValue} />
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Currency Comparison Component</h2>
        <div className="space-y-2">
          <CurrencyComparison 
            oldAmount={amount} 
            newAmount={amount * 1.1} 
            label="Premium increase:"
          />
          <CurrencyComparison 
            oldAmount={amount} 
            newAmount={amount * 0.9} 
            label="Premium reduction:"
          />
          <CurrencyComparison 
            oldAmount={amount} 
            newAmount={amount} 
            label="No change:"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Dynamic Amount Test</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setAmount(amount * 1.5)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increase 50%
          </button>
          <button 
            onClick={() => setAmount(amount * 0.8)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Decrease 20%
          </button>
          <button 
            onClick={() => setAmount(1234.56)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-lg">Current amount: <Currency amount={amount} /></p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyTest;
