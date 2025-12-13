import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  company?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: Role[];
  organization?: Organization;
  full_name?: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  level: number;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  category: string;
}

export interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface TeamMemberCreateRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  position?: string;
  company?: string;
  location?: string;
  roles: number[];
  is_active?: boolean;
}

export interface TeamMemberUpdateRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  company?: string;
  location?: string;
  roles: number[];
  is_active?: boolean;
}

export interface TeamMemberFilters {
  search?: string;
  role?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
  per_page?: number;
  page?: number;
}

export interface TeamMemberStatistics {
  total_members: number;
  active_members: number;
  inactive_members: number;
  roles_breakdown: {
    role: string;
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

export const teamMembersApi = {
  // Get all team members
  getAll: async (
    filters?: TeamMemberFilters,
  ): Promise<ApiResponse<PaginatedResponse<TeamMember>>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`/team-members?${params.toString()}`);
    return response.data;
  },

  // Get team member by ID
  getById: async (id: string): Promise<ApiResponse<TeamMember>> => {
    const response = await apiClient.get(`/team-members/${id}`);
    return response.data;
  },

  // Create new team member
  create: async (
    data: TeamMemberCreateRequest,
  ): Promise<ApiResponse<TeamMember>> => {
    const response = await apiClient.post("/team-members", data);
    return response.data;
  },

  // Update team member
  update: async (
    id: string,
    data: TeamMemberUpdateRequest,
  ): Promise<ApiResponse<TeamMember>> => {
    const response = await apiClient.put(`/team-members/${id}`, data);
    return response.data;
  },

  // Delete team member
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/team-members/${id}`);
    return response.data;
  },

  // Toggle team member status
  toggleStatus: async (id: string): Promise<ApiResponse<TeamMember>> => {
    const response = await apiClient.patch(`/team-members/${id}/toggle-status`);
    return response.data;
  },

  // Update team member password
  updatePassword: async (
    id: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<ApiResponse<void>> => {
    const response = await apiClient.put(`/team-members/${id}/password`, {
      password,
      password_confirmation: passwordConfirmation,
    });
    return response.data;
  },

  // Get team member statistics
  getStatistics: async (): Promise<ApiResponse<TeamMemberStatistics>> => {
    const response = await apiClient.get("/team-members/statistics");
    return response.data;
  },

  // Get available roles for assignment
  getAvailableRoles: async (): Promise<ApiResponse<Role[]>> => {
    const response = await apiClient.get("/team-members/available-roles");
    return response.data;
  },
};

export default teamMembersApi;
