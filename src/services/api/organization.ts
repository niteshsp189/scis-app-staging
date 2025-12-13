import { api } from '@/lib/axios';
import { OrganizationSettings } from '@/types/organization';

export const organizationApi = {
  getOrganizationSettings: async (): Promise<OrganizationSettings> => {
    const response = await api.get('/organization-settings');
    return response.data;
  },

  updateOrganizationSettings: async (data: Record<string, any>): Promise<void> => {
    const formattedData = {
      company: {
        name: data.name,
        industry: data.industry,
        website: data.website,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: data.country,
        timezone: data.timezone,
        tax_id: data.tax_id,
        registration_number: data.registration_number,
        established_date: data.established_date,
      }
    };
    await api.put('/organization-settings', formattedData);
  },

  uploadLogo: async (file: File): Promise<{ logo_url: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/organization-settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
