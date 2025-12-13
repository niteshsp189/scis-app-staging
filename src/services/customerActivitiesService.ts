import { api } from "@/lib/axios";

export interface CustomerActivity {
  id: number;
  customer_id: number;
  parent_activity_id?: number;
  called_for_user_id?: string;
  activity_type: string;
  title: string;
  description?: string;
  activity_date: string;
  activity_time: string;
  duration_minutes: number;
  outcome: "successful" | "no_answer" | "busy" | "voicemail" | "scheduled" | "completed" | "cancelled";
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  notes?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  assigned_to?: string;
  performed_by?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  assignedUser?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  performer?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  calledForUser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  called_for_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  forwardedToUser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  call_forwarded_to_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  forwarded_to_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  parentActivity?: CustomerActivity;
  answerCalls?: CustomerActivity[];
}

export interface ActivitiesListResponse {
  success: boolean;
  data: CustomerActivity[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    has_more_pages: boolean;
  };
}

export interface ActivityResponse {
  success: boolean;
  data: CustomerActivity;
  message?: string;
}

export interface ActivityTypesResponse {
  success: boolean;
  data: string[];
}

export interface ActivityStatisticsResponse {
  success: boolean;
  data: {
    total_activities: number;
    completed_activities: number;
    pending_follow_ups: number;
    total_duration_minutes: number;
    activity_types: Record<string, number>;
    outcomes: Record<string, number>;
    priorities: Record<string, number>;
  };
}

export interface CreateActivityRequest {
  activity_type: string;
  title: string;
  description?: string;
  activity_date?: string;
  activity_time?: string;
  duration_minutes?: number;
  parent_activity_id?: number;
  called_for_user_id?: string;
  call_forwarded_to_user_id?: string;
  outcome?: "successful" | "no_answer" | "busy" | "voicemail" | "scheduled" | "completed" | "cancelled";
  priority?: "High" | "Medium" | "Low";
  status?: "Pending" | "In Progress" | "Completed" | "Cancelled";
  notes?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  assigned_to?: string;
  due_date?: string;
}

export interface UpdateActivityRequest {
  activity_type: string;
  title: string;
  description?: string;
  activity_date?: string;
  activity_time?: string;
  duration_minutes?: number;
  called_for_user_id?: string;
  call_forwarded_to_user_id?: string;
  outcome?: "successful" | "no_answer" | "busy" | "voicemail" | "scheduled" | "completed" | "cancelled";
  priority?: "High" | "Medium" | "Low";
  status?: "Pending" | "In Progress" | "Completed" | "Cancelled";
  notes?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  assigned_to?: string;
  due_date?: string;
}

export interface ActivitiesListFilters {
  search?: string;
  activity_type?: string;
  outcome?: string;
  priority?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
}

