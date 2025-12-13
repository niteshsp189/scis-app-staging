
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package2 } from "lucide-react";
import { FieldTemplate } from "@/services/fieldTemplatesService";

interface FieldValuesSectionProps {
  fieldTemplates: FieldTemplate[];
  fieldValues: Record<string, any>;
  onFieldValueChange: (fieldName: string, value: any) => void;
}

export function FieldValuesSection({ fieldTemplates, fieldValues, onFieldValueChange }: FieldValuesSectionProps) {
  const renderFieldValue = (field: FieldTemplate) => {
    const value = fieldValues[field.name] || "";

    switch (field.type) {
      case "select":
        return (
          <Select value={value} onValueChange={(val) => onFieldValueChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "number":
        return (
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => onFieldValueChange(field.name, parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${field.label}`}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onFieldValueChange(field.name, e.target.value)}
          />
        );
      case "boolean":
        return (
          <Select value={value.toString()} onValueChange={(val) => onFieldValueChange(field.name, val === "true")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onFieldValueChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label}`}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package2 className="h-5 w-5" />
          Field Values & Defaults
        </CardTitle>
        <p className="text-sm text-gray-600">Set default values for enabled fields</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fieldTemplates.filter(template => template.enabled).map((template) => (
            <div key={template.id} className="space-y-2">
              <Label htmlFor={template.name} className="text-sm font-medium">
                {template.label} {template.required && <span className="text-red-500">*</span>}
              </Label>
              {renderFieldValue(template)}
            </div>
          ))}
        </div>
        {fieldTemplates.filter(template => template.enabled).length === 0 && (
          <p className="text-center text-gray-500 py-4">
            Enable fields above to set default values
          </p>
        )}
      </CardContent>
    </Card>
  );
}
