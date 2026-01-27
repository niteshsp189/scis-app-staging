import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Printer,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfDay,
  addWeeks,
  subWeeks,
  startOfWeek as getStartOfWeek,
  endOfWeek as getEndOfWeek,
} from "date-fns";
import appointmentService, { Appointment } from "@/services/appointmentService";
import { useToast } from "@/hooks/use-toast";
import { ScheduleMeetingWithCustomerDialog } from "@/components/dialogs/ScheduleMeetingWithCustomerDialog";
import { AppointmentDetailsDialog } from "@/components/dialogs/AppointmentDetailsDialog";
import userService from "@/services/userService";
import { usePreferences } from "@/contexts/PreferenceContext";
import { DateInput } from "@/components/ui/date-input";
import { api } from "@/lib/axios";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getAppointmentColorClasses,
  getLeaveColorClasses,
  getHolidayColorClasses,
} from "@/config/calendarColors";

type CalendarView = "month" | "week" | "day";

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

interface LeaveRequest {
  id: string;
  user_id: string;
  manager_id: string;
  start_date: string;
  end_date?: string;
  leave_type: "full_day" | "partial_day";
  start_time?: string;
  end_time?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  user?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  manager?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  priority: string;
  customer?: string;
  location?: string;
  assigned_to?: string;
  status: string;
  displayOrder?: number; // For consistent display ordering: 1=Appointments, 2=Leaves, 3=Holidays
}

