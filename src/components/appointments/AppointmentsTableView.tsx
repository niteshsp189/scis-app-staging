import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Printer,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import appointmentService, { Appointment } from "@/services/appointmentService";
import userService from "@/services/userService";
import { officeLocationService } from "@/services/officeLocationService";
import { toast } from "@/components/ui/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { formatTimeUTC, formatDateUTC, formatDateTimeUTC } from "@/utils/dateFormatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppointmentDetailsDialog } from "@/components/dialogs/AppointmentDetailsDialog";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { usePreferences } from "@/contexts/PreferenceContext";
import { stripHtml } from "@/lib/htmlUtils";
import { useNavigate } from "react-router-dom";
import { getCustomerViewUrl } from "@/utils/customerRoutes";

interface AppointmentsTableViewProps {
  permissions?: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  };
}

export const AppointmentsTableView = forwardRef(
  ({ permissions }: AppointmentsTableViewProps, ref) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
    const [createdByFilter, setCreatedByFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), "yyyy-MM-dd"));
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [users, setUsers] = useState<any[]>([]);
    const [officeLocations, setOfficeLocations] = useState<any[]>([]);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    
    // Appointment details dialog state
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
    
    const { getFilterExpanded, setFilterExpanded } = usePreferences();
    const navigate = useNavigate();
    
    // Grab scroll functionality
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [scrollStart, setScrollStart] = useState({ x: 0, scrollLeft: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!tableContainerRef.current) return;
      setIsGrabbing(true);
      setScrollStart({
        x: e.pageX - tableContainerRef.current.offsetLeft,
        scrollLeft: tableContainerRef.current.scrollLeft,
      });
    };

    const handleMouseUp = () => {
      setIsGrabbing(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isGrabbing || !tableContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - tableContainerRef.current.offsetLeft;
      const walk = (x - scrollStart.x) * 2; // Multiply for faster scroll
      tableContainerRef.current.scrollLeft = scrollStart.scrollLeft - walk;
    };

    const handleMouseLeave = () => {
      setIsGrabbing(false);
    };

    const handleToggleFilters = async () => {
      const newExpanded = !isFiltersExpanded;
      setIsFiltersExpanded(newExpanded);
      try {
        await setFilterExpanded('appointments_table', newExpanded);
      } catch (error) {
        console.error('Failed to save filter expanded state:', error);
      }
    };

    const loadAppointments = async () => {
      try {
        setLoading(true);
        const filters: any = {
          page: currentPage,
          per_page: perPage,
        };

        if (searchTerm) {
          filters.search = searchTerm;
        }

        if (statusFilter && statusFilter !== "all") {
          filters.status = statusFilter;
        }

        if (typeFilter && typeFilter !== "all") {
          filters.type = typeFilter;
        }

        if (assigneeFilter && assigneeFilter !== "all") {
          filters.assigned_to = assigneeFilter;
        }

        if (createdByFilter && createdByFilter !== "all") {
          filters.created_by = createdByFilter;
        }

        if (locationFilter && locationFilter !== "all") {
          filters.office_location_id = locationFilter;
        }

        if (startDate) {
          filters.start_date = startDate;
        }

        if (endDate) {
          filters.end_date = endDate;
        }

        const response = await appointmentService.getAppointments(filters);
        
        if (response.success) {
          // Handle nested data structure
          if (Array.isArray(response.data)) {
            setAppointments(response.data);
            setTotalPages(1);
            setTotalRecords(response.data.length);
          } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            // Paginated response with data.data structure
            setAppointments(response.data.data);
            setTotalPages(response.data.last_page || 1);
            setTotalRecords(response.data.total || 0);
          } else {
            setAppointments([]);
            setTotalPages(1);
            setTotalRecords(0);
          }
        }
      } catch (error) {
        console.error("Error loading appointments:", error);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadAppointments();
    }, [currentPage, statusFilter, typeFilter, assigneeFilter, createdByFilter, locationFilter, startDate, endDate, perPage]);

    // Initialize filters expanded state from user preferences
    useEffect(() => {
      const preferredExpanded = getFilterExpanded('appointments_table');
      setIsFiltersExpanded(preferredExpanded);
    }, [getFilterExpanded]);

    // Load users and office locations on mount
    useEffect(() => {
      const loadUsers = async () => {
        try {
          const fetchedUsers = await userService.getUsers({ active: true });
          if (Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
            setUsers(fetchedUsers);
          }
        } catch (error) {
          console.error('Failed to load users:', error);
        }
      };

      const loadOfficeLocations = async () => {
        try {
          const fetchedLocations = await officeLocationService.getLocationOptions();
          if (Array.isArray(fetchedLocations) && fetchedLocations.length > 0) {
            setOfficeLocations(fetchedLocations);
          }
        } catch (error) {
          console.error('Failed to load office locations:', error);
        }
      };

      loadUsers();
      loadOfficeLocations();
    }, []);

    useEffect(() => {
      const timeoutId = setTimeout(() => {
        loadAppointments();
      }, 500);
      return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    useImperativeHandle(ref, () => ({
      refreshAppointments: loadAppointments,
    }));

    const formatDateTime = (dateString: string) => {
      try {
        return formatDateTimeUTC(dateString);
      } catch {
        return dateString;
      }
    };

    const formatDate = (dateString: string) => {
      try {
        return formatDateUTC(dateString);
      } catch {
        return dateString;
      }
    };

    const formatTime = (dateString: string) => {
      try {
        return formatTimeUTC(dateString);
      } catch {
        return dateString;
      }
    };

    const getStatusBadge = (status: string) => {
      const statusConfig: Record<string, { variant: any; label: string }> = {
        scheduled: { variant: "default", label: "Scheduled" },
        confirmed: { variant: "default", label: "Confirmed" },
        in_progress: { variant: "default", label: "In Progress" },
        completed: { variant: "default", label: "Completed" },
        cancelled: { variant: "destructive", label: "Cancelled" },
        no_show: { variant: "destructive", label: "No Show" },
        rescheduled: { variant: "secondary", label: "Rescheduled" },
      };

      const config = statusConfig[status] || { variant: "default", label: status };
      return (
        <Badge variant={config.variant} className="text-xs">
          {config.label}
        </Badge>
      );
    };

    const getPriorityBadge = (priority: string) => {
      const priorityConfig: Record<string, { className: string; label: string }> = {
        urgent: { className: "bg-red-100 text-red-800", label: "Urgent" },
        high: { className: "bg-orange-100 text-orange-800", label: "High" },
        medium: { className: "bg-yellow-100 text-yellow-800", label: "Medium" },
        low: { className: "bg-blue-100 text-blue-800", label: "Low" },
      };

      const config = priorityConfig[priority] || { className: "bg-gray-100 text-gray-800", label: priority };
      return (
        <Badge className={`text-xs ${config.className}`}>
          {config.label}
        </Badge>
      );
    };

    const getTypeLabel = (type: string) => {
      const typeLabels: Record<string, string> = {
        new_client: "New Client",
        supplement: "Supplement",
        part_d: "Part D",
        rate_increase: "Rate Increase",
        under_65: "Under 65",
        dental_vision: "Dental/Vision",
        review: "Review",
        customer_service: "Customer Service",
        field_time: "Field Time",
        life_insurance: "Life Insurance",
        meeting: "Meeting",
        call: "Call",
        presentation: "Presentation",
        follow_up: "Follow Up",
        consultation: "Consultation",
        quote: "Quote",
        other: "Other",
      };
      return typeLabels[type] || type;
    };

    const handleAppointmentClick = (appointment: Appointment) => {
      setSelectedAppointment(appointment);
      setShowAppointmentDetails(true);
    };

    const handleAppointmentUpdated = () => {
      loadAppointments();
      setShowAppointmentDetails(false);
      setSelectedAppointment(null);
    };

    const handleAppointmentDeleted = () => {
      loadAppointments();
      setShowAppointmentDetails(false);
      setSelectedAppointment(null);
    };

    return (
      <div className="space-y-4">
        {/* Filters */}
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
          <CardContent className="p-4">
            {/* Search - Full Width */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* First Row - 3 Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Assignee Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Assignee</label>
                <EmployeeCombobox
                  users={users}
                  value={assigneeFilter}
                  onChange={setAssigneeFilter}
                  showAnyOption={false}
                  showAllOption={true}
                  allLabel="All Employees"
                  placeholder="Filter by Assignee"
                />
              </div>

              {/* Created By Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Created By</label>
                <EmployeeCombobox
                  users={users}
                  value={createdByFilter}
                  onChange={setCreatedByFilter}
                  showAnyOption={false}
                  showAllOption={true}
                  allLabel="All Employees"
                  placeholder="Filter by Created By"
                />
              </div>

              {/* Office Location Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Office Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Office Location" />
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
            </div>

            {/* Second Row - 3 Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Type Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Appointment Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Appointment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="new_client">New Client</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                    <SelectItem value="part_d">Part D</SelectItem>
                    <SelectItem value="rate_increase">Rate Increase</SelectItem>
                    <SelectItem value="under_65">Under 65</SelectItem>
                    <SelectItem value="dental_vision">Dental & Vision</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                    <SelectItem value="field_time">Field Time</SelectItem>
                    <SelectItem value="life_insurance">Life Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Status" />
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

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">From Date</label>
                <DateInput
                  value={startDate}
                  onChange={(value) => setStartDate(value || "")}
                  placeholder="From date"
                />
              </div>
            </div>

            {/* Third Row - End Date and Clear Button */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* End Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">To Date</label>
                <DateInput
                  value={endDate}
                  onChange={(value) => setEndDate(value || "")}
                  placeholder="To date"
                  minDate={startDate ? new Date(startDate) : undefined}
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setAssigneeFilter("all");
                    setCreatedByFilter("all");
                    setLocationFilter("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  disabled={!searchTerm && statusFilter === "all" && typeFilter === "all" && assigneeFilter === "all" && createdByFilter === "all" && locationFilter === "all" && !startDate && !endDate}
                  className="flex items-center gap-1.5 px-3 w-full"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>

              {/* Print Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Build query params from current filters
                    const params = new URLSearchParams();
                    if (startDate) params.set('start_date', startDate);
                    if (endDate) params.set('end_date', endDate);
                    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
                    if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
                    if (assigneeFilter && assigneeFilter !== 'all') params.set('assigned_to', assigneeFilter);
                    if (createdByFilter && createdByFilter !== 'all') params.set('created_by', createdByFilter);
                    if (locationFilter && locationFilter !== 'all') params.set('office_location_id', locationFilter);
                    
                    const url = `/appointments/print${params.toString() ? '?' + params.toString() : ''}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-3 w-full"
                >
                  <Printer className="h-4 w-4" />
                  Print List
                </Button>
              </div>
            </div>
          </CardContent>
          )}
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No appointments found</p>
              </div>
            ) : (
              <>
                <div 
                  ref={tableContainerRef}
                  className={`overflow-x-auto touch-pan-x select-none ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{ WebkitOverflowScrolling: 'touch' }}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="border">Date & Time</TableHead>
                        <TableHead className="border">Customer</TableHead>
                        <TableHead className="border">Type</TableHead>
                        <TableHead className="border">Title</TableHead>
                        <TableHead className="border">Location</TableHead>
                        <TableHead className="border">Assigned To</TableHead>
                        <TableHead className="border">Status</TableHead>
                        <TableHead className="text-right sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.05)] z-10 border">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id} className="border">
                          {/* Date & Time */}
                          <TableCell className="whitespace-nowrap border">
                            <div className="flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium">
                                  {formatDate(appointment.start_datetime)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatTime(appointment.start_datetime)} - {formatTime(appointment.end_datetime)}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Customer */}
                          <TableCell className="border">
                            {appointment.customer ? (
                              <div>
                                <div className="text-sm font-medium">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(getCustomerViewUrl(appointment.customer!.id, appointment.customer!.status || appointment.customer!.customer_type));
                                    }}
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                  >
                                    {appointment.customer.first_name} {appointment.customer.last_name}
                                  </button>
                                </div>
                                {appointment.customer.email && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {appointment.customer.email}
                                  </div>
                                )}
                                {appointment.customer.cell_phone && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {appointment.customer.cell_phone}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No customer</span>
                            )}
                          </TableCell>

                          {/* Type */}
                          <TableCell className="border">
                            <span className="text-sm">{getTypeLabel(appointment.appointment_type)}</span>
                          </TableCell>

                          {/* Title */}
                          <TableCell className="border">
                            <div className="max-w-xs">
                              <div className="text-sm font-medium truncate">{appointment.title}</div>
                              {appointment.description && (
                                <div className="text-xs text-gray-500 truncate">{stripHtml(appointment.description)}</div>
                              )}
                            </div>
                          </TableCell>

                          {/* Location */}
                          <TableCell className="border">
                            {appointment.office_location ? (
                              <div className="flex items-start gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                                <div className="max-w-[200px]">
                                  <div className="font-medium truncate">{appointment.office_location.name}</div>
                                  {appointment.office_location.address && (
                                    <div className="text-xs text-gray-500 truncate">{appointment.office_location.address}</div>
                                  )}
                                </div>
                              </div>
                            ) : appointment.location ? (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-[150px]">{appointment.location}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>

                          {/* Assigned To */}
                          <TableCell className="border">
                            {appointment.assigned_user ? (
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-3 w-3 text-gray-400" />
                                <span>
                                  {appointment.assigned_user.first_name} {appointment.assigned_user.last_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Unassigned</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="border">
                            {getStatusBadge(appointment.status)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.05)] z-10 border">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleAppointmentClick(appointment)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {/* <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {permissions?.canEdit && (
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {permissions?.canDelete && (
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu> */}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalRecords)} of {totalRecords} appointments
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Rows per page:</span>
                      <Select
                        value={perPage.toString()}
                        onValueChange={(value) => {
                          setPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                        
                        if (endPage - startPage < maxVisible - 1) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }
                        
                        if (startPage > 1) {
                          pages.push(
                            <Button
                              key={1}
                              variant={currentPage === 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                              className="w-8 h-8 p-0"
                            >
                              1
                            </Button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis-1" className="text-gray-400 px-1">...</span>
                            );
                          }
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(i)}
                              className="w-8 h-8 p-0"
                            >
                              {i}
                            </Button>
                          );
                        }
                        
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis-2" className="text-gray-400 px-1">...</span>
                            );
                          }
                          pages.push(
                            <Button
                              key={totalPages}
                              variant={currentPage === totalPages ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-8 h-8 p-0"
                            >
                              {totalPages}
                            </Button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          open={showAppointmentDetails}
          onOpenChange={setShowAppointmentDetails}
          onAppointmentUpdated={handleAppointmentUpdated}
          onAppointmentDeleted={handleAppointmentDeleted}
        />
      </div>
    );
  }
);
