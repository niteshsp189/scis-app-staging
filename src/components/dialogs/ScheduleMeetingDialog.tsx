import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Calendar as CalendarLucide, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { MeetingFormFields } from "./meeting/MeetingFormFields";
import { DateTimeSelector } from "./meeting/DateTimeSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import appointmentService, {
  CreateAppointmentData,
} from "@/services/appointmentService";
import userService from "@/services/userService";
import timezoneService from "@/services/timezoneService";
import { officeLocationService } from "@/services/officeLocationService";
import { User } from "@/services/authService";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventDispatcher } from "@/hooks/useEventListener";

interface ScheduleMeetingDialogProps {
  customerId: number;
  customerName: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onScheduled?: () => void;
  defaultDate?: Date;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface OfficeLocation {
  id: string;
  name: string;
  display: string;
  address: string;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  endTime?: string;
  location?: string;
  meetingType?: string;
  priority?: string;
  selectedEmployeeId?: string;
  customer_id?: string;
  assigned_to?: string;
  start_datetime?: string;
  end_datetime?: string;
  general?: string;
}

const appointmentTypes = [
  { value: 'new_client', label: 'New Client' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'part_d', label: 'Part D' },
  { value: 'rate_increase', label: 'Rate increase' },
  { value: 'under_65', label: 'Under 65' },
  { value: 'dental_vision', label: 'Dental & Vision' },
  { value: 'review', label: 'Review' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'field_time', label: 'Field Time' },
  { value: 'life_insurance', label: 'Life Insurance' }
];

export const ScheduleMeetingDialog = ({
  customerId,
  customerName,
  trigger,
  open: externalOpen,
  onOpenChange,
  onScheduled,
  defaultDate,
}: ScheduleMeetingDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(() => {
    const initialDate = defaultDate ? new Date(defaultDate) : new Date();
    // Normalize to midnight to avoid timezone issues
    initialDate.setHours(0, 0, 0, 0);
    return initialDate;
  });
  const [time, setTime] = useState(() => {
    // Initialize time from defaultDate if it has specific hours/minutes
    if (defaultDate && (defaultDate.getHours() !== 0 || defaultDate.getMinutes() !== 0)) {
      const hours = defaultDate.getHours().toString().padStart(2, '0');
      const minutes = defaultDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return "";
  });
  const [endTime, setEndTime] = useState("");
  const [meetingType, setMeetingType] = useState<string[]>(['review']);
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [location, setLocation] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("any");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [availabilityCheck, setAvailabilityCheck] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);
  const [alternativeTimes, setAlternativeTimes] = useState<string[]>([]);

  // Handle real-time validation changes from DateTimeSelector
  const handleValidationChange = (field: string, error: string | undefined) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Load users and office locations when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers();
      loadOfficeLocations();
    }
  }, [open]);

  // Auto-populate date and time when defaultDate is provided
  useEffect(() => {
    if (defaultDate) {
      setDate(new Date(defaultDate));

      // If defaultDate has a specific hour set (not just midnight), auto-populate time
      if (defaultDate.getHours() !== 0 || defaultDate.getMinutes() !== 0) {
        const hours = defaultDate.getHours().toString().padStart(2, '0');
        const minutes = defaultDate.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        // Only set time if it's different from current time
        if (time !== timeString) {
          setTime(timeString);
        }
      }
    }
  }, [defaultDate]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      // Get users from the API
      const fetchedUsers = await userService.getUsers({ active: true });
      // Ensure we have an array
      if (Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
        // Keep 'any' as default - don't auto-select first user
      } else {
        // For permission errors, the service already shows a toast
        // So we just use fallback data without showing another error

        // Fallback to mock data with proper UUIDs if API fails or returns empty
        const fallbackUsers: User[] = [
          {
            id: "019819b0-d38c-73e0-93ab-c664068830fa",
            first_name: "System",
            last_name: "Administrator",
            email: "admin@insurecrm.com",
          },
          {
            id: "029819b0-d38c-73e0-93ab-c664068830fb",
            first_name: "Sarah",
            last_name: "Johnson",
            email: "sarah@insurecrm.com",
          },
          {
            id: "039819b0-d38c-73e0-93ab-c664068830fc",
            first_name: "Mike",
            last_name: "Davis",
            email: "mike@insurecrm.com",
          },
        ];
        
        setUsers(fallbackUsers);
        // Keep 'any' as default
      }
    } catch (error) {
      console.error("Error loading users:", error);
      
      // If it's not a permission error (which is already handled in the service),
      // show a generic error toast
      const isPermissionError = error.status === 403 || error.response?.status === 403;
      if (!isPermissionError) {
        toast({
          title: "Error",
          description: "Failed to load users. Using fallback data.",
          variant: "destructive",
        });
      }

      // Fallback to mock data with proper UUIDs if API fails
      const fallbackUsers: User[] = [
        {
          id: "019819b0-d38c-73e0-93ab-c664068830fa",
          first_name: "System",
          last_name: "Administrator",
          email: "admin@insurecrm.com",
        },
        {
          id: "029819b0-d38c-73e0-93ab-c664068830fb",
          first_name: "Sarah",
          last_name: "Johnson",
          email: "sarah@insurecrm.com",
        },
        {
          id: "039819b0-d38c-73e0-93ab-c664068830fc",
          first_name: "Mike",
          last_name: "Davis",
          email: "mike@insurecrm.com",
        },
      ];
      setUsers(fallbackUsers);
      // Keep 'any' as default
    } finally {
      setUsersLoading(false);
    }
  };

    const loadOfficeLocations = async () => {
    setLocationsLoading(true);
    try {
      const response = await officeLocationService.getLocationOptions();
      if (response && Array.isArray(response)) {
        setOfficeLocations(response);
      } else {
        setOfficeLocations([]);
      }
    } catch (error) {
      console.error("Failed to load office locations:", error);
      setOfficeLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  };

  const checkAvailability = useCallback(async () => {
    if (!date || !time || !selectedEmployeeId) return;

    // Skip availability check for 'Any' employee
    if (selectedEmployeeId === 'any') {
      setAvailabilityCheck({ available: true });
      return;
    }

    setLoading(true);
    try {
      // Parse the selected date and time
      const startDateTime = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      // Parse end time from user input or default to 1 hour later
      const endDateTime = new Date(date);
      if (endTime) {
        const [endHours, endMinutes] = endTime.split(":").map(Number);
        endDateTime.setHours(endHours, endMinutes, 0, 0);
      } else {
        // Fallback to 1 hour if no end time set
        endDateTime.setHours(startDateTime.getHours() + 1);
      }

      // Basic validation checks
      // REMOVED: Past date restriction as per client request to allow any date appointments
      // const now = new Date();
      // const isPastAppointment = startDateTime < now;

      let mockAvailability = {
        available: true,
        reason: "",
      };

      // REMOVED: Past date check to allow appointments for any date
      // Check for real appointment conflicts via API (keeping double booking, leave, holiday checks)
      try {
        const response = await appointmentService.checkAvailability({
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          assigned_to: selectedEmployeeId,
          customer_id: customerId,
        });

        if (!response.available) {
          // Use detailed conflicts if available, otherwise fall back to message
          let conflictReason = response.message || "This time slot conflicts with another appointment. Please select a different time.";
          
          if (response.conflicts && response.conflicts.length > 0) {
            // Join all conflicts with line breaks for better readability
            conflictReason = response.conflicts.join('\n• ');
            // Add bullet point to first item for consistency
            conflictReason = '• ' + conflictReason;
          }
          
          mockAvailability = {
            available: false,
            reason: conflictReason,
          };
        }
      } catch (error: any) {
        console.error("Error checking appointment conflicts:", error);
        // On API error, check if we got detailed conflict information
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          
          if (errorData.conflicts && errorData.conflicts.length > 0) {
            // Use detailed conflicts
            let conflictReason = errorData.conflicts.join('\n• ');
            conflictReason = '• ' + conflictReason;
            
            mockAvailability = {
              available: false,
              reason: conflictReason,
            };
          } else if (errorData.message) {
            mockAvailability = {
              available: false,
              reason: errorData.message,
            };
          } else {
            // Allow scheduling but log the error for basic validation
            mockAvailability = {
              available: true,
              reason: "",
            };
          }
        } else {
          // Allow scheduling but log the error for basic validation
          mockAvailability = {
            available: true,
            reason: "",
          };
        }
      }

      setAvailabilityCheck(mockAvailability);
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailabilityCheck({
        available: false,
        reason: "Error checking availability. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [date, time, endTime, selectedEmployeeId, customerId]);

  // Clear validation errors when form fields change and trigger availability check
  useEffect(() => {
    if (errors.date || errors.time || errors.endTime || errors.general) {
      setErrors(prev => ({
        ...prev,
        date: undefined,
        time: undefined,
        endTime: undefined,
        general: undefined
      }));
    }
    // Clear availability check when date/time changes to force re-check
    setAvailabilityCheck(null);
    
    // Automatically check availability when date and time are both set
    if (date && time && selectedEmployeeId) {
      const timeoutId = setTimeout(() => {
        checkAvailability();
      }, 500); // Debounce to avoid too many API calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [date, time, endTime, checkAvailability]);

  useEffect(() => {
    if (errors.selectedEmployeeId) {
      setErrors(prev => ({
        ...prev,
        selectedEmployeeId: undefined
      }));
    }
    // Clear availability check when assignee changes to force re-check
    setAvailabilityCheck(null);
    // Clear general errors from previous API conflicts
    setErrors(prev => ({
      ...prev,
      general: undefined
    }));
    
    // Automatically check availability when employee changes
    if (date && time && selectedEmployeeId) {
      const timeoutId = setTimeout(() => {
        checkAvailability();
      }, 500); // Debounce to avoid too many API calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedEmployeeId, date, time, checkAvailability]);

  useEffect(() => {
    if (errors.meetingType) {
      setErrors(prev => ({
        ...prev,
        meetingType: undefined
      }));
    }
    // Clear availability check and general errors when meeting type changes
    setAvailabilityCheck(null);
    setErrors(prev => ({
      ...prev,
      general: undefined
    }));
  }, [meetingType]);

  useEffect(() => {
    if (errors.location) {
      setErrors(prev => ({
        ...prev,
        location: undefined
      }));
    }
  }, [location]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!date) {
      newErrors.date = "Date is required";
    }

    if (!time) {
      newErrors.time = "Start time is required";
    }

    if (!selectedEmployeeId) {
      newErrors.selectedEmployeeId = "Please select an employee or 'Any'";
    }

    if (!meetingType || meetingType.length === 0) {
      newErrors.meetingType = "At least one appointment type is required";
    }

    // Check if customer ID is valid
    if (!customerId || customerId <= 0) {
      newErrors.customer_id = "Invalid customer selected";
    }

    // Validate end time is not before start time (only if user has set an end time)
    if (time && endTime && endTime.trim() !== "") {
      const [startHours, startMinutes] = time.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      const startTimeInMinutes = startHours * 60 + startMinutes;
      const endTimeInMinutes = endHours * 60 + endMinutes;
      
      if (endTimeInMinutes <= startTimeInMinutes) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseApiError = (error: any): ValidationErrors => {
    const apiErrors: ValidationErrors = {};

    // Handle conflict responses (status code 409)
    if (error.response?.status === 409) {
      // Check if there are conflicts in the response
      if (error.response?.data?.conflicts && error.response.data.conflicts.length > 0) {
        const conflicts = error.response.data.conflicts;
        
        // Join all conflicts with bullet points for better readability
        let conflictMessage = conflicts.join('\n• ');
        conflictMessage = '• ' + conflictMessage;

        toast({
          title: "Scheduling Conflict",
          description: conflicts.length === 1 
            ? conflicts[0] 
            : `Multiple conflicts detected. Please check the form for details.`,
          variant: "destructive",
        });

        apiErrors.general = conflictMessage;
        return apiErrors;
      } else if (error.response?.data?.message) {
        // Generic conflict message from backend
        const conflictMessage = error.response.data.message;

        toast({
          title: "Scheduling Conflict",
          description: conflictMessage,
          variant: "destructive",
        });

        apiErrors.general = conflictMessage;
        return apiErrors;
      }
    }

    // Check for structured validation errors
    if (error.response?.data?.errors) {
      const backendErrors = error.response.data.errors;

      // Map backend field names to frontend field names
      if (backendErrors.title) apiErrors.title = backendErrors.title[0];
      if (backendErrors.description)
        apiErrors.description = backendErrors.description[0];
      if (backendErrors.start_datetime)
        apiErrors.start_datetime = backendErrors.start_datetime[0];
      if (backendErrors.end_datetime)
        apiErrors.end_datetime = backendErrors.end_datetime[0];
      if (backendErrors.location)
        apiErrors.location = backendErrors.location[0];
      if (backendErrors.appointment_type)
        apiErrors.meetingType = backendErrors.appointment_type[0];
      if (backendErrors.assigned_to)
        apiErrors.selectedEmployeeId = backendErrors.assigned_to[0];
      if (backendErrors.customer_id)
        apiErrors.customer_id = backendErrors.customer_id[0];
    } else if (error.response?.data?.message) {
      // Check for error message and special handling for conflicts
      const message = error.response.data.message;

      // Show detailed error messages from backend
      toast({
        title: "Appointment Scheduling Error",
        description: message,
        variant: "destructive",
      });

      apiErrors.general = message;
    } else {
      // Default error message
      apiErrors.general =
        "An unexpected error occurred. Please try again later.";
    }

    return apiErrors;
  };

  // Create event dispatchers
  const dispatchAppointmentCreated = useEventDispatcher("appointmentCreated");
  const dispatchTabChange = useEventDispatcher("changeTab");

  // Reset form to initial state
  const resetForm = () => {
    setTitle("");
    setDescription("");
    const resetDate = defaultDate || new Date();
    resetDate.setHours(0, 0, 0, 0); // Normalize to midnight
    setDate(resetDate);
    setTime("");
    setEndTime("");
    setLocation("");
    setMeetingType(['review']);
    setPriority("medium");
    setSelectedEmployeeId("any");
    setErrors({});
    setAvailabilityCheck(null);
  };

  /**
   * Handles form submission with enhanced conflict handling.
   * The error handling flow:
   * 1. Clear any previous errors
   * 2. Validate form fields
   * 3. Attempt to create the appointment
   * 4. If successful, show success toast and navigate to appointments tab
   * 5. If conflict, show specialized conflict error with specific details
   * 6. For other errors, show appropriate error messages
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      // Show toast for validation errors
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Clear any existing errors before submission
      setErrors({});

      // Parse the date and time using timezone service
      const startDateTime = new Date(date!);
      const [hours, minutes] = time.split(":").map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      // Parse end time from user input or default to 1 hour later
      const endDateTime = new Date(date!);
      if (endTime && endTime.trim() !== "") {
        // User has manually set an end time
        const [endHours, endMinutes] = endTime.split(":").map(Number);
        endDateTime.setHours(endHours, endMinutes, 0, 0);
      } else {
        // No end time set by user - default to 1 hour after start time
        endDateTime.setHours(startDateTime.getHours() + 1, startDateTime.getMinutes(), 0, 0);
      }

        // Auto-generate title if hidden/empty
        let finalTitle = title.trim();
        if (!finalTitle) {
          const typeLabels = meetingType.map(type => 
            appointmentTypes.find(t => t.value === type)?.label || type
          ).join(', ');
          finalTitle = `${typeLabels} - ${customerName}`;
        }

        // Use timezone service to create proper datetime strings for API
        const startDatetimeISO = await timezoneService.createOrganizationDateTime(startDateTime);
        const endDatetimeISO = await timezoneService.createOrganizationDateTime(endDateTime);

        const appointmentData: CreateAppointmentData = {
          title: finalTitle,
          description,
          start_datetime: startDatetimeISO,
          end_datetime: endDatetimeISO,
          location: officeLocations.find(loc => loc.id === location)?.name || location,
          office_location_id: location || undefined,
          appointment_type: meetingType.join(','), // Join multiple types with comma
          priority: priority,
          customer_id: customerId,
          assigned_to: selectedEmployeeId === 'any' ? null : selectedEmployeeId,
          notes: description,
        };      // Log the request data for debugging

      try {
        const response =
          await appointmentService.createAppointment(appointmentData);

        if (response.success) {
          toast({
            title: "Success",
            description: "Meeting scheduled successfully",
          });

          // Reset all form state completely
          setTitle("");
          setDescription("");
          const resetDate = defaultDate || new Date();
          resetDate.setHours(0, 0, 0, 0); // Normalize to midnight
          setDate(resetDate);
          setTime("");
          setEndTime("");
          setLocation("");
          setMeetingType(['review']);
          setPriority("medium");
          setSelectedEmployeeId("any");
          setErrors({});
          setAvailabilityCheck(null);
          
          // Close the dialog
          setOpen(false);

          // Call onScheduled callback if provided
          if (onScheduled) {
            onScheduled();
          }

          // Navigate to appointments tab and refresh data
          dispatchTabChange("appointments");

          // Small delay to ensure tab change happens before refreshing the data
          setTimeout(() => {
            // Then dispatch event to refresh appointment data
            dispatchAppointmentCreated(response.data);
          }, 100);
        } else {
          // Handle API validation errors
          if (response.conflicts && response.conflicts.length > 0) {
            // Use the detailed conflicts array
            let conflictMessage = response.conflicts.join('\n• ');
            conflictMessage = '• ' + conflictMessage;

            // Set a distinctive conflict error message
            setErrors({
              general: conflictMessage,
            });

            // Show a detailed toast as well
            toast({
              title: "Scheduling Conflict",
              description: response.conflicts.length === 1 
                ? response.conflicts[0] 
                : `Multiple conflicts detected. Please check the details below.`,
              variant: "destructive",
            });
          } else if (
            response.message &&
            response.message.includes("conflict")
          ) {
            // Handle the case where the API indicates a conflict but doesn't provide details
            setErrors({
              general:
                response.message || "The selected time conflicts with an existing appointment",
            });

            toast({
              title: "Scheduling Conflict",
              description:
                response.message || "This time slot is already booked with another appointment",
              variant: "destructive",
            });
          } else {
            setErrors({
              general: response.message || "Failed to schedule meeting",
            });
          }
        }
      } catch (apiError: any) {
        console.error("API Error:", apiError);

        // Special handling for HTTP 409 Conflict status
        if (apiError.response?.status === 409) {
          // Handle conflicts in catch block for direct API errors
          if (apiError.response?.data?.conflicts && apiError.response?.data?.conflicts.length > 0) {
            const conflicts = apiError.response.data.conflicts;
            
            // Show the first conflict as the main message, but include all conflicts
            let conflictMessage = conflicts.join('\n• ');
            conflictMessage = '• ' + conflictMessage;

            setErrors({
              general: conflictMessage,
            });

            toast({
              title: "Scheduling Conflict",
              description: conflicts.length === 1 
                ? conflicts[0] 
                : `Multiple conflicts detected. Please check the details below.`,
              variant: "destructive",
            });
          } else if (apiError.response?.data?.message) {
            // Generic conflict message from backend
            const conflictMessage = apiError.response.data.message;
            
            setErrors({
              general: conflictMessage,
            });

            toast({
              title: "Scheduling Conflict",
              description: conflictMessage,
              variant: "destructive",
            });
          } else {
            // Generic conflict message when we don't have detailed conflict info
            setErrors({
              general: "Appointment scheduling conflict detected. Please select a different time.",
            });

            toast({
              title: "Scheduling Conflict",
              description: "This time slot is already booked or conflicts with business rules.",
              variant: "destructive",
            });
          }
        } else {
          throw apiError; // Re-throw to be caught by the outer catch block
        }
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      // Only use parseApiError for errors not already handled in the inner try/catch
      const apiErrors = parseApiError(error);
      setErrors(apiErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[840px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Schedule a meeting with {customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <MeetingFormFields
            title={title}
            setTitle={setTitle}
            meetingType={meetingType}
            setMeetingType={setMeetingType}
            priority={priority}
            setPriority={setPriority}
            location={location}
            setLocation={setLocation}
            description={description}
            setDescription={setDescription}
            errors={errors}
            hideLocation={true}
          />
          
          {/* Employee Assignment and Office Location in one row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Assign to Employee <span className="text-red-500">*</span></label>
              <EmployeeCombobox
                users={users}
                value={selectedEmployeeId}
                onChange={setSelectedEmployeeId}
                loading={usersLoading}
                error={errors.selectedEmployeeId}
                showAnyOption={true}
                placeholder="Select an employee..."
                required
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Office Location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger 
                  className={errors.location ? 'border-red-500' : ''} 
                  style={{ paddingLeft: '4px', paddingRight: '4px' }}
                >
                  <SelectValue placeholder="Select office location">
                    {location ? officeLocations.find(loc => loc.id === location)?.display || location : "Select office location"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locationsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading locations...
                    </SelectItem>
                  ) : officeLocations.length === 0 ? (
                    <SelectItem value="no-locations" disabled>
                      No office locations available
                    </SelectItem>
                  ) : (
                    officeLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.display}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
            </div>
          </div>
          
          {/* Date as full width row */}
          <DateTimeSelector
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            endTime={endTime}
            setEndTime={setEndTime}
            errors={errors}
            isDateOnly={true}
            onValidationChange={handleValidationChange}
          />
          
          {/* Start Time and End Time in one row */}
          <DateTimeSelector
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            endTime={endTime}
            setEndTime={setEndTime}
            errors={errors}
            isTimeOnly={true}
            onValidationChange={handleValidationChange}
          />
          {/* Display general errors with enhanced visibility */}
          {errors.general && (
            <Alert
              variant="destructive"
              className="border-red-600 bg-red-50 shadow-md"
            >
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-700">
                {errors.general.includes("weekend") || errors.general.includes("business hours") || errors.general.includes("9:00 AM") ?
                  "Invalid Time Slot" :
                  errors.general.includes("leave") ?
                  "Employee Unavailable" :
                  errors.general.includes("holiday") ?
                  "Holiday Conflict" :
                  errors.general.includes("already has") || errors.general.includes("appointment") ?
                  "Scheduling Conflict" :
                  "Scheduling Error"
                }
              </AlertTitle>
              <AlertDescription className="font-medium text-red-800 mt-1 whitespace-pre-line">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}
          {/* Display customer ID error */}
          {errors.customer_id && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.customer_id}</AlertDescription>
            </Alert>
          )}
          {/* Display start/end datetime errors */}
          {(errors.start_datetime || errors.end_datetime) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errors.start_datetime || errors.end_datetime}
              </AlertDescription>
            </Alert>
          )}
          {/* Availability Check */}
          {loading && (
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <span className="text-sm text-gray-500">
                Checking availability...
              </span>
            </div>
          )}
          {availabilityCheck &&
            date &&
            time &&
            !loading &&
            !availabilityCheck.available && (
              <Alert variant="destructive" className="border-red-600 bg-red-50 shadow-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-red-700">
                  {availabilityCheck.reason.includes("weekend") || availabilityCheck.reason.includes("business hours") || availabilityCheck.reason.includes("9:00 AM") ?
                    "Invalid Time Slot" :
                    availabilityCheck.reason.includes("past") ?
                    "Invalid Date" :
                    availabilityCheck.reason.includes("leave") ?
                    "Employee Unavailable" :
                    availabilityCheck.reason.includes("holiday") ?
                    "Holiday Conflict" :
                    "Scheduling Conflict"
                  }
                </AlertTitle>
                <AlertDescription className="font-medium text-red-800 mt-1 whitespace-pre-line">
                  {availabilityCheck.reason}
                </AlertDescription>
              </Alert>
            )}
            <br />
          <DialogFooter>
            <div className="flex-grow">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
              >
                Reset Form
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                (availabilityCheck && !availabilityCheck.available) ||
                Object.values(errors).some(error => error !== undefined && error !== "")
              }
            >
              {submitting ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
