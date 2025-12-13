import axios from 'axios';
import authService from './authService';

export interface GlobalCustomField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: string;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanCustomField extends GlobalCustomField {
  plan_id: number;
  global_custom_field_id: number | null;
  is_visible: boolean;
  custom_label?: string;
  custom_options?: string;
  override_required?: boolean;
}

export interface GlobalFieldWithPlanStatus extends GlobalCustomField {
  is_in_plan: boolean;
  plan_custom_field_id?: number;
}

export class CustomFieldService {
  private baseUrl = import.meta.env.VITE_API_URL ;

  async getGlobalFieldsWithPlanStatus(planId: number): Promise<GlobalFieldWithPlanStatus[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/plans/${planId}/global-fields`,
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching global fields with plan status:', error);
      throw error;
    }
  }

  async getPlanCustomFields(planId: number): Promise<PlanCustomField[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/plans/${planId}/fields`,
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching plan custom fields:', error);
      throw error;
    }
  }

  async addGlobalFieldToPlan(planId: number, globalFieldId: number): Promise<ApiResponse<PlanCustomField>> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/plans/${planId}/global-fields/add`,
        { global_custom_field_id: globalFieldId },
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding global field to plan:', error);
      throw error;
    }
  }

  async createCustomField(planId: number, fieldData: Partial<PlanCustomField>): Promise<PlanCustomField> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/plans/${planId}/custom-fields`,
        fieldData,
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating custom field:', error);
      throw error;
    }
  }

  async updatePlanCustomField(planId: number, fieldId: number, fieldData: Partial<PlanCustomField>): Promise<PlanCustomField> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/plans/${planId}/custom-fields/${fieldId}`,
        fieldData,
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating plan custom field:', error);
      throw error;
    }
  }

  async togglePlanCustomFieldVisibility(planId: number, fieldId: number): Promise<PlanCustomField> {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/plans/${planId}/custom-fields/${fieldId}/toggle-visibility`,
        {},
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error toggling plan custom field visibility:', error);
      throw error;
    }
  }

  async removePlanCustomField(planId: number, fieldId: number): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/plans/${planId}/custom-fields/${fieldId}`,
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
    } catch (error) {
      console.error('Error removing plan custom field:', error);
      throw error;
    }
  }

  async deleteGlobalField(fieldId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/global-custom-fields/${fieldId}`,
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
    } catch (error) {
      console.error('Error deleting global custom field:', error);
      throw error;
    }
  }
}

export default new CustomFieldService();
