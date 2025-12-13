
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

interface CommonFieldsState {
  hasCompanyField: boolean;
  hasPolicyNumberField: boolean;
  hasAgentOfRecordField: boolean;
  hasWritingAgentField: boolean;
  hasStartDateField: boolean;
  hasEndDateField: boolean;
}

interface CommonPolicyFieldsSectionProps {
  commonFields: CommonFieldsState;
  onUpdate: (updates: Partial<CommonFieldsState>) => void;
  allowTermOverride: boolean;
  onAllowTermOverrideChange: (checked: boolean) => void;
}

export function CommonPolicyFieldsSection({ commonFields, onUpdate, allowTermOverride, onAllowTermOverrideChange }: CommonPolicyFieldsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Common Policy Fields
        </CardTitle>
        <p className="text-sm text-gray-600">Configure which common fields are included for all policies of this product</p>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Policy Number and Agent fields are already included in the policy form by default. 
            Only enable Start Date Override if agents should be able to override the auto-calculated start date.
          </p>
        </div>
        
        {/* Term Length Override Section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900">Term Length Configuration</h3>
          <div className="flex items-center space-x-2">
            <Switch
              id="allowTermOverride"
              checked={allowTermOverride}
              onCheckedChange={onAllowTermOverrideChange}
            />
            <Label htmlFor="allowTermOverride" className="text-sm">
              Allow term length override in policy creation
            </Label>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasCompanyField"
              checked={commonFields.hasCompanyField}
              onChange={(e) => onUpdate({ hasCompanyField: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="hasCompanyField" className="text-sm">Company</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasPolicyNumberField"
              checked={commonFields.hasPolicyNumberField}
              onChange={(e) => onUpdate({ hasPolicyNumberField: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="hasPolicyNumberField" className="text-sm">Policy Number</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasAgentOfRecordField"
              checked={commonFields.hasAgentOfRecordField}
              onChange={(e) => onUpdate({ hasAgentOfRecordField: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="hasAgentOfRecordField" className="text-sm">Agent of Record</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasWritingAgentField"
              checked={commonFields.hasWritingAgentField}
              onChange={(e) => onUpdate({ hasWritingAgentField: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="hasWritingAgentField" className="text-sm">Writing Agent</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasStartDateField"
              checked={commonFields.hasStartDateField}
              onChange={(e) => onUpdate({ hasStartDateField: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="hasStartDateField" className="text-sm">Start Date</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasEndDateField"
              checked={commonFields.hasEndDateField}
              onChange={(e) => onUpdate({ hasEndDateField: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="hasEndDateField" className="text-sm">End Date</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
