import { api } from "@/lib/axios";

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminder_datetime: string;
  reminder_type?: string;
  status: "pending" | "completed";
  customer_id?: number;
  lead_id?: number;
  policy_id?: number;
  appointment_id?: string;
  assigned_to?: string;
  agent_id?: string;
  created_by?: string;
  is_recurring: boolean;
  recurring_pattern?: any;
  recurring_end_date?: string;
  notification_methods?: ("email" | "sms" | "push")[];
  metadata?: any;
  sent_at?: string;
  email_sent_at?: string;
  sms_sent_at?: string;
  push_sent_at?: string;
  email_status?: "pending" | "sent" | "failed" | "bounced";
  sms_status?: "pending" | "sent" | "failed" | "delivered";
  push_status?: "pending" | "sent" | "failed" | "delivered";
  failure_reason?: string;
  retry_count: number;
  next_retry_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relationships
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  lead?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  policy?: {
    id: number;
    policy_number: string;
    type: string;
  };
  appointment?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  };
  assigned_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  agent?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreateReminderData {
  title: string;
  description?: string;
  reminder_datetime: string;
  reminder_type?: string;
  customer_id?: number;
  lead_id?: number;
  policy_id?: number;
  appointment_id?: string;
  assigned_to?: string;
  agent_id?: string;
  notification_methods?: ("email" | "sms" | "push")[];
  is_recurring?: boolean;
  recurring_pattern?: any;
  recurring_end_date?: string;
  metadata?: any;
}

export interface UpdateReminderData extends Partial<CreateReminderData> {
  status?: "pending" | "completed";
}

export interface ReminderFilters {
  status?: string;
  created_by?: string;
  assigned_to?: string;
  my_reminders?: boolean;
  customer_id?: number;
  search?: string;
  due_date_from?: string;
  due_date_to?: string;
  overdue?: boolean;
  due_today?: boolean;
  upcoming?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export interface ReminderStats {
  overdue: number;
  due_today: number;
  upcoming: number;
  completed_this_week: number;
}

export interface DashboardReminderData {
  stats: ReminderStats;
  recent_reminders: Reminder[];
}

export interface NotificationStats {
  total_reminders: number;
  pending_notifications: number;
  sent_notifications: number;
  failed_notifications: number;
  email_stats: {
    sent: number;
    failed: number;
    bounced: number;
  };
  sms_stats: {
    sent: number;
    failed: number;
    delivered: number;
  };
  this_week: number;
  this_month: number;
}

export interface BulkActionData {
  action: "complete" | "delete";
  reminder_ids: string[];
}

export interface NotificationStatusUpdate {
  notification_type: "email" | "sms" | "push";
  status: "pending" | "sent" | "failed" | "delivered" | "bounced";
  failure_reason?: string;
  sent_at?: string;
}

class ReminderService {
  /**
   * Get all reminders with optional filtering and pagination
   */
  async getReminders(filters?: ReminderFilters) {
    const response = await api.get("/reminders", { params: filters });
    return response.data;
  }

  /**
   * Get dashboard reminder data
   */
  async getDashboardData(): Promise<DashboardReminderData> {
    const response = await api.get("/reminders/dashboard");
    return response.data.data;
  }

  /**
   * Get a specific reminder by ID
   */
  async getReminder(id: string): Promise<Reminder> {
    const response = await api.get(`/reminders/${id}`);
    return response.data.data;
  }

  /**
   * Create a new reminder
   */
  async createReminder(data: CreateReminderData): Promise<Reminder> {
    const response = await api.post("/reminders", data);
    return response.data.data;
  }

