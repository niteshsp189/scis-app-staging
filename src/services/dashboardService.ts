import apiClient from "@/lib/api-client";

export interface DashboardStats {
  totalLeads: number;
  totalLeadsChange: string;
  totalCustomers: number;
  totalCustomersChange: string;
  totalRevenue: number;
  totalRevenueChange: string;
  conversionRate: number;
  conversionRateChange: string;
}

export interface DashboardReminder {
  id: number;
  type: 'birthday' | 'policy' | 'appointment' | 'turning65' | 'medicare';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  customer_id?: number;
  customer_name?: string;
  due_date: string;
  created_at: string;
  icon?: string;
  color?: string;
}

export interface DashboardCustomerNote {
  id: number;
  customer_id: number;
  customer_name: string;
  note: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  created_by: string;
  is_important: boolean;
}

export interface DashboardAppointment {
  id: string;
  title: string;
  customer_name: string;
  customer_id: number;
  start_datetime: string;
  end_datetime: string;
  type: 'in_person' | 'phone' | 'video' | 'other';
  location?: string;
  notes?: string;
  description?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface DashboardResponse {
  stats: DashboardStats;
  reminders: DashboardReminder[];
  customerNotes: DashboardCustomerNote[];
  upcomingAppointments: number;
  overdueInstallments: number;
  recentActivities: any[];
}

export const dashboardService = {
  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<DashboardResponse> {
    const response = await apiClient.get('/dashboard/overview');
    return response.data.data;
  },

  /**
   * Get dashboard statistics only
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/dashboard/stats');
    return response.data.data;
  },

  /**
   * Get dashboard reminders
   */
  async getDashboardReminders(): Promise<DashboardReminder[]> {
    const response = await apiClient.get('/dashboard/reminders');
    return response.data.data;
  },

  /**
   * Get important customer notes
   */
  async getImportantCustomerNotes(): Promise<DashboardCustomerNote[]> {
    const response = await apiClient.get('/dashboard/customer-notes');
    return response.data.data;
  },

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(): Promise<DashboardAppointment[]> {
    const response = await apiClient.get('/dashboard/appointments');
    return response.data.data;
  },

  /**
   * Mark reminder as completed
   */
  async completeReminder(reminderId: number): Promise<void> {
    await apiClient.post(`/notifications/reminders/${reminderId}/complete`);
  },

  /**
   * Snooze reminder
   */
  async snoozeReminder(reminderId: number, minutes: number): Promise<void> {
    await apiClient.post(`/notifications/reminders/${reminderId}/snooze`, { minutes });
  },

  /**
   * Get dashboard metrics for charts/graphs
   */
  async getDashboardMetrics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const response = await apiClient.get('/dashboard/metrics', {
      params: { period }
    });
    return response.data.data;
  }
};

export default dashboardService;
