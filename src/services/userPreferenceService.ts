import { api } from './api';

export interface UserPreferences {
  ui: {
    sidebar: { collapsed: boolean; pinned: string[] };
    theme: { mode: 'light' | 'dark'; colorScheme: string };
    view_modes: {
      customers: 'table' | 'cards' | 'list';
      policies: 'cards' | 'grid';
      insurance_plans: 'table' | 'grid';
      appointments: 'calendar' | 'list';
    };
    filters: {
      leave_requests: { expanded: boolean };
      reminders: { expanded: boolean };
      appointments: { expanded: boolean };
    };
  };
  pagination: {
    default: { pageSize: number; showPageInfo: boolean };
    customers?: { pageSize?: number; showPageInfo?: boolean };
    policies?: { pageSize?: number; showPageInfo?: boolean };
    [key: string]: { pageSize?: number; showPageInfo?: boolean } | undefined;
  };
  table_settings: {
    customers?: {
      columns: string[];
      sortBy: string;
      sortDir: 'asc' | 'desc';
    };
    policies?: {
      columns: string[];
      sortBy: string;
      sortDir: 'asc' | 'desc';
    };
    [key: string]: {
      columns?: string[];
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    } | undefined;
  };
  filters: {
    customers?: {
      defaultStatus: string;
      defaultSort: string;
      defaultSortDir: string;
    };
    policies?: {
      defaultStatus: string;
      defaultView: string;
    };
    [key: string]: any;
  };
}

class UserPreferenceService {
  private cache: UserPreferences | null = null;

  async getAll(): Promise<UserPreferences> {
    if (this.cache) return this.cache;
    
    try {
      const response = await api.get<{ success: boolean; data: UserPreferences }>('/user-preferences');
      this.cache = response.data;
      return response.data;
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      // Return default preferences on error
      return this.getDefaultPreferences();
    }
  }

  async get<T = any>(category: string, key: string): Promise<T | null> {
    try {
      const response = await api.get<{ success: boolean; data: T }>(`/user-preferences/${category}/${key}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch preference ${category}.${key}:`, error);
      return null;
    }
  }

  async set(category: string, key: string, value: any): Promise<void> {
    try {
      await api.post('/user-preferences', { category, key, value });
      this.invalidateCache();
    } catch (error) {
      console.error(`Failed to set preference ${category}.${key}:`, error);
      throw error;
    }
  }

  async setMultiple(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      await api.put('/user-preferences', { preferences });
      this.invalidateCache();
    } catch (error) {
      console.error('Failed to set multiple preferences:', error);
      throw error;
    }
  }

  async reset(): Promise<void> {
    try {
      await api.delete('/user-preferences/reset');
      this.invalidateCache();
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      throw error;
    }
  }

  // Convenience methods for common preferences
  async setSidebarCollapsed(collapsed: boolean): Promise<void> {
    try {
      await api.post('/user-preferences/sidebar/collapsed', { collapsed });
      this.invalidateCache();
    } catch (error) {
      console.error('Failed to set sidebar collapsed state:', error);
      throw error;
    }
  }

  async setViewMode(section: string, mode: string): Promise<void> {
    try {
      await api.post('/user-preferences/view-mode', { section, mode });
      this.invalidateCache();
    } catch (error) {
      console.error(`Failed to set view mode for ${section}:`, error);
      throw error;
    }
  }

  async setPaginationSettings(section: string, settings: { pageSize?: number; showPageInfo?: boolean }): Promise<void> {
    try {
      await api.post('/user-preferences/pagination', { section, settings });
      this.invalidateCache();
    } catch (error) {
      console.error(`Failed to set pagination settings for ${section}:`, error);
      throw error;
    }
  }

  invalidateCache(): void {
    this.cache = null;
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      ui: {
        sidebar: { collapsed: false, pinned: [] },
        theme: { mode: 'light', colorScheme: 'blue' },
        view_modes: {
          customers: 'cards',
          policies: 'cards',
          insurance_plans: 'table',
          appointments: 'calendar'
        },
        filters: {
          leave_requests: { expanded: false },
          reminders: { expanded: true },
          appointments: { expanded: false }
        }
      },
      pagination: {
        default: { pageSize: 25, showPageInfo: true },
        customers: { pageSize: 50 },
        policies: { pageSize: 25 }
      },
      table_settings: {
        customers: {
          columns: ['name', 'email', 'phone', 'status'],
          sortBy: 'created_at',
          sortDir: 'desc'
        },
        policies: {
          columns: ['customer', 'policy_number', 'plan', 'status', 'premium'],
          sortBy: 'created_at',
          sortDir: 'desc'
        }
      },
      filters: {
        customers: {
          defaultStatus: 'all',
          defaultSort: 'created_at',
          defaultSortDir: 'desc'
        },
        policies: {
          defaultStatus: 'all',
          defaultView: 'cards'
        }
      }
    };
  }
}

export const userPreferenceService = new UserPreferenceService();