  /**
   * Update an existing reminder
   */
  async updateReminder(
    id: string,
    data: UpdateReminderData,
  ): Promise<Reminder> {
    const response = await api.put(`/reminders/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`);
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(id: string): Promise<Reminder> {
    const response = await api.post(`/reminders/${id}/complete`);
    return response.data.data;
  }

  /**
   * Snooze a reminder
   */
  async snoozeReminder(id: string, minutes: number): Promise<void> {
    await api.post(`/notifications/reminders/${id}/snooze`, { minutes });
  }

  /**
   * Get reminders due for notification
   */
  async getRemindersDueForNotification(): Promise<Reminder[]> {
    const response = await api.get("/reminders/due-for-notification");
    return response.data.data;
  }

  /**
   * Update notification status for a reminder
   */
  async updateNotificationStatus(
    id: string,
    data: NotificationStatusUpdate,
  ): Promise<Reminder> {
    const response = await api.patch(
      `/reminders/${id}/notification-status`,
      data,
    );
    return response.data.data;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    const response = await api.get("/reminders/notification-stats");
    return response.data.data;
  }

  /**
   * Perform bulk actions on multiple reminders
   */
  async bulkAction(data: BulkActionData): Promise<{ affected_count: number }> {
    const response = await api.post("/reminders/bulk-action", data);
    return response.data;
  }

  /**
   * Get reminder options for forms
   */
  getReminderTypes() {
    return [
      { value: "call", label: "Call" },
      { value: "email", label: "Email" },
      { value: "meeting", label: "Meeting" },
      { value: "follow_up", label: "Follow Up" },
      { value: "renewal", label: "Policy Renewal" },
      { value: "payment", label: "Payment Due" },
      { value: "custom", label: "Custom" },
    ];
  }

  getStatusOptions() {
    return [
      { value: "pending", label: "Pending" },
      { value: "completed", label: "Completed" },
    ];
  }

  getNotificationMethods() {
    return [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
      { value: "push", label: "Push Notification" },
    ];
  }

  /**
   * Format reminder datetime for display
   */
  formatReminderDateTime(datetime: string): string {
    return new Date(datetime).toLocaleString();
  }

  /**
   * Get reminder status badge color
   */
  getStatusBadgeVariant(
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  }

  /**
   * Check if reminder is overdue
   */
  isOverdue(reminder: Reminder): boolean {
    return (
      new Date(reminder.reminder_datetime) < new Date() &&
      reminder.status === "pending"
    );
  }

  /**
   * Check if reminder is due today
   */
  isDueToday(reminder: Reminder): boolean {
    const today = new Date();
    const reminderDate = new Date(reminder.reminder_datetime);
    return today.toDateString() === reminderDate.toDateString();
  }

  /**
   * Get time until reminder
   */
  getTimeUntil(reminder: Reminder): string {
    const now = new Date();
    const reminderDate = new Date(reminder.reminder_datetime);

    if (reminderDate < now) {
      return "Overdue";
    }

    const diffMs = reminderDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"}`;
    }
  }

  /**
   * Get contact name from reminder
   */
  getContactName(reminder: Reminder): string {
    if (reminder.customer) {
      return `${reminder.customer.first_name} ${reminder.customer.last_name}`;
    }
    if (reminder.lead) {
      return `${reminder.lead.first_name} ${reminder.lead.last_name}`;
    }
    return "No contact";
  }

  /**
   * Get contact email from reminder
   */
  getContactEmail(reminder: Reminder): string | null {
    if (reminder.customer?.email) {
      return reminder.customer.email;
    }
    if (reminder.lead?.email) {
      return reminder.lead.email;
    }
    return null;
  }

  /**
   * Get reminder dates for calendar highlighting
   */
  async getReminderDates(filters?: ReminderFilters): Promise<string[]> {
    try {
      const response = await api.get("/reminders/dates", { params: filters });
      return response.data.data || [];
    } catch (error) {
      console.error("Failed to fetch reminder dates:", error);
      return [];
    }
  }

  /**
   * Check if a date has reminders
   */
  hasReminders(date: Date, reminderDates: string[]): boolean {
    const dateString = date.toISOString().split('T')[0];
    return reminderDates.includes(dateString);
  }
}

export const reminderService = new ReminderService();
export default reminderService;
