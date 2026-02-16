import { useState, useEffect } from "react";
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
import { Edit, Calendar as CalendarLucide, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { MeetingFormFields } from "./meeting/MeetingFormFields";
import { DateTimeSelector } from "./meeting/DateTimeSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import appointmentService, {
  Appointment,
  CreateAppointmentData,
} from "@/services/appointmentService";
import userService from "@/services/userService";
import timezoneService from "@/services/timezoneService";
import { officeLocationService, OfficeLocationOption } from "@/services/officeLocationService";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { useEventDispatcher } from "@/hooks/useEventListener";

interface EditAppointmentDialogProps {
  appointment: Appointment;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAppointmentUpdated?: () => void;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
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

export const EditAppointmentDialog = ({
  appointment,
  trigger,
  open: externalOpen,
  onOpenChange,
  onAppointmentUpdated,
}: EditAppointmentDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  const [title, setTitle] = useState(appointment.title);
  const [description, setDescription] = useState(appointment.description || "");
  const [date, setDate] = useState<Date>(() => {
    const d = new Date(appointment.start_datetime);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  });
  const [time, setTime] = useState(() => {
    const d = new Date(appointment.start_datetime);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date(appointment.end_datetime || appointment.start_datetime);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  });
  
  // Map old appointment types to valid ones and filter out invalid types
  const [meetingType, setMeetingType] = useState<string[]>(() => {
    const validTypes = ['new_client', 'supplement', 'part_d', 'rate_increase', 'under_65', 'dental_vision', 'review', 'customer_service', 'field_time', 'life_insurance'];
    const typeMapping: Record<string, string> = {
      'in_person': 'review',
      'phone': 'review',
      'video': 'review',
      'other': 'review'
    };
    
    if (!appointment.appointment_type) return ['review'];
    
    const types = appointment.appointment_type.split(',').map(t => {
      const trimmed = t.trim();
      // Map old types to new ones
      if (typeMapping[trimmed]) return typeMapping[trimmed];
      // Return if valid, otherwise return 'review'
      return validTypes.includes(trimmed) ? trimmed : 'review';
    });
    
    // Remove duplicates
    return [...new Set(types)];
  });
  
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >(appointment.priority as "low" | "medium" | "high" | "urgent");
  const [location, setLocation] = useState(appointment.office_location_id || "");
  const [status, setStatus] = useState(appointment.status || "scheduled");
  const [cancellationNotes, setCancellationNotes] = useState(appointment.cancellation_notes || "");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    appointment.assigned_to || "any",
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [availabilityCheck, setAvailabilityCheck] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);
  const [alternativeTimes, setAlternativeTimes] = useState<string[]>([]);

