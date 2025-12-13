export interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  position?: string;
  company?: string;
  location?: string;
  avatar_url?: string;
  is_active: boolean;
  two_factor_enabled?: boolean;
  last_login_at?: string;
  created_at: string;
  roles?: string[];
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  two_factor_code?: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  position?: string;
  company?: string;
  location?: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  location?: string;
  avatar_url?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  token_type?: string;
  requires_2fa?: boolean;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

class AuthService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.token = localStorage.getItem("auth_token");
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = {
          success: false,
          message: data.message || "An error occurred",
          errors: data.errors || {},
          status: response.status,
          ...data // Preserve all fields from the API response (including requires_2fa)
        };

        // Handle specific status codes
        switch (response.status) {
          case 401:
            // Clear token on unauthorized
            this.clearToken();
            error.message = "Your session has expired. Please sign in again.";
            break;
          case 403:
            error.message = "You don't have permission to perform this action.";
            break;
          case 404:
            error.message = "The requested resource was not found.";
            break;
          case 422:
            // Keep the original message from API for validation errors
            // Don't override it - validation errors should show specific messages
            break;
          case 423:
            // Don't override the message for 2FA requirements
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            error.message = "A system error occurred. Please try again later.";
            break;
        }

        throw error;
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);

      // If it's already our formatted error, rethrow it
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw {
          success: false,
          message: "Unable to connect to server. Please check your internet connection.",
          errors: {},
          status: 0
        };
      }

      // For any other type of error
      throw {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        errors: {},
        status: 500
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const payload: any = {
        email: credentials.email,
        password: credentials.password
      };
      
      // Include 2FA code if provided
      if (credentials.two_factor_code) {
        payload.two_factor_code = credentials.two_factor_code;
      }
      
      const response = await this.makeRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.success && response.token) {
        this.setToken(response.token);
      }

      return response;
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      throw {
        success: false,
        message: error instanceof Error ? error.message : "Login failed",
        errors: {},
        status: 500
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      if (response.success && response.token) {
        this.setToken(response.token);
      }

      return response;
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      throw {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed",
        errors: {},
        status: 500
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.makeRequest("/auth/logout", {
          method: "POST",
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      this.clearToken();
    }
  }

  async logoutAll(): Promise<void> {
    try {
      if (this.token) {
        await this.makeRequest("/auth/logout-all", {
          method: "POST",
        });
      }
    } catch (error) {
      console.error("Logout all request failed:", error);
    } finally {
      this.clearToken();
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response = await this.makeRequest<{ success: boolean; user: User }>(
        "/user",
      );

      if (!response.success) {
        throw {
          success: false,
          message: "Failed to fetch profile",
          errors: {},
          status: 500
        };
      }

      return response.user;
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      throw {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch profile",
        errors: {},
        status: 500
      };
    }
  }

  async updateProfile(profileData: UpdateProfileData): Promise<User> {
    try {
      const response = await this.makeRequest<{ success: boolean; user: User }>(
        "/user/profile",
        {
          method: "PUT",
          body: JSON.stringify(profileData),
        },
      );

      if (!response.success) {
        throw {
          success: false,
          message: "Failed to update profile",
          errors: {},
          status: 500
        };
      }

      return response.user;
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      throw {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update profile",
        errors: {},
        status: 500
      };
    }
  }

  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        message: string;
        errors?: Record<string, string[]>;
      }>("/user/password", {
        method: "PUT",
        body: JSON.stringify(passwordData),
      });

      if (!response.success) {
        throw {
          success: false,
          message: response.message || "Failed to change password",
          errors: response.errors || {},
          status: 422
        };
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      throw {
        success: false,
        message: error instanceof Error ? error.message : "Failed to change password",
        errors: {},
        status: 500
      };
    }
  }

  async getSessions(): Promise<any[]> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        sessions: any[];
      }>("/user/sessions");

      if (!response.success) {
        throw {
          success: false,
          message: "Failed to fetch sessions",
          errors: {},
          status: 500
        };
      }

      return response.sessions;
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      throw {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch sessions",
        errors: {},
        status: 500
      };
    }
  }

  async revokeSession(tokenId: string): Promise<void> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(
        `/user/sessions/${tokenId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.success) {
        throw {
          success: false,
          message: "Failed to revoke session",
          errors: {},
          status: 500
        };
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      throw {
        success: false,
        message: error instanceof Error ? error.message : "Failed to revoke session",
        errors: {},
        status: 500
      };
    }
  }

  async uploadAvatar(avatarFile: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const token = this.getToken();
      const response = await fetch(`${this.baseURL}/user/avatar`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          success: false,
          message: errorData.message || "Failed to upload avatar",
          errors: errorData.errors || {},
          status: response.status
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        throw {
          success: false,
          message: data.message || "Failed to upload avatar",
          errors: data.errors || {},
          status: 500
        };
      }

      return data.user;
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      throw {
        success: false,
        message: error instanceof Error ? error.message : "Failed to upload avatar",
        errors: {},
        status: 500
      };
    }
  }

  async deleteAvatar(): Promise<User> {
    try {
      const response = await this.makeRequest<{ success: boolean; user: User }>(
        "/user/avatar",
        {
          method: "DELETE",
        },
      );

      if (!response.success) {
        throw {
          success: false,
          message: "Failed to delete avatar",
          errors: {},
          status: 500
        };
      }

      return response.user;
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      throw {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete avatar",
        errors: {},
        status: 500
      };
    }
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/testing-server`);
      return response.ok;
    } catch (error) {
      console.error("API connection test failed:", error);
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;
