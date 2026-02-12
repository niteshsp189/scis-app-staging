import { api } from '@/lib/axios';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  appointment_type: 'new_client' | 'supplement' | 'part_d' | 'rate_increase' | 'under_65' | 'dental_vision' | 'review' | 'customer_service' | 'field_time' | 'life_insurance' | 'meeting' | 'call' | 'presentation' | 'follow_up' | 'consultation' | 'quote' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_id?: number;
  lead_id?: number;
  policy_id?: number;
  assigned_to: string | null;
  created_by?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  notes?: string;
  cancellation_notes?: string;
  reminder_minutes?: number;
  is_recurring: boolean;
  recurring_pattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
  };
  recurring_end_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    cell_phone?: string;
    home_phone?: string;
    work_phone?: string;
    status?: string;
    customer_type?: string;
  };
  lead?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  assigned_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  office_location?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface AppointmentFilters {
  start_date?: string;
  end_date?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  type?: string;
  assigned_to?: string;
  created_by?: string;
  location?: string;
  office_location_id?: string;
  customer_id?: number;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface CreateAppointmentData {
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  office_location_id?: string;
  appointment_type: 'new_client' | 'supplement' | 'part_d' | 'rate_increase' | 'under_65' | 'dental_vision' | 'review' | 'customer_service' | 'field_time' | 'life_insurance' | 'meeting' | 'call' | 'presentation' | 'follow_up' | 'consultation' | 'quote' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_id?: number;
  lead_id?: number;
  policy_id?: number;
  assigned_to: string | null;
  cancellation_notes?: string;
  reminder_minutes?: number;
  is_recurring?: boolean;
  recurring_pattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
  };
  recurring_end_date?: string;
  metadata?: Record<string, any>;
}

export interface CalendarRequest {
  start_date: string;
  end_date: string;
  view?: 'month' | 'week' | 'day';
  assigned_to?: string;
}

export interface AppointmentResponse {
  success: boolean;
  data: Appointment | Appointment[] | {
    data: Appointment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
  conflicts?: Appointment[];
}

export interface CheckAvailabilityData {
  start_datetime: string;
  end_datetime: string;
  assigned_to: string | null;
  customer_id?: number;
  exclude_id?: string;
}

export interface AvailabilityResponse {
  success: boolean;
  available: boolean;
  conflicts?: string[];
  message: string;
}

class AppointmentService {
  async getAppointments(filters?: AppointmentFilters): Promise<AppointmentResponse> {
    const response = await api.get('/appointments', { params: filters });
    return response.data;
  }

  async createAppointment(data: CreateAppointmentData): Promise<AppointmentResponse> {
    const response = await api.post('/appointments', data);
    return response.data;
  }

  async getAppointment(id: string): Promise<AppointmentResponse> {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  }

  async updateAppointment(id: string, data: Partial<CreateAppointmentData> | { status: string }): Promise<AppointmentResponse> {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  }

  async deleteAppointment(id: string): Promise<AppointmentResponse> {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  }

  async getCalendarData(params: CalendarRequest): Promise<AppointmentResponse> {
    const response = await api.get('/appointments/calendar', { params });
    return response.data;
  }

  async getUpcomingAppointments(limit?: number, assignedTo?: string): Promise<AppointmentResponse> {
    const response = await api.get('/appointments/upcoming', { 
      params: { limit, assigned_to: assignedTo } 
    });
    return response.data;
  }

  async getAppointmentsNeedingReminders(): Promise<AppointmentResponse> {
    const response = await api.get('/appointments/needing-reminders');
    return response.data;
  }

  async checkAvailability(data: CheckAvailabilityData): Promise<AvailabilityResponse> {
    const response = await api.post('/appointments/check-availability', data);
    return response.data;
  }

  // Utility methods
  getAppointmentTypeLabel(type: string): string {
    const types = {
      'new_client': 'New Client',
      'supplement': 'Supplement',
      'part_d': 'Part D',
      'rate_increase': 'Rate Increase',
      'under_65': 'Under 65',
      'dental_vision': 'Dental Vision',
      'review': 'Review',
      'customer_service': 'Customer Service',
      'field_time': 'Field Time',
      'life_insurance': 'Life Insurance',
      'meeting': 'Meeting',
      'call': 'Phone Call',
      'presentation': 'Presentation',
      'follow_up': 'Follow Up',
      'consultation': 'Consultation',
      'quote': 'Quote',
      'other': 'Other'
    };
    const normalizedType = type.toLowerCase();
    const label = types[normalizedType as keyof typeof types] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return label.replace(/\b\w/g, l => l.toUpperCase());
  }

  getPriorityLabel(priority: string): string {
    const priorities = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    };
    return priorities[priority as keyof typeof priorities] || priority;
  }

  getStatusLabel(status: string): string {
    const statuses = {
      'scheduled': 'Scheduled',
      'confirmed': 'Confirmed',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'no_show': 'No Show',
      'rescheduled': 'Rescheduled'
    };
    return statuses[status as keyof typeof statuses] || status;
  }

  getPriorityColor(priority: string): string {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  getStatusColor(status: string): string {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no_show': 'bg-gray-100 text-gray-800',
      'rescheduled': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  getTypeColor(type: string): string {
    const colors = {
      'new_client': 'bg-blue-100 text-blue-800',
      'supplement': 'bg-green-100 text-green-800',
      'part_d': 'bg-purple-100 text-purple-800',
      'rate_increase': 'bg-yellow-100 text-yellow-800',
      'under_65': 'bg-indigo-100 text-indigo-800',
      'dental_vision': 'bg-orange-100 text-orange-800',
      'review': 'bg-pink-100 text-pink-800',
      'customer_service': 'bg-cyan-100 text-cyan-800',
      'field_time': 'bg-emerald-100 text-emerald-800',
      'life_insurance': 'bg-red-100 text-red-800',
      'meeting': 'bg-blue-100 text-blue-800',
      'call': 'bg-green-100 text-green-800',
      'presentation': 'bg-purple-100 text-purple-800',
      'follow_up': 'bg-yellow-100 text-yellow-800',
      'consultation': 'bg-indigo-100 text-indigo-800',
      'quote': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getDuration(startDateTime: string, endDateTime: string): string {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  }

  isToday(dateTime: string): boolean {
    const date = new Date(dateTime);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isUpcoming(dateTime: string): boolean {
    const date = new Date(dateTime);
    const now = new Date();
    return date > now;
  }

  isPast(dateTime: string): boolean {
    const date = new Date(dateTime);
    const now = new Date();
    return date < now;
  }
}

export default new AppointmentService();
