import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface SecuritySettings {
  auditLoggingEnabled: boolean;
  ipWhitelistingEnabled: boolean;
  loading: boolean;
}

/**
 * Convert various value types to boolean
 */
const convertToBoolean = (value: any, defaultValue = false): boolean => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase().trim();
    return lowercased === 'true' || lowercased === '1' || lowercased === 'yes';
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return defaultValue;
};

export const useSecuritySettings = () => {
  const [settings, setSettings] = useState({
    auditLoggingEnabled: false,
    ipWhitelistingEnabled: false,
    twoFactorAuthEnabled: false,
    twoFactorRequired: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        
        const response = await api.organizationSettings.get();
        const allSettings = response?.data || response || {};

        const auditLogging = convertToBoolean(allSettings["security.audit_logging"]?.value, false);
        const ipWhitelisting = convertToBoolean(allSettings["security.ip_whitelisting"]?.value, false);
        const twoFactorAuth = convertToBoolean(allSettings["security.2fa_enabled"]?.value, false);
        const twoFactorReq = convertToBoolean(allSettings["security.2fa_required"]?.value, false);

        setSettings({
          auditLoggingEnabled: auditLogging,
          ipWhitelistingEnabled: ipWhitelisting,
          twoFactorAuthEnabled: twoFactorAuth,
          twoFactorRequired: twoFactorReq,
        });
      } catch (error) {
        console.error('🔧 [useSecuritySettings] Failed to load security settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return {
    auditLoggingEnabled: settings.auditLoggingEnabled,
    ipWhitelistingEnabled: settings.ipWhitelistingEnabled,
    twoFactorAuthEnabled: settings.twoFactorAuthEnabled,
    twoFactorRequired: settings.twoFactorRequired,
    loading,
  };
};
