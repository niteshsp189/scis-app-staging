import React, { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { RemindersList } from "@/components/reminders/RemindersList";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/lib/axios";
import {
  reminderService,
  type Reminder,
  type CreateReminderData,
  type ReminderFilters,
} from "@/services/reminderService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, RefreshCw, ChevronDown, ChevronUp, Printer, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { usePreferences } from "@/contexts/PreferenceContext";

// Helper function to format date for API without timezone conversion
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to convert 12-hour time format to 24-hour format
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

interface ReminderFormData {
  title: string;
  description: string;
  dueDate: Date | undefined;
  dueTime: string;
  selectedCustomer: number | undefined;
  selectedAgent: string | undefined;
}

const initialFormState: ReminderFormData = {
  title: "",
  description: "",
  dueDate: undefined,
  dueTime: "",
  selectedCustomer: undefined,
  selectedAgent: undefined,
};

export default function Reminders() {
  const isMobile = useIsMobile();
  const { getFilterExpanded, setFilterExpanded } = usePreferences();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  // Form states
  const [createForm, setCreateForm] = useState<ReminderFormData>(initialFormState);
  const [editForm, setEditForm] = useState<ReminderFormData>(initialFormState);

  // Edit mode state
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [filters, setFilters] = useState<ReminderFilters>({
    sort_by: "reminder_datetime",
    sort_order: "desc",
    per_page: 10,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [employees, setEmployees] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [reminderDates, setReminderDates] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Load reminders
  const loadReminders = async (newFilters?: ReminderFilters) => {
    try {
      setLoading(true);
      const filterParams = { ...filters, ...newFilters };
      // Handle 'all' values by converting to undefined
      if (filterParams.status === "all") filterParams.status = undefined;
      if (filterParams.created_by === "all")
        filterParams.created_by = undefined;
      if (filterParams.assigned_to === "all")
        filterParams.assigned_to = undefined;
      const response = await reminderService.getReminders(filterParams);

      setReminders(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        per_page: response.data.per_page,
        total: response.data.total,
        last_page: response.data.last_page,
      });

      // Load reminder dates after reminders are loaded
      await loadReminderDates();
    } catch (error) {
      console.error("Failed to load reminders:", error);
      toast({
        title: "Error",
        description: "Failed to load reminders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadReminders();
    loadEmployeesAndAgents();
  }, []);

  // Initialize filters expanded state from user preferences
  useEffect(() => {
    const preferredExpanded = getFilterExpanded('reminders');
    setFiltersExpanded(preferredExpanded);
  }, [getFilterExpanded]);

  // Handle filters expand/collapse with preference persistence
  const handleToggleFilters = async () => {
    const newExpanded = !filtersExpanded;
    setFiltersExpanded(newExpanded);
    try {
      await setFilterExpanded('reminders', newExpanded);
    } catch (error) {
      console.error('Failed to save filters expanded preference:', error);
    }
  };

  // Auto-filter when filter values change
  useEffect(() => {
    // Only auto-filter if we have data loaded and it's not the initial load
    if (
      (employees.length > 0 || agents.length > 0) &&
      (statusFilter !== "all" ||
        createdByFilter !== "all" ||
        assignedToFilter !== "all" ||
        fromDate ||
        toDate)
    ) {
      const newFilters = {
        ...filters,
        search: searchQuery || undefined,
        status: statusFilter === "all" ? undefined : statusFilter || undefined,
        created_by:
          createdByFilter === "all" ? undefined : createdByFilter || undefined,
        assigned_to:
          assignedToFilter === "all"
            ? undefined
            : assignedToFilter || undefined,
        due_date_from: fromDate ? formatDateForAPI(fromDate) : undefined,
        due_date_to: toDate ? formatDateForAPI(toDate) : undefined,
        page: 1,
      };
      setFilters(newFilters);
      loadReminders(newFilters);
    }
  }, [statusFilter, createdByFilter, assignedToFilter, fromDate, toDate]);

  // Load employees and agents for filters
  const loadEmployeesAndAgents = async () => {
    try {
      // Load team members for "Created by" and "Assign to" filters
      const response = await api.get('/team-members?per_page=100');
      let teamMembers: any[] = [];
      if (response.data?.success && response.data?.data?.data && Array.isArray(response.data.data.data)) {
        teamMembers = response.data.data.data;
      } else if (response.data?.success && Array.isArray(response.data?.data)) {
        teamMembers = response.data.data;
      } else if (Array.isArray(response.data)) {
        teamMembers = response.data;
      }
      setEmployees(teamMembers);
      setAgents(teamMembers);
    } catch (error) {
      console.error("Failed to load team members:", error);
    }
  };

  // Load reminder dates for calendar highlighting
  const loadReminderDates = async () => {
    try {
      const currentFilters = {
        status: statusFilter === "all" ? undefined : statusFilter,
        created_by: createdByFilter === "all" ? undefined : createdByFilter,
        assigned_to: assignedToFilter === "all" ? undefined : assignedToFilter,
        search: searchQuery || undefined,
      };
      const dates = await reminderService.getReminderDates(currentFilters);

      // If no dates from API, fallback to extracting dates from current reminders
      if (!dates || dates.length === 0) {
        const fallbackDates = reminders
          .filter((r) => r.reminder_datetime)
          .map((r) => new Date(r.reminder_datetime).toISOString().split("T")[0])
          .filter((date, index, arr) => arr.indexOf(date) === index); // Remove duplicates

        setReminderDates(fallbackDates);
      } else {
        setReminderDates(dates);
      }
    } catch (error) {
      console.error("Failed to load reminder dates:", error);
      // Fallback: extract dates from current reminders
      const fallbackDates = reminders
        .filter((r) => r.reminder_datetime)
        .map((r) => new Date(r.reminder_datetime).toISOString().split("T")[0])
        .filter((date, index, arr) => arr.indexOf(date) === index); // Remove duplicates

      setReminderDates(fallbackDates);
    }
  };

  // Handle search
  const handleSearch = () => {
    const newFilters = {
      ...filters,
      search: searchQuery || undefined,
      status: statusFilter === "all" ? undefined : statusFilter || undefined,
      created_by:
        createdByFilter === "all" ? undefined : createdByFilter || undefined,
      assigned_to:
        assignedToFilter === "all" ? undefined : assignedToFilter || undefined,
      due_date_from: fromDate ? formatDateForAPI(fromDate) : undefined,
      due_date_to: toDate ? formatDateForAPI(toDate) : undefined,
      page: 1,
    };
    setFilters(newFilters);
    loadReminders(newFilters);
  };

  // Handle filter clear
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCreatedByFilter("all");
    setAssignedToFilter("all");
    setFromDate(undefined);
    setToDate(undefined);
    const newFilters = {
      sort_by: "reminder_datetime",
      sort_order: "asc" as const,
      per_page: 15,
      page: 1,
    };
    setFilters(newFilters);
    loadReminders(newFilters);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Reminders have been updated.",
    });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadReminders(newFilters);
  };

  // Handle form submission (create)
  const handleCreate = async () => {
    if (!createForm.title || !createForm.dueDate || !createForm.dueTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time
      const reminderDateTime = new Date(createForm.dueDate);
      const time24Hour = to24Hour(createForm.dueTime);
      const [hours, minutes] = time24Hour.split(":").map(Number);
      reminderDateTime.setHours(hours, minutes, 0, 0);

      if (reminderDateTime <= new Date()) {
        toast({
          title: "Error",
          description: "Please select a future date and time for the reminder.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Create new reminder
      const reminderData: CreateReminderData = {
        title: createForm.title,
        description: createForm.description || undefined,
        reminder_datetime: reminderDateTime.toISOString(),
        reminder_type: "custom",
        customer_id: createForm.selectedCustomer,
        agent_id: createForm.selectedAgent,
        notification_methods: ["email"],
      };

      await reminderService.createReminder(reminderData);

      toast({
        title: "Success",
        description: "Reminder created successfully.",
      });

      // Reset create form
      setCreateForm(initialFormState);

      // Reload reminders
      await loadReminders();
    } catch (error: any) {
      console.error("Failed to create reminder:", error);
      let errorMessage =
        error.response?.data?.message || "Failed to create reminder";
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const fieldErrors = Object.values(errors).flat().join(", ");
        errorMessage = fieldErrors || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission (update)
  const handleUpdate = async () => {
    if (!editForm.title || !editForm.dueDate || !editForm.dueTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time
      const reminderDateTime = new Date(editForm.dueDate);
      const time24Hour = to24Hour(editForm.dueTime);
      const [hours, minutes] = time24Hour.split(":").map(Number);
      reminderDateTime.setHours(hours, minutes, 0, 0);

      if (editingReminderId) {
        // Update existing reminder
        await reminderService.updateReminder(editingReminderId, {
          title: editForm.title,
          description: editForm.description || undefined,
          reminder_datetime: reminderDateTime.toISOString(),
          customer_id: editForm.selectedCustomer,
          agent_id: editForm.selectedAgent,
        });

        toast({
          title: "Success",
          description: "Reminder updated successfully.",
        });

        // Close dialog and reset
        setIsDialogOpen(false);
        setEditingReminderId(null);
        setEditForm(initialFormState);

        // Reload reminders
        await loadReminders();
      }
    } catch (error: any) {
      console.error("Failed to update reminder:", error);
      let errorMessage =
        error.response?.data?.message || "Failed to update reminder";
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const fieldErrors = Object.values(errors).flat().join(", ");
        errorMessage = fieldErrors || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reminder completion
  const handleToggleComplete = async (id: string) => {
    try {
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) return;

      if (reminder.status === "completed") {
        // If already completed, update to pending
        await reminderService.updateReminder(id, { status: "pending" });
      } else {
        // Mark as completed
        await reminderService.completeReminder(id);
      }

      await loadReminders();
      toast({
        title: "Success",
        description: "Reminder status updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update reminder:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder status.",
        variant: "destructive",
      });
    }
  };

  // Handle reminder deletion
  const handleDelete = async (id: string) => {
    try {
      await reminderService.deleteReminder(id);
      await loadReminders();
      toast({
        title: "Success",
        description: "Reminder deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      toast({
        title: "Error",
        description: "Failed to delete reminder.",
        variant: "destructive",
      });
    }
  };

  // Handle reminder snooze
  const handleSnooze = async (id: string, minutes: number) => {
    try {
      await reminderService.snoozeReminder(id, minutes);
      await loadReminders();

      const label =
        minutes < 60
          ? `${minutes} minutes`
          : minutes < 1440
            ? `${Math.round(minutes / 60)} hours`
            : minutes < 10080
              ? `${Math.round(minutes / 1440)} days`
              : `${Math.round(minutes / 10080)} weeks`;

      toast({
        title: "Success",
        description: `Reminder snoozed for ${label}.`,
      });
    } catch (error) {
      console.error("Failed to snooze reminder:", error);
      toast({
        title: "Error",
        description: "Failed to snooze reminder.",
        variant: "destructive",
      });
    }
  };

  // Handle edit reminder - populate form with existing values
  const handleEdit = (reminder: Reminder) => {
    setEditingReminderId(reminder.id);

    // Parse reminder datetime
    const reminderDate = new Date(reminder.reminder_datetime);

    // Format time as 12-hour for TimePicker (using UTC to match stored values)
    let hours = reminderDate.getUTCHours();
    const mins = reminderDate.getUTCMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const timeString = `${hours}:${mins} ${ampm}`;

    setEditForm({
      title: reminder.title,
      description: reminder.description || "",
      dueDate: reminderDate,
      dueTime: timeString,
      selectedCustomer: reminder.customer_id || undefined,
      selectedAgent: reminder.agent_id || reminder.assigned_to || undefined,
    });

    setIsDialogOpen(true);
  };

  // Handle cancel edit - reset form
  const handleCancelEdit = () => {
    setEditingReminderId(null);
    setIsDialogOpen(false);
    setEditForm(initialFormState);
  };

  // Handle print reminders list
  const handlePrintReminders = () => {
    const params = new URLSearchParams();

    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    if (createdByFilter && createdByFilter !== 'all') {
      params.set('createdBy', createdByFilter);
    }
    if (assignedToFilter && assignedToFilter !== 'all') {
      params.set('assignedTo', assignedToFilter);
    }
    if (fromDate) {
      params.set('fromDate', formatDateForAPI(fromDate));
    }
    if (toDate) {
      params.set('toDate', formatDateForAPI(toDate));
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }

    const queryString = params.toString();
    const printUrl = `/reminders/print${queryString ? `?${queryString}` : ''}`;
    window.open(printUrl, '_blank');
  };

  // Handle per page change
  const handlePerPageChange = (perPage: number) => {
    const newFilters = { ...filters, per_page: perPage, page: 1 };
    setFilters(newFilters);
    loadReminders(newFilters);
  };

  return (
    <div className={`${isMobile ? "pt-20 px-4 pb-4 space-y-4" : "p-6 space-y-6"}`}>
      <div>
        <h1
          className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold text-gray-900`}
        >
          Reminders
        </h1>
        <p className="text-gray-600 text-sm">
          Stay on top of your tasks and follow-ups
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle
            className="cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors"
            onClick={handleToggleFilters}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Search
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Badge variant="outline" className="py-1 px-2 text-xs">
                    Total: {pagination.total}
                  </Badge>
                  <Badge variant="outline" className="py-1 px-2 text-xs">
                    Overdue:{" "}
                    {reminders.filter((r) => reminderService.isOverdue(r)).length}
                  </Badge>
                  <Badge variant="outline" className="py-1 px-2 text-xs">
                    Due Today:{" "}
                    {reminders.filter((r) => reminderService.isDueToday(r)).length}
                  </Badge>
                  <Badge variant="outline" className="py-1 px-2 text-xs">
                    Completed:{" "}
                    {reminders.filter((r) => r.status === "completed").length}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="pointer-events-none self-center sm:self-auto">
                  {filtersExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        {filtersExpanded && (
          <CardContent>
            {/* Search and Filters */}
            <div className="space-y-4">
              {/* First Row: Search with Clear and Refresh */}
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium">
                    Search Reminders
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      placeholder="Search reminders by title, description, or customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    size="sm"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handlePrintReminders}
                    variant="outline"
                    size="sm"
                    title="Print reminders list"
                  >
                    <Printer className="h-4 w-4" />
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

              {/* Second Row: All Filter Dropdowns */}
              <div
                className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"}`}
              >
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {reminderService.getStatusOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
                    value={createdByFilter}
                    onValueChange={setCreatedByFilter}
                  >
                    <SelectTrigger id="createdBy">
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All employees</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-sm font-medium">
                    Assigned To
                  </Label>
                  <Select
                    value={assignedToFilter}
                    onValueChange={setAssignedToFilter}
                  >
                    <SelectTrigger id="assignedTo">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name ||
                            `${agent.first_name || ""} ${agent.last_name || ""}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromDate" className="text-sm font-medium">
                    From Date
                  </Label>
                  <DateInput
                    id="fromDate"
                    value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
                    onChange={(value) =>
                      setFromDate(value ? new Date(value) : undefined)
                    }
                    placeholder="Select from date"
                    modifiers={{
                      hasReminder: (date) =>
                        reminderService.hasReminders(date, reminderDates),
                    }}
                    modifiersStyles={{
                      hasReminder: {
                        backgroundColor: "rgb(59 130 246 / 0.1)",
                        color: "rgb(59 130 246)",
                        fontWeight: "bold",
                        border: "1px solid rgb(59 130 246 / 0.3)",
                        borderRadius: "4px",
                      },
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toDate" className="text-sm font-medium">
                    To Date
                  </Label>
                  <DateInput
                    id="toDate"
                    value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
                    onChange={(value) =>
                      setToDate(value ? new Date(value) : undefined)
                    }
                    placeholder="Select to date"
                    modifiers={{
                      hasReminder: (date) =>
                        reminderService.hasReminders(date, reminderDates),
                    }}
                    modifiersStyles={{
                      hasReminder: {
                        backgroundColor: "rgb(59 130 246 / 0.1)",
                        color: "rgb(59 130 246)",
                        fontWeight: "bold",
                        border: "1px solid rgb(59 130 246 / 0.3)",
                        borderRadius: "4px",
                      },
                    }}
                  />
                </div>
              </div>

              {/* Calendar legend */}
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{
                      backgroundColor: "rgb(59 130 246 / 0.1)",
                      border: "1px solid rgb(59 130 246 / 0.3)",
                    }}
                  ></div>
                  <span>Dates with reminders</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content Grid: Left Form (Create) & Right List */}
      <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 lg:grid-cols-2 gap-6"} mt-6`}>
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1">
          <ReminderForm
            title={createForm.title}
            setTitle={(val) => setCreateForm((prev) => ({ ...prev, title: val }))}
            description={createForm.description}
            setDescription={(val) => setCreateForm((prev) => ({ ...prev, description: val }))}
            dueDate={createForm.dueDate}
            setDueDate={(val) => setCreateForm((prev) => ({ ...prev, dueDate: val }))}
            dueTime={createForm.dueTime}
            setDueTime={(val) => setCreateForm((prev) => ({ ...prev, dueTime: val }))}
            selectedCustomer={createForm.selectedCustomer}
            setSelectedCustomer={(val) => setCreateForm((prev) => ({ ...prev, selectedCustomer: val }))}
            selectedAgent={createForm.selectedAgent}
            setSelectedAgent={(val) => setCreateForm((prev) => ({ ...prev, selectedAgent: val }))}
            onSubmit={handleCreate}
            submitting={submitting}
            isEditing={false}
          />
        </div>

        {/* Right Column: Reminders List */}
        <div className="lg:col-span-1">
          <RemindersList
            reminders={reminders}
            loading={loading}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDelete}
            onSnooze={handleSnooze}
            onEdit={handleEdit}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="sr-only">Edit Reminder</DialogTitle>
          </DialogHeader>
          <div className="mt-0">
            <ReminderForm
              title={editForm.title}
              setTitle={(val) => setEditForm((prev) => ({ ...prev, title: val }))}
              description={editForm.description}
              setDescription={(val) => setEditForm((prev) => ({ ...prev, description: val }))}
              dueDate={editForm.dueDate}
              setDueDate={(val) => setEditForm((prev) => ({ ...prev, dueDate: val }))}
              dueTime={editForm.dueTime}
              setDueTime={(val) => setEditForm((prev) => ({ ...prev, dueTime: val }))}
              selectedCustomer={editForm.selectedCustomer}
              setSelectedCustomer={(val) => setEditForm((prev) => ({ ...prev, selectedCustomer: val }))}
              selectedAgent={editForm.selectedAgent}
              setSelectedAgent={(val) => setEditForm((prev) => ({ ...prev, selectedAgent: val }))}
              onSubmit={handleUpdate}
              submitting={submitting}
              isEditing={true}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
