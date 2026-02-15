import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  User,
  Calendar,
  Users,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Policy } from "@/types/policy";
import PolicyService from "@/services/policyService";
import { EditPolicyDialog } from "@/components/dialogs/EditPolicyDialog";
import { PolicyAuditTrail } from "@/components/policy/PolicyAuditTrail";

interface PolicyDetailPageProps {
  policy: Policy;
}

export const PolicyDetailPage: React.FC<PolicyDetailPageProps> = ({
  policy,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Cancellation-related state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Placeholder function for compatibility with existing note handlers
  const refetchAuditLogs = () => {
    // Audit trail is now handled by PolicyAuditTrail component
  };

  const handleCancelPolicy = async () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a cancellation reason.",
        variant: "destructive",
      });
      return;
    }

    setIsCancelling(true);
    try {
      await PolicyService.cancelPolicySimplified(policy.id, {
        cancellation_reason: cancellationReason.trim(),
      });

      // Create updated policy object
      const updatedPolicy = {
        ...policy,
        status: "Cancelled" as const,
        cancellation_date: new Date().toISOString(),
        cancellation_reason: cancellationReason.trim(),
      };

      // Update the policy status in the query cache
      queryClient.setQueryData(["policy", policy.id], updatedPolicy);

      // Update parent component's policy state
      // Note: onPolicyUpdate is not available in page component, handled via query invalidation

      // Refresh audit logs to show the cancellation
      await refetchAuditLogs();

      // Invalidate policies query cache to refresh policy list
      queryClient.invalidateQueries({ queryKey: ["policies"] });

      setIsCancelDialogOpen(false);
      setCancellationReason("");

      toast({
        title: "Policy Cancelled",
        description: "The policy has been successfully cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling policy:", error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel the policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/policies")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Policies
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Policy Details - {policy.policy_number}
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Comprehensive view of policy {policy.policy_number} for{" "}
              {policy.customer?.name}
            </p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {policy.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Simplified Policy Overview - Only Essential Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-gray-600">
                    {policy.customer?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600">
                    {policy.customer?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-gray-600">
                    {policy.customer?.phone || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Policy Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Policy Number
                  </Label>
                  <p className="text-sm text-gray-600 font-mono">
                    {policy.policy_number}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm text-gray-600">
                    {policy.plan?.company?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <p className="text-sm text-gray-600">
                    {policy.plan?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  {/* Put badge on its own line and give some top margin to separate from label */}
                  <div className="mt-2">
                    <Badge
                      variant={
                        policy.status?.toLowerCase() === "active"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {policy.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Assignment - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Agent Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {policy.agents && policy.agents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {policy.agents.map(
                    (
                      agent: {
                        agent_type?: string;
                        agent?: {
                          name?: string;
                          first_name?: string;
                          last_name?: string;
                          email?: string;
                        };
                      },
                      index: number,
                    ) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            variant={
                              agent.agent_type === "AOR"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {agent.agent_type === "AOR"
                              ? "Agent of Record"
                              : "Writing Agent"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs font-medium text-gray-500">
                              Agent Name
                            </Label>
                            <p className="text-sm font-medium">
                              {agent.agent?.name ||
                                agent.agent?.first_name +
                                  " " +
                                  agent.agent?.last_name}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-500">
                              Email
                            </Label>
                            <p className="text-sm text-gray-600">
                              {agent.agent?.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No agents assigned to this policy</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Type Specific Fields */}
          {policy.plan?.planType || policy.plan?.plan_type ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {
                    (policy.plan.planType || policy.plan.plan_type)?.name
                  }{" "}
                  Specific Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    // Parse field_values if it's a string, otherwise use as is
                    let parsedFieldValues = policy.field_values;
                    if (typeof policy.field_values === "string") {
                      try {
                        parsedFieldValues = JSON.parse(policy.field_values);
                      } catch (e) {
                        console.error("Failed to parse field_values:", e);
                        parsedFieldValues = {};
                      }
                    }

                    return (
                      parsedFieldValues &&
                      Object.entries(parsedFieldValues).map(
                        ([key, value]: [string, unknown]) => {
                          // Only show non-empty values
                          if (
                            !value ||
                            value === "" ||
                            value === null ||
                            value === undefined
                          )
                            return null;

                          // Get the field configuration from plan type (handle both camelCase and snake_case)
                          const planType =
                            policy.plan?.planType || policy.plan?.plan_type;
                          const fieldConfig = planType?.extra_fields?.[key];
                          const label =
                            fieldConfig?.label ||
                            key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase());

                          return (
                            <div key={key}>
                              <Label className="text-sm font-medium">
                                {label}
                              </Label>
                              <p className="text-sm text-gray-600">
                                {typeof value === "string" &&
                                key.includes("date")
                                  ? new Date(value).toLocaleDateString('en-US', { timeZone: 'UTC' })
                                  : String(value)}
                              </p>
                            </div>
                          );
                        },
                      )
                    );
                  })()}
                </div>
                {!policy.field_values ||
                (typeof policy.field_values === "object" &&
                  Object.keys(policy.field_values).length === 0) ||
                (typeof policy.field_values === "string" &&
                  (() => {
                    try {
                      return (
                        Object.keys(JSON.parse(policy.field_values))
                          .length === 0
                      );
                    } catch {
                      return true;
                    }
                  })()) ? (
                  <p className="text-gray-500 text-center py-4">
                    No additional information available
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Coverage Dates - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Coverage Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Effective Date
                </Label>
                <p className="text-sm text-gray-600">
                  {new Date(policy.start_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                </p>
              </div>
              {policy.end_date && (
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(policy.end_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-gray-600">
                  {new Date(policy.created_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Policy Actions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Policy Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1">
                  <p className="text-sm text-blue-800 mb-2">
                    Update policy information for newest details.
                  </p>
                  <EditPolicyDialog
                    policy={policy}
                    onUpdatePolicy={(updatedPolicy) => {
                      // Update the policy in the query cache
                      queryClient.setQueryData(
                        ["policy", policy.id],
                        updatedPolicy,
                      );
                      toast({
                        title: "Policy Updated",
                        description:
                          "Policy information has been successfully updated.",
                      });
                    }}
                  />
                </div>
                {policy.status !== "Cancelled" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex-1">
                    <p className="text-sm text-red-800 mb-2">
                      Cancel this policy. This action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsCancelDialogOpen(true)}
                      className="w-full"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Cancel Policy
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <PolicyAuditTrail
            policyId={policy.id}
            policyNumber={policy.policy_number}
            onAuditUpdate={() => refetchAuditLogs()}
          />
        </TabsContent>
      </Tabs>

      {/* Policy Cancellation Modal */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Cancel Policy
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel policy {policy.policy_number}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellation-reason">
                Cancellation Reason *
              </Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Please provide a reason for cancelling this policy..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="mt-1"
                rows={3}
                disabled={isCancelling}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="status-change"
                name="status-option"
                disabled
                className="text-blue-600"
              />
              <Label
                htmlFor="status-change"
                className="text-sm text-gray-600"
              >
                Policy status will be changed to 'Cancelled'
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelDialogOpen(false);
                  setCancellationReason("");
                }}
                disabled={isCancelling}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelPolicy}
                disabled={isCancelling || !cancellationReason.trim()}
              >
                {isCancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Cancel Policy
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};