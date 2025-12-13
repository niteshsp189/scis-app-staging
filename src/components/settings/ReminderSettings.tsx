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
import { Bell, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  settingsService,
  type ReminderSettings,
} from "@/services/settingsService";

export function ReminderSettings() {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    defaultReminderTime: "09:00",
    reminderFrequency: "daily",
    emailNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    reminderLeadTime: "1",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await settingsService.getReminderSettings();
        setReminderSettings(settings);
      } catch (error) {
        console.error("Failed to load reminder settings:", error);
        toast({
          title: "Error",
          description: "Failed to load reminder settings. Using defaults.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Clear validation error for a specific field
  const clearValidationError = (fieldName: string) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleSaveReminderSettings = async () => {
    try {
      setSaving(true);
      setValidationErrors({});
      await settingsService.updateReminderSettings(reminderSettings);
      toast({
        title: "Reminder Settings Saved",
        description: "Your reminder preferences have been updated.",
      });
    } catch (error: any) {
      console.error("Failed to save reminder settings:", error);

      // Handle validation errors
      if (error.response?.status === 422 && error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        toast({
          title: "Validation Error",
          description: "Please check the highlighted fields and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save reminder settings. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Reminder Settings
        </CardTitle>
        <CardDescription>
          Configure how reminders are displayed and delivered
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading reminder settings...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="defaultTime">Default Reminder Time</Label>
                <Select
                  value={reminderSettings.defaultReminderTime}
                  onValueChange={(value) => {
                    setReminderSettings({
                      ...reminderSettings,
                      defaultReminderTime: value,
                    });
                    clearValidationError("reminder.default_time");
                  }}
                >
                  <SelectTrigger
                    className={
                      validationErrors["reminder.default_time"]
                        ? "border-red-500"
                        : ""
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="17:00">5:00 PM</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors["reminder.default_time"] && (
                  <p className="text-sm text-red-500">
                    {validationErrors["reminder.default_time"][0]}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="frequency">Reminder Frequency</Label>
                <Select
                  value={reminderSettings.reminderFrequency}
                  onValueChange={(value) => {
                    setReminderSettings({
                      ...reminderSettings,
                      reminderFrequency: value,
                    });
                    clearValidationError("reminder.frequency");
                  }}
                >
                  <SelectTrigger
                    className={
                      validationErrors["reminder.frequency"]
                        ? "border-red-500"
                        : ""
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors["reminder.frequency"] && (
                  <p className="text-sm text-red-500">
                    {validationErrors["reminder.frequency"][0]}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="leadTime">Reminder Lead Time (hours)</Label>
              <Input
                id="leadTime"
                type="number"
                min="1"
                max="168"
                value={reminderSettings.reminderLeadTime}
                onChange={(e) => {
                  setReminderSettings({
                    ...reminderSettings,
                    reminderLeadTime: e.target.value,
                  });
                  clearValidationError("reminder.lead_time");
                }}
                placeholder="Enter hours (1-168)"
                className={
                  validationErrors["reminder.lead_time"] ? "border-red-500" : ""
                }
              />
              {validationErrors["reminder.lead_time"] && (
                <p className="text-sm text-red-500">
                  {validationErrors["reminder.lead_time"][0]}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                How many hours before the due time should the reminder be
                triggered
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Notification Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotif">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive reminder notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotif"
                    checked={reminderSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setReminderSettings({
                        ...reminderSettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotif">SMS Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive reminder notifications via SMS
                    </p>
                  </div>
                  <Switch
                    id="smsNotif"
                    checked={reminderSettings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setReminderSettings({
                        ...reminderSettings,
                        smsNotifications: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="desktopNotif">Desktop Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive reminder notifications in the browser
                    </p>
                  </div>
                  <Switch
                    id="desktopNotif"
                    checked={reminderSettings.desktopNotifications}
                    onCheckedChange={(checked) =>
                      setReminderSettings({
                        ...reminderSettings,
                        desktopNotifications: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveReminderSettings}
              disabled={saving}
              className="w-full md:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Reminder Settings"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
