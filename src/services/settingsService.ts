import { api } from "@/lib/axios";

export interface OrganizationSettings {
  [key: string]: {
    value: any;
    type: string;
    is_editable: boolean;
    description: string;
  };
}

export interface ReminderSettings {
  defaultReminderTime: string;
  reminderFrequency: string;
  reminderLeadTime: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  desktopNotifications: boolean;
}

class SettingsService {
  private apiBaseUrl = "";

  /**
   * Get all organization settings
   */
  async getOrganizationSettings(): Promise<OrganizationSettings> {
    try {
      const response = await api.get("/organization-settings");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch organization settings:", error);
      throw error;
    }
  }

  /**
   * Update organization settings
   */
  async updateOrganizationSettings(
    settings: Record<string, any>,
  ): Promise<void> {
    try {
      await api.put("/organization-settings", settings);
    } catch (error) {
      console.error("Failed to update organization settings:", error);
      throw error;
    }
  }

  /**
   * Get reminder-specific settings with defaults
   */
  async getReminderSettings(): Promise<ReminderSettings> {
    try {
      const allSettings = await this.getOrganizationSettings();

      return {
        defaultReminderTime:
          allSettings["reminder.default_time"]?.value || "09:00",
        reminderFrequency: allSettings["reminder.frequency"]?.value || "daily",
        reminderLeadTime: allSettings["reminder.lead_time"]?.value || "1",
        emailNotifications:
          allSettings["reminder.email_notifications"]?.value ?? true,
        smsNotifications:
          allSettings["reminder.sms_notifications"]?.value ?? false,
        desktopNotifications:
          allSettings["reminder.desktop_notifications"]?.value ?? true,
      };
    } catch (error) {
      console.error("Failed to fetch reminder settings:", error);
      // Return defaults if API fails
      return {
        defaultReminderTime: "09:00",
        reminderFrequency: "daily",
        reminderLeadTime: "1",
        emailNotifications: true,
        smsNotifications: false,
        desktopNotifications: true,
      };
    }
  }

  /**
   * Update reminder-specific settings
   */
  async updateReminderSettings(
    reminderSettings: ReminderSettings,
  ): Promise<void> {
    try {
      const settingsToUpdate = {
        reminder: {
          default_time: reminderSettings.defaultReminderTime,
          frequency: reminderSettings.reminderFrequency,
          lead_time: reminderSettings.reminderLeadTime,
          email_notifications: reminderSettings.emailNotifications,
          sms_notifications: reminderSettings.smsNotifications,
          desktop_notifications: reminderSettings.desktopNotifications,
        },
      };

      await this.updateOrganizationSettings(settingsToUpdate);
    } catch (error) {
      console.error("Failed to update reminder settings:", error);
      throw error;
    }
  }

  /**
   * Upload company logo
   */
  async uploadLogo(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await api.post("/organization-settings/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.logo_url;
    } catch (error) {
      console.error("Failed to upload logo:", error);
      throw error;
    }
  }

  /**
   * Get company settings
   */
  async getCompanySettings(): Promise<Record<string, any>> {
    try {
      const allSettings = await this.getOrganizationSettings();
      const companySettings: Record<string, any> = {};

      // Extract company-specific settings
      Object.keys(allSettings).forEach((key) => {
        if (key.startsWith("company.")) {
          const settingKey = key.replace("company.", "");
          companySettings[settingKey] = allSettings[key].value;
        }
      });

      return companySettings;
    } catch (error) {
      console.error("Failed to fetch company settings:", error);
      throw error;
    }
  }

  /**
   * Update company settings
   */
  async updateCompanySettings(
    companySettings: Record<string, any>,
  ): Promise<void> {
    try {
      const settingsToUpdate = {
        company: companySettings,
      };

      await this.updateOrganizationSettings(settingsToUpdate);
    } catch (error) {
      console.error("Failed to update company settings:", error);
      throw error;
    }
  }

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<Record<string, any>> {
    try {
      const allSettings = await this.getOrganizationSettings();
      const systemSettings: Record<string, any> = {};

      // Extract system-specific settings
      Object.keys(allSettings).forEach((key) => {
        if (key.startsWith("system.")) {
          const settingKey = key.replace("system.", "");
          systemSettings[settingKey] = allSettings[key].value;
        }
      });

      return systemSettings;
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
      throw error;
    }
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(
    systemSettings: Record<string, any>,
  ): Promise<void> {
    try {
      const settingsToUpdate = {
        system: systemSettings,
      };

      await this.updateOrganizationSettings(settingsToUpdate);
    } catch (error) {
      console.error("Failed to update system settings:", error);
      throw error;
    }
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<Record<string, any>> {
    try {
      const allSettings = await this.getOrganizationSettings();
      const securitySettings: Record<string, any> = {};

      // Extract security-specific settings
      Object.keys(allSettings).forEach((key) => {
        if (key.startsWith("security.")) {
          const settingKey = key.replace("security.", "");
          securitySettings[settingKey] = allSettings[key].value;
        }
      });

      return securitySettings;
    } catch (error) {
      console.error("Failed to fetch security settings:", error);
      throw error;
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    securitySettings: Record<string, any>,
  ): Promise<void> {
    try {
      const settingsToUpdate = {
        security: securitySettings,
      };

      await this.updateOrganizationSettings(settingsToUpdate);
    } catch (error) {
      console.error("Failed to update security settings:", error);
      throw error;
    }
  }

  /**
   * Get currency settings
   */
  async getCurrencySettings(): Promise<Record<string, any>> {
    try {
      const allSettings = await this.getOrganizationSettings();
      const currencySettings: Record<string, any> = {};

      // Extract currency-specific settings
      Object.keys(allSettings).forEach((key) => {
        if (key.startsWith("currency.")) {
          const settingKey = key.replace("currency.", "");
          currencySettings[settingKey] = allSettings[key].value;
        }
      });

      return currencySettings;
    } catch (error) {
      console.error("Failed to fetch currency settings:", error);
      throw error;
    }
  }

  /**
   * Update currency settings
   */
  async updateCurrencySettings(
    currencySettings: Record<string, any>,
  ): Promise<void> {
    try {
      const settingsToUpdate = {
        currency: currencySettings,
      };

      await this.updateOrganizationSettings(settingsToUpdate);
    } catch (error) {
      console.error("Failed to update currency settings:", error);
      throw error;
    }
  }

  /**
   * Check if duplicate finder is enabled in security settings
   */
  async isDuplicateFinderEnabled(): Promise<boolean> {
    try {
      const settings = await this.getOrganizationSettings();
      const duplicateFinderSetting = settings['security.duplicate_finder_enabled'];
      
      if (!duplicateFinderSetting) {
        return true; // Default to enabled if setting doesn't exist
      }

      // Convert value to boolean
      const value = duplicateFinderSetting.value;
      if (value === null || value === undefined) return true;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return lower === 'true' || lower === '1' || lower === 'yes';
      }
      if (typeof value === 'number') return value !== 0;
      return true;
    } catch (error) {
      console.error('Error checking duplicate finder setting:', error);
      return true; // Default to enabled if error occurs
    }
  }
}

export const settingsService = new SettingsService();
export default settingsService;
