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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AddPlanTypeDialog } from "@/components/dialogs/AddPlanTypeDialog";

interface AddInsurancePlanDialogProps {
  onAddPlan: (plan: any) => void;
}

export const AddInsurancePlanDialog = ({
  onAddPlan,
}: AddInsurancePlanDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    planType: "",
    companyId: "",
    companyName: "",
    status: "Active",
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
    "Health Insurance",
    "Life Insurance",
    "Auto Insurance",
    "Home Insurance",
    "Business Insurance",
    "Medicare Advantage",
    "Medicare Supplement",
    "Medicare PDP",
    "Dental Insurance",
    "Vision Insurance",
    "Disability Insurance",
    "Long-term Care Insurance",
  ];

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

    onAddPlan({
      ...formData,
      companyId: parseInt(formData.companyId),
      companyName: selectedCompany?.name || "",
      premium: parseFloat(formData.premium) || 0,
      deductible: parseFloat(formData.deductible) || 0,
      outOfPocket: parseFloat(formData.outOfPocket) || 0,
    });

    setFormData({
      name: "",
      description: "",
      planType: "",
      companyId: "",
      companyName: "",
      status: "Active",
      premium: "",
      deductible: "",
      outOfPocket: "",
    });
    setOpen(false);
  };

  const handleCompanyChange = (companyId: string) => {
    const selectedCompany = companies.find((c) => c.id === parseInt(companyId));
    setFormData((prev) => ({
      ...prev,
      companyId,
      companyName: selectedCompany?.name || "",
    }));
  };

  const handleAddPlanType = (newPlanType: any) => {
    toast({
      title: "Plan Type Created",
      description: `${newPlanType.name} plan type has been created and can now be selected.`,
    });
    // In a real app, you would refresh the plan types list here
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Insurance Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Insurance Plan</DialogTitle>
          <DialogDescription>
            Create a new insurance plan under a company.
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="planType">Plan Type *</Label>
                <AddPlanTypeDialog onAddPlanType={handleAddPlanType} />
              </div>
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
};
