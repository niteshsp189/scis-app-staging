import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import {
  Search,
  User,
  FileText,
  Calendar,
  Target,
  Filter,
  X,
  DollarSign,
  Bell,
  Users,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import SearchInputWithSuggestions from "@/components/ui/SearchInputWithSuggestions";
import ReminderDetailModal from "@/components/modals/ReminderDetailModal";
import ProspectDetailModal from "@/components/modals/ProspectDetailModal";
import globalSearchService, {
  SearchResult,
  SearchFilters,
} from "@/services/globalSearchService";
import LookupService from "@/services/lookupService";
import duplicateFinderService, {
  DuplicateGroup,
  DuplicateSearchFilters,
  CustomerColumn,
} from "@/services/duplicateFinderService";
import missingInfoService, {
  MissingInfoCustomer,
  MissingInfoSearchFilters,
} from "@/services/missingInfoService";
import { useAuth } from "@/contexts/AuthContext";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Copy, Users2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

const Lookup = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<SearchFilters["type"]>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState<
    Partial<SearchFilters>
  >({});
  const [isAdvancedSearchExpanded, setIsAdvancedSearchExpanded] =
    useState(false);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filtersEnabled, setFiltersEnabled] = useState(false);

  // Modal states
  const [selectedReminder, setSelectedReminder] = useState<SearchResult | null>(
    null,
  );
  const [selectedProspect, setSelectedProspect] = useState<SearchResult | null>(
    null,
  );
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);

  // Duplicate finder states
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [duplicateCustomerType, setDuplicateCustomerType] = useState<string>("all");
  const [isDuplicateSearching, setIsDuplicateSearching] = useState(false);
  const [isColumnSelectOpen, setIsColumnSelectOpen] = useState(false);
  const [columnSearchTerm, setColumnSearchTerm] = useState("");
  const [matchType, setMatchType] = useState<"exact" | "similar">("exact");
  const [activeTab, setActiveTab] = useState<string>("search");
  const [availableColumns, setAvailableColumns] = useState<CustomerColumn[]>([]);
  const [customerTypes, setCustomerTypes] = useState<{ value: string; label: string }[]>([]);

  // Missing Information states
  const [missingInfoColumns, setMissingInfoColumns] = useState<string[]>([]);
  const [missingInfoCustomerType, setMissingInfoCustomerType] = useState<string>("all");
  const [isMissingInfoSearching, setIsMissingInfoSearching] = useState(false);
  const [missingInfoResults, setMissingInfoResults] = useState<MissingInfoCustomer[]>([]);
  const [isMissingColumnSelectOpen, setIsMissingColumnSelectOpen] = useState(false);
  const [missingColumnSearchTerm, setMissingColumnSearchTerm] = useState("");

  // Initialize duplicate finder data
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const columns = duplicateFinderService.getAvailableColumns();
        const types = duplicateFinderService.getCustomerTypes();

        // Ensure we always have valid arrays
        setAvailableColumns(Array.isArray(columns) ? columns : []);
        setCustomerTypes(Array.isArray(types) ? types : []);
      } catch (error) {
        // Set empty arrays as fallback
        setAvailableColumns([]);
        setCustomerTypes([]);
      }
    } else {
      // Clear data when not authenticated
      setAvailableColumns([]);
      setCustomerTypes([]);
    }
  }, [isAuthenticated]);

  // Load filter options when advanced search is expanded
  useEffect(() => {
    if (isAdvancedSearchExpanded && isAuthenticated) {
      loadFilterOptions();
    }
  }, [isAdvancedSearchExpanded, isAuthenticated]);

  const loadFilterOptions = async () => {
    setIsLoadingFilterOptions(true);
    try {
      const options = await globalSearchService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      toast.error("Failed to load filter options");
    } finally {
      setIsLoadingFilterOptions(false);
    }
  };

  // Initialize from URL parameters
  useEffect(() => {
    if (!isAuthenticated) return; // Wait for authentication

    const { query, filters } = globalSearchService.parseSearchUrl(searchParams);
    if (query) {
      // Do not set searchTerm to keep input clear on load
      if (filters.type) setSearchType(filters.type);
      if (filters.status) setStatusFilter(filters.status);
      if (filters.date_from) setDateFilter(filters.date_from);

      // Set advanced filters
      const advanced: Partial<SearchFilters> = {};
      if (filters.customer_type) advanced.customer_type = filters.customer_type;
      if (filters.employee_id) advanced.employee_id = filters.employee_id;
      if (filters.agent_type) advanced.agent_type = filters.agent_type;
      if (filters.gender) advanced.gender = filters.gender;
      if (filters.referral_id) advanced.referral_id = filters.referral_id;
      if (filters.policy_status) advanced.policy_status = filters.policy_status;
      if (filters.is_in_dont_call_list !== undefined)
        advanced.is_in_dont_call_list = filters.is_in_dont_call_list;
      if (filters.is_in_client_book !== undefined)
        advanced.is_in_client_book = filters.is_in_client_book;
      if (filters.smoker) advanced.smoker = filters.smoker;
      if (filters.zip_code) advanced.zip_code = filters.zip_code;
      if (filters.state) advanced.state = filters.state;
      if (filters.city) advanced.city = filters.city;
      if (filters.birthday_from) advanced.birthday_from = filters.birthday_from;
      if (filters.birthday_to) advanced.birthday_to = filters.birthday_to;
      if (filters.age_from) advanced.age_from = filters.age_from;
      if (filters.age_to) advanced.age_to = filters.age_to;
      if (filters.premium_from) advanced.premium_from = filters.premium_from;
      if (filters.premium_to) advanced.premium_to = filters.premium_to;
      if (filters.effective_date_from)
        advanced.effective_date_from = filters.effective_date_from;
      if (filters.effective_date_to)
        advanced.effective_date_to = filters.effective_date_to;
      if (filters.insurance_type_id)
        advanced.insurance_type_id = filters.insurance_type_id;
      if (filters.company_id) advanced.company_id = filters.company_id;
      if (filters.plan_id) advanced.plan_id = filters.plan_id;
      if (filters.policy_number) advanced.policy_number = filters.policy_number;
      if (filters.insurance_type_id)
        advanced.insurance_type_id = filters.insurance_type_id;
      if (filters.company_id) advanced.company_id = filters.company_id;
      if (filters.plan_id) advanced.plan_id = filters.plan_id;
      if (filters.new_client_only !== undefined)
        advanced.new_client_only = filters.new_client_only;
      if (filters.sort_by) advanced.sort_by = filters.sort_by;

      setAdvancedFilters(advanced);
      if (Object.keys(advanced).length > 0) {
        setIsAdvancedSearchExpanded(true);
      }

      // Do not perform automatic search on page load to keep page in default state
      // performSearchWithParams(query, filters, false);
    }
  }, [searchParams, isAuthenticated]);

  const performSearchWithParams = async (
    query: string,
    filters: SearchFilters,
    skipLoading = false,
  ) => {
    if (!query.trim()) {
      return;
    }

    if (!skipLoading) {
      setIsSearching(true);
    }

    try {
      console.log('Performing search with query:', query, 'filters:', filters);
      const response = await globalSearchService.search(query, filters);
      console.log('Search response:', response);
      const results = response.data?.results || [];
      console.log('Parsed results:', results.length, 'items');
      setResults(results);
      setFiltersEnabled(true); // Enable filters after results are received
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      if (!skipLoading) {
        setIsSearching(false);
      }
    }
  };

  const performSearch = async (searchText?: string | React.MouseEvent) => {
    // Handle case where event object is passed (from button click) vs string (from suggestion)
    const queryText = typeof searchText === 'string' ? searchText : searchTerm;
    
    if (!queryText.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    // If searchText was passed as a string, update the searchTerm state
    if (typeof searchText === 'string') {
      setSearchTerm(searchText);
    }

    setFiltersEnabled(false); // Disable filters during search

    const filters: SearchFilters = {
      type: searchType,
      status: statusFilter !== "all" ? statusFilter : undefined,
      date_from: dateFilter || undefined,
      limit: 50,
      ...advancedFilters, // Merge advanced filters
    };

    // Update URL
    const url = globalSearchService.buildSearchUrl(queryText, filters);
    navigate(url, { replace: true });

    // Pass skipLoading flag if suggestion was selected
    await performSearchWithParams(queryText, filters, suggestionSelected);

    // Reset suggestion selected flag
    setSuggestionSelected(false);
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      customer: User,
      policy: FileText,
      appointment: Calendar,
      prospect: Target,
      deal: DollarSign,
      reminder: Bell,
      user: Users,
    };

    const IconComponent = iconMap[type] || Search;
    const colorClass = globalSearchService.getTypeColor(
      type as SearchResult["type"],
    );

    return <IconComponent className={`h-4 w-4 ${colorClass}`} />;
  };

  const getTypeBadge = (type: string) => {
    return globalSearchService.getTypeBadgeColor(type as SearchResult["type"]);
  };

  const addFilter = (filterType: string, value: string) => {
    const filter = `${filterType}:${value}`;
    if (!activeFilters.includes(filter)) {
      setActiveFilters((prev) => [...prev, filter]);
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filter));
  };

  const clearAllFilters = () => {
    setSearchTerm(""); // Clear search text
    setResults([]); // Clear search results
    setIsSearching(false); // Reset searching state
    setActiveFilters([]);
    setSearchType("all");
    setStatusFilter("all");
    setDateFilter("");
    setAdvancedFilters({}); // Clear advanced filters
    setFiltersEnabled(false);

    // Clear URL parameters
    navigate("/lookup", { replace: true });
  };

  const handleAdvancedFiltersChange = (filters: Partial<SearchFilters>) => {
    setAdvancedFilters(filters);

    // Auto-search if there's a search term and we have existing results
    if (searchTerm.trim() && results.length > 0) {
      const searchFilters: SearchFilters = {
        type: searchType,
        status: statusFilter !== "all" ? statusFilter : undefined,
        date_from: dateFilter || undefined,
        limit: 50,
        ...filters,
      };
      performSearchWithParams(searchTerm, searchFilters, false);
    }
  };

  const handleZipCodeSearch = async () => {
    if (!advancedFilters.zip_code?.trim()) {
      toast.error("Please enter a zip code first");
      return;
    }

    try {
      const locationData = await LookupService.searchZipByCode(
        advancedFilters.zip_code,
      );

      if (locationData && locationData.length > 0) {
        const zipData = locationData[0]; // Take the first match
        const stateName = zipData.state?.name || zipData.state_abbr;

        handleAdvancedFiltersChange({
          ...advancedFilters,
          state: stateName,
          city: zipData.city,
        });

        toast.info("Location data filled automatically", {
          duration: 1000,
          action: {
            label: "✕",
            onClick: () => { },
          },
        });
      } else {
        toast.info(
          "No location data found for this zip code. Please enter the state and city manually.",
          {
            duration: 3000,
            action: {
              label: "✕",
              onClick: () => { },
            },
          },
        );
      }
    } catch (error) {
      toast.error("Failed to search zip code");
    }
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({});
  };

  const handleResultClick = (result: SearchResult, e?: React.MouseEvent) => {
    // Handle reminders and prospects with modals
    if (result.type === "reminder") {
      setSelectedReminder(result);
      setIsReminderModalOpen(true);
      return;
    }

    // Handle prospect type with the prospect modal
    if (result.type === "prospect") {
      setSelectedProspect(result);
      setIsProspectModalOpen(true);
      return;
    }
    if (result.type === "user") {
      // returning nothing as not popup or navigation is needed for user
      return;
    }

    // For other types, navigate to the result's URL
    // If middle click or ctrl+click, open in new tab
    if (e && (e.ctrlKey || e.metaKey || e.button === 1)) {
      window.open(result.url, '_blank');
    } else {
      navigate(result.url);
    }
  };

  const getResultHref = (result: SearchResult) => {
    // Return href for navigation-supported types
    if (result.type === "reminder" || result.type === "prospect" || result.type === "user") {
      return undefined; // These use modals or no navigation
    }
    return result.url;
  };

  // Modal handlers
  const closeReminderModal = () => {
    setIsReminderModalOpen(false);
    setSelectedReminder(null);
  };

  const closeProspectModal = () => {
    setIsProspectModalOpen(false);
    setSelectedProspect(null);
  };

  // Print handlers for each tab
  const handlePrintSearchResults = () => {
    const params = new URLSearchParams();
    params.set('tab', 'search');
    params.set('q', searchTerm);
    if (searchType !== 'all') params.set('type', searchType);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (dateFilter) params.set('date_from', dateFilter);
    
    const printUrl = `/lookup/print?${params.toString()}`;
    console.log('Opening print URL:', printUrl, 'searchTerm:', searchTerm);
    window.open(printUrl, '_blank');
  };

  const handlePrintDuplicates = () => {
    const params = new URLSearchParams();
    params.set('tab', 'duplicates');
    if (selectedColumns.length > 0) {
      params.set('columns', selectedColumns.join(','));
    }
    if (duplicateCustomerType !== 'all') {
      params.set('customerType', duplicateCustomerType);
    }
    params.set('matchType', matchType);
    
    window.open(`/lookup/print?${params.toString()}`, '_blank');
  };

  const handlePrintMissingInfo = () => {
    const params = new URLSearchParams();
    params.set('tab', 'missing');
    if (missingInfoColumns.length > 0) {
      params.set('missingColumns', missingInfoColumns.join(','));
    }
    if (missingInfoCustomerType !== 'all') {
      params.set('missingCustomerType', missingInfoCustomerType);
    }
    
    window.open(`/lookup/print?${params.toString()}`, '_blank');
  };

  const performDuplicateSearch = async () => {
    if (!selectedColumns || selectedColumns.length === 0) {
      toast.error("Please select at least one column to compare");
      return;
    }

    if (!availableColumns || availableColumns.length === 0) {
      toast.error("Column data not loaded. Please refresh the page.");
      return;
    }

    setIsDuplicateSearching(true);

    try {
      const filters: DuplicateSearchFilters = {
        columns: selectedColumns,
        customer_type: duplicateCustomerType !== "all" ? duplicateCustomerType as any : undefined,
        match_type: matchType,
        limit: 50,
      };

      const response = await duplicateFinderService.findDuplicates(filters);

      // Handle different response structures
      if (response && response.success !== false) {
        const groups = response.data?.groups || response.groups || [];
        const totalGroups = response.data?.total_groups || response.total_groups || groups.length;

        setDuplicateGroups(groups);

        if (groups.length === 0) {
          toast.info("No duplicate customers found with the selected criteria");
        } else {
          toast.success(`Found ${totalGroups} duplicate group${totalGroups > 1 ? 's' : ''}`);
        }
      } else {
        // Handle error response
        const errorMessage = response?.message || response?.error || "Unknown error occurred";
        toast.error(`Failed to search for duplicates: ${errorMessage}`);
        setDuplicateGroups([]);
      }
    } catch (error: any) {

      // Try to extract meaningful error message
      let errorMessage = "Failed to search for duplicates. Please try again.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setDuplicateGroups([]);
    } finally {
      setIsDuplicateSearching(false);
    }
  };

  const performMissingInfoSearch = async () => {
    if (!missingInfoColumns || missingInfoColumns.length === 0) {
      toast.error("Please select at least one column to check for missing information");
      return;
    }

    if (!availableColumns || availableColumns.length === 0) {
      toast.error("Column data not loaded. Please refresh the page.");
      return;
    }

    setIsMissingInfoSearching(true);

    try {

      // missingInfoColumns already contains backend field names (e.g., 'country', 'first_name')
      // No mapping needed since column.value is already in the correct format
      const searchFilters: MissingInfoSearchFilters = {
        columns: missingInfoColumns,
        limit: 50,
      };

      // Only add customer_type if it's not 'all'
      if (missingInfoCustomerType && missingInfoCustomerType !== 'all') {
        searchFilters.customer_type = missingInfoCustomerType as any;
      }


      const response = await missingInfoService.findMissingInformation(searchFilters);


      if (response.success && response.data) {
        const customers = response.data.customers || [];
        setMissingInfoResults(customers);

        const summary = missingInfoService.getMissingInfoSummary(customers);
        toast.success(summary);
      } else {
        setMissingInfoResults([]);
        toast.warning("No customers found with missing information");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to search for missing information. Please try again.";
      toast.error(errorMessage);
      setMissingInfoResults([]);
    } finally {
      setIsMissingInfoSearching(false);
    }
  };

  const getResultCounts = () => {
    return globalSearchService.getResultCounts(results);
  };

  const resultCounts = getResultCounts();

  // Check if user is authenticated - handled by AuthContext
  if (!isAuthenticated) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Global Search</h1>
            <p className="text-gray-600">
              Please log in to access global search.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 md:p-4 pt-20 md:pt-6 px-4 pb-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {activeTab === "search" ? "Global Search" :
              activeTab === "duplicates" ? "Duplicate Finder" : "Missing Information"}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {activeTab === "search"
              ? "Search across all data in the organization"
              : activeTab === "duplicates"
                ? "Find and manage duplicate customer records"
                : "Identify customers with incomplete information"}
          </p>
        </div>
      </div>

      {/* Top Level Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-max min-w-full sm:w-auto">
            <TabsTrigger value="search" className="whitespace-nowrap">
              <Search className="h-4 w-4 mr-2" />
              Global Search
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="whitespace-nowrap">
              <Users2 className="h-4 w-4 mr-2" />
              Duplicate Finder
            </TabsTrigger>
            <TabsTrigger value="missing" className="whitespace-nowrap">
              <FileText className="h-4 w-4 mr-2" />
              Missing Information
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Global Search Tab Content */}
        <TabsContent value="search" className="space-y-6 mt-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <SearchInputWithSuggestions
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSearch={performSearch}
                    onSuggestionSelect={() => setSuggestionSelected(true)}
                    placeholder="Search customers, policies, appointments, reminders..."
                    disabled={isSearching}
                  />
                  <Button onClick={performSearch} disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>

                {/* Basic Filters Row with Toggle */}
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Select
                      value={searchType}
                      onValueChange={(value) =>
                        setSearchType(value as SearchFilters["type"])
                      }
                      disabled={!filtersEnabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Search in..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="policies">Policies</SelectItem>
                        <SelectItem value="appointments">Appointments</SelectItem>
                        <SelectItem value="prospects">Prospects</SelectItem>
                        <SelectItem value="reminders">Reminders</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                      disabled={!filtersEnabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status filter..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="sm:col-span-2 lg:col-span-1">
                      <DateInput
                        placeholder="Date filter"
                        value={dateFilter}
                        onChange={setDateFilter}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:gap-2 xl:flex-row xl:gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setIsAdvancedSearchExpanded(!isAdvancedSearchExpanded)
                      }
                      className="whitespace-nowrap order-2 sm:order-1 lg:order-1 xl:order-1"
                    >
                      {isAdvancedSearchExpanded
                        ? "Minimal Filters"
                        : "Advanced Filters"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="whitespace-nowrap order-1 sm:order-2 lg:order-2 xl:order-2"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Advanced Filters - Collapsible */}
                {isAdvancedSearchExpanded && (
                  <div className="pt-4 border-t px-2.5 py-2.5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Advanced Filters</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAdvancedFilters}
                      >
                        Clear Advanced Filters
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] sm:max-h-[250px] overflow-y-auto px-2.5 py-4">
                      {/* Customer Type */}
                      <div className="space-y-2">
                        <Label htmlFor="customer-type">Customer Type</Label>
                        <Select
                          value={advancedFilters.customer_type || "any"}
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              customer_type: value === "any" ? undefined : value,
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="customer-type">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.customer_types?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={advancedFilters.gender || "any"}
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              gender: value === "any" ? undefined : value,
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="gender">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.genders?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Agent Type */}
                      <div className="space-y-2">
                        <Label htmlFor="agent-type">Agent Type</Label>
                        <Select
                          value={advancedFilters.agent_type || "any"}
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              agent_type: value === "any" ? undefined : value,
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="agent-type">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.agent_types?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Employee */}
                      <div className="space-y-2">
                        <Label htmlFor="employee">Employee</Label>
                        <Select
                          value={
                            advancedFilters.employee_id
                              ? String(advancedFilters.employee_id)
                              : "any"
                          }
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              employee_id:
                                value === "any" ? undefined : Number(value),
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="employee">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.employees?.map((option: any) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Referral Source */}
                      <div className="space-y-2">
                        <Label htmlFor="referral">Referral Source</Label>
                        <Select
                          value={
                            advancedFilters.referral_id
                              ? String(advancedFilters.referral_id)
                              : "any"
                          }
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              referral_id:
                                value === "any" ? undefined : Number(value),
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="referral">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.referral_sources?.map((option: any) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Policy Status */}
                      <div className="space-y-2">
                        <Label htmlFor="policy-status">Policy Status</Label>
                        <Select
                          value={advancedFilters.policy_status || "any"}
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              policy_status: value === "any" ? undefined : value,
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="policy-status">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.policy_statuses?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Insurance Type */}
                      <div className="space-y-2">
                        <Label htmlFor="insurance-type">Insurance Type</Label>
                        <Select
                          value={
                            advancedFilters.insurance_type_id
                              ? String(advancedFilters.insurance_type_id)
                              : "any"
                          }
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              insurance_type_id:
                                value === "any" ? undefined : Number(value),
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="insurance-type">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.insurance_types?.map((option: any) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Insurance Company */}
                      <div className="space-y-2">
                        <Label htmlFor="insurance-company">Insurance Company</Label>
                        <Select
                          value={
                            advancedFilters.company_id
                              ? String(advancedFilters.company_id)
                              : "any"
                          }
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              company_id: value === "any" ? undefined : Number(value),
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="insurance-company">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.companies?.map((option: any) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Insurance Plan */}
                      <div className="space-y-2">
                        <Label htmlFor="insurance-plan">Insurance Plan</Label>
                        <Select
                          value={
                            advancedFilters.plan_id
                              ? String(advancedFilters.plan_id)
                              : "any"
                          }
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              plan_id: value === "any" ? undefined : Number(value),
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="insurance-plan">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.plans?.map((option: any) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Smoker */}
                      <div className="space-y-2">
                        <Label htmlFor="smoker">Smoker</Label>
                        <Select
                          value={advancedFilters.smoker || "any"}
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              smoker: value === "any" ? undefined : value,
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="smoker">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.smoker_options?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
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
                            value={advancedFilters.zip_code || ""}
                            onChange={(e) =>
                              handleAdvancedFiltersChange({
                                ...advancedFilters,
                                zip_code: e.target.value,
                              })
                            }
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
                          {advancedFilters.zip_code && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-2 hover:bg-muted"
                              onClick={() =>
                                handleAdvancedFiltersChange({
                                  ...advancedFilters,
                                  zip_code: undefined,
                                })
                              }
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
                          value={advancedFilters.state || "any"}
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              state: value === "any" ? undefined : value,
                            })
                          }
                          disabled={isLoadingFilterOptions}
                        >
                          <SelectTrigger id="state">
                            <SelectValue
                              placeholder={
                                isLoadingFilterOptions ? "Loading..." : "ANY"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            {filterOptions?.states?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={advancedFilters.city || ""}
                          onChange={(e) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              city: e.target.value,
                            })
                          }
                          placeholder="Enter city..."
                        />
                      </div>

                      {/* Birthday From */}
                      <div className="space-y-2">
                        <Label htmlFor="birthday-from">Birthday From</Label>
                        <DateInput
                          id="birthday-from"
                          value={advancedFilters.birthday_from || ""}
                          onChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              birthday_from: value,
                            })
                          }
                          placeholder="Select date..."
                        />
                      </div>

                      {/* Birthday To */}
                      <div className="space-y-2">
                        <Label htmlFor="birthday-to">Birthday To</Label>
                        <DateInput
                          id="birthday-to"
                          value={advancedFilters.birthday_to || ""}
                          onChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              birthday_to: value,
                            })
                          }
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
                          value={advancedFilters.age_from || ""}
                          onChange={(e) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              age_from: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
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
                          value={advancedFilters.age_to || ""}
                          onChange={(e) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              age_to: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
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
                          value={advancedFilters.premium_from || ""}
                          onChange={(e) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              premium_from: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
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
                          value={advancedFilters.premium_to || ""}
                          onChange={(e) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              premium_to: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="Max premium..."
                        />
                      </div>

                      {/* Effective Date From */}
                      <div className="space-y-2">
                        <Label htmlFor="effective-date-from">
                          Effective Date From
                        </Label>
                        <DateInput
                          id="effective-date-from"
                          value={advancedFilters.effective_date_from || ""}
                          onChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              effective_date_from: value,
                            })
                          }
                          placeholder="Select date..."
                        />
                      </div>

                      {/* Effective Date To */}
                      <div className="space-y-2">
                        <Label htmlFor="effective-date-to">Effective Date To</Label>
                        <DateInput
                          id="effective-date-to"
                          value={advancedFilters.effective_date_to || ""}
                          onChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              effective_date_to: value,
                            })
                          }
                          placeholder="Select date..."
                        />
                      </div>

                      {/* Policy Number */}
                      <div className="space-y-2">
                        <Label htmlFor="policy-number">Policy #</Label>
                        <Input
                          id="policy-number"
                          value={advancedFilters.policy_number || ""}
                          onChange={(e) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              policy_number: e.target.value,
                            })
                          }
                          placeholder="Enter policy number..."
                        />
                      </div>

                      {/* Don't Call List */}
                      <div className="space-y-2">
                        <Label htmlFor="dont-call-list">Don't Call List</Label>
                        <Select
                          value={
                            advancedFilters.is_in_dont_call_list === undefined
                              ? "any"
                              : advancedFilters.is_in_dont_call_list
                                ? "yes"
                                : "no"
                          }
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              is_in_dont_call_list:
                                value === "any"
                                  ? undefined
                                  : value === "yes"
                                    ? true
                                    : false,
                            })
                          }
                        >
                          <SelectTrigger id="dont-call-list">
                            <SelectValue placeholder="ANY" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Client Book */}
                      <div className="space-y-2">
                        <Label htmlFor="client-book">Client Book</Label>
                        <Select
                          value={
                            advancedFilters.is_in_client_book === undefined
                              ? "any"
                              : advancedFilters.is_in_client_book
                                ? "yes"
                                : "no"
                          }
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              is_in_client_book:
                                value === "any"
                                  ? undefined
                                  : value === "yes"
                                    ? true
                                    : false,
                            })
                          }
                        >
                          <SelectTrigger id="client-book">
                            <SelectValue placeholder="ANY" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">ANY</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* New Client Only/No Cancelled Policy */}
                      <div className="space-y-2">
                        <Label htmlFor="new-client-only">No Cancelled Policy</Label>
                        <div className="border rounded p-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="new-client-only"
                              checked={advancedFilters.new_client_only || false}
                              onCheckedChange={(checked) =>
                                handleAdvancedFiltersChange({
                                  ...advancedFilters,
                                  new_client_only: checked ? true : undefined,
                                })
                              }
                            />
                            <span className="text-sm">New client only</span>
                          </div>
                        </div>
                      </div>

                      {/* Sort By */}
                      <div className="space-y-2">
                        <Label htmlFor="sort-by">Sort By</Label>
                        <Select
                          value={advancedFilters.sort_by || "relevance"}
                          onValueChange={(value) =>
                            handleAdvancedFiltersChange({
                              ...advancedFilters,
                              sort_by: value,
                            })
                          }
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Advanced Filters Display */}
          {Object.keys(advancedFilters).length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">
                    Active Advanced Filters:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-start sm:justify-start">
                  {Object.entries(advancedFilters).map(([key, value]) => {
                    if (value === undefined || value === null || value === "")
                      return null;

                    // Custom label formatting for better display
                    let label = key;
                    if (key === "insurance_type_id") {
                      label = "Insurance Type";
                    } else if (key === "company_id") {
                      label = "Company";
                    } else if (key === "plan_id") {
                      label = "Plan";
                    } else if (key === "employee_id") {
                      label = "Employee";
                    } else if (key === "referral_id") {
                      label = "Referral Source";
                    } else if (key === "customer_type") {
                      label = "Customer Type";
                    } else if (key === "agent_type") {
                      label = "Agent Type";
                    } else if (key === "policy_status") {
                      label = "Policy Status";
                    } else if (key === "is_in_dont_call_list") {
                      label = "Don't Call";
                    } else if (key === "is_in_client_book") {
                      label = "Client Book";
                    } else if (key === "zip_code") {
                      label = "Zip Code";
                    } else if (key === "birthday_from") {
                      label = "Birthday From";
                    } else if (key === "birthday_to") {
                      label = "Birthday To";
                    } else if (key === "age_from") {
                      label = "Age From";
                    } else if (key === "age_to") {
                      label = "Age To";
                    } else if (key === "premium_from") {
                      label = "Premium From";
                    } else if (key === "premium_to") {
                      label = "Premium To";
                    } else if (key === "effective_date_from") {
                      label = "Effective Date From";
                    } else if (key === "effective_date_to") {
                      label = "Effective Date To";
                    } else if (key === "policy_number") {
                      label = "Policy Number";
                    } else if (key === "new_client_only") {
                      label = "New Client Only/No Cancelled Policy";
                    } else if (key === "sort_by") {
                      label = "Sort By";
                    } else {
                      // Default formatting for any other fields
                      label = key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase());
                    }

                    let displayValue =
                      typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : String(value);

                    // Skip undefined/null values and empty strings
                    if (value === undefined || value === null || value === "") {
                      return null;
                    }

                    // Special handling for referral_id to show the referral source name
                    if (key === "referral_id" && filterOptions?.referral_sources) {
                      const referral = filterOptions.referral_sources.find(
                        (r) => r.value === Number(value),
                      );
                      if (referral) {
                        displayValue = referral.label;
                      }
                    }

                    // Special handling for employee_id to show the employee name
                    if (key === "employee_id" && filterOptions?.employees) {
                      const employee = filterOptions.employees.find(
                        (e) => e.value === Number(value),
                      );
                      if (employee) {
                        displayValue = employee.label;
                      }
                    }

                    // Special handling for insurance_type_id to show the insurance type name
                    if (key === "insurance_type_id" && filterOptions?.insurance_types) {
                      const insuranceType = filterOptions.insurance_types.find(
                        (t) => t.value === Number(value),
                      );
                      if (insuranceType) {
                        displayValue = insuranceType.label;
                      }
                    }

                    // Special handling for company_id to show the company name
                    if (key === "company_id" && filterOptions?.companies) {
                      const company = filterOptions.companies.find(
                        (c) => c.value === Number(value),
                      );
                      if (company) {
                        displayValue = company.label;
                      }
                    }

                    // Special handling for plan_id to show the plan name
                    if (key === "plan_id" && filterOptions?.plans) {
                      const plan = filterOptions.plans.find(
                        (p) => p.value === Number(value),
                      );
                      if (plan) {
                        displayValue = plan.label;
                      }
                    }

                    return (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {label}: {displayValue}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            const newFilters = { ...advancedFilters };
                            delete newFilters[key as keyof SearchFilters];
                            setAdvancedFilters(newFilters);
                          }}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Search Results ({results.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintSearchResults}
                  className="shrink-0"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <div className="overflow-x-auto pb-2">
                    <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-max min-w-full sm:w-auto">
                      <TabsTrigger value="all" className="whitespace-nowrap">
                        All ({results.filter((r) => r.type !== "prospect").length})
                      </TabsTrigger>
                      <TabsTrigger value="customers" className="whitespace-nowrap">
                        Customers ({resultCounts.customer || 0})
                      </TabsTrigger>
                      <TabsTrigger value="policies" className="whitespace-nowrap">
                        Policies ({resultCounts.policy || 0})
                      </TabsTrigger>
                      <TabsTrigger value="appointments" className="whitespace-nowrap">
                        Appointments ({resultCounts.appointment || 0})
                      </TabsTrigger>
                      <TabsTrigger value="reminders" className="whitespace-nowrap">
                        Reminders ({resultCounts.reminder || 0})
                      </TabsTrigger>
                      {resultCounts.user && (
                        <TabsTrigger value="users" className="whitespace-nowrap">
                          Users ({resultCounts.user})
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>

                  <TabsContent value="all" className="space-y-3 mt-4">
                    {results
                      .filter((result) => result.type !== "prospect")
                      .map((result, index) => {
                        const href = getResultHref(result);
                        const Component = href ? 'a' : 'div';
                        const linkProps = href ? {
                          href,
                          onClick: (e: React.MouseEvent) => {
                            e.preventDefault();
                            handleResultClick(result, e);
                          },
                          onMouseDown: (e: React.MouseEvent) => {
                            if (e.button === 1) { // Middle click
                              e.preventDefault();
                              handleResultClick(result, e);
                            }
                          }
                        } : {
                          onClick: (e: React.MouseEvent) => handleResultClick(result, e)
                        };

                        return (
                          <Component
                            key={`${result.type}-${result.id}-${index}`}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors no-underline text-inherit"
                            {...linkProps}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {getTypeIcon(result.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                  <h4 className="font-medium truncate">{result.title}</h4>
                                  {result.status && (
                                    <Badge variant="outline" className="shrink-0">{result.status}</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {result.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-400 self-start sm:self-center shrink-0">
                              Score: {result.relevance_score}/100
                            </div>
                          </Component>
                        );
                      })}
                  </TabsContent>

                  {[
                    "customers",
                    "policies",
                    "appointments",
                    "reminders",
                    "users",
                  ].map((category) => (
                    <TabsContent
                      key={category}
                      value={category}
                      className="space-y-3 mt-4"
                    >
                      {results
                        .filter((result) => {
                          if (category === "customers")
                            return result.type === "customer";
                          if (category === "policies")
                            return result.type === "policy";
                          if (category === "appointments")
                            return result.type === "appointment";
                          if (category === "reminders")
                            return result.type === "reminder";
                          if (category === "users") return result.type === "user";
                          return false;
                        })
                        .map((result, index) => {
                          const href = getResultHref(result);
                          const Component = href ? 'a' : 'div';
                          const linkProps = href ? {
                            href,
                            onClick: (e: React.MouseEvent) => {
                              e.preventDefault();
                              handleResultClick(result, e);
                            },
                            onMouseDown: (e: React.MouseEvent) => {
                              if (e.button === 1) { // Middle click
                                e.preventDefault();
                                handleResultClick(result, e);
                              }
                            }
                          } : {
                            onClick: (e: React.MouseEvent) => handleResultClick(result, e)
                          };

                          return (
                            <Component
                              key={`${result.type}-${result.id}-${index}`}
                              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors no-underline text-inherit"
                              {...linkProps}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {getTypeIcon(result.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                    <h4 className="font-medium truncate">{result.title}</h4>
                                    {result.status && (
                                      <Badge variant="outline" className="shrink-0">{result.status}</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {result.description}
                                  </p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-400 self-start sm:self-center shrink-0">
                                Score: {result.relevance_score}/100
                              </div>
                            </Component>
                          );
                        })}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {searchTerm && results.length === 0 && !isSearching && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No results found for "{searchTerm}"</p>
                <p className="text-sm text-gray-400 mt-2">
                  Try adjusting your search terms or filters
                </p>
              </CardContent>
            </Card>
          )}

          {isSearching && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Searching...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Duplicate Finder Tab */}
        <TabsContent value="duplicates" className="space-y-4 mt-4">
          {/* Duplicate Finder Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column Selection */}
                  <div className="space-y-2">
                    <Label>Select Columns to Compare</Label>
                    <Popover open={isColumnSelectOpen} onOpenChange={setIsColumnSelectOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isColumnSelectOpen}
                          className="w-full justify-between"
                          disabled={!availableColumns || availableColumns.length === 0}
                        >
                          {selectedColumns && selectedColumns.length > 0
                            ? `${selectedColumns.length} column${selectedColumns.length > 1 ? 's' : ''} selected`
                            : availableColumns && availableColumns.length > 0
                              ? "Select columns..."
                              : "Loading columns..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <div className="p-2">
                          <div className="flex items-center border-b px-3 pb-2 mb-2">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              placeholder="Search columns..."
                              className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              value={columnSearchTerm}
                              onChange={(e) => setColumnSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="max-h-52 overflow-auto">
                            {availableColumns && Array.isArray(availableColumns) && availableColumns.length > 0 ? (
                              <>
                                {availableColumns
                                  .filter(column =>
                                    column?.label?.toLowerCase().includes(columnSearchTerm.toLowerCase()) ||
                                    column?.value?.toLowerCase().includes(columnSearchTerm.toLowerCase())
                                  )
                                  .map((column) => (
                                    <div
                                      key={column?.value || ''}
                                      className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                                      onClick={() => {
                                        if (column?.value) {
                                          setSelectedColumns((prev) =>
                                            prev.includes(column.value)
                                              ? prev.filter((item) => item !== column.value)
                                              : [...prev, column.value]
                                          );
                                        }
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "h-4 w-4",
                                          column?.value && selectedColumns.includes(column.value)
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <span>{column?.label || column?.value || 'Unknown'}</span>
                                    </div>
                                  ))}
                                {availableColumns
                                  .filter(column =>
                                    column?.label?.toLowerCase().includes(columnSearchTerm.toLowerCase()) ||
                                    column?.value?.toLowerCase().includes(columnSearchTerm.toLowerCase())
                                  ).length === 0 && (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                      No columns found.
                                    </div>
                                  )}
                              </>
                            ) : (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                {availableColumns === null || availableColumns === undefined
                                  ? "Loading columns..."
                                  : "No columns available"}
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {selectedColumns && selectedColumns.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedColumns.map((columnValue) => {
                          const column = (availableColumns || []).find(c => c.value === columnValue);
                          return (
                            <Badge key={columnValue} variant="secondary" className="text-xs">
                              {column?.label || columnValue}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer"
                                onClick={() => {
                                  setSelectedColumns(prev =>
                                    prev.filter(item => item !== columnValue)
                                  );
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Customer Type Filter */}
                  <div className="space-y-2">
                    <Label>Customer Type</Label>
                    <Select
                      value={duplicateCustomerType}
                      onValueChange={setDuplicateCustomerType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {(customerTypes || []).map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Match Type Selection */}
                <div className="space-y-3">
                  <Label>Match Type</Label>
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="exact-match"
                        name="match-type"
                        checked={matchType === "exact"}
                        onChange={() => setMatchType("exact")}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <Label htmlFor="exact-match" className="text-sm font-normal cursor-pointer">
                        Exact Match
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="similar-match"
                        name="match-type"
                        checked={matchType === "similar"}
                        onChange={() => setMatchType("similar")}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <Label htmlFor="similar-match" className="text-sm font-normal cursor-pointer">
                        Similar Match
                      </Label>
                    </div>
                  </div>
                  {/* {matchType === "similar" && (
                          <p className="text-xs text-gray-500 mt-1">
                            Similar match finds customers with slight variations in names (e.g., "Dexter Harvey" vs "Dexfer test")
                          </p>
                        )} */}
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedColumns([]);
                      setDuplicateCustomerType("all");
                      setMatchType("exact");
                      setDuplicateGroups([]);
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={performDuplicateSearch}
                    disabled={isDuplicateSearching || selectedColumns.length === 0}
                  >
                    {isDuplicateSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Users2 className="h-4 w-4 mr-2" />
                        Find Duplicates
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duplicate Results */}
          {duplicateGroups.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="h-5 w-5" />
                    Duplicate Groups Found ({duplicateGroups.length})
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {duplicateFinderService.getDuplicateSummary(duplicateGroups)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintDuplicates}
                  className="shrink-0"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {duplicateGroups.map((group, index) => (
                  <div key={group.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-lg">
                        Group {index + 1} - {group.duplicate_count} duplicates
                      </h4>
                      <Badge variant="outline" className="text-sm">
                        {Math.round(group.similarity_score * 100)}% match
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Matching fields:</strong> {group.matching_fields.join(", ")}
                    </div>

                    <div className="grid gap-3">
                      {group.customers.map((customer) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium">
                                  {customer.first_name} {customer.last_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {customer.email} • {customer.home_phone || customer.cell_phone || customer.work_phone || 'No phone'} • {customer.status}
                                </p>
                                {(customer.city || customer.state) && (
                                  <p className="text-sm text-gray-500">
                                    {customer.city}, {customer.state} {customer.zip_code}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const lines = [
                                  `${customer.first_name} ${customer.last_name}`,
                                  customer.email ? `Email: ${customer.email}` : null,
                                  (customer.home_phone || customer.cell_phone || customer.work_phone) ? `Phone: ${customer.home_phone || customer.cell_phone || customer.work_phone}` : null,
                                  (customer.address || customer.city || customer.state || customer.zip_code) ? `Address: ${[customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')}` : null
                                ].filter(Boolean);
                                const customerInfo = lines.join('\n');
                                navigator.clipboard.writeText(customerInfo);
                                toast.success("Customer info copied to clipboard");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {/* <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigate(duplicateFinderService.getCustomerUrl(customer.id));
                              }}
                            >
                              View
                            </Button> */}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Navigate to customer view page in new tab
                                window.open(`/customers/${customer.id}`, '_blank');
                              }}
                            >
                              <User className="h-4 w-4 mr-1" />
                              View
                            </Button>

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {selectedColumns.length > 0 && duplicateGroups.length === 0 && !isDuplicateSearching && (
            <div className="p-8 text-center">
              <Users2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No duplicates found</p>
              <p className="text-sm text-gray-400 mt-2">
                Try selecting different columns or adjusting the customer type filter
              </p>
            </div>
          )}

          {isDuplicateSearching && (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Searching for duplicates...</p>
            </div>
          )}
        </TabsContent>

        {/* Missing Information Tab */}
        <TabsContent value="missing" className="space-y-4 mt-4">
          {/* Missing Information Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column Selection */}
                  <div className="space-y-2">
                    <Label>Select Columns to Check for Missing Data</Label>
                    <Popover open={isMissingColumnSelectOpen} onOpenChange={setIsMissingColumnSelectOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isMissingColumnSelectOpen}
                          className="w-full justify-between"
                          disabled={!availableColumns || availableColumns.length === 0}
                        >
                          {missingInfoColumns && missingInfoColumns.length > 0
                            ? `${missingInfoColumns.length} column${missingInfoColumns.length > 1 ? 's' : ''} selected`
                            : availableColumns && availableColumns.length > 0
                              ? "Select columns..."
                              : "Loading columns..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <div className="p-2">
                          <div className="flex items-center border-b px-3 pb-2 mb-2">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              placeholder="Search columns..."
                              className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              value={missingColumnSearchTerm}
                              onChange={(e) => setMissingColumnSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="max-h-52 overflow-auto">
                            {availableColumns && Array.isArray(availableColumns) && availableColumns.length > 0 ? (
                              <>
                                {availableColumns
                                  .filter(column =>
                                    column?.label?.toLowerCase().includes(missingColumnSearchTerm.toLowerCase()) ||
                                    column?.value?.toLowerCase().includes(missingColumnSearchTerm.toLowerCase())
                                  )
                                  .map((column) => (
                                    <div
                                      key={column?.value || ''}
                                      className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                                      onClick={() => {
                                        if (column?.value) {
                                          setMissingInfoColumns((prev) =>
                                            prev.includes(column.value)
                                              ? prev.filter((item) => item !== column.value)
                                              : [...prev, column.value]
                                          );
                                        }
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "h-4 w-4",
                                          column?.value && missingInfoColumns.includes(column.value)
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <span>{column?.label || column?.value || 'Unknown'}</span>
                                    </div>
                                  ))}
                              </>
                            ) : (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                {availableColumns === null || availableColumns === undefined
                                  ? "Loading columns..."
                                  : "No columns available"}
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {missingInfoColumns && missingInfoColumns.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {missingInfoColumns.map((columnValue) => {
                          const column = (availableColumns || []).find(c => c.value === columnValue);
                          return (
                            <Badge key={columnValue} variant="secondary" className="text-xs">
                              {column?.label || columnValue}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer"
                                onClick={() => {
                                  setMissingInfoColumns(prev =>
                                    prev.filter(item => item !== columnValue)
                                  );
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Customer Type Filter */}
                  <div className="space-y-2">
                    <Label>Customer Type</Label>
                    <Select
                      value={missingInfoCustomerType}
                      onValueChange={setMissingInfoCustomerType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {(customerTypes || []).map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMissingInfoColumns([]);
                      setMissingInfoCustomerType("all");
                      setMissingInfoResults([]);
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={performMissingInfoSearch}
                    disabled={isMissingInfoSearching || missingInfoColumns.length === 0}
                  >
                    {isMissingInfoSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Find Missing Info
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Missing Information Results */}
          {missingInfoResults.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Customers with Missing Information ({missingInfoResults.length})
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {missingInfoResults.length} customer{missingInfoResults.length > 1 ? 's' : ''} with incomplete information
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintMissingInfo}
                  className="shrink-0"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {missingInfoResults.map((customer, index) => (
                    <div key={customer.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {customer.first_name} {customer.last_name}
                          </h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{customer.customer_type || customer.status}</Badge>
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              {customer.missing_count || customer.missing_fields?.length || 0} missing field{(customer.missing_count || customer.missing_fields?.length || 0) > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm"><strong>Email:</strong> {customer.email || <span className="text-red-500">Missing</span>}</p>
                          <p className="text-sm"><strong>Phone:</strong> {customer.home_phone || customer.cell_phone || customer.work_phone || <span className="text-red-500">Missing</span>}</p>
                        </div>
                        <div>
                          <p className="text-sm"><strong>Missing Fields:</strong></p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(customer.missing_fields || []).map((field) => (
                              <Badge key={field} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                {missingInfoService.formatFieldName(field)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const customerInfo = missingInfoService.formatCustomerForClipboard(customer);
                            navigator.clipboard.writeText(customerInfo);
                            toast.success("Customer info copied to clipboard");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to customer view page in new tab
                            window.open(`/customers/${customer.id}`, '_blank');
                          }}
                        >
                          <User className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {missingInfoResults.length === 0 && !isMissingInfoSearching && missingInfoColumns.length > 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No customers found with missing information</p>
                <p className="text-sm text-gray-400 mt-2">
                  All customers have complete data for the selected fields
                </p>
              </CardContent>
            </Card>
          )}

          {isMissingInfoSearching && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Searching for missing information...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modals */}
      <ReminderDetailModal
        isOpen={isReminderModalOpen}
        onClose={closeReminderModal}
        reminder={selectedReminder}
      />

      <ProspectDetailModal
        isOpen={isProspectModalOpen}
        onClose={closeProspectModal}
        prospect={selectedProspect}
      />
    </div>
  );
};

export default Lookup;
