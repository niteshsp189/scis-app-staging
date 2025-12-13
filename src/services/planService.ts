import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock data for development
const mockPlanTypes: PlanType[] = [
  {
    id: 1,
    name: "Auto Insurance",
    description: "Motor vehicle insurance coverage",
    code: "AUTO",
    category: "Vehicle",
    status: "Active",
    grace_period_days: 15,
    is_active: true,
    display_order: 1,
    icon: "car",
    color: "#3B82F6",
    features: [
      "Collision coverage",
      "Comprehensive coverage",
      "Liability coverage",
    ],
    restrictions: ["Age restrictions", "Vehicle type limitations"],
    requirements: ["Valid driver's license", "Vehicle registration"],
    created_at: "2025-07-14T08:11:32.000000Z",
    updated_at: "2025-07-14T08:11:32.000000Z",
    total_plans: 5,
    total_active_plans: 4,
    total_fields: 8,
  },
  {
    id: 2,
    name: "Life Insurance",
    description: "Life and term insurance policies",
    code: "LIFE",
    category: "Life",
    status: "Active",
    grace_period_days: 30,
    is_active: true,
    display_order: 2,
    icon: "shield",
    color: "#10B981",
    features: ["Death benefit", "Cash value accumulation", "Policy loans"],
    restrictions: ["Age limitations", "Health conditions"],
    requirements: ["Medical examination", "Health history"],
    created_at: "2025-07-14T08:11:32.000000Z",
    updated_at: "2025-07-14T08:11:32.000000Z",
    total_plans: 3,
    total_active_plans: 3,
    total_fields: 6,
  },
  {
    id: 3,
    name: "Health Insurance",
    description: "Medical and health coverage",
    code: "HEALTH",
    category: "Health",
    status: "Active",
    grace_period_days: 30,
    is_active: true,
    display_order: 3,
    icon: "heart",
    color: "#EF4444",
    features: ["Doctor visits", "Hospital stays", "Prescription coverage"],
    restrictions: ["Network limitations", "Pre-existing conditions"],
    requirements: ["Health assessment", "Enrollment period compliance"],
    created_at: "2025-07-14T08:11:32.000000Z",
    updated_at: "2025-07-14T08:11:32.000000Z",
    total_plans: 7,
    total_active_plans: 6,
    total_fields: 10,
  },
];

const mockPlans: Plan[] = [
  {
    id: 1,
    name: "Comprehensive Auto Coverage",
    description:
      "Full coverage auto insurance with collision and comprehensive",
    company_id: 1,
    company: {
      id: 1,
      name: "State Farm",
      industry: "Insurance",
      status: "Active",
    },
    plan_type_id: 1,
    plan_type: {
      id: 1,
      name: "Auto Insurance",
      category: "Vehicle",
      grace_period_days: 15,
    },
    status: "Active",
    monthly_premium: 150.0,
    annual_premium: 1800.0,
    base_premium: 150.0,
    is_active: true,
    field_values: {
      deductible: 1000,
      coverage_limit: 100000,
      liability_limit: 300000,
    },
    field_config: {},
    common_fields: {},
    created_at: "2025-07-14T08:11:32.000000Z",
    updated_at: "2025-07-14T08:11:32.000000Z",
    total_active_policies: 25,
  },
  {
    id: 2,
    name: "Term Life Insurance",
    description: "20-year term life insurance policy",
    company_id: 2,
    company: {
      id: 2,
      name: "Allstate",
      industry: "Insurance",
      status: "Active",
    },
    plan_type_id: 2,
    plan_type: {
      id: 2,
      name: "Life Insurance",
      category: "Life",
      grace_period_days: 30,
    },
    status: "Active",
    monthly_premium: 75.0,
    annual_premium: 900.0,
    base_premium: 75.0,
    is_active: true,
    field_values: {
      coverage_amount: 500000,
      term_length: 20,
      beneficiary: "Spouse",
    },
    field_config: {},
    common_fields: {},
    created_at: "2025-07-14T08:11:32.000000Z",
    updated_at: "2025-07-14T08:11:32.000000Z",
    total_active_policies: 15,
  },
];

// Plan Type interfaces
export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
  path: string;
  first_page_url: string;
  last_page_url: string;
  next_page_url: string | null;
  prev_page_url: string | null;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

