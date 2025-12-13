import { api } from '@/lib/axios';
import { Timezone } from '@/types/organization';

export const timezoneApi = {
  getTimezones: async (params?: { active_only?: boolean; search?: string }): Promise<Timezone[]> => {
    const response = await api.get('/timezones', { params });
    return response.data.data || response.data;
  },

  getTimezone: async (id: string): Promise<Timezone> => {
    const response = await api.get(`/timezones/${id}`);
    return response.data.data || response.data;
  },
};