export const customerActivitiesService = {
  /**
   * Get all activities for a customer with optional filtering and pagination
   */
  async getCustomerActivities(
    customerId: number,
    filters?: ActivitiesListFilters,
  ): Promise<ActivitiesListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<ActivitiesListResponse>(
      `/customers/${customerId}/activities?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Get a specific activity's details
   */
  async getActivity(
    customerId: number,
    activityId: number,
  ): Promise<ActivityResponse> {
    const response = await api.get<ActivityResponse>(
      `/customers/${customerId}/activities/${activityId}`,
    );
    return response.data;
  },

  /**
   * Create a new activity for a customer
   */
  async createActivity(
    customerId: number,
    activityData: CreateActivityRequest,
  ): Promise<ActivityResponse> {
    const response = await api.post<ActivityResponse>(
      `/customers/${customerId}/activities`,
      activityData,
    );
    return response.data;
  },

  /**
   * Update an existing activity
   */
  async updateActivity(
    customerId: number,
    activityId: number,
    activityData: UpdateActivityRequest,
  ): Promise<ActivityResponse> {
    const response = await api.put<ActivityResponse>(
      `/customers/${customerId}/activities/${activityId}`,
      activityData,
    );
    return response.data;
  },

  /**
   * Delete an activity (soft delete)
   */
  async deleteActivity(customerId: number, activityId: number): Promise<void> {
    await api.delete(`/customers/${customerId}/activities/${activityId}`);
  },

  /**
   * Get available activity types for a customer
   */
  async getActivityTypes(customerId: number): Promise<ActivityTypesResponse> {
    const response = await api.get<ActivityTypesResponse>(
      `/customers/${customerId}/activities/types/list`,
    );
    return response.data;
  },

  /**
   * Get activity statistics for a customer
   */
  async getStatistics(customerId: number): Promise<ActivityStatisticsResponse> {
    const response = await api.get<ActivityStatisticsResponse>(
      `/customers/${customerId}/activities/statistics/summary`,
    );
    return response.data;
  },

  /**
   * Get pending follow-ups for a customer
   */
  async getPendingFollowUps(customerId: number): Promise<ActivitiesListResponse> {
    const response = await api.get<ActivitiesListResponse>(
      `/customers/${customerId}/activities/follow-ups/pending`,
    );
    return response.data;
  },

  /**
   * Mark follow-up as completed
   */
  async completeFollowUp(
    customerId: number,
    activityId: number,
    completionNotes?: string,
  ): Promise<ActivityResponse> {
    const response = await api.post<ActivityResponse>(
      `/customers/${customerId}/activities/${activityId}/complete-follow-up`,
      { completion_notes: completionNotes },
    );
    return response.data;
  },

  /**
   * Get predefined activity types
   */
  getPredefinedActivityTypes(): Record<string, string> {
    return {
      "Incoming Call": "Incoming Call",
      "Outgoing Call": "Outgoing Call",
      "Email": "Email",
      "Meeting": "Meeting",
      "Follow-up": "Follow-up",
      "Policy Review": "Policy Review",
      "Claim Discussion": "Claim Discussion",
      "Payment": "Payment",
      "Complaint": "Complaint",
      "General": "General",
    };
  },

  /**
   * Get outcome options with their meanings
   */
  getOutcomeOptions(): Array<{
    value: "successful" | "no_answer" | "busy" | "voicemail" | "scheduled" | "completed" | "cancelled";
    label: string;
    class: string;
  }> {
    return [
      {
        value: "successful",
        label: "Successful",
        class: "bg-green-100 text-green-800 border-green-200",
      },
      {
        value: "completed",
        label: "Completed",
        class: "bg-green-100 text-green-800 border-green-200",
      },
      {
        value: "scheduled",
        label: "Scheduled",
        class: "bg-blue-100 text-blue-800 border-blue-200",
      },
      {
        value: "no_answer",
        label: "No Answer",
        class: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      {
        value: "busy",
        label: "Busy",
        class: "bg-orange-100 text-orange-800 border-orange-200",
      },
      {
        value: "voicemail",
        label: "Voicemail",
        class: "bg-purple-100 text-purple-800 border-purple-200",
      },
      {
        value: "cancelled",
        label: "Cancelled",
        class: "bg-red-100 text-red-800 border-red-200",
      },
    ];
  },

  /**
   * Get priority options
   */
  getPriorityOptions(): Array<{
    value: "High" | "Medium" | "Low";
    label: string;
    class: string;
  }> {
    return [
      {
        value: "High",
        label: "High Priority",
        class: "bg-red-100 text-red-800 border-red-200",
      },
      {
        value: "Medium",
        label: "Medium Priority",
        class: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      {
        value: "Low",
        label: "Low Priority",
        class: "bg-green-100 text-green-800 border-green-200",
      },
    ];
  },

  /**
   * Get status options
   */
  getStatusOptions(): Array<{
    value: "Pending" | "In Progress" | "Completed" | "Cancelled";
    label: string;
    class: string;
  }> {
    return [
      {
        value: "Pending",
        label: "Pending",
        class: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      {
        value: "In Progress",
        label: "In Progress",
        class: "bg-blue-100 text-blue-800 border-blue-200",
      },
      {
        value: "Completed",
        label: "Completed",
        class: "bg-green-100 text-green-800 border-green-200",
      },
      {
        value: "Cancelled",
        label: "Cancelled",
        class: "bg-red-100 text-red-800 border-red-200",
      },
    ];
  },

  /**
   * Get CSS class for activity outcome
   */
  getOutcomeColorClass(outcome: string): string {
    const option = this.getOutcomeOptions().find(opt => opt.value === outcome);
    return option?.class || "bg-gray-100 text-gray-800 border-gray-200";
  },

  /**
   * Get CSS class for activity priority
   */
  getPriorityColorClass(priority: string): string {
    const option = this.getPriorityOptions().find(opt => opt.value === priority);
    return option?.class || "bg-gray-100 text-gray-800 border-gray-200";
  },

  /**
   * Get CSS class for activity status
   */
  getStatusColorClass(status: string): string {
    const option = this.getStatusOptions().find(opt => opt.value === status);
    return option?.class || "bg-gray-100 text-gray-800 border-gray-200";
  },

  /**
   * Format activity duration
   */
  formatDuration(minutes: number): string {
    if (minutes <= 0) {
      return "N/A";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }

    return `${remainingMinutes}m`;
  },

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  /**
   * Format activity date and time
   */
  formatActivityDateTime(date: string, time?: string): string {
    const activityDate = new Date(date);

    if (time) {
      const [hours, minutes] = time.split(':');
      activityDate.setHours(parseInt(hours), parseInt(minutes));
    }

    return this.formatTimestamp(activityDate.toISOString());
  },

  /**
   * Get full name from user object
   */
  getFullName(user?: { first_name: string; last_name: string }): string {
    if (!user) return "Unknown User";
    return `${user.first_name} ${user.last_name}`.trim();
  },

  /**
   * Get activity type icon
   */
  getActivityTypeIcon(activityType: string): string {
    const iconMap: Record<string, string> = {
      "Incoming Call": "phone-incoming",
      "Outgoing Call": "phone-outgoing",
      "Email": "mail",
      "Meeting": "users",
      "Follow-up": "clock",
      "Policy Review": "file-text",
      "Claim Discussion": "shield",
      "Payment": "credit-card",
      "Complaint": "alert-circle",
      "General": "activity"
    };

    return iconMap[activityType] || "activity";
  },

  /**
   * Validate activity data
   */
  validateActivity(activityData: CreateActivityRequest | UpdateActivityRequest): {
    isValid: boolean;
    errors: string[]
  } {
    const errors: string[] = [];

    if (!activityData.activity_type || activityData.activity_type.trim().length === 0) {
      errors.push("Activity type is required");
    }

    if (!activityData.title || activityData.title.trim().length === 0) {
      errors.push("Title is required");
    }

    if (activityData.title && activityData.title.length > 255) {
      errors.push("Title cannot exceed 255 characters");
    }

    if (activityData.activity_type && activityData.activity_type.length > 50) {
      errors.push("Activity type cannot exceed 50 characters");
    }

    if (activityData.duration_minutes && activityData.duration_minutes < 0) {
      errors.push("Duration cannot be negative");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Sort activities by different criteria
   */
  sortActivities(
    activities: CustomerActivity[],
    sortBy: "date" | "type" | "outcome" | "priority" | "status",
    sortOrder: "asc" | "desc" = "desc"
  ): CustomerActivity[] {
    const sorted = [...activities].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          const dateA = new Date(`${a.activity_date} ${a.activity_time || '00:00'}`);
          const dateB = new Date(`${b.activity_date} ${b.activity_time || '00:00'}`);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case "type":
          comparison = a.activity_type.localeCompare(b.activity_type);
          break;
        case "outcome":
          comparison = a.outcome.localeCompare(b.outcome);
          break;
        case "priority":
          const priorityOrder = { High: 0, Medium: 1, Low: 2 };
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) -
                      (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }
};

export default customerActivitiesService;
