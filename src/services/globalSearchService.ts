import { api } from './api';

export interface SearchResult {
  id: number;
  type: 'customer' | 'policy' | 'appointment' | 'prospect' | 'reminder' | 'user';
  title: string;
  description: string;
  status: string;
  relevance_score: number;
  url: string;
  details: any;
  // Customer-specific identifiers (for disambiguation when names are duplicated)
  ssn?: string;
  phone?: string;
  address?: string;
}

export interface SearchFilters {
  type?: 'all' | 'customers' | 'policies' | 'appointments' | 'prospects' | 'reminders' | 'users';
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  // Advanced filters
  customer_type?: 'Client' | 'Former' | 'Deceased' | 'Prospect';
  employee_id?: string;
  agent_type?: 'writing_agent' | 'agent_of_record';
  gender?: 'Male' | 'Female' | 'Other';
  referral_id?: number;
  policy_status?: string;
  is_in_dont_call_list?: boolean;
  is_in_client_book?: boolean;
  smoker?: 'Yes' | 'No';
  zip_code?: string;
  state?: string;
  city?: string;
  birthday_from?: string;
  birthday_to?: string;
  age_from?: number;
  age_to?: number;
  premium_from?: number;
  premium_to?: number;
  effective_date_from?: string;
  effective_date_to?: string;
  insurance_type_id?: number;
  company_id?: number;
  plan_id?: number;
  policy_number?: string;
  new_client_only?: boolean;
  sort_by?: 'relevance' | 'date' | 'name' | 'premium';
}

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface FilterOptions {
  customer_types: FilterOption[];
  genders: FilterOption[];
  smoker_options: FilterOption[];
  policy_statuses: FilterOption[];
  agent_types: FilterOption[];
  employees?: FilterOption[];
  referral_sources: FilterOption[];
  states: FilterOption[];
  insurance_types: FilterOption[];
  companies: FilterOption[];
  plans: FilterOption[];
}

export interface SearchResponse {
  success: boolean;
  data: {
    query: string;
    type: string;
    total_results: number;
    total_counts?: Record<string, number>;
    results: SearchResult[];
    filters: {
      status?: string;
      date_from?: string;
      date_to?: string;
    };
  };
}

export interface SearchSuggestion {
  text: string;
  type: string;
  id: number;
  phone?: string;
  address?: string;
  ssn?: string;
  customer_type?: string;
  legacy_client_id?: number | null;
}

export interface SuggestionsResponse {
  success: boolean;
  data: SearchSuggestion[];
}

class GlobalSearchService {
  /**
   * Perform global search across all entities
   */
  async search(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
    const params = new URLSearchParams({
      query,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      ),
    });

