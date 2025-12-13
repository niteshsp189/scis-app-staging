import { useState, useEffect, useCallback, memo } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { DateInput } from "@/components/ui/date-input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Trash2, Edit, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { api } from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "public" | "company" | "federal" | "state" | "religious" | "emergency";
  description?: string;
  is_active: boolean;
  is_recurring: boolean;
  affects_business_hours: boolean;
  office_location_id?: string;
  recurring_rule?: {
    frequency: string;
    interval: number;
  };
  created_at: string;
  updated_at: string;
}

interface HolidayFormData {
  name: string;
  date: Date | undefined;
  type: "public" | "company" | "federal" | "state" | "religious" | "emergency";
  description: string;
  is_recurring: boolean;
  affects_business_hours: boolean;
  office_location_id?: string;
  recurring_rule: {
    frequency: string;
    interval: number;
  };
}

// Separate HolidayForm component to prevent re-renders and focus loss
const HolidayForm = memo(
  ({
    formData,
    validationErrors,
    submitting,
    editingHoliday,
    onNameChange,
    onTypeChange,
    onDateChange,
    onDescriptionChange,
    onRecurringChange,
    onBusinessHoursChange,
    onFrequencyChange,
    onIntervalChange,
    onSubmit,
    onCancel,
  }: {
    formData: HolidayFormData;
    validationErrors: Record<string, string>;
    submitting: boolean;
    editingHoliday: Holiday | null;
    onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTypeChange: (value: string) => void;
    onDateChange: (date: Date | undefined) => void;
    onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onRecurringChange: (checked: boolean) => void;
    onBusinessHoursChange: (checked: boolean) => void;
    onFrequencyChange: (value: string) => void;
    onIntervalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
    onCancel: () => void;
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="holidayName">Holiday Name</Label>
          <Input
            id="holidayName"
            value={formData.name}
            onChange={onNameChange}
            placeholder="e.g., Christmas Day"
            className={validationErrors.name ? "border-red-500" : ""}
          />
          {validationErrors.name && (
            <p className="text-sm text-red-500">{validationErrors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Holiday Type</Label>
          <Select value={formData.type} onValueChange={onTypeChange}>
            <SelectTrigger
              className={validationErrors.type ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public Holiday</SelectItem>
              <SelectItem value="company">Company Holiday</SelectItem>
              <SelectItem value="federal">Federal Holiday</SelectItem>
              <SelectItem value="state">State Holiday</SelectItem>
              <SelectItem value="religious">Religious Holiday</SelectItem>
              <SelectItem value="emergency">Emergency Holiday</SelectItem>
            </SelectContent>
          </Select>
          {validationErrors.type && (
            <p className="text-sm text-red-500">{validationErrors.type}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <DateInput
            value={formData.date && !isNaN(formData.date.getTime()) ? format(formData.date, "yyyy-MM-dd") : ""}
            onChange={(value) => {
              if (value) {
                // Parse date string in local timezone to avoid off-by-one errors
                try {
                  const parsedDate = new Date(value + 'T00:00:00');
                  if (!isNaN(parsedDate.getTime())) {
                    onDateChange(parsedDate);
                  } else {
                    // Fallback parsing
                    const [year, month, day] = value.split('-').map(Number);
                    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
                    onDateChange(date);
                  }
                } catch (error) {
                  console.error('Error parsing date:', error);
                  onDateChange(undefined);
                }
              } else {
                onDateChange(undefined);
              }
            }}
            placeholder="Select holiday date"
            className={validationErrors.date ? "border-red-500" : ""}
            required
            minDate={!editingHoliday ? new Date() : undefined}
          />
          {validationErrors.date && (
            <p className="text-sm text-red-500">{validationErrors.date}</p>
          )}
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={onDescriptionChange}
              placeholder="Optional description"
              rows={3}
              className={validationErrors.description ? "border-red-500" : ""}
            />
            {validationErrors.description && (
              <p className="text-sm text-red-500">
                {validationErrors.description}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.is_recurring}
                onChange={(e) => onRecurringChange(e.target.checked)}
              />
              <Label htmlFor="recurring">Recurring Holiday</Label>
            </div>
            {validationErrors.is_recurring && (
              <p className="text-sm text-red-500">
                {validationErrors.is_recurring}
              </p>
            )}

            {formData.is_recurring && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.recurring_rule.frequency}
                    onValueChange={onFrequencyChange}
                  >
                    <SelectTrigger
                      className={
                        validationErrors["recurring_rule.frequency"]
                          ? "border-red-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors["recurring_rule.frequency"] && (
                    <p className="text-sm text-red-500">
                      {validationErrors["recurring_rule.frequency"]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Interval</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={formData.recurring_rule.interval}
                    onChange={onIntervalChange}
                    placeholder="e.g., 1"
                    className={
                      validationErrors["recurring_rule.interval"]
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {validationErrors["recurring_rule.interval"] && (
                    <p className="text-sm text-red-500">
                      {validationErrors["recurring_rule.interval"]}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Repeat every {formData.recurring_rule.interval}{" "}
                    {formData.recurring_rule.frequency === "yearly"
                      ? "year(s)"
                      : formData.recurring_rule.frequency === "monthly"
                        ? "month(s)"
                        : formData.recurring_rule.frequency === "weekly"
                          ? "week(s)"
                          : "day(s)"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="affects_business"
                checked={formData.affects_business_hours}
                onChange={(e) => onBusinessHoursChange(e.target.checked)}
              />
              <Label htmlFor="affects_business">Affects Business Hours</Label>
            </div>
            {validationErrors.affects_business_hours && (
              <p className="text-sm text-red-500">
                {validationErrors.affects_business_hours}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? "Saving..." : editingHoliday ? "Update" : "Add"} Holiday
        </Button>
      </div>
    </div>
  ),
);

export const HolidayManagement = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteHoliday, setDeleteHoliday] = useState<Holiday | null>(null);

  const [formData, setFormData] = useState<HolidayFormData>({
    name: "",
    date: undefined,
    type: "company",
    description: "",
    is_recurring: false,
    affects_business_hours: true,
    recurring_rule: {
      frequency: "yearly",
      interval: 1,
    },
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      date: undefined,
      type: "company",
      description: "",
      is_recurring: false,
      affects_business_hours: true,
      recurring_rule: {
        frequency: "yearly",
        interval: 1,
      },
    });
    setEditingHoliday(null);
    setValidationErrors({});
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await api.get('/holidays');
      
      if (response.data) {
        setHolidays(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      toast({
        title: "Error",
        description: "Failed to fetch holidays",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Clear previous validation errors
    setValidationErrors({});

    // Basic client-side validation
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = "Holiday name is required";
    }
    if (!formData.date) {
      errors.date = "Holiday date is required";
    }
    if (formData.is_recurring) {
      if (!formData.recurring_rule.frequency) {
        errors["recurring_rule.frequency"] =
          "Frequency is required for recurring holidays";
      }
      if (
        !formData.recurring_rule.interval ||
        formData.recurring_rule.interval < 1
      ) {
        errors["recurring_rule.interval"] = "Interval must be at least 1";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        date: formData.date ? format(formData.date, "yyyy-MM-dd") : '',
        type: formData.type,
        description: formData.description,
        is_recurring: formData.is_recurring,
        affects_business_hours: formData.affects_business_hours,
        office_location_id: formData.office_location_id,
        ...(formData.is_recurring && {
          recurring_rule: formData.recurring_rule,
        }),
      };

      const response = editingHoliday
        ? await api.put(`/holidays/${editingHoliday.id}`, payload)
        : await api.post('/holidays', payload);

      if (response.data) {
        toast({
          title: "Success",
          description: editingHoliday
            ? "Holiday updated successfully"
            : "Holiday created successfully",
        });

        resetForm();
        setIsDialogOpen(false);
        fetchHolidays();
      }
    } catch (error: any) {
      console.error('Failed to save holiday:', error);
      
      // Handle validation errors from server
      if (error.response?.data?.errors) {
        const formattedErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach((field) => {
          const errorValue = error.response.data.errors[field];
          formattedErrors[field] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
        setValidationErrors(formattedErrors);
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to save holiday",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    // Parse date in local timezone to avoid off-by-one errors
    let holidayDate: Date | undefined = undefined;
    try {
      if (holiday.date) {
        // Handle date string - could be '2024-12-25' or '2024-12-25T00:00:00.000000Z'
        const dateStr = holiday.date.split('T')[0]; // Get just the date part
        const parsedDate = new Date(dateStr + 'T00:00:00');
        
        if (!isNaN(parsedDate.getTime())) {
          holidayDate = parsedDate;
        } else {
          // Fallback: try manual parsing
          const [year, month, day] = dateStr.split('-').map(Number);
          if (year && month && day) {
            holidayDate = new Date(year, month - 1, day, 0, 0, 0, 0);
            // Validate the date is actually valid
            if (isNaN(holidayDate.getTime())) {
              holidayDate = undefined;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing holiday date:', holiday.date, error);
      holidayDate = undefined;
    }
    
    setFormData({
      name: holiday.name,
      date: holidayDate,
      type: holiday.type,
      description: holiday.description || "",
      is_recurring: holiday.is_recurring,
      affects_business_hours: holiday.affects_business_hours,
      office_location_id: holiday.office_location_id,
      recurring_rule: holiday.recurring_rule || {
        frequency: "yearly",
        interval: 1,
      },
    });
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (holiday: Holiday) => {
    setDeleteHoliday(holiday);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteHoliday) return;

    try {
      await api.delete(`/holidays/${deleteHoliday.id}`);
      
      toast({
        title: "Success",
        description: "Holiday deleted successfully",
      });
      fetchHolidays();
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      toast({
        title: "Error",
        description: "Failed to delete holiday",
        variant: "destructive",
      });
    } finally {
      setShowConfirmDialog(false);
      setDeleteHoliday(null);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "public":
        return "bg-red-100 text-red-800";
      case "company":
        return "bg-blue-100 text-blue-800";
      case "federal":
        return "bg-purple-100 text-purple-800";
      case "state":
        return "bg-green-100 text-green-800";
      case "religious":
        return "bg-yellow-100 text-yellow-800";
      case "emergency":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Memoized handlers to prevent re-renders
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, name: value }));
      if (validationErrors.name) {
        setValidationErrors((prev) => ({ ...prev, name: "" }));
      }
    },
    [validationErrors.name],
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, description: value }));
      if (validationErrors.description) {
        setValidationErrors((prev) => ({ ...prev, description: "" }));
      }
    },
    [validationErrors.description],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, type: value as any }));
      if (validationErrors.type) {
        setValidationErrors((prev) => ({ ...prev, type: "" }));
      }
    },
    [validationErrors.type],
  );

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      setFormData((prev) => ({ ...prev, date }));
      if (validationErrors.date) {
        setValidationErrors((prev) => ({ ...prev, date: "" }));
      }
    },
    [validationErrors.date],
  );

  const handleRecurringChange = useCallback(
    (checked: boolean) => {
      setFormData((prev) => ({ ...prev, is_recurring: checked }));
      if (validationErrors.is_recurring) {
        setValidationErrors((prev) => ({ ...prev, is_recurring: "" }));
      }
    },
    [validationErrors.is_recurring],
  );

  const handleBusinessHoursChange = useCallback(
    (checked: boolean) => {
      setFormData((prev) => ({ ...prev, affects_business_hours: checked }));
      if (validationErrors.affects_business_hours) {
        setValidationErrors((prev) => ({
          ...prev,
          affects_business_hours: "",
        }));
      }
    },
    [validationErrors.affects_business_hours],
  );

  const handleFrequencyChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({
        ...prev,
        recurring_rule: { ...prev.recurring_rule, frequency: value },
      }));
      if (validationErrors["recurring_rule.frequency"]) {
        setValidationErrors((prev) => ({
          ...prev,
          "recurring_rule.frequency": "",
        }));
      }
    },
    [validationErrors],
  );

  const handleIntervalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value) || 1;
      setFormData((prev) => ({
        ...prev,
        recurring_rule: { ...prev.recurring_rule, interval: value },
      }));
      if (validationErrors["recurring_rule.interval"]) {
        setValidationErrors((prev) => ({
          ...prev,
          "recurring_rule.interval": "",
        }));
      }
    },
    [validationErrors],
  );

  const handleCancel = useCallback(() => {
    resetForm();
    setIsDialogOpen(false);
  }, [resetForm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Holiday Management</h2>
          <p className="text-gray-600">
            Manage company holidays and public holidays
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchHolidays} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                resetForm();
              }
              setIsDialogOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[60vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingHoliday ? "Edit Holiday" : "Add New Holiday"}
                </DialogTitle>
              </DialogHeader>
              <HolidayForm
                formData={formData}
                validationErrors={validationErrors}
                submitting={submitting}
                editingHoliday={editingHoliday}
                onNameChange={handleNameChange}
                onTypeChange={handleTypeChange}
                onDateChange={handleDateChange}
                onDescriptionChange={handleDescriptionChange}
                onRecurringChange={handleRecurringChange}
                onBusinessHoursChange={handleBusinessHoursChange}
                onFrequencyChange={handleFrequencyChange}
                onIntervalChange={handleIntervalChange}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Holiday List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Scheduled Holidays ({holidays.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading holidays...
            </div>
          ) : (
            <div className="space-y-3">
              {holidays.map((holiday) => {
                // Safe date formatting
                let formattedDate = 'Invalid date';
                try {
                  if (holiday.date) {
                    // Handle date string - could be '2024-12-25' or '2024-12-25T00:00:00.000000Z'
                    const dateStr = holiday.date.split('T')[0]; // Get just the date part
                    const parsedDate = new Date(dateStr + 'T00:00:00');
                    if (!isNaN(parsedDate.getTime())) {
                      formattedDate = format(parsedDate, "PPP");
                    } else {
                      // Fallback: try manual parsing
                      const [year, month, day] = dateStr.split('-').map(Number);
                      if (year && month && day) {
                        const date = new Date(year, month - 1, day, 0, 0, 0, 0);
                        if (!isNaN(date.getTime())) {
                          formattedDate = format(date, "PPP");
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error formatting holiday date:', holiday.date, error);
                }
                
                return (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{holiday.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formattedDate}
                      </p>
                      {holiday.description && (
                        <p className="text-xs text-gray-500">
                          {holiday.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {holiday.is_recurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                        {holiday.affects_business_hours && (
                          <Badge variant="outline" className="text-xs">
                            Business Hours
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(holiday.type)}>
                      {holiday.type}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(holiday)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(holiday)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
              })}
              {holidays.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No holidays scheduled
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {deleteHoliday && (
        <ConfirmationDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleConfirmDelete}
          title="Delete Holiday"
          description={`Are you sure you want to delete "${deleteHoliday.name}"? This action cannot be undone.`}
          confirmButtonText="Delete"
          variant="destructive"
          isLoading={false}
        />
      )}
    </div>
  );
};
