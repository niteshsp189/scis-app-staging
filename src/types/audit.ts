export interface AuditLog {
  id: string;
  event: string;
  event_label: string;
  description: string;
  user: {
    id: string;
    name: string;
    email: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  auditable_type: string;
  auditable_id: string;
  auditable?: any;
  model_type_label: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changes: Record<string, { old: any; new: any }>;
  changes_count: number;
  url: string;
  ip_address: string;
  formatted_ip_address: string;
  user_agent: string;
  browser: string;
  platform: string;
  session_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
  time_since: string;
  is_create: boolean;
  is_update: boolean;
  is_delete: boolean;
  is_login: boolean;
  is_logout: boolean;
}

export interface AuditLogFilters {
  user_id?: string;
  event?: string;
  auditable_type?: string;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
  search?: string;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Alias for backwards compatibility
export type AuditFilters = AuditLogFilters;

export interface AuditLogListResponse {
  success: boolean;
  message: string;
  data: AuditLog[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  filters: AuditLogFilters;
}

export interface AuditLogStatsData {
  period: {
    type: string;
    start_date: string;
    end_date: string;
  };
  overview: {
    total_actions: number;
    unique_users: number;
    unique_ips: number;
    failed_logins: number;
  };
  action_breakdown: Array<{
    action: string;
    action_label: string;
    count: number;
  }>;
  daily_activity: Array<{
    date: string;
    total_actions: number;
    unique_users: number;
  }>;
  top_users: Array<{
    user_id: string;
    action_count: number;
    user: {
      id: string;
      name: string;
      first_name?: string;
      email: string;
    };
  }>;
  top_endpoints: Array<{
    url: string;
    access_count: number;
  }>;
  model_activity: Array<{
    auditable_type: string;
    model_name: string;
    count: number;
  }>;
  browser_stats: Record<string, number>;
  suspicious_activity: Array<{
    user_id: string;
    ip_count: number;
    user: {
      id: string;
      name: string;
      first_name?: string;
      email: string;
    };
  }>;
}

export interface FilterOptions {
  actions: string[];
  model_types: Array<{
    value: string;
    label: string;
  }>;
  users?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export interface AuditStats {
  total_logs: number;
  active_users: number;
  failed_logins: number;
  activity_rate: number;
  previous_period?: {
    total_logs: number;
    active_users: number;
    failed_logins: number;
    activity_rate: number;
  };
  // Chart data properties
  activity_timeline?: Array<{
    date: string;
    count: number;
  }>;
  action_distribution?: Array<{
    event_label: string;
    count: number;
  }>;
  top_users?: Array<{
    name: string;
    email: string;
    activity_count: number;
  }>;
  model_distribution?: Array<{
    model_type_label: string;
    count: number;
  }>;
}
