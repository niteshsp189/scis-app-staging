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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface InsurancePlan {
  id: number;
  name: string;
  description: string;
  planType: string;
  companyId: number;
  companyName: string;
  status: string;
  premium: number;
  deductible: number;
  outOfPocket: number;
  createdAt: string;
  policiesCount: number;
}

interface EditInsurancePlanDialogProps {
  plan: InsurancePlan;
  open: boolean;
  onClose: () => void;
  onUpdatePlan: (plan: InsurancePlan) => void;
}

export const EditInsurancePlanDialog = ({
  plan,
  open,
  onClose,
  onUpdatePlan,
}: EditInsurancePlanDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    planType: "",
    companyId: "",
    companyName: "",
    status: "",
    premium: "",
    deductible: "",
    outOfPocket: "",
  });

  // Mock companies data
  const companies = [
    { id: 1, name: "Anthem Blue Cross" },
    { id: 2, name: "UnitedHealthcare" },
    { id: 3, name: "Aetna" },
    { id: 4, name: "Cigna" },
    { id: 5, name: "Humana" },
  ];

  const planTypes = [
    "Medicare Advantage",
    "Medicare PDP",
    "Medicare Supplement",
    "Auto Insurance",
    "Home Insurance",
    "Life Insurance",
    "Health Insurance",
    "Business Insurance",
  ];

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description,
        planType: plan.planType,
        companyId: plan.companyId.toString(),
        companyName: plan.companyName,
        status: plan.status,
        premium: plan.premium.toString(),
        deductible: plan.deductible.toString(),
        outOfPocket: plan.outOfPocket.toString(),
      });
    }
  }, [plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.planType || !formData.companyId) {
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

    const updatedPlan: InsurancePlan = {
      ...plan,
      name: formData.name,
      description: formData.description,
      planType: formData.planType,
      companyId: parseInt(formData.companyId),
      companyName: selectedCompany?.name || "",
      status: formData.status,
      premium: parseFloat(formData.premium) || 0,
      deductible: parseFloat(formData.deductible) || 0,
      outOfPocket: parseFloat(formData.outOfPocket) || 0,
    };

    onUpdatePlan(updatedPlan);
  };

  const handleCompanyChange = (companyId: string) => {
    const selectedCompany = companies.find((c) => c.id === parseInt(companyId));
    setFormData((prev) => ({
      ...prev,
      companyId,
      companyName: selectedCompany?.name || "",
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Insurance Plan</DialogTitle>
          <DialogDescription>
            Update the insurance plan information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Insurance Company *</Label>
              <Select
                value={formData.companyId}
                onValueChange={handleCompanyChange}
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
                value={formData.planType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, planType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  {planTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
                setFormData((prev) => ({ ...prev, name: e.target.value }))
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
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter plan description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="premium">Monthly Premium ($)</Label>
              <Input
                id="premium"
                type="number"
                step="0.01"
                value={formData.premium}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, premium: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="deductible">Deductible ($)</Label>
              <Input
                id="deductible"
                type="number"
                value={formData.deductible}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deductible: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="outOfPocket">Out of Pocket Max ($)</Label>
              <Input
                id="outOfPocket"
                type="number"
                value={formData.outOfPocket}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    outOfPocket: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
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
};
