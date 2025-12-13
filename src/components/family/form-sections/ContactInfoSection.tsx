
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidatedInput } from "@/components/ui/validated-input";
import { validateField, DependentFormData } from "@/schemas/dependentValidationSchema";
import { Phone } from "lucide-react";
import { useState } from "react";

interface ContactInfoSectionProps {
  formData: {
    email: string;
    homePhone: string;
    cellPhone: string;
    workPhone: string;
    fax: string;
  };
  onUpdate: (updates: Partial<ContactInfoSectionProps['formData']>) => void;
}

export const ContactInfoSection = ({ formData, onUpdate }: ContactInfoSectionProps) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle input changes with validation
  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
    
    // Validate the field and update errors
    const error = validateField(field as keyof DependentFormData, value);
    const newErrors = { ...validationErrors };
    
    if (error) {
      newErrors[field] = error;
    } else {
      delete newErrors[field];
    }
    
    // Special handling for phone fields - clear both phone errors if one is filled
    if ((field === 'homePhone' || field === 'cellPhone') && value.trim() !== '') {
      delete newErrors.homePhone;
      delete newErrors.cellPhone;
    }
    
    setValidationErrors(newErrors);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Contact Information
        </CardTitle>

      </CardHeader>
      <CardContent>
        {!formData.homePhone && !formData.cellPhone && (
          <p className="text-sm text-amber-600 flex items-center gap-1 mt-2">
            <span>⚠️</span>
            At least one phone number (Home Phone or Cell Phone) is required
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedInput
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            error={validationErrors.email}
            maxLength={123}
            placeholder="e.g., sophia.williams@email.com (optional)"
            validationHint="Valid email address (max 123 chars)"
          />
          <ValidatedInput
            id="homePhone"
            label="Home Phone"
            value={formData.homePhone}
            onChange={(value) => handleInputChange('homePhone', value)}
            error={validationErrors.homePhone}
            required={!formData.homePhone && !formData.cellPhone}
            maxLength={17}
            placeholder="e.g., (555) 123-4567"
            validationHint="Phone number (digits, spaces, (), +, -) max 17 chars"
          />
        </div>
        
        
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <ValidatedInput
            id="cellPhone"
            label="Cell Phone"
            value={formData.cellPhone}
            onChange={(value) => handleInputChange('cellPhone', value)}
            error={validationErrors.cellPhone}
            required={!formData.homePhone && !formData.cellPhone}
            maxLength={17}
            placeholder="e.g., (555) 987-6543"
            validationHint="Mobile phone (digits, spaces, (), +, -) max 17 chars"
          />
          <ValidatedInput
            id="workPhone"
            label="Work Phone"
            value={formData.workPhone}
            onChange={(value) => handleInputChange('workPhone', value)}
            error={validationErrors.workPhone}
            maxLength={17}
            placeholder="e.g., (555) 456-7890 ext 123"
            validationHint="Work phone (digits, spaces, (), +, -) max 17 chars"
          />
          <ValidatedInput
            id="fax"
            label="Fax"
            value={formData.fax}
            onChange={(value) => handleInputChange('fax', value)}
            error={validationErrors.fax}
            maxLength={17}
            placeholder="e.g., (555) 321-9876"
            validationHint="Fax number (digits, spaces, (), +, -) max 17 chars"
          />
        </div>
      </CardContent>
    </Card>
  );
};
