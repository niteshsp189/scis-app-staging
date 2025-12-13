import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp, Search } from "lucide-react";
import globalSearchService, { SearchFilters, FilterOptions } from "@/services/globalSearchService";
import LookupService from "@/services/lookupService";
import { toast } from "sonner";

interface AdvancedSearchPanelProps {
  filters: Partial<SearchFilters>;
  onChange: (filters: Partial<SearchFilters>) => void;
  onClear: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const AdvancedSearchPanel = ({ filters, onChange, onClear, isExpanded, onToggle }: AdvancedSearchPanelProps) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [zipSuggestions, setZipSuggestions] = useState<Array<{ zip_code: string; city: string; state_abbr: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (filters.state) {
      loadCitiesByState(filters.state);
    }
  }, [filters.state]);

  const loadFilterOptions = async () => {
    setIsLoading(true);
    try {
      const options = await globalSearchService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      toast.error('Failed to load filter options');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCitiesByState = async (stateAbbr: string) => {
    try {
      const cities = await globalSearchService.getCitiesByState(stateAbbr);
      setCityOptions(cities);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const handleZipSearch = async (query: string) => {
    if (query.length >= 2) {
      try {
        const results = await globalSearchService.searchZipCodes(query);
        setZipSuggestions(results);
      } catch (error) {
        console.error('Failed to search zip codes:', error);
      }
    } else {
      setZipSuggestions([]);
    }
  };

  const handleZipCodeSearch = async () => {
    if (!filters.zip_code?.trim()) {
      toast.error("Please enter a zip code first");
      return;
    }

    try {
      const locationData = await LookupService.searchZipByCode(filters.zip_code);

      if (locationData && locationData.length > 0) {
        const zipData = locationData[0]; // Take the first match
        const stateName = zipData.state?.name || zipData.state_abbr;
        
        updateFilter('state', stateName);
        updateFilter('city', zipData.city);
        
        toast.success("Location data filled automatically");
      } else {
        toast.info("No location data found for this zip code. Please enter the state and city manually.");
      }
    } catch (error) {
      console.error("Error searching zip code:", error);
      toast.error("Failed to search zip code");
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onChange(newFilters);
  };

  if (!isExpanded) {
    return (
      <Button variant="outline" onClick={onToggle} className="w-full">
        <ChevronDown className="h-4 w-4 mr-2" />
        Advanced Search
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Advanced Search Filters</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear All
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading filters...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Customer Type */}
            <div className="space-y-2">
              <Label htmlFor="customer-type">Customer Type</Label>
              <Select
                value={filters.customer_type || "any"}
                onValueChange={(value) => updateFilter('customer_type', value === 'any' ? undefined : value)}
              >
                <SelectTrigger id="customer-type">
                  <SelectValue placeholder="ANY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.customer_types.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee */}
            {filterOptions?.employees && filterOptions.employees.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={filters.employee_id || "any"}
                  onValueChange={(value) => updateFilter('employee_id', value === 'any' ? undefined : value)}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="ANY" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">ANY</SelectItem>
                    {filterOptions.employees.map(option => (
                      <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Agent Type */}
            <div className="space-y-2">
              <Label htmlFor="agent-type">Agent Type</Label>
              <Select
                value={filters.agent_type || "any"}
                onValueChange={(value) => updateFilter('agent_type', value === 'any' ? undefined : value)}
              >
                <SelectTrigger id="agent-type">
                  <SelectValue placeholder="ANY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.agent_types.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={filters.gender || "any"}
                onValueChange={(value) => updateFilter('gender', value === 'any' ? undefined : value)}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="ANY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.genders.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Referral */}
            <div className="space-y-2">
              <Label htmlFor="referral">Referral Source</Label>
              <Select
                value={filters.referral_id ? String(filters.referral_id) : "any"}
                onValueChange={(value) => updateFilter('referral_id', value === 'any' ? undefined : Number(value))}
              >
                <SelectTrigger id="referral">
                  <SelectValue placeholder="ANY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.referral_sources.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Policy Status */}
            <div className="space-y-2">
              <Label htmlFor="policy-status">Policy Status</Label>
              <Select
                value={filters.policy_status || "any"}
                onValueChange={(value) => updateFilter('policy_status', value === 'any' ? undefined : value)}
              >
                <SelectTrigger id="policy-status">
                  <SelectValue placeholder="ANY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.policy_statuses.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Smoker */}
            <div className="space-y-2">
              <Label htmlFor="smoker">Smoker</Label>
              <Select
                value={filters.smoker || "any"}
                onValueChange={(value) => updateFilter('smoker', value === 'any' ? undefined : value)}
              >
                <SelectTrigger id="smoker">
                  <SelectValue placeholder="ANY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.smoker_options.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zip Code */}
            <div className="space-y-2">
              <Label htmlFor="zip-code">Zip Code</Label>
              <div className="relative">
                <Input
                  id="zip-code"
                  value={filters.zip_code || ""}
                  onChange={(e) => {
                    updateFilter('zip_code', e.target.value);
                    handleZipSearch(e.target.value);
                  }}
                  placeholder="Enter zip code..."
                  className="pr-16" // Add padding-right to make room for both buttons
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-8 top-0 h-full px-2 hover:bg-muted"
                  onClick={handleZipCodeSearch}
                  title="Search location by zip code"
                >
                  <Search className="h-4 w-4" />
                </Button>
                {filters.zip_code && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-muted"
                    onClick={() => clearFilter('zip_code')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                value={filters.state || "any"}
                onValueChange={(value) => updateFilter('state', value === 'any' ? undefined : value)}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="ANY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.states.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={filters.city || ""}
                onChange={(e) => updateFilter('city', e.target.value)}
                placeholder="Enter city..."
              />
            </div>

            {/* Birthday From */}
            <div className="space-y-2">
              <Label htmlFor="birthday-from">Birthday From</Label>
              <DateInput
                id="birthday-from"
                value={filters.birthday_from || ""}
                onChange={(value) => updateFilter('birthday_from', value)}
                placeholder="Select date..."
              />
            </div>

            {/* Birthday To */}
            <div className="space-y-2">
              <Label htmlFor="birthday-to">Birthday To</Label>
              <DateInput
                id="birthday-to"
                value={filters.birthday_to || ""}
                onChange={(value) => updateFilter('birthday_to', value)}
                placeholder="Select date..."
              />
            </div>

            {/* Age From */}
            <div className="space-y-2">
              <Label htmlFor="age-from">Age From</Label>
              <Input
                id="age-from"
                type="number"
                min="0"
                max="150"
                value={filters.age_from || ""}
                onChange={(e) => updateFilter('age_from', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Min age..."
              />
            </div>

            {/* Age To */}
            <div className="space-y-2">
              <Label htmlFor="age-to">Age To</Label>
              <Input
                id="age-to"
                type="number"
                min="0"
                max="150"
                value={filters.age_to || ""}
                onChange={(e) => updateFilter('age_to', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Max age..."
              />
            </div>

            {/* Premium From */}
            <div className="space-y-2">
              <Label htmlFor="premium-from">Premium From</Label>
              <Input
                id="premium-from"
                type="number"
                min="0"
                step="0.01"
                value={filters.premium_from || ""}
                onChange={(e) => updateFilter('premium_from', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Min premium..."
              />
            </div>

            {/* Premium To */}
            <div className="space-y-2">
              <Label htmlFor="premium-to">Premium To</Label>
              <Input
                id="premium-to"
                type="number"
                min="0"
                step="0.01"
                value={filters.premium_to || ""}
                onChange={(e) => updateFilter('premium_to', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Max premium..."
              />
            </div>

            {/* Effective Date From */}
            <div className="space-y-2">
              <Label htmlFor="effective-date-from">Effective Date From</Label>
              <DateInput
                id="effective-date-from"
                value={filters.effective_date_from || ""}
                onChange={(value) => updateFilter('effective_date_from', value)}
                placeholder="Select date..."
              />
            </div>

            {/* Effective Date To */}
            <div className="space-y-2">
              <Label htmlFor="effective-date-to">Effective Date To</Label>
              <DateInput
                id="effective-date-to"
                value={filters.effective_date_to || ""}
                onChange={(value) => updateFilter('effective_date_to', value)}
                placeholder="Select date..."
              />
            </div>

            {/* Insurance Type */}
            <div className="space-y-2">
              <Label htmlFor="insurance-type">Insurance Type</Label>
              <Select
                value={filters.insurance_type_id ? String(filters.insurance_type_id) : "any"}
                onValueChange={(value) => updateFilter('insurance_type_id', value === 'any' ? undefined : Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger id="insurance-type">
                  <SelectValue placeholder={isLoading ? "Loading..." : "ANY"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.insurance_types.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select
                value={filters.company_id ? String(filters.company_id) : "any"}
                onValueChange={(value) => updateFilter('company_id', value === 'any' ? undefined : Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger id="company">
                  <SelectValue placeholder={isLoading ? "Loading..." : "ANY"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.companies.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan */}
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select
                value={filters.plan_id ? String(filters.plan_id) : "any"}
                onValueChange={(value) => updateFilter('plan_id', value === 'any' ? undefined : Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger id="plan">
                  <SelectValue placeholder={isLoading ? "Loading..." : "ANY"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ANY</SelectItem>
                  {filterOptions?.plans.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Policy Number */}
            <div className="space-y-2">
              <Label htmlFor="policy-number">Policy #</Label>
              <Input
                id="policy-number"
                value={filters.policy_number || ""}
                onChange={(e) => updateFilter('policy_number', e.target.value)}
                placeholder="Enter policy number..."
              />
            </div>

            {/* Don't Call */}
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="dont-call"
                checked={filters.is_in_dont_call_list || false}
                onCheckedChange={(checked) => updateFilter('is_in_dont_call_list', checked)}
              />
              <Label htmlFor="dont-call" className="cursor-pointer">Don't Call</Label>
            </div>

            {/* Client Book */}
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="client-book"
                checked={filters.is_in_client_book || false}
                onCheckedChange={(checked) => updateFilter('is_in_client_book', checked)}
              />
              <Label htmlFor="client-book" className="cursor-pointer">Client Book</Label>
            </div>

            {/* No Cancelled Policies */}
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="exclude-cancelled"
                checked={filters.exclude_cancelled || false}
                onCheckedChange={(checked) => updateFilter('exclude_cancelled', checked)}
              />
              <Label htmlFor="exclude-cancelled" className="cursor-pointer">No Cancelled Policies</Label>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <Select
                value={filters.sort_by || "relevance"}
                onValueChange={(value) => updateFilter('sort_by', value)}
              >
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder="Relevance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSearchPanel;
