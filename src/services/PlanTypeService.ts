import apiClient from '../api/client';

export interface PlanType {
  id: number;
  name: string;
  slug: string;
  conflicting_plan_types: number[] | null;
  extra_fields: {
    [key: string]: {
      label: string;
      included: boolean;
      required: boolean;
    };
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanTypeData {
  name: string;
  slug?: string;
  conflicting_plan_types?: number[];
  extra_fields?: {
    [key: string]: {
      label: string;
      included: boolean;
      required: boolean;
    };
  };
  is_active?: boolean;
}

export interface UpdatePlanTypeData extends Partial<CreatePlanTypeData> {
  id: number;
}

export interface ConflictCheckData {
  plan_type_id: number;
  existing_plan_types: number[];
}

export const PlanTypeService = {
  // Get all plan types
  getAll: async (params?: { per_page?: number; page?: number; search?: string; active?: boolean }): Promise<any> => {
    const queryParams = new URLSearchParams();
    
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    
    const url = `/plan-types${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return response.data; // Return full response including meta data
  },

  // Get a specific plan type
  getById: async (id: number): Promise<PlanType> => {
    const response = await apiClient.get(`/plan-types/${id}`);
    return response.data;
  },

  // Create a new plan type
  create: async (data: CreatePlanTypeData): Promise<PlanType> => {
    const response = await apiClient.post('/plan-types', data);
    return response.data;
  },

  // Update an existing plan type
  update: async (id: number, data: Partial<CreatePlanTypeData>): Promise<PlanType> => {
    const response = await apiClient.put(`/plan-types/${id}`, data);
    return response.data;
  },

  // Delete a plan type
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/plan-types/${id}`);
  },

  // Check for conflicts when selecting plan types
  checkConflict: async (data: ConflictCheckData): Promise<{
    has_conflict: boolean;
    conflicting_plans: PlanType[];
    message?: string;
  }> => {
    const response = await apiClient.post('/plan-types/check-conflict', data);
    return response.data;
  },

  // Get default extra fields structure
  getDefaultExtraFields: () => {
    return {
      medicare_number: { label: 'Medicare #', included: false, required: false },
      pdp_serial: { label: 'PDP Serial', included: false, required: false },
      effective_date: { label: 'Effective Date', included: false, required: false },
      termination_date: { label: 'Termination Date', included: false, required: false },
      premium: { label: 'Premium', included: false, required: false },
      deductible: { label: 'Deductible', included: false, required: false },
      out_of_pocket: { label: 'Out Of Pocket', included: false, required: false },
      copay_primary: { label: 'Copay Primary', included: false, required: false },
      copay_specialist: { label: 'Copay Specialist', included: false, required: false },
      rx_deductible: { label: 'RX Deductible', included: false, required: false },
    };
  }
};