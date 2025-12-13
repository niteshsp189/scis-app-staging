import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/services/api";
import { IPWhitelistSettings } from "./IPWhitelistSettings";
import { SystemEnhancementSettings } from "./SystemEnhancementSettings";

// Helper function to properly convert various types to boolean
const convertToBoolean = (value: any, defaultValue: boolean = false): boolean => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
};

export function SecuritySettings() {
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: "8",
    passwordPolicy: "medium",
    loginAttempts: "5",
    twoFactorAuth: false,
    twoFactorRequired: false,
    ipWhitelist: false,
    auditLog: true,
    duplicateFinderEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemToolsPermissions, setSystemToolsPermissions] = useState<{
    can_clear_cache: boolean;
    can_export_database: boolean;
  } | null>(null);

  useEffect(() => {
    loadSecuritySettings();
    checkSystemToolsPermissions();
  }, []);

  const checkSystemToolsPermissions = async () => {
    try {
      
      const response = await api.system.getInfo();

      if (response?.data?.user_permissions) {
        
        setSystemToolsPermissions(response.data.user_permissions);
      } else if (response?.user_permissions) {
        
        setSystemToolsPermissions(response.user_permissions);
      } else {
        
        setSystemToolsPermissions({ can_clear_cache: false, can_export_database: false });
      }
    } catch (error) {
      console.error("Failed to check system tools permissions:", error);
      setSystemToolsPermissions({ can_clear_cache: false, can_export_database: false });
    }
  };

  // Check if user has any system tools permissions
  const hasSystemToolsAccess = systemToolsPermissions && 
    (systemToolsPermissions.can_clear_cache || systemToolsPermissions.can_export_database);

  const loadSecuritySettings = async () => {
    try {
      setLoading(true);
      const response = await api.organizationSettings.get();
      
      // The organization settings API returns data directly, not wrapped in ApiResponse
      const allSettings = response?.data || response || {};

      // Extract security settings with safe fallbacks and proper type conversion
      const settings = {
        sessionTimeout: String(allSettings["security.session_timeout"]?.value ?? "8"),
        passwordPolicy: String(allSettings["security.password_complexity"]?.value ?? "medium"),
        loginAttempts: String(allSettings["security.max_login_attempts"]?.value ?? "5"),
        twoFactorAuth: convertToBoolean(allSettings["security.2fa_enabled"]?.value, false),
        twoFactorRequired: convertToBoolean(allSettings["security.2fa_required"]?.value, false),
        // Don't use default values - use the actual server values, defaulting to false if not set
        ipWhitelist: convertToBoolean(allSettings["security.ip_whitelisting"]?.value, false),
        auditLog: convertToBoolean(allSettings["security.audit_logging"]?.value, false),
        duplicateFinderEnabled: convertToBoolean(allSettings["security.duplicate_finder_enabled"]?.value, true),
      };

      setSecuritySettings(settings);
    } catch (error: any) {
      console.error("Failed to load security settings:", error);
      
      let errorMessage = "Failed to load security settings. Using default values.";
      
      if (error?.status === 401) {
        errorMessage = "You need to sign in to access security settings.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Don't show error toast for default values, only for auth issues
      if (error?.status === 401) {
        toast({
          title: "Authentication Required",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // Just log the error but continue with default values
        console.warn("Using default security settings due to API error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      setSaving(true);

      // Format settings according to backend controller expectations
      const settingsToUpdate = {
        security: {
          session_timeout: parseInt(securitySettings.sessionTimeout),
          password_complexity: securitySettings.passwordPolicy,
          max_login_attempts: parseInt(securitySettings.loginAttempts),
          "2fa_enabled": securitySettings.twoFactorAuth,
          "2fa_required": securitySettings.twoFactorRequired,
          ip_whitelisting: securitySettings.ipWhitelist,
          audit_logging: securitySettings.auditLog,
          duplicate_finder_enabled: securitySettings.duplicateFinderEnabled,
        }
      };

      const response = await api.organizationSettings.updateMultiple(settingsToUpdate);

      toast({
        title: "Security Settings Saved",
        description: "Your security preferences have been updated.",
      });

      // Update settings from the response data if available
      if (response?.data) {
        const allSettings = response.data;
        
        const settings = {
          sessionTimeout: String(allSettings["security.session_timeout"]?.value ?? securitySettings.sessionTimeout),
          passwordPolicy: String(allSettings["security.password_complexity"]?.value ?? securitySettings.passwordPolicy),
          loginAttempts: String(allSettings["security.max_login_attempts"]?.value ?? securitySettings.loginAttempts),
          twoFactorAuth: convertToBoolean(allSettings["security.2fa_enabled"]?.value, securitySettings.twoFactorAuth),
          twoFactorRequired: convertToBoolean(allSettings["security.2fa_required"]?.value, securitySettings.twoFactorRequired),
          ipWhitelist: convertToBoolean(allSettings["security.ip_whitelisting"]?.value, securitySettings.ipWhitelist),
          auditLog: convertToBoolean(allSettings["security.audit_logging"]?.value, securitySettings.auditLog),
          duplicateFinderEnabled: convertToBoolean(allSettings["security.duplicate_finder_enabled"]?.value, securitySettings.duplicateFinderEnabled),
        };
        
        setSecuritySettings(settings);
      } else {
        // Fallback: reload from server if response doesn't contain data
        try {
          await loadSecuritySettings();
        } catch (reloadError) {
          console.warn("Failed to reload settings after save:", reloadError);
          toast({
            title: "Settings Saved",
            description: "Settings saved successfully, but there was an issue refreshing the display. Please refresh the page to see updated values.",
            variant: "default",
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to save security settings:", error);
      
      let errorMessage = "Failed to save security settings. Please try again.";
      
      if (error?.status === 401) {
        errorMessage = "You need to sign in to save security settings.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security policies and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading security settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security policies and access controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className={`grid w-full ${hasSystemToolsAccess ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="ip-whitelist">IP Whitelist</TabsTrigger>
              {hasSystemToolsAccess && (
                <TabsTrigger value="system-tools">System Tools</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="general" className="space-y-6 mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading security settings...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-500">
                          Enable two-factor authentication for enhanced security
                        </p>
                      </div>
                      <Switch
                        id="twoFactorAuth"
                        checked={securitySettings.twoFactorAuth}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            twoFactorAuth: checked,
                            // Disable required if 2FA itself is disabled
                            twoFactorRequired: checked ? securitySettings.twoFactorRequired : false,
                          })
                        }
                      />
                    </div>
                    {securitySettings.twoFactorAuth && (
                      <div className="flex items-center justify-between ml-6">
                        <div>
                          <Label htmlFor="twoFactorRequired">Require 2FA for All Users</Label>
                          <p className="text-sm text-gray-500">
                            Make two-factor authentication mandatory for all users
                          </p>
                        </div>
                        <Switch
                          id="twoFactorRequired"
                          checked={securitySettings.twoFactorRequired}
                          onCheckedChange={(checked) =>
                            setSecuritySettings({
                              ...securitySettings,
                              twoFactorRequired: checked,
                            })
                          }
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auditLog">Audit Logging</Label>
                        <p className="text-sm text-gray-500">
                          Log all user actions and system changes
                        </p>
                      </div>
                      <Switch
                        id="auditLog"
                        checked={securitySettings.auditLog}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            auditLog: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="duplicateFinderEnabled">Duplicate Finder Suggestion</Label>
                        <p className="text-sm text-gray-500">
                          Show potential duplicate customers when creating new customers
                        </p>
                      </div>
                      <Switch
                        id="duplicateFinderEnabled"
                        checked={securitySettings.duplicateFinderEnabled}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            duplicateFinderEnabled: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="ipWhitelist">IP Whitelisting</Label>
                        <p className="text-sm text-gray-500">
                          Restrict access to specific IP addresses
                        </p>
                      </div>
                      <Switch
                        id="ipWhitelist"
                        checked={securitySettings.ipWhitelist}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            ipWhitelist: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="1"
                        max="24"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            sessionTimeout: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                      <Input
                        id="loginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.loginAttempts}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            loginAttempts: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="passwordPolicy">Password Policy</Label>
                    <Select
                      value={securitySettings.passwordPolicy}
                      onValueChange={(value) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordPolicy: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - 6+ characters</SelectItem>
                        <SelectItem value="medium">
                          Medium - 8+ chars, mixed case
                        </SelectItem>
                        <SelectItem value="high">
                          High - 12+ chars, mixed case, symbols
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSaveSecuritySettings} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Security Settings
                  </Button>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="ip-whitelist" className="mt-6">
              <IPWhitelistSettings isEnabled={securitySettings.ipWhitelist} />
            </TabsContent>
            
            {hasSystemToolsAccess && (
              <TabsContent value="system-tools" className="mt-6">
                <SystemEnhancementSettings />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
