import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerData } from "@/types/customer";
import { Policy, ReinstatementRequest, PaymentRequest } from "@/types/policy";
import { AddPolicyDialog } from "@/components/dialogs/AddPolicyDialog";
import { PolicyDetailView } from "@/components/policy/PolicyDetailView";
import { PolicyActionButtons } from "@/components/policy/PolicyActionButtons";
import { PolicyReinstatementDialog } from "@/components/dialogs/PolicyReinstatementDialog";
import { PolicyService } from "@/services/policyService";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Search,
  DollarSign,
  Calendar,
  AlertTriangle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Currency } from "@/components/ui/currency";

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

interface CustomerPoliciesTabProps {
  customerData: CustomerData;
  onUpdatePolicies?: (policies: string[]) => void;
}

export const CustomerPoliciesTab = ({
  customerData,
  onUpdatePolicies,
}: CustomerPoliciesTabProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isReinstatementModalOpen, setIsReinstatementModalOpen] =
    useState(false);

  // Check if customer can create new policies
  const canCreatePolicies = customerData.status === "Client";

  // Fetch customer policies using the general policies endpoint with customer filter
  const {
    data: policiesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["customer-policies", customerData.id],
    queryFn: () =>
      PolicyService.getPolicies(1, 50, {
        customer_id: customerData.id,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const policies = policiesResponse?.data || [];

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
      queryClient.invalidateQueries({
        queryKey: ["customer-policies", customerData.id],
      });
      queryClient.invalidateQueries({ queryKey: ["policies"] });
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
      queryClient.invalidateQueries({
        queryKey: ["customer-policies", customerData.id],
      });
      queryClient.invalidateQueries({ queryKey: ["policies"] });
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

  // Filter policies based on search term
  const filteredPolicies = policies.filter(
    (policy) =>
      policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddPolicy = (policy: any) => {
    if (onUpdatePolicies) {
      const updatedPolicies = [...customerData.policies, policy.policyType];
      onUpdatePolicies(updatedPolicies);
    }
    // Refetch policies to show the new one
    refetch();
  };

  const handleViewDetails = (policyId: number) => {
    const policy = policies.find((p) => p.id === policyId);
    if (policy) {
      setSelectedPolicy(policy);
      setIsDetailsDialogOpen(true);
    } else {
      toast({
        title: "Error",
        description: "Policy not found. Please refresh and try again.",
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

  const handleRenew = (policyId: number) => {
    // Check if policies exist
    if (!policies) {
      toast({
        title: "Error",
        description: "Failed to load policy data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const policy = policies.find((p) => p.id === policyId);
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

  const handleSendReminder = (policyId: number) => {
    toast({
      title: "Reminder Sent",
      description: "Payment reminder has been sent to the customer.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "lapsed":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Policies</h3>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            {canCreatePolicies && (
              <AddPolicyDialog
                onAddPolicy={handleAddPolicy}
                customer={customerData}
              />
            )}
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load policies:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Customer Policies</h3>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {canCreatePolicies && (
            <AddPolicyDialog
              onAddPolicy={handleAddPolicy}
              customer={customerData}
            />
          )}
        </div>
      </div>

      {/* Search and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search policies by number or plan name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? (
                    <Skeleton className="h-8 w-8" />
                  ) : (
                    policies.length
                  )}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Premium</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <Currency
                      value={policies.reduce((sum, policy) => {
                        const premiumValue = getPremiumValue(policy);
                        // Only include policies that have premium fields in their plan type
                        const planType =
                          policy.plan?.planType || policy.plan?.plan_type;
                        if (
                          planType?.extra_fields?.premium &&
                          premiumValue > 0
                        ) {
                          return sum + premiumValue;
                        }
                        return sum;
                      }, 0)}
                      showZero={true}
                      placeholder="0"
                    />
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policies List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPolicies.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {policies.length === 0
                ? "No policies found for this customer"
                : "No policies match your search"}
            </p>
            {policies.length === 0 && canCreatePolicies && (
              <AddPolicyDialog
                onAddPolicy={handleAddPolicy}
                customer={customerData}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPolicies.map((policy) => (
            <Card key={policy.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {policy.policy_number}
                      <Badge className={getStatusColor(policy.status)}>
                        {policy.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {policy.plan?.name || "Unknown Plan"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      <Currency
                        value={getPremiumValue(policy)}
                        showZero={true}
                        placeholder="0"
                      />
                    </Badge>
                    <p className="text-sm text-gray-500 capitalize">
                      {policy.premium_frequency}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Policy Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-medium">
                      {new Date(policy.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">End Date</p>
                    <p className="font-medium">
                      {policy.end_date
                        ? new Date(policy.end_date).toLocaleDateString()
                        : "Ongoing"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Outstanding</p>
                    <p
                      className={`font-medium ${policy.outstanding_premium > 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      ${policy.outstanding_premium.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Auto Renew</p>
                    <p className="font-medium">
                      {policy.auto_renew ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                {/* Next Renewal Date */}
                {policy.next_renewal_date && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Next renewal:{" "}
                      {new Date(policy.next_renewal_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Outstanding Premium Alert */}
                {policy.outstanding_premium > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">
                      Outstanding premium: $
                      {policy.outstanding_premium.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    onClick={() => handleViewDetails(policy.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  <PolicyActionButtons
                    policy={policy}
                    onViewDetails={handleViewDetails}
                    onReinstate={handleReinstate}
                    onCancel={handleCancel}
                    onRenew={handleRenew}
                    onSendReminder={handleSendReminder}
                    compact={true}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Policy Detail Modal */}
      {selectedPolicy && (
        <>
          <PolicyDetailView
            policy={selectedPolicy}
            isOpen={isDetailsDialogOpen}
            onClose={() => setIsDetailsDialogOpen(false)}
          />

          <PolicyReinstatementDialog
            isOpen={isReinstatementModalOpen}
            onClose={() => setIsReinstatementModalOpen(false)}
            policy={selectedPolicy}
            onPolicyUpdated={() => {
              setIsReinstatementModalOpen(false);
              queryClient.invalidateQueries({
                queryKey: ["customer-policies", customerData.id],
              });
              queryClient.invalidateQueries({ queryKey: ["policies"] });
            }}
          />
        </>
      )}
    </div>
  );
};