    try {
      const response = await api.get<SearchResponse>(`/search/global?${params.toString()}`);

      // Handle both direct response and wrapped response
      if (response.data) {
        return response as SearchResponse;
      } else {
        return response as SearchResponse;
      }
    } catch (error: any) {
      console.error('Global search failed:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(query: string, limit: number = 10): Promise<SuggestionsResponse> {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });

    try {
      const response = await api.get<SuggestionsResponse>(`/search/suggestions?${params.toString()}`);

      // Handle both direct response and wrapped response
      if (response.data) {
        return response as SuggestionsResponse;
      } else {
        return response as SuggestionsResponse;
      }
    } catch (error: any) {
      console.error('Suggestions search failed:', error);
      throw error;
    }
  }

  /**
   * Get type-specific search results
   */
  async searchByType(
    query: string,
    type: SearchFilters['type'],
    additionalFilters: Omit<SearchFilters, 'type'> = {}
  ): Promise<SearchResponse> {
    return this.search(query, { ...additionalFilters, type });
  }

  /**
   * Search customers specifically
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const response = await api.get<{ data: Customer[] }>(`/search/customers?query=${encodeURIComponent(query)}`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Customer search failed:', error);
      throw error;
    }
  }

  /**
   * Search policies specifically
   */
  async searchPolicies(query: string): Promise<Policy[]> {
    try {
      const response = await api.get<{ data: Policy[] }>(`/search/policies?query=${encodeURIComponent(query)}`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Policy search failed:', error);
      throw error;
    }
  }

  /**
   * Search appointments only
   */
  async searchAppointments(query: string, filters: Omit<SearchFilters, 'type'> = {}): Promise<SearchResponse> {
    return this.searchByType(query, 'appointments', filters);
  }

  /**
   * Search prospects only
   */
  async searchProspects(query: string, filters: Omit<SearchFilters, 'type'> = {}): Promise<SearchResponse> {
    return this.searchByType(query, 'prospects', filters);
  }

  /**
   * Search reminders only
   */
  async searchReminders(query: string, filters: Omit<SearchFilters, 'type'> = {}): Promise<SearchResponse> {
    return this.searchByType(query, 'reminders', filters);
  }

  /**
   * Search users only (requires permission)
   */
  async searchUsers(query: string, filters: Omit<SearchFilters, 'type'> = {}): Promise<SearchResponse> {
    return this.searchByType(query, 'users', filters);
  }

  /**
   * Build search URL for navigation
   */
  buildSearchUrl(query: string, filters: SearchFilters = {}): string {
    const params = new URLSearchParams({
      q: query,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      ),
    });

    return `/lookup?${params.toString()}`;
  }

  /**
   * Parse search URL parameters
   */
  parseSearchUrl(searchParams: URLSearchParams): { query: string; filters: SearchFilters } {
    const query = searchParams.get('q') || '';
    const filters: SearchFilters = {};

    const type = searchParams.get('type');
    if (type) filters.type = type as SearchFilters['type'];

    const status = searchParams.get('status');
    if (status) filters.status = status;

    const dateFrom = searchParams.get('date_from');
    if (dateFrom) filters.date_from = dateFrom;

    const dateTo = searchParams.get('date_to');
    if (dateTo) filters.date_to = dateTo;

    const limit = searchParams.get('limit');
    if (limit) filters.limit = parseInt(limit, 10);

    // Advanced filters
    const customerType = searchParams.get('customer_type');
    if (customerType) filters.customer_type = customerType as SearchFilters['customer_type'];

    const employeeId = searchParams.get('employee_id');
    if (employeeId) filters.employee_id = employeeId;

    const agentType = searchParams.get('agent_type');
    if (agentType) filters.agent_type = agentType as SearchFilters['agent_type'];

    const gender = searchParams.get('gender');
    if (gender) filters.gender = gender as SearchFilters['gender'];

    const referralId = searchParams.get('referral_id');
    if (referralId) filters.referral_id = parseInt(referralId, 10);

    const policyStatus = searchParams.get('policy_status');
    if (policyStatus) filters.policy_status = policyStatus;

    const isInDontCallList = searchParams.get('is_in_dont_call_list');
    if (isInDontCallList) filters.is_in_dont_call_list = isInDontCallList === 'true';

    const isInClientBook = searchParams.get('is_in_client_book');
    if (isInClientBook) filters.is_in_client_book = isInClientBook === 'true';

    const smoker = searchParams.get('smoker');
    if (smoker) filters.smoker = smoker as SearchFilters['smoker'];

    const zipCode = searchParams.get('zip_code');
    if (zipCode) filters.zip_code = zipCode;

    const state = searchParams.get('state');
    if (state) filters.state = state;

    const city = searchParams.get('city');
    if (city) filters.city = city;

    const birthdayFrom = searchParams.get('birthday_from');
    if (birthdayFrom) filters.birthday_from = birthdayFrom;

    const birthdayTo = searchParams.get('birthday_to');
    if (birthdayTo) filters.birthday_to = birthdayTo;

    const ageFrom = searchParams.get('age_from');
    if (ageFrom) filters.age_from = parseInt(ageFrom, 10);

    const ageTo = searchParams.get('age_to');
    if (ageTo) filters.age_to = parseInt(ageTo, 10);

    const premiumFrom = searchParams.get('premium_from');
    if (premiumFrom) filters.premium_from = parseFloat(premiumFrom);

    const premiumTo = searchParams.get('premium_to');
    if (premiumTo) filters.premium_to = parseFloat(premiumTo);

    const effectiveDateFrom = searchParams.get('effective_date_from');
    if (effectiveDateFrom) filters.effective_date_from = effectiveDateFrom;

    const effectiveDateTo = searchParams.get('effective_date_to');
    if (effectiveDateTo) filters.effective_date_to = effectiveDateTo;

    const insuranceTypeId = searchParams.get('insurance_type_id');
    if (insuranceTypeId) filters.insurance_type_id = parseInt(insuranceTypeId, 10);

    const companyId = searchParams.get('company_id');
    if (companyId) filters.company_id = parseInt(companyId, 10);

    const planId = searchParams.get('plan_id');
    if (planId) filters.plan_id = parseInt(planId, 10);

    const policyNumber = searchParams.get('policy_number');
    if (policyNumber) filters.policy_number = policyNumber;

    const newClientOnly = searchParams.get('new_client_only');
    if (newClientOnly) filters.new_client_only = newClientOnly === 'true';

    const sortBy = searchParams.get('sort_by');
    if (sortBy) filters.sort_by = sortBy as SearchFilters['sort_by'];

    return { query, filters };
  }

  /**
   * Get icon for search result type
   */
  getTypeIcon(type: SearchResult['type']): string {
    switch (type) {
      case 'customer':
        return 'User';
      case 'policy':
        return 'FileText';
      case 'appointment':
        return 'Calendar';
      case 'prospect':
        return 'Target';
      case 'reminder':
        return 'Bell';
      case 'user':
        return 'Users';
      default:
        return 'Search';
    }
  }

  /**
   * Get color class for search result type
   */
  getTypeColor(type: SearchResult['type']): string {
    switch (type) {
      case 'customer':
        return 'text-blue-500';
      case 'policy':
        return 'text-green-500';
      case 'appointment':
        return 'text-purple-500';
      case 'prospect':
        return 'text-orange-500';
      case 'reminder':
        return 'text-red-500';
      case 'user':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  }

  /**
   * Get badge color for search result type
   */
  getTypeBadgeColor(type: SearchResult['type']): string {
    switch (type) {
      case 'customer':
        return 'bg-blue-100 text-blue-800';
      case 'policy':
        return 'bg-green-100 text-green-800';
      case 'appointment':
        return 'bg-purple-100 text-purple-800';
      case 'prospect':
        return 'bg-orange-100 text-orange-800';
      case 'reminder':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format search result for display
   */
  formatSearchResult(result: SearchResult): SearchResult {
    return {
      ...result,
      title: result.title || 'Untitled',
      description: result.description || 'No description available',
    };
  }

  /**
   * Group search results by type
   */
  groupResultsByType(results: SearchResult[]): Record<string, SearchResult[]> {
    return results.reduce((groups, result) => {
      const type = result.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(result);
      return groups;
    }, {} as Record<string, SearchResult[]>);
  }

  /**
   * Get result counts by type
   */
  getResultCounts(results: SearchResult[]): Record<string, number> {
    const counts: Record<string, number> = {};

    results.forEach(result => {
      counts[result.type] = (counts[result.type] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get filter options for advanced search
   */
  async getFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await api.get<{ success: boolean; data: FilterOptions }>('/global-search/filter-options');
      return response.data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }

  /**
   * Get cities by state
   */
  async getCitiesByState(stateAbbr: string): Promise<string[]> {
    try {
      const response = await api.get<{ success: boolean; data: Array<{ city: string }> }>(
        `/zip-lookup/by-state/${stateAbbr}`
      );
      return response.data.data.map(item => item.city);
    } catch (error: any) {
      console.error('Failed to fetch cities:', error);
      return [];
    }
  }

  /**
   * Search zip codes
   */
  async searchZipCodes(query: string): Promise<Array<{ zip_code: string; city: string; state_abbr: string }>> {
    try {
      const response = await api.get<{
        success: boolean;
        data: Array<{ zip_code: string; city: string; state_abbr: string }>
      }>(`/zip-lookup/search/by-zip?zip=${query}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to search zip codes:', error);
      return [];
    }
  }
}

export const globalSearchService = new GlobalSearchService();
export default globalSearchService;