export const MainCalendarView = forwardRef<{
  refreshAppointments: () => Promise<void>;
}>((props, ref) => {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [intervalType, setIntervalType] = useState<"hourly" | "5min" | "15min">(
    "hourly",
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);

  // Filter states
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterOfficeLocation, setFilterOfficeLocation] =
    useState<string>("all");
  const [filterAppointmentType, setFilterAppointmentType] =
    useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCreatedBy, setFilterCreatedBy] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [officeLocations, setOfficeLocations] = useState<any[]>([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const { toast } = useToast();
  const { getFilterExpanded, setFilterExpanded } = usePreferences();

  const handleToggleFilters = async () => {
    const newExpanded = !isFiltersExpanded;
    setIsFiltersExpanded(newExpanded);
    try {
      await setFilterExpanded("appointments", newExpanded);
    } catch (error) {
      console.error("Failed to save filter expanded state:", error);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshAppointments: async () => {
      await fetchAppointments();
      await fetchHolidays();
      await fetchLeaves();
    },
  }));

  useEffect(() => {
    fetchAppointments();
    fetchHolidays();
    fetchLeaves();
    loadUsers();
    loadOfficeLocations();
  }, [
    currentDate,
    view,
    filterEmployee,
    filterOfficeLocation,
    filterAppointmentType,
    filterStatus,
    filterCreatedBy,
    filterDateFrom,
    filterDateTo,
  ]);

  // Initialize filters expanded state from user preferences
  useEffect(() => {
    const preferredExpanded = getFilterExpanded("appointments");
    setIsFiltersExpanded(preferredExpanded);
  }, [getFilterExpanded]);

  // Navigate to start date period when date filter is set (only once when filter changes)
  useEffect(() => {
    if (filterDateFrom) {
      try {
        const selectedDate = new Date(filterDateFrom);
        if (!isNaN(selectedDate.getTime())) {
          if (view === "month") {
            // Only navigate if the start date is in a different month than current view
            if (
              selectedDate.getFullYear() !== currentDate.getFullYear() ||
              selectedDate.getMonth() !== currentDate.getMonth()
            ) {
              setCurrentDate(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  1,
                ),
              );
            }
          } else if (view === "week") {
            // Navigate to the week containing the selected date
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
            if (
              weekStart.getTime() !==
              startOfWeek(currentDate, { weekStartsOn: 0 }).getTime()
            ) {
              setCurrentDate(weekStart);
            }
          } else if (view === "day") {
            // Navigate to the selected date
            if (
              selectedDate.getFullYear() !== currentDate.getFullYear() ||
              selectedDate.getMonth() !== currentDate.getMonth() ||
              selectedDate.getDate() !== currentDate.getDate()
            ) {
              setCurrentDate(selectedDate);
            }
          }
        }
      } catch (error) {
        console.warn("Invalid start date format:", filterDateFrom);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDateFrom, view]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Build filters object
      const filters: any = {
        per_page: 100, // Get more results for calendar display
      };

      // Always get all appointments in date range (no user filter here)
      if (filterEmployee !== "all") {
        filters.assigned_to = filterEmployee;
      }

      if (filterCreatedBy !== "all") {
        filters.created_by = filterCreatedBy;
      }

      // Use user-set date filters if provided, otherwise calculate based on current view
      if (filterDateFrom) {
        filters.date_from = filterDateFrom;
      } else {
        // Calculate default date range based on view
        if (view === "month") {
          // Get first day of the visible month grid (may include days from previous month)
          const monthStart = startOfMonth(currentDate);
          const visibleStart = startOfWeek(monthStart, { weekStartsOn: 0 });
          filters.date_from = format(visibleStart, "yyyy-MM-dd");
        } else if (view === "week") {
          const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
          filters.date_from = format(weekStart, "yyyy-MM-dd");
        } else if (view === "day") {
          filters.date_from = format(startOfDay(currentDate), "yyyy-MM-dd");
        }
      }

      if (filterDateTo) {
        filters.date_to = filterDateTo;
      } else {
        // Calculate default end date based on view
        if (view === "month") {
          // Get last day of the visible month grid (may include days from next month)
          const monthEnd = endOfMonth(currentDate);
          const visibleEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
          filters.date_to = format(visibleEnd, "yyyy-MM-dd");
        } else if (view === "week") {
          const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
          filters.date_to = format(weekEnd, "yyyy-MM-dd");
        } else if (view === "day") {
          filters.date_to = format(startOfDay(currentDate), "yyyy-MM-dd");
        }
      }

      if (filterAppointmentType !== "all") {
        filters.type = filterAppointmentType;
      }

      if (filterStatus !== "all") {
        filters.status = filterStatus;
      }

      if (filterOfficeLocation !== "all") {
        filters.location = filterOfficeLocation;
      }

      const response = await appointmentService.getAppointments(filters);
      if (response.success) {
        const appointments = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

        setAppointments(appointments);
      } else {
        setAppointments([]);
        console.warn("Invalid appointments data received:", response);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      setAppointments([]);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await api.get("/holidays");
      if (response.data) {
        setHolidays(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
      setHolidays([]);
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await api.get("/leave-requests");
      if (response.data) {
        const leaves = response.data.data || [];
        setLeaveRequests(leaves);
      }
    } catch (error) {
      console.error("Failed to fetch leave requests:", error);
      setLeaveRequests([]);
    }
  };

  const loadUsers = async () => {
    try {
      const fetchedUsers = await userService.getUsers({ active: true });
      if (Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadOfficeLocations = async () => {
    try {
      const response = await fetch("/api/office-locations/options", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setOfficeLocations(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to load office locations:", error);
    }
  };

  const navigatePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const clearAllFilters = () => {
    setFilterEmployee("all");
    setFilterOfficeLocation("all");
    setFilterAppointmentType("all");
    setFilterStatus("all");
    setFilterCreatedBy("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setCurrentDate(new Date()); // Reset calendar to current month
  };

  const handleDateClick = (date: Date, hour?: number, minute?: number) => {
    // Create a new Date object to avoid mutating the original date
    const selectedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    // Set the hour and minute if provided
    if (hour !== undefined) {
      selectedDateTime.setHours(hour, minute || 0, 0, 0);
    }

    setSelectedDate(selectedDateTime);
    setShowScheduleDialog(true);
  };
  const handleAppointmentClick = (
    event: React.MouseEvent,
    appointment: Appointment,
  ) => {
    event.stopPropagation();
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handleSchedulingComplete = () => {
    fetchAppointments();
    fetchHolidays();
    fetchLeaves();
    setShowScheduleDialog(false);
    setSelectedDate(null);
  };

  const handleAppointmentUpdated = () => {
    fetchAppointments();
    fetchHolidays();
    fetchLeaves();
    setShowAppointmentDetails(false);
    setSelectedAppointment(null);
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    // Add appointments FIRST (Priority 1)
    if (Array.isArray(appointments)) {
      const appointmentEvents = appointments
        .filter((apt) => {
          if (!apt || !apt.start_datetime) return false;
          try {
            const aptDate = parseISO(apt.start_datetime);
            return isSameDay(aptDate, date);
          } catch (error) {
            console.warn(
              "Invalid date format for appointment:",
              apt.start_datetime,
            );
            return false;
          }
        })
        .map((apt) => {
          try {
            // Fix event title: use appointment type label and assigned user if available
            const appointmentTypeLabel =
              appointmentService.getAppointmentTypeLabel(apt.appointment_type);
            const assignedUserName = apt.assigned_user
              ? `${apt.assigned_user.first_name} ${apt.assigned_user.last_name}`
              : "";
            const displayTitle = `${appointmentTypeLabel}${assignedUserName ? " - " + assignedUserName : ""}`;
            return {
              id: apt.id,
              title: displayTitle,
              start: parseISO(apt.start_datetime),
              end: parseISO(apt.end_datetime),
              type: apt.appointment_type,
              priority: apt.priority,
              customer: apt.customer
                ? `${apt.customer.first_name || ""} ${apt.customer.last_name || ""}`.trim()
                : "",
              location: apt.location,
              assigned_to: assignedUserName,
              status: apt.status,
              displayOrder: 1, // Appointments display first
            };
          } catch (error) {
            console.warn("Error processing appointment:", apt, error);
            return null;
          }
        })
        .filter(Boolean) as CalendarEvent[];

      events.push(...appointmentEvents);
    }

    // Add leave requests SECOND (Priority 2)
    // In week/day views with employee filter, leaves are shown via custom display
    if (Array.isArray(leaveRequests)) {
      const leaveEvents = leaveRequests
        .filter((leave) => {
          if (!leave || !leave.start_date) return false;

          // Filter by employee if a specific employee is selected
          if (filterEmployee !== "all" && leave.user_id !== filterEmployee) {
            return false;
          }

          try {
            const leaveStartDate = new Date(leave.start_date);
            const leaveEndDate = leave.end_date
              ? new Date(leave.end_date)
              : leaveStartDate;

            // Check if the date falls within the leave period (inclusive)
            // For single day leaves, check if it's the same day
            // For multi-day leaves, check if the date is between start and end (inclusive)
            if (!leave.end_date || leave.start_date === leave.end_date) {
              // Single day leave
              return isSameDay(leaveStartDate, date);
            } else {
              // Multi-day leave - check if date is within range (inclusive)
              return (
                isSameDay(date, leaveStartDate) ||
                isSameDay(date, leaveEndDate) ||
                (date > leaveStartDate && date < leaveEndDate)
              );
            }
          } catch (error) {
            console.warn(
              "Invalid date format for leave request:",
              leave.start_date,
            );
            return false;
          }
        })
        .map((leave) => {
          try {
            const leaveStartDate = new Date(leave.start_date);
            const leaveEndDate = leave.end_date
              ? new Date(leave.end_date)
              : leaveStartDate;
            const employeeName =
              leave.user?.name ||
              `${leave.user?.first_name || ""} ${leave.user?.last_name || ""}`.trim() ||
              "Unknown Employee";

            return {
              id: `leave-${leave.id}`,
              title: `${employeeName} - ${leave.leave_type === "full_day" ? "Full Day" : "Partial Day"}`,
              start: leaveStartDate,
              end: leaveEndDate,
              type: `leave-confirmed`,
              priority: "normal",
              customer: leave.reason || "",
              location: "",
              assigned_to: employeeName,
              status: "confirmed",
              displayOrder: 2, // Leaves display second
            };
          } catch (error) {
            console.warn("Error processing leave request:", leave, error);
            return null;
          }
        })
        .filter(Boolean) as CalendarEvent[];

      events.push(...leaveEvents);
    }

    // Add holidays LAST (Priority 3)
    if (Array.isArray(holidays)) {
      const holidayEvents = holidays
        .filter((holiday) => {
          if (!holiday || !holiday.date || !holiday.is_active) return false;
          try {
            // Parse holiday date in local timezone
            const datePart = holiday.date.split("T")[0];
            const [year, month, day] = datePart.split("-").map(Number);
            const holidayDate = new Date(year, month - 1, day);
            const checkDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            );
            return holidayDate.getTime() === checkDate.getTime();
          } catch (error) {
            console.warn(
              "Invalid date format for holiday:",
              holiday.date,
              error,
            );
            return false;
          }
        })
        .map((holiday) => {
          try {
            // Parse holiday date in local timezone
            const datePart = holiday.date.split("T")[0];
            const [year, month, day] = datePart.split("-").map(Number);
            const holidayDate = new Date(year, month - 1, day);
            return {
              id: `holiday-${holiday.id}`,
              title: holiday.name,
              start: holidayDate,
              end: holidayDate,
              type: `holiday-${holiday.type}`,
              priority: "normal",
              customer: holiday.description || "",
              location: "",
              assigned_to: "",
              status: "active",
              displayOrder: 3, // Holidays display last
            };
          } catch (error) {
            console.warn("Error processing holiday:", holiday, error);
            return null;
          }
        })
        .filter(Boolean) as CalendarEvent[];

      events.push(...holidayEvents);
    }

    // Sort events by display order to ensure consistent ordering
    // Appointments (1) → Leaves (2) → Holidays (3)
    return events.sort((a, b) => {
      const orderA = (a as any).displayOrder || 999;
      const orderB = (b as any).displayOrder || 999;
      return orderA - orderB;
    });
  };

  const getViewTitle = () => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    } else if (view === "week") {
      const startWeek = getStartOfWeek(currentDate, { weekStartsOn: 0 });
      const endWeek = getEndOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(startWeek, "MMM dd")} - ${format(endWeek, "MMM dd, yyyy")}`;
    } else {
      return format(currentDate, "EEEE, MMMM dd, yyyy");
    }
  };

  // Helper functions to check for leave requests
  const hasFullDayLeaveForEmployee = (
    date: Date,
    employeeId?: string,
  ): boolean => {
    if (!employeeId || employeeId === "all") return false;

    return leaveRequests.some((leave) => {
      // Only consider full-day leaves
      if (leave.leave_type !== "full_day") return false;

      // Parse dates without timezone issues
      const leaveStartStr = leave.start_date.split("T")[0];
      const leaveEndStr = leave.end_date
        ? leave.end_date.split("T")[0]
        : leaveStartStr;
      const checkDateStr = format(date, "yyyy-MM-dd");

      // Check if the date falls within the leave period (inclusive)
      const isWithinLeavePeriod =
        checkDateStr >= leaveStartStr && checkDateStr <= leaveEndStr;

      // Check if the leave is for the filtered employee
      const isForEmployee = leave.user_id === employeeId;

      // All leaves are auto-confirmed now, no status check needed
      return isWithinLeavePeriod && isForEmployee;
    });
  };

  const hasLeaveRequestsForEmployee = (date: Date, employeeId?: string) => {
    if (!employeeId || employeeId === "all") return false;

    return leaveRequests.some((leave) => {
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);
      const checkDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );

      // Check if the date falls within the leave period
      const isWithinLeavePeriod =
        checkDate >= leaveStart && checkDate <= leaveEnd;

      // Check if the leave is for the filtered employee
      const isForEmployee = leave.user_id === employeeId;

      // All leaves are auto-confirmed now, no status check needed
      return isWithinLeavePeriod && isForEmployee;
    });
  };

  const hasLeaveRequestsForEmployeeAtTime = (
    date: Date,
    hour: number,
    employeeId?: string,
  ) => {
    if (!employeeId || employeeId === "all") return false;

    return leaveRequests.some((leave) => {
      const leaveStart = new Date(leave.start_date + "T00:00:00");
      const leaveEnd = leave.end_date
        ? new Date(leave.end_date + "T00:00:00")
        : leaveStart;
      const checkDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
      );

      // Check if the date falls within the leave period (inclusive)
      const isWithinLeavePeriod =
        checkDate.getTime() >= leaveStart.getTime() &&
        checkDate.getTime() <= leaveEnd.getTime();

      // Check if the leave is for the filtered employee
      const isForEmployee = leave.user_id === employeeId;

      // All leaves are auto-confirmed now, no status check needed
      if (!isWithinLeavePeriod || !isForEmployee) return false;

      // For full day leaves, block the entire day
      if (leave.leave_type === "full_day") return true;

      // For partial day leaves, check if the hour falls within the leave time range
      if (leave.start_time && leave.end_time) {
        const leaveStartHour = parseInt(leave.start_time.split(":")[0]);
        const leaveEndHour = parseInt(leave.end_time.split(":")[0]);
        const leaveEndMinute = parseInt(leave.end_time.split(":")[1] || "0");

        // Block hours from start to end (exclusive of end hour)
        // For 9 AM - 12 PM (09:00 - 12:00), block hours 9, 10, 11 only
        if (hour >= leaveStartHour && hour < leaveEndHour) {
          return true;
        }
        // Only block the end hour if end minute is greater than 0
        if (hour === leaveEndHour && leaveEndMinute > 0) {
          return true;
        }
      }

      return false;
    });
  };

  // Get leave request details for a specific hour
  const getLeaveRequestForEmployeeAtTime = (
    date: Date,
    hour: number,
    employeeId?: string,
  ): LeaveRequest | null => {
    const leave = leaveRequests.find((leave) => {
      // If specific employee is filtered, only show their leaves
      if (employeeId && employeeId !== "all" && leave.user_id !== employeeId) {
        return false;
      }

      // Parse dates without timezone issues
      const leaveStartStr = leave.start_date.split("T")[0];
      const leaveEndStr = leave.end_date
        ? leave.end_date.split("T")[0]
        : leaveStartStr;
      const checkDateStr = format(date, "yyyy-MM-dd");

      // Check if the date falls within the leave period (inclusive)
      const isWithinLeavePeriod =
        checkDateStr >= leaveStartStr && checkDateStr <= leaveEndStr;

      // All leaves are auto-confirmed now, no status check needed
      if (!isWithinLeavePeriod) {
        return false;
      }

      // For full day leaves, return true for all hours
      if (leave.leave_type === "full_day") {
        return true;
      }

      // For partial day leaves, check if the hour falls within the leave time range
      if (leave.start_time && leave.end_time) {
        const leaveStartHour = parseInt(leave.start_time.split(":")[0]);
        const leaveEndHour = parseInt(leave.end_time.split(":")[0]);
        const leaveEndMinute = parseInt(leave.end_time.split(":")[1] || "0");

        // Show leave in all hours from start to end (exclusive of end hour)
        // For 9 AM - 12 PM (09:00 - 12:00), show in hours 9, 10, 11 only
        // Do NOT show in hour 12 since the leave ends at 12:00 (not after 12:00)
        if (hour >= leaveStartHour && hour < leaveEndHour) {
          return true;
        }
        // Only include the end hour if end minute is greater than 0
        // This handles cases like 9 AM - 12:30 PM (show in 9, 10, 11, 12)
        if (hour === leaveEndHour && leaveEndMinute > 0) {
          return true;
        }
      }

      return false;
    });

    return leave || null;
  };

  // Get ALL leave requests for a specific hour (supports multiple leaves at same time)
  const getLeaveRequestsForEmployeeAtTime = (
    date: Date,
    hour: number,
    employeeId?: string,
  ): LeaveRequest[] => {
    return leaveRequests.filter((leave) => {
      // If specific employee is filtered, only show their leaves
      if (employeeId && employeeId !== "all" && leave.user_id !== employeeId) {
        return false;
      }

      // Parse dates without timezone issues
      const leaveStartStr = leave.start_date.split("T")[0];
      const leaveEndStr = leave.end_date
        ? leave.end_date.split("T")[0]
        : leaveStartStr;
      const checkDateStr = format(date, "yyyy-MM-dd");

      // Check if the date falls within the leave period (inclusive)
      const isWithinLeavePeriod =
        checkDateStr >= leaveStartStr && checkDateStr <= leaveEndStr;

      // All leaves are auto-confirmed now, no status check needed
      if (!isWithinLeavePeriod) {
        return false;
      }

      // For full day leaves, return true for all hours
      if (leave.leave_type === "full_day") {
        return true;
      }

      // For partial day leaves, check if the hour falls within the leave time range
      if (leave.start_time && leave.end_time) {
        const leaveStartHour = parseInt(leave.start_time.split(":")[0]);
        const leaveEndHour = parseInt(leave.end_time.split(":")[0]);
        const leaveEndMinute = parseInt(leave.end_time.split(":")[1] || "0");

        // Show leave in all hours from start to end (exclusive of end hour)
        // For 9 AM - 12 PM (09:00 - 12:00), show in hours 9, 10, 11 only
        // Do NOT show in hour 12 since the leave ends at 12:00 (not after 12:00)
        if (hour >= leaveStartHour && hour < leaveEndHour) {
          return true;
        }
        // Only include the end hour if end minute is greater than 0
        // This handles cases like 9 AM - 12:30 PM (show in 9, 10, 11, 12)
        if (hour === leaveEndHour && leaveEndMinute > 0) {
          return true;
        }
      }

      return false;
    });
  };

  // Format time from 24-hour format to 12-hour format with AM/PM
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hourStr, minuteStr] = time24.split(":");
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const renderEvents = (
    events: CalendarEvent[],
    hour: number,
    isWeekOrDayView: boolean = false,
  ) => {
    // Note: This function is no longer used for leaves in week/day views
    // Leaves are shown via the detailed leave box directly in the time slot
    return (
      <div
        className={`flex ${isWeekOrDayView ? "flex-col space-y-0.5" : "space-x-1"} h-full ${isWeekOrDayView ? "w-full max-w-full" : "overflow-x-auto"}`}
      >
        {events.map((event) => {
          const isHoliday = event.type.startsWith("holiday-");
          const isLeave = event.type.startsWith("leave-");

          // Get color classes based on event type
          let colorClasses = {
            background: "bg-gray-600",
            text: "text-white",
            hover: "hover:opacity-80",
          };

          if (isHoliday) {
            const holidayType = event.type.replace("holiday-", "");
            colorClasses = getHolidayColorClasses(holidayType);
          } else if (isLeave) {
            // Extract leave type from title or default to full_day
            const leaveType = event.title.includes("Partial Day")
              ? "partial_day"
              : "full_day";
            colorClasses = getLeaveColorClasses(leaveType);
          } else if (event.status === "cancelled") {
            colorClasses = {
              background: "bg-red-600",
              text: "text-white",
              hover: "hover:opacity-80",
              border: "border-red-700",
            };
          } else {
            colorClasses = getAppointmentColorClasses(event.type);
          }

          return (
            <div
              key={event.id}
              className={`px-0.5 py-0.5 rounded text-xs cursor-pointer transition-opacity ${colorClasses.background} ${colorClasses.text} ${colorClasses.hover} ${
                isWeekOrDayView ? "w-full" : ""
              }`}
              style={
                isWeekOrDayView
                  ? {}
                  : {
                      minWidth: "100px",
                      maxWidth: "100px",
                    }
              }
              onClick={(e) => {
                if (!isHoliday && !isLeave) {
                  const appointment = appointments.find(
                    (apt) => apt.id === event.id,
                  );
                  if (appointment) {
                    handleAppointmentClick(e, appointment);
                  }
                }
              }}
            >
              {isHoliday && (
                <div
                  className={`text-[10px] font-bold mb-0.5 px-1 py-0.5 rounded text-center ${colorClasses.badgeBg || "bg-opacity-80 bg-black"}`}
                >
                  HOLIDAY
                </div>
              )}
              {isLeave && (
                <div
                  className={`text-[10px] font-bold mb-0.5 px-1 py-0.5 rounded text-center ${colorClasses.badgeBg || "bg-opacity-80 bg-black"}`}
                >
                  LEAVE
                </div>
              )}
              <div className="font-medium text-[10px] truncate">
                {event.title}
              </div>
              {!isHoliday && !isLeave && (
                <div className="text-[9px] opacity-90 truncate">
                  {event.customer}
                </div>
              )}
              {isHoliday && event.customer && (
                <div className="text-[9px] opacity-90 truncate">
                  {event.customer}
                </div>
              )}
              {isLeave && event.customer && (
                <div className="text-[9px] opacity-90 truncate">
                  {event.customer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        // Capture the current day value for this iteration
        const currentDay = new Date(day);
        const dayEvents = getEventsForDate(currentDay);
        const isCurrentMonth = isSameMonth(currentDay, currentDate);
        const isToday = isSameDay(currentDay, new Date());
        const hasHolidays = dayEvents.some((event) =>
          event.type.startsWith("holiday-"),
        );
        const hasFullDayLeave = hasFullDayLeaveForEmployee(
          currentDay,
          filterEmployee,
        );
        // Only disable click when specific employee is filtered and has leave
        const isDisabledForLeave = filterEmployee !== "all" && hasFullDayLeave;

        days.push(
          <div
            key={currentDay.toString()}
            className={`group min-h-20 md:min-h-32 border-2 border-gray-300 p-1 md:p-2 transition-all duration-200 ${
              hasHolidays || isDisabledForLeave
                ? "cursor-not-allowed bg-red-50 opacity-75"
                : "cursor-pointer hover:bg-blue-50 hover:border-blue-400"
            } ${
              isCurrentMonth ? "bg-white" : "bg-gray-50"
            } ${isToday ? "ring-2 ring-blue-500 border-blue-400" : ""}}`}
            onClick={() =>
              !(hasHolidays || isDisabledForLeave) &&
              handleDateClick(currentDay)
            }
          >
            <div className="flex items-center justify-between mb-0.5 md:mb-1">
              <div
                className={`text-xs md:text-sm font-medium ${
                  isCurrentMonth ? "text-gray-900" : "text-gray-400"
                } ${isToday ? "text-blue-600" : ""}`}
              >
                {format(currentDay, "d")}
                {dayEvents.length > 3 && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({dayEvents.length} items)
                  </span>
                )}
              </div>
              <Plus
                className={`h-4 w-4 transition-opacity ${
                  hasHolidays || isDisabledForLeave
                    ? "opacity-20 cursor-not-allowed"
                    : "group-hover:opacity-100 opacity-30 hover:text-blue-600"
                } ${isCurrentMonth ? "text-gray-400" : "text-gray-300"}`}
                onClick={(e) => {
                  if (!(hasHolidays || isDisabledForLeave)) {
                    e.stopPropagation();
                    handleDateClick(currentDay);
                  }
                }}
              />
            </div>
            <div className="space-y-0.5 md:space-y-1 max-h-12 md:max-h-20 overflow-y-auto">
              {dayEvents
                .slice(0, isMobile ? 2 : dayEvents.length)
                .map((event) => {
                  const isHoliday = event.type.startsWith("holiday-");
                  const isLeave = event.type.startsWith("leave-");

                  // Get color classes based on event type
                  let colorClasses = {
                    background: "bg-gray-600",
                    text: "text-white",
                    hover: "hover:opacity-80",
                  };

                  if (isHoliday) {
                    const holidayType = event.type.replace("holiday-", "");
                    colorClasses = getHolidayColorClasses(holidayType);
                  } else if (isLeave) {
                    const leaveType = event.title.includes("Partial Day")
                      ? "partial_day"
                      : "full_day";
                    colorClasses = getLeaveColorClasses(leaveType);
                  } else if (event.status === "cancelled") {
                    colorClasses = {
                      background: "bg-red-600",
                      text: "text-white",
                      hover: "hover:opacity-80",
                      border: "border-red-700",
                    };
                  } else {
                    colorClasses = getAppointmentColorClasses(event.type);
                  }

                  return (
                    <div
                      key={event.id}
                      className={`text-[10px] md:text-xs p-0.5 md:p-1 rounded text-ellipsis overflow-hidden cursor-pointer transition-opacity ${colorClasses.background} ${colorClasses.text} ${colorClasses.hover}`}
                      title={
                        isHoliday
                          ? `${event.title}${event.customer ? " - " + event.customer : ""}`
                          : isLeave
                            ? `${event.title} - ${event.customer}`
                            : `${event.title} - ${event.customer}`
                      }
                      onClick={(e) => {
                        if (!isHoliday && !isLeave) {
                          const appointment = appointments.find(
                            (apt) => apt.id === event.id,
                          );
                          if (appointment) {
                            handleAppointmentClick(e, appointment);
                          }
                        }
                      }}
                    >
                      {isHoliday && (
                        <div
                          className={`text-xs font-bold mb-1 px-1 py-0.5 rounded text-center ${colorClasses.badgeBg || "bg-opacity-80 bg-black"}`}
                        >
                          HOLIDAY
                        </div>
                      )}
                      {isLeave && (
                        <div
                          className={`text-xs font-bold mb-1 px-1 py-0.5 rounded text-center ${colorClasses.badgeBg || "bg-opacity-80 bg-black"}`}
                        >
                          LEAVE
                        </div>
                      )}
                      {isHoliday
                        ? event.title
                        : isLeave
                          ? event.title
                          : `${new Date(event.start).toLocaleTimeString("en-US", { timeZone: "UTC", hour12: true, hour: "numeric", minute: "2-digit" })} ${event.title}`}
                    </div>
                  );
                })}
            </div>
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div
          key={day.toString()}
          className="grid grid-cols-7 divide-x-2 divide-gray-300"
        >
          {days}
        </div>,
      );
      days = [];
    }

    return (
      <div className="bg-white rounded-lg border-2 border-gray-300 shadow-sm">
        <div className="grid grid-cols-7 border-b-2 border-gray-300 bg-gray-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 md:p-4 text-center font-medium text-xs md:text-sm text-gray-700 border-r-2 border-gray-300 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="divide-y-2 divide-gray-300">{rows}</div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startWeek = getStartOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));

    // Generate time slots based on interval type
    const getTimeSlots = () => {
      if (intervalType === "5min") {
        return Array.from({ length: 24 * 12 }, (_, i) => ({
          hour: Math.floor(i / 12),
          minute: (i % 12) * 5,
        }));
      } else if (intervalType === "15min") {
        return Array.from({ length: 24 * 4 }, (_, i) => ({
          hour: Math.floor(i / 4),
          minute: (i % 4) * 15,
        }));
      } else {
        return Array.from({ length: 24 }, (_, i) => ({ hour: i, minute: 0 }));
      }
    };

    const timeSlots = getTimeSlots();
    const isMinuteView = intervalType !== "hourly";

    return (
      <div className="bg-white rounded-lg border overflow-x-auto">
        <div
          className="grid gap-0 border-b min-w-[640px]"
          style={{ gridTemplateColumns: `100px repeat(7, 1fr)` }}
        >
          <div className="p-2 md:p-4 border-r"></div>
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            const dayEvents = getEventsForDate(day);
            const hasHolidays = dayEvents.some((event) =>
              event.type.startsWith("holiday-"),
            );
            const hasFullDayLeave = hasFullDayLeaveForEmployee(
              day,
              filterEmployee,
            );
            // Only disable click when specific employee is filtered and has leave
            const isDisabledForLeave =
              filterEmployee !== "all" && hasFullDayLeave;
            return (
              <div
                key={day.toString()}
                className={`p-2 md:p-4 text-center border-r last:border-r-0 ${
                  hasHolidays
                    ? "cursor-not-allowed bg-red-50"
                    : isDisabledForLeave
                      ? "cursor-not-allowed bg-red-50 opacity-75"
                      : "cursor-pointer hover:bg-gray-50"
                } ${isToday && !hasHolidays ? "bg-blue-50" : ""}`}
                onClick={() =>
                  !(hasHolidays || isDisabledForLeave) && handleDateClick(day)
                }
              >
                <div
                  className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-gray-500"}`}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-lg font-bold ${isToday ? "text-blue-600" : "text-gray-900"}`}
                >
                  {format(day, "dd")}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="grid gap-0 min-w-[640px]"
          style={{ gridTemplateColumns: `100px repeat(7, 1fr)` }}
        >
          <div
            className={`border-r ${isMinuteView ? "space-y-0" : "space-y-4"}`}
          >
            {timeSlots.map((slot, idx) => {
              const cellHeight = isMinuteView ? "h-16 md:h-20" : "h-12 md:h-16";
              const isHourMark = slot.minute === 0;
              const displayTime = `${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}`;

              return (
                <div
                  key={idx}
                  className={`${cellHeight} p-1 border-b text-[9px] text-gray-500 text-right flex items-center justify-end ${
                    !isHourMark ? "text-opacity-40" : ""
                  }`}
                  title={displayTime}
                >
                  {isHourMark ? (
                    <span className="text-[8px] md:text-[9px]">
                      {slot.hour === 0
                        ? "12 AM"
                        : slot.hour < 12
                          ? `${slot.hour} AM`
                          : slot.hour === 12
                            ? "12 PM"
                            : `${slot.hour - 12} PM`}
                    </span>
                  ) : (
                    <span className="text-[7px]">
                      {String(slot.minute).padStart(2, "0")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {days.map((day) => (
            <div
              key={day.toString()}
              className={`border-l min-w-0 ${isMinuteView ? "space-y-0" : "space-y-4"}`}
            >
              {timeSlots.map((slot, idx) => {
                const leaveRequestsAtTime = getLeaveRequestsForEmployeeAtTime(
                  day,
                  slot.hour,
                  filterEmployee,
                );
                const hasFullDayLeave = hasFullDayLeaveForEmployee(
                  day,
                  filterEmployee,
                );

                // Show leave info logic:
                // - For FULL DAY leaves: ONLY show in 12 AM slot (first cell)
                // - For PARTIAL DAY leaves: ONLY show in their actual time slots (not in 12 AM)
                const leavesToShow = leaveRequestsAtTime.filter(
                  (leave) =>
                    (leave.leave_type === "full_day" && slot.hour === 0) ||
                    (leave.leave_type === "partial_day" && slot.hour !== 0),
                );
                const shouldShowLeaveInfo = leavesToShow.length > 0;

                // Filter events for this time slot and sort by display order
                const slotEvents = getEventsForDate(day)
                  .filter((event) => {
                    // If showing custom leave display, exclude leave events from normal rendering
                    if (
                      leaveRequestsAtTime.length > 0 &&
                      event.type.startsWith("leave-")
                    ) {
                      return false;
                    }

                    // For partial day leaves: don't show in 12 AM slot
                    // For full day leaves: only show in 12 AM slot
                    if (event.type.startsWith("leave-")) {
                      const isFullDayLeave = event.title.includes("Full Day");
                      if (isFullDayLeave) {
                        return slot.hour === 0;
                      } else {
                        return slot.hour !== 0;
                      }
                    }

                    // Holidays and all-day events: ONLY show in 12 AM slot
                    if (event.type.startsWith("holiday-")) {
                      return slot.hour === 0;
                    }

                    // Regular appointments - filter by time slot
                    if (intervalType === "5min") {
                      const eventHour = event.start.getUTCHours();
                      const eventMinute = event.start.getUTCMinutes();
                      return (
                        eventHour === slot.hour &&
                        eventMinute >= slot.minute &&
                        eventMinute < slot.minute + 5
                      );
                    } else if (intervalType === "15min") {
                      const eventHour = event.start.getUTCHours();
                      const eventMinute = event.start.getUTCMinutes();
                      return (
                        eventHour === slot.hour &&
                        eventMinute >= slot.minute &&
                        eventMinute < slot.minute + 15
                      );
                    } else {
                      return event.start.getUTCHours() === slot.hour;
                    }
                  })
                  .sort((a, b) => {
                    // Maintain display order: appointments → leaves → holidays
                    const orderA = a.displayOrder || 999;
                    const orderB = b.displayOrder || 999;
                    return orderA - orderB;
                  });

                // Check if there are holidays on this day
                const dayHasHolidays = getEventsForDate(day).some((event) =>
                  event.type.startsWith("holiday-"),
                );
                const hasLeaveRequests = hasLeaveRequestsForEmployeeAtTime(
                  day,
                  slot.hour,
                  filterEmployee,
                );
                const hasAppointments =
                  slotEvents.length > 0 &&
                  slotEvents.some(
                    (e) =>
                      !e.type.startsWith("leave-") &&
                      !e.type.startsWith("holiday-"),
                  );
                const shouldShowLeaveDetails =
                  shouldShowLeaveInfo || hasLeaveRequests;
                const shouldShowAppointmentDetails = hasAppointments;
                // Only disable click when specific employee is filtered and has leave
                const isDisabledForLeave =
                  filterEmployee !== "all" &&
                  (hasFullDayLeave ||
                    hasLeaveRequests ||
                    leaveRequestsAtTime.length > 0);
                const cellHeight = isMinuteView
                  ? "h-16 md:h-20"
                  : "h-12 md:h-16";
                const displayTime12hr = `${slot.hour === 0 ? "12" : slot.hour > 12 ? slot.hour - 12 : slot.hour}:${String(slot.minute).padStart(2, "0")}${slot.hour >= 12 ? "PM" : "AM"}`;

                return (
                  <div
                    key={idx}
                    className={`${cellHeight} border-b p-0.5 md:p-1 relative text-[10px] md:text-xs ${
                      dayHasHolidays
                        ? "cursor-not-allowed bg-red-50"
                        : isDisabledForLeave
                          ? "cursor-not-allowed bg-red-50 opacity-75"
                          : "cursor-pointer hover:bg-blue-50"
                    } transition-colors ${
                      shouldShowLeaveInfo ||
                      (slot.hour === 0 && slotEvents.length > 0)
                        ? "flex items-stretch overflow-hidden"
                        : "flex items-center justify-center overflow-hidden"
                    } group`}
                    onClick={() =>
                      !(dayHasHolidays || isDisabledForLeave) &&
                      handleDateClick(day, slot.hour, slot.minute)
                    }
                    title={displayTime12hr}
                  >
                    {isMinuteView &&
                      !slotEvents.some(
                        (e) =>
                          !e.type.startsWith("leave-") &&
                          !e.type.startsWith("holiday-"),
                      ) &&
                      !shouldShowLeaveInfo && (
                        <span className="absolute inset-0 flex items-center justify-center text-[7px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
                          {displayTime12hr}
                        </span>
                      )}
                    {shouldShowLeaveInfo &&
                    slot.hour === 0 &&
                    slotEvents.length > 0 ? (
                      // Show both holidays/other events AND full-day leaves in 12 AM slot
                      <div className="w-full max-w-full h-full flex flex-col space-y-0.5 overflow-y-auto overflow-x-hidden p-0.5">
                        {renderEvents(slotEvents, slot.hour, true)}
                        {leavesToShow.map((leaveRequest) => {
                          const leaveColors =
                            leaveRequest?.leave_type === "partial_day"
                              ? getLeaveColorClasses("partial_day")
                              : getLeaveColorClasses("full_day");
                          return (
                            <div
                              key={`leave-${leaveRequest.id}`}
                              className={`w-full max-w-full rounded text-xs flex flex-col ${leaveColors.background} ${leaveColors.text} p-1`}
                            >
                              <div
                                className={`text-[10px] font-bold mb-0.5 px-1 py-0.5 rounded text-center flex-shrink-0 ${leaveColors.badgeBg || "bg-opacity-80 bg-black"}`}
                              >
                                LEAVE
                              </div>
                              <div className="text-[10px] font-semibold truncate flex-shrink-0">
                                {leaveRequest?.user?.name ||
                                  `${leaveRequest?.user?.first_name || ""} ${leaveRequest?.user?.last_name || ""}`.trim()}
                              </div>
                              <div className="text-[8px] opacity-90 truncate flex-shrink-0">
                                Mgr:{" "}
                                {leaveRequest?.manager?.name ||
                                  `${leaveRequest?.manager?.first_name || ""} ${leaveRequest?.manager?.last_name || ""}`.trim()}
                              </div>
                              <div className="text-[8px] opacity-90 flex-shrink-0">
                                Full Day
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : shouldShowLeaveInfo ? (
                      // Show all leave requests in their respective time slots
                      <div className="w-full h-full flex flex-col space-y-0.5 overflow-y-auto overflow-x-hidden p-0.5">
                        {leavesToShow.map((leaveRequest) => {
                          const leaveColors =
                            leaveRequest?.leave_type === "partial_day"
                              ? getLeaveColorClasses("partial_day")
                              : getLeaveColorClasses("full_day");
                          return (
                            <div
                              key={`leave-${leaveRequest.id}`}
                              className={`w-full rounded text-xs flex flex-col overflow-hidden ${leaveColors.background} ${leaveColors.text}`}
                            >
                              <div className="px-1 py-1 flex flex-col h-full overflow-y-auto">
                                <div
                                  className={`text-[10px] font-bold mb-1 px-1 py-0.5 rounded text-center flex-shrink-0 ${leaveColors.badgeBg || "bg-opacity-80 bg-black"}`}
                                >
                                  LEAVE
                                </div>
                                <div className="text-[10px] font-semibold truncate mb-0.5 flex-shrink-0">
                                  {leaveRequest?.user?.name ||
                                    `${leaveRequest?.user?.first_name || ""} ${leaveRequest?.user?.last_name || ""}`.trim()}
                                </div>
                                <div className="text-[9px] opacity-95 truncate mb-0.5 flex-shrink-0">
                                  Manager:{" "}
                                  {leaveRequest?.manager?.name ||
                                    `${leaveRequest?.manager?.first_name || ""} ${leaveRequest?.manager?.last_name || ""}`.trim()}
                                </div>
                                {leaveRequest?.leave_type === "partial_day" &&
                                leaveRequest?.start_time &&
                                leaveRequest?.end_time ? (
                                  <div className="text-[9px] opacity-95 mb-0.5 flex-shrink-0">
                                    Partial Day (
                                    {formatTime12Hour(leaveRequest.start_time)}{" "}
                                    - {formatTime12Hour(leaveRequest.end_time)})
                                  </div>
                                ) : (
                                  <div className="text-[9px] opacity-95 mb-0.5 flex-shrink-0">
                                    Full Day
                                  </div>
                                )}
                                {leaveRequest?.reason && (
                                  <div
                                    className="text-[8px] opacity-90 break-words"
                                    title={leaveRequest.reason}
                                  >
                                    {leaveRequest.reason}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : slotEvents.length > 0 ? (
                      renderEvents(slotEvents, slot.hour, true)
                    ) : isMinuteView ? (
                      <span className="text-gray-300 text-[7px]">—</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    // Generate time slots based on interval type
    const getTimeSlots = () => {
      if (intervalType === "5min") {
        return Array.from({ length: 24 * 12 }, (_, i) => ({
          hour: Math.floor(i / 12),
          minute: (i % 12) * 5,
        }));
      } else if (intervalType === "15min") {
        return Array.from({ length: 24 * 4 }, (_, i) => ({
          hour: Math.floor(i / 4),
          minute: (i % 4) * 15,
        }));
      } else {
        return Array.from({ length: 24 }, (_, i) => ({ hour: i, minute: 0 }));
      }
    };

    const timeSlots = getTimeSlots();
    const dayEvents = getEventsForDate(currentDate);
    const isMinuteView = intervalType !== "hourly";

    return (
      <div className="bg-white rounded-lg border">
        <div className="p-3 md:p-4 border-b text-center">
          <div className="text-base md:text-lg font-bold">
            {format(currentDate, "EEEE")}
          </div>
          <div className="text-xl md:text-2xl font-bold text-blue-600">
            {format(currentDate, "dd")}
          </div>
          <div className="text-xs md:text-sm text-gray-500">
            {format(currentDate, "MMMM yyyy")}
          </div>
        </div>

        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: isMinuteView ? "80px 1fr" : "60px 1fr",
          }}
        >
          <div
            className={`border-r ${isMinuteView ? "space-y-0" : "space-y-4"}`}
          >
            {timeSlots.map((slot, idx) => {
              const cellHeight = isMinuteView ? "h-16 md:h-20" : "h-12 md:h-16";
              const isHourMark = slot.minute === 0;
              const displayTime = `${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}`;

              return (
                <div
                  key={idx}
                  className={`${cellHeight} p-1 border-b text-[9px] text-gray-500 text-right flex items-center justify-end ${
                    !isHourMark ? "text-opacity-40" : ""
                  }`}
                  title={displayTime}
                >
                  {isHourMark ? (
                    <span className="text-[8px] md:text-[9px]">
                      {slot.hour === 0
                        ? "12 AM"
                        : slot.hour < 12
                          ? `${slot.hour} AM`
                          : slot.hour === 12
                            ? "12 PM"
                            : `${slot.hour - 12} PM`}
                    </span>
                  ) : (
                    <span className="text-[7px]">
                      {String(slot.minute).padStart(2, "0")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div
            className={`border-l ${isMinuteView ? "space-y-0" : "space-y-4"}`}
          >
            {timeSlots.map((slot, idx) => {
              const leaveRequestsAtTime = getLeaveRequestsForEmployeeAtTime(
                currentDate,
                slot.hour,
                filterEmployee,
              );
              const hasFullDayLeave = hasFullDayLeaveForEmployee(
                currentDate,
                filterEmployee,
              );

              // Show leave info logic:
              // - For FULL DAY leaves: ONLY show in 12 AM slot (first cell)
              // - For PARTIAL DAY leaves: ONLY show in their actual time slots (not in 12 AM)
              const leavesToShow = leaveRequestsAtTime.filter(
                (leave) =>
                  (leave.leave_type === "full_day" && slot.hour === 0) ||
                  (leave.leave_type === "partial_day" && slot.hour !== 0),
              );
              const shouldShowLeaveInfo = leavesToShow.length > 0;

              // Filter events for this time slot and sort by display order
              const slotEvents = dayEvents
                .filter((event) => {
                  // If showing custom leave display, exclude leave events from normal rendering
                  if (
                    leaveRequestsAtTime.length > 0 &&
                    event.type.startsWith("leave-")
                  ) {
                    return false;
                  }

                  // For partial day leaves: don't show in 12 AM slot
                  // For full day leaves: only show in 12 AM slot
                  if (event.type.startsWith("leave-")) {
                    const isFullDayLeave = event.title.includes("Full Day");
                    if (isFullDayLeave) {
                      return slot.hour === 0;
                    } else {
                      return slot.hour !== 0;
                    }
                  }

                  // Holidays and all-day events: ONLY show in 12 AM slot
                  if (event.type.startsWith("holiday-")) {
                    return slot.hour === 0;
                  }

                  // Regular appointments - filter by time slot
                  if (intervalType === "5min") {
                    const eventHour = event.start.getUTCHours();
                    const eventMinute = event.start.getUTCMinutes();
                    return (
                      eventHour === slot.hour &&
                      eventMinute >= slot.minute &&
                      eventMinute < slot.minute + 5
                    );
                  } else if (intervalType === "15min") {
                    const eventHour = event.start.getUTCHours();
                    const eventMinute = event.start.getUTCMinutes();
                    return (
                      eventHour === slot.hour &&
                      eventMinute >= slot.minute &&
                      eventMinute < slot.minute + 15
                    );
                  } else {
                    return event.start.getUTCHours() === slot.hour;
                  }
                })
                .sort((a, b) => {
                  // Maintain display order: appointments → leaves → holidays
                  const orderA = a.displayOrder || 999;
                  const orderB = b.displayOrder || 999;
                  return orderA - orderB;
                });

              // Check if there are holidays on this day
              const dayHasHolidays = dayEvents.some((event) =>
                event.type.startsWith("holiday-"),
              );
              const hasLeaveRequests = hasLeaveRequestsForEmployeeAtTime(
                currentDate,
                slot.hour,
                filterEmployee,
              );
              const hasAppointments =
                slotEvents.length > 0 &&
                slotEvents.some(
                  (e) =>
                    !e.type.startsWith("leave-") &&
                    !e.type.startsWith("holiday-"),
                );
              const shouldShowLeaveDetails =
                shouldShowLeaveInfo || hasLeaveRequests;
              const shouldShowAppointmentDetails = hasAppointments;
              // Only disable click when specific employee is filtered and has leave
              const isDisabledForLeave =
                filterEmployee !== "all" &&
                (hasFullDayLeave ||
                  hasLeaveRequests ||
                  leaveRequestsAtTime.length > 0);
              const cellHeight = isMinuteView ? "h-16 md:h-20" : "h-12 md:h-16";
              const displayTime12hr = `${slot.hour === 0 ? "12" : slot.hour > 12 ? slot.hour - 12 : slot.hour}:${String(slot.minute).padStart(2, "0")}${slot.hour >= 12 ? "PM" : "AM"}`;

              return (
                <div
                  key={idx}
                  className={`${cellHeight} border-b p-0.5 md:p-1 relative text-[10px] md:text-xs ${
                    dayHasHolidays
                      ? "cursor-not-allowed bg-red-50"
                      : isDisabledForLeave
                        ? "cursor-not-allowed bg-red-50 opacity-75"
                        : "cursor-pointer hover:bg-blue-50"
                  } transition-colors ${
                    shouldShowLeaveInfo ||
                    (slot.hour === 0 && slotEvents.length > 0)
                      ? "flex items-stretch overflow-hidden"
                      : "flex items-center justify-center overflow-hidden"
                  } group`}
                  onClick={() =>
                    !(dayHasHolidays || isDisabledForLeave) &&
                    handleDateClick(currentDate, slot.hour, slot.minute)
                  }
                  title={displayTime12hr}
                >
                  {shouldShowLeaveInfo &&
                  slot.hour === 0 &&
                  slotEvents.length > 0 ? (
                    // Show both holidays/other events AND full-day leaves in 12 AM slot
                    <div className="w-full max-w-full h-full flex flex-col space-y-0.5 overflow-y-auto overflow-x-hidden p-0.5">
                      {renderEvents(slotEvents, slot.hour, true)}
                      {leavesToShow.map((leaveRequest) => {
                        const leaveColors =
                          leaveRequest?.leave_type === "partial_day"
                            ? getLeaveColorClasses("partial_day")
                            : getLeaveColorClasses("full_day");
                        return (
                          <div
                            key={`leave-${leaveRequest.id}`}
                            className={`w-full max-w-full rounded text-xs flex flex-col ${leaveColors.background} ${leaveColors.text} p-1`}
                          >
                            <div
                              className={`text-[10px] font-bold mb-0.5 px-1 py-0.5 rounded text-center flex-shrink-0 ${leaveColors.badgeBg || "bg-opacity-80 bg-black"}`}
                            >
                              LEAVE
                            </div>
                            <div className="text-[10px] font-semibold truncate flex-shrink-0">
                              {leaveRequest?.user?.name ||
                                `${leaveRequest?.user?.first_name || ""} ${leaveRequest?.user?.last_name || ""}`.trim()}
                            </div>
                            <div className="text-[8px] opacity-90 truncate flex-shrink-0">
                              Mgr:{" "}
                              {leaveRequest?.manager?.name ||
                                `${leaveRequest?.manager?.first_name || ""} ${leaveRequest?.manager?.last_name || ""}`.trim()}
                            </div>
                            <div className="text-[8px] opacity-90 flex-shrink-0">
                              Full Day
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : shouldShowLeaveInfo ? (
                    // Show all leave requests in their respective time slots
                    <div className="w-full h-full flex flex-col space-y-0.5 overflow-y-auto overflow-x-hidden p-0.5">
                      {leavesToShow.map((leaveRequest) => {
                        const leaveColors =
                          leaveRequest?.leave_type === "partial_day"
                            ? getLeaveColorClasses("partial_day")
                            : getLeaveColorClasses("full_day");
                        return (
                          <div
                            key={`leave-${leaveRequest.id}`}
                            className={`w-full rounded text-xs flex flex-col overflow-hidden ${leaveColors.background} ${leaveColors.text}`}
                          >
                            <div className="px-1 py-1 flex flex-col h-full overflow-y-auto">
                              <div
                                className={`text-[10px] font-bold mb-1 px-1 py-0.5 rounded text-center flex-shrink-0 ${leaveColors.badgeBg || "bg-opacity-80 bg-black"}`}
                              >
                                LEAVE
                              </div>
                              <div className="text-[10px] font-semibold truncate mb-0.5 flex-shrink-0">
                                {leaveRequest?.user?.name ||
                                  `${leaveRequest?.user?.first_name || ""} ${leaveRequest?.user?.last_name || ""}`.trim()}
                              </div>
                              <div className="text-[9px] opacity-95 truncate mb-0.5 flex-shrink-0">
                                Manager:{" "}
                                {leaveRequest?.manager?.name ||
                                  `${leaveRequest?.manager?.first_name || ""} ${leaveRequest?.manager?.last_name || ""}`.trim()}
                              </div>
                              {leaveRequest?.leave_type === "partial_day" &&
                              leaveRequest?.start_time &&
                              leaveRequest?.end_time ? (
                                <div className="text-[9px] opacity-95 mb-0.5 flex-shrink-0">
                                  Partial Day (
                                  {formatTime12Hour(leaveRequest.start_time)} -{" "}
                                  {formatTime12Hour(leaveRequest.end_time)})
                                </div>
                              ) : (
                                <div className="text-[9px] opacity-95 mb-0.5 flex-shrink-0">
                                  Full Day
                                </div>
                              )}
                              {leaveRequest?.reason && (
                                <div
                                  className="text-[8px] opacity-90 break-words"
                                  title={leaveRequest.reason}
                                >
                                  {leaveRequest.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : slotEvents.length > 0 ? (
                    renderEvents(slotEvents, slot.hour, true)
                  ) : isMinuteView ? (
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
                      {displayTime12hr}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors"
            onClick={handleToggleFilters}
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters & Search
            </span>
            <Button variant="ghost" size="sm" className="pointer-events-none">
              {isFiltersExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        {isFiltersExpanded && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {/* Assignee Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Filter by Assignee
                </label>
                <Select
                  value={filterEmployee}
                  onValueChange={setFilterEmployee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Created By Employee Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Filter by Created By
                </label>
                <Select
                  value={filterCreatedBy}
                  onValueChange={setFilterCreatedBy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Office Location Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Filter by Office Location
                </label>
                <Select
                  value={filterOfficeLocation}
                  onValueChange={setFilterOfficeLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {officeLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Appointment Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Filter by Appointment Type
                </label>
                <Select
                  value={filterAppointmentType}
                  onValueChange={setFilterAppointmentType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="new_client">New Client</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                    <SelectItem value="part_d">Part D</SelectItem>
                    <SelectItem value="rate_increase">Rate Increase</SelectItem>
                    <SelectItem value="under_65">Under 65</SelectItem>
                    <SelectItem value="dental_vision">
                      Dental & Vision
                    </SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="customer_service">
                      Customer Service
                    </SelectItem>
                    <SelectItem value="field_time">Field Time</SelectItem>
                    <SelectItem value="life_insurance">
                      Life Insurance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Filter by Status
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>

                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div>
                <Label
                  htmlFor="date-from"
                  className="text-sm font-medium mb-2 block"
                >
                  From Date
                </Label>
                <DateInput
                  id="date-from"
                  value={filterDateFrom}
                  onChange={setFilterDateFrom}
                  placeholder="Select from date"
                />
              </div>

              {/* Date To Filter */}
              <div>
                <Label
                  htmlFor="date-to"
                  className="text-sm font-medium mb-2 block"
                >
                  To Date
                </Label>
                <DateInput
                  id="date-to"
                  value={filterDateTo}
                  onChange={setFilterDateTo}
                  placeholder="Select to date"
                />
              </div>

              {/* Clear Filters and Print Calendar Buttons */}
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Build query params from current filters
                    const params = new URLSearchParams();
                    params.set("year", String(currentDate.getFullYear()));
                    params.set("month", String(currentDate.getMonth() + 1));
                    if (filterStatus && filterStatus !== "all")
                      params.set("status", filterStatus);
                    if (
                      filterAppointmentType &&
                      filterAppointmentType !== "all"
                    )
                      params.set("type", filterAppointmentType);
                    if (filterEmployee && filterEmployee !== "all") {
                      params.set("assigned_to", filterEmployee);
                      // Find the user name for display
                      const user = users.find((u) => u.id === filterEmployee);
                      if (user) {
                        params.set(
                          "assigned_to_name",
                          `${user.first_name} ${user.last_name}`,
                        );
                      }
                    }
                    if (filterOfficeLocation && filterOfficeLocation !== "all")
                      params.set("location", filterOfficeLocation);

                    const url = `/appointments/print/calendar?${params.toString()}`;
                    window.open(url, "_blank");
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Calendar
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        {/* Title and Navigation */}
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-lg md:text-2xl font-bold">{getViewTitle()}</h2>
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={navigatePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={goToToday}
            >
              {isMobile ? "Today" : "Today"}
            </Button>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={navigateNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Switcher and New Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex rounded-md border flex-1 md:flex-none">
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size={isMobile ? "sm" : "default"}
              onClick={() => setView("month")}
              className="rounded-r-none flex-1 md:flex-none text-xs md:text-sm"
            >
              Month
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size={isMobile ? "sm" : "default"}
              onClick={() => setView("week")}
              className="rounded-none border-x-0 flex-1 md:flex-none text-xs md:text-sm"
            >
              Week
            </Button>
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size={isMobile ? "sm" : "default"}
              onClick={() => setView("day")}
              className="rounded-l-none flex-1 md:flex-none text-xs md:text-sm"
            >
              Day
            </Button>
          </div>

          {/* Minute Interval Toggles */}
          {(view === "week" || view === "day") && filterEmployee !== "all" && (
            <div className="flex rounded-md border gap-0 flex-1 md:flex-none">
              <Button
                variant={intervalType === "hourly" ? "default" : "ghost"}
                size={isMobile ? "sm" : "default"}
                onClick={() => setIntervalType("hourly")}
                className="rounded-r-none flex-1 md:flex-none text-xs md:text-sm border-r"
                title="Show hourly view"
              >
                {isMobile ? "Hourly" : "Hourly"}
              </Button>
              <Button
                variant={intervalType === "5min" ? "default" : "ghost"}
                size={isMobile ? "sm" : "default"}
                onClick={() => setIntervalType("5min")}
                className="rounded-none border-x-0 flex-1 md:flex-none text-xs md:text-sm border-r"
                title="Show 5-minute interval view"
              >
                <Zap className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                {isMobile ? "5min" : "5-Min"}
              </Button>
              <Button
                variant={intervalType === "15min" ? "default" : "ghost"}
                size={isMobile ? "sm" : "default"}
                onClick={() => setIntervalType("15min")}
                className="rounded-l-none flex-1 md:flex-none text-xs md:text-sm"
                title="Show 15-minute interval view"
              >
                <Zap className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                {isMobile ? "15min" : "15-Min"}
              </Button>
            </div>
          )}

          {!isMobile && (
            <Button
              onClick={() => {
                setSelectedDate(null);
                setShowScheduleDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      ) : (
        <>
          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </>
      )}

      <ScheduleMeetingWithCustomerDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onScheduled={handleSchedulingComplete}
        defaultDate={
          selectedDate ||
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate(),
          )
        }
      />

      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        open={showAppointmentDetails}
        onOpenChange={setShowAppointmentDetails}
        onAppointmentUpdated={handleAppointmentUpdated}
        onAppointmentDeleted={handleAppointmentUpdated}
      />
    </div>
  );
});
