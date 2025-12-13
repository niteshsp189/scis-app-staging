import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, Mail, MapPin, FileText } from "lucide-react";

interface CompanyPreviewProps {
  formData: {
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    fax: string;
    work_phone: string;
    zip_code: string;
    state: string;
    city: string;
    address: string;
    description: string;
    status: string;
  };
}

export function CompanyPreview({ formData }: CompanyPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Company Name</p>
            <p className="text-lg font-semibold">{formData.name || 'Not specified'}</p>
          </div>
          {/* <div>
            <p className="text-sm font-medium text-gray-500">Contact Person</p>
            <p className="text-base">{formData.contact_person || 'Not specified'}</p>
          </div> */}
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <Badge variant={formData.status === "Active" ? "default" : "secondary"}>
              {formData.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email
            </p>
            <p className="text-base">{formData.email || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Phone className="h-4 w-4" />
              Cell Phone
            </p>
            <p className="text-base">{formData.phone || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Work Phone</p>
            <p className="text-base">{formData.work_phone || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fax</p>
            <p className="text-base">{formData.fax || 'Not specified'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="text-base">{formData.address || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">City</p>
            <p className="text-base">{formData.city || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">State</p>
            <p className="text-base">{formData.state || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">ZIP Code</p>
            <p className="text-base">{formData.zip_code || 'Not specified'}</p>
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
            <p className="text-base whitespace-pre-wrap">{formData.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}