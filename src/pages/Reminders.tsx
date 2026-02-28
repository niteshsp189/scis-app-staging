import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, RefreshCw, ChevronDown, ChevronUp, Printer, Plus, Bell, Table2, UserCircle, Calendar, Clock, User, Check, Trash2, AlertTriangle, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { format } from "date-fns";
import { usePreferences } from "@/contexts/PreferenceContext";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const { getFilterExpanded, setFilterExpanded } = usePreferences();
  const [activeTab, setActiveTab] = useState("manage");
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

  // My Reminders state
  const [myReminders, setMyReminders] = useState<Reminder[]>([]);
  const [myRemindersLoading, setMyRemindersLoading] = useState(false);
  const [myPagination, setMyPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [myFilters, setMyFilters] = useState<ReminderFilters>({
    sort_by: "reminder_datetime",
    sort_order: "asc",
    per_page: 10,
    my_reminders: true,
  });

  // Table view state
  const [tableReminders, setTableReminders] = useState<Reminder[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tablePagination, setTablePagination] = useState({
    current_page: 1,
    per_page: 25,
    total: 0,
    last_page: 1,
  });
  const [tableFilters, setTableFilters] = useState<ReminderFilters>({
    sort_by: "reminder_datetime",
    sort_order: "desc",
    per_page: 25,
  });
  const [tableSortField, setTableSortField] = useState<string>("reminder_datetime");
  const [tableSortOrder, setTableSortOrder] = useState<"asc" | "desc">("desc");

  // Table view filter field states
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState("all");
  const [tableCreatedByFilter, setTableCreatedByFilter] = useState("all");
  const [tableAssignedToFilter, setTableAssignedToFilter] = useState("all");
  const [tableFromDate, setTableFromDate] = useState<Date | undefined>(undefined);
  const [tableToDate, setTableToDate] = useState<Date | undefined>(undefined);
  const [tableFiltersExpanded, setTableFiltersExpanded] = useState(true);

  // My Reminders filter field states
  const [mySearchQuery, setMySearchQuery] = useState("");
  const [myStatusFilter, setMyStatusFilter] = useState("all");
  const [myFromDate, setMyFromDate] = useState<Date | undefined>(undefined);
  const [myToDate, setMyToDate] = useState<Date | undefined>(undefined);
  const [myFiltersExpanded, setMyFiltersExpanded] = useState(true);

  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  // Load My Reminders (assigned to current user)
  const loadMyReminders = async (newFilters?: ReminderFilters) => {
    if (!user?.id) return;
    try {
      setMyRemindersLoading(true);
      const filterParams = { ...myFilters, ...newFilters, my_reminders: true };
      const response = await reminderService.getReminders(filterParams);
      setMyReminders(response.data.data);
      setMyPagination({
        current_page: response.data.current_page,
        per_page: response.data.per_page,
        total: response.data.total,
        last_page: response.data.last_page,
      });
    } catch (error) {
      console.error("Failed to load my reminders:", error);
    } finally {
      setMyRemindersLoading(false);
    }
  };

  // Load Table View reminders
  const loadTableReminders = async (newFilters?: ReminderFilters) => {
    try {
      setTableLoading(true);
      const filterParams = { ...tableFilters, ...newFilters };
      const response = await reminderService.getReminders(filterParams);
      setTableReminders(response.data.data);
      setTablePagination({
        current_page: response.data.current_page,
        per_page: response.data.per_page,
        total: response.data.total,
        last_page: response.data.last_page,
      });
    } catch (error) {
      console.error("Failed to load table reminders:", error);
    } finally {
      setTableLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "my-reminders" && myReminders.length === 0 && !myRemindersLoading) {
      loadMyReminders();
    }
    if (activeTab === "table-view" && tableReminders.length === 0 && !tableLoading) {
      loadTableReminders();
    }
  }, [activeTab]);

  // Auto-filter table view when dropdown values change
  useEffect(() => {
    if (activeTab !== "table-view" || tableReminders.length === 0) return;
    const newFilters: ReminderFilters = {
      ...tableFilters,
      search: tableSearchQuery || undefined,
      status: tableStatusFilter === "all" ? undefined : tableStatusFilter,
      created_by: tableCreatedByFilter === "all" ? undefined : tableCreatedByFilter,
      assigned_to: tableAssignedToFilter === "all" ? undefined : tableAssignedToFilter,
      due_date_from: tableFromDate ? formatDateForAPI(tableFromDate) : undefined,
      due_date_to: tableToDate ? formatDateForAPI(tableToDate) : undefined,
      page: 1,
    };
    setTableFilters(newFilters);
    loadTableReminders(newFilters);
  }, [tableStatusFilter, tableCreatedByFilter, tableAssignedToFilter, tableFromDate, tableToDate]);

  // Auto-filter my reminders when dropdown values change
  useEffect(() => {
    if (activeTab !== "my-reminders" || myReminders.length === 0) return;
    const newFilters: ReminderFilters = {
      ...myFilters,
      search: mySearchQuery || undefined,
      status: myStatusFilter === "all" ? undefined : myStatusFilter,
      my_reminders: true,
      due_date_from: myFromDate ? formatDateForAPI(myFromDate) : undefined,
      due_date_to: myToDate ? formatDateForAPI(myToDate) : undefined,
      page: 1,
    };
    setMyFilters(newFilters);
    loadMyReminders(newFilters);
  }, [myStatusFilter, myFromDate, myToDate]);

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

      // Reset create form & close dialog
      setCreateForm(initialFormState);
      setIsCreateDialogOpen(false);

      // Reload active tab data
      await loadReminders();
      if (activeTab === "table-view") await loadTableReminders();
      if (activeTab === "my-reminders") await loadMyReminders();
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

        // Reload active tab data
        await loadReminders();
        if (activeTab === "table-view") await loadTableReminders();
        if (activeTab === "my-reminders") await loadMyReminders();
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
      const allReminders = [...reminders, ...tableReminders, ...myReminders];
      const reminder = allReminders.find((r) => r.id === id);
      if (!reminder) return;

      if (reminder.status === "completed") {
        // If already completed, update to pending
        await reminderService.updateReminder(id, { status: "pending" });
      } else {
        // Mark as completed
        await reminderService.completeReminder(id);
      }

      await loadReminders();
      if (activeTab === "table-view") await loadTableReminders();
      if (activeTab === "my-reminders") await loadMyReminders();
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
      if (activeTab === "table-view") await loadTableReminders();
      if (activeTab === "my-reminders") await loadMyReminders();
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
      if (activeTab === "table-view") await loadTableReminders();
      if (activeTab === "my-reminders") await loadMyReminders();

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

    if (activeTab === "manage") {
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (createdByFilter && createdByFilter !== 'all') params.set('createdBy', createdByFilter);
      if (assignedToFilter && assignedToFilter !== 'all') params.set('assignedTo', assignedToFilter);
      if (fromDate) params.set('fromDate', formatDateForAPI(fromDate));
      if (toDate) params.set('toDate', formatDateForAPI(toDate));
      if (searchQuery) params.set('search', searchQuery);
    } else if (activeTab === "table-view") {
      if (tableStatusFilter && tableStatusFilter !== 'all') params.set('status', tableStatusFilter);
      if (tableCreatedByFilter && tableCreatedByFilter !== 'all') params.set('createdBy', tableCreatedByFilter);
      if (tableAssignedToFilter && tableAssignedToFilter !== 'all') params.set('assignedTo', tableAssignedToFilter);
      if (tableFromDate) params.set('fromDate', formatDateForAPI(tableFromDate));
      if (tableToDate) params.set('toDate', formatDateForAPI(tableToDate));
      if (tableSearchQuery) params.set('search', tableSearchQuery);
    } else if (activeTab === "my-reminders") {
      if (myStatusFilter && myStatusFilter !== 'all') params.set('status', myStatusFilter);
      params.set('myReminders', 'true');
      if (myFromDate) params.set('fromDate', formatDateForAPI(myFromDate));
      if (myToDate) params.set('toDate', formatDateForAPI(myToDate));
      if (mySearchQuery) params.set('search', mySearchQuery);
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

  // Table view filter handlers
  const handleTableSearch = () => {
    const newFilters: ReminderFilters = {
      ...tableFilters,
      search: tableSearchQuery || undefined,
      status: tableStatusFilter === "all" ? undefined : tableStatusFilter,
      created_by: tableCreatedByFilter === "all" ? undefined : tableCreatedByFilter,
      assigned_to: tableAssignedToFilter === "all" ? undefined : tableAssignedToFilter,
      due_date_from: tableFromDate ? formatDateForAPI(tableFromDate) : undefined,
      due_date_to: tableToDate ? formatDateForAPI(tableToDate) : undefined,
      page: 1,
    };
    setTableFilters(newFilters);
    loadTableReminders(newFilters);
  };

  const handleTableClearFilters = () => {
    setTableSearchQuery("");
    setTableStatusFilter("all");
    setTableCreatedByFilter("all");
    setTableAssignedToFilter("all");
    setTableFromDate(undefined);
    setTableToDate(undefined);
    const newFilters: ReminderFilters = {
      sort_by: tableSortField,
      sort_order: tableSortOrder,
      per_page: tablePagination.per_page,
      page: 1,
    };
    setTableFilters(newFilters);
    loadTableReminders(newFilters);
  };

  // My Reminders filter handlers
  const handleMySearch = () => {
    const newFilters: ReminderFilters = {
      ...myFilters,
      search: mySearchQuery || undefined,
      status: myStatusFilter === "all" ? undefined : myStatusFilter,
      my_reminders: true,
      due_date_from: myFromDate ? formatDateForAPI(myFromDate) : undefined,
      due_date_to: myToDate ? formatDateForAPI(myToDate) : undefined,
      page: 1,
    };
    setMyFilters(newFilters);
    loadMyReminders(newFilters);
  };

  const handleMyClearFilters = () => {
    setMySearchQuery("");
    setMyStatusFilter("all");
    setMyFromDate(undefined);
    setMyToDate(undefined);
    const newFilters: ReminderFilters = {
      sort_by: "reminder_datetime",
      sort_order: "asc" as const,
      per_page: myPagination.per_page,
      page: 1,
      my_reminders: true,
    };
    setMyFilters(newFilters);
    loadMyReminders(newFilters);
  };

  // Helper: render table sort header
  const handleTableSort = (field: string) => {
    const newOrder: "asc" | "desc" = tableSortField === field && tableSortOrder === "asc" ? "desc" : "asc";
    setTableSortField(field);
    setTableSortOrder(newOrder);
    const newFilters = { ...tableFilters, sort_by: field, sort_order: newOrder, page: 1 };
    setTableFilters(newFilters);
    loadTableReminders(newFilters);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-gray-400 text-[10px]">
      {tableSortField === field ? (tableSortOrder === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  // Helper: get contact name for table
  const getContactName = (r: Reminder) => {
    if (r.customer) return `${r.customer.first_name} ${r.customer.last_name}`;
    if (r.lead) return `${r.lead.first_name} ${r.lead.last_name}`;
    return "—";
  };

  // Helper: get assigned name
  const getAssignedName = (r: Reminder) => {
    if (r.assigned_user) return `${r.assigned_user.first_name} ${r.assigned_user.last_name}`;
    if (r.agent) return `${r.agent.first_name} ${r.agent.last_name}`;
    return "—";
  };

  // Helper: get creator name
  const getCreatorName = (r: Reminder) => {
    if (r.creator) return `${r.creator.first_name} ${r.creator.last_name}`;
    return "—";
  };

  // Computed stats for My Reminders
  const myStats = useMemo(() => ({
    overdue: myReminders.filter((r) => reminderService.isOverdue(r)).length,
    dueToday: myReminders.filter((r) => reminderService.isDueToday(r)).length,
    pending: myReminders.filter((r) => r.status === "pending").length,
    completed: myReminders.filter((r) => r.status === "completed").length,
  }), [myReminders]);

  return (
    <div className={`${isMobile ? "pt-20 px-4 pb-4 space-y-4" : "p-6 space-y-6"}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold text-gray-900`}>
            Reminders
          </h1>
          <p className="text-gray-600 text-sm">
            Stay on top of your tasks and follow-ups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            {!isMobile && "New Reminder"}
          </Button>
          <Button
            onClick={handlePrintReminders}
            variant="outline"
            size="sm"
            title="Print reminders list"
          >
            <Printer className="h-4 w-4 mr-1" />
            {!isMobile && "Print"}
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""} ${!isMobile ? "mr-1" : ""}`} />
            {!isMobile && "Refresh"}
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${isMobile ? "grid-cols-3" : "grid-cols-3 max-w-lg"}`}>
          <TabsTrigger value="manage" className="flex items-center gap-1.5">
            <Bell className="h-4 w-4" />
            {isMobile ? "Manage" : "Manage Reminders"}
          </TabsTrigger>
          <TabsTrigger value="table-view" className="flex items-center gap-1.5">
            <Table2 className="h-4 w-4" />
            {isMobile ? "Table" : "Table View"}
          </TabsTrigger>
          <TabsTrigger value="my-reminders" className="flex items-center gap-1.5">
            <UserCircle className="h-4 w-4" />
            {isMobile ? "Mine" : "My Reminders"}
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB 1: Manage Reminders (original) ========== */}
        <TabsContent value="manage" className="mt-6 space-y-6">
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
                <div className="space-y-4">
                  {/* Search row */}
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
                      <Button onClick={handleClearFilters} variant="outline" size="sm">
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Filter dropdowns */}
                  <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"}`}>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {reminderService.getStatusOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="createdBy" className="text-sm font-medium">Created By</Label>
                      <EmployeeCombobox
                        users={employees}
                        value={createdByFilter}
                        onChange={setCreatedByFilter}
                        loading={employees.length === 0}
                        showAnyOption={false}
                        showAllOption={true}
                        allLabel="All employees"
                        placeholder="Select an employee"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignedTo" className="text-sm font-medium">Assigned To</Label>
                      <EmployeeCombobox
                        users={agents}
                        value={assignedToFilter}
                        onChange={setAssignedToFilter}
                        loading={agents.length === 0}
                        showAnyOption={false}
                        showAllOption={true}
                        allLabel="All users"
                        placeholder="Select a user"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fromDate" className="text-sm font-medium">From Date</Label>
                      <DateInput
                        id="fromDate"
                        value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
                        onChange={(value) => setFromDate(value ? new Date(value) : undefined)}
                        placeholder="Select from date"
                        modifiers={{ hasReminder: (date) => reminderService.hasReminders(date, reminderDates) }}
                        modifiersStyles={{ hasReminder: { backgroundColor: "rgb(59 130 246 / 0.1)", color: "rgb(59 130 246)", fontWeight: "bold", border: "1px solid rgb(59 130 246 / 0.3)", borderRadius: "4px" } }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="toDate" className="text-sm font-medium">To Date</Label>
                      <DateInput
                        id="toDate"
                        value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
                        onChange={(value) => setToDate(value ? new Date(value) : undefined)}
                        placeholder="Select to date"
                        modifiers={{ hasReminder: (date) => reminderService.hasReminders(date, reminderDates) }}
                        modifiersStyles={{ hasReminder: { backgroundColor: "rgb(59 130 246 / 0.1)", color: "rgb(59 130 246)", fontWeight: "bold", border: "1px solid rgb(59 130 246 / 0.3)", borderRadius: "4px" } }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded border" style={{ backgroundColor: "rgb(59 130 246 / 0.1)", border: "1px solid rgb(59 130 246 / 0.3)" }}></div>
                      <span>Dates with reminders</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Create + List Grid */}
          <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 lg:grid-cols-2 gap-6"}`}>
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
        </TabsContent>

        {/* ========== TAB 2: Table View ========== */}
        <TabsContent value="table-view" className="mt-6 space-y-6">
          {/* Table View Filters */}
          <Card>
            <CardHeader>
              <CardTitle
                className="cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors"
                onClick={() => setTableFiltersExpanded(!tableFiltersExpanded)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters & Search
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <Badge variant="outline" className="py-1 px-2 text-xs">
                        Total: {tablePagination.total}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="pointer-events-none self-center sm:self-auto">
                      {tableFiltersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            {tableFiltersExpanded && (
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="tableSearch" className="text-sm font-medium">Search Reminders</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tableSearch"
                          placeholder="Search by title, description, or customer..."
                          value={tableSearchQuery}
                          onChange={(e) => setTableSearchQuery(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => e.key === "Enter" && handleTableSearch()}
                        />
                        <Button onClick={handleTableSearch} size="sm">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={handleTableClearFilters} variant="outline" size="sm">Clear</Button>
                    </div>
                  </div>
                  <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"}`}>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <Select value={tableStatusFilter} onValueChange={setTableStatusFilter}>
                        <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {reminderService.getStatusOptions().map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Created By</Label>
                      <EmployeeCombobox
                        users={employees}
                        value={tableCreatedByFilter}
                        onChange={setTableCreatedByFilter}
                        loading={employees.length === 0}
                        showAnyOption={false}
                        showAllOption={true}
                        allLabel="All employees"
                        placeholder="Select an employee"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Assigned To</Label>
                      <EmployeeCombobox
                        users={agents}
                        value={tableAssignedToFilter}
                        onChange={setTableAssignedToFilter}
                        loading={agents.length === 0}
                        showAnyOption={false}
                        showAllOption={true}
                        allLabel="All users"
                        placeholder="Select a user"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">From Date</Label>
                      <DateInput
                        value={tableFromDate ? format(tableFromDate, "yyyy-MM-dd") : ""}
                        onChange={(value) => setTableFromDate(value ? new Date(value) : undefined)}
                        placeholder="Select from date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">To Date</Label>
                      <DateInput
                        value={tableToDate ? format(tableToDate, "yyyy-MM-dd") : ""}
                        onChange={(value) => setTableToDate(value ? new Date(value) : undefined)}
                        placeholder="Select to date"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="h-5 w-5" />
                  {isMobile ? "All Reminders" : "All Reminders"}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-500 whitespace-nowrap">Rows per page:</span>
                  <Select
                    value={tablePagination.per_page.toString()}
                    onValueChange={(val) => {
                      const newFilters = { ...tableFilters, per_page: Number(val), page: 1 };
                      setTableFilters(newFilters);
                      loadTableReminders(newFilters);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((size) => (
                        <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tableLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : tableReminders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No reminders found.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleTableSort("title")}>
                            Title <SortIcon field="title" />
                          </th>
                          <th className="px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleTableSort("status")}>
                            Status <SortIcon field="status" />
                          </th>
                          <th className="px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleTableSort("reminder_datetime")}>
                            Date/Time <SortIcon field="reminder_datetime" />
                          </th>
                          <th className="px-4 py-3 font-medium text-gray-600">Contact</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Assigned To</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Created By</th>
                          <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tableReminders.map((r) => {
                          const isOverdue = reminderService.isOverdue(r);
                          const isDueToday = reminderService.isDueToday(r);
                          return (
                            <tr
                              key={r.id}
                              className={`transition-colors ${
                                isOverdue
                                  ? "bg-red-50"
                                  : isDueToday
                                    ? "bg-yellow-50"
                                    : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium">
                                  {r.title}
                                </div>
                                {r.description && (
                                  <div className="text-xs text-gray-400 truncate max-w-[200px]">{r.description}</div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={isOverdue ? "destructive" : reminderService.getStatusBadgeVariant(r.status)}
                                  className="text-xs"
                                >
                                  {isOverdue ? "Overdue" : r.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                {format(new Date(r.reminder_datetime), "MMM dd, yyyy")}
                                <div className="text-xs text-gray-400">
                                  {format(new Date(r.reminder_datetime), "h:mm a")}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{getContactName(r)}</td>
                              <td className="px-4 py-3 text-gray-600">{getAssignedName(r)}</td>
                              <td className="px-4 py-3 text-gray-600">{getCreatorName(r)}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {r.status !== "completed" && (
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(r)} title="Edit">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleToggleComplete(r.id)}
                                    title={r.status === "completed" ? "Mark Pending" : "Mark Complete"}
                                  >
                                    <Check className={`h-3.5 w-3.5 ${r.status === "completed" ? "text-gray-400" : "text-green-600"}`} />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" title="Delete">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{r.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(r.id)} className="bg-red-600 hover:bg-red-700">
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Pagination */}
                  {tablePagination.last_page > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {(tablePagination.current_page - 1) * tablePagination.per_page + 1} to{" "}
                        {Math.min(tablePagination.current_page * tablePagination.per_page, tablePagination.total)} of {tablePagination.total}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => loadTableReminders({ ...tableFilters, page: tablePagination.current_page - 1 })} disabled={tablePagination.current_page <= 1}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {tablePagination.current_page} of {tablePagination.last_page}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => loadTableReminders({ ...tableFilters, page: tablePagination.current_page + 1 })} disabled={tablePagination.current_page >= tablePagination.last_page}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 3: My Reminders ========== */}
        <TabsContent value="my-reminders" className="mt-6 space-y-6">
          {/* My Reminders Filters */}
          <Card>
            <CardHeader>
              <CardTitle
                className="cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors"
                onClick={() => setMyFiltersExpanded(!myFiltersExpanded)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters & Search
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <Badge variant="outline" className="py-1 px-2 text-xs">
                        Total: {myPagination.total}
                      </Badge>
                      <Badge variant="outline" className="py-1 px-2 text-xs text-red-600">
                        Overdue: {myStats.overdue}
                      </Badge>
                      <Badge variant="outline" className="py-1 px-2 text-xs text-yellow-600">
                        Due Today: {myStats.dueToday}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="pointer-events-none self-center sm:self-auto">
                      {myFiltersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            {myFiltersExpanded && (
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="mySearch" className="text-sm font-medium">Search My Reminders</Label>
                      <div className="flex gap-2">
                        <Input
                          id="mySearch"
                          placeholder="Search by title, description, or customer..."
                          value={mySearchQuery}
                          onChange={(e) => setMySearchQuery(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => e.key === "Enter" && handleMySearch()}
                        />
                        <Button onClick={handleMySearch} size="sm">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={handleMyClearFilters} variant="outline" size="sm">Clear</Button>
                    </div>
                  </div>
                  <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-1 md:grid-cols-3 gap-4"}`}>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <Select value={myStatusFilter} onValueChange={setMyStatusFilter}>
                        <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {reminderService.getStatusOptions().map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">From Date</Label>
                      <DateInput
                        value={myFromDate ? format(myFromDate, "yyyy-MM-dd") : ""}
                        onChange={(value) => setMyFromDate(value ? new Date(value) : undefined)}
                        placeholder="Select from date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">To Date</Label>
                      <DateInput
                        value={myToDate ? format(myToDate, "yyyy-MM-dd") : ""}
                        onChange={(value) => setMyToDate(value ? new Date(value) : undefined)}
                        placeholder="Select to date"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* My Stats Cards */}
          <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-4`}>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{myStats.overdue}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{myStats.dueToday}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> Due Today
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{myStats.pending}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Bell className="h-3 w-3" /> Pending
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{myStats.completed}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Check className="h-3 w-3" /> Completed
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Reminders List */}
          <RemindersList
            reminders={myReminders}
            loading={myRemindersLoading}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDelete}
            onSnooze={handleSnooze}
            onEdit={handleEdit}
            pagination={myPagination}
            onPageChange={(page) => {
              const newFilters = { ...myFilters, page };
              setMyFilters(newFilters);
              loadMyReminders(newFilters);
            }}
            onPerPageChange={(perPage) => {
              const newFilters = { ...myFilters, per_page: perPage, page: 1 };
              setMyFilters(newFilters);
              loadMyReminders(newFilters);
            }}
          />
        </TabsContent>
      </Tabs>

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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) { setCreateForm(initialFormState); setIsCreateDialogOpen(false); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="sr-only">Create Reminder</DialogTitle>
          </DialogHeader>
          <div className="mt-0">
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
