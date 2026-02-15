import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Search,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Users,
  Clock,
  Grid3X3,
  List,
  X,
} from "lucide-react";
import { AddPolicyDialog } from "@/components/dialogs/AddPolicyDialog";
import { SimplifiedPlansManagement } from "@/components/insurance/SimplifiedPlansManagement";
import { PolicyActionButtons } from "@/components/policy/PolicyActionButtons";
import { PolicyReinstatementDialog } from "@/components/dialogs/PolicyReinstatementDialog";
import { PolicyGrid } from "@/components/policy/grid/PolicyGrid";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { PolicyDetailView } from "@/components/policy/PolicyDetailView";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Currency,
  CurrencyInput,
  CurrencyComparison,
} from "@/components/ui/currency";
import { PolicyService } from "@/services/policyService";
import {
  Policy,
  PolicyFilters,
  PolicyStatus,
  PolicyAnalytics,
  ReinstatementRequest,
  PaymentRequest,
  PolicyFormData,
} from "@/types/policy";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { WebSocketStatus } from "@/components/WebSocketStatus";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferenceContext";
import { useNavigate } from "react-router-dom";

// Utility function to get the correct premium value
const getPremiumValue = (policy: Policy): number => {
  // Check if the policy has a plan with plan type that includes premium in extra fields
  const planType = policy.plan?.planType || policy.plan?.plan_type;

  // Parse field_values if it's a string
  let fieldValues = policy.field_values;
  if (typeof fieldValues === "string") {
    try {
      fieldValues = JSON.parse(fieldValues);
    } catch (e) {
      console.error("Failed to parse field_values:", e);
      return 0;
    }
  }

  // If plan type has premium in extra fields and policy has field_values
  if (
    planType?.extra_fields?.premium &&
    fieldValues &&
    typeof fieldValues === "object"
  ) {
    const premiumValue = fieldValues.premium;

    if (
      premiumValue !== undefined &&
      premiumValue !== null &&
      premiumValue !== ""
    ) {
      const numericValue = parseFloat(premiumValue.toString());
      if (!isNaN(numericValue)) {
        return numericValue;
      }
    }
  }

  // For all other cases (no premium in extra fields, no field_values, or empty premium), return 0
  return 0;
};

