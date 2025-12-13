import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { settingsService } from "@/services/settingsService";
import { currencyService } from "@/services/currencyService";
import { Currency } from "@/components/ui/currency";

export function CurrencySettings() {
  const [currencySettings, setCurrencySettings] = useState({
    baseCurrency: "USD",
    displayFormat: "symbol",
    decimalPlaces: 2,
    thousandsSeparator: "comma",
    decimalSeparator: "period",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCurrencySettings();
  }, []);

  const loadCurrencySettings = async () => {
    try {
      setLoading(true);
      const allSettings = await settingsService.getOrganizationSettings();

      // Extract currency settings
      const settings = {
        baseCurrency: allSettings["currency.base_currency"]?.value || "USD",
        displayFormat:
          allSettings["currency.display_format"]?.value || "symbol",
        decimalPlaces: allSettings["currency.decimal_places"]?.value || 2,
        thousandsSeparator:
          allSettings["currency.thousands_separator"]?.value || "comma",
        decimalSeparator:
          allSettings["currency.decimal_separator"]?.value || "period",
      };

      setCurrencySettings(settings);
    } catch (error) {
      console.error("Failed to load currency settings:", error);
      toast({
        title: "Error",
        description: "Failed to load currency settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrencySettings = async () => {
    try {
      setSaving(true);

      const settingsToUpdate = {
        currency: {
          base_currency: currencySettings.baseCurrency,
          display_format: currencySettings.displayFormat,
          decimal_places: currencySettings.decimalPlaces,
          thousands_separator: currencySettings.thousandsSeparator,
          decimal_separator: currencySettings.decimalSeparator,
        },
      };

      await settingsService.updateOrganizationSettings(settingsToUpdate);

      // Clear currency service cache to force refresh
      currencyService.clearCache();

      // Trigger a refresh of preview components
      setRefreshKey(prev => prev + 1);

      toast({
        title: "Currency Settings Saved",
        description: "Currency display preferences have been updated.",
      });
    } catch (error) {
      console.error("Failed to save currency settings:", error);
      toast({
        title: "Error",
        description: "Failed to save currency settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Settings
          </CardTitle>
          <CardDescription>
            Configure how currency is displayed throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading currency settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Currency Settings
        </CardTitle>
        <CardDescription>
          Configure how currency is displayed throughout the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="baseCurrency">Base Currency</Label>
            <Select
              value={currencySettings.baseCurrency}
              onValueChange={(value) =>
                setCurrencySettings({
                  ...currencySettings,
                  baseCurrency: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="displayFormat">Display Format</Label>
            <Select
              value={currencySettings.displayFormat}
              onValueChange={(value) =>
                setCurrencySettings({
                  ...currencySettings,
                  displayFormat: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="symbol">Symbol ($1,234.56)</SelectItem>
                <SelectItem value="code">Code (USD 1,234.56)</SelectItem>
                <SelectItem value="name">Name (1,234.56 US Dollar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="decimalPlaces">Decimal Places</Label>
            <Input
              id="decimalPlaces"
              type="number"
              min="0"
              max="4"
              value={currencySettings.decimalPlaces}
              onChange={(e) =>
                setCurrencySettings({
                  ...currencySettings,
                  decimalPlaces: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="thousandsSep">Thousands Separator</Label>
            <Select
              value={currencySettings.thousandsSeparator}
              onValueChange={(value) =>
                setCurrencySettings({
                  ...currencySettings,
                  thousandsSeparator: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comma">, (Comma)</SelectItem>
                <SelectItem value="period">. (Period)</SelectItem>
                <SelectItem value="space"> (Space)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="decimalSep">Decimal Separator</Label>
            <Select
              value={currencySettings.decimalSeparator}
              onValueChange={(value) =>
                setCurrencySettings({
                  ...currencySettings,
                  decimalSeparator: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="period">. (Period)</SelectItem>
                <SelectItem value="comma">, (Comma)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Small Amount</p>
              <Currency 
                value={123.45} 
                key={`small-${refreshKey}-${currencySettings.baseCurrency}`}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Medium Amount</p>
              <Currency 
                value={1234.56} 
                key={`medium-${refreshKey}-${currencySettings.baseCurrency}`}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Large Amount</p>
              <Currency 
                value={123456.78} 
                key={`large-${refreshKey}-${currencySettings.baseCurrency}`}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSaveCurrencySettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Currency Settings
        </Button>
      </CardContent>
    </Card>
  );
}
