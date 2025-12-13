import { ValidatedInput, ValidatedSelect } from "@/components/ui/validated-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateField, DependentFormData } from "@/schemas/dependentValidationSchema";
import { MapPin } from "lucide-react";
import { useState } from "react";

interface AddressInfoSectionProps {
  formData: {
    address: string;
    apartment: string;
    apartmentType: "Apt" | "Unit" | "Suite" | "";
    city: string;
    state: string;
    zipCode: string;
    country: string;
    differentMailingAddress: boolean;
    mailingAddress: string;
    mailingApartment: string;
    mailingApartmentType: "Apt" | "Unit" | "Suite" | "";
    mailingCity: string;
    mailingState: string;
    mailingZipCode: string;
    mailingCountry: string;
  };
  onUpdate: (updates: Partial<AddressInfoSectionProps["formData"]>) => void;
}

export const AddressInfoSection = ({
  formData,
  onUpdate,
}: AddressInfoSectionProps) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle input changes with validation
  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
    
    // Validate the field and update errors
    const error = validateField(field as keyof DependentFormData, value);
    if (error) {
      setValidationErrors({ ...validationErrors, [field]: error });
    } else {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Address Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <ValidatedInput
              id="address"
              label="Street Address"
              value={formData.address}
              onChange={(value) => handleInputChange('address', value)}
              error={validationErrors.address}
              maxLength={255}
              placeholder="e.g., 123 Main Street"
              validationHint="Street address (letters, numbers, spaces, -, ', ., ,, /, &, :) max 255 chars"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedInput
            id="apartment"
            label="Apartment/Unit"
            value={formData.apartment}
            onChange={(value) => handleInputChange('apartment', value)}
            error={validationErrors.apartment}
            maxLength={50}
            placeholder="e.g., Apt 5B or Unit 203"
            validationHint="Apt/unit number (max 50 chars)"
          />
          <ValidatedSelect
            id="apartmentType"
            label="Type"
            value={formData.apartmentType}
            onChange={(value) => handleInputChange('apartmentType', value)}
            error={validationErrors.apartmentType}
            placeholder="Select type"
            validationHint="Select apartment type"
          >
            <SelectItem value="Apt">Apt</SelectItem>
            <SelectItem value="Unit">Unit</SelectItem>
            <SelectItem value="Suite">Suite</SelectItem>
          </ValidatedSelect>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedInput
            id="city"
            label="City"
            value={formData.city}
            onChange={(value) => handleInputChange('city', value)}
            error={validationErrors.city}
            maxLength={80}
            placeholder="e.g., New York"
            validationHint="City (max 80 chars)"
          />
          <ValidatedInput
            id="state"
            label="State/Province"
            value={formData.state}
            onChange={(value) => handleInputChange('state', value)}
            error={validationErrors.state}
            maxLength={80}
            placeholder="e.g., New York or NY"
            validationHint="State (max 80 chars)"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedInput
            id="zipCode"
            label="ZIP/Postal Code"
            value={formData.zipCode}
            onChange={(value) => handleInputChange('zipCode', value)}
            error={validationErrors.zipCode}
            maxLength={15}
            placeholder="e.g., 10001 or 10001-1234"
            validationHint="ZIP code (max 15 chars)"
          />
          <ValidatedInput
            id="country"
            label="Country"
            value={formData.country}
            onChange={(value) => handleInputChange('country', value)}
            error={validationErrors.country}
            maxLength={100}
            placeholder="United States"
            validationHint="Country (max 100 chars)"
          />
        </div>

      <div className="flex items-center space-x-2 mt-4">
        <Checkbox
          id="differentMailingAddress"
          checked={formData.differentMailingAddress}
          onCheckedChange={(checked) =>
            onUpdate({ differentMailingAddress: checked as boolean })
          }
        />
        <label
          htmlFor="differentMailingAddress"
          className="text-sm font-medium"
        >
          Different mailing address
        </label>
      </div>

      {formData.differentMailingAddress && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Mailing Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <ValidatedInput
                id="mailingAddress"
                label="Mailing Street Address"
                value={formData.mailingAddress}
                onChange={(value) => handleInputChange('mailingAddress', value)}
                error={validationErrors.mailingAddress}
                maxLength={255}
                placeholder="e.g., P.O. Box 456 or 789 Oak Avenue"
                validationHint="Mailing address (letters, numbers, spaces, -, ', ., ,, /, &, :) max 255 chars"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ValidatedInput
              id="mailingApartment"
              label="Mailing Apartment/Unit"
              value={formData.mailingApartment}
              onChange={(value) => handleInputChange('mailingApartment', value)}
              error={validationErrors.mailingApartment}
              maxLength={50}
              placeholder="e.g., Suite 100"
              validationHint="Enter mailing apartment/unit number (max 50 characters)"
            />
            <ValidatedSelect
              id="mailingApartmentType"
              label="Mailing Type"
              value={formData.mailingApartmentType}
              onChange={(value) => handleInputChange('mailingApartmentType', value)}
              error={validationErrors.mailingApartmentType}
              placeholder="Select type"
              validationHint="Select mailing apartment type"
            >
              <SelectItem value="Apt">Apt</SelectItem>
              <SelectItem value="Unit">Unit</SelectItem>
              <SelectItem value="Suite">Suite</SelectItem>
            </ValidatedSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <ValidatedInput
              id="mailingCity"
              label="Mailing City"
              value={formData.mailingCity}
              onChange={(value) => handleInputChange('mailingCity', value)}
              error={validationErrors.mailingCity}
              maxLength={80}
              placeholder="e.g., Los Angeles"
              validationHint="Enter mailing city name (max 80 characters)"
            />
            <ValidatedInput
              id="mailingState"
              label="Mailing State/Province"
              value={formData.mailingState}
              onChange={(value) => handleInputChange('mailingState', value)}
              error={validationErrors.mailingState}
              maxLength={80}
              placeholder="e.g., California or CA"
              validationHint="Enter mailing state/province (max 80 characters)"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ValidatedInput
              id="mailingZipCode"
              label="Mailing ZIP/Postal Code"
              value={formData.mailingZipCode}
              onChange={(value) => handleInputChange('mailingZipCode', value)}
              error={validationErrors.mailingZipCode}
              maxLength={15}
              placeholder="e.g., 90210 or 90210-1234"
              validationHint="Enter mailing ZIP code (max 15 characters)"
            />
            <ValidatedInput
              id="mailingCountry"
              label="Mailing Country"
              value={formData.mailingCountry}
              onChange={(value) => handleInputChange('mailingCountry', value)}
              error={validationErrors.mailingCountry}
              placeholder="United States"
              maxLength={100}
              validationHint="Enter mailing country (max 100 characters)"
            />
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
};
