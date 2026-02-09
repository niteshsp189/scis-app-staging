import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface PremiumCalculationRequest {
  plan_id: number;
  customer_age?: number;
  income?: number;
  employment?: string;
  premium_frequency: string; // Updated to be more flexible with configuration-driven values
  coverage_amount?: number;
  custom_fields?: Record<string, string | number | boolean | null>;
}

export interface PremiumCalculationResponse {
  success: boolean;
  data: {
    premium_amount: number;
    frequency: string;
    annual_premium: number;
    installment_amount: number;
    total_installments: number;
    coverage_amount: number;
    plan: {
      id: number;
      name: string;
      code: string;
      plan_type: string;
    };
  };
  message: string;
}

export interface PolicyTermsRequest {
  plan_id: number;
  start_date?: string;
  term_length?: number;
  term_unit?: "months" | "years";
}

export interface PolicyTermsResponse {
  success: boolean;
  data: {
    start_date: string;
    end_date: string;
    term_length: number;
    term_unit: string;
    grace_period_days: number;
    grace_period_end_date: string;
    total_days: number;
    plan: {
      id: number;
      name: string;
      code: string;
      plan_type: string;
    };
  };
  message: string;
}

export interface PolicyCreationRequest {
  customer_id?: number;
  dependent_id?: number;
  plan_id: number;
  premium_frequency: string;
  start_date: string;
  end_date?: string;
  premium_amount?: number;
  coverage_amount?: number;
  agents?: { agent_id: string; agent_type: string; commission_rate: string }[];
  custom_fields?: Record<string, string | number | boolean | null>;
  medicare_data?: Record<string, string | number | boolean | null>;
  // Customer details
  customer_age?: number;
  income?: number;
  employment?: string;
  // Policy Management Fields
  policy_number?: string;
  carrier_policy_number?: string;
  status?: string;
  base_premium?: number;
  taxes_and_fees?: number;
  total_premium?: number;
  down_payment?: number;
  billing_method?: string;
  // Simplified form fields
  agent_of_record?: string;
  writing_agent?: string;
  extra_fields?: Record<string, any>;
  field_values?: Record<string, any>;
}

export interface Policy {
  id: number;
  policy_number: string;
  customer_id: number;
  plan_id: number;
  status: string;
  start_date: string;
  end_date: string;
  premium_amount: number;
  coverage_amount: number;
  premium_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyCreationResponse {
  success: boolean;
  data: Policy;
  message: string;
}

export interface InsuranceCompany {
  id: number;
  name: string;
}

export interface Plan {
  id: number;
  name: string;
  company_id: number;
  plan_type_id: number;
  // Add other plan properties as needed
}

export interface CustomField {
  id: string | number;
  name: string;
  label: string;
  type: string;
  options?: { id: string; value: string }[];
  // Add other field properties as needed
}

export interface PlanFieldsResponse {
  fields: CustomField[];
  common_fields: CustomField[];
  // Add other response properties as needed
}

export interface PlanConflictResponse {
  has_conflict: boolean;
  message: string;
  // Add other conflict properties as needed
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  name?: string;
  email?: string;
  phone?: string;
  customer_number?: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  is_active: boolean;
}

class PolicyCreationService {
  private getAuthHeaders() {
    const token = localStorage.getItem("auth_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async calculatePremium(
    data: PremiumCalculationRequest,
  ): Promise<PremiumCalculationResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/policies/calculate-premium`,
        data,
        { headers: this.getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Premium calculation failed:", error.response.data);
        throw new Error(
          error.response.data.message || "Failed to calculate premium",
        );
      }
      console.error(
        "An unexpected error occurred during premium calculation:",
        error,
      );
      throw new Error(
        "An unexpected error occurred during premium calculation",
      );
    }
  }

  async calculatePolicyTerms(
    data: PolicyTermsRequest,
  ): Promise<PolicyTermsResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/policies/calculate-terms`,
        data,
        { headers: this.getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Policy terms calculation failed:", error.response.data);
        throw new Error(
          error.response.data.message || "Failed to calculate policy terms",
        );
      }
      console.error(
        "An unexpected error occurred during policy terms calculation:",
        error,
      );
      throw new Error(
        "An unexpected error occurred during policy terms calculation",
      );
    }
  }

