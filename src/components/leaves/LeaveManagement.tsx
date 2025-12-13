import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import {
  LeaveRequestValidatedInput,
  LeaveRequestValidatedSelect,
} from "./LeaveRequestValidatedInput";
import { LeaveRequestPreview } from "./LeaveRequestPreview";
import { DateInput } from "@/components/ui/date-input";
import { usePreferences } from "@/contexts/PreferenceContext";
import { useIsMobile } from "@/hooks/use-mobile";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Utility function to format time from 24-hour to 12-hour format with AM/PM
const formatTimeTo12Hour = (timeString: string): string => {
  if (!timeString) return "";
  
  // If already in 12-hour format (contains AM/PM), return as is
  if (timeString.includes("AM") || timeString.includes("PM")) {
    return timeString;
  }
  
  // Parse 24-hour format (HH:MM or HH:MM:SS)
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);
  
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
};

// Create a function to generate the form schema based on user role
const createFormSchema = (user: any) => {
  const isSuperAdminOrAdmin = user?.roles?.includes("super_admin") ||
    user?.roles?.includes("admin") ||
    user?.roles?.includes("system_administrator") ||
    user?.roles?.includes("administrator") ||
    user?.roles?.includes("Super Admin") ||
    user?.roles?.includes("Admin");

  return z
    .object({
      user_id: z.string().min(1, "Employee is required"),
      manager_id: z.string().min(1, "Manager is required"),
      start_date: z.string().min(1, "Start date is required"),
      end_date: z.string().optional(),
      leave_type: z.string(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      reason: z.string().min(1, "Reason is required"),
    })
    .refine((data) => {
      // For partial day, validate time constraints
      if (data.leave_type === "partial_day") {
        if (!data.start_time || !data.end_time) {
          return false;
        }

        // Convert time strings to minutes for comparison
        const startTime = data.start_time;
        const endTime = data.end_time;

        // Parse time (assuming format like "09:00 AM" or "14:30")
        const parseTimeToMinutes = (timeStr: string): number => {
          if (timeStr.includes(" ")) {
            // 12-hour format with AM/PM
            const [timePart, modifier] = timeStr.split(" ");
            let [hours, minutes] = timePart.split(":").map(Number);
            if (modifier === "PM" && hours < 12) {
              hours += 12;
            }
            if (modifier === "AM" && hours === 12) {
              hours = 0;
            }
            return hours * 60 + minutes;
          } else {
            // 24-hour format
            const [hours, minutes] = timeStr.split(":").map(Number);
            return hours * 60 + minutes;
          }
        };

        const startMinutes = parseTimeToMinutes(startTime);
        const endMinutes = parseTimeToMinutes(endTime);

        // Calculate the actual time difference, accounting for midnight crossing
        let timeDifference;
        if (endMinutes >= startMinutes) {
          timeDifference = endMinutes - startMinutes;
        } else {
          // Crossed midnight - not allowed for partial day
          return false;
        }

        // Minimum 15 minutes difference
        if (timeDifference < 15) {
          return false;
        }

        // Cannot select 12:00 AM as end time (midnight would be start of next day)
        if (endMinutes === 0) {
          return false;
        }

        return true;
      }
      return true;
    }, {
      message: "For partial day leave: End time must be at least 15 minutes after start time and cannot cross midnight",
      path: ["end_time"],
    });
};const LeaveManagement: React.FC = () => {
  const isMobile = useIsMobile();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"form" | "preview">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { getFilterExpanded, setFilterExpanded } = usePreferences();

  // Filter states
  const [filters, setFilters] = useState({
    employee_id: "all",
    manager_id: "all",
    created_by: "all",
    search: "",
    start_date: "",
    end_date: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const defaultValues = {
    user_id: "",
    manager_id: "",
    start_date: "",
    end_date: "",
    leave_type: "full_day",
    start_time: "",
    end_time: "",
    reason: "",
  };

  // Create form with dynamic schema based on user
  const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
    resolver: zodResolver(createFormSchema(user)),
    defaultValues,
  });

  // Helper function to check if user is admin
  const isUserAdmin = (user: any) => {
    return user?.roles?.includes("super_admin") ||
           user?.roles?.includes("admin") ||
           user?.roles?.includes("system_administrator") ||
           user?.roles?.includes("administrator") ||
           user?.roles?.includes("Super Admin") ||
           user?.roles?.includes("Admin");
  };

  const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit = {},
  ) => {
    const token = authService.getToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: any = new Error(
        `HTTP ${response.status}: ${response.statusText}`,
      );
      try {
        error.response = await response.json();
      } catch (e) {
        // The response might not be a valid JSON
        error.responseText = await response.text();
      }

      if (response.status === 401) {
        authService.clearToken();
        window.location.href = "/login";
      }

      throw error;
    }

    return response;
  };

  const fetchData = async (filterParams?: any, showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      const activeFilters = { ...filters, ...filterParams };

      if (activeFilters.employee_id && activeFilters.employee_id !== "all") {
        queryParams.append("employee_id", activeFilters.employee_id);
      }
      if (activeFilters.manager_id && activeFilters.manager_id !== "all") {
        queryParams.append("manager_id", activeFilters.manager_id);
      }
      if (activeFilters.created_by && activeFilters.created_by !== "all") {
        queryParams.append("created_by", activeFilters.created_by);
      }
      if (activeFilters.search) {
        queryParams.append("search", activeFilters.search);
      }
      if (activeFilters.start_date) {
        queryParams.append("start_date", activeFilters.start_date);
      }
      if (activeFilters.end_date) {
        queryParams.append("end_date", activeFilters.end_date);
      }

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/leave-requests${queryString ? `?${queryString}` : ""}`;

      const leaveResponse = await makeAuthenticatedRequest(url);
      const leaveData = await leaveResponse.json();

      setLeaveRequests(leaveData.data || []);

      if (users.length === 0) {
        const usersResponse = await makeAuthenticatedRequest(
          `${API_BASE_URL}/users`,
        );
        const usersData = await usersResponse.json();
        setUsers(usersData.data || []);
      }
    } catch (err) {
      console.error("❌ ERROR fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(undefined, true);
  }, []);

  // Initialize filters expanded state from user preferences
  useEffect(() => {
    const preferredExpanded = getFilterExpanded('leave_requests');
    setIsFiltersExpanded(preferredExpanded);
  }, [getFilterExpanded]);

  // Handle filters expand/collapse with preference persistence
  const handleToggleFilters = async () => {
    const newExpanded = !isFiltersExpanded;
    setIsFiltersExpanded(newExpanded);
    try {
      await setFilterExpanded('leave_requests', newExpanded);
    } catch (error) {
      console.error('Failed to save filters expanded preference:', error);
    }
  };

  useEffect(() => {
    if (isDialogOpen) {
      // Always reset to form step when dialog opens
      setCurrentStep("form");
      
      try {
        const savedData = localStorage.getItem("leaveRequestFormData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          form.reset(parsedData);
        } else {
          // Auto-select current user as employee if they can't create for others
          const initialValues = { ...defaultValues };
          if (!canCreateForOthers() && user) {
            initialValues.user_id = user.id.toString();
          }
          form.reset(initialValues);
        }
      } catch (error) {
        console.warn("Failed to load saved leave request form data:", error);
        // Auto-select current user as employee if they can't create for others
        const initialValues = { ...defaultValues };
        if (!canCreateForOthers() && user) {
          initialValues.user_id = user.id.toString();
        }
        form.reset(initialValues);
      }
    }
  }, [isDialogOpen, form, user]);

  useEffect(() => {
    if (isDialogOpen) {
      const subscription = form.watch((data) => {
        try {
          localStorage.setItem("leaveRequestFormData", JSON.stringify(data));
        } catch (error) {
          console.warn("Failed to save leave request form data:", error);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [isDialogOpen, form]);

  // Auto-search effect with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        const newFilters = { ...filters, search: searchQuery };
        setFilters(newFilters);
        fetchData(newFilters, false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const to24Hour = (time: string): string => {
    if (!time) return "";
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":");
    let h = parseInt(hours, 10);

    if (modifier === "PM" && h < 12) {
      h += 12;
    }
    if (modifier === "AM" && h === 12) {
      h = 0;
    }

    return `${h.toString().padStart(2, "0")}:${minutes}`;
  };

  const onSubmit = async (values: z.infer<ReturnType<typeof createFormSchema>>) => {
    if (currentStep === "form") {
      // Client-side validation for dates
      if (values.end_date && values.start_date) {
        if (new Date(values.end_date) < new Date(values.start_date)) {
          form.setError("end_date", {
            message: "End date must be after or equal to start date",
          });
          return;
        }
      }

      // Explicit validation for employee/manager same person check (non-admin users only)
      const isAdminUser = isUserAdmin(user);
      if (!isAdminUser && values.user_id && values.manager_id && values.user_id === values.manager_id) {
        form.setError("manager_id", {
          message: "Employee and manager cannot be the same person",
        });
        return;
      }

      // Check if form is valid before proceeding to preview
      const isValid = await form.trigger();
      if (!isValid) {
        return;
      }

      setCurrentStep("preview");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSend = {
        ...values,
        start_time: values.start_time ? to24Hour(values.start_time) : undefined,
        end_time: values.end_time ? to24Hour(values.end_time) : undefined,
      };

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/leave-requests`,
        {
          method: "POST",
          body: JSON.stringify(dataToSend),
        },
      );

      if (response.ok) {
        await fetchData();
        setIsDialogOpen(false);
        form.reset(defaultValues);
        localStorage.removeItem("leaveRequestFormData");
        toast({
          title: "Success",
          description: "Leave request created successfully",
        });
      }
    } catch (err: any) {
      console.error("Error submitting form:", err);

      let errorMessage = "Failed to create leave request";
      if (err.response && err.response.errors) {
        const errors = err.response.errors;
        const firstErrorField = Object.keys(errors)[0];
        if (
          firstErrorField &&
          errors[firstErrorField] &&
          errors[firstErrorField][0]
        ) {
          errorMessage = errors[firstErrorField][0];
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      // Keep dialog open on validation errors instead of showing toast
      if (err.response && err.response.errors) {
        // Stay on current step to show validation errors
        // Don't set global error that hides the component
        return;
      }

      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualReset = () => {
    setCurrentStep("form");
    form.reset(defaultValues);
    localStorage.removeItem("leaveRequestFormData");
    toast({
      title: "Form Reset",
      description: "All form fields have been cleared.",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/leave-requests/${id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        await fetchData(undefined, false);
        toast({
          title: "Success",
          description: "Leave request deleted successfully",
        });
      }
    } catch (err) {
      console.error("Error deleting request:", err);
      setError(err instanceof Error ? err.message : "Failed to delete request");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete leave request",
      });
    }
  };

  const handleSearch = () => {
    // Search is now automatic with debouncing, but keep this for manual trigger if needed
    const newFilters = { ...filters, search: searchQuery };
    setFilters(newFilters);
    fetchData(newFilters, false);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchData(newFilters, false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      employee_id: "all",
      manager_id: "all",
      created_by: "all",
      search: "",
      start_date: "",
      end_date: "",
    };
    setFilters(clearedFilters);
    setSearchQuery(""); // Clear the search query state as well
    fetchData(clearedFilters, false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData(undefined, false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const getCreatedByOptions = () => {
    const createdByUsers = new Set();
    leaveRequests.forEach((request) => {
      if (request.created_by) {
        const creator = users.find(
          (u) => u.id.toString() === request.created_by.toString(),
        );
        if (creator) {
          createdByUsers.add(
            JSON.stringify({
              id: creator.id,
              name:
                creator.name ||
                `${creator.first_name || ""} ${creator.last_name || ""}`.trim(),
            }),
          );
        }
      }
    });
    return Array.from(createdByUsers).map((userStr) =>
      JSON.parse(userStr as string),
    );
  };

  // Helper functions for permission checks
  const canDeleteLeaveRequest = () => {
    if (!user) {
      return false;
    }
    // Check specific permissions using usePermissions hook
    return hasPermission("delete_leave_requests");
  };

  // Helper function to get available managers (excluding selected employee)
  const getAvailableManagers = (selectedEmployeeId: string) => {
    return users.filter((u) => u.id.toString() !== selectedEmployeeId);
  };

  // Helper function to check if user can create requests for others
  const canCreateForOthers = () => {
    if (!user) {
      return false;
    }
    // Check specific permissions using usePermissions hook
    return hasPermission("create_leave_requests");
  };

  // Watch for employee selection changes to update manager options
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "user_id" && value.user_id) {
        // If the selected employee is the same as the current manager, clear the manager
        // Only for non-admin users
        if (!isUserAdmin(user)) {
          const currentManagerId = form.getValues("manager_id");
          if (currentManagerId === value.user_id) {
            form.setValue("manager_id", "");
          }
        }
      }

      // Trigger validation when manager changes
      if (name === "manager_id") {
        setTimeout(() => {
          form.trigger("manager_id");
        }, 0);
      }
      // Trigger validation when user_id changes (to check cross-field validation)
      if (name === "user_id") {
        setTimeout(() => {
          form.trigger();
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, user]);

  // Watch for leave type changes to handle partial day restrictions
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "leave_type") {
        if (value.leave_type === "partial_day") {
          // Clear end_date for partial day (single date functionality)
          form.setValue("end_date", "");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Leave Management</h1>
        <Button onClick={() => setIsDialogOpen(true)} size={isMobile ? "sm" : "default"} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {isMobile ? "Create Request" : "Create Leave Request"}
        </Button>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle
            className="flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors space-y-2 md:space-y-0"
            onClick={handleToggleFilters}
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters & Search
            </span>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] md:text-xs whitespace-nowrap">
                  Total: {leaveRequests.length}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="pointer-events-none self-end md:self-auto">
                {isFiltersExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {isFiltersExpanded && (
          <CardContent>
            {/* Search Row - Full Width */}
            <div className="mb-6">
              <Label htmlFor="search" className="text-sm font-medium">
                Search Leave Requests
              </Label>
              <div className="mt-2">
                <Input
                  id="search"
                  placeholder="Search by employee name, reason, or manager..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Date Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium">
                  Start Date
                </Label>
                <DateInput
                  id="start_date"
                  value={filters.start_date}
                  onChange={(value) => handleFilterChange("start_date", value)}
                  placeholder="Select start date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium">
                  End Date
                </Label>
                <DateInput
                  id="end_date"
                  value={filters.end_date}
                  onChange={(value) => handleFilterChange("end_date", value)}
                  placeholder="Select end date"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Actions</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            </div>

            {/* User Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee" className="text-sm font-medium">
                  Employee
                </Label>
                <Select
                  value={filters.employee_id}
                  onValueChange={(value) => {
                    handleFilterChange("employee_id", value);
                  }}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name ||
                          `${user.first_name || ""} ${user.last_name || ""}`.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager" className="text-sm font-medium">
                  Manager
                </Label>
                <Select
                  value={filters.manager_id}
                  onValueChange={(value) =>
                    handleFilterChange("manager_id", value)
                  }
                >
                  <SelectTrigger id="manager">
                    <SelectValue placeholder="All managers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All managers</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name ||
                          `${user.first_name || ""} ${user.last_name || ""}`.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="createdBy" className="text-sm font-medium">
                  Created By
                </Label>
                <Select
                  value={filters.created_by}
                  onValueChange={(value) =>
                    handleFilterChange("created_by", value)
                  }
                >
                  <SelectTrigger id="createdBy">
                    <SelectValue placeholder="All creators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All creators</SelectItem>
                    {getCreatedByOptions().map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle>
              {currentStep === "form"
                ? "Create Leave Request"
                : "Review Leave Request"}
            </DialogTitle>
            <DialogDescription>
              {currentStep === "form"
                ? "Fill in the details of the leave request."
                : "Please review the information before submitting."}
            </DialogDescription>
            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "form"
                      ? "bg-blue-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  1
                </div>
                <span
                  className={`ml-2 text-sm ${
                    currentStep === "form"
                      ? "text-blue-600 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  Leave Details
                </span>
              </div>

              <div
                className={`w-8 h-0.5 ${currentStep === "preview" ? "bg-green-600" : "bg-gray-300"}`}
              ></div>

              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "preview"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  2
                </div>
                <span
                  className={`ml-2 text-sm ${
                    currentStep === "preview"
                      ? "text-blue-600 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  Review & Submit
                </span>
              </div>
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {currentStep === "form" ? (
                <>
                  <FormField
                    control={form.control}
                    name="user_id"
                    render={({ field }) => {
                      const isAdmin = isUserAdmin(user);
                      return (
                        <FormItem>
                          <LeaveRequestValidatedSelect
                            id="user_id"
                            label="Employee"
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear manager if it conflicts with new employee selection (only for non-admin users)
                              if (!isAdmin) {
                                const currentManagerId = form.getValues("manager_id");
                                if (currentManagerId === value) {
                                  form.setValue("manager_id", "");
                                }
                              }
                              // Trigger validation after employee selection
                              setTimeout(() => {
                                form.trigger();
                              }, 0);
                            }}
                            error={form.formState.errors.user_id?.message}
                            required
                            placeholder="Select employee..."
                          >
                            {users.map((u) => {
                              const isCurrentUser = u.id.toString() === user?.id?.toString();
                              const shouldShow = isAdmin || isCurrentUser;
                              return shouldShow ? (
                                <SelectItem key={u.id} value={u.id.toString()}>
                                  {u.name ||
                                    `${u.first_name || ""} ${u.last_name || ""}`.trim()}{" "}
                                  ({u.email})
                                  {isCurrentUser && !isAdmin ? " (You)" : ""}
                                </SelectItem>
                              ) : null;
                            })}
                          </LeaveRequestValidatedSelect>
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="manager_id"
                    render={({ field }) => {
                      const selectedEmployeeId = form.watch("user_id");
                      const isAdmin = isUserAdmin(user);
                      const availableManagers = isAdmin
                        ? users
                        : users.filter((u) => u.id.toString() !== selectedEmployeeId);
                      return (
                        <FormItem>
                          <LeaveRequestValidatedSelect
                            id="manager_id"
                            label="Manager"
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Trigger validation after manager selection
                              setTimeout(() => {
                                form.trigger();
                              }, 0);
                            }}
                            error={form.formState.errors.manager_id?.message}
                            required
                            placeholder="Select manager..."
                          >
                            {availableManagers.map((user) => {
                              return (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name ||
                                    `${user.first_name || ""} ${user.last_name || ""}`.trim()}{" "}
                                  ({user.email})
                                </SelectItem>
                              );
                            })}
                          </LeaveRequestValidatedSelect>
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="leave_type"
                    render={({ field }) => (
                      <FormItem>
                        <LeaveRequestValidatedSelect
                          id="leave_type"
                          label="Leave Type"
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Trigger validation to clear errors
                            setTimeout(() => form.trigger("leave_type"), 0);
                          }}
                          error={form.formState.errors.leave_type?.message}
                          required
                        >
                          <SelectItem value="full_day">Full Day</SelectItem>
                          <SelectItem value="partial_day">
                            Partial Day
                          </SelectItem>
                        </LeaveRequestValidatedSelect>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Start Date</Label>
                          <DateInput
                            id="start_date"
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              // Trigger validation to clear errors
                              setTimeout(() => form.trigger("start_date"), 0);
                            }}
                            placeholder="Select start date"
                            required
                            minDate={(() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return today;
                            })()}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <Label>End Date</Label>
                          <DateInput
                            id="end_date"
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              // Trigger validation to clear errors
                              setTimeout(() => form.trigger("end_date"), 0);
                            }}
                            placeholder="Select end date"
                            disabled={form.watch("leave_type") === "partial_day"}
                            minDate={(() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return today;
                            })()}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch("leave_type") === "partial_day" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Start Time</Label>
                            <TimePicker
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                                // Trigger validation to clear errors
                                setTimeout(() => form.trigger("start_time"), 0);
                              }}
                              placeholder="Select start time"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="end_time"
                        render={({ field }) => (
                          <FormItem>
                            <Label>End Time</Label>
                            <TimePicker
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                                // Trigger validation to clear errors
                                setTimeout(() => form.trigger("end_time"), 0);
                              }}
                              placeholder="Select end time"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <LeaveRequestValidatedInput
                          id="reason"
                          label="Reason"
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Trigger validation to clear errors
                            setTimeout(() => form.trigger("reason"), 0);
                          }}
                          error={form.formState.errors.reason?.message}
                          required
                          maxLength={255}
                        />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 flex justify-between">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleManualReset}
                    >
                      Reset Form
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        Review Information
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <LeaveRequestPreview
                    formData={form.getValues()}
                    users={users}
                  />
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep("form")}
                    >
                      Edit Information
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Request"
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              Complete information about this leave request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Employee
                  </Label>
                  <p className="text-sm">
                    {selectedRequest.user?.name || "Unknown Employee"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Manager
                  </Label>
                  <p className="text-sm">
                    {selectedRequest.manager?.name || "Unknown Manager"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Start Date
                  </Label>
                  <p className="text-sm">
                    {new Date(selectedRequest.start_date).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    End Date
                  </Label>
                  <p className="text-sm">
                    {selectedRequest.end_date
                      ? new Date(selectedRequest.end_date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )
                      : "Same day"}
                  </p>
                </div>
              </div>

              {selectedRequest.leave_type === "partial_day" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Start Time
                    </Label>
                    <p className="text-sm">
                      {selectedRequest.start_time ? formatTimeTo12Hour(selectedRequest.start_time) : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      End Time
                    </Label>
                    <p className="text-sm">
                      {selectedRequest.end_time ? formatTimeTo12Hour(selectedRequest.end_time) : "Not specified"}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Leave Type
                </Label>
                <p className="text-sm">
                  <span
                    className={`px-2 py-1 text-xs rounded font-medium ${
                      selectedRequest.leave_type === "full_day"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {selectedRequest.leave_type === "full_day"
                      ? "Full Day"
                      : "Partial Day"}
                  </span>
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Reason
                </Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedRequest.reason}
                  </p>
                </div>
              </div>

              {selectedRequest.created_at && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Created At
                  </Label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedRequest.created_at).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  Close
                </Button>
                {canDeleteLeaveRequest() && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Leave Request
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this leave request?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(selectedRequest.id);
                            setIsDetailsDialogOpen(false);
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Manage all leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <p className="text-gray-500">No leave requests found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-3 md:p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative"
                >
                  {/* Action buttons in top-right corner */}
                  <div className="absolute top-2 right-2 z-10 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(request);
                      }}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canDeleteLeaveRequest() && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                            title="Delete Leave Request"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Leave Request
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this leave
                              request? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(request.id);
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  <div 
                    className="flex flex-col h-full pr-16 cursor-pointer"
                    onClick={() => handleViewDetails(request)}
                  >
                    <div className="flex-1">
                      <div className="mb-1.5 md:mb-2">
                        <h3 className="font-semibold text-sm md:text-base">
                          {request.user?.name || "Unknown Employee"}
                        </h3>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 mb-1">
                        Manager: {request.manager?.name || "Unknown Manager"}
                      </p>
                      <p className="text-xs md:text-sm text-gray-700 mb-1.5 md:mb-2">
                        {request.start_date === request.end_date
                          ? `${new Date(request.start_date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )} (Single Day)`
                          : `${new Date(request.start_date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )} - ${new Date(
                              request.end_date,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}`}
                      </p>
                      {request.leave_type && (
                        <p className="text-sm mb-2">
                          <span
                            className={`px-2 py-1 text-xs rounded font-medium ${
                              request.leave_type === "full_day"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {request.leave_type === "full_day"
                              ? "Full Day"
                              : "Partial Day"}
                          </span>
                          {request.leave_type === "partial_day" &&
                            request.start_time &&
                            request.end_time && (
                              <span className="ml-2 text-gray-600">
                                ({formatTimeTo12Hour(request.start_time)} - {formatTimeTo12Hour(request.end_time)})
                              </span>
                            )}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {request.reason.length > 70
                          ? `${request.reason.substring(0, 70)}...`
                          : request.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { LeaveManagement };
export default LeaveManagement;
