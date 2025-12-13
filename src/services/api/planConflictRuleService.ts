import { PlanConflictRule, PlanType } from "@/types/insurance";
import { apiClient } from "@/lib/api-client";

export interface PlanConflictRuleFormData {
  plan_type_id: number;
  conflicting_plan_type_id: number;
  rule_type: 'blocking' | 'warning';
  rule_description: string;
  severity: 'low' | 'medium' | 'high';
  is_active: boolean;
  conditions?: any;
  exceptions?: any;
  metadata?: any;
}

export interface PlanConflictRuleFilters {
  active?: boolean;
  rule_type?: 'blocking' | 'warning';
  severity?: 'low' | 'medium' | 'high';
  plan_type_id?: number;
  search?: string;
}

export interface ConflictCheckRequest {
  plan_type_id_1: number;
  plan_type_id_2: number;
  plan_data?: any;
}

export interface ConflictCheckResponse {
  has_conflicts: boolean;
  conflicts: {
    rule: PlanConflictRule;
    message: string;
    severity: string;
    type: string;
  }[];
}

export interface PlanConflictRuleStatistics {
  total_rules: number;
  active_rules: number;
  blocking_rules: number;
  warning_rules: number;
  high_severity_rules: number;
  rules_by_severity: {
    low: number;
    medium: number;
    high: number;
  };
}

const planConflictRuleService = {
  /**
   * Get all plan conflict rules with optional filters
   */
  async getRules(filters?: PlanConflictRuleFilters): Promise<{
    data: PlanConflictRule[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters?.active !== undefined) {
      params.append('active', filters.active.toString());
    }
    if (filters?.rule_type) {
      params.append('rule_type', filters.rule_type);
    }
    if (filters?.severity) {
      params.append('severity', filters.severity);
    }
    if (filters?.plan_type_id) {
      params.append('plan_type_id', filters.plan_type_id.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get(`/plan-conflict-rules?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a specific plan conflict rule
   */
  async getRule(id: string): Promise<PlanConflictRule> {
    const response = await apiClient.get(`/plan-conflict-rules/${id}`);
    return response.data;
  },

  /**
   * Create a new plan conflict rule
   */
  async createRule(data: PlanConflictRuleFormData): Promise<PlanConflictRule> {
    const response = await apiClient.post('/plan-conflict-rules', data);
    return response.data.rule;
  },

  /**
   * Update an existing plan conflict rule
   */
  async updateRule(id: string, data: PlanConflictRuleFormData): Promise<PlanConflictRule> {
    const response = await apiClient.put(`/plan-conflict-rules/${id}`, data);
    return response.data.rule;
  },

  /**
   * Delete a plan conflict rule
   */
  async deleteRule(id: string): Promise<void> {
    await apiClient.delete(`/plan-conflict-rules/${id}`);
  },

  /**
   * Toggle the active status of a plan conflict rule
   */
  async toggleActive(id: string): Promise<PlanConflictRule> {
    const response = await apiClient.patch(`/plan-conflict-rules/${id}/toggle-active`);
    return response.data.rule;
  },

  /**
   * Check for conflicts between two plan types
   */
  async checkConflict(data: ConflictCheckRequest): Promise<ConflictCheckResponse> {
    const response = await apiClient.post('/plan-conflict-rules/check-conflict', data);
    return response.data;
  },

  /**
   * Get all plan types for dropdown options
   */
  async getPlanTypes(): Promise<PlanType[]> {
    const response = await apiClient.get('/plan-conflict-rules/plan-types');
    return response.data;
  },

  /**
   * Get conflict rules statistics
   */
  async getStatistics(): Promise<PlanConflictRuleStatistics> {
    const response = await apiClient.get('/plan-conflict-rules/statistics');
    return response.data;
  }
};

export default planConflictRuleService;
