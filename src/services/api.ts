interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Always get fresh token from localStorage
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...((options.headers as Record<string, string>) || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Don't automatically clear token - let AuthContext handle it
          throw {
            success: false,
            message: "Your session has expired. Please sign in again.",
            status: 401
          };
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: "An error occurred" };
        }

        throw {
          success: false,
          message: errorData.message || "An error occurred",
          errors: errorData.errors || {},
          status: response.status
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "GET",
    });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "DELETE",
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Update token
  setToken(token: string | null) {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  // Security Settings API endpoints
  security = {
    // Get security settings
    getSettings: () => this.get<ApiResponse>("/security/settings"),
    
    // Update security settings
    updateSettings: (settings: any) => this.post<ApiResponse>("/security/settings", settings),

    // IP Whitelist management
    ipWhitelist: {
      list: () => this.get<ApiResponse>("/security/ip-whitelist"),
      add: (ip: string, description?: string) => 
        this.post<ApiResponse>("/security/ip-whitelist", { ip, description }),
      remove: (ip: string) => 
        this.delete<ApiResponse>(`/security/ip-whitelist/${encodeURIComponent(ip)}`),
      test: (ip: string) => 
        this.post<ApiResponse>("/security/ip-whitelist/test", { ip }),
    },

    // Two-Factor Authentication
    twoFactor: {
      enable: (password: string) => this.post<ApiResponse>("/2fa/enable", { password }),
      confirm: (code: string) => this.post<ApiResponse>("/2fa/confirm", { code }),
      disable: (data: { password: string; code?: string; recovery_code?: string }) => this.post<ApiResponse>("/2fa/disable", data),
      verify: (code: string) => this.post<ApiResponse>("/2fa/verify", { code }),
      regenerateRecoveryCodes: (password: string) => this.post<ApiResponse>("/2fa/recovery-codes/regenerate", { password }),
    },
  };

  // Organization Settings API endpoints
  organizationSettings = {
    get: (key?: string) => {
      const endpoint = key ? `/organization-settings?key=${key}` : "/organization-settings";
      return this.get<ApiResponse>(endpoint);
    },
    update: (key: string, value: any) => 
      this.post<ApiResponse>("/organization-settings", { key, value }),
    updateMultiple: (settings: Record<string, any>) => 
      this.put<ApiResponse>("/organization-settings", settings),
  };

  // System Enhancement API endpoints
  system = {
    // Get system information
    getInfo: () => this.get<ApiResponse>("/system/info"),
    
    // Clear cache
    clearCache: (cacheTypes: string[] = ['all']) => 
      this.post<ApiResponse>("/system/clear-cache", { cache_types: cacheTypes }),
    
    // Export database
    exportDatabase: (options: {
      export_type?: 'full' | 'structure_only' | 'data_only';
      format?: 'sql' | 'json' | 'csv';
      tables?: string[];
    } = {}) => this.post<ApiResponse>("/system/export-database", options),
    
    // Download export file
    downloadExport: (filename: string) => {
      const url = `${this.baseURL}/system/download-export/${encodeURIComponent(filename)}`;
      const headers = this.getHeaders();
      return fetch(url, { headers }).then(response => {
        if (!response.ok) {
          throw new Error('Download failed');
        }
        return response.blob();
      });
    }
  };
}

// Create and export a singleton instance
export const api = new ApiService();

// Export the class as well for type definitions
export { ApiService };
export type { ApiResponse };
