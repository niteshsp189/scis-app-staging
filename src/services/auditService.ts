import { api } from "@/lib/axios";

export interface AuditLog {
  id: string;
  event: string;
  event_label: string;
  description: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  auditable_type: string;
  auditable_id: string;
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
  filters: {
    user_id?: string;
    event?: string;
    auditable_type?: string;
    start_date?: string;
    end_date?: string;
    ip_address?: string;
    search?: string;
  };
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
  sort_direction?: "asc" | "desc";
}

export interface AuditLogStats {
  success: boolean;
  message: string;
  data: {
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
      event: string;
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
        email: string;
      };
    }>;
  };
}

export interface FilterOptions {
  success: boolean;
  message: string;
  data: {
    actions: string[];
    model_types: Array<{
      value: string;
      label: string;
    }>;
  };
}

export class AuditService {
  /**
   * Get paginated audit logs with filters
   */
  static async getAuditLogs(
    filters: AuditLogFilters = {},
  ): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        // Map 'event' to 'action' for backend compatibility
        const paramKey = key === "event" ? "action" : key;
        params.append(paramKey, value.toString());
      }
    });

    const response = await api.get(`/audit-logs?${params.toString()}`);
    return response.data;
  }

  /**
   * Get detailed audit log by ID
   */
  static async getAuditLog(
    id: string,
  ): Promise<{ success: boolean; message: string; data: AuditLog }> {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(
    userId: string,
    filters: Partial<AuditLogFilters> = {},
  ): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(
      `/audit-logs/user/${userId}?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Export audit logs
   */
  static async exportAuditLogs(
    format: "xlsx" | "csv" = "xlsx",
    filters: AuditLogFilters = {},
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append("format", format);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/audit-logs/export?${params.toString()}`, {
      responseType: "blob",
    });

    return response.data;
  }

  /**
   * Get audit statistics and analytics
   */
  static async getAuditStats(
    period: string = "month",
    startDate?: string,
    endDate?: string,
  ): Promise<AuditLogStats> {
    const params = new URLSearchParams();
    params.append("period", period);

    if (period === "custom" && startDate && endDate) {
      params.append("start_date", startDate);
      params.append("end_date", endDate);
    }

    const response = await api.get(`/audit-logs/stats?${params.toString()}`);
    return response.data;
  }

  /**
   * Get recent audit logs (last 24 hours)
   */
  static async getRecentAuditLogs(): Promise<{
    success: boolean;
    message: string;
    data: AuditLog[];
  }> {
    const response = await api.get("/audit-logs/recent");
    return response.data;
  }

  /**
   * Get filter options for dropdowns
   */
  static async getFilterOptions(): Promise<FilterOptions> {
    const response = await api.get("/audit-logs/filter-options");
    return response.data;
  }

  /**
   * Get audit logs for a specific customer
   */
  static async getCustomerAuditLogs(
    customerId: string,
    filters: Partial<AuditLogFilters> = {},
  ): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(
      `/customers/${customerId}/audits?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Get audit logs for a specific policy
   */
  static async getPolicyAuditLogs(
    policyId: string,
    filters: Partial<AuditLogFilters> = {},
  ): Promise<AuditLogListResponse> {
    const policyFilters = {
      ...filters,
      auditable_type: "App\\Models\\Policy",
      auditable_id: policyId.toString(),
    };
    return this.getAuditLogs(policyFilters);
  }

  /**
   * Download audit export file
   */
  static downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Helper function to get action color class
   */
  static getActionColor(action: string): string {
    const colorMap: Record<string, string> = {
      created: "text-green-600 bg-green-50 border-green-200",
      updated: "text-blue-600 bg-blue-50 border-blue-200",
      deleted: "text-red-600 bg-red-50 border-red-200",
      view: "text-gray-600 bg-gray-50 border-gray-200",
      login: "text-green-600 bg-green-50 border-green-200",
      logout: "text-orange-600 bg-orange-50 border-orange-200",
      failed_login: "text-red-600 bg-red-50 border-red-200",
      export: "text-purple-600 bg-purple-50 border-purple-200",
    };
    return colorMap[action] || "text-gray-600 bg-gray-50 border-gray-200";
  }

  /**
   * Helper function to get action icon
   */
  static getActionIcon(action: string): string {
    const iconMap: Record<string, string> = {
      created: "✅",
      updated: "✏️",
      deleted: "🗑️",
      view: "👁️",
      login: "🔐",
      logout: "🚪",
      failed_login: "❌",
      export: "📁",
      permission_check_success: "🔑",
      role_check_success: "👤",
      failed_create: "❌",
      failed_view: "👁️‍🗨️",
    };
    return iconMap[action] || "📝";
  }

  /**
   * Helper function to format changes for display
   */
  static formatChanges(
    changes: Record<string, { old: any; new: any }> | null,
  ): string[] {
    if (!changes) return [];

    return Object.entries(changes).map(([field, change]) => {
      const fieldName = field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      if (
        change.old === null ||
        change.old === undefined ||
        change.old === ""
      ) {
        return `${fieldName}: Set to "${change.new}"`;
      } else if (
        change.new === null ||
        change.new === undefined ||
        change.new === ""
      ) {
        return `${fieldName}: Cleared (was "${change.old}")`;
      } else {
        return `${fieldName}: Changed from "${change.old}" to "${change.new}"`;
      }
    });
  }

  /**
   * Enhanced function to format audit changes with special handling for field_values and other complex fields
   */
  static formatAuditChanges(
    changes: Record<string, { old: any; new: any }> | null,
  ): string[] {
    if (!changes || typeof changes !== "object") return [];

    const formattedChanges: string[] = [];

    Object.entries(changes).forEach(([field, changeData]) => {
      if (!changeData || typeof changeData !== "object") return;

      const { old: oldValue, new: newValue } = changeData;

      // Format field name (convert snake_case to Title Case)
      const fieldName = field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      // Special handling for field_values JSON
      if (field === "field_values") {
        const oldFields = this.parseFieldValues(oldValue);
        const newFields = this.parseFieldValues(newValue);

        // Compare each field within field_values
        const allFieldKeys = new Set([
          ...Object.keys(oldFields),
          ...Object.keys(newFields),
        ]);

        allFieldKeys.forEach((key) => {
          const oldFieldValue = this.formatFieldValue(key, oldFields[key]);
          const newFieldValue = this.formatFieldValue(key, newFields[key]);

          if (oldFieldValue !== newFieldValue) {
            const fieldMappings: Record<string, string> = {
              pdp_serial: "PDP Serial Number",
              effective_date: "Effective Date",
              application_mailed_date: "Application Mailed Date",
              policy_mailed_date: "Policy Mailed Date",
              payment_mode: "Payment Mode",
              deductible: "Deductible Amount",
              premium: "Premium Amount",
              credit: "Credit Amount",
              payment: "Payment Amount",
              base_premium: "Base Premium",
            };

            const formattedFieldName =
              fieldMappings[key] ||
              key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

            formattedChanges.push(
              `${formattedFieldName}: "${oldFieldValue}" → "${newFieldValue}"`,
            );
          }
        });
      } else {
        // Format values for non-field_values fields
        const formatValue = (value: any): string => {
          if (value === null || value === undefined) return "None";
          if (typeof value === "boolean") return value ? "Yes" : "No";
          if (typeof value === "string" && value.length > 100) {
            return `${value.substring(0, 100)}...`;
          }
          if (typeof value === "object") {
            try {
              // For objects, try to format them nicely
              if (Array.isArray(value)) {
                return `[${value.length} items]`;
              }
              // For small objects, show key-value pairs
              const entries = Object.entries(value);
              if (entries.length <= 3) {
                return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
              }
              return `{${entries.length} properties}`;
            } catch {
              return "[Object]";
            }
          }
          return String(value);
        };

        const oldFormatted = formatValue(oldValue);
        const newFormatted = formatValue(newValue);

        if (oldFormatted !== newFormatted) {
          formattedChanges.push(
            `${fieldName}: "${oldFormatted}" → "${newFormatted}"`,
          );
        }
      }
    });

    return formattedChanges;
  }

  /**
   * Helper function to parse field_values JSON
   */
  static parseFieldValues(value: any): Record<string, any> {
    if (!value) return {};

    try {
      if (typeof value === "string") {
        return JSON.parse(value);
      }
      if (typeof value === "object") {
        return value;
      }
    } catch (error) {
      console.warn("Failed to parse field_values:", error);
    }

    return {};
  }

  /**
   * Enhanced field value formatter
   */
  static formatFieldValue(key: string, value: any): string {
    if (value === null || value === undefined || value === "") return "None";

    // Format dates
    if (key.toLowerCase().includes("date") && typeof value === "string") {
      try {
        // Handle different date formats
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const date = new Date(value);
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }
        if (value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          const [month, day, year] = value.split("/");
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
          );
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }
      } catch {
        // If date parsing fails, return as-is
      }
    }

    // Format monetary values
    if (
      key.toLowerCase().includes("premium") ||
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("payment") ||
      key.toLowerCase().includes("deductible") ||
      key.toLowerCase().includes("credit")
    ) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return `$${num.toLocaleString()}`;
      }
    }

    return String(value);
  }
}
