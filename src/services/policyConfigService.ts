import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface PolicyConfiguration {
  premium_frequencies: string[];
  policy_statuses: string[];
  billing_methods: string[];
  installment_multipliers: Record<string, number>;
}

export interface PolicyConfigResponse {
  success: boolean;
  data: PolicyConfiguration;
  message: string;
}

class PolicyConfigService {
  private configCache: PolicyConfiguration | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getConfiguration(): Promise<PolicyConfiguration> {
    const now = Date.now();
    
    // Return cached data if it's still valid
    if (this.configCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.configCache;
    }

    try {
      const response = await axios.get<PolicyConfigResponse>(`${API_BASE_URL}/policies/configuration`);
      
      if (response.data.success) {
        this.configCache = response.data.data;
        this.cacheTimestamp = now;
        return this.configCache;
      } else {
        throw new Error(response.data.message || 'Failed to fetch policy configuration');
      }
    } catch (error) {
      console.error('Error fetching policy configuration:', error);
      
      // Return fallback configuration if API fails
      const fallbackConfig: PolicyConfiguration = {
        premium_frequencies: ['monthly', 'quarterly', 'semi-annually', 'annually'],
        policy_statuses: ['active', 'pending', 'cancelled', 'expired'],
        billing_methods: ['automatic', 'manual'],
        installment_multipliers: {
          'monthly': 12,
          'quarterly': 4,
          'semi-annually': 2,
          'annually': 1
        }
      };
      
      this.configCache = fallbackConfig;
      this.cacheTimestamp = now;
      return fallbackConfig;
    }
  }

  async getPremiumFrequencies(): Promise<string[]> {
    const config = await this.getConfiguration();
    return config.premium_frequencies;
  }

  async getPolicyStatuses(): Promise<string[]> {
    const config = await this.getConfiguration();
    return config.policy_statuses;
  }

  async getBillingMethods(): Promise<string[]> {
    const config = await this.getConfiguration();
    return config.billing_methods;
  }

  async getInstallmentMultiplier(frequency: string): Promise<number> {
    const config = await this.getConfiguration();
    return config.installment_multipliers[frequency] || 1;
  }

  // Clear cache to force refresh
  clearCache(): void {
    this.configCache = null;
    this.cacheTimestamp = 0;
  }
}

const policyConfigService = new PolicyConfigService();
export default policyConfigService;