// Simplified Plan Type interfaces - matching actual backend structure
export interface SimplifiedPlanType {
  id: number;
  name: string;
  slug: string;
  conflicting_plan_types: number[] | null;
  extra_fields: Record<string, { label: string; included: boolean; required: boolean }>;
  is_active: boolean;
  plans_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SimplifiedPlanTypeCreateRequest {
  name: string;
  slug?: string;
  conflicting_plan_types?: number[];
  extra_fields?: Record<string, { label: string; included: boolean; required: boolean }>;
  is_active?: boolean;
}

// Legacy Plan Type interfaces (for backward compatibility)
export interface PlanType {
  id: number;
  name: string;
  description: string;
  code: string;
  category: string;
  status: "Active" | "Inactive";
  grace_period_days: number;
  is_active: boolean;
  display_order: number;
  icon?: string;
  color: string;
  features?: string[];
  restrictions?: string[];
  requirements?: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  fields?: PlanTypeField[];
  total_plans?: number;
  total_active_plans?: number;
  total_fields?: number;
  meta?: PaginationMeta;
}

export interface PlanTypeField {
  id: string;
  plan_type_id: number;
  field_name: string;
  field_label: string;
  field_type:
    | "text"
    | "number"
    | "date"
    | "select"
    | "boolean"
    | "textarea"
    | "email"
    | "url"
    | "checkbox"
    | "radio"
    | "multi_select"
    | "file";
  is_required: boolean;
  is_active: boolean;
  options?: string[];
  default_value?: string;
  validation_rules?: string[];
  help_text?: string;
  display_order: number;
  metadata?: {
    description?: string;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      required?: boolean;
    };
    ui?: {
      width?: string | number;
      hidden?: boolean;
      order?: number;
    };
  };
  created_at: string;
  updated_at: string;
}

// Custom Field interfaces
export interface PlanCustomField {
  id: number;
  plan_id: number;
  field_name: string;
  field_label: string;
  field_type: "text" | "number" | "date" | "select" | "boolean" | "textarea" | "email" | "url" | "checkbox" | "radio" | "multi_select" | "file";
  is_required: boolean;
  is_visible: boolean;
  placeholder?: string;
  options?: string[];
  default_value?: string;
  validation_rules?: string[];
  help_text?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CommonField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: "text" | "number" | "date" | "select" | "boolean" | "textarea" | "email" | "url" | "checkbox" | "radio" | "multi_select" | "file";
  is_required: boolean;
  is_active: boolean;
  placeholder?: string;
}

export interface GlobalCustomField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: "text" | "number" | "date" | "select" | "boolean" | "textarea" | "email" | "url" | "checkbox" | "radio" | "multi_select" | "file";
  is_required: boolean;
  is_active: boolean;
  is_associated: boolean; // Whether this global field is associated with the plan
  placeholder?: string;
  options?: string[];
  default_value?: string;
  created_at?: string;
  updated_at?: string;
}

// Backend response structure for global fields with plan status
export interface GlobalFieldWithPlanStatus {
  global_field: GlobalCustomField;
  is_in_plan: boolean;
  plan_field: PlanCustomField | null;
}

export interface PlanFieldsResponse {
  fields: PlanCustomField[];
  common_fields: CommonField[];
  plan: {
    id: number;
    name: string;
    plan_type_id: number;
    plan_type: PlanType;
  };
}

export interface CustomFieldCreateRequest {
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  placeholder?: string;
  options?: string[];
  default_value?: string;
}

// Plan (Insurance Product) interfaces
export interface Plan {
  id: number;
  name: string;
  description: string;
  company_id: number;
  company?: {
    id: number;
    name: string;
    industry: string;
    status: string;
  };
  plan_type_id: number;
  plan_type?: {
    id: number;
    name: string;
    category: string;
    grace_period_days: number;
  };
  status: "Active" | "Inactive" | "Draft";
  base_premium?: number;
  monthly_premium?: number;
  annual_premium?: number;
  coverage_details?: Record<string, string | number | boolean | null>;
  eligibility_criteria?: Record<string, string | number | boolean | null>;
  field_values?: Record<string, string | number | boolean | null>;
  field_config?: Record<string, { visible?: boolean; required?: boolean; label?: string; options?: string[] }>;
  common_fields?: Record<string, { hasStartDateOverride?: boolean; enabled?: boolean; required?: boolean }>;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  total_active_policies?: number;
  total_premium_amount?: number;
}

// Request/Response interfaces
export interface PlanTypeCreateRequest {
  name: string;
  description?: string;
  code: string;
  category: string;
  status: "Active" | "Inactive";
  grace_period_days?: number;
  is_active?: boolean;
  display_order?: number;
  icon?: string;
  color?: string;
  features?: string[];
  restrictions?: string[];
  requirements?: string[];
}

