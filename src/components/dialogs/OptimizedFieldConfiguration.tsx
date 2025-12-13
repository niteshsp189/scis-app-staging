
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Square, Settings2, RotateCcw } from "lucide-react";
import { FieldTemplate } from "@/services/fieldTemplatesService";

interface OptimizedFieldConfigurationProps {
  category: string;
  fieldTemplates: FieldTemplate[];
  onEnabledChange: (fieldId: string, enabled: boolean) => void;
  onRequiredChange: (fieldId: string, required: boolean) => void;
  onEnableAll: () => void;
  onEnableRequired: () => void;
  onReset: () => void;
}

export function OptimizedFieldConfiguration({
  category,
  fieldTemplates,
  onEnabledChange,
  onRequiredChange,
  onEnableAll,
  onEnableRequired,
  onReset
}: OptimizedFieldConfigurationProps) {
  const enabledCount = fieldTemplates.filter(t => t.enabled).length;
  const requiredCount = fieldTemplates.filter(t => t.required && t.enabled).length;

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case "text": return "bg-blue-100 text-blue-800";
      case "number": return "bg-green-100 text-green-800";
      case "date": return "bg-purple-100 text-purple-800";
      case "select": return "bg-orange-100 text-orange-800";
      case "boolean": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {category} Field Configuration
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Configure which fields to include • {enabledCount} enabled • {requiredCount} required
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onEnableAll} variant="outline" size="sm">
              <CheckSquare className="h-4 w-4 mr-2" />
              Enable All
            </Button>
            <Button onClick={onEnableRequired} variant="outline" size="sm">
              <Square className="h-4 w-4 mr-2" />
              Required Only
            </Button>
            <Button onClick={onReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fieldTemplates.map((template) => (
            <div
              key={template.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                template.enabled 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{template.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{template.name}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getFieldTypeColor(template.type)}`}
                    >
                      {template.type}
                    </Badge>
                    {template.required && template.enabled && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`enabled-${template.id}`} className="text-sm font-medium">
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
                        Make Required
                      </Label>
                      <Switch
                        id={`required-${template.id}`}
                        checked={template.required}
                        onCheckedChange={(checked) => onRequiredChange(template.id, checked)}
                      />
                    </div>
                  )}
                </div>

                {template.options && (
                  <div className="text-xs text-gray-600 pt-2 border-t">
                    <span className="font-medium">Options:</span> {template.options.slice(0, 2).join(", ")}
                    {template.options.length > 2 && ` +${template.options.length - 2} more`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
