import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Policy } from "@/types/policy";
import { PolicyService } from "@/services/policyService";

interface PolicyReinstatementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  policy: Policy;
  onPolicyUpdated?: () => void;
}

export function PolicyReinstatementDialog({
  isOpen,
  onClose,
  policy,
  onPolicyUpdated
}: PolicyReinstatementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Available status options for reinstatement (same as edit form but without Cancelled)
  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Pending", label: "Pending" },
    { value: "Suspended", label: "Suspended" },
    { value: "Expired", label: "Expired" },
    { value: "Lapsed", label: "Lapsed" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStatus) {
      toast({
        title: "Validation Error",
        description: "Please select a policy status.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Update policy status via API
      await PolicyService.updatePolicyStatus(policy.id, selectedStatus);

      // Call the callback
      if (onPolicyUpdated) {
        onPolicyUpdated();
      }

      // Close dialog
      onClose();

      toast({
        title: "Policy Status Updated",
        description: `Policy ${policy.policy_number} status has been updated to ${selectedStatus}.`,
      });

    } catch (error: any) {
      console.error('Error updating policy status:', error);

      // Check if this is a validation error (422 status code)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          toast({
            title: "Validation Error",
            description: firstError[0],
            variant: "destructive"
          });
        } else {
          toast({
            title: "Validation Error",
            description: "Please check the form data and try again.",
            variant: "destructive"
          });
        }
      } else {
        // Generic error
        toast({
          title: "Error",
          description: error.message || "Failed to update policy status. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Reinstate Policy
          </DialogTitle>
          <DialogDescription>
            Update the status of policy {policy.policy_number} to reinstate or modify its current state.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="policy-status">
              Policy Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              disabled={loading}
            >
              <SelectTrigger id="policy-status">
                <SelectValue placeholder="Select new policy status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedStatus && (
              <p className="text-sm text-red-500 mt-1">Please select a policy status</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedStatus}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}