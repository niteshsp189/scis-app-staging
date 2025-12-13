import React, { useState } from "react";
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
  Download,
  Upload,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Pin,
  Plus,
  ExternalLink,
  RefreshCw,
  Users,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Policy } from "@/types/policy";
import PolicyService from "@/services/policyService";
import policyDocumentsService, {
  PolicyDocument,
  PolicyDocumentUpload,
} from "@/services/policyDocumentsService";
import {
  getPolicyNotes,
  createPolicyNote,
  togglePolicyNotePin,
  deletePolicyNote,
  PolicyNote,
  CreatePolicyNoteRequest,
} from "@/services/policyNotesService";
import { EditPolicyDialog } from "@/components/dialogs/EditPolicyDialog";
import { PolicyReinstatementDialog } from "@/components/dialogs/PolicyReinstatementDialog";
import { PolicyAuditTrail } from "@/components/policy/PolicyAuditTrail";
import { DateInput } from "@/components/ui/date-input";
import { TimePicker } from "@/components/ui/time-picker";

interface PolicyDetailViewProps {
  policy: Policy;
  isOpen: boolean;
  onClose: () => void;
  onPolicyUpdate?: (updatedPolicy: Policy) => void;
}

export const PolicyDetailView: React.FC<PolicyDetailViewProps> = ({
  policy,
  isOpen,
  onClose,
  onPolicyUpdate,
}) => {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  // Document-related state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadDocumentName, setUploadDocumentName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cancellation-related state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationDate, setCancellationDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [cancellationTime, setCancellationTime] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  });
  const [isCancelling, setIsCancelling] = useState(false);

  // Reinstatement-related state
  const [isReinstatementDialogOpen, setIsReinstatementDialogOpen] =
    useState(false);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch policy data with query
  const {
    data: policyData,
    isLoading: isLoadingPolicy,
    refetch: refetchPolicy,
  } = useQuery({
    queryKey: ["policy", policy.id],
    queryFn: () =>
      PolicyService.getPolicy(policy.id, [
        "customer",
        "plan",
        "plan.company",
        "plan.planType",
        "agents",
        "agents.agent",
      ]),
    enabled: isOpen,
    initialData: { data: policy }, // Use the passed policy as initial data
  });

  // Use the fetched policy data or fall back to the prop
  const currentPolicy = policyData?.data || policy;

  // Handle manual refresh of policy data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Only refetch the policy data for the summary tab
      await refetchPolicy();

      // If onPolicyUpdate is provided, update the parent component with fresh data
      if (onPolicyUpdate && policyData?.data) {
        onPolicyUpdate(policyData.data);
      }

      toast({
        title: "Success",
        description: "Policy data refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh policy data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch policy documents
  const {
    data: documents = [],
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ["policy-documents", currentPolicy.id],
    queryFn: () =>
      policyDocumentsService.getDocuments(currentPolicy.id.toString()),
    enabled: isOpen,
  });

  // Placeholder function for compatibility with existing note handlers
  const refetchAuditLogs = () => {
    // Audit trail is now handled by PolicyAuditTrail component
  };

  // Fetch policy notes
  const {
    data: notes = [],
    isLoading: isLoadingNotes,
    refetch: refetchNotes,
  } = useQuery({
    queryKey: ["policy-notes", currentPolicy.id],
    queryFn: () => getPolicyNotes(currentPolicy.id.toString()),
    enabled: isOpen,
  });

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const noteData: CreatePolicyNoteRequest = {
        content: newNote.trim(),
        is_pinned: false,
      };

      await createPolicyNote(currentPolicy.id.toString(), noteData);
      setNewNote("");
      refetchNotes();
      // Also refetch audit logs to show the new note creation
      refetchAuditLogs();
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const togglePinNote = async (noteId: string) => {
    try {
      await togglePolicyNotePin(currentPolicy.id.toString(), noteId);
      refetchNotes();
      // Also refetch audit logs to show the pin toggle action
      refetchAuditLogs();
      toast({
        title: "Success",
        description: "Note pin status updated",
      });
    } catch (error) {
      console.error("Error toggling note pin:", error);
      toast({
        title: "Error",
        description: "Failed to update note pin status",
        variant: "destructive",
      });
    }
  };

  // Note delete modal state
  const [isDeleteNoteModalOpen, setIsDeleteNoteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  // Open confirmation dialog for note deletion
  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setIsDeleteNoteModalOpen(true);
  };

  // Confirm note deletion
  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    setIsDeletingNote(true);
    try {
      await deletePolicyNote(currentPolicy.id.toString(), noteToDelete);
      await refetchNotes();
      // Also refetch audit logs to show the deletion
      refetchAuditLogs();
      toast({
        title: "Note Deleted",
        description: "The note has been successfully deleted.",
      });
      setIsDeleteNoteModalOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingNote(false);
    }
  };

  // Document handling functions
  const handleFileUpload = async () => {
    if (!uploadingFile || !uploadDocumentName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter a document name.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadData: PolicyDocumentUpload = {
        file: uploadingFile,
        name: uploadDocumentName.trim(),
        category: "General", // Default category since we removed the field
      };

      await policyDocumentsService.uploadDocument(
        currentPolicy.id.toString(),
        uploadData,
      );

      // Refresh documents list
      await refetchDocuments();

      // Reset form
      setUploadingFile(null);
      setUploadDocumentName("");
      setIsUploadModalOpen(false);

      toast({
        title: "Document Uploaded",
        description: "The document has been successfully uploaded.",
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDocument = async (document: PolicyDocument) => {
    try {
      const blob = await policyDocumentsService.downloadDocument(
        currentPolicy.id.toString(),
        document.id,
      );
      policyDocumentsService.downloadFile(
        blob,
        document.original_filename || document.name,
      );
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocumentToDelete(documentId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await policyDocumentsService.deleteDocument(
        currentPolicy.id.toString(),
        documentToDelete,
      );
      await refetchDocuments();

      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });

      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefreshDocuments = async () => {
    try {
      await refetchDocuments();
      toast({
        title: "Documents Refreshed",
        description: "Document list has been updated.",
      });
    } catch (error) {
      console.error("Error refreshing documents:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh documents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelPolicy = async () => {
    if (!cancellationReason.trim() || !cancellationDate || !cancellationTime) {
      toast({
        title: "Validation Error",
        description: "Please provide cancellation reason, date, and time.",
        variant: "destructive",
      });
      return;
    }

    setIsCancelling(true);
    try {
      await PolicyService.cancelPolicySimplified(currentPolicy.id, {
        cancellation_reason: cancellationReason.trim(),
        cancellation_date: cancellationDate,
        cancellation_time: cancellationTime,
      });

      // Create updated policy object
      const updatedPolicy = {
        ...currentPolicy,
        status: "Cancelled" as const,
        cancellation_date: cancellationDate,
        cancellation_reason: cancellationReason.trim(),
        cancellation_time: cancellationTime,
      };

      // Update the policy status in the query cache
      queryClient.setQueryData(["policy", currentPolicy.id], updatedPolicy);

      // Update parent component's policy state
      if (onPolicyUpdate) {
        onPolicyUpdate(updatedPolicy);
      }

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              <span>Policy Details - {currentPolicy.policy_number}</span>
              {/* Move status badge to the left, directly after the policy number */}
              <Badge variant="outline" className="text-xs">
                {currentPolicy.status}
              </Badge>
            </span>
            {/* keep a placeholder on the right for the close/action area if needed */}
            <div />
          </DialogTitle>
          <DialogDescription>
            Comprehensive view of policy {currentPolicy.policy_number} for{" "}
            {currentPolicy.customer?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="summary" className="h-full overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="mt-4 h-[calc(90vh-200px)] overflow-y-auto">
            <TabsContent value="summary" className="space-y-6">
              {/* Refresh Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 mr-5"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

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
                        {currentPolicy.customer?.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">
                        {currentPolicy.customer?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm text-gray-600">
                        {currentPolicy.customer?.phone || "N/A"}
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
                        {currentPolicy.policy_number}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm text-gray-600">
                        {currentPolicy.plan?.company?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Plan</Label>
                      <p className="text-sm text-gray-600">
                        {currentPolicy.plan?.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      {/* Put badge on its own line and give some top margin to separate from label */}
                      <div className="mt-2">
                        <Badge
                          variant={
                            currentPolicy.status?.toLowerCase() === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {currentPolicy.status}
                        </Badge>
                        {currentPolicy.status === "Cancelled" && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="space-y-2">
                              {currentPolicy.cancellation_date && (
                                <div>
                                  <Label className="text-xs font-medium text-red-700">
                                    Cancellation Date
                                  </Label>
                                  <p className="text-sm text-red-800">
                                    {new Date(
                                      currentPolicy.cancellation_date,
                                    ).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                    ,{" "}
                                    {new Date(
                                      currentPolicy.cancellation_date,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                      timeZone: "UTC",
                                    })}
                                  </p>
                                </div>
                              )}
                              {currentPolicy.cancellation_reason && (
                                <div>
                                  <Label className="text-xs font-medium text-red-700">
                                    Cancellation Reason
                                  </Label>
                                  <p className="text-sm text-red-800">
                                    {currentPolicy.cancellation_reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
                  {currentPolicy.agents && currentPolicy.agents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentPolicy.agents.map(
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
              {currentPolicy.plan?.planType || currentPolicy.plan?.plan_type ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {
                        (
                          currentPolicy.plan.planType ||
                          currentPolicy.plan.plan_type
                        )?.name
                      }{" "}
                      Specific Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        // Parse field_values if it's a string, otherwise use as is
                        let parsedFieldValues = currentPolicy.field_values;
                        if (typeof currentPolicy.field_values === "string") {
                          try {
                            parsedFieldValues = JSON.parse(
                              currentPolicy.field_values,
                            );
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
                                currentPolicy.plan?.planType ||
                                currentPolicy.plan?.plan_type;
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
                                      ? new Date(value).toLocaleDateString()
                                      : String(value)}
                                  </p>
                                </div>
                              );
                            },
                          )
                        );
                      })()}
                    </div>
                    {!currentPolicy.field_values ||
                    (typeof currentPolicy.field_values === "object" &&
                      Object.keys(currentPolicy.field_values).length === 0) ||
                    (typeof currentPolicy.field_values === "string" &&
                      (() => {
                        try {
                          return (
                            Object.keys(JSON.parse(currentPolicy.field_values))
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
                      {new Date(currentPolicy.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  {currentPolicy.end_date && (
                    <div>
                      <Label className="text-sm font-medium">End Date</Label>
                      <p className="text-sm text-gray-600">
                        {new Date(currentPolicy.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(currentPolicy.created_at).toLocaleDateString()}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-2">
                        Update policy information for newest details.
                      </p>
                      <EditPolicyDialog
                        policy={currentPolicy}
                        onUpdatePolicy={async (updatedPolicy) => {
                          // Update the policy in the query cache
                          queryClient.setQueryData(
                            ["policy", currentPolicy.id],
                            updatedPolicy,
                          );

                          // Refetch the policy data to ensure we have the latest information
                          await refetchPolicy();

                          // Update parent component with the latest data
                          if (onPolicyUpdate && policyData?.data) {
                            onPolicyUpdate(policyData.data);
                          }

                          toast({
                            title: "Policy Updated",
                            description:
                              "Policy information has been successfully updated.",
                          });
                        }}
                      />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 mb-2">
                        Reinstate or update the policy status.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsReinstatementDialogOpen(true)}
                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reinstate Policy
                      </Button>
                    </div>
                    {currentPolicy.status !== "Cancelled" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 mb-2">
                          Cancel this policy.
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

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Policy Documents
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsUploadModalOpen(true)}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload Document"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshDocuments}
                      disabled={isLoadingDocuments}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isLoadingDocuments ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingDocuments ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg font-semibold text-sm text-gray-700">
                        <div>Name</div>
                        <div>Uploaded by</div>
                        <div>Size</div>
                        <div>Type</div>
                        <div>Date</div>
                      </div>

                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div className="grid grid-cols-5 gap-4 flex-1 items-center">
                              {/* Name */}
                              <div>
                                <h4 className="font-semibold text-sm">
                                  {doc.name}
                                </h4>
                              </div>
                              {/* Uploaded by - we might need to adjust this based on available data */}
                              <div>
                                <p className="text-sm text-gray-600">
                                  {doc.uploaded_by || "Unknown"}
                                </p>
                              </div>
                              {/* Size */}
                              <div>
                                <p className="text-sm text-gray-600">
                                  {doc.formatted_size}
                                </p>
                              </div>
                              {/* Type */}
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  PDF
                                </Badge>
                              </div>
                              {/* Date */}
                              <div>
                                <p className="text-sm text-gray-600">
                                  {doc.upload_date}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {doc.is_image && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(doc.url, "_blank")}
                                title="View Image"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              title="Delete"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No documents uploaded yet</p>
                      <p className="text-sm mt-2">
                        Upload policy documents, certificates, and other files
                        here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <PolicyAuditTrail
                policyId={currentPolicy.id}
                policyNumber={currentPolicy.policy_number}
                onAuditUpdate={() => refetchAuditLogs()}
              />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Policy Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Note */}
                  <div className="space-y-2">
                    <Label>Add New Note</Label>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Enter your note here..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-t my-4"></div>

                  {/* Notes List */}
                  {isLoadingNotes ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      ))}
                    </div>
                  ) : notes.length > 0 ? (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className={`p-4 border rounded-lg ${note.is_pinned ? "bg-yellow-50 border-yellow-200" : ""}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm">{note.content}</p>
                              <div className="text-xs text-gray-500 mt-2">
                                {note.author_name} • {note.formatted_timestamp}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePinNote(note.id)}
                                className={
                                  note.is_pinned
                                    ? "text-yellow-600"
                                    : "text-gray-400"
                                }
                                title={
                                  note.is_pinned ? "Unpin note" : "Pin note"
                                }
                              >
                                <Pin className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete note"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No notes added yet</p>
                      <p className="text-sm mt-2">
                        Add notes to keep track of important information about
                        this policy.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Document Upload Modal */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document for this policy.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Choose File</Label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setUploadingFile(file);
                    // Auto-fill name from filename if empty
                    if (file && !uploadDocumentName) {
                      const nameWithoutExtension = file.name.replace(
                        /\.[^/.]+$/,
                        "",
                      );
                      setUploadDocumentName(nameWithoutExtension);
                    }
                  }}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Allowed types: PDF • Max size: 10 MB
                </p>
                {uploadingFile && (
                  <p className="mt-1 text-sm text-gray-600">
                    Selected: {uploadingFile.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="document-name">Document Name *</Label>
                <input
                  id="document-name"
                  type="text"
                  value={uploadDocumentName}
                  onChange={(e) => setUploadDocumentName(e.target.value)}
                  placeholder="Enter document name"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isUploading}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadingFile(null);
                    setUploadDocumentName("");
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={
                    isUploading || !uploadingFile || !uploadDocumentName.trim()
                  }
                >
                  {isUploading ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Delete Document
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-2">
                  Are you sure you want to delete this document? This action
                  cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDocumentToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteDocument}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Note Delete Confirmation Modal */}
        <Dialog
          open={isDeleteNoteModalOpen}
          onOpenChange={setIsDeleteNoteModalOpen}
        >
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Delete Note
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-2">
                  Are you sure you want to delete this note? This action cannot
                  be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteNoteModalOpen(false);
                    setNoteToDelete(null);
                  }}
                  disabled={isDeletingNote}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteNote}
                  disabled={isDeletingNote}
                  className="flex-1"
                >
                  {isDeletingNote ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Policy Reinstatement Modal */}
        <PolicyReinstatementDialog
          isOpen={isReinstatementDialogOpen}
          onClose={() => setIsReinstatementDialogOpen(false)}
          policy={currentPolicy}
          onPolicyUpdated={async () => {
            // Refetch policy data to show updated status
            await refetchPolicy();

            // Update parent component with the latest data
            if (onPolicyUpdate && policyData?.data) {
              onPolicyUpdate(policyData.data);
            }
          }}
        />

        {/* Policy Cancellation Modal */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Cancel Policy
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel policy{" "}
                {currentPolicy.policy_number}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancellation-reason">
                  Cancellation Reason <span className="text-red-500">*</span>
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
              <div>
                <Label htmlFor="cancellation-date">
                  Cancellation Date <span className="text-red-500">*</span>
                </Label>
                <DateInput
                  id="cancellation-date"
                  value={cancellationDate}
                  onChange={setCancellationDate}
                  placeholder="Select cancellation date"
                  disabled={isCancelling}
                  minDate={new Date()}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cancellation-time">
                  Cancellation Time <span className="text-red-500">*</span>
                </Label>
                <TimePicker
                  value={cancellationTime}
                  onChange={setCancellationTime}
                  placeholder="Select cancellation time"
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
                    setCancellationDate(new Date().toISOString().split("T")[0]);
                    setCancellationTime(() => {
                      const now = new Date();
                      const hours = now.getHours();
                      const minutes = now.getMinutes();
                      const ampm = hours >= 12 ? "PM" : "AM";
                      const displayHours = hours % 12 || 12;
                      return `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
                    });
                  }}
                  disabled={isCancelling}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelPolicy}
                  disabled={
                    isCancelling ||
                    !cancellationReason.trim() ||
                    !cancellationDate ||
                    !cancellationTime
                  }
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
      </DialogContent>
    </Dialog>
  );
};
