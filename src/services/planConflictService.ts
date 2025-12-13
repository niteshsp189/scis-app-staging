import axios from 'axios';
import { PlanTypeService, PlanType } from './PlanTypeService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface PlanConflictCheck {
  has_conflicts: boolean;
  conflicts: ConflictDetail[];
}

export interface ConflictDetail {
  rule: {
    id: string;
    plan_type_id: number;
    conflicting_plan_type_id: number;
    rule_type: 'blocking' | 'warning';
    rule_description: string;
    severity: 'low' | 'medium' | 'high';
    is_active: boolean;
  };
  message: string;
  severity: string;
  type: string;
}

export interface CustomerPolicyCheck {
  customer_id: number;
  new_plan_type_id: number;
  existing_policies?: ExistingPolicy[];
}

export interface ExistingPolicy {
  id: number;
  plan_id: number;
  plan_type_id: number;
  plan_name: string;
  plan_type_name: string;
  status: string;
}

export interface PlanConflictRule {
  id: string;
  plan_type_id: number;
  conflicting_plan_type_id: number;
  rule_type: 'blocking' | 'warning';
  rule_description: string;
  severity: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanConflictCheckResponse {
  has_conflicts: boolean;
  conflicts: ConflictDetail[];
}

class PlanConflictService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Check for conflicts between two plan types using the new simplified approach
   */
  async checkConflict(
    planTypeId1: number,
    planTypeId2: number,
    planData?: Record<string, unknown>
  ): Promise<PlanConflictCheckResponse> {
    try {
      // Get all plan types to check conflicts
      const planTypes = await PlanTypeService.getAll();

      // Find the first plan type
      const planType1 = planTypes.find(pt => pt.id === planTypeId1);
      if (!planType1) {
        return { has_conflicts: false, conflicts: [] };
      }

      // Check if planTypeId2 is in the conflicting_plan_types of planType1
      const hasConflict = planType1.conflicting_plan_types?.includes(planTypeId2) || false;

      if (hasConflict) {
        const conflictDetail: ConflictDetail = {
          rule: {
            id: `conflict-${planTypeId1}-${planTypeId2}`,
            plan_type_id: planTypeId1,
            conflicting_plan_type_id: planTypeId2,
            rule_type: 'blocking', // Default to blocking for simplified system
            rule_description: `Plan type ${planType1.name} conflicts with another plan type`,
            severity: 'high',
            is_active: true,
          },
          message: `This plan type conflicts with an existing plan type for this customer.`,
          severity: 'high',
          type: 'blocking',
        };

        return {
          has_conflicts: true,
          conflicts: [conflictDetail]
        };
      }

      return { has_conflicts: false, conflicts: [] };
    } catch (error) {
      console.error('Error checking plan type conflict:', error);
      throw error;
    }
  }

