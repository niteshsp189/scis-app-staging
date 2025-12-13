import { currencyService } from '@/services/currencyService';

/**
 * Format a number as currency using organization settings
 * @param value Number to format
 * @param currency Currency code override (optional)
 * @returns Formatted currency string
 */
export const formatCurrency = async (value: number | string, currency?: string): Promise<string> => {
  return await currencyService.formatCurrency(value, currency);
};

/**
 * Format a number as currency synchronously (requires currency settings to be pre-loaded)
 * @param value Number to format
 * @param currency Currency code override (optional)
 * @returns Formatted currency string
 */
export const formatCurrencySync = (value: number | string, currency?: string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '$0.00';
  }
  
  return currencyService.formatCurrencySync(numValue, undefined, currency);
};

/**
 * Legacy format function for backward compatibility
 * @param value Number to format
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrencyLegacy = (value: number | string, currency = 'USD'): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Format a date string to a localized date string
 * @param dateString Date string to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Format a percentage
 * @param value Number to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};
