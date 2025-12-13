import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from "@/types/planType";
import {
  getActiveCompanies,
  getActivePlanTypes,
  getCompanyById,
  getPlanTypeById,
} from "@/services/insuranceDataService";

interface Company {
  id: number;
  name: string;
  status: "Active" | "Inactive" | "Prospect";
  plansCount?: number;
}

interface AddPlanDialogProps {
  onAddPlan: (plan: any) => void;
}

export function AddPlanDialog({ onAddPlan }: AddPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    companyId: "",
    planTypeId: "",
    status: "Active" as "Active" | "Inactive",
  });
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(
    null,
  );

  const companies = getActiveCompanies();
  const planTypes = getActivePlanTypes();

  const handlePlanTypeChange = (planTypeId: string) => {
    setFormData({ ...formData, planTypeId });
    const planType = getPlanTypeById(parseInt(planTypeId));
    setSelectedPlanType(planType || null);
    setFieldValues({});
  };

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

    if (selectedPlanType) {
      const requiredFields = selectedPlanType.fields.filter((f) => f.required);
      const missingFields = requiredFields.filter((f) => !fieldValues[f.name]);

      if (missingFields.length > 0) {
        toast({
          title: "Error",
          description: `Please fill in required fields: ${missingFields.map((f) => f.label).join(", ")}`,
          variant: "destructive",
        });
        return;
      }
    }

    const selectedCompany = getCompanyById(parseInt(formData.companyId));

    const plan = {
      name: formData.name,
      description: formData.description,
      companyId: parseInt(formData.companyId),
      planTypeId: parseInt(formData.planTypeId),
      status: formData.status,
      companyName: selectedCompany?.name || "",
      planTypeName: selectedPlanType?.name || "",
      fieldValues,
    };

    onAddPlan(plan);
    setOpen(false);

    // Reset form
    setFormData({
      name: "",
      description: "",
      companyId: "",
      planTypeId: "",
      status: "Active",
    });
    setFieldValues({});
    setSelectedPlanType(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Insurance Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Insurance Plan</DialogTitle>
          <DialogDescription>
            Create a new insurance plan with dynamic field configuration
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
                onValueChange={handlePlanTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
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
              placeholder="Enter plan name"
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
              placeholder="Describe this insurance plan..."
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Plan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
