import { api } from '@/lib/axios';
import { OfficeLocation } from '@/types/organization';

export const officeLocationApi = {
  getLocations: async (params?: { active?: boolean }): Promise<OfficeLocation[]> => {
    const response = await api.get('/office-locations', { params });
    return response.data;
  },

  getLocation: async (id: string): Promise<OfficeLocation> => {
    const response = await api.get(`/office-locations/${id}`);
    return response.data;
  },

  createLocation: async (data: Partial<OfficeLocation>): Promise<OfficeLocation> => {
    const response = await api.post('/office-locations', data);
    return response.data;
  },

  updateLocation: async (id: string, data: Partial<OfficeLocation>): Promise<OfficeLocation> => {
    const response = await api.put(`/office-locations/${id}`, data);
    return response.data;
  },

  deleteLocation: async (id: string): Promise<void> => {
    await api.delete(`/office-locations/${id}`);
  },
};
