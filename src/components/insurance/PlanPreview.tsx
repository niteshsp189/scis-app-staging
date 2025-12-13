import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Building2, Tag, FileText } from "lucide-react";

interface PlanPreviewProps {
  formData: {
    name: string;
    description?: string;
    plan_type_id: number;
    company_id: number;
    status: string;
  };
  companies?: Array<{ id: number; name: string }>;
  planTypes?: Array<{ id: number; name: string }>;
}

export function PlanPreview({
  formData,
  companies = [],
  planTypes = [],
}: PlanPreviewProps) {
  const getCompanyName = (id: number): string => {
    const company = companies.find((c) => c.id === id);
    return company ? company.name : "Not selected";
  };

  const getPlanTypeName = (id: number): string => {
    const planType = planTypes.find((pt) => pt.id === id);
    return planType ? planType.name : "Not selected";
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Plan Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Insurance Plan Name
            </p>
            <p className="text-lg font-semibold">
              {formData.name || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <Badge
              variant={formData.status === "Active" ? "default" : "secondary"}
            >
              {formData.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Plan Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Insurance Company
            </p>
            <p className="text-base">{getCompanyName(formData.company_id)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Insurance Plan Type
            </p>
            <p className="text-base">
              {getPlanTypeName(formData.plan_type_id)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {formData.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">
              {formData.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