export interface PlanCreateRequest {
  name: string;
  description?: string;
  company_id: number;
  plan_type_id: number;
  status: "Active" | "Inactive" | "Draft";
  base_premium?: number;
  monthly_premium?: number;
  annual_premium?: number;
  coverage_details?: Record<string, string | number | boolean | null>;
  eligibility_criteria?: Record<string, string | number | boolean | null>;
  field_values?: Record<string, string | number | boolean | null>;
  field_config?: Record<string, { visible?: boolean; required?: boolean; label?: string; options?: string[] }>;
  common_fields?: Record<string, { hasStartDateOverride?: boolean; enabled?: boolean; required?: boolean }>;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
  meta?: PaginationMeta;
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  first_page_url?: string;
  last_page_url?: string;
  next_page_url?: string | null;
  path?: string;
  prev_page_url?: string | null;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Plan Type Service
export class PlanTypeService {
  private static baseUrl = `${API_BASE_URL}/plan-types`;

  static async getAll(params?: {
    status?: string;
    active?: boolean;
    category?: string;
    search?: string;
    order_by?: string;
    order_direction?: "asc" | "desc";
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<PlanType>> {
    try {
      const response = await api.get<PaginatedResponse<PlanType>>(this.baseUrl, {
        params: {
          ...params,
          page: params?.page || 1,
          per_page: params?.per_page || 20,
        },
      });

      // Handle both paginated and non-paginated responses
      if (response.data && 'data' in response.data) {
        return response.data;
      }

      // If the response is just an array, wrap it in a paginated response
      const dataArray = Array.isArray(response.data) ? response.data : [];
      return {
        data: dataArray,
        current_page: 1,
        per_page: params?.per_page || 20,
        total: dataArray.length,
        last_page: 1,
        from: dataArray.length > 0 ? 1 : 0,
        to: dataArray.length,
        meta: {
          current_page: 1,
          from: dataArray.length > 0 ? 1 : 0,
          last_page: 1,
          per_page: params?.per_page || 20,
          to: dataArray.length,
          total: dataArray.length,
          path: this.baseUrl,
          first_page_url: `${this.baseUrl}?page=1`,
          last_page_url: `${this.baseUrl}?page=1`,
          next_page_url: null,
          prev_page_url: null,
          links: [
            {
              url: null,
              label: "&laquo; Previous",
              active: false,
            },
            {
              url: `${this.baseUrl}?page=1`,
              label: "1",
              active: true,
            },
            {
              url: null,
              label: "Next &raquo;",
              active: false,
            },
          ],
        },
      };
    } catch (error: unknown) {
      console.error('Error fetching plan types:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch plan types: ${error.message}`);
      }
      throw new Error('Failed to fetch plan types: Unknown error');
    }
  }

  static async getById(id: number): Promise<PlanType> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  static async create(
    data: SimplifiedPlanTypeCreateRequest,
  ): Promise<ApiResponse<SimplifiedPlanType>> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error: any) {
      // Check if it's a validation error or other API error
      if (error.response?.status === 422 || error.response?.data?.errors) {
        // Re-throw validation errors so they can be handled properly in the component
        throw error;
      }

      console.warn("API call failed, simulating creation:", error);
      // Only use mock data for network errors, not validation errors
      const newPlanType: SimplifiedPlanType = {
        id: Math.max(...mockPlanTypes.map((p) => p.id)) + 1,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        conflicting_plan_types: data.conflicting_plan_types || null,
        extra_fields: data.extra_fields || {},
        is_active: data.is_active ?? true,
        plans_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        message: "Plan type created successfully",
        data: newPlanType,
      };
    }
  }

