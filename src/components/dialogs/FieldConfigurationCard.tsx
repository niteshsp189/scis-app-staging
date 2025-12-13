
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FieldTemplate } from "@/services/fieldTemplatesService";

interface FieldConfigurationCardProps {
  template: FieldTemplate;
  onEnabledChange: (fieldId: string, enabled: boolean) => void;
  onRequiredChange: (fieldId: string, required: boolean) => void;
}

export function FieldConfigurationCard({ 
  template, 
  onEnabledChange, 
  onRequiredChange 
}: FieldConfigurationCardProps) {
  return (
    <Card className={`${template.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{template.label}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={template.type === "select" ? "secondary" : "outline"} className="text-xs">
              {template.type}
            </Badge>
            {template.required && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor={`enabled-${template.id}`} className="text-sm">
            Enable Field
          </Label>
          <Switch
            id={`enabled-${template.id}`}
            checked={template.enabled}
            onCheckedChange={(checked) => onEnabledChange(template.id, checked)}
          />
        </div>
        
        {template.enabled && (
          <div className="flex items-center justify-between">
            <Label htmlFor={`required-${template.id}`} className="text-sm">
              Make Mandatory
            </Label>
            <Switch
              id={`required-${template.id}`}
              checked={template.required}
              onCheckedChange={(checked) => onRequiredChange(template.id, checked)}
            />
          </div>
        )}
        
        {template.options && (
          <div className="text-xs text-gray-600">
            Options: {template.options.join(", ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
