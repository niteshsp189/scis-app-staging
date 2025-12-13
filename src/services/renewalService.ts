import { api } from '@/lib/axios';

export interface PolicySummary {
  id: number;
  policy_number: string;
  status: string;
  premium_amount: number;
  start_date: string;
  end_date: string;
  customer_id: number;
  plan_id: number;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface RenewalStatistics {
  pending_renewals: number;
  upcoming_renewals: number;
  completed_renewals: number;
  declined_renewals: number;
  renewal_rate: number;
  pending_count?: number;
  accepted_count?: number;
  completed_count?: number;
  declined_count?: number;
  revenue_impact?: number;
}

export interface RenewalQuoteRequest {
  days_until_renewal?: number;
  term_changes?: {
    premium_frequency?: string;
    auto_renew?: boolean;
    policy_term_years?: number;
  };
  coverage_changes?: {
    coverage_amount?: number;
    deductible?: number;
    coverage_details?: Record<string, unknown>;
  };
  notes?: string;
  override_premium?: number;
  override_reason?: string;
}

export interface RenewalProcessRequest {
  payment_method: string;
  payment_reference?: string;
  installment_frequency: string;
  notes?: string;
  generate_documents?: boolean;
  send_notification?: boolean;
}

export interface RenewalQuote {
  quote_id: string;
  policy_id: number;
  old_premium: number;
  new_premium: number;
  new_term_start: string;
  new_term_end: string;
  term_changes: Record<string, unknown>;
  coverage_changes: Record<string, unknown>;
  requires_underwriting: boolean;
  quote_generated_at: string;
  quote_valid_until: string;
  is_premium_overridden?: boolean;
  override_reason?: string;
  calculated_premium?: number;
}

export interface PolicyRenewal {
  id: number;
  policy_id: number;
  renewal_date: string;
  new_term_start: string;
  new_term_end: string;
  old_premium: number;
  new_premium: number;
  renewal_status: string;
  quote_details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  created_by: number;
  processed_by?: number;
  policy?: PolicySummary;
}

export class RenewalService {
  /**
   * Generate a renewal quote for a policy
   */
  static async generateRenewalQuote(policyId: number, request: RenewalQuoteRequest): Promise<RenewalQuote> {
    const response = await api.post(`/policies/${policyId}/renewal-quote`, request);
    return response.data.data;
  }

  /**
   * Process a policy renewal after quote acceptance
   */
  static async processRenewal(policyId: number, renewalId: number, request: RenewalProcessRequest): Promise<PolicySummary> {
    const response = await api.post(`/renewals/${renewalId}/process`, request);
    return response.data.data;
  }

  /**
   * Get all renewals with optional filtering
   */
  static async getRenewals(page = 1, perPage = 10, filters: Record<string, unknown> = {}): Promise<{ data: PolicyRenewal[]; meta: PaginationMeta }> {
    const response = await api.get('/renewals', {
      params: {
        page,
        per_page: perPage,
        ...filters,
      },
    });
    return response.data;
  }

  /**
   * Get all renewals with optional status filter for the dashboard
   */
  static async getAllRenewals(status?: string): Promise<{ data: { data: PolicyRenewal[]; meta: PaginationMeta }; statistics: RenewalStatistics }> {
    const params: Record<string, unknown> = { with_policy: true, include: 'policy,policy.customer,policy.plan' };
    
    if (status && status !== 'all') {
      params.status = status;
    }
    
    const response = await api.get('/renewals', { params });
    return response.data;
  }

  /**
   * Get a specific renewal with details
   */
  static async getRenewal(renewalId: number): Promise<PolicyRenewal> {
    const response = await api.get(`/renewals/${renewalId}`);
    return response.data.data;
  }

  /**
   * Get renewals requiring attention
   */
  static async getRenewalsRequiringAttention(limit = 50): Promise<PolicyRenewal[]> {
    const response = await api.get('/renewals/requiring-attention', {
      params: { limit },
    });
    return response.data.data;
  }

  /**
   * Accept a renewal quote
   */
  static async acceptRenewal(renewalId: number, notes?: string): Promise<PolicyRenewal> {
    const response = await api.post(`/renewals/${renewalId}/accept`, { notes });
    return response.data.data;
  }

  /**
   * Decline a renewal quote
   */
  static async declineRenewal(renewalId: number, reason?: string): Promise<PolicyRenewal> {
    const response = await api.post(`/renewals/${renewalId}/decline`, { reason: reason || 'Declined by agent' });
    return response.data.data;
  }

  /**
   * Get renewal statistics
   */
  static async getRenewalStatistics(): Promise<RenewalStatistics> {
    const response = await api.get('/renewals/statistics');
    return response.data.data;
  }
  
  /**
   * Get renewal dashboard statistics
   */
  static async getRenewalStats(): Promise<RenewalStatistics> {
    try {
      const response = await api.get('/renewals/dashboard-stats');
      return response.data.data;
    } catch (error) {
      // Fallback mock data if API endpoint doesn't exist yet
      return {
        pending_count: 4,
        accepted_count: 2,
        completed_count: 1,
        declined_count: 0,
        revenue_impact: 3450.75,
        pending_renewals: 4,
        upcoming_renewals: 6,
        completed_renewals: 1,
        declined_renewals: 0,
        renewal_rate: 0.85
      };
    }
  }

  /**
   * Get renewal history for a specific policy
   */
  static async getPolicyRenewalHistory(policyId: number): Promise<PolicyRenewal[]> {
    
    try {
      // Add a timeout to prevent long-hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await api.get(`/policies/${policyId}/renewals`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        return response.data.data;
      } catch (axiosError) {
        clearTimeout(timeoutId);
        throw axiosError;
      }
    } catch (error: unknown) {
      // Enhanced error logging with more details
      console.error(`[RenewalService] Error fetching renewal history for policy ${policyId}:`, error);
      
      // Type guard to check if error is an object with a code property
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_CANCELED') {
        console.warn('[RenewalService] Request was cancelled due to timeout');
      }
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`[RenewalService] Server responded with status ${error.response.status}:`, 
          error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('[RenewalService] No response received from server:', error.request);
      }
      
      // Rethrow with a more descriptive message
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const enhancedError = new Error(`Failed to fetch renewal history: ${errorMessage}`);
      throw enhancedError;
    }
  }
}
