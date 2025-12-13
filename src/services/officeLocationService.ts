import { api } from './api';

export interface OfficeLocation {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficeLocationOption {
  id: number;
  name: string;
  display: string;
  address?: string;
}

class OfficeLocationService {
  async getLocations(): Promise<OfficeLocation[]> {
    const response = await api.get('/office-locations');
    return response.data;
  }

  async getLocationOptions(): Promise<OfficeLocationOption[]> {
    const response = await api.get('/office-locations/options');
    return response.data || [];
  }

  async createLocation(data: Partial<OfficeLocation>): Promise<OfficeLocation> {
    const response = await api.post('/office-locations', data);
    return response.data;
  }

  async updateLocation(id: number, data: Partial<OfficeLocation>): Promise<OfficeLocation> {
    const response = await api.put(`/office-locations/${id}`, data);
    return response.data;
  }

  async deleteLocation(id: number): Promise<void> {
    await api.delete(`/office-locations/${id}`);
  }

  async getLocation(id: number): Promise<OfficeLocation> {
    const response = await api.get(`/office-locations/${id}`);
    return response.data;
  }
}

export const officeLocationService = new OfficeLocationService();