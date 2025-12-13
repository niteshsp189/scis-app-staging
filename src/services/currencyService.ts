import { settingsService } from './settingsService';
import { api } from '../lib/axios';

export interface CurrencySettings {
  base_currency: string;
  display_format: 'symbol' | 'code' | 'name';
  decimal_places: number;
  thousands_separator: 'comma' | 'period' | 'space';
  decimal_separator: 'period' | 'comma';
  symbol: string;
  name: string;
}

class CurrencyService {
  private static instance: CurrencyService;
  private currencySettings: CurrencySettings | null = null;
  private settingsPromise: Promise<CurrencySettings> | null = null;
  private refreshCallbacks: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Get currency settings from the server
   */
  async getCurrencySettings(forceRefresh = false): Promise<CurrencySettings> {
    if (this.currencySettings && !forceRefresh) {
      return this.currencySettings;
    }

    if (this.settingsPromise && !forceRefresh) {
      return this.settingsPromise;
    }

    this.settingsPromise = this.fetchCurrencySettings();
    this.currencySettings = await this.settingsPromise;
    this.settingsPromise = null;

    return this.currencySettings;
  }

  private async fetchCurrencySettings(): Promise<CurrencySettings> {
    try {
      const response = await api.get('/currency-settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching currency settings:', error);
      // Return default settings if fetch fails
      return {
        base_currency: 'USD',
        display_format: 'symbol',
        decimal_places: 2,
        thousands_separator: 'comma',
        decimal_separator: 'period',
        symbol: '$',
        name: 'US Dollar',
      };
    }
  }

  /**
   * Format a number as currency using organization settings
   */
  async formatCurrency(
    value: number | string,
    overrideCurrency?: string
  ): Promise<string> {
    const settings = await this.getCurrencySettings();
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return this.formatCurrencySync(0, settings, overrideCurrency);
    }

