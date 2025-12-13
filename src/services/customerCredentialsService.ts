import { api } from "./api";

export interface CustomerCredential {
  id?: number;
  customer_id: number;
  medicare_number?: string;
  bank_account_type?: 'Checking' | 'Saving';
  routing_number?: string;
  account_number?: string;
  medicare_gov_username?: string;
  medicare_gov_password?: string;
  medications?: Medication[];
  created_at?: string;
  updated_at?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

class CustomerCredentialsService {
  private baseUrl = "/customers";

  async getCustomerCredentials(customerId: number): Promise<CustomerCredential | null> {
    console.log("Fetching credentials for customer ID: - customerCredentialsService.ts:27", customerId);
    const response = await api.get(`${this.baseUrl}/${customerId}/credentials`);
    return response.data;
  }

  async updateCustomerCredentials(
    customerId: number,
    data: Partial<Omit<CustomerCredential, 'id' | 'customer_id' | 'created_at' | 'updated_at'>>
  ): Promise<CustomerCredential> {
    const response = await api.put(`${this.baseUrl}/${customerId}/credentials`, data);
    return response.data;
  }

  async deleteCustomerCredentials(customerId: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${customerId}/credentials`);
  }
}

export const customerCredentialsService = new CustomerCredentialsService();