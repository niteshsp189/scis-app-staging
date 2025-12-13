import { api } from './api';

export interface DuplicateSearchFilters {
  columns: string[];
  search_values?: Record<string, string>;
  customer_type?: 'Client' | 'Former' | 'Deceased' | 'Prospect';
  match_type?: 'exact' | 'similar';
  limit?: number;
}

export interface DuplicateGroup {
  id: string;
  column_values: Record<string, string>;
  matching_fields: string[];
  customers: DuplicateCustomer[];
  duplicate_count: number;
  similarity_score: number;
}

export interface DuplicateCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  home_phone: string;
  cell_phone: string;
  work_phone: string;
  fax: string;
  status: string;
  created_at: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  ssn?: string;
  address?: string;
  country?: string;
  height?: string;
  smoker?: string;
}

export interface DuplicateSearchResponse {
  success: boolean;
  data: {
    groups: DuplicateGroup[];
    total_groups: number;
    total_duplicates: number;
    columns_searched: string[];
    filters: DuplicateSearchFilters;
  };
}

export interface CustomerColumn {
  value: string;
  label: string;
}

class DuplicateFinderService {
  /**
   * Get available customer columns for duplicate search
   */
  getAvailableColumns(): CustomerColumn[] {
    try {
      return [
        { value: 'first_name', label: 'First Name' },
        { value: 'last_name', label: 'Last Name' },
        { value: 'email', label: 'Email' },
        { value: 'home_phone', label: 'Home Phone' },
        { value: 'cell_phone', label: 'Cell Phone' },
        { value: 'work_phone', label: 'Work Phone' },
        { value: 'fax', label: 'Fax' },
        { value: 'address', label: 'Address' },
        { value: 'city', label: 'City' },
        { value: 'state', label: 'State' },
        { value: 'zip_code', label: 'ZIP Code' },
        { value: 'country', label: 'Country' },
        { value: 'date_of_birth', label: 'Date of Birth' },
        { value: 'ssn', label: 'SSN' },
        { value: 'height', label: 'Height' },
        { value: 'smoker', label: 'Smoker' },
      ];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get customer type options
   */
  getCustomerTypes(): { value: string; label: string }[] {
    try {
      return [
        { value: 'Client', label: 'Client' },
        { value: 'Former', label: 'Former' },
        { value: 'Deceased', label: 'Deceased' },
        { value: 'Prospect', label: 'Prospect' },
      ];
    } catch (error) {
      return [];
    }
  }

  /**
   * Search for duplicate customers
   */
  async findDuplicates(filters: DuplicateSearchFilters): Promise<DuplicateSearchResponse> {
    try {
      
      const response = await api.post<DuplicateSearchResponse>('/customers/find-duplicates', {
        columns: filters.columns,
        search_values: filters.search_values,
        customer_type: filters.customer_type,
        match_type: filters.match_type || 'exact',
        limit: filters.limit || 50,
      });


      // The API returns {success: true, data: {groups: [...], ...}}
      // So response is already the complete response object
      return response as DuplicateSearchResponse;
    } catch (error: any) {
      
      // Re-throw with more context
      if (error?.response?.data) {
        const errorData = error.response.data;
        const errorMessage = errorData.message || errorData.error || 'Server error occurred';
        throw new Error(errorMessage);
      } else if (error?.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Network error or server unreachable');
      }
    }
  }

  /**
   * Calculate similarity percentage for display
   */
  calculateSimilarityPercentage(score: number): number {
    // Convert similarity score to percentage (assuming score is between 0 and 1)
    return Math.round(score * 100);
  }

  /**
   * Format duplicate group for display
   */
  formatDuplicateGroup(group: DuplicateGroup): DuplicateGroup {
    return {
      ...group,
      similarity_score: this.calculateSimilarityPercentage(group.similarity_score),
    };
  }

  /**
   * Get duplicate summary text
   */
  getDuplicateSummary(groups: DuplicateGroup[]): string {
    const totalGroups = groups.length;
    const totalDuplicates = groups.reduce((sum, group) => sum + group.duplicate_count, 0);
    
    if (totalGroups === 0) {
      return 'No duplicates found';
    }
    
    return `Found ${totalGroups} duplicate group${totalGroups > 1 ? 's' : ''} with ${totalDuplicates} duplicate customer${totalDuplicates > 1 ? 's' : ''}`;
  }

  /**
   * Build navigation URL for customer
   */
  getCustomerUrl(customerId: number): string {
    return `/customers/${customerId}`;
  }
}

export const duplicateFinderService = new DuplicateFinderService();
export default duplicateFinderService;