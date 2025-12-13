import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  level: number;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  users?: User[];
  users_count?: number;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name?: string;
}

export interface RoleCreateRequest {
  name: string;
  description?: string;
  permissions?: number[];
  is_active?: boolean;
  level?: number;
}

export interface RoleUpdateRequest {
  name: string;
  description?: string;
  permissions?: number[];
  is_active?: boolean;
  level?: number;
}

export interface RoleFilters {
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
  per_page?: number;
  page?: number;
  with_permissions?: boolean;
}

export interface RoleStatistics {
  total_roles: number;
  active_roles: number;
  inactive_roles: number;
  roles_with_users: number;
  permissions_breakdown: {
    category: string;
    count: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't automatically clear token - let AuthContext handle it
      console.warn("Authentication required - token may be expired");
    }
    return Promise.reject(error);
  },
);

export const rolesApi = {
  // Get all roles
  getAll: async (
    filters?: RoleFilters,
  ): Promise<ApiResponse<PaginatedResponse<Role>>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`/roles?${params.toString()}`);
    return response.data;
  },

  // Get role by ID
  getById: async (id: number): Promise<ApiResponse<Role>> => {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data;
  },

  // Create new role
  create: async (data: RoleCreateRequest): Promise<ApiResponse<Role>> => {
    const response = await apiClient.post("/roles", data);
    return response.data;
  },

  // Update role
  update: async (
    id: number,
    data: RoleUpdateRequest,
  ): Promise<ApiResponse<Role>> => {
    const response = await apiClient.put(`/roles/${id}`, data);
    return response.data;
  },

  // Delete role
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  },

  // Toggle role status
  toggleStatus: async (id: number): Promise<ApiResponse<Role>> => {
    const response = await apiClient.patch(`/roles/${id}/toggle-status`);
    return response.data;
  },

  // Get role statistics
  getStatistics: async (): Promise<ApiResponse<RoleStatistics>> => {
    const response = await apiClient.get("/roles/statistics");
    return response.data;
  },

  // Get all permissions
  getPermissions: async (filters?: {
    category?: string;
    grouped?: boolean;
  }): Promise<ApiResponse<Permission[] | Record<string, Permission[]>>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(
      `/roles/permissions?${params.toString()}`,
    );
    return response.data;
  },

  // Assign permissions to role
  assignPermissions: async (
    id: number,
    permissions: number[],
  ): Promise<ApiResponse<Role>> => {
    const response = await apiClient.post(`/roles/${id}/permissions`, {
      permissions,
    });
    return response.data;
  },

  // Remove permissions from role
  removePermissions: async (
    id: number,
    permissions: number[],
  ): Promise<ApiResponse<Role>> => {
    const response = await apiClient.delete(`/roles/${id}/permissions`, {
      data: { permissions },
    });
    return response.data;
  },

  // Duplicate role
  duplicate: async (id: number): Promise<ApiResponse<Role>> => {
    const response = await apiClient.post(`/roles/${id}/duplicate`);
    return response.data;
  },
};

export default rolesApi;