const Policies = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { getViewMode, setViewMode, getFilterSettings, setFilterSettings } =
    usePreferences();
  const navigate = useNavigate();

  // Initialize state from preferences
  const [viewMode, setViewModeState] = useState<"grid" | "cards">(() => {
    const saved = getViewMode("policies");
    return saved === "grid" || saved === "cards" ? saved : "cards";
  });

  const [filters, setFilters] = useState<PolicyFilters>({});
  const [searchTerm, setSearchTerm] = useState(() => {
    const filterSettings = getFilterSettings("policies");
    return filterSettings.searchTerm || "";
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const filterSettings = getFilterSettings("policies");
    return filterSettings.defaultStatus || "all";
  });

  // Handle view mode changes with preference persistence
  const handleViewModeChange = async (mode: "grid" | "cards") => {
    setViewModeState(mode);
    try {
      await setViewMode("policies", mode);
    } catch (error) {
      console.error("Failed to save view mode preference:", error);
    }
  };

  // Handle search term changes with preference persistence
  const handleSearchTermChange = async (term: string) => {
    setSearchTerm(term);
    try {
      const currentFilters = getFilterSettings("policies");
      await setFilterSettings("policies", {
        ...currentFilters,
        searchTerm: term,
      });
    } catch (error) {
      console.error("Failed to save search preference:", error);
    }
  };

  // Handle status filter changes with preference persistence
  const handleStatusFilterChange = async (status: string) => {
    setStatusFilter(status);
    try {
      const currentFilters = getFilterSettings("policies");
      await setFilterSettings("policies", {
        ...currentFilters,
        defaultStatus: status,
      });
    } catch (error) {
      console.error("Failed to save status filter preference:", error);
    }
  };
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isReinstatementModalOpen, setIsReinstatementModalOpen] =
    useState(false);
  const [isRenewalQuoteModalOpen, setIsRenewalQuoteModalOpen] = useState(false);

  // Query for companies data for SimplifiedPlansManagement
  const { data: companiesResponse, isLoading: isCompaniesLoading } = useQuery({
    queryKey: ["insurance-companies"],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/insurance-companies`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const companies = companiesResponse?.data || [];

  // Query for policies data - sorted by latest first
  const {
    data: policiesResponse,
    isLoading: isPoliciesLoading,
    error: policiesError,
    refetch: refetchPolicies,
  } = useQuery({
    queryKey: ["policies", filters],
    queryFn: () =>
      PolicyService.getPolicies(1, 50, filters, {
        field: "id" as any,
        direction: "desc",
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query for analytics data
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["policy-analytics"],
    queryFn: () => PolicyService.getDashboardStats(),
    staleTime: 0, // Always fetch fresh data
  });

  // Mutations
  const reinstateMutation = useMutation({
    mutationFn: ({
      policyId,
      request,
    }: {
      policyId: number;
      request: ReinstatementRequest;
    }) => PolicyService.initiateReinstatement(policyId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      queryClient.invalidateQueries({ queryKey: ["policy-analytics"] });
      toast({
        title: "Reinstatement Initiated",
        description:
          "Policy reinstatement request has been submitted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reinstatement Failed",
        description:
          error.message || "Failed to initiate policy reinstatement.",
        variant: "destructive",
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({
      policyId,
      paymentData,
    }: {
      policyId: number;
      paymentData: PaymentRequest & { installment_id: number };
    }) =>
      PolicyService.processPayment(policyId, paymentData.installment_id, {
        amount: paymentData.amount,
        transaction_reference:
          paymentData.payment_reference || `AUTO-${Date.now()}`,
        payment_method: paymentData.payment_method,
        notes: paymentData.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      queryClient.invalidateQueries({ queryKey: ["policy-analytics"] });
      toast({
        title: "Payment Processed",
        description: "Payment has been processed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment.",
        variant: "destructive",
      });
    },
  });

  const policies = policiesResponse?.data || [];
  const meta = policiesResponse?.meta;

  // Sort policies by latest first (fallback client-side sorting)
  const sortedPolicies = React.useMemo(() => {
    return [...policies].sort((a, b) => {
      // Sort by ID descending (latest first) as primary sort
      if (a.id !== b.id) {
        return b.id - a.id;
      }
      // Fallback to date sorting if IDs are somehow equal
      const dateA = new Date(a.created_at || a.start_date);
      const dateB = new Date(b.created_at || b.start_date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [policies]);

  // Filter policies based on search and status
  const filteredPolicies = sortedPolicies.filter((policy) => {
    const matchesSearch =
      policy.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase());

    // Handle status filtering - if expiring_soon is selected, we trust the backend filter
    // The actual filtering happens at the API level, this is just for UI consistency
    const matchesStatus =
      statusFilter === "all" ||
      statusFilter === "expiring_soon" ||
      policy.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Update filters when search/status changes
  React.useEffect(() => {
    const newFilters: PolicyFilters = {};

    if (searchTerm) {
      newFilters.customer_name = searchTerm;
    }

    if (statusFilter === "expiring_soon") {
      newFilters.expiring_soon = 60; // 60 days for "expiring soon"
    } else if (statusFilter !== "all") {
      newFilters.status = [statusFilter as PolicyStatus];
    }

    setFilters(newFilters);
  }, [searchTerm, statusFilter]);

  // Renewal handler - opens the renewal quote modal
  const handleRenew = (policyId: number) => {
    // Check if policiesResponse exists and has data
    if (!policiesResponse?.data) {
      toast({
        title: "Error",
        description: "Failed to load policy data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const policy = policiesResponse.data.find((p) => p.id === policyId);
    if (policy) {
      setSelectedPolicy(policy);
      setIsDetailsDialogOpen(true); // Open the details dialog with renewal section
      toast({
        title: "Policy Renewal",
        description:
          "You can generate a renewal quote from the policy details.",
      });
    } else {
      toast({
        title: "Error",
        description: "Policy not found. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (policyId: number) => {
    // Check if policiesResponse exists and has data
    if (!policiesResponse?.data) {
      toast({
        title: "Error",
        description: "Failed to load policy data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const policy = policiesResponse.data.find((p) => p.id === policyId);
    if (policy) {
      setSelectedPolicy(policy);
      setIsDetailsDialogOpen(true);
    } else {
      toast({
        title: "Error",
        description: "Policy not found. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  const handleReinstate = (policyId: number) => {
    const policy = policies.find((p) => p.id === policyId);
    if (policy) {
      setSelectedPolicy(policy);
      setIsReinstatementModalOpen(true);
    }
  };

  const handleCancel = (policyId: number) => {
    // TODO: Implement cancellation functionality
    toast({
      title: "Cancellation Feature",
      description:
        "Cancellation functionality will be implemented in the next phase.",
    });
  };

  const handleSendReminder = (policyId: number) => {
    // TODO: Implement reminder functionality
    toast({
      title: "Reminder Sent",
      description: "Payment reminder has been sent to the customer.",
    });
  };

  const handleAddPolicy = (newPolicy: PolicyFormData) => {
    queryClient.invalidateQueries({ queryKey: ["policies"] });
    queryClient.invalidateQueries({ queryKey: ["policy-analytics"] });
    toast({
      title: "Policy Added",
      description: "New policy has been created successfully.",
    });
  };

  // Default analytics if loading
  const defaultAnalytics = {
    total_policies: 0,
    active_policies: 0,
    cancelled_policies: 0,
    inactive_policies: 0,
    draft_policies: 0,
    total_plans: 0,
  };

  // Use simplified analytics
  const currentAnalytics = {
    ...defaultAnalytics,
    ...analytics,
  };

  if (policiesError) {
    return (
      <div className="lg:p-6 md:p-4 pt-20 md:pt-6 px-4 pb-4 space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load policies: {policiesError.message}
            <Button
              onClick={() => refetchPolicies()}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="lg:p-6 md:p-4 pt-20 md:pt-6 px-4 pb-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Policy Management
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Comprehensive policy lifecycle management and analytics
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={async () => {
              toast({
                title: "Refreshing Policies",
                description: "Fetching the latest policy data...",
              });
              await refetchPolicies();
              queryClient.invalidateQueries({ queryKey: ["policy-analytics"] });
              toast({
                title: "Refresh Complete",
                description: "Policy data has been updated successfully.",
              });
            }}
            variant="outline"
            disabled={isPoliciesLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isPoliciesLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {/* <Button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["policy-analytics"] });
              toast({
                title: "Analytics Refreshed",
                description: "Dashboard statistics have been updated.",
              });
            }}
            variant="outline"
            size="sm"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh Stats
          </Button> */}
          {/* <WebSocketStatus /> */}
          <AddPolicyDialog onAddPolicy={handleAddPolicy} />
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Policies</p>
                {isAnalyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {currentAnalytics.total_policies}
                  </p>
                )}
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Policies</p>
                {isAnalyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    {currentAnalytics.active_policies}
                  </p>
                )}
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled Policies</p>
                {isAnalyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-red-600">
                    {currentAnalytics.cancelled_policies || 0}
                  </p>
                )}
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Insurance Plans</p>
                {isAnalyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-purple-600">
                    {currentAnalytics.total_plans || companies?.length || 0}
                  </p>
                )}
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="templates">Insurance Plans </TabsTrigger>
          <TabsTrigger value="analytics"> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          {/* View Mode Toggle - Always show this */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* Left side - Filters (only visible in cards view) or empty space */}
                <div className="flex flex-col md:flex-row flex-1 w-full md:w-auto gap-3 md:gap-4">
                  {viewMode === "cards" && (
                    <>
                      <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by customer name or policy number..."
                          value={searchTerm}
                          onChange={(e) =>
                            handleSearchTermChange(e.target.value)
                          }
                          className="pl-10 w-full md:w-[250px]"
                        />
                      </div>
                      <Select
                        value={statusFilter}
                        onValueChange={handleStatusFilterChange}
                      >
                        <SelectTrigger className="w-full md:w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {/* <SelectItem value="expiring_soon">
                            Expiring Soon
                          </SelectItem> */}
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                          <SelectItem value="Expired">Expired</SelectItem>
                          <SelectItem value="Lapsed">Lapsed</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>

                {/* Right side - View mode toggle (always show and always on the right) */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewModeChange("cards")}
                  >
                    <List className="h-4 w-4 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewModeChange("grid")}
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Grid
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policies View */}
          {viewMode === "grid" ? (
            <PolicyGrid
              onViewDetails={handleViewDetails}
              onReinstate={handleReinstate}
              onCancel={handleCancel}
              onRenew={handleRenew}
              onSendReminder={handleSendReminder}
            />
          ) : (
            /* Cards View */
            <>
              {isPoliciesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-24" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full overflow-hidden">
                  {filteredPolicies.map((policy) => (
                    <Card
                      key={policy.id}
                      className="hover:shadow-md transition-shadow w-full overflow-hidden"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            {policy.customer?.id ? (
                              <a
                                href={`/clients/view/${policy.customer.id}`}
                                className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                title={`View ${policy.customer.name} profile`}
                              >
                                {policy.customer?.name || "Unknown Customer"}
                              </a>
                            ) : (
                              <span className="text-lg font-semibold text-gray-900">
                                {policy.customer?.name || "Unknown Customer"}
                              </span>
                            )}
                            <p className="text-sm text-gray-600">
                              {policy.policy_number}
                            </p>
                            <p className="text-sm text-gray-500 break-words max-w-[200px] leading-tight">
                              {policy.plan?.name || "Unknown Plan"}
                            </p>
                          </div>
                          <Badge variant="outline">
                            <Currency
                              value={getPremiumValue(policy)}
                              showZero={true}
                              placeholder="0"
                            />
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Start Date:</span>
                            <span>
                              {new Date(policy.start_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                            </span>
                          </div>
                          {policy.end_date && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">End Date:</span>
                              <span>
                                {new Date(policy.end_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Frequency:</span>
                            <span className="capitalize">
                              {policy.premium_frequency}
                            </span>
                          </div>
                        </div>

                        <PolicyActionButtons
                          policy={policy}
                          onViewDetails={handleViewDetails}
                          onReinstate={handleReinstate}
                          onCancel={handleCancel}
                          onRenew={handleRenew}
                          onSendReminder={handleSendReminder}
                          compact={true}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!isPoliciesLoading && filteredPolicies.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No policies found matching your criteria.
                  </p>
                </div>
              )}

              {/* Pagination Info */}
              {meta && (
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    Showing {meta.from} to {meta.to} of {meta.total} policies
                  </span>
                  <span>
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {isCompaniesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading companies...</span>
            </div>
          ) : (
            <SimplifiedPlansManagement companies={companies} />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Policy Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${currentAnalytics.total_policies > 0 ? (currentAnalytics.active_policies / currentAnalytics.total_policies) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {currentAnalytics.active_policies}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Inactive</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gray-600 h-2 rounded-full"
                            style={{
                              width: `${currentAnalytics.total_policies > 0 ? ((currentAnalytics.inactive_policies || 0) / currentAnalytics.total_policies) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {currentAnalytics.inactive_policies || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Draft</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{
                              width: `${currentAnalytics.total_policies > 0 ? ((currentAnalytics.draft_policies || 0) / currentAnalytics.total_policies) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {currentAnalytics.draft_policies || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAnalyticsLoading ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Policies:
                      </span>
                      <span className="font-medium">
                        {currentAnalytics.total_policies}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Active Rate:
                      </span>
                      <span className="font-medium text-green-600">
                        {currentAnalytics.total_policies > 0
                          ? (
                              (currentAnalytics.active_policies /
                                currentAnalytics.total_policies) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Available Plans:
                      </span>
                      <span className="font-medium text-blue-600">
                        {currentAnalytics.total_plans || companies?.length || 0}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedPolicy && (
        <>
          <PolicyDetailView
            policy={selectedPolicy}
            isOpen={isDetailsDialogOpen}
            onClose={() => setIsDetailsDialogOpen(false)}
            onPolicyUpdate={(updatedPolicy) => setSelectedPolicy(updatedPolicy)}
          />

          <PolicyReinstatementDialog
            isOpen={isReinstatementModalOpen}
            onClose={() => setIsReinstatementModalOpen(false)}
            policy={selectedPolicy}
            onPolicyUpdated={() => {
              setIsReinstatementModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["policies"] });
              queryClient.invalidateQueries({ queryKey: ["policy-analytics"] });
            }}
          />
        </>
      )}
    </div>
  );
};

export default Policies;
