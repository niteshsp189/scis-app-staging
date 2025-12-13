import React from 'react';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface CurrencyProps {
  value: number | string;
  currency?: string;
  className?: string;
  showZero?: boolean;
  placeholder?: string;
}

export const Currency: React.FC<CurrencyProps> = ({
  value,
  currency,
  className,
  showZero = true,
  placeholder = '-',
}) => {
  const { formatCurrency, loading } = useCurrencyFormatter();

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle invalid or zero values
  if (isNaN(numValue) || (numValue === 0 && !showZero)) {
    return <span className={cn('text-muted-foreground', className)}>{placeholder}</span>;
  }

  if (loading) {
    return <span className={cn('animate-pulse', className)}>Loading...</span>;
  }

  const formattedValue = formatCurrency(numValue, currency);

  return (
    <span className={cn(className)} title={`${numValue}`}>
      {formattedValue}
    </span>
  );
};

// Component for editable currency inputs
interface CurrencyInputProps {
  value: number | string;
  onChange: (value: number) => void;
  currency?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency,
  className,
  placeholder,
  disabled = false,
  min,
  max,
  step = 0.01,
}) => {
  const { formatCurrency, parseCurrency, settings } = useCurrencyFormatter();
  const [displayValue, setDisplayValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  // Update display value when value prop changes
  React.useEffect(() => {
    if (!isFocused) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        setDisplayValue(formatCurrency(numValue, currency));
      } else {
        setDisplayValue('');
      }
    }
  }, [value, formatCurrency, currency, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number when focused for easier editing
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      setDisplayValue(numValue.toString());
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsedValue = parseFloat(displayValue) || 0;
    
    // Apply min/max constraints
    const constrainedValue = Math.min(Math.max(parsedValue, min ?? -Infinity), max ?? Infinity);
    
    onChange(constrainedValue);
    setDisplayValue(formatCurrency(constrainedValue, currency));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    if (isFocused) {
      // Allow raw number input when focused
      setDisplayValue(rawValue);
    } else {
      // Parse formatted input
      const parsedValue = parseCurrency(rawValue);
      setDisplayValue(rawValue);
      onChange(parsedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow enter to trigger blur (format)
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    />
  );
};

// Component for displaying currency with comparison
interface CurrencyComparisonProps {
  currentValue: number | string;
  previousValue: number | string;
  currency?: string;
  className?: string;
  showDifference?: boolean;
  showPercentage?: boolean;
}

export const CurrencyComparison: React.FC<CurrencyComparisonProps> = ({
  currentValue,
  previousValue,
  currency,
  className,
  showDifference = true,
  showPercentage = false,
}) => {
  const { formatCurrency } = useCurrencyFormatter();

  const current = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;
  const previous = typeof previousValue === 'string' ? parseFloat(previousValue) : previousValue;

  if (isNaN(current) || isNaN(previous)) {
    return <Currency value={current} currency={currency} className={className} />;
  }

  const difference = current - previous;
  const percentageChange = previous !== 0 ? (difference / previous) * 100 : 0;
  const isPositive = difference > 0;
  const isNegative = difference < 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Currency value={current} currency={currency} />
      
      {showDifference && difference !== 0 && (
        <span
          className={cn(
            'text-sm',
            isPositive && 'text-green-600',
            isNegative && 'text-red-600'
          )}
        >
          ({isPositive ? '+' : ''}{formatCurrency(difference, currency)}
          {showPercentage && ` / ${percentageChange.toFixed(1)}%`})
        </span>
      )}
    </div>
  );
};
