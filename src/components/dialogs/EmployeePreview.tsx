import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Building2, Briefcase, Shield, Check } from "lucide-react";

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface EmployeePreviewProps {
  formData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
    position: string;
    company: string;
    location: string;
    roles: number[];
    is_active: boolean;
  };
  roles?: Role[];
}

export function EmployeePreview({ formData, roles = [] }: EmployeePreviewProps) {
  const getSelectedRoles = () => {
    return roles.filter(role => formData.roles.includes(role.id));
  };

  const selectedRoles = getSelectedRoles();

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Full Name</p>
            <p className="text-lg font-semibold">
              {formData.first_name || formData.last_name 
                ? `${formData.first_name} ${formData.last_name}`.trim()
                : 'Not specified'
              }
            </p>
          </div>
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
              Phone
            </p>
            <p className="text-base">{formData.phone || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Account Status</p>
            <Badge variant={formData.is_active ? "default" : "secondary"}>
              {formData.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Work Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Position/Title</p>
            <p className="text-base">{formData.position || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Company
            </p>
            <p className="text-base">{formData.company || 'Not specified'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Location
            </p>
            <p className="text-base">{formData.location || 'Not specified'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Password</p>
            <p className="text-base text-gray-600 italic">
              {formData.password ? '••••••••• (Password set)' : 'Not set'}
            </p>
            {formData.password && formData.password_confirmation && (
              <div className="mt-1 flex items-center gap-1 text-sm">
                {formData.password === formData.password_confirmation ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-600">⚠ Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">
              Assigned Roles ({selectedRoles.length})
            </p>
            {selectedRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedRoles.map((role) => (
                  <Badge key={role.id} variant="outline" className="text-sm">
                    {role.name}
                  </Badge>
                ))}              </div>
            ) : (
              <p className="text-gray-500 italic">No roles assigned</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}