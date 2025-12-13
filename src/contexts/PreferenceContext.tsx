import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userPreferenceService, UserPreferences } from '@/services/userPreferenceService';
import { useAuth } from './AuthContext';

interface PreferenceContextType {
  preferences: UserPreferences | null;
  isLoading: boolean;
  
  // Generic preference methods
  updatePreference: (category: string, key: string, value: any) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  
  // Sidebar preferences
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => Promise<void>;
  
  // View mode preferences
  getViewMode: (section: string) => string;
  setViewMode: (section: string, mode: string) => Promise<void>;
  
  // Filter collapse preferences
  getFilterExpanded: (section: string) => boolean;
  setFilterExpanded: (section: string, expanded: boolean) => Promise<void>;
  
  // Pagination preferences
  getPaginationSettings: (section?: string) => { pageSize: number; showPageInfo: boolean };
  setPaginationSettings: (section: string, settings: { pageSize?: number; showPageInfo?: boolean }) => Promise<void>;
  
  // Filter preferences
  getFilterSettings: (section: string) => any;
  setFilterSettings: (section: string, settings: any) => Promise<void>;
  
  // Table preferences
  getTableSettings: (section: string) => { columns: string[]; sortBy: string; sortDir: 'asc' | 'desc' };
  setTableSettings: (section: string, settings: { columns?: string[]; sortBy?: string; sortDir?: 'asc' | 'desc' }) => Promise<void>;
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

export const PreferenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences when user logs in
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const prefs = await userPreferenceService.getAll();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = useCallback(async (category: string, key: string, value: any) => {
    if (!preferences) return;

    // Optimistic update
    const updated = {
      ...preferences,
      [category]: {
        ...preferences[category as keyof UserPreferences],
        [key]: value
      }
    };
    setPreferences(updated);

    try {
      await userPreferenceService.set(category, key, value);
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert on error
      await loadPreferences();
      throw error;
    }
  }, [preferences]);

  const updatePreferences = useCallback(async (prefs: Partial<UserPreferences>) => {
    if (!preferences) return;

    // Optimistic update
    const updated = { ...preferences, ...prefs };
    setPreferences(updated);

    try {
      await userPreferenceService.setMultiple(prefs);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      await loadPreferences();
      throw error;
    }
  }, [preferences]);

  const resetPreferences = useCallback(async () => {
    try {
      await userPreferenceService.reset();
      await loadPreferences();
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      throw error;
    }
  }, []);

  // Sidebar preferences
  const setSidebarCollapsed = useCallback(async (collapsed: boolean) => {
    if (!preferences) return;

    // Optimistic update
    const updated = {
      ...preferences,
      ui: {
        ...preferences.ui,
        sidebar: { ...preferences.ui.sidebar, collapsed }
      }
    };
    setPreferences(updated);

    try {
      await userPreferenceService.setSidebarCollapsed(collapsed);
    } catch (error) {
      console.error('Failed to update sidebar preference:', error);
      await loadPreferences();
      throw error;
    }
  }, [preferences]);

  // View mode preferences
  const setViewMode = useCallback(async (section: string, mode: string) => {
    if (!preferences) return;

    // Optimistic update
    const updated = {
      ...preferences,
      ui: {
        ...preferences.ui,
        view_modes: {
          ...preferences.ui.view_modes,
          [section]: mode
        }
      }
    };
    setPreferences(updated);

    try {
      await userPreferenceService.setViewMode(section, mode);
    } catch (error) {
      console.error('Failed to update view mode preference:', error);
      await loadPreferences();
      throw error;
    }
  }, [preferences]);

  // Filter collapse preferences
  const setFilterExpanded = useCallback(async (section: string, expanded: boolean) => {
    if (!preferences) return;

    // Optimistic update
    const updated = {
      ...preferences,
      ui: {
        ...preferences.ui,
        filters: {
          ...preferences.ui.filters,
          [section]: { expanded }
        }
      }
    };
    setPreferences(updated);

    try {
      await updatePreference('ui', 'filters', { ...preferences.ui.filters, [section]: { expanded } });
    } catch (error) {
      console.error('Failed to update filter expanded preference:', error);
      await loadPreferences();
      throw error;
    }
  }, [preferences, updatePreference]);

  // Pagination preferences
  const setPaginationSettings = useCallback(async (section: string, settings: { pageSize?: number; showPageInfo?: boolean }) => {
    if (!preferences) return;

    // Optimistic update
    const currentSettings = preferences.pagination[section] || preferences.pagination.default;
    const updated = {
      ...preferences,
      pagination: {
        ...preferences.pagination,
        [section]: { ...currentSettings, ...settings }
      }
    };
    setPreferences(updated);

    try {
      await userPreferenceService.setPaginationSettings(section, settings);
    } catch (error) {
      console.error('Failed to update pagination preferences:', error);
      await loadPreferences();
      throw error;
    }
  }, [preferences]);

  // Filter preferences
  const setFilterSettings = useCallback(async (section: string, settings: any) => {
    if (!preferences) return;

    // Optimistic update
    const updated = {
      ...preferences,
      filters: {
        ...preferences.filters,
        [section]: { ...preferences.filters[section], ...settings }
      }
    };
    setPreferences(updated);

    try {
      await updatePreference('filters', section, { ...preferences.filters[section], ...settings });
    } catch (error) {
      console.error('Failed to update filter preferences:', error);
      await loadPreferences();
      throw error;
    }
  }, [preferences, updatePreference]);

  // Table preferences
  const setTableSettings = useCallback(async (section: string, settings: { columns?: string[]; sortBy?: string; sortDir?: 'asc' | 'desc' }) => {
    if (!preferences) return;

    // Optimistic update
    const currentSettings = preferences.table_settings[section] || {};
    const updated = {
      ...preferences,
      table_settings: {
        ...preferences.table_settings,
        [section]: { ...currentSettings, ...settings }
      }
    };
    setPreferences(updated);

    try {
      await updatePreference('table_settings', section, { ...currentSettings, ...settings });
    } catch (error) {
      console.error('Failed to update table preferences:', error);
      await loadPreferences();
      throw error;
    }
  }, [preferences, updatePreference]);

  const value: PreferenceContextType = {
    preferences,
    isLoading,
    updatePreference,
    updatePreferences,
    resetPreferences,
    
    // Sidebar
    sidebarCollapsed: preferences?.ui.sidebar.collapsed ?? false,
    setSidebarCollapsed,
    
    // View modes
    getViewMode: (section: string) => preferences?.ui?.view_modes?.[section] ?? 'cards',
    setViewMode,
    
    // Filter collapse
    getFilterExpanded: (section: string) => preferences?.ui?.filters?.[section]?.expanded ?? false,
    setFilterExpanded,
    
    // Pagination
    getPaginationSettings: (section = 'default') => {
      const settings = preferences?.pagination[section] || preferences?.pagination.default;
      return settings || { pageSize: 25, showPageInfo: true };
    },
    setPaginationSettings,
    
    // Filters
    getFilterSettings: (section: string) => preferences?.filters[section] || {},
    setFilterSettings,
    
    // Tables
    getTableSettings: (section: string) => {
      const settings = preferences?.table_settings[section];
      return settings || { columns: [], sortBy: 'created_at', sortDir: 'desc' };
    },
    setTableSettings,
  };

  return (
    <PreferenceContext.Provider value={value}>
      {children}
    </PreferenceContext.Provider>
  );
};

export const usePreferences = (): PreferenceContextType => {
  const context = useContext(PreferenceContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferenceProvider');
  }
  return context;
};

export default PreferenceContext;