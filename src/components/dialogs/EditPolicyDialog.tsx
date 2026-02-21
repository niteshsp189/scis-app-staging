import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Loader2 } from "lucide-react";
import { CustomerData } from "@/types/customer";
import {
  Policy,
  PolicyStatus,
  PremiumFrequency,
  UnderwritingStatus,
} from "@/types/policy";
import SimplifiedPolicyForm from "./policy/SimplifiedPolicyForm";
import { PlanTypeService } from "@/services/PlanTypeService";
import policyCreationService from "@/services/policyCreationService";
import { toast } from "@/components/ui/use-toast";

interface PlanType {
  id: number;
  name: string;
  slug: string;
  conflicting_plan_types: number[] | null;
  extra_fields: Record<
    string,
    { label: string; included: boolean; required: boolean }
  >;
  is_active: boolean;
}

interface EditPolicyDialogProps {
  policy: Policy;
  onUpdatePolicy: (policy: Policy) => void;
}

export const EditPolicyDialog = ({
  policy,
  onUpdatePolicy,
}: EditPolicyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [loading, setLoading] = useState(false);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<"form" | "preview">("form");

  const loadPlanType = useCallback(async () => {
    try {
      setLoading(true);
      // Get the plan type from the policy's plan
      if (policy.plan?.plan_type || policy.plan?.planType) {
        const pt = policy.plan.plan_type || policy.plan.planType;
        // Ensure it matches our PlanType interface
        const planTypeData: PlanType = {
          id: pt.id,
          name: pt.name,
          slug: pt.slug,
          conflicting_plan_types:
            (pt as { conflicting_plan_types?: number[] | null })
              .conflicting_plan_types || null,
          extra_fields:
            (
              pt as {
                extra_fields?: Record<
                  string,
                  { label: string; included: boolean; required: boolean }
                >;
              }
            ).extra_fields || {},
          is_active: (pt as { is_active?: boolean }).is_active ?? true,
        };
        setPlanType(planTypeData);
      } else {
        // Fallback: load plan type by ID if not included in policy
        const planTypes = await PlanTypeService.getAll();
        const foundPlanType = planTypes.find(
          (pt) =>
            pt.id === (policy.plan as { plan_type_id?: number })?.plan_type_id,
        );
        if (foundPlanType) {
          const planTypeData: PlanType = {
            id: foundPlanType.id,
            name: foundPlanType.name,
            slug: foundPlanType.slug,
            conflicting_plan_types:
              foundPlanType.conflicting_plan_types || null,
            extra_fields: foundPlanType.extra_fields || {},
            is_active:
              foundPlanType.is_active !== undefined
                ? foundPlanType.is_active
                : true,
          };
          setPlanType(planTypeData);
        } else {
          setPlanType(null);
        }
      }
    } catch (error) {
      console.error("Failed to load plan type:", error);
      toast({
        title: "Error",
        description: "Failed to load plan type information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [policy]);

  useEffect(() => {
    if (open && policy) {
      loadPlanType();
    }
  }, [open, policy, loadPlanType]);

  const handleUpdatePolicy = async (formData: {
    customer_id: string;
    customer_name: string;
    company_id: string;
    plan_id: string;
    policy_number: string;
    agent_of_record: string;
    writing_agent: string;
    effective_date: string;
    extra_fields: Record<string, unknown>;
    status?: string;
  }) => {
    try {
      setLoading(true);

      // Prepare update data - only send changed fields
      const updateData = {
        customer_id: parseInt(formData.customer_id),
        plan_id: parseInt(formData.plan_id),
        policy_number: formData.policy_number,
        agent_of_record: formData.agent_of_record,
        writing_agent: formData.writing_agent,
        start_date: formData.start_date, // ✅ FIXED: Use start_date instead of effective_date
        field_values: formData.extra_fields,
        // Keep existing values for fields not in the simplified form
        premium_frequency: policy.premium_frequency,
        end_date: policy.end_date,
        premium_amount: policy.premium_amount,
      };

      // Call update API
      const response = await policyCreationService.updatePolicy(
        policy.id,
        updateData,
      );

      if (response.success) {
        // Use the full response data from the API which includes loaded relationships
        // (agents.agent, plan.company, plan.planType, customer)
        const responsePolicy = response.data;

        // Merge the API response with existing policy data to preserve any fields
        // the API might not return, while using fresh relationship data
        const updatedPolicy: Policy = {
          ...policy,
          ...responsePolicy,
          // Ensure relationships from the API response are used (they have fresh nested data)
          agents: responsePolicy.agents || policy.agents || [],
          plan: responsePolicy.plan || policy.plan,
          customer: responsePolicy.customer || policy.customer,
        };
        onUpdatePolicy(updatedPolicy);
        setOpen(false);
        setCurrentStep("form");
        toast({
          title: "Success",
          description: "Policy updated successfully",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update policy";
      console.error("Failed to update policy:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentStep("form");
  };

  // Convert policy data to form format
  const initialFormData = useMemo(() => {
    // Parse field_values if it's a string
    let parsedFieldValues = policy.field_values;
    if (typeof policy.field_values === "string") {
      try {
        parsedFieldValues = JSON.parse(policy.field_values);
      } catch (e) {
        console.error("Failed to parse field_values:", e);
        parsedFieldValues = {};
      }
    }

    return {
      customer_id: policy.customer_id.toString(),
      customer_name: policy.customer?.name || "",
      company_id: policy.plan?.company?.id?.toString() || "",
      plan_id: policy.plan_id.toString(),
      policy_number: policy.policy_number,
      agent_of_record:
        policy.agents?.find((a) => a.agent_type === "AOR")?.agent_id?.toString() || "",
      writing_agent:
        policy.agents?.find((a) => a.agent_type === "Writing Agent")
          ?.agent_id?.toString() || "",
      effective_date: policy.start_date,
      extra_fields: parsedFieldValues || {},
    };
  }, [policy]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Edit className="h-4 w-4" />
        Edit Policy
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent 
          className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {currentStep === "form"
                ? `Edit Policy - ${policy.policy_number}`
                : `Review Changes - ${policy.policy_number}`}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {currentStep === "form"
                ? `Update policy information for ${policy.policy_number}.`
                : "Please review the changes before saving."}
            </DialogDescription>

            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "form"
                      ? "bg-blue-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  1
                </div>
                <span
                  className={`ml-2 text-sm ${currentStep === "form" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                >
                  Edit Information
                </span>
              </div>

              <div
                className={`w-8 h-0.5 ${currentStep === "preview" ? "bg-green-600" : "bg-gray-300"}`}
              ></div>

              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "preview"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  2
                </div>
                <span
                  className={`ml-2 text-sm ${currentStep === "preview" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                >
                  Review & Save
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          )}

          {/* Form Content */}
          {!loading && planType && (
            <div className="space-y-6">
              <SimplifiedPolicyForm
                planType={planType}
                customer={undefined} // In edit mode, don't pass customer since form is pre-populated
                onAddPolicy={handleUpdatePolicy}
                onCancel={handleClose}
                currentStep={currentStep}
                onProceedToPreview={() => setCurrentStep("preview")}
                onBackToForm={() => setCurrentStep("form")}
                initialData={initialFormData}
                isEditMode={true}
              />
            </div>
          )}

          {!loading && !planType && (
            <div className="text-center py-8 text-gray-500">
              <p>Unable to load plan type information for this policy.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
