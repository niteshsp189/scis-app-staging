
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { useState } from "react";

interface AdditionalInfoSectionProps {
  formData: {
    referral: string;
    notes: string;
    status: string;
  };
  onUpdate: (updates: Partial<AdditionalInfoSectionProps['formData']>) => void;
  isEditMode?: boolean;
  originalStatus?: string;
}

export const AdditionalInfoSection = ({ formData, onUpdate, isEditMode = false, originalStatus }: AdditionalInfoSectionProps) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validation rules based on backend requirements (consistent with customer form)
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'referral':
        if (value && value.length > 255) return 'Referral source must not exceed 255 characters';
        return '';
      case 'notes':
        // Notes can be longer, typically TEXT type in database
        return '';
      default:
        return '';
    }
  };

  // Handle input changes with validation
  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
    
    // Validate the field and update errors
    const error = validateField(field, value);
    if (error) {
      setValidationErrors({ ...validationErrors, [field]: error });
    } else {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  // Helper function to display validation errors
  const renderFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      return (
        <p className="text-sm text-red-600 mt-1">{validationErrors[fieldName]}</p>
      );
    }
    return null;
  };
  const referralOptions = [
    "Newspaper",
    "Billboard", 
    "Restaurant Placemat",
    "Referral",
    "Friend Referral",
    "Walk in",
    "Phone Book",
    "Internet",
    "Google Search",
    "Social Media",
    "Facebook",
    "List",
    "Lead card",
    "Other",
    "SCIS Lead",
    "Kramer Lead", 
    "BFL Lead",
    "PCP or Physician",
    "DEH"
  ];

  const statusOptions = [
    "Client",
    "Former", 
    "Deceased"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Additional Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Referral Source and Status in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Referral Source</label>
            <Select value={formData.referral} onValueChange={(value) => {
              onUpdate({ referral: value });
              const error = validateField('referral', value);
              if (error) {
                setValidationErrors({ ...validationErrors, referral: error });
              } else {
                const newErrors = { ...validationErrors };
                delete newErrors.referral;
                setValidationErrors(newErrors);
              }
            }}>
              <SelectTrigger className={validationErrors.referral ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select referral source" />
              </SelectTrigger>
              <SelectContent>
                {referralOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderFieldError('referral')}
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={formData.status} onValueChange={(value) => onUpdate({ status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem 
                    key={option} 
                    value={option}
                    disabled={!isEditMode && (option === "Former" || option === "Deceased")}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Warning message for status change to Former */}
            {isEditMode && formData.status === "Former" && originalStatus !== "Former" && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 font-medium">
                      Policy Auto-Cancellation Warning
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      All existing policies for this dependent will be automatically cancelled when the status is changed to "Former".
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Notes in full width row */}
        <div className="mt-4">
          <label className="text-sm font-medium">Notes</label>
          <Input
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes about this person"
            className={validationErrors.notes ? 'border-red-500' : ''}
          />
          {renderFieldError('notes')}
        </div>
      </CardContent>
    </Card>
  );
};
