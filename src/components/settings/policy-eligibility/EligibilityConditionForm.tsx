
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface EligibilityCondition {
  id: string;
  policyType: string;
  conditionType: string;
  operator: string;
  value: string;
  description: string;
  isActive: boolean;
}

interface EligibilityConditionFormProps {
  onAddCondition: (condition: Omit<EligibilityCondition, 'id' | 'isActive'>) => void;
}

export const EligibilityConditionForm = ({ onAddCondition }: EligibilityConditionFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    policyType: "",
    conditionType: "",
    operator: "",
    value: "",
    description: ""
  });

  const policyTypes = [
    "Life Insurance",
    "Health Insurance",
    "Auto Insurance",
    "Home Insurance",
    "Travel Insurance",
    "Disability Insurance"
  ];

  const conditionTypes = [
    "age",
    "income",
    "employment",
    "location",
    "credit_score",
    "health_status",
    "driving_record"
  ];

  const operators = [
    "minimum",
    "maximum",
    "between",
    "equals",
    "not_equals",
    "contains",
    "excludes"
  ];

  const handleSubmit = () => {
    if (!formData.policyType || !formData.conditionType || !formData.operator || !formData.value) {
      return;
    }

    onAddCondition({
      policyType: formData.policyType,
      conditionType: formData.conditionType,
      operator: formData.operator,
      value: formData.value,
      description: formData.description || `${formData.conditionType} ${formData.operator} ${formData.value}`
    });

    setFormData({ policyType: "", conditionType: "", operator: "", value: "", description: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Condition
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Eligibility Condition</DialogTitle>
          <DialogDescription>
            Create a new condition that will be checked when determining policy eligibility.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="policyType">Policy Type</Label>
            <Select value={formData.policyType} onValueChange={(value) => setFormData({...formData, policyType: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select policy type" />
              </SelectTrigger>
              <SelectContent>
                {policyTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="conditionType">Condition Type</Label>
            <Select value={formData.conditionType} onValueChange={(value) => setFormData({...formData, conditionType: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select condition type" />
              </SelectTrigger>
              <SelectContent>
                {conditionTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="operator">Operator</Label>
            <Select value={formData.operator} onValueChange={(value) => setFormData({...formData, operator: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op} value={op}>{op.replace('_', ' ').toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              placeholder="Enter condition value (e.g., 18-65, 25000, CA)"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what this condition checks"
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Add Condition
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
