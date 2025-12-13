import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface SimplifiedPlanType {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface SimplifiedPlanTypeFormData {
  name: string;
  slug?: string;
}

class SimplifiedPlanTypeService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getAll(): Promise<SimplifiedPlanType[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/simplified-plan-types`, {
        headers: this.getAuthHeaders(),
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching plan types:', error);
      throw error;
    }
  }

  async getOptions(): Promise<SimplifiedPlanType[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/simplified-plan-types/options`, {
        headers: this.getAuthHeaders(),
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching plan type options:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<SimplifiedPlanType> {
    try {
      const response = await axios.get(`${API_BASE_URL}/simplified-plan-types/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching plan type:', error);
      throw error;
    }
  }

  async create(data: SimplifiedPlanTypeFormData): Promise<SimplifiedPlanType> {
    try {
      const response = await axios.post(`${API_BASE_URL}/simplified-plan-types`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating plan type:', error);
      throw error;
    }
  }

  async update(id: number, data: SimplifiedPlanTypeFormData): Promise<SimplifiedPlanType> {
    try {
      const response = await axios.put(`${API_BASE_URL}/simplified-plan-types/${id}`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating plan type:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/simplified-plan-types/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting plan type:', error);
      throw error;
    }
  }
}

export default new SimplifiedPlanTypeService();