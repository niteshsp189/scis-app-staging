import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Settings, Layers, Check, X } from "lucide-react";

interface ExtraField {
  label: string;
  included: boolean;
  required: boolean;
}

interface PlanTypePreviewProps {
  formData: {
    name: string;
    slug: string;
    conflicting_plan_types: number[];
    extra_fields: Record<string, ExtraField>;
    is_active: boolean;
  };
  planTypes?: Array<{ id: number; name: string; }>;
}

export function PlanTypePreview({ formData, planTypes = [] }: PlanTypePreviewProps) {
  const getPlanTypeName = (id: number): string => {
    const planType = planTypes.find(pt => pt.id === id);
    return planType ? planType.name : `Plan Type ${id}`;
  };

  const includedFields = Object.entries(formData.extra_fields).filter(([_, field]) => field.included);
  const requiredFields = includedFields.filter(([_, field]) => field.required);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Plan Type Name</p>
            <p className="text-lg font-semibold">{formData.name || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Slug</p>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{formData.slug || 'Not specified'}</code>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <Badge variant={formData.is_active ? "default" : "secondary"} className={formData.is_active ? "bg-black text-white" : ""}>
              {formData.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Conflicts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.conflicting_plan_types.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.conflicting_plan_types.map((id) => (
                <Badge key={id} variant="outline" className="text-sm">
                  {getPlanTypeName(id)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No conflicts specified</p>
          )}
        </CardContent>
      </Card>

      {/* Extra Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Extra Fields Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {includedFields.length > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Included Fields ({includedFields.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {includedFields.map(([fieldKey, field]) => (
                    <div key={fieldKey} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {requiredFields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Required Fields ({requiredFields.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {requiredFields.map(([fieldKey, field]) => (
                      <Badge key={fieldKey} variant="destructive" className="text-xs">
                        {field.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">No extra fields included</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}