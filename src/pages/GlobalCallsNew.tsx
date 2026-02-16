import { useState, useEffect } from "react";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
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
  PhoneIncoming,
  PhoneOutgoing,
  Eye,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Printer,
  Check,
  ChevronsUpDown,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CallDetailsDialog } from "@/components/dialogs/CallDetailsDialog";
import { DateInput } from "@/components/ui/date-input";
import {
  customerActivitiesService,
  CustomerActivity,
} from "@/services/customerActivitiesService";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Customer {
  id: number;
  customer_number: string;
  first_name: string;
  last_name: string;
  email: string;
  cell_phone?: string;
  home_phone?: string;
  work_phone?: string;
  status: string;
}

interface ActivityWithCustomer extends CustomerActivity {
  customer?: Customer;
}

export default function GlobalCalls() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [calls, setCalls] = useState<ActivityWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerType, setCustomerType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Additional Filters
  const [performedByFilter, setPerformedByFilter] = useState<string>("all");
  const [calledForFilter, setCalledForFilter] = useState<string>("all");
  const [customerSearchFilter, setCustomerSearchFilter] = useState<string>("");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<Customer | null>(null);
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  
  // Create Call Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createCustomerType, setCreateCustomerType] = useState<string>("Client");
  const [createSearchTerm, setCreateSearchTerm] = useState("");
  const [createCustomers, setCreateCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Call Form State
  const [callType, setCallType] = useState<string>("Incoming Call");
  const [callTitle, setCallTitle] = useState("");
  const [callDescription, setCallDescription] = useState("");
  const [callDate, setCallDate] = useState(new Date().toISOString().split('T')[0]);
  const [callTime, setCallTime] = useState(new Date().toTimeString().slice(0, 5));
  const [duration, setDuration] = useState("0");
  const [outcome, setOutcome] = useState("completed");
  const [priority, setPriority] = useState("Medium");
  const [callStatus, setCallStatus] = useState("Completed");
  const [notes, setNotes] = useState("");
  const [calledForUserId, setCalledForUserId] = useState<string>("");
  const [forwardedToUserId, setForwardedToUserId] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [calledForSearchOpen, setCalledForSearchOpen] = useState(false);
  const [forwardedToSearchOpen, setForwardedToSearchOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<ActivityWithCustomer | null>(null);
  const [originalForwardedToUserId, setOriginalForwardedToUserId] = useState<string>("");

  // Load users for dropdowns
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get('/users', { params: { active: true } });
        if (response.data.success) {
          // Filter active non-agent users and sort alphabetically
          const activeUsers = response.data.data
            .filter((user: any) => user.is_active === true && user.is_agent !== true)
            .sort((a: any, b: any) => {
              const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
              const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
              return nameA.localeCompare(nameB);
            });
          setUsers(activeUsers);
        }
      } catch (err) {
        console.error("Error loading users:", err);
      }
    };
    loadUsers();
  }, []);

  // Search customers for create dialog
  const searchCreateCustomers = async () => {
    if (!createSearchTerm || createSearchTerm.length < 2) {
      setCreateCustomers([]);
      return;
    }

    try {
      const filters: any = {
        search: createSearchTerm,
        per_page: 10,
        status: createCustomerType,
      };

      const response = await api.get('/customers', { params: filters });
      
      // Handle paginated response structure
      if (response.data.data) {
        setCreateCustomers(response.data.data);
      } else if (Array.isArray(response.data)) {
        setCreateCustomers(response.data);
      }
    } catch (err) {
      console.error("Error searching customers:", err);
      setCreateCustomers([]);
    }
  };

  // Debounce customer search for create dialog
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCreateCustomers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [createSearchTerm, createCustomerType]);

  // Search customers for filter
  const searchFilterCustomers = async () => {
    if (!customerSearchFilter || customerSearchFilter.length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    try {
      const filters: any = {
        search: customerSearchFilter,
        per_page: 10,
      };

      const response = await api.get('/customers', { params: filters });
      
      if (response.data.data) {
        setCustomerSearchResults(response.data.data);
      } else if (Array.isArray(response.data)) {
        setCustomerSearchResults(response.data);
      }
    } catch (err) {
      console.error("Error searching customers:", err);
      setCustomerSearchResults([]);
    }
  };

  // Debounce customer search for filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFilterCustomers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [customerSearchFilter]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: currentPage,
        per_page: 20,
      };

      // Add customer status filter
      if (customerType !== "all") {
        filters.customer_status = customerType;
      }

      if (startDate) {
        filters.start_date = startDate;
      }

      if (endDate) {
        filters.end_date = endDate;
      }
      
      if (performedByFilter && performedByFilter !== "all") {
        filters.performed_by = performedByFilter;
      }
      
      if (calledForFilter && calledForFilter !== "all") {
        filters.called_for_user_id = calledForFilter;
      }

      if (selectedCustomerFilter) {
        filters.customer_id = selectedCustomerFilter.id;
      }

      // Use global activities endpoint
      const response = await api.get('/activities/global', { params: filters });

      if (response.data.success) {
        setCalls(response.data.data);
        setTotalPages(response.data.pagination.last_page);
        setTotalRecords(response.data.pagination.total);
      } else {
        setError("Failed to load call logs");
      }
    } catch (err) {
      setError("An error occurred while loading call logs");
      console.error("Error loading calls:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [currentPage, startDate, endDate, customerType, performedByFilter, calledForFilter, selectedCustomerFilter]);

  const handleManualRefresh = () => {
    loadCalls();
    toast({
      title: "Refreshed",
      description: "Call logs have been refreshed",
    });
  };

  const resetCreateForm = () => {
    setSelectedCustomer(null);
    setCreateSearchTerm("");
    setCreateCustomers([]);
    setCallType("Incoming Call");
    setCallTitle("");
    setCallDescription("");
    setCallDate(new Date().toISOString().split('T')[0]);
    setCallTime(new Date().toTimeString().slice(0, 5));
    setDuration("0");
    setOutcome("completed");
    setPriority("Medium");
    setCallStatus("Completed");
    setNotes("");
    setCalledForUserId("");
    setForwardedToUserId("");
    setOriginalForwardedToUserId("");
  };

  const handleCreateCall = async () => {
    try {
      if (!selectedCustomer) {
        toast({
          title: "Error",
          description: "Please select a customer first",
          variant: "destructive",
        });
        return;
      }

      if (!callDescription) {
        toast({
          title: "Error",
          description: "Please enter a description",
          variant: "destructive",
        });
        return;
      }

      const callData = {
        activity_type: callType,
        title: callTitle,
        description: callDescription,
        activity_date: callDate,
        activity_time: callTime,
        duration_minutes: parseInt(duration) || 0,
        outcome,
        priority,
        status: callStatus,
        notes,
        called_for_user_id: calledForUserId || null,
        call_forwarded_to_user_id: forwardedToUserId || null,
      };

      const response = await customerActivitiesService.createActivity(
        selectedCustomer.id,
        callData,
      );
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Call logged successfully",
        });
        setIsCreateDialogOpen(false);
        resetCreateForm();
        await loadCalls();
        
        // Refresh notifications only if a new call was forwarded (not previously forwarded)
        if (forwardedToUserId) {
          // Add small delay to ensure backend notification is created
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshNotifications'));
          }, 500);
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to log call",
        variant: "destructive",
      });
      console.error("Error creating call:", err);
    }
  };
  
  const handleEditCall = (call: ActivityWithCustomer) => {
    setEditingCall(call);
    setSelectedCustomer(call.customer || null);
    setCallType(call.activity_type);
    setCallTitle(call.title);
    setCallDescription(call.description || "");
    setCallDate(call.activity_date ? new Date(call.activity_date).toISOString().split('T')[0] : "");
    setCallTime(call.activity_time || "");
    setDuration(call.duration_minutes?.toString() || "0");
    setOutcome(call.outcome || "completed");
    setPriority(call.priority || "Medium");
    setCallStatus(call.status || "Completed");
    setNotes(call.notes || "");
    setCalledForUserId(call.called_for_user_id || "");
    setForwardedToUserId(call.call_forwarded_to_user_id || "");
    // Store original forwarded user to detect changes
    setOriginalForwardedToUserId(call.call_forwarded_to_user_id || "");
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateCall = async () => {
    try {
      if (!editingCall || !editingCall.customer) {
        toast({
          title: "Error",
          description: "Invalid call data",
          variant: "destructive",
        });
        return;
      }

      if (!callDescription) {
        toast({
          title: "Error",
          description: "Please enter a description",
          variant: "destructive",
        });
        return;
      }

      const callData = {
        activity_type: callType,
        title: callTitle,
        description: callDescription,
        activity_date: callDate,
        activity_time: callTime,
        duration_minutes: parseInt(duration) || 0,
        outcome,
        priority,
        status: callStatus,
        notes,
        called_for_user_id: calledForUserId || null,
        call_forwarded_to_user_id: forwardedToUserId || null,
      };

      const response = await customerActivitiesService.updateActivity(
        editingCall.customer.id,
        editingCall.id,
        callData,
      );
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Call updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingCall(null);
        resetCreateForm();
        await loadCalls();
        
        // Refresh notifications only if forwarded user changed
        // Scenarios:
        // 1. No forwarded before, now forwarded (originalForwardedToUserId is empty, forwardedToUserId has value)
        // 2. Forwarded user changed (originalForwardedToUserId != forwardedToUserId)
        // 3. Forwarded was removed (originalForwardedToUserId has value, forwardedToUserId is empty) - no notification needed
        const forwardedUserChanged = originalForwardedToUserId !== forwardedToUserId;
        const newForwardAssigned = !originalForwardedToUserId && forwardedToUserId;
        const forwardReassigned = originalForwardedToUserId && forwardedToUserId && forwardedUserChanged;
        
        if (newForwardAssigned || forwardReassigned) {
          // Add small delay to ensure backend notification is created
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshNotifications'));
          }, 500);
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update call",
        variant: "destructive",
      });
      console.error("Error updating call:", err);
    }
  };

  return (
    <div className="container mx-auto py-3 md:py-6 px-3 md:px-4 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Global Call Logs</h1>
          <p className="text-gray-500 mt-1">View call logs across all customers</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button variant="outline" onClick={handleManualRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams();
              if (customerType && customerType !== 'all') {
                params.set('customerType', customerType);
              }
              if (startDate) {
                params.set('startDate', startDate);
              }
              if (endDate) {
                params.set('endDate', endDate);
              }
              if (performedByFilter && performedByFilter !== 'all') {
                params.set('performedBy', performedByFilter);
              }
              if (calledForFilter && calledForFilter !== 'all') {
                params.set('calledFor', calledForFilter);
              }
              if (selectedCustomerFilter) {
                params.set('customerId', selectedCustomerFilter.id.toString());
              }
              const queryString = params.toString();
              window.open(`/calls/print${queryString ? `?${queryString}` : ''}`, '_blank');
            }}
            title="Print call logs"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Call Log
              </Button>
            </DialogTrigger>
            <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[95vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
            <DialogHeader>
              <DialogTitle>Create Call Log</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Customer Type */}
              <div>
                <Label>Customer Type *</Label>
                <Select value={createCustomerType} onValueChange={setCreateCustomerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Former">Former</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Search/Select */}
              <div>
                <Label>Customer *</Label>
                {!selectedCustomer ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={createSearchTerm}
                        onChange={(e) => setCreateSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    {createCustomers.length > 0 && (
                      <div className="bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {createCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCreateCustomers([]);
                              setCreateSearchTerm("");
                            }}
                          >
                            <p className="font-medium">
                              {customer.first_name} {customer.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{customer.email}</p>
                            <Badge variant="outline" className="mt-1 text-xs">{customer.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {createSearchTerm.length >= 2 && createCustomers.length === 0 && (
                      <p className="text-sm text-gray-500 py-2">No customers found. Try a different search term.</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-blue-900">
                          {selectedCustomer.first_name} {selectedCustomer.last_name}
                        </p>
                        <p className="text-sm text-blue-700">{selectedCustomer.email}</p>
                        <Badge variant="outline" className="mt-1 text-xs">{selectedCustomer.status}</Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                        Change
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Type */}
              <div>
                <Label>Call Type *</Label>
                <Select value={callType} onValueChange={setCallType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Incoming Call">Incoming Call</SelectItem>
                    <SelectItem value="Outgoing Call">Outgoing Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Called For and Forwarded To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Called For</Label>
                  <Popover open={calledForSearchOpen} onOpenChange={setCalledForSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={calledForSearchOpen} className="w-full justify-between">
                        {calledForUserId ? users.find((user) => user.id === calledForUserId) ? `${users.find((user) => user.id === calledForUserId)?.first_name} ${users.find((user) => user.id === calledForUserId)?.last_name}` : "Select user" : "None"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="none" onSelect={() => { setCalledForUserId(""); setCalledForSearchOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", !calledForUserId ? "opacity-100" : "opacity-0")} />
                              None
                            </CommandItem>
                            {users.map((user) => (
                              <CommandItem key={user.id} value={`${user.id}-${user.first_name} ${user.last_name}`} keywords={[user.first_name || '', user.last_name || '', user.email || '']} onSelect={() => { setCalledForUserId(user.id); setCalledForSearchOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", calledForUserId === user.id ? "opacity-100" : "opacity-0")} />
                                {user.first_name} {user.last_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Forwarded To</Label>
                  <Popover open={forwardedToSearchOpen} onOpenChange={setForwardedToSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={forwardedToSearchOpen} className="w-full justify-between">
                        {forwardedToUserId ? users.find((user) => user.id === forwardedToUserId) ? `${users.find((user) => user.id === forwardedToUserId)?.first_name} ${users.find((user) => user.id === forwardedToUserId)?.last_name}` : "Select user" : "None"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="none" onSelect={() => { setForwardedToUserId(""); setForwardedToSearchOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", !forwardedToUserId ? "opacity-100" : "opacity-0")} />
                              None
                            </CommandItem>
                            {users.map((user) => (
                              <CommandItem key={user.id} value={`${user.id}-${user.first_name} ${user.last_name}`} keywords={[user.first_name || '', user.last_name || '', user.email || '']} onSelect={() => { setForwardedToUserId(user.id); setForwardedToSearchOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", forwardedToUserId === user.id ? "opacity-100" : "opacity-0")} />
                                {user.first_name} {user.last_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={callDescription}
                  onChange={(e) => setCallDescription(e.target.value)}
                  placeholder="Enter call details..."
                  rows={3}
                />
              </div>

              {/* Date and Time */}
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                <div>
                  <Label>Date *</Label>
                  <DateInput
                    value={callDate}
                    onChange={(value) => setCallDate(value || new Date().toISOString().split('T')[0])}
                    placeholder="Select date"
                  />
                </div>
                <div>
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={callTime}
                    onChange={(e) => setCallTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetCreateForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateCall} disabled={!selectedCustomer || !callDescription}>
                Create Call Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Call Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[95vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
            <DialogHeader>
              <DialogTitle>Edit Call Log</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Customer Type */}
              <div>
                <Label>Customer Type *</Label>
                <Select value={createCustomerType} onValueChange={setCreateCustomerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Former">Former</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Customer (Read-only in edit mode) */}
              {selectedCustomer && (
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div>
                    <p className="font-medium text-blue-900">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </p>
                    <p className="text-sm text-blue-700">{selectedCustomer.email}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{selectedCustomer.status}</Badge>
                  </div>
                </div>
              )}

              {/* Call Type */}
              <div>
                <Label>Call Type *</Label>
                <Select value={callType} onValueChange={setCallType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Incoming Call">Incoming Call</SelectItem>
                    <SelectItem value="Outgoing Call">Outgoing Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Called For and Forwarded To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Called For</Label>
                  <Popover open={calledForSearchOpen} onOpenChange={setCalledForSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={calledForSearchOpen} className="w-full justify-between">
                        {calledForUserId ? users.find((user) => user.id === calledForUserId) ? `${users.find((user) => user.id === calledForUserId)?.first_name} ${users.find((user) => user.id === calledForUserId)?.last_name}` : "Select user" : "None"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="none" onSelect={() => { setCalledForUserId(""); setCalledForSearchOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", !calledForUserId ? "opacity-100" : "opacity-0")} />
                              None
                            </CommandItem>
                            {users.map((user) => (
                              <CommandItem key={user.id} value={`${user.id}-${user.first_name} ${user.last_name}`} keywords={[user.first_name || '', user.last_name || '', user.email || '']} onSelect={() => { setCalledForUserId(user.id); setCalledForSearchOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", calledForUserId === user.id ? "opacity-100" : "opacity-0")} />
                                {user.first_name} {user.last_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Forwarded To</Label>
                  <Popover open={forwardedToSearchOpen} onOpenChange={setForwardedToSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={forwardedToSearchOpen} className="w-full justify-between">
                        {forwardedToUserId ? users.find((user) => user.id === forwardedToUserId) ? `${users.find((user) => user.id === forwardedToUserId)?.first_name} ${users.find((user) => user.id === forwardedToUserId)?.last_name}` : "Select user" : "None"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="none" onSelect={() => { setForwardedToUserId(""); setForwardedToSearchOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", !forwardedToUserId ? "opacity-100" : "opacity-0")} />
                              None
                            </CommandItem>
                            {users.map((user) => (
                              <CommandItem key={user.id} value={`${user.id}-${user.first_name} ${user.last_name}`} keywords={[user.first_name || '', user.last_name || '', user.email || '']} onSelect={() => { setForwardedToUserId(user.id); setForwardedToSearchOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", forwardedToUserId === user.id ? "opacity-100" : "opacity-0")} />
                                {user.first_name} {user.last_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={callDescription}
                  onChange={(e) => setCallDescription(e.target.value)}
                  placeholder="Enter call details..."
                  rows={3}
                />
              </div>

              {/* Date and Time */}
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                <div>
                  <Label>Date *</Label>
                  <DateInput
                    value={callDate}
                    onChange={(value) => setCallDate(value || "")}
                    placeholder="Select date"
                  />
                </div>
                <div>
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={callTime}
                    onChange={(e) => setCallTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingCall(null);
                resetCreateForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCall} disabled={!callDescription}>
                Update Call Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        {isMobile && (
          <div className="p-3 border-b">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full justify-between"
            >
              <span>Filters {(startDate || endDate || customerType !== "all" || performedByFilter !== "all" || calledForFilter !== "all" || selectedCustomerFilter) ? '(Active)' : ''}</span>
              <span>{showMobileFilters ? '−' : '+'}</span>
            </Button>
          </div>
        )}
        <CardContent className={`p-3 md:p-4 ${isMobile && !showMobileFilters ? 'hidden' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 items-end">
            <div>
              <Label>Customer</Label>
              {!selectedCustomerFilter ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search customer..."
                      value={customerSearchFilter}
                      onChange={(e) => setCustomerSearchFilter(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  {customerSearchResults.length > 0 && (
                    <div className="absolute z-50 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto w-full">
                      {customerSearchResults.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedCustomerFilter(customer);
                            setCustomerSearchResults([]);
                            setCustomerSearchFilter("");
                          }}
                        >
                          <p className="font-medium text-sm">
                            {customer.first_name} {customer.last_name}
                          </p>
                          <p className="text-xs text-gray-600">{customer.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                  <span className="text-sm flex-1 truncate">
                    {selectedCustomerFilter.first_name} {selectedCustomerFilter.last_name}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedCustomerFilter(null)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>Customer Type</Label>
              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="Client">Clients</SelectItem>
                  <SelectItem value="Former">Former</SelectItem>
                  <SelectItem value="Prospect">Prospects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From Date</Label>
              <DateInput
                value={startDate}
                onChange={(value) => setStartDate(value || "")}
                placeholder="From date"
              />
            </div>
            <div>
              <Label>To Date</Label>
              <DateInput
                value={endDate}
                onChange={(value) => setEndDate(value || "")}
                placeholder="To date"
                minDate={startDate ? new Date(startDate) : undefined}
              />
            </div>
            <div>
              <Label>Performed By</Label>
              <Select value={performedByFilter} onValueChange={setPerformedByFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Called For</Label>
              <Select value={calledForFilter} onValueChange={setCalledForFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(startDate || endDate || customerType !== "all" || performedByFilter !== "all" || calledForFilter !== "all" || selectedCustomerFilter) && (
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => {
                setStartDate("");
                setEndDate("");
                setCustomerType("all");
                setPerformedByFilter("all");
                setCalledForFilter("all");
                setSelectedCustomerFilter(null);
                setCustomerSearchFilter("");
                setCurrentPage(1);
              }}>
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table View */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading call logs...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">{error}</p>
              <Button variant="outline" onClick={handleManualRefresh} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : calls.length === 0 ? (
            <div className="p-12 text-center">
              <PhoneIncoming className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 text-lg">No call logs found</p>
              <p className="text-gray-400 text-sm mt-2">
                Adjust filters or create a new call log
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[180px]">Customer</TableHead>
                    <TableHead className="hidden md:table-cell w-[120px]">Customer Type</TableHead>
                    <TableHead className="w-[140px]">Date & Time</TableHead>
                    <TableHead className="hidden lg:table-cell w-[130px]">Performed By</TableHead>
                    <TableHead className="hidden lg:table-cell w-[120px]">Called For</TableHead>
                    <TableHead className="hidden md:table-cell w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px] md:w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {call.activity_type === "Incoming Call" ? (
                            <PhoneIncoming className="h-4 w-4 text-green-600" />
                          ) : (
                            <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                          )}
                          <Badge variant={call.activity_type === "Incoming Call" ? "default" : "secondary"} className="text-xs">
                            {call.activity_type === "Incoming Call" ? "Incoming" : "Outgoing"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {call.customer ? (
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">
                                  {call.customer.first_name} {call.customer.last_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{call.customer.email}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(getCustomerViewUrl(call.customer!.id, call.customer!.status) + '?tab=calls')}
                                className="h-7 w-7 p-0 flex-shrink-0"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {call.customer ? (
                          <Badge variant="outline" className="text-xs">{call.customer.status}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(call.activity_date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-gray-500 text-xs">{call.activity_time ? new Date(`2000-01-01T${call.activity_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm">{customerActivitiesService.getFullName(call.performer) || "Unknown"}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {(call.calledForUser || call.called_for_user) ? (
                          <span className="text-sm">
                            {(call.calledForUser || call.called_for_user)!.first_name}{" "}
                            {(call.calledForUser || call.called_for_user)!.last_name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(call as any).child_activities && (call as any).child_activities.length > 0 ? (
                          <Badge variant="default" className="bg-green-600">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                          {call.customer && (
                            <>
                              <CallDetailsDialog
                                call={call}
                                customerName={`${call.customer.first_name} ${call.customer.last_name}`}
                                customerId={call.customer.id}
                                trigger={
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCall(call)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!call.parent_activity_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCustomer(call.customer || null);
                                    const title = call.activity_type === "Incoming Call" 
                                      ? "Answer Call - " + (call.title || call.description || "").substring(0, 30)
                                      : "Follow Up - " + (call.title || call.description || "").substring(0, 30);
                                    setCallTitle(title);
                                    setCallType(call.activity_type);
                                    setIsCreateDialogOpen(true);
                                  }}
                                  className="h-8 px-2 text-xs hidden sm:inline-flex"
                                >
                                  Answer
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 md:p-4 border-t">
                  <p className="text-xs md:text-sm text-gray-500 text-center sm:text-left">
                    Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalRecords)} of {totalRecords} call logs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