    return this.formatCurrencySync(numValue, settings, overrideCurrency);
  }

  /**
   * Format currency synchronously (requires settings to be pre-loaded)
   */
  formatCurrencySync(
    value: number,
    settings?: CurrencySettings,
    overrideCurrency?: string
  ): string {
    const currencySettings = settings || this.currencySettings;
    
    if (!currencySettings) {
      // Fallback to default formatting
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: overrideCurrency || 'USD',
      }).format(value);
    }

    const currency = overrideCurrency || currencySettings.base_currency;
    
    // Get separator characters
    const thousandsSeparator = this.getSeparatorChar(currencySettings.thousands_separator);
    const decimalSeparator = this.getSeparatorChar(currencySettings.decimal_separator);
    
    // Format the number
    const formattedNumber = this.formatNumber(
      value,
      currencySettings.decimal_places,
      decimalSeparator,
      thousandsSeparator
    );

    // Apply display format
    return this.applyDisplayFormat(
      formattedNumber,
      currency,
      currencySettings.display_format
    );
  }

  /**
   * Parse a formatted currency string back to number
   */
  async parseCurrency(formattedAmount: string): Promise<number> {
    const settings = await this.getCurrencySettings();
    return this.parseCurrencySync(formattedAmount, settings);
  }

  /**
   * Parse currency synchronously
   */
  parseCurrencySync(formattedAmount: string, settings?: CurrencySettings): number {
    const currencySettings = settings || this.currencySettings;
    
    if (!currencySettings) {
      // Fallback parsing
      return parseFloat(formattedAmount.replace(/[^\d.-]/g, '')) || 0;
    }

    // Remove currency symbols and text
    let cleanAmount = formattedAmount.replace(/[^\d.,\-]/g, '');
    
    // Handle different decimal separators
    if (currencySettings.decimal_separator === 'comma') {
      // If comma is decimal separator, replace it with period for parsing
      const lastCommaIndex = cleanAmount.lastIndexOf(',');
      const lastPeriodIndex = cleanAmount.lastIndexOf('.');
      
      if (lastCommaIndex > lastPeriodIndex) {
        // Comma is likely the decimal separator
        cleanAmount = cleanAmount.substring(0, lastCommaIndex) + 
                     '.' + 
                     cleanAmount.substring(lastCommaIndex + 1);
        // Remove thousands separators (periods in this case)
        cleanAmount = cleanAmount.replace(/\./g, '').replace(/,/g, '.');
      }
    } else {
      // Period is decimal separator, remove thousands separators first
      if (currencySettings.thousands_separator === 'comma') {
        const parts = cleanAmount.split('.');
        if (parts.length > 1) {
          // Keep only the last period as decimal separator
          const decimalPart = parts.pop();
          const integerPart = parts.join('').replace(/,/g, '');
          cleanAmount = integerPart + '.' + decimalPart;
        } else {
          cleanAmount = cleanAmount.replace(/,/g, '');
        }
      }
    }

    return parseFloat(cleanAmount) || 0;
  }

  /**
   * Get available currencies
   */
  getAvailableCurrencies(): Array<{ code: string; name: string; symbol: string }> {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
      { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
      { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
      { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
      { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
      { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
      { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
      { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
      { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
      { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
      { code: 'THB', name: 'Thai Baht', symbol: '฿' },
      { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
      { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
      { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
      { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    ];
  }

  /**
   * Clear cached settings (call after currency settings update)
   */
  clearCache(): void {
    this.currencySettings = null;
    this.settingsPromise = null;
    // Notify all subscribers about the cache clear
    this.refreshCallbacks.forEach(callback => callback());
  }

  /**
   * Clear cache on server
   */
  async clearServerCache(): Promise<void> {
    try {
      await api.post('/clear-currency-cache');
    } catch (error) {
      console.error('Error clearing currency cache:', error);
    }
  }

  /**
   * Subscribe to cache refresh events
   */
  onRefresh(callback: () => void): () => void {
    this.refreshCallbacks.add(callback);
    return () => {
      this.refreshCallbacks.delete(callback);
    };
  }

  /**
   * Preload currency settings
   */
  async preloadSettings(): Promise<void> {
    await this.getCurrencySettings();
  }

  // Private helper methods

  private getSeparatorChar(separatorType: string): string {
    switch (separatorType) {
      case 'comma':
        return ',';
      case 'period':
        return '.';
      case 'space':
        return ' ';
      default:
        return ',';
    }
  }

  private formatNumber(
    value: number,
    decimalPlaces: number,
    decimalSeparator: string,
    thousandsSeparator: string
  ): string {
    const fixed = value.toFixed(decimalPlaces);
    const parts = fixed.split('.');
    
    // Add thousands separators to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    // Replace decimal separator if needed
    if (decimalSeparator !== '.') {
      return parts.join(decimalSeparator);
    }
    
    return parts.join('.');
  }

  private applyDisplayFormat(
    formattedNumber: string,
    currency: string,
    format: string
  ): string {
    // Get symbol from our currency mapping
    const currencySymbol = this.getCurrencySymbol(currency);
    
    switch (format) {
      case 'symbol':
        return currencySymbol + formattedNumber;
      case 'code':
        return currency + ' ' + formattedNumber;
      case 'name':
        const currencyName = this.getAvailableCurrencies().find(c => c.code === currency)?.name || currency;
        return formattedNumber + ' ' + currencyName;
      default:
        return currencySymbol + formattedNumber;
    }
  }

  private getCurrencySymbol(currency: string): string {
    const currencyInfo = this.getAvailableCurrencies().find(c => c.code === currency);
    return currencyInfo?.symbol || currency;
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance();

// Export React hook for currency formatting
export const useCurrency = () => {
  return {
    formatCurrency: currencyService.formatCurrency.bind(currencyService),
    formatCurrencySync: currencyService.formatCurrencySync.bind(currencyService),
    parseCurrency: currencyService.parseCurrency.bind(currencyService),
    parseCurrencySync: currencyService.parseCurrencySync.bind(currencyService),
    getCurrencySettings: currencyService.getCurrencySettings.bind(currencyService),
    getAvailableCurrencies: currencyService.getAvailableCurrencies.bind(currencyService),
    clearCache: currencyService.clearCache.bind(currencyService),
    onRefresh: currencyService.onRefresh.bind(currencyService),
    preloadSettings: currencyService.preloadSettings.bind(currencyService),
  };
};
