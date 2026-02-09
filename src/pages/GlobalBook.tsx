import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  PhoneOff, 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Filter,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { globalBookService, GlobalBookFilters } from "@/services/globalBookService";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { format } from "date-fns";

export default function GlobalBook() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"client-book" | "dont-call-list">("client-book");
  
  // Filters for Client Book
  const [clientBookFilters, setClientBookFilters] = useState<GlobalBookFilters>({
    search: "",
    status: "",
    per_page: 25,
    page: 1,
    sortBy: "created_at",
    sortDirection: "desc",
  });

  // Filters for Don't Call List
  const [dontCallFilters, setDontCallFilters] = useState<GlobalBookFilters>({
    search: "",
    status: "",
    per_page: 25,
    page: 1,
    sortBy: "created_at",
    sortDirection: "desc",
  });

  // Fetch Client Book data
  const {
    data: clientBookResponse,
    isLoading: clientBookLoading,
    error: clientBookError,
    refetch: refetchClientBook,
  } = useQuery({
    queryKey: ["clientBook", clientBookFilters],
    queryFn: () => globalBookService.getClientBook(clientBookFilters),
  });

  // Extract data and pagination for Client Book
  const clientBookData = clientBookResponse?.data;
  const clientBookMeta = clientBookResponse?.pagination;

  // Fetch Don't Call List data
  const {
    data: dontCallResponse,
    isLoading: dontCallLoading,
    error: dontCallError,
    refetch: refetchDontCall,
  } = useQuery({
    queryKey: ["dontCallList", dontCallFilters],
    queryFn: () => globalBookService.getDontCallList(dontCallFilters),
  });

  // Extract data and pagination for Don't Call List
  const dontCallData = dontCallResponse?.data;
  const dontCallMeta = dontCallResponse?.pagination;

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["globalBookStatistics"],
    queryFn: () => globalBookService.getGlobalBookStatistics(),
  });

  const handleClientBookSearch = (value: string) => {
    setClientBookFilters({ ...clientBookFilters, search: value, page: 1 });
  };

  const handleDontCallSearch = (value: string) => {
    setDontCallFilters({ ...dontCallFilters, search: value, page: 1 });
  };

  const handleClientBookStatusFilter = (value: string) => {
    setClientBookFilters({ 
      ...clientBookFilters, 
      status: value === "all" ? "" : value, 
      page: 1 
    });
  };

  const handleDontCallStatusFilter = (value: string) => {
    setDontCallFilters({ 
      ...dontCallFilters, 
      status: value === "all" ? "" : value, 
      page: 1 
    });
  };

  const handleClientBookPageSizeChange = (value: string) => {
    setClientBookFilters({ 
      ...clientBookFilters, 
      per_page: parseInt(value), 
      page: 1 
    });
  };

  const handleDontCallPageSizeChange = (value: string) => {
    setDontCallFilters({ 
      ...dontCallFilters, 
      per_page: parseInt(value), 
      page: 1 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Client":
        return "bg-green-100 text-green-800";
      case "Prospect":
        return "bg-blue-100 text-blue-800";
      case "Former":
        return "bg-yellow-100 text-yellow-800";
      case "Deceased":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExport = (data: any[] | undefined, type: "client-book" | "dont-call-list") => {
    if (!data || data.length === 0) {
      return;
    }

    const csvHeaders = [
      "Customer Number",
      "Name",
      "Email",
      "Cell Phone",
      "Location",
      "Status",
      "Total Policies",
      "Active Policies",
      "Added Date"
    ];

    const csvRows = data.map(customer => [
      customer.customerNumber || "",
      customer.name || "",
      customer.email || "",
      customer.cellPhone || "",
      [customer.city, customer.state].filter(Boolean).join(", "),
      customer.status || "",
      customer.totalPoliciesCount || 0,
      customer.activePoliciesCount || 0,
      customer.createdAt ? format(new Date(customer.createdAt), "MMM d, yyyy") : ""
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${type}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = (
    data: any[] | undefined,
    loading: boolean,
    error: any,
    filters: GlobalBookFilters,
    setFilters: (filters: GlobalBookFilters) => void,
    onSearch: (value: string) => void,
    onStatusFilter: (value: string) => void,
    onPageSizeChange: (value: string) => void,
    onRefetch: () => void,
    pagination: any,
    type: "client-book" | "dont-call-list"
  ) => {
    if (loading && !data) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load data"}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone, or customer number..."
              value={filters.search || ""}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filters.status || "all"} onValueChange={onStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Client">Client</SelectItem>
              <SelectItem value="Prospect">Prospect</SelectItem>
              <SelectItem value="Former">Former</SelectItem>
              <SelectItem value="Deceased">Deceased</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => handleExport(data, type)} 
            variant="outline"
            disabled={!data || data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={onRefetch} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        {data && data.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Policies</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((customer: any) => (
                  <TableRow 
                    key={customer.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(getCustomerViewUrl(customer.id, customer.status))}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            #{customer.customerNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{customer.email}</span>
                          </div>
                        )}
                        {customer.cellPhone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{customer.cellPhone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.city || customer.state ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">
                            {[customer.city, customer.state].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {customer.totalPoliciesCount || 0} total
                        </div>
                        <div className="text-gray-500">
                          {customer.activePoliciesCount || 0} active
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {customer.createdAt 
                          ? format(new Date(customer.createdAt), "MMM d, yyyy")
                          : "—"
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(getCustomerViewUrl(customer.id, customer.status));
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <p className="text-gray-500">No customers found</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total || 0} customers
              </div>
              <Select value={String(filters.per_page || 25)} onValueChange={onPageSizeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                disabled={pagination.current_page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.last_page || 1) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={filters.page === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, page })}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  );
                })}
                {(pagination.last_page || 1) > 5 && (
                  <>
                    <span className="text-gray-400 px-2">...</span>
                    <Button
                      variant={filters.page === (pagination.last_page || 1) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, page: pagination.last_page || 1 })}
                      className="w-10"
                    >
                      {pagination.last_page || 1}
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={pagination.current_page === pagination.last_page}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`${isMobile ? "pt-20 px-3 pb-3" : "p-4 sm:p-8"} max-w-7xl mx-auto space-y-6`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Global Book</h1>
            <p className="text-gray-600 mt-1">
              Manage your client book and don't call list
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Client Book</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.data.clientBook.total}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {statistics.data.clientBook.clients} clients, {statistics.data.clientBook.prospects} prospects
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Don't Call List</CardTitle>
                <PhoneOff className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.data.dontCallList.total}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {statistics.data.dontCallList.clients} clients, {statistics.data.dontCallList.prospects} prospects
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="client-book" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Client Book
            </TabsTrigger>
            <TabsTrigger value="dont-call-list" className="flex items-center gap-2">
              <PhoneOff className="h-4 w-4" />
              Don't Call List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client-book" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Book</CardTitle>
                <CardDescription>
                  Customers who are actively engaged and included in client book
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTable(
                  clientBookData,
                  clientBookLoading,
                  clientBookError,
                  clientBookFilters,
                  setClientBookFilters,
                  handleClientBookSearch,
                  handleClientBookStatusFilter,
                  handleClientBookPageSizeChange,
                  refetchClientBook,
                  clientBookMeta,
                  "client-book"
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dont-call-list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Don't Call List</CardTitle>
                <CardDescription>
                  Customers who have mark as to include in dont call list and should not be contacted
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTable(
                  dontCallData,
                  dontCallLoading,
                  dontCallError,
                  dontCallFilters,
                  setDontCallFilters,
                  handleDontCallSearch,
                  handleDontCallStatusFilter,
                  handleDontCallPageSizeChange,
                  refetchDontCall,
                  dontCallMeta,
                  "dont-call-list"
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
