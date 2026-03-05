import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Policy } from "@/types/policy";
import { PolicyService } from "@/services/policyService";
import { User, FileText, Link2, UserCheck, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { dependentService } from "@/services/dependentService";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { useNavigate } from "react-router-dom";

interface LinkExistingCustomerAsDependentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** The existing customer being linked */
  selectedCustomer: {
    id: number;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    status?: string;
    legacyClientId?: number;
  } | null;
  /** The parent customer ID (the one whose dependent tab we're on) */
  customerId: number;
  onSubmit: (data: {
    relatedCustomerId: number;
    relationship: string;
    notes: string;
    selectedPolicyIds: number[];
  }) => Promise<void>;
  onBack?: () => void;
  /** Edit mode: if set, we're editing an existing linked dependent */
  editingDependentId?: number | null;
  /** Initial values when editing */
  initialRelationship?: string;
  initialNotes?: string;
}

const relationshipOptions = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Son",
  "Daughter",
  "Mother",
  "Father",
  "Brother",
  "Sister",
  "Grandparent",
  "Grandchild",
  "Uncle",
  "Aunt",
  "Cousin",
  "Niece",
  "Nephew",
  "Stepson",
  "Stepdaughter",
  "Stepfather",
  "Stepmother",
  "Mother In Law",
  "Father In Law",
  "Son In Law",
  "Daughter In Law",
  "Sister In Law",
  "Brother In Law",
  "Fiancee",
  "Friend",
  "Other",
];

export const LinkExistingCustomerAsDependentDialog = ({
  isOpen,
  onOpenChange,
  selectedCustomer,
  customerId,
  onSubmit,
  onBack,
  editingDependentId,
  initialRelationship,
  initialNotes,
}: LinkExistingCustomerAsDependentDialogProps) => {
  const navigate = useNavigate();
  const isEditMode = !!editingDependentId;

  const handleBack = () => {
    onOpenChange(false);
    onBack?.();
  };

  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<number[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load customer's policies when dialog opens
  useEffect(() => {
    if (!isOpen || !customerId) return;

    let isMounted = true;
    setLoadingPolicies(true);

    const loadPolicies = async () => {
      try {
        const customerPoliciesRes = await PolicyService.getPolicies(1, 100, {
          customer_id: customerId,
        });
        if (!isMounted) return;
        setAvailablePolicies(customerPoliciesRes.data || []);
      } catch (e) {
        console.error("Failed to load policies for customer", e);
        if (isMounted) setAvailablePolicies([]);
      } finally {
        if (isMounted) setLoadingPolicies(false);
      }
    };

    loadPolicies();

    return () => {
      isMounted = false;
    };
  }, [isOpen, customerId]);

  // Reset form when dialog closes or customer changes
  useEffect(() => {
    if (!isOpen) {
      setRelationship("");
      setNotes("");
      setSelectedPolicyIds([]);
    } else {
      // Pre-populate when editing
      if (isEditMode) {
        setRelationship(initialRelationship || "");
        setNotes(initialNotes || "");
      }
    }
  }, [isOpen]);

  // Load currently assigned policies when editing
  useEffect(() => {
    if (!isOpen || !editingDependentId) return;

    let isMounted = true;
    const loadAssignedPolicies = async () => {
      try {
        const assignedPolicies = await dependentService.getDependentPolicies(editingDependentId);
        if (isMounted) {
          setSelectedPolicyIds((assignedPolicies || []).map((p: any) => p.id));
        }
      } catch (error) {
        console.error("Failed to load assigned policies:", error);
      }
    };
    loadAssignedPolicies();

    return () => { isMounted = false; };
  }, [isOpen, editingDependentId]);

  const togglePolicy = (policyId: number, checked: boolean) => {
    setSelectedPolicyIds((prev) =>
      checked
        ? [...new Set([...prev, policyId])]
        : prev.filter((id) => id !== policyId)
    );
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return;

    if (!relationship) {
      toast({
        title: "Validation Error",
        description: "Please select a relationship type.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        relatedCustomerId: selectedCustomer.id,
        relationship,
        notes,
        selectedPolicyIds,
      });
      // Reset and close on success
      setRelationship("");
      setNotes("");
      setSelectedPolicyIds([]);
    } catch (error) {
      // Parent handles error toast
      console.error("Submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedCustomer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {onBack && !isEditMode && (
              <button
                onClick={handleBack}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                title="Back to customer selection"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
            )}
            <Link2 className="h-5 w-5" />
            {isEditMode ? "Edit Linked Dependent" : "Link Existing Customer as Dependent"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info Card */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  {isEditMode ? (
                    <button
                      onClick={() => {
                        const url = getCustomerViewUrl(
                          selectedCustomer.id,
                          selectedCustomer.status || 'Client',
                          selectedCustomer.legacyClientId
                        );
                        onOpenChange(false);
                        navigate(`${url}?tab=overview`);
                      }}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      title={`View ${selectedCustomer.name}'s profile`}
                    >
                      {selectedCustomer.name}
                    </button>
                  ) : (
                    <h4 className="font-medium text-gray-900">
                      {selectedCustomer.name}
                    </h4>
                  )}
                  <div className="text-sm text-gray-600 space-x-2">
                    {selectedCustomer.email && (
                      <span>{selectedCustomer.email}</span>
                    )}
                    {selectedCustomer.email && selectedCustomer.phone && (
                      <span>•</span>
                    )}
                    {selectedCustomer.phone && (
                      <span>{selectedCustomer.phone}</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  Existing Customer
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {isEditMode
                  ? "To edit personal details, click the name above to visit their profile."
                  : "Their personal details will be linked automatically — no duplicate record will be created."}
              </p>
            </CardContent>
          </Card>

          {/* Relationship */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5" />
                Relationship Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="link-relationship">
                  Relationship <span className="text-red-500">*</span>
                </Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger id="link-relationship" className="mt-1">
                    <SelectValue placeholder="Select relationship to customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="link-notes">Notes</Label>
                <Input
                  id="link-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this dependent relationship"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Assign Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Assign Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPolicies ? (
                <p className="text-sm text-gray-500">Loading policies...</p>
              ) : availablePolicies.length === 0 ? (
                <p className="text-sm text-gray-500">
                  This customer has no policies to assign.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availablePolicies.map((policy) => (
                    <label
                      key={policy.id}
                      className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <Checkbox
                        id={`link-policy-${policy.id}`}
                        checked={selectedPolicyIds.includes(policy.id)}
                        onCheckedChange={(checked) =>
                          togglePolicy(policy.id, Boolean(checked))
                        }
                      />
                      <span className="text-sm flex-1">
                        <span className="font-medium">
                          {policy.policy_number}
                        </span>
                        {policy.plan?.name && (
                          <span className="text-gray-600">
                            {" "}
                            - {policy.plan.name}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? (isEditMode ? "Saving..." : "Linking...")
                : (isEditMode ? "Save Changes" : "Link as Dependent")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
