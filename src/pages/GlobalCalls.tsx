import { useState, useEffect } from "react";
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
  Printer,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CallDetailsDialog } from "@/components/dialogs/CallDetailsDialog";
import { DateInput } from "@/components/ui/date-input";
import {
  customerActivitiesService,
  CustomerActivity,
} from "@/services/customerActivitiesService";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Customer {
  id: number;
  customer_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
}

interface ActivityWithCustomer extends CustomerActivity {
  customer?: Customer;
}

export default function GlobalCalls() {
  const [calls, setCalls] = useState<ActivityWithCustomer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerType, setCustomerType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
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

  // Load users for dropdowns
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get('/users', { params: { active: true } });
        if (response.data.success) {
          // Filter active users and sort alphabetically
          const activeUsers = response.data.data
            .filter((user: any) => user.status === 'active')
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
      
      if (response.data.success) {
        setCreateCustomers(response.data.data);
      }
    } catch (err) {
      console.error("Error searching customers:", err);
    }
  };

  // Debounce customer search for create dialog
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCreateCustomers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [createSearchTerm, createCustomerType]);

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
  }, [currentPage, startDate, endDate, customerType]);

  const handleManualRefresh = () => {
    loadCalls();
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

      if (!callTitle) {
        toast({
          title: "Error",
          description: "Please enter a call title",
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

  const incomingCalls = calls.filter(
    (call) => call.activity_type === "Incoming Call"
  );
  const outgoingCalls = calls.filter(
    (call) => call.activity_type === "Outgoing Call"
  );

  const renderCallCard = (call: ActivityWithCustomer) => {
    const isAnswerCall = call.parent_activity_id !== null && call.parent_activity_id !== undefined;
    const customerName = call.customer 
      ? `${call.customer.first_name} ${call.customer.last_name}`
      : selectedCustomerName;
    const customerId = call.customer?.id || selectedCustomerId;

    return (
      <Card key={call.id} className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {call.activity_type === "Incoming Call" ? (
                <PhoneIncoming className="h-4 w-4 text-green-600" />
              ) : (
                <PhoneOutgoing className="h-4 w-4 text-blue-600" />
              )}
              <Badge
                variant={
                  call.activity_type === "Incoming Call" ? "default" : "secondary"
                }
                className="text-xs"
              >
                {call.activity_type}
              </Badge>
              <span className="text-sm text-gray-600">
                {customerActivitiesService.formatActivityDateTime(
                  call.activity_date,
                  call.activity_time,
                )}
              </span>
              {isAnswerCall && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Answer Call
                </Badge>
              )}
              {call.customer && (
                <Badge variant="outline" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {customerName}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {customerId && (
                <CallDetailsDialog
                  call={call}
                  customerName={customerName}
                  customerId={customerId}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{call.title}</p>
            <p className="text-sm text-gray-700">{call.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div>
                Performed by:{" "}
                {customerActivitiesService.getFullName(call.performer) || "Unknown"}
              </div>
              {(call.calledForUser || call.called_for_user) && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Called For:</span>
                  <span>
                    {(call.calledForUser || call.called_for_user)!.first_name} {(call.calledForUser || call.called_for_user)!.last_name}
                    {(call.calledForUser || call.called_for_user)!.email && (
                      <span className="text-gray-400 ml-1">
                        ({(call.calledForUser || call.called_for_user)!.email})
                      </span>
                    )}
                  </span>
                </div>
              )}
              {((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user) && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Forwarded To:</span>
                  <span>
                    {(((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.first_name)} {(((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.last_name)}
                    {(((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.email) && (
                      <span className="text-gray-400 ml-1">
                        ({((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.email})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCallsList = (callsList: ActivityWithCustomer[], emptyMessage: string) => (
    <div className="space-y-4">
      {callsList.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        callsList.map(renderCallCard)
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Global Call Logs</h1>
          <p className="text-gray-500 mt-1">View call logs across all customers</p>
        </div>
        {selectedCustomerId && (
          <LogCallDialog
            customerId={selectedCustomerId}
            customerName={selectedCustomerName}
            onLogCall={handleLogCall}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Call
              </Button>
            }
          />
        )}
      </div>

      {/* Customer Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Customer Type</label>
              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="Client">Clients</SelectItem>
                  <SelectItem value="Former">Former</SelectItem>
                  <SelectItem value="Prospect">Prospects</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer Search */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Search by Name, Email, or Phone
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  disabled={!!selectedCustomerId}
                />
              </div>

              {/* Customer Search Results Dropdown */}
              {customers.length > 0 && !selectedCustomerId && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {customer.first_name} {customer.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {customer.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Customer Display */}
          {selectedCustomerId && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Selected Customer:</p>
                  <p className="text-sm text-blue-700">{selectedCustomerName}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearCustomer}>
                Change Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Call Logs */}
      <>
        <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* From Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <DateInput
                    value={startDate}
                    onChange={(value) => setStartDate(value || "")}
                    placeholder="From date"
                    className="w-full"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <DateInput
                    value={endDate}
                    onChange={(value) => setEndDate(value || "")}
                    placeholder="To date"
                    className="w-full"
                    minDate={startDate ? new Date(startDate) : undefined}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={loading || silentRefresh}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${(loading || silentRefresh) ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
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
                      const queryString = params.toString();
                      window.open(`/calls/print${queryString ? `?${queryString}` : ''}`, '_blank');
                    }}
                    title="Print call logs"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>

                  {(startDate || endDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading call logs...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-red-500">{error}</p>
                <Button variant="outline" onClick={handleManualRefresh} className="mt-4">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="incoming" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="incoming" className="flex items-center gap-2">
                  <PhoneIncoming className="h-4 w-4" />
                  Incoming Calls ({incomingCalls.length})
                </TabsTrigger>
                <TabsTrigger value="outgoing" className="flex items-center gap-2">
                  <PhoneOutgoing className="h-4 w-4" />
                  Outgoing Calls ({outgoingCalls.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="incoming" className="mt-4">
                {renderCallsList(incomingCalls, "No incoming calls yet")}
              </TabsContent>

              <TabsContent value="outgoing" className="mt-4">
                {renderCallsList(outgoingCalls, "No outgoing calls yet")}
              </TabsContent>
            </Tabs>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
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
          )}
      </>

      {!loading && !error && calls.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <PhoneIncoming className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">
              {selectedCustomerId 
                ? "No call logs found for this customer"
                : "No call logs found"}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {selectedCustomerId 
                ? "Try adjusting the filters or log a new call"
                : "Use the filters above to narrow down call logs or select a customer"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
