import { api } from './api';

export interface MissingInfoSearchFilters {
  columns: string[];
  customer_type?: 'Client' | 'Former' | 'Deceased' | 'Prospect' | null;
  limit?: number;
}

export interface MissingInfoCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  home_phone: string;
  cell_phone: string;
  work_phone: string;
  fax: string;
  status: string;
  customer_type: string;
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
  missing_fields: string[];
  missing_count: number;
}

export interface MissingInfoSearchResponse {
  success: boolean;
  data: {
    customers: MissingInfoCustomer[];
    total_customers: number;
    columns_checked: string[];
    filters: MissingInfoSearchFilters;
  };
}

class MissingInfoService {
  /**
   * Search for customers with missing information
   */
  async findMissingInformation(filters: MissingInfoSearchFilters): Promise<MissingInfoSearchResponse> {
    try {
      console.log('🔍 Sending missing info request:', filters);
      
      const response = await api.post<MissingInfoSearchResponse>('/customers/missing-information', {
        columns: filters.columns,
        customer_type: filters.customer_type,
        limit: filters.limit || 50,
      });

      console.log('📋 Raw API response:', response);

      // The API response is already the full structure: { success: true, data: { customers: [...] } }
      // Just return it directly
      return response;
    } catch (error: any) {
      console.error('❌ Missing info request failed:', error);
      
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
   * Format missing field name for display
   */
  formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Get summary text for missing information results
   */
  getMissingInfoSummary(customers: MissingInfoCustomer[]): string {
    const totalCustomers = customers.length;
    const totalMissingFields = customers.reduce((sum, customer) => sum + customer.missing_count, 0);
    
    if (totalCustomers === 0) {
      return 'No customers found with missing information';
    }
    
    return `Found ${totalCustomers} customer${totalCustomers > 1 ? 's' : ''} with ${totalMissingFields} missing field${totalMissingFields > 1 ? 's' : ''}`;
  }

  /**
   * Build navigation URL for customer
   */
  getCustomerUrl(customerId: number): string {
    return `/customers/${customerId}`;
  }

  /**
   * Format customer info for clipboard
   */
  formatCustomerForClipboard(customer: MissingInfoCustomer): string {
    const lines = [
      `${customer.first_name} ${customer.last_name}`,
      customer.email ? `Email: ${customer.email}` : null,
      (customer.home_phone || customer.cell_phone || customer.work_phone) ? `Phone: ${customer.home_phone || customer.cell_phone || customer.work_phone}` : null,
      (customer.address || customer.city || customer.state || customer.zip_code) ? `Address: ${[customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')}` : null,
      customer.missing_fields && customer.missing_fields.length > 0 ? `Missing Fields: ${customer.missing_fields.map(field => this.formatFieldName(field)).join(', ')}` : null,
      customer.customer_type ? `Customer Type: ${customer.customer_type}` : null
    ].filter(Boolean);
    return lines.join('\n');
  }
}

export const missingInfoService = new MissingInfoService();
export default missingInfoService;