import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Tax {
  id: number;
  name: string;
  code: string;
  rate: number;
  description?: string;
  type: 'percentage' | 'fixed';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaxFormData {
  name: string;
  code: string;
  rate: number;
  description?: string;
  type: 'percentage' | 'fixed';
  is_active: boolean;
  sort_order: number;
}

class TaxService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all taxes
   */
  async getTaxes(): Promise<Tax[]> {
    const response = await axios.get(`${API_BASE_URL}/taxes`, {
      headers: this.getAuthHeaders()
    });
    return response.data.data;
  }

  /**
   * Get only active taxes for dropdown selection
   */
  async getActiveTaxes(): Promise<Tax[]> {
    const response = await axios.get(`${API_BASE_URL}/taxes/active`, {
      headers: this.getAuthHeaders()
    });
    return response.data.data;
  }

  /**
   * Get a specific tax by ID
   */
  async getTax(id: number): Promise<Tax> {
    const response = await axios.get(`${API_BASE_URL}/taxes/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data.data;
  }

  /**
   * Create a new tax
   */
  async createTax(taxData: TaxFormData): Promise<Tax> {
    const response = await axios.post(`${API_BASE_URL}/taxes`, taxData, {
      headers: this.getAuthHeaders()
    });
    return response.data.data;
  }

  /**
   * Update an existing tax
   */
  async updateTax(id: number, taxData: TaxFormData): Promise<Tax> {
    const response = await axios.put(`${API_BASE_URL}/taxes/${id}`, taxData, {
      headers: this.getAuthHeaders()
    });
    return response.data.data;
  }

  /**
   * Delete a tax
   */
  async deleteTax(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/taxes/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Calculate tax amount for a given base amount and tax
   */
  calculateTaxAmount(tax: Tax, baseAmount: number): number {
    if (tax.type === 'percentage') {
      return Math.round((baseAmount * tax.rate) / 100 * 100) / 100; // Round to 2 decimal places
    } else {
      return tax.rate; // Fixed amount
    }
  }

  /**
   * Format tax display name with rate
   */
  formatTaxDisplayName(tax: Tax): string {
    if (tax.type === 'percentage') {
      return `${tax.name} (${tax.rate}%)`;
    } else {
      return `${tax.name} ($${tax.rate})`;
    }
  }
}

export const taxService = new TaxService();