  async createPolicy(
    data: PolicyCreationRequest,
  ): Promise<PolicyCreationResponse> {
    try {
      // Determine if this is simplified form data based on structure
      const isSimplifiedData = !!(
        data.agent_of_record &&
        data.writing_agent &&
        data.start_date &&
        !data.premium_amount &&
        !data.coverage_amount &&
        !data.agents
      );

      const endpoint = isSimplifiedData
        ? `${API_BASE_URL}/policies/simplified`
        : `${API_BASE_URL}/policies`;

      const response = await axios.post<PolicyCreationResponse>(
        endpoint,
        data,
        { headers: this.getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Policy creation failed:", error.response.data);
        throw new Error(
          error.response.data.message || "Failed to create policy",
        );
      }
      console.error(
        "An unexpected error occurred during policy creation:",
        error,
      );
      throw new Error("An unexpected error occurred during policy creation");
    }
  }

  async getInsuranceCompanies(): Promise<InsuranceCompany[]> {
    try {
      const response = await axios.get<
        { data: InsuranceCompany[] } | InsuranceCompany[]
      >(`${API_BASE_URL}/insurance-companies`, {
        headers: this.getAuthHeaders(),
      });

      // Handle paginated or direct array response
      const companies = Array.isArray(response.data)
        ? response.data
        : response.data.data;
      if (Array.isArray(companies)) {
        return companies;
      }

      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Failed to fetch insurance companies:",
          error.response?.data,
        );
      } else {
        console.error(
          "An unexpected error occurred while fetching insurance companies:",
          error,
        );
      }
      throw new Error("Failed to fetch insurance companies");
    }
  }

  async getPlansByCompany(companyId: number): Promise<Plan[]> {
    try {
      const response = await axios.get<Plan[] | { data: Plan[] }>(
        `${API_BASE_URL}/plans/company/${companyId}`,
        { headers: this.getAuthHeaders() },
      );
      // Handle direct array or paginated response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Failed to fetch plans:", error.response?.data);
      } else {
        console.error(
          "An unexpected error occurred while fetching plans:",
          error,
        );
      }
      throw new Error("Failed to fetch plans");
    }
  }

  async getPlanCustomFields(planTypeId: number): Promise<CustomField[]> {
    try {
      const response = await axios.get<{ data: CustomField[] }>(
        `${API_BASE_URL}/plan-types/${planTypeId}/fields`,
        { headers: this.getAuthHeaders() },
      );
      return response.data.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Failed to fetch plan custom fields:",
          error.response?.data,
        );
      } else {
        console.error(
          "An unexpected error occurred while fetching plan custom fields:",
          error,
        );
      }
      throw new Error("Failed to fetch plan custom fields");
    }
  }

  async getPlanFields(planId: number): Promise<PlanFieldsResponse> {
    try {
      const response = await axios.get<{ data: PlanFieldsResponse }>(
        `${API_BASE_URL}/plans/${planId}/fields`,
        { headers: this.getAuthHeaders() },
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Failed to fetch plan fields:", error.response?.data);
      } else {
        console.error(
          "An unexpected error occurred while fetching plan fields:",
          error,
        );
      }
      throw new Error("Failed to fetch plan fields");
    }
  }

  async checkPlanConflict(
    customerId: number,
    planTypeId: number,
  ): Promise<PlanConflictResponse> {
    try {
      const response = await axios.post<PlanConflictResponse>(
        `${API_BASE_URL}/plan-conflict-rules/check-conflict`,
        { customer_id: customerId, plan_type_id: planTypeId },
        { headers: this.getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Plan conflict check failed:", error.response?.data);
      } else {
        console.error(
          "An unexpected error occurred during plan conflict check:",
          error,
        );
      }
      throw new Error("Failed to check plan conflicts");
    }
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      // Only fetch customers with 'Client' status for policy creation
      const response = await axios.get<{ data: Customer[] } | Customer[]>(
        `${API_BASE_URL}/customers?status=Client`,
        { headers: this.getAuthHeaders() },
      );
      // Handle paginated or direct array response
      if ("data" in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data as Customer[];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Failed to fetch customers:", error.response?.data);
      } else {
        console.error(
          "An unexpected error occurred while fetching customers:",
          error,
        );
      }
      throw new Error("Failed to fetch customers");
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      // Only search customers with 'Client' status for policy creation
      const response = await axios.get<{ data: Customer[] } | Customer[]>(
        `${API_BASE_URL}/customers/search?q=${encodeURIComponent(query)}&status=Client`,
        { headers: this.getAuthHeaders() },
      );
      if ("data" in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data as Customer[];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Failed to search customers:", error.response?.data);
      } else {
        console.error(
          "An unexpected error occurred while searching customers:",
          error,
        );
      }
      throw new Error("Failed to search customers");
    }
  }

  async getCompaniesByPlanType(
    planTypeId: number,
  ): Promise<InsuranceCompany[]> {
    try {
      const response = await axios.get<
        { data: InsuranceCompany[] } | InsuranceCompany[]
      >(`${API_BASE_URL}/insurance-companies/by-plan-type/${planTypeId}`, {
        headers: this.getAuthHeaders(),
      });

      // Handle paginated or direct array response
      const companies = Array.isArray(response.data)
        ? response.data
        : response.data.data;
      if (Array.isArray(companies)) {
        return companies;
      }

      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Failed to fetch companies by plan type:",
          error.response?.data,
        );
      } else {
        console.error(
          "An unexpected error occurred while fetching companies by plan type:",
          error,
        );
      }
      throw new Error("Failed to fetch companies by plan type");
    }
  }

  async getPlansByCompanyAndType(
    companyId: number,
    planTypeId: number,
  ): Promise<Plan[]> {
    try {
      const response = await axios.get<Plan[] | { data: Plan[] }>(
        `${API_BASE_URL}/plans/company/${companyId}/type/${planTypeId}`,
        { headers: this.getAuthHeaders() },
      );

      // Handle direct array or paginated response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Failed to fetch plans by company and type:",
          error.response?.data,
        );
      } else {
        console.error(
          "An unexpected error occurred while fetching plans by company and type:",
          error,
        );
      }
      throw new Error("Failed to fetch plans by company and type");
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const response = await axios.get<{ data: User[] } | User[]>(
        `${API_BASE_URL}/users/agents`,
        { headers: this.getAuthHeaders() },
      );

      // Handle paginated or direct array response
      const users = Array.isArray(response.data)
        ? response.data
        : response.data.data;
      if (Array.isArray(users)) {
        return users;
      }

      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Failed to fetch agents:", error.response?.data);
      } else {
        console.error(
          "An unexpected error occurred while fetching agents:",
          error,
        );
      }
      throw new Error("Failed to fetch agents");
    }
  }

  async updatePolicy(
    policyId: number,
    data: Partial<PolicyCreationRequest>,
  ): Promise<PolicyCreationResponse> {
    try {
      const response = await axios.put<PolicyCreationResponse>(
        `${API_BASE_URL}/policies/${policyId}`,
        data,
        { headers: this.getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Policy update failed:", error.response.data);
        throw new Error(
          error.response.data.message || "Failed to update policy",
        );
      }
      console.error(
        "An unexpected error occurred during policy update:",
        error,
      );
      throw new Error("An unexpected error occurred during policy update");
    }
  }
}

export default new PolicyCreationService();
