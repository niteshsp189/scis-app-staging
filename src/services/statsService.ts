import { api } from '@/lib/axios';

export interface DashboardStats {
  total_customers: number;
  total_dependents: number;
  total_active_policies: number;
  renewals_due_next_30_days: number;
  total_premium: number;
}

export const statsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },
};
