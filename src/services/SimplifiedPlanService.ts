import axios from "axios";
import { Plan } from "@/services/planService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface SimplifiedPlan {
  id: number;
  name: string;
  description?: string;
  plan_type_id: number;
  insurance_company_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plan_type?: {
    id: number;
    name: string;
    category: string;
  };
  insurance_company?: {
    id: number;
    name: string;
  };
}

export interface SimplifiedPlanFormData {
  name: string;
  description?: string;
  plan_type_id: number;
  company_id: number;
  status: string;
}

export interface SimplifiedPlanOptions {
  planTypes: Array<{ id: number; name: string; category: string }>;
  companies: Array<{ id: number; name: string }>;
}

class SimplifiedPlanService {
  private getAuthHeaders() {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getAll(params?: { page?: number; per_page?: number }): Promise<{ data: SimplifiedPlan[]; total: number; current_page: number; last_page: number }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/simplified-plans`, {
        headers: this.getAuthHeaders(),
        params: {
          page: params?.page || 1,
          per_page: params?.per_page || 10,
        },
      });
      const plans = response.data.data || [];
      const total = response.data.total || plans.length;
      const current_page = response.data.current_page || 1;
      const last_page = response.data.last_page || 1;

      // Transform API response to match interface
      const transformedPlans = plans.map((plan: any) => ({
        ...plan,
        insurance_company_id: plan.company_id,
        plan_type: plan.planType
          ? {
              id: plan.planType.id,
              name: plan.planType.name,
              category: plan.planType.slug, // API has slug, interface expects category
            }
          : undefined,
        insurance_company: plan.company
          ? {
              id: plan.company.id,
              name: plan.company.name,
            }
          : undefined,
        is_active: plan.status === "Active",
      }));

      return {
        data: transformedPlans,
        total,
        current_page,
        last_page,
      };
    } catch (error) {
      console.error("Error fetching plans:", error);
      throw error;
    }
  }

  async getOptions(): Promise<SimplifiedPlanOptions> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/simplified-plans/options`,
        {
          headers: this.getAuthHeaders(),
        },
      );
      return response.data.data || { planTypes: [], companies: [] };
    } catch (error) {
      console.error("Error fetching plan options:", error);
      throw error;
    }
  }

  async getById(id: number): Promise<SimplifiedPlan> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/simplified-plans/${id}`,
        {
          headers: this.getAuthHeaders(),
        },
      );
      const plan = response.data.data;

      // Transform API response to match interface
      return {
        ...plan,
        insurance_company_id: plan.company_id,
        plan_type: plan.planType
          ? {
              id: plan.planType.id,
              name: plan.planType.name,
              category: plan.planType.slug,
            }
          : undefined,
        insurance_company: plan.company
          ? {
              id: plan.company.id,
              name: plan.company.name,
            }
          : undefined,
        is_active: plan.status === "Active",
      };
    } catch (error) {
      console.error("Error fetching plan:", error);
      throw error;
    }
  }

  async create(data: SimplifiedPlanFormData): Promise<SimplifiedPlan> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/simplified-plans`,
        data,
        {
          headers: this.getAuthHeaders(),
        },
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating plan:", error);
      throw error;
    }
  }

  async update(
    id: number,
    data: SimplifiedPlanFormData,
  ): Promise<SimplifiedPlan> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/simplified-plans/${id}`,
        data,
        {
          headers: this.getAuthHeaders(),
        },
      );
      return response.data.data;
    } catch (error) {
      console.error("Error updating plan:", error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/simplified-plans/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("Error deleting plan:", error);
      throw error;
    }
  }
}

export default new SimplifiedPlanService();