  /**
   * Check for conflicts when creating a policy for a customer using the new simplified approach
   * This version accepts the plan type ID directly to avoid authorization issues
   */
  async checkCustomerPolicyConflictsWithPlanType(
    customerId: number,
    newPlanTypeId: number
  ): Promise<{
    has_conflicts: boolean;
    conflicts: ConflictDetail[];
    existing_policies: ExistingPolicy[];
    blocking_conflicts: ConflictDetail[];
    warning_conflicts: ConflictDetail[];
  }> {

    try {
      // Get customer's existing active policies
      const existingPoliciesResponse = await axios.get(`${API_BASE_URL}/customers/${customerId}/policies`, {
        headers: this.getAuthHeaders()
      });
      const existingPolicies = existingPoliciesResponse.data.data || existingPoliciesResponse.data || [];

      // Get all plan types to check conflicts
      const planTypesResponse = await PlanTypeService.getAll();
      // Extract the array from the response - handle both array and object with data property
      const planTypesArray = Array.isArray(planTypesResponse) 
        ? planTypesResponse 
        : planTypesResponse?.data || [];
      const newPlanType = planTypesArray.find(pt => pt.id === newPlanTypeId);

      if (!newPlanType) {
        
        return {
          has_conflicts: false,
          conflicts: [],
          existing_policies: [],
          blocking_conflicts: [],
          warning_conflicts: []
        };
      }

      const conflicts: ConflictDetail[] = [];
      const existingPolicyData: ExistingPolicy[] = [];

      // Check each existing policy for conflicts
      for (const policy of existingPolicies) {
        if (policy.status === 'Active' || policy.status === 'In Grace Period' || policy.status === 'Pending') {
          existingPolicyData.push({
            id: policy.id,
            plan_id: policy.plan_id,
            plan_type_id: policy.plan?.plan_type_id || policy.plan_type_id,
            plan_name: policy.plan?.name || 'Unknown Plan',
            plan_type_name: policy.plan?.planType?.name || 'Unknown Plan Type',
            status: policy.status,
          });

          // Check if the existing policy's plan type conflicts with the new plan type
          const existingPlanTypeId = policy.plan?.plan_type_id || policy.plan_type_id;
          const hasConflict = newPlanType.conflicting_plan_types?.includes(existingPlanTypeId) || false;

          if (hasConflict) {

            const conflictDetail: ConflictDetail = {
              rule: {
                id: `conflict-${newPlanTypeId}-${existingPlanTypeId}`,
                plan_type_id: newPlanTypeId,
                conflicting_plan_type_id: existingPlanTypeId,
                rule_type: 'blocking',
                rule_description: `${newPlanType.name} conflicts with ${policy.plan?.planType?.name || 'existing plan type'}`,
                severity: 'high',
                is_active: true,
              },
              message: `This plan type (${newPlanType.name}) conflicts with an existing policy (${policy.plan?.name || 'Unknown Plan'}) for this customer.`,
              severity: 'high',
              type: 'blocking',
            };

            conflicts.push(conflictDetail);
          }
        }
      }

      const blockingConflicts = conflicts.filter(c => c.type === 'blocking');
      const warningConflicts = conflicts.filter(c => c.type === 'warning');

      const result = {
        has_conflicts: conflicts.length > 0,
        conflicts: conflicts,
        existing_policies: existingPolicyData,
        blocking_conflicts: blockingConflicts,
        warning_conflicts: warningConflicts
      };

      return result;

    } catch (error) {
      console.error('Error checking customer policy conflicts:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error response:', error.response?.data);
      }
      throw error;
    }
  }

  /**
   * Check for conflicts when creating a policy for a customer using the new simplified approach
   * @deprecated Use checkCustomerPolicyConflictsWithPlanType instead to avoid authorization issues
   */
  async checkCustomerPolicyConflicts(
    customerId: number,
    newPlanId: number
  ): Promise<{
    has_conflicts: boolean;
    conflicts: ConflictDetail[];
    existing_policies: ExistingPolicy[];
    blocking_conflicts: ConflictDetail[];
    warning_conflicts: ConflictDetail[];
  }> {

    try {
      // Get the new plan details to find its plan type
      const response = await axios.get(`${API_BASE_URL}/plans/${newPlanId}`, {
        headers: this.getAuthHeaders()
      });
      const newPlan = response.data.data || response.data;
      const newPlanTypeId = newPlan.plan_type_id;

      // Use the new method with the plan type ID
      return this.checkCustomerPolicyConflictsWithPlanType(customerId, newPlanTypeId);

    } catch (error) {
      console.error('Error checking customer policy conflicts:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error response:', error.response?.data);
        // If we get a 403, try to provide a helpful error message
        if (error.response?.status === 403) {
          console.warn('Plan access forbidden - this may be due to insufficient permissions');
        }
      }
      throw error;
    }
  }

  /**
   * Get all active plan conflict rules (legacy method - returns empty for new system)
   */
  async getActiveRules(): Promise<PlanConflictRule[]> {
    console.warn('getActiveRules is deprecated in the new simplified conflict system');
    return [];
  }
}

export default new PlanConflictService();