  // Store original values for reset functionality
  const [originalValues, setOriginalValues] = useState<{
    title: string;
    description: string;
    date: Date | undefined;
    time: string;
    endTime: string;
    location: string;
    meetingType: string[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    selectedEmployeeId: string;
    status: string;
    cancellationNotes: string;
  } | null>(null);

  // Handle real-time validation changes from DateTimeSelector
  const handleValidationChange = (field: string, error: string | undefined) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Reset form to original values
  const resetToOriginal = () => {
    if (originalValues) {
      setTitle(originalValues.title);
      setDescription(originalValues.description);
      setDate(originalValues.date);
      setTime(originalValues.time);
      setEndTime(originalValues.endTime);
      setLocation(originalValues.location);
      setMeetingType(originalValues.meetingType);
      setPriority(originalValues.priority);
      setSelectedEmployeeId(originalValues.selectedEmployeeId);
      setStatus(originalValues.status);
      setCancellationNotes(originalValues.cancellationNotes);
      setErrors({});
      setAvailabilityCheck(null);
    }
  };

  // Create event dispatchers
  const dispatchAppointmentUpdated = useEventDispatcher("appointmentUpdated");

  // Load users when dialog opens
  // Initialize form values when component mounts or appointment changes
  useEffect(() => {
    if (open) {
      loadUsers();
      loadOfficeLocations();
    }

    // Initialize all form values directly from appointment
    const startDate = new Date(appointment.start_datetime);
    const appointmentDate = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const startTimeFormatted = `${startDate.getUTCHours().toString().padStart(2, '0')}:${startDate.getUTCMinutes().toString().padStart(2, '0')}`;
    const endDate = new Date(appointment.end_datetime || appointment.start_datetime);
    const endTimeFormatted = `${endDate.getUTCHours().toString().padStart(2, '0')}:${endDate.getUTCMinutes().toString().padStart(2, '0')}`;

    // Set all form values directly from appointment
    setTitle(appointment.title);
    setDescription(appointment.description || "");
    setDate(appointmentDate);
    setTime(startTimeFormatted);
    setEndTime(endTimeFormatted);
    setMeetingType(appointment.appointment_type ? appointment.appointment_type.split(',').map(t => t.trim()) : ['review']);

    // Make sure priority is properly set with a fallback
    const priorityValue = appointment.priority || "medium";
    
    setPriority(priorityValue as "low" | "medium" | "high" | "urgent");

    setLocation(appointment.office_location_id || "");
    setStatus(appointment.status || "scheduled");
    setCancellationNotes(appointment.cancellation_notes || "");
    setSelectedEmployeeId(appointment.assigned_to || "any");
        
    // Store original values for reset functionality
    setOriginalValues({
      title: appointment.title || "",
      description: appointment.description || "",
      date: appointmentDate,
      time: startTimeFormatted,
      endTime: endTimeFormatted,
      location: appointment.office_location_id || "",
      meetingType: appointment.appointment_type ? appointment.appointment_type.split(',') : ['review'],
      priority: (appointment.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      selectedEmployeeId: appointment.assigned_to || "any",
      status: appointment.status || "scheduled",
      cancellationNotes: appointment.cancellation_notes || ""
    });
  }, [appointment, open]); // Re-initialize when appointment changes or dialog opens
  
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const fetchedUsers = await userService.getUsers({ active: true });
      if (Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
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
            id: "01981a9c-5d91-7912-8f3e-123456789abc",
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@insurecrm.com",
          },
          {
            id: "01981a9c-5d91-7912-8f3e-987654321def",
            first_name: "Jane",
            last_name: "Smith",
            email: "jane.smith@insurecrm.com",
          },
        ];
        setUsers(fallbackUsers);
      }
    } catch (error: any) {
      console.error("Error loading users:", error);
      
      // If it's not a permission error (which is already handled in the service),
      // show a generic error toast
      const isPermissionError = error.status === 403 || error.response?.status === 403;
      if (!isPermissionError) {
        toast({
          title: "Warning",
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
          id: "01981a9c-5d91-7912-8f3e-123456789abc",
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@insurecrm.com",
        },
        {
          id: "01981a9c-5d91-7912-8f3e-987654321def",
          first_name: "Jane",
          last_name: "Smith",
          email: "jane.smith@insurecrm.com",
        },
      ];
      setUsers(fallbackUsers);
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
      console.error('Failed to load office locations:', error);
      setOfficeLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  };

  // Check availability when date or time changes
  useEffect(() => {
    if (date && time) {
      checkAvailability();
    }
  }, [date, time, endTime]);

  const checkAvailability = async () => {
    if (!date || !time) return;

    // Skip availability check for 'Any' employee
    if (selectedEmployeeId === 'any' || !selectedEmployeeId) {
      setAvailabilityCheck({ available: true });
      return;
    }

    setLoading(true);
    try {
      // Prepare start time
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

      // REMOVED: Past date restriction as per client request to allow any date appointments
      // REMOVED: Weekend and business hours validation as per new requirements

      let mockAvailability = {
        available: true,
        reason: "",
      };

      // Check for real appointment conflicts via API (keeping double booking, leave, holiday checks)
        try {
          // Use timezone service to create proper datetime strings for API
          const startDatetimeISO = await timezoneService.createOrganizationDateTime(startDateTime);
          const endDatetimeISO = await timezoneService.createOrganizationDateTime(endDateTime);
          
          const response = await appointmentService.checkAvailability({
            start_datetime: startDatetimeISO,
            end_datetime: endDatetimeISO,
            assigned_to: selectedEmployeeId === 'any' ? null : selectedEmployeeId,
            customer_id: appointment.customer_id || undefined,
            exclude_id: appointment.id, // Exclude current appointment from conflict check
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
  };

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
  };  const parseApiError = (error: any): ValidationErrors => {
    const apiErrors: ValidationErrors = {};

    // Handle conflict responses (status code 409)
    if (error.response?.status === 409) {
      // Check if there are conflicts in the response
      if (error.response?.data?.conflicts && error.response.data.conflicts.length > 0) {
        const conflicts = error.response.data.conflicts;
        
        // Join all conflicts with bullet points for better readability
        let conflictMessage = conflicts.join('\n• ');
        conflictMessage = '• ' + conflictMessage;

        apiErrors.general = conflictMessage;
        return apiErrors;
      } else if (error.response?.data?.message) {
        // Generic conflict message from backend
        const conflictMessage = error.response.data.message;
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
      if (backendErrors.priority)
        apiErrors.priority = backendErrors.priority[0];
      if (backendErrors.assigned_to)
        apiErrors.selectedEmployeeId = backendErrors.assigned_to[0];
      if (backendErrors.customer_id)
        apiErrors.customer_id = backendErrors.customer_id[0];

      return apiErrors;
    }

    // Fallback to generic error message
    apiErrors.general =
      error.response?.data?.message ||
      "An error occurred while updating the appointment";
    return apiErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Prepare start time
      const startDateTime = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      // Parse end time from user input or default to 1 hour later
      const endDateTime = new Date(date);
      if (endTime && endTime.trim() !== "") {
        // User has manually set an end time
        const [endHours, endMinutes] = endTime.split(":").map(Number);
        endDateTime.setHours(endHours, endMinutes, 0, 0);
      } else {
        // No end time set by user - default to 1 hour after start time
        endDateTime.setHours(startDateTime.getHours() + 1, startDateTime.getMinutes(), 0, 0);
      }

      // Use timezone service to create proper datetime strings for API
      const startDatetimeISO = await timezoneService.createOrganizationDateTime(startDateTime);
      const endDatetimeISO = await timezoneService.createOrganizationDateTime(endDateTime);

      const appointmentData: Partial<CreateAppointmentData> = {
        title,
        description,
        start_datetime: startDatetimeISO,
        end_datetime: endDatetimeISO,
        location: officeLocations.find(loc => loc.id === location)?.name || location,
        office_location_id: location || undefined,
        appointment_type: meetingType.join(','), // Join multiple types with comma
        priority: priority,
        assigned_to: selectedEmployeeId === 'any' ? null : selectedEmployeeId,
        status: status,
        notes: description,
      };

      // Add cancellation notes if status is cancelled
      if (status === 'cancelled' && cancellationNotes.trim()) {
        (appointmentData as any).cancellation_notes = cancellationNotes.trim();
      }

      // Debug appointment data being sent to the server

      const response = await appointmentService.updateAppointment(
        appointment.id,
        appointmentData,
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Appointment updated successfully",
        });

        setOpen(false);

        // Call onAppointmentUpdated callback if provided
        if (onAppointmentUpdated) {
          onAppointmentUpdated();
        }

        // Dispatch event to refresh appointment list
        dispatchAppointmentUpdated(response.data);
      } else {
        // Handle API validation errors
        if (response.conflicts && response.conflicts.length > 0) {
          const conflict = response.conflicts[0];
          const conflictDate = new Date(
            conflict.start_datetime,
          ).toLocaleDateString('en-US', { timeZone: 'UTC' });
          const conflictTime = new Date(
            conflict.start_datetime,
          ).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true });

          setErrors({
            general: `Appointment conflicts with "${conflict.title}" on ${conflictDate} at ${conflictTime}`,
          });

          // Show a detailed toast as well
          toast({
            title: "Scheduling Conflict",
            description: `This time conflicts with "${conflict.title}" on ${conflictDate} at ${conflictTime}`,
            variant: "destructive",
          });
        } else {
          setErrors({
            general: response.message || "Failed to update appointment",
          });
        }
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
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
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Update the details for this appointment
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

          {/* Status Dropdown */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cancellation Notes - Show only when status is cancelled */}
          {status === 'cancelled' && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Cancellation Notes</label>
              <Textarea
                placeholder="Please provide a reason for cancellation..."
                value={cancellationNotes}
                onChange={(e) => setCancellationNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

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
                <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select office location" />
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

          {/* Display general error */}
          {errors.general && (
            <Alert
              variant="destructive"
              className="border-red-600 bg-red-50 shadow-md"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-red-700">
                {errors.general.includes("weekend") || errors.general.includes("business hours") || errors.general.includes("9:00 AM") ?
                  "Invalid Time Slot" :
                  errors.general.includes("leave") ?
                  "Employee Unavailable" :
                  errors.general.includes("holiday") ?
                  "Holiday Conflict" :
                  errors.general.includes("already has") || errors.general.includes("appointment") ?
                  "Scheduling Conflict" :
                  "Update Error"
                }
              </AlertTitle>
              <AlertDescription className="font-medium text-red-800 mt-1 whitespace-pre-line">
                {errors.general}
              </AlertDescription>
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
                {alternativeTimes.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-sm font-medium">
                      Available times for {format(date, "MMM dd, yyyy")}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alternativeTimes.map((altTime) => (
                        <Badge
                          key={altTime}
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => setTime(altTime)}
                        >
                          {altTime}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Alert>
            )}

          <DialogFooter>
            <div className="flex-grow">
              <Button
                type="button"
                variant="secondary"
                onClick={resetToOriginal}
                disabled={!originalValues}
              >
                Reset to Original
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
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
