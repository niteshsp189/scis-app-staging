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
  Clock,
  Filter,
  Calendar,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { DataTable } from "@/components/policy/grid/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/formatters";
import { Currency } from "@/components/ui/currency";
import { RenewalService, PolicyRenewal } from "@/services/renewalService";
import { PolicyService } from "@/services/policyService";
import { Policy } from "@/types/policy";
import { PolicyDetailView } from "@/components/policy/PolicyDetailView";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const RenewalDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRenewal, setSelectedRenewal] = useState<PolicyRenewal | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Decline reason dialog state
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [renewalToDecline, setRenewalToDecline] = useState<PolicyRenewal | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // Query for all renewal quotes
  const {
    data: renewalsData,
    isLoading: isRenewalsLoading,
    error: renewalsError,
    refetch: refetchRenewals,
  } = useQuery({
    queryKey: ["policy-renewals", statusFilter],
    queryFn: () => RenewalService.getAllRenewals(statusFilter !== "all" ? statusFilter : undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for analytics data
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["renewal-analytics"],
    queryFn: () => RenewalService.getRenewalStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutations
  const acceptRenewalMutation = useMutation({
    mutationFn: (renewalId: number) => RenewalService.acceptRenewal(renewalId),
    onSuccess: (updatedRenewal) => {
      // Invalidate the dashboard renewals list
      queryClient.invalidateQueries({ queryKey: ["policy-renewals"] });
      
      // Invalidate the specific policy's renewals to update the policy detail view
      queryClient.invalidateQueries({ queryKey: ["policyRenewals", updatedRenewal.policy_id] });
      
      // Also invalidate policies to ensure policy list is updated
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      
      toast({
        title: "Renewal Quote Accepted",
        description: "The renewal quote has been accepted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Acceptance Failed",
        description: error.message || "Failed to accept renewal quote.",
        variant: "destructive",
      });
    },
  });

  const declineRenewalMutation = useMutation({
    mutationFn: ({ renewalId, reason }: { renewalId: number; reason: string }) => 
      RenewalService.declineRenewal(renewalId, reason),
    onSuccess: (updatedRenewal) => {
      // Invalidate the dashboard renewals list
      queryClient.invalidateQueries({ queryKey: ["policy-renewals"] });
      
      // Invalidate the specific policy's renewals to update the policy detail view
      queryClient.invalidateQueries({ queryKey: ["policyRenewals", updatedRenewal.policy_id] });
      
      // Also invalidate policies to ensure policy list is updated
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      
      toast({
        title: "Renewal Quote Declined",
        description: "The renewal quote has been declined successfully.",
      });
      
      // Close the decline dialog
      setIsDeclineDialogOpen(false);
      setRenewalToDecline(null);
      setDeclineReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Decline Failed",
        description: error.message || "Failed to decline renewal quote.",
        variant: "destructive",
      });
    },
  });

  // Handle decline renewal - open dialog for reason
  const handleDeclineRenewal = (renewal: PolicyRenewal) => {
    setRenewalToDecline(renewal);
    setIsDeclineDialogOpen(true);
  };

  // Confirm decline with reason
  const confirmDeclineRenewal = () => {
    if (!renewalToDecline) return;
    
    const reason = declineReason.trim() || "Declined by agent";
    declineRenewalMutation.mutate({ 
      renewalId: renewalToDecline.id, 
      reason 
    });
  };

  // Handle view policy details
  const handleViewPolicy = async (policyId: number) => {
    try {
      const policyData = await PolicyService.getPolicy(policyId);
      setSelectedPolicy(policyData.data);
      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.error("Error loading policy details:", error);
      toast({
        title: "Error",
        description: "Failed to load policy details.",
        variant: "destructive",
      });
    }
  };

  // Policy action handlers for the detail view
  const handleReinstate = (policyId: number) => {
    toast({
      title: "Reinstatement Feature",
      description: "Reinstatement functionality will be implemented in the next phase.",
    });
  };

  const handleProcessPayment = (policyId: number) => {
    toast({
      title: "Payment Processing",
      description: "Payment processing functionality will be implemented in the next phase.",
    });
  };

  const handleAmend = (policyId: number) => {
    toast({
      title: "Amendment Feature",
      description: "Amendment functionality will be implemented in the next phase.",
    });
  };

  const handleCancel = (policyId: number) => {
    toast({
      title: "Cancellation Feature",
      description: "Cancellation functionality will be implemented in the next phase.",
    });
  };

  const handleRenew = (policyId: number) => {
    toast({
      title: "Renewal Feature",
      description: "Renewal functionality is available through the renewal quotes section.",
    });
  };

  const handleSendReminder = (policyId: number) => {
    toast({
      title: "Reminder Sent",
      description: "Payment reminder has been sent to the customer.",
    });
  };

  const handleGenerateQuote = () => {
    toast({
      title: "Generate Quote",
      description: "Quote generation functionality will be implemented in the next phase.",
    });
  };

  // Filter renewals based on search term
  // Handle both direct array and paginated response with data property
  const renewalsArray = renewalsData?.data?.data ? renewalsData.data.data : 
                       (Array.isArray(renewalsData?.data) ? renewalsData.data : []);
  
  const filteredRenewals = renewalsArray.filter((renewal: PolicyRenewal & { policy?: Policy }) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      renewal.policy?.policy_number?.toLowerCase().includes(searchLower) ||
      renewal.policy?.customer?.name?.toLowerCase().includes(searchLower) ||
      renewal.policy?.customer?.email?.toLowerCase().includes(searchLower) ||
      renewal.policy?.plan?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Table columns definition
  const columns: ColumnDef<PolicyRenewal & { policy?: Policy }>[] = [
    {
      accessorKey: "policy_number",
      header: "Policy Number",
      cell: ({ row }) => (
        <Button
          variant="link"
          onClick={() => handleViewPolicy(row.original.policy_id)}
        >
          {row.original.policy?.policy_number || `Policy #${row.original.policy_id}`}
        </Button>
      ),
      accessorFn: (row) => row.policy?.policy_number || `Policy #${row.policy_id}`,
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => row.original.policy?.customer?.name || "N/A",
      accessorFn: (row) => row.policy?.customer?.name || "N/A",
    },
    {
      accessorKey: "plan_name",
      header: "Plan",
      cell: ({ row }) => row.original.policy?.plan?.name || "N/A",
      accessorFn: (row) => row.policy?.plan?.name || "N/A",
    },
    {
      accessorKey: "old_premium",
      header: "Current Premium",
      cell: ({ row }) => <Currency value={row.original.old_premium} />,
    },
    {
      accessorKey: "new_premium",
      header: "New Premium",
      cell: ({ row }) => <Currency value={row.original.new_premium} />,
    },
    {
      accessorKey: "renewal_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.renewal_status;
        return (
          <Badge
            className={
              status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : status === "accepted"
                ? "bg-green-100 text-green-800"
                : status === "declined"
                ? "bg-red-100 text-red-800"
                : status === "completed"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }
          >
            {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created Date",
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const renewal = row.original;
        const showActionButtons = renewal.renewal_status === "pending" || renewal.renewal_status === "quoted";
        
        return (
          <div className="flex space-x-1">
            {showActionButtons && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-green-500 text-green-500 hover:bg-green-50"
                  onClick={() => acceptRenewalMutation.mutate(renewal.id)}
                  disabled={acceptRenewalMutation.isPending}
                >
                  {acceptRenewalMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-red-500 text-red-500 hover:bg-red-50"
                  onClick={() => handleDeclineRenewal(renewal)}
                  disabled={declineRenewalMutation.isPending}
                >
                  {declineRenewalMutation.isPending && renewalToDecline?.id === renewal.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  Decline
                </Button>
              </>
            )}
            {renewal.renewal_status === "accepted" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  toast({
                    title: "Process Payment",
                    description: "Payment processing functionality will be implemented in the next phase.",
                  });
                }}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Process Payment
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => handleViewPolicy(renewal.policy_id)}
            >
              <FileText className="h-4 w-4 mr-1" />
              View Policy
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container-fluid mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Policy Renewal</h1>
        <Button onClick={() => {
          refetchRenewals().then(() => {
            toast({
              title: "Renewals Refreshed",
              description: "The renewals list has been updated.",
              duration: 3000
            });
          });
        }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-500 mr-2" />
              <div className="text-2xl font-bold">
                {isAnalyticsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  analytics?.pending_count || 0
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">
                {isAnalyticsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  analytics?.accepted_count || 0
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">
                {isAnalyticsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  analytics?.completed_count || 0
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">
                {isAnalyticsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Currency value={analytics?.revenue_impact || 0} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies, customers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Renewals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Renewal Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          {isRenewalsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : renewalsError ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Error loading renewal data
            </div>
          ) : filteredRenewals?.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              No renewal quotes found
            </div>
          ) : (
            <DataTable columns={columns} data={filteredRenewals || []} />
          )}
        </CardContent>
      </Card>

      {/* Policy Details Dialog */}
      {selectedPolicy && (
        <PolicyDetailView
          policy={selectedPolicy}
          isOpen={isDetailsDialogOpen}
          onClose={() => {
            setIsDetailsDialogOpen(false);
            setSelectedPolicy(null);
          }}
        />
      )}

      {/* Decline Reason Dialog */}
      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline Renewal Quote</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this renewal quote.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="decline-reason">Reason for Declining</Label>
              <Textarea
                id="decline-reason"
                placeholder="Enter reason for declining the renewal quote..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeclineDialogOpen(false);
                  setRenewalToDecline(null);
                  setDeclineReason("");
                }}
                disabled={declineRenewalMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeclineRenewal}
                disabled={declineRenewalMutation.isPending}
              >
                {declineRenewalMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Declining...
                  </>
                ) : (
                  "Decline Quote"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RenewalDashboard;