  static async update(
    id: number,
    data: Partial<PlanTypeCreateRequest>,
  ): Promise<ApiResponse<PlanType>> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error: unknown) {
      // Re-throw validation errors so they can be handled properly in the component
      if (error.response?.status === 422 || error.response?.data?.errors) {
        throw error;
      }
      // Re-throw other errors as well
      throw error;
    }
  }

  static async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  static async getStatistics(): Promise<{
    total_plan_types: number;
    active_plan_types: number;
    plan_types_by_category: Record<string, number>;
    plan_types_by_status: Record<string, number>;
    average_grace_period: number;
    grace_period_distribution: Record<number, number>;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/statistics`);
      return response.data;
    } catch (error) {
      console.warn("API call failed, using mock statistics:", error);
      return {
        total_plan_types: mockPlanTypes.length,
        active_plan_types: mockPlanTypes.filter((p) => p.is_active).length,
        plan_types_by_category: mockPlanTypes.reduce(
          (acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
        plan_types_by_status: mockPlanTypes.reduce(
          (acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
        average_grace_period:
          mockPlanTypes.reduce((sum, p) => sum + p.grace_period_days, 0) /
          mockPlanTypes.length,
        grace_period_distribution: mockPlanTypes.reduce(
          (acc, p) => {
            acc[p.grace_period_days] = (acc[p.grace_period_days] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        ),
      };
    }
  }

  static async getCategories(): Promise<string[]> {
    const response = await api.get(`${this.baseUrl}/categories`);
    return response.data;
  }

  static async getOptions(): Promise<PlanType[]> {
    const response = await api.get(`${this.baseUrl}/options`);
    return response.data;
  }

  static async updateDisplayOrder(
    planTypes: { id: number; display_order: number }[],
  ): Promise<ApiResponse<void>> {
    const response = await api.post(`${this.baseUrl}/update-display-order`, {
      plan_types: planTypes,
    });
    return response.data;
  }

  static async toggleActive(id: number): Promise<ApiResponse<PlanType>> {
    const response = await api.patch(`${this.baseUrl}/${id}/toggle-active`);
    return response.data;
  }

  static async getFields(id: number): Promise<ApiResponse<PlanTypeField[]>> {
    const response = await api.get(`${this.baseUrl}/${id}/fields`);
    return response.data;
  }
}

// Plan Service
export class PlanService {
  private static baseUrl = `${API_BASE_URL}/plans`;

  // Get plan-specific custom fields
  static async getPlanFields(planId: number): Promise<ApiResponse<PlanFieldsResponse>> {
    try {
      const response = await api.get(`${this.baseUrl}/${planId}/fields`);
      return response.data;
    } catch (error) {
      console.error("Failed to load plan custom fields:", error);
      throw error;
    }
  }

  // Get global custom fields with plan association status
  static async getGlobalFields(planId: number): Promise<ApiResponse<GlobalFieldWithPlanStatus[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/${planId}/global-fields`);
      return response.data;
    } catch (error) {
      console.error("Failed to load global custom fields:", error);
      throw error;
    }
  }

  // Create a new custom field for a plan
  static async createCustomField(planId: number, fieldData: CustomFieldCreateRequest): Promise<ApiResponse<PlanCustomField>> {
    try {
      const response = await api.post(`${this.baseUrl}/${planId}/custom-fields`, fieldData);
      return response.data;
    } catch (error) {
      console.error("Failed to create custom field:", error);
      throw error;
    }
  }

  // Add a global custom field to a plan
  static async addGlobalField(planId: number, globalFieldId: string): Promise<ApiResponse<PlanCustomField>> {
    try {
      const response = await api.post(`${this.baseUrl}/${planId}/global-fields/add`, {
        global_custom_field_id: globalFieldId
      });
      return response.data;
    } catch (error) {
      console.error("Failed to add global field to plan:", error);
      throw error;
    }
  }

  static async getAll(params?: {
    company_id?: number;
    plan_type_id?: number;
    status?: string;
    active?: boolean;
    search?: string;
    order_by?: string;
    order_direction?: "asc" | "desc";
    page?: number;
  }): Promise<PaginatedResponse<Plan>> {
    try {
      const response = await api.get(this.baseUrl, { params });
      // Handle the data structure correctly
      if (response.data.data) {
        return response.data;
      }
      // If the response is just an array, wrap it
      return {
        data: Array.isArray(response.data) ? response.data : [],
        current_page: 1,
        per_page: 20,
        total: Array.isArray(response.data) ? response.data.length : 0,
        last_page: 1,
        from: 1,
        to: Array.isArray(response.data) ? response.data.length : 0,
      };
    } catch (error) {
      console.warn("API call failed, using mock data:", error);
      // Fallback to mock data
      let filteredData = [...mockPlans];

      if (params?.company_id) {
        filteredData = filteredData.filter(
          (item) => item.company_id === params.company_id,
        );
      }

      if (params?.plan_type_id) {
        filteredData = filteredData.filter(
          (item) => item.plan_type_id === params.plan_type_id,
        );
      }

      if (params?.status) {
        filteredData = filteredData.filter(
          (item) => item.status === params.status,
        );
      }

      if (params?.active) {
        filteredData = filteredData.filter((item) => item.is_active);
      }

      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            item.name.toLowerCase().includes(search) ||
            item.description?.toLowerCase().includes(search) ||
            item.company?.name.toLowerCase().includes(search),
        );
      }

      return {
        data: filteredData,
        current_page: 1,
        per_page: 20,
        total: filteredData.length,
        last_page: 1,
        from: 1,
        to: filteredData.length,
      };
    }
  }

  static async getById(id: number): Promise<Plan> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  static async create(data: PlanCreateRequest): Promise<ApiResponse<Plan>> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error: unknown) {
      // Check if it's a validation error or other API error
      if (error.response?.status === 422 || error.response?.data?.errors) {
        // Re-throw validation errors so they can be handled properly in the component
        throw error;
      }

      console.warn("API call failed, simulating creation:", error);
      // Only use mock data for network errors, not validation errors
      const newPlan: Plan = {
        id: Math.max(...mockPlans.map((p) => p.id)) + 1,
        ...data,
        is_active: data.is_active ?? true,
        company: mockPlans.find((p) => p.company_id === data.company_id)
          ?.company || {
          id: data.company_id,
          name: "Unknown Company",
          industry: "Insurance",
          status: "Active",
        },
        plan_type: mockPlanTypes.find((p) => p.id === data.plan_type_id) || {
          id: data.plan_type_id,
          name: "Unknown Type",
          category: "Unknown",
          grace_period_days: 30,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_active_policies: 0,
      };
      mockPlans.push(newPlan);

      return {
        message: "Insurance product created successfully",
        plan: newPlan,
      };
    }
  }

  static async update(
    id: number,
    data: Partial<PlanCreateRequest>,
  ): Promise<ApiResponse<Plan>> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error: unknown) {
      // Re-throw validation errors so they can be handled properly in the component
      if (error.response?.status === 422 || error.response?.data?.errors) {
        throw error;
      }
      // Re-throw other errors as well
      throw error;
    }
  }

  static async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  static async getStatistics(): Promise<{
    total_products: number;
    active_products: number;
    draft_products: number;
    inactive_products: number;
    products_by_company: Record<string, number>;
    products_by_type: Record<string, number>;
    average_premium: number;
    total_premium_value: number;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/statistics`);
      return response.data;
    } catch (error) {
      console.warn("API call failed, using mock statistics:", error);
      return {
        total_products: mockPlans.length,
        active_products: mockPlans.filter((p) => p.status === "Active").length,
        draft_products: mockPlans.filter((p) => p.status === "Draft").length,
        inactive_products: mockPlans.filter((p) => p.status === "Inactive")
          .length,
        products_by_company: mockPlans.reduce(
          (acc, p) => {
            const companyName = p.company?.name || "Unknown";
            acc[companyName] = (acc[companyName] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
        products_by_type: mockPlans.reduce(
          (acc, p) => {
            const typeName = p.plan_type?.name || "Unknown";
            acc[typeName] = (acc[typeName] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
        average_premium:
          mockPlans.reduce((sum, p) => sum + (p.monthly_premium || 0), 0) /
          mockPlans.length,
        total_premium_value: mockPlans.reduce(
          (sum, p) => sum + (p.monthly_premium || 0),
          0,
        ),
      };
    }
  }

  static async getByCompany(
    companyId: number,
    params?: {
      status?: string;
      active?: boolean;
    },
  ): Promise<Plan[]> {
    const response = await api.get(`${this.baseUrl}/company/${companyId}`, {
      params,
    });
    return response.data;
  }

  static async getByPlanType(
    planTypeId: number,
    params?: {
      status?: string;
      active?: boolean;
    },
  ): Promise<Plan[]> {
    const response = await api.get(`${this.baseUrl}/plan-type/${planTypeId}`, {
      params,
    });
    return response.data;
  }

  static async getFieldConfiguration(planTypeId: number): Promise<{
    plan_type: PlanType;
    fields: PlanTypeField[];
    default_values: Record<string, string | number | boolean | null>;
  }> {
    const response = await api.get(
      `${this.baseUrl}/field-configuration/${planTypeId}`,
    );
    return response.data;
  }

  static async validateFieldData(
    planTypeId: number,
    fieldValues: Record<string, string | number | boolean | null>,
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const response = await api.post(`${this.baseUrl}/validate-field-data`, {
      plan_type_id: planTypeId,
      field_values: fieldValues,
    });
    return response.data;
  }

  static async getOptions(params?: {
    company_id?: number;
    plan_type_id?: number;
  }): Promise<Plan[]> {
    const response = await api.get(`${this.baseUrl}/options`, { params });
    return response.data;
  }

  static async toggleActive(id: number): Promise<ApiResponse<Plan>> {
    const response = await api.patch(`${this.baseUrl}/${id}/toggle-active`);
    return response.data;
  }

  static async duplicate(
    id: number,
    data: {
      name: string;
      company_id?: number;
    },
  ): Promise<ApiResponse<Plan>> {
    const response = await api.post(`${this.baseUrl}/${id}/duplicate`, data);
    return response.data;
  }
}

// Export default services
export default {
  PlanTypeService,
  PlanService,
};
