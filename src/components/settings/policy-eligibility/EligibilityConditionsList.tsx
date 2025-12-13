
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Settings } from "lucide-react";

interface EligibilityCondition {
  id: string;
  policyType: string;
  conditionType: string;
  operator: string;
  value: string;
  description: string;
  isActive: boolean;
}

interface EligibilityConditionsListProps {
  conditions: EligibilityCondition[];
  onToggleCondition: (id: string) => void;
  onDeleteCondition: (id: string) => void;
}

export const EligibilityConditionsList = ({ 
  conditions, 
  onToggleCondition, 
  onDeleteCondition 
}: EligibilityConditionsListProps) => {
  if (conditions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No eligibility conditions configured yet.</p>
        <p className="text-sm">Add conditions to control policy eligibility checks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conditions.map((condition) => (
        <div key={condition.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {condition.policyType}
                </Badge>
                <Badge variant="outline">
                  {condition.conditionType.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {condition.operator.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {condition.value}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{condition.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${condition.id}`} className="text-sm">
                  Active
                </Label>
                <Switch
                  id={`active-${condition.id}`}
                  checked={condition.isActive}
                  onCheckedChange={() => onToggleCondition(condition.id)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteCondition(condition.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
