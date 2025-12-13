import { api, type ApiResponse } from './api';

export interface Notification {
  id: string;
  type: 'reminder' | 'appointment' | 'leave' | 'policy' | 'birthday' | 'system';
  subtype?: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  customer_name?: string | null;
  due_date: string;
  created_at: string;
  read: boolean;
  data: Record<string, any>;
  time: string; // For UI compatibility
}

export interface NotificationCounts {
  reminders: number;
  appointments: number;
  leave_requests: number;
  total: number;
}

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<{ data: Notification[]; total: number; unread_count: number }> {
    try {
      const result = await api.get<ApiResponse<{ data: Notification[]; total: number; unread_count: number }>>('/notifications');
      return result.data || { data: [], total: 0, unread_count: 0 };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  },

  /**
   * Get notification counts by type
   */
  async getNotificationCounts(): Promise<NotificationCounts> {
    try {
      const result = await api.get<ApiResponse<NotificationCounts>>('/notifications/counts');
      return result.data || { reminders: 0, appointments: 0, leave_requests: 0, total: 0 };
    } catch (error) {
      console.error('Failed to fetch notification counts:', error);
      throw new Error('Failed to fetch notification counts');
    }
  },

  /**
   * Complete a reminder (mark as done)
   */
  async completeReminder(reminderId: string): Promise<void> {
    try {
      await api.post<ApiResponse>(`/notifications/reminders/${reminderId}/complete`);
    } catch (error) {
      console.error('Failed to complete reminder:', error);
      throw new Error('Failed to complete reminder');
    }
  },

  /**
   * Snooze a reminder
   */
  async snoozeReminder(reminderId: string, minutes: number = 60): Promise<void> {
    try {
      await api.post<ApiResponse>(`/notifications/reminders/${reminderId}/snooze`, { minutes });
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
      throw new Error('Failed to snooze reminder');
    }
  },

  /**
   * Mark a forwarded call notification as read
   */
  async markForwardedCallAsRead(notificationId: string): Promise<void> {
    try {
      await api.post<ApiResponse>(`/notifications/forwarded-calls/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark forwarded call as read:', error);
      throw new Error('Failed to mark forwarded call as read');
    }
  }
};