
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ValidatedInput, ValidatedSelect } from "@/components/ui/validated-input";
import { PlanTypeField } from "@/types/planType";
import { planTypeValidationSchema, PlanTypeFormData, planTypeValidationHints } from "@/lib/validation/planTypeValidationSchema";

interface AddPlanTypeDialogProps {
  onAddPlanType: (planType: any) => void;
}

export function AddPlanTypeDialog({ onAddPlanType }: AddPlanTypeDialogProps) {
  const [open, setOpen] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<PlanTypeFormData>({
    resolver: zodResolver(planTypeValidationSchema),
    defaultValues: {
      name: "",
      description: "",
      coverage_type: "Individual",
      base_premium: "",
      deductible_amount: "",
      max_coverage: "",
      waiting_period_days: "",
      policy_term_months: "",
      is_active: true,
      benefits: "",
      exclusions: "",
      eligibility_criteria: ""
    }
  });

  // Default insurance fields that can be configured
  const [fields, setFields] = useState<PlanTypeField[]>([
    { id: "medicare_number", name: "medicareNumber", label: "Medicare #", type: "text", included: false, required: false },
    { id: "pdp_serial", name: "pdpSerial", label: "PDP Serial", type: "text", included: false, required: false },
    { id: "effective_date", name: "effectiveDate", label: "Effective Date", type: "date", included: false, required: false },
    { id: "part_a_date", name: "partAEffectiveDate", label: "Part A Effective Date", type: "date", included: false, required: false },
    { id: "part_b_date", name: "partBEffectiveDate", label: "Part B Effective Date", type: "date", included: false, required: false },
    { id: "premium", name: "premium", label: "Premium", type: "number", included: false, required: false },
    { id: "value", name: "value", label: "Value", type: "number", included: false, required: false },
    { id: "deductible", name: "deductible", label: "Deductible", type: "number", included: false, required: false },
    { id: "out_of_pocket", name: "outOfPocket", label: "Out Of Pocket", type: "number", included: false, required: false },
    { id: "payment_mode", name: "paymentMode", label: "Payment Mode", type: "select", included: false, required: false, options: ["Monthly", "Quarterly", "Annually"] },
    { id: "app_mailed_date", name: "applicationMailedDate", label: "Application Mailed Date", type: "date", included: false, required: false },
    { id: "policy_mailed_date", name: "policyMailedDate", label: "Policy Mailed Date", type: "date", included: false, required: false },
    { id: "credit", name: "credit", label: "Credit", type: "number", included: false, required: false },
    { id: "payment", name: "payment", label: "Payment", type: "number", included: false, required: false }
  ]);

  const updateField = (id: string, updates: Partial<PlanTypeField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const onSubmit = (data: PlanTypeFormData) => {
    const includedFields = fields.filter(f => f.included);
    if (includedFields.length === 0) {
      toast({
        title: "Error",
        description: "Please include at least one field in the plan type.",
        variant: "destructive"
      });
      return;
    }

    const planType = {
      ...data,
      fields: includedFields
    };
    
    onAddPlanType(planType);
    setOpen(false);
    
    // Reset form
    reset();
    setFields(fields.map(f => ({ ...f, included: false, required: false })));
    
    toast({
      title: "Plan Type Created",
      description: `${data.name} plan type has been created.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Plan Type</DialogTitle>
          <DialogDescription>
            Create a new plan type template with configurable fields
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Plan Type Name"
              error={errors.name?.message}
              hint={planTypeValidationHints.name}
              required
              {...register("name")}
              placeholder="Medicare Advantage, PDP, etc."
            />
            
            <ValidatedSelect
              label="Coverage Type"
              error={errors.coverage_type?.message}
              hint={planTypeValidationHints.coverage_type}
              required
              {...register("coverage_type")}
              onValueChange={(value) => setValue("coverage_type", value as any)}
              value={watch("coverage_type")}
              placeholder="Select coverage type"
              options={planTypeValidationHints.coverage_type.options.map(option => ({
                value: option,
                label: option
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Base Premium"
              type="number"
              step="0.01"
              error={errors.base_premium?.message}
              hint={planTypeValidationHints.base_premium}
              required
              {...register("base_premium")}
              placeholder="0.00"
            />
            
            <ValidatedInput
              label="Policy Term (Months)"
              type="number"
              error={errors.policy_term_months?.message}
              hint={planTypeValidationHints.policy_term_months}
              required
              {...register("policy_term_months")}
              placeholder="12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Deductible Amount"
              type="number"
              step="0.01"
              error={errors.deductible_amount?.message}
              hint={planTypeValidationHints.deductible_amount}
              {...register("deductible_amount")}
              placeholder="0.00"
            />
            
            <ValidatedInput
              label="Maximum Coverage"
              type="number"
              step="0.01"
              error={errors.max_coverage?.message}
              hint={planTypeValidationHints.max_coverage}
              {...register("max_coverage")}
              placeholder="1000000.00"
            />
          </div>

          <ValidatedInput
            label="Waiting Period (Days)"
            type="number"
            error={errors.waiting_period_days?.message}
            hint={planTypeValidationHints.waiting_period_days}
            {...register("waiting_period_days")}
            placeholder="30"
          />

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Plan type description..."
              className="min-h-[100px]"
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="benefits">Benefits</Label>
              <Textarea
                id="benefits"
                {...register("benefits")}
                placeholder="Plan benefits..."
                className="min-h-[80px]"
              />
              {errors.benefits && (
                <p className="text-sm text-red-500 mt-1">{errors.benefits.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="exclusions">Exclusions</Label>
              <Textarea
                id="exclusions"
                {...register("exclusions")}
                placeholder="Plan exclusions..."
                className="min-h-[80px]"
              />
              {errors.exclusions && (
                <p className="text-sm text-red-500 mt-1">{errors.exclusions.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="eligibility_criteria">Eligibility Criteria</Label>
              <Textarea
                id="eligibility_criteria"
                {...register("eligibility_criteria")}
                placeholder="Eligibility requirements..."
                className="min-h-[80px]"
              />
              {errors.eligibility_criteria && (
                <p className="text-sm text-red-500 mt-1">{errors.eligibility_criteria.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Active Plan Type</Label>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Field Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={field.included}
                      onCheckedChange={(checked) => updateField(field.id, { included: checked })}
                    />
                    <div>
                      <Label className="font-medium">{field.label}</Label>
                      <p className="text-xs text-gray-500">{field.type}</p>
                    </div>
                  </div>
                  {field.included && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                      />
                      <Label className="text-sm">Required</Label>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Plan Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
