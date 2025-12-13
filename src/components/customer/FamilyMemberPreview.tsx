import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FamilyMember } from '@/types/customer';
import { Policy } from '@/types/policy';

export interface FamilyMemberPreviewProps {
  data: FamilyMember & {
    selectedPolicies?: Policy[];
  };
}

export const FamilyMemberPreview: React.FC<FamilyMemberPreviewProps> = ({ data }) => {
  const formatValue = (value: string | undefined | null, fallback = 'Not provided') => {
    return value && value.trim() ? value : fallback;
  };

  const formatPhone = (phone: string | undefined) => {
    if (!phone) return 'Not provided';
    
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if it's a 10-digit number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone; // Return as-is if not a standard 10-digit number
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="text-sm text-gray-900 mt-1">
                {[data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ')}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Relationship</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatValue(data.relationship)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Date of Birth</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatValue(data.dateOfBirth)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatValue(data.gender)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Social Security Number</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatValue(data.ssn)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Marital Status</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatValue(data.maritalStatus)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Physical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Height</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatValue(data.height)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Weight</label>
              <div className="text-sm text-gray-900 mt-1">
                {data.weight ? `${data.weight} lbs` : 'Not provided'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Smoker</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatValue(data.smoker)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatValue(data.email)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatPhone(data.phone || data.cellPhone)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Home Phone</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatPhone(data.homePhone)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Work Phone</label>
              <div className="text-sm text-gray-900 mt-1">
                {formatPhone(data.workPhone)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      {(data.address || data.city || data.state || data.zipCode) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <div className="text-sm text-gray-900 mt-1">
                  {formatValue(data.address)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">City</label>
                <div className="text-sm text-gray-900 mt-1">
                  {formatValue(data.city)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">State</label>
                <div className="text-sm text-gray-900 mt-1">
                  {formatValue(data.state)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">ZIP Code</label>
                <div className="text-sm text-gray-900 mt-1">
                  {formatValue(data.zipCode)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Country</label>
                <div className="text-sm text-gray-900 mt-1">
                  {formatValue(data.country, 'United States')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Assignments */}
      {data.selectedPolicies && data.selectedPolicies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Policy Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.selectedPolicies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div>
                    <div className="font-medium text-sm">{policy.policy_number}</div>
                    {policy.plan?.name && (
                      <div className="text-sm text-gray-600">{policy.plan.name}</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Status: {policy.status || 'Active'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Details */}
      {data.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                {data.notes}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};