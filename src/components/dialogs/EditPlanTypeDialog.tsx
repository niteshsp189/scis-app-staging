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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { PlanType, PlanTypeField } from "@/types/planType";

interface EditPlanTypeDialogProps {
  planType: PlanType;
  open: boolean;
  onClose: () => void;
  onUpdatePlanType: (planType: PlanType) => void;
}

export function EditPlanTypeDialog({
  planType,
  open,
  onClose,
  onUpdatePlanType,
}: EditPlanTypeDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    status: "Draft" as "Active" | "Inactive" | "Draft",
  });

  const [fields, setFields] = useState<PlanTypeField[]>([]);

  useEffect(() => {
    if (planType) {
      setFormData({
        name: planType.name,
        description: planType.description,
        category: planType.category,
        status: planType.status,
      });
      setFields(planType.fields);
    }
  }, [planType]);

  const updateField = (id: string, updates: Partial<PlanTypeField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const updatedPlanType = {
      ...planType,
      ...formData,
      fields,
    };

    onUpdatePlanType(updatedPlanType);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Plan Type</DialogTitle>
          <DialogDescription>
            Update plan type configuration and field settings
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Type Name *</Label>
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
              <Label htmlFor="category">Plan Type Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under 65">Under 65</SelectItem>
                  <SelectItem value="Supplementary">Supplementary</SelectItem>
                  <SelectItem value="Dental">Dental</SelectItem>
                  <SelectItem value="Medicare Advantage">
                    Medicare Advantage
                  </SelectItem>
                  <SelectItem value="Medicare PDP">Medicare PDP</SelectItem>
                  <SelectItem value="Medicare Supplement">
                    Medicare Supplement
                  </SelectItem>
                  <SelectItem value="Auto Insurance">Auto Insurance</SelectItem>
                  <SelectItem value="Home Insurance">Home Insurance</SelectItem>
                  <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                  <SelectItem value="Health Insurance">
                    Health Insurance
                  </SelectItem>
                  <SelectItem value="Business Insurance">
                    Business Insurance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Field Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={field.included}
                      onCheckedChange={(checked) =>
                        updateField(field.id, { included: checked })
                      }
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
                        onCheckedChange={(checked) =>
                          updateField(field.id, { required: checked })
                        }
                      />
                      <Label className="text-sm">Required</Label>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Plan Type</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
