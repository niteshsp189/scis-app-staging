import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Plan, PlanType } from "@/types/planType";

interface EditPlanDialogProps {
  plan: Plan;
  open: boolean;
  onClose: () => void;
  onUpdatePlan: (plan: Plan) => void;
}

export function EditPlanDialog({
  plan,
  open,
  onClose,
  onUpdatePlan,
}: EditPlanDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    companyId: "",
    planTypeId: "",
    status: "Draft" as "Active" | "Inactive" | "Draft",
  });
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(
    null,
  );

  // Mock data - same as AddPlanDialog
  const companies = [
    { id: 1, name: "Anthem Blue Cross" },
    { id: 2, name: "UnitedHealthcare" },
    { id: 3, name: "Aetna" },
  ];

  const planTypes: PlanType[] = [
    {
      id: 1,
      name: "Medicare Advantage",
      description: "Comprehensive Medicare Advantage plan configuration",
      category: "Medicare",
      status: "Active",
      fields: [
        {
          id: "medicare_number",
          name: "medicareNumber",
          label: "Medicare #",
          type: "text",
          included: true,
          required: true,
        },
        {
          id: "premium",
          name: "premium",
          label: "Premium",
          type: "number",
          included: true,
          required: true,
        },
        {
          id: "deductible",
          name: "deductible",
          label: "Deductible",
          type: "number",
          included: true,
          required: false,
        },
        {
          id: "out_of_pocket",
          name: "outOfPocket",
          label: "Out Of Pocket",
          type: "number",
          included: true,
          required: false,
        },
        {
          id: "payment_mode",
          name: "paymentMode",
          label: "Payment Mode",
          type: "select",
          included: true,
          required: false,
          options: ["Monthly", "Quarterly", "Annually"],
        },
      ],
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
    },
  ];

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description,
        companyId: plan.companyId.toString(),
        planTypeId: plan.planTypeId.toString(),
        status: plan.status,
      });
      setFieldValues(plan.fieldValues);

      const planType = planTypes.find((pt) => pt.id === plan.planTypeId);
      setSelectedPlanType(planType || null);
    }
  }, [plan]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const renderField = (field: any) => {
    const value = fieldValues[field.name] || "";

    switch (field.type) {
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              handleFieldChange(field.name, parseFloat(e.target.value) || 0)
            }
            placeholder={`Enter ${field.label}`}
            required={field.required}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label}`}
            required={field.required}
          />
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.companyId || !formData.planTypeId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedCompany = companies.find(
      (c) => c.id === parseInt(formData.companyId),
    );

    const updatedPlan: Plan = {
      ...plan,
      name: formData.name,
      description: formData.description,
      companyId: parseInt(formData.companyId),
      planTypeId: parseInt(formData.planTypeId),
      status: formData.status,
      companyName: selectedCompany?.name || "",
      planTypeName: selectedPlanType?.name || "",
      fieldValues,
    };

    onUpdatePlan(updatedPlan);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Insurance Plan</DialogTitle>
          <DialogDescription>
            Update plan information and field values
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Insurance Company *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) =>
                  setFormData({ ...formData, companyId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="planType">Plan Type *</Label>
              <Select
                value={formData.planTypeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, planTypeId: value })
                }
                disabled
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planTypes.map((planType) => (
                    <SelectItem
                      key={planType.id}
                      value={planType.id.toString()}
                    >
                      {planType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {selectedPlanType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Type Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPlanType.fields.map((field) => (
                    <div key={field.id}>
                      <Label htmlFor={field.name}>
                        {field.label} {field.required && "*"}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "Active" | "Inactive") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Plan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
