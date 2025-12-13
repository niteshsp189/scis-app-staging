import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Phone, MapPin, Heart, UserCheck, FileText } from "lucide-react";
import { Policy } from "@/types/policy";

interface FamilyMemberPreviewProps {
  formData: {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    ssn: string;
    maritalStatus: string;
    height: string;
    weight: string;
    smoker: string;
    email: string;
    homePhone: string;
    cellPhone: string;
    workPhone: string;
    fax: string;
    address: string;
    apartment: string;
    apartmentType: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    differentMailingAddress: boolean;
    mailingAddress: string;
    mailingApartment: string;
    mailingApartmentType: string;
    mailingCity: string;
    mailingState: string;
    mailingZipCode: string;
    mailingCountry: string;
    referral: string;
    notes: string;
    relationship: string;
    status: string;
  };
  selectedPolicyIds: number[];
  availablePolicies: Policy[];
  ssnDisplayValue: string;
}

export function FamilyMemberPreview({ 
  formData, 
  selectedPolicyIds, 
  availablePolicies,
  ssnDisplayValue 
}: FamilyMemberPreviewProps) {
  const selectedPolicies = availablePolicies.filter(policy => 
    selectedPolicyIds.includes(policy.id)
  );

  return (
    <div className="space-y-6">
      {/* Personal Information Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Full Name</Label>
            <p className="text-sm">{`${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Relationship</Label>
            <p className="text-sm">{formData.relationship}</p>
          </div>
          {formData.gender && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Gender</Label>
              <p className="text-sm">{formData.gender}</p>
            </div>
          )}
          {formData.dateOfBirth && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
              <p className="text-sm">{new Date(formData.dateOfBirth).toLocaleDateString()}</p>
            </div>
          )}
          {ssnDisplayValue && (
            <div>
              <Label className="text-sm font-medium text-gray-600">SSN</Label>
              <p className="text-sm">{ssnDisplayValue}</p>
            </div>
          )}
          {formData.maritalStatus && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Marital Status</Label>
              <p className="text-sm">{formData.maritalStatus}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Physical Details Preview */}
      {(formData.height || formData.weight || formData.smoker) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Physical Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formData.height && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Height</Label>
                <p className="text-sm">{formData.height}</p>
              </div>
            )}
            {formData.weight && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Weight</Label>
                <p className="text-sm">{formData.weight} lbs</p>
              </div>
            )}
            {formData.smoker && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Smoker</Label>
                <p className="text-sm">{formData.smoker}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Information Preview */}
      {(formData.email || formData.homePhone || formData.cellPhone || formData.workPhone || formData.fax) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.email && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p className="text-sm">{formData.email}</p>
              </div>
            )}
            {formData.homePhone && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Home Phone</Label>
                <p className="text-sm">{formData.homePhone}</p>
              </div>
            )}
            {formData.cellPhone && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Cell Phone</Label>
                <p className="text-sm">{formData.cellPhone}</p>
              </div>
            )}
            {formData.workPhone && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Work Phone</Label>
                <p className="text-sm">{formData.workPhone}</p>
              </div>
            )}
            {formData.fax && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Fax</Label>
                <p className="text-sm">{formData.fax}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Address Information Preview */}
      {(formData.address || formData.city || formData.state) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Primary Address</Label>
              <p className="text-sm">
                {formData.address}
                {formData.apartment && ` ${formData.apartmentType} ${formData.apartment}`}
                <br />
                {formData.city}, {formData.state} {formData.zipCode}
                {formData.country && <><br />{formData.country}</>}
              </p>
            </div>
            {formData.differentMailingAddress && formData.mailingAddress && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Mailing Address</Label>
                <p className="text-sm">
                  {formData.mailingAddress}
                  {formData.mailingApartment && ` ${formData.mailingApartmentType} ${formData.mailingApartment}`}
                  <br />
                  {formData.mailingCity}, {formData.mailingState} {formData.mailingZipCode}
                  {formData.mailingCountry && <><br />{formData.mailingCountry}</>}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Policy Assignments Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policy Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPolicies.length === 0 ? (
            <p className="text-sm text-gray-500">No policies selected</p>
          ) : (
            <div className="space-y-2">
              {selectedPolicies.map((policy) => (
                <div key={policy.id} className="p-2 border rounded-md bg-gray-50">
                  <p className="text-sm font-medium">{policy.policy_number}</p>
                  {policy.plan?.name && (
                    <p className="text-xs text-gray-600">{policy.plan.name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Details Preview */}
      {(formData.referral || formData.status || formData.notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.referral && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Referral Source</Label>
                <p className="text-sm">{formData.referral}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <p className="text-sm">{formData.status}</p>
            </div>
            {formData.notes && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-600">Notes</Label>
                <p className="text-sm">{formData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}