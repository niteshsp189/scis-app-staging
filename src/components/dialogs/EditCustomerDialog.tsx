import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, MapPin, Heart, UserCheck, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DateInput } from "@/components/ui/date-input";
import { ValidatedInput, ValidatedSelect } from "@/components/ui/validated-input";
import { validateField, validateForm, CustomerFormData } from "@/schemas/customerValidationSchema";
import { formatSSNDisplay, cleanSSNForStorage, formatSSNInput } from "@/utils/ssnFormatter";
import { CustomerPreview } from "@/components/customer/CustomerPreview";

import { customerService } from "@/services/customerService";
import { CustomerData } from "@/types/customer";

interface EditCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerData;
  onCustomerUpdated?: () => void;
  forceClientValidation?: boolean; // Force strict client validation even for prospects
}

export function EditCustomerDialog({ isOpen, onClose, customer, onCustomerUpdated, forceClientValidation = false }: EditCustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<'form' | 'preview'>('form');

  // Track SSN display value separately to handle formatting during input
  const [ssnDisplayValue, setSsnDisplayValue] = useState('');
  const [originalStatus, setOriginalStatus] = useState('');

  // Determine if we should use strict validation (Client rules)
  const useStrictValidation = forceClientValidation || originalStatus !== "Prospect";
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    ssn: "",
    maritalStatus: "",
    height: "",
    weight: "",
    smoker: "",
    email: "",
    homePhone: "",
    cellPhone: "",
    workPhone: "",
    fax: "",
    address: "",
    apartment: "",
    apartmentType: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    differentMailingAddress: false,
    mailingAddress: "",
    mailingApartment: "",
    mailingApartmentType: "",
    mailingCity: "",
    mailingState: "",
    mailingZipCode: "",
    mailingCountry: "",
    referral: "",
    status: "Client",
    isInClientBook: false,
    isInDontCallList: false,
  });

  // Clear validation errors when user starts typing
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Validate the field using Zod schema
    // Use strict validation (client rules) when converting prospect or editing client
    // Clean the value for height validation
    let validationValue = value;
    if (field === 'height' && value) {
      const cleanedData = cleanFormDataForValidation({ ...formData, [field]: value });
      validationValue = cleanedData.height || "";
    }
    const error = validateField(field as keyof CustomerFormData, validationValue, !useStrictValidation);
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

  // Initialize form data when customer prop changes
  useEffect(() => {
    if (customer) {
      const initialStatus = customer.status || "Client";
      // When forceClientValidation is true (convert mode), automatically set status to "Client"
      const formStatus = forceClientValidation && initialStatus === "Prospect" ? "Client" : initialStatus;

      setFormData({
        firstName: customer.firstName || "",
        middleName: customer.middleName || "",
        lastName: customer.lastName || "",
        gender: customer.gender || "",
        dateOfBirth: customer.dateOfBirth || "",
        ssn: customer.ssn || "",
        maritalStatus: customer.maritalStatus || "",
        height: customer.height || "",
        weight: customer.weight || "",
        smoker: customer.smoker || "",
        email: customer.email || "",
        homePhone: customer.homePhone || "",
        cellPhone: customer.cellPhone || "",
        workPhone: customer.workPhone || "",
        fax: customer.fax || "",
        address: customer.address || "",
        apartment: customer.apartment || "",
        apartmentType: customer.apartmentType || "",
        city: customer.city || "",
        state: customer.state || "",
        zipCode: customer.zipCode || "",
        country: customer.country || "",
        differentMailingAddress: customer.differentMailingAddress || false,
        mailingAddress: customer.mailingAddress || "",
        mailingApartment: customer.mailingApartment || "",
        mailingApartmentType: customer.mailingApartmentType || "",
        mailingCity: customer.mailingCity || "",
        mailingState: customer.mailingState || "",
        mailingZipCode: customer.mailingZipCode || "",
        mailingCountry: customer.mailingCountry || "",
        referral: customer.referral || "",
        status: formStatus,
        isInClientBook: customer.isInClientBook || false,
        isInDontCallList: customer.isInDontCallList || false,
      });

      // Set original status for change detection
      setOriginalStatus(initialStatus);

      // Set initial SSN display value
      setSsnDisplayValue(formatSSNDisplay(customer.ssn || ""));
      // Clear any existing validation errors when loading customer data
      setValidationErrors({});
    }
  }, [customer, forceClientValidation]);

  // Sync SSN display value with stored SSN value when form is reset
  // Only clear SSN display if formData.ssn is empty AND we have customer data loaded
  // This prevents interference with initial population
  useEffect(() => {
    if (customer && formData.ssn === '' && ssnDisplayValue !== '') {
      setSsnDisplayValue('');
    }
  }, [formData.ssn, customer, ssnDisplayValue]);

  // Utility function to scroll to first error field
  const scrollToFirstError = (errors: Record<string, string>) => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  };

  // Utility function to get first error message for alert
  const getFirstErrorMessage = (errors: Record<string, string>) => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField && errors[firstErrorField]) {
      const fieldLabel = firstErrorField.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      return `${fieldLabel}: ${errors[firstErrorField]}`;
    }
    return 'Please fix the validation errors and try again.';
  };

  // Parse existing height into feet and inches
  const parseHeight = (height: string) => {
    const match = height.match(/(\d+)'?\s*(\d+)?"?/);
    if (match) {
      return {
        feet: match[1] || "",
        inches: match[2] || ""
      };
    }
    return { feet: "", inches: "" };
  };

  const { feet, inches } = parseHeight(formData.height);

  // Helper function to clean form data for validation
  const cleanFormDataForValidation = (data: CustomerFormData) => {
    const cleaned = { ...data };
    
    // Clean height - if it contains zeros or is malformed, make it empty for validation
    if (cleaned.height) {
      // Check for common invalid patterns including just "0"
      if (cleaned.height === "0" || cleaned.height === "0'0\"" || cleaned.height === "'\"" || cleaned.height === "0'" || cleaned.height === "'0\"") {
        cleaned.height = "";
      } else {
        const heightMatch = cleaned.height.match(/^(\d+)'(\d+)"$/);
        if (heightMatch) {
          const feet = parseInt(heightMatch[1]);
          const inches = parseInt(heightMatch[2]);
          // If feet is 0 or both are 0, treat as empty
          if (feet === 0) {
            cleaned.height = "";
          }
        }
      }
    }
    
    return cleaned;
  };

  const handleHeightChange = (newFeet: string, newInches: string) => {
    // Clear previous height errors
    const newErrors = { ...validationErrors };
    delete newErrors.height;
    setValidationErrors(newErrors);

    // Create the height string in the expected format - but only if we have valid values
    let heightString = "";
    const feetNum = parseInt(newFeet) || 0;
    const inchesNum = parseInt(newInches) || 0;
    
    // Only create a height string if we have meaningful values (not just zeros)
    if ((newFeet && newFeet !== "0" && feetNum > 0) || (newInches && newInches !== "0" && inchesNum > 0)) {
      // If feet is provided and valid, use it; otherwise use empty string
      const feetPart = (newFeet && newFeet !== "0" && feetNum > 0) ? newFeet : "";
      // If inches is provided, use it; if feet is provided but inches isn't, default to 0
      const inchesPart = (feetPart && !newInches) ? "0" : (newInches || "");
      
      if (feetPart || inchesPart) {
        heightString = feetPart + "'" + inchesPart + '"';
      }
    }

    setFormData({ ...formData, height: heightString });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields using Zod schema - use prospect validation only if NOT using strict validation
    const cleanedData = cleanFormDataForValidation({
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      email: formData.email,
      gender: formData.gender as "Male" | "Female" | "Other" | "",
      dateOfBirth: formData.dateOfBirth,
      ssn: formData.ssn,
      maritalStatus: formData.maritalStatus as "Single" | "Married" | "Divorced" | "Widowed" | "",
      height: formData.height,
      weight: formData.weight,
      smoker: formData.smoker as "Yes" | "No" | "",
      homePhone: formData.homePhone || '',
      cellPhone: formData.cellPhone || '',
      workPhone: formData.workPhone || '',
      fax: formData.fax || '',
      address: formData.address,
      apartment: formData.apartment,
      apartmentType: formData.apartmentType as "Apt" | "Unit" | "Suite" | "",
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
      mailingAddress: formData.mailingAddress,
      mailingApartment: formData.mailingApartment,
      mailingApartmentType: formData.mailingApartmentType as "Apt" | "Unit" | "Suite" | "",
      mailingCity: formData.mailingCity,
      mailingState: formData.mailingState,
      mailingZipCode: formData.mailingZipCode,
      mailingCountry: formData.mailingCountry,
      differentMailingAddress: formData.differentMailingAddress,
      referral: formData.referral,
      status: formData.status as "Client" | "Former" | "Deceased",
      customerType: formData.status as "Client" | "Former" | "Deceased",
    } as CustomerFormData);
    const errors = validateForm(cleanedData, !useStrictValidation); // Use prospect validation only when NOT enforcing strict validation

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstErrorMessage = getFirstErrorMessage(errors);
      toast({
        title: "Validation Error",
        description: firstErrorMessage,
        variant: "destructive"
      });
      // Scroll to first error field after a short delay to allow state update
      setTimeout(() => scrollToFirstError(errors), 100);
      return;
    }

    setLoading(true);

    try {
      // Update customer via API
      const customerData = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        gender: formData.gender as "Male" | "Female" | "Other" | "",
        dateOfBirth: formData.dateOfBirth,
        ssn: formData.ssn,
        maritalStatus: formData.maritalStatus as "Single" | "Married" | "Divorced" | "Widowed" | "",
        height: formData.height,
        weight: formData.weight,
        smoker: formData.smoker as "Yes" | "No" | "",
        email: formData.email,
        homePhone: formData.homePhone,
        cellPhone: formData.cellPhone,
        workPhone: formData.workPhone,
        fax: formData.fax,
        address: formData.address,
        apartment: formData.apartment,
        apartmentType: formData.apartmentType as "Apt" | "Unit" | "Suite" | "",
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        mailingAddress: formData.mailingAddress,
        mailingApartment: formData.mailingApartment,
        mailingApartmentType: formData.mailingApartmentType as "Apt" | "Unit" | "Suite" | "",
        mailingCity: formData.mailingCity,
        mailingState: formData.mailingState,
        mailingZipCode: formData.mailingZipCode,
        mailingCountry: formData.mailingCountry,
        differentMailingAddress: formData.differentMailingAddress,
        referral: formData.referral,
        status: formData.status as "Client" | "Former" | "Deceased",
        isInClientBook: formData.isInClientBook,
        isInDontCallList: formData.isInDontCallList,
      };

      await customerService.updateCustomer(customer.id, customerData);

      // Call the callback
      if (onCustomerUpdated) {
        onCustomerUpdated();
      }

      // Close dialog
      onClose();

      toast({
        title: "Success",
        description: `${formData.firstName} ${formData.lastName} has been updated successfully.`,
      });

    } catch (error: any) {
      console.error('Error updating customer:', error);

      // Check if this is a validation error (422 status code)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const formattedErrors: Record<string, string> = {};

        // Convert Laravel validation errors to a flat object
        Object.entries(errors).forEach(([key, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            // Convert snake_case to camelCase for frontend field names
            const camelCaseKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            formattedErrors[camelCaseKey] = messages[0];
          }
        });

        setValidationErrors(formattedErrors);
        const firstErrorMessage = getFirstErrorMessage(formattedErrors);
        toast({
          title: "Validation Error",
          description: firstErrorMessage,
          variant: "destructive"
        });

        // Scroll to first error field
        setTimeout(() => scrollToFirstError(formattedErrors), 100);
      } else {
        // Generic error
        toast({
          title: "Error",
          description: error.message || "Failed to update customer. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before moving to preview
    const cleanedData = cleanFormDataForValidation(formData);
    const errors = validateForm(cleanedData, !useStrictValidation);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);

      // Show toast notification for validation errors
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive"
      });

      // Scroll to first error field after DOM updates
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.getElementById(firstErrorField) ||
          document.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }, 100);

      return;
    }

    setCurrentStep('preview');
  };

  const handleGoBack = () => {
    setCurrentStep('form');
  };

  const handleFinalSubmit = () => {
    // Create a mock form event for the existing handleSubmit function
    const mockEvent = {
      preventDefault: () => { },
    } as React.FormEvent;
    handleSubmit(mockEvent);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus on first input when dialog opens
          e.preventDefault();
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {forceClientValidation && originalStatus === "Prospect" ? "Convert Prospect to Client" : originalStatus === "Prospect" ? "Edit Prospect" : "Edit Customer"} {currentStep === 'preview' && '- Review Changes'}
          </DialogTitle>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'form' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                  1
                </div>
                <span className={`ml-2 text-sm ${currentStep === 'form' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Edit Information
                </span>
              </div>

              <div className={`w-8 h-0.5 ${currentStep === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                  }`}>
                  2
                </div>
                <span className={`ml-2 text-sm ${currentStep === 'preview' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Review Changes
                </span>
              </div>
            </div>

            {currentStep === 'form' && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Reset form data to original customer data
                  if (customer) {
                    const initialStatus = customer.status || "Client";
                    const formStatus = forceClientValidation && initialStatus === "Prospect" ? "Client" : initialStatus;

                    setFormData({
                      firstName: customer.firstName || "",
                      middleName: customer.middleName || "",
                      lastName: customer.lastName || "",
                      gender: customer.gender || "",
                      dateOfBirth: customer.dateOfBirth || "",
                      ssn: customer.ssn || "",
                      maritalStatus: customer.maritalStatus || "",
                      height: customer.height || "",
                      weight: customer.weight || "",
                      smoker: customer.smoker || "",
                      email: customer.email || "",
                      homePhone: customer.homePhone || "",
                      cellPhone: customer.cellPhone || "",
                      workPhone: customer.workPhone || "",
                      fax: customer.fax || "",
                      address: customer.address || "",
                      apartment: customer.apartment || "",
                      apartmentType: customer.apartmentType || "",
                      city: customer.city || "",
                      state: customer.state || "",
                      zipCode: customer.zipCode || "",
                      country: customer.country || "",
                      differentMailingAddress: customer.differentMailingAddress || false,
                      mailingAddress: customer.mailingAddress || "",
                      mailingApartment: customer.mailingApartment || "",
                      mailingApartmentType: customer.mailingApartmentType || "",
                      mailingCity: customer.mailingCity || "",
                      mailingState: customer.mailingState || "",
                      mailingZipCode: customer.mailingZipCode || "",
                      mailingCountry: customer.mailingCountry || "",
                      referral: customer.referral || "",
                      status: formStatus,
                      isInClientBook: customer.isInClientBook || false,
                      isInDontCallList: customer.isInDontCallList || false,
                    });

                    setSsnDisplayValue(formatSSNDisplay(customer.ssn || ""));
                    setValidationErrors({});

                    toast({
                      title: "Form Reset",
                      description: "Form has been reset to original customer data.",
                    });
                  }
                }}
              >
                Reset to Original
              </Button>
            )}
          </div>
        </DialogHeader>

        {currentStep === 'form' ? (
          <form onSubmit={handleFormSubmit} noValidate className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ValidatedInput
                  id="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={(value) => handleInputChange('firstName', value)}
                  error={validationErrors.firstName}
                  required
                  maxLength={35}
                  placeholder="e.g., Sophia"
                  validationHint="Enter the customer's first name (max 35 characters)"
                />
                <ValidatedInput
                  id="middleName"
                  label="Middle Name"
                  value={formData.middleName}
                  onChange={(value) => handleInputChange('middleName', value)}
                  error={validationErrors.middleName}
                  maxLength={35}
                  placeholder="e.g., Grace (optional)"
                  validationHint="Enter the customer's middle name (max 35 characters)"
                />
                <ValidatedInput
                  id="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(value) => handleInputChange('lastName', value)}
                  error={validationErrors.lastName}
                  required
                  maxLength={35}
                  placeholder="e.g., Johnson"
                  validationHint="Enter the customer's last name (max 35 characters)"
                />
                <div>
                  <Label htmlFor="gender">
                    Gender
                    {useStrictValidation && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Select value={formData.gender} onValueChange={(value) => {
                    setFormData({ ...formData, gender: value });
                    const error = validateField('gender', value, !useStrictValidation);
                    if (error) {
                      setValidationErrors({ ...validationErrors, gender: error });
                    } else {
                      const newErrors = { ...validationErrors };
                      delete newErrors.gender;
                      setValidationErrors(newErrors);
                    }
                  }}>
                    <SelectTrigger id="gender" className={validationErrors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.gender && (
                    <span className="text-red-500 text-sm">{validationErrors.gender}</span>
                  )}
                </div>
                <div className="grid gap-1">
                  <label htmlFor="dateOfBirth" className="text-sm font-medium">
                    Date of Birth {useStrictValidation && <span className="text-red-500">*</span>}
                  </label>
                  <DateInput
                    id="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={(value) => handleInputChange('dateOfBirth', value)}
                    placeholder="Select date of birth"
                    maxDate={new Date()}
                    required={useStrictValidation}
                  />
                  {validationErrors.dateOfBirth && (
                    <span className="text-red-500 text-sm">{validationErrors.dateOfBirth}</span>
                  )}
                </div>
                <ValidatedInput
                  id="ssn"
                  label="SSN"
                  value={ssnDisplayValue}
                  onChange={(value) => {
                    // Use the new formatting logic that handles backspacing better
                    const formattedValue = formatSSNInput(value, ssnDisplayValue);
                    setSsnDisplayValue(formattedValue);

                    // Clean the input and store without hyphens
                    const cleanValue = cleanSSNForStorage(value);
                    handleInputChange('ssn', cleanValue);
                  }}
                  error={validationErrors.ssn}
                  required={useStrictValidation}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  validationHint="Enter Social Security Number (format: XXX-XX-XXXX, max 11 characters)"
                />
                <ValidatedSelect
                  id="maritalStatus"
                  label="Marital Status"
                  value={formData.maritalStatus}
                  onChange={(value) => setFormData({ ...formData, maritalStatus: value })}
                  error={validationErrors.maritalStatus}
                  placeholder="Select status"
                  validationHint="Select the customer's marital status"
                >
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                </ValidatedSelect>
              </CardContent>
            </Card>

            {/* Physical Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Physical Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ValidatedInput
                  id="heightFeet"
                  label="Height (ft)"
                  type="number"
                  value={feet}
                  onChange={(value) => handleHeightChange(value, inches)}
                  error={validationErrors.height}
                  placeholder="e.g., 5"
                  min="1"
                  max="8"
                  showCharCount={false}
                  validationHint="Enter height in feet (1-8 feet)"
                />
                <ValidatedInput
                  id="heightInches"
                  label="Height (in)"
                  type="number"
                  value={inches}
                  onChange={(value) => handleHeightChange(feet, value)}
                  error={validationErrors.height}
                  placeholder="e.g., 10"
                  min="0"
                  max="11"
                  showCharCount={false}
                  validationHint="Enter height in inches (0-11 inches)"
                />
                <ValidatedInput
                  id="weight"
                  label="Weight (lbs)"
                  type="number"
                  value={formData.weight}
                  onChange={(value) => handleInputChange('weight', value)}
                  error={validationErrors.weight}
                  placeholder="e.g., 150"
                  min="1"
                  max="300"
                  showCharCount={false}
                  validationHint="Weight in pounds (max 300)"
                />
                <ValidatedSelect
                  id="smoker"
                  label="Smoker"
                  value={formData.smoker}
                  onChange={(value) => setFormData({ ...formData, smoker: value })}
                  error={validationErrors.smoker}
                  placeholder="Select smoking status"
                  validationHint="Select whether the customer is a smoker"
                >
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </ValidatedSelect>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {useStrictValidation && !formData.homePhone && !formData.cellPhone && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    At least one phone number (Home Phone or Cell Phone) is required
                  </p>
                )}
                {/* Row 1: Email and Home Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput
                    id="email"
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(value) => handleInputChange('email', value)}
                    error={validationErrors.email}
                    maxLength={123}
                    placeholder="sophia.johnson@email.com (optional)"
                    validationHint="Enter a valid email address (max 123 characters)"
                  />
                  <ValidatedInput
                    id="homePhone"
                    label="Home Phone"
                    value={formData.homePhone}
                    onChange={(value) => handleInputChange('homePhone', value)}
                    error={validationErrors.homePhone}
                    required={useStrictValidation && !formData.homePhone && !formData.cellPhone}
                    maxLength={17}
                    placeholder="e.g., (555) 123-4567"
                    validationHint="Phone number (digits, spaces, (), +, -) max 17 chars"
                  />
                </div>



                {/* Row 2: Cell Phone, Work Phone, and Fax */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ValidatedInput
                    id="cellPhone"
                    label="Cell Phone"
                    value={formData.cellPhone}
                    onChange={(value) => handleInputChange('cellPhone', value)}
                    error={validationErrors.cellPhone}
                    required={useStrictValidation && !formData.homePhone && !formData.cellPhone}
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

            {/* Address Information */}
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
                  <ValidatedInput
                    id="apartment"
                    label="Apartment/Unit"
                    value={formData.apartment}
                    onChange={(value) => handleInputChange('apartment', value)}
                    error={validationErrors.apartment}
                    maxLength={50}
                    placeholder="e.g., Apt 5B or Unit 203"
                    validationHint="Enter apartment/unit number (max 50 characters)"
                  />
                  <ValidatedSelect
                    id="apartmentType"
                    label="Type"
                    value={formData.apartmentType}
                    onChange={(value) => setFormData({ ...formData, apartmentType: value })}
                    error={validationErrors.apartmentType}
                    placeholder="Select type"
                    validationHint="Select apartment/unit type"
                  >
                    <SelectItem value="Apt">Apt</SelectItem>
                    <SelectItem value="Unit">Unit</SelectItem>
                    <SelectItem value="Suite">Suite</SelectItem>
                  </ValidatedSelect>
                  <ValidatedInput
                    id="city"
                    label="City"
                    value={formData.city}
                    onChange={(value) => handleInputChange('city', value)}
                    error={validationErrors.city}
                    maxLength={80}
                    placeholder="e.g., New York"
                    validationHint="Enter the city name (max 80 characters)"
                  />
                  <ValidatedInput
                    id="state"
                    label="State"
                    value={formData.state}
                    onChange={(value) => handleInputChange('state', value)}
                    error={validationErrors.state}
                    maxLength={80}
                    placeholder="e.g., New York or NY"
                    validationHint="Enter the state name (max 80 characters)"
                  />
                  <ValidatedInput
                    id="zipCode"
                    label="ZIP Code"
                    value={formData.zipCode}
                    onChange={(value) => handleInputChange('zipCode', value)}
                    error={validationErrors.zipCode}
                    maxLength={15}
                    placeholder="e.g., 10001 or 10001-1234"
                    validationHint="Enter the ZIP code (max 15 characters)"
                  />
                  <ValidatedInput
                    id="country"
                    label="Country"
                    value={formData.country}
                    onChange={(value) => handleInputChange('country', value)}
                    error={validationErrors.country}
                    placeholder="United States"
                    maxLength={100}
                    validationHint="Enter the country name (max 100 characters)"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="differentMailingAddress"
                    checked={formData.differentMailingAddress}
                    onCheckedChange={(checked) => setFormData({ ...formData, differentMailingAddress: checked as boolean })}
                  />
                  <Label htmlFor="differentMailingAddress">Different mailing address</Label>
                </div>

                {formData.differentMailingAddress && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="md:col-span-2">
                      <ValidatedInput
                        id="mailingAddress"
                        label="Mailing Street Address"
                        value={formData.mailingAddress}
                        onChange={(value) => setFormData({ ...formData, mailingAddress: value })}
                        error={validationErrors.mailingAddress}
                        maxLength={255}
                        placeholder="e.g., P.O. Box 456 or 789 Oak Avenue"
                        validationHint="Mailing address (letters, numbers, spaces, -, ', ., ,, /, &, :) max 255 chars"
                      />
                    </div>
                    <ValidatedInput
                      id="mailingApartment"
                      label="Mailing Apartment/Unit"
                      value={formData.mailingApartment}
                      onChange={(value) => setFormData({ ...formData, mailingApartment: value })}
                      error={validationErrors.mailingApartment}
                      maxLength={50}
                      placeholder="e.g., Suite 100"
                      validationHint="Enter mailing apartment/unit number (max 50 characters)"
                    />
                    <ValidatedSelect
                      id="mailingApartmentType"
                      label="Mailing Type"
                      value={formData.mailingApartmentType}
                      onChange={(value) => setFormData({ ...formData, mailingApartmentType: value })}
                      error={validationErrors.mailingApartmentType}
                      placeholder="Select type"
                      validationHint="Select mailing apartment/unit type"
                    >
                      <SelectItem value="Apt">Apt</SelectItem>
                      <SelectItem value="Unit">Unit</SelectItem>
                      <SelectItem value="Suite">Suite</SelectItem>
                    </ValidatedSelect>
                    <ValidatedInput
                      id="mailingCity"
                      label="Mailing City"
                      value={formData.mailingCity}
                      onChange={(value) => setFormData({ ...formData, mailingCity: value })}
                      error={validationErrors.mailingCity}
                      maxLength={80}
                      placeholder="e.g., Los Angeles"
                      validationHint="Enter the mailing city name (max 80 characters)"
                    />
                    <ValidatedInput
                      id="mailingState"
                      label="Mailing State"
                      value={formData.mailingState}
                      onChange={(value) => setFormData({ ...formData, mailingState: value })}
                      error={validationErrors.mailingState}
                      maxLength={80}
                      placeholder="e.g., California or CA"
                      validationHint="Enter the mailing state name (max 80 characters)"
                    />
                    <ValidatedInput
                      id="mailingZipCode"
                      label="Mailing ZIP Code"
                      value={formData.mailingZipCode}
                      onChange={(value) => setFormData({ ...formData, mailingZipCode: value })}
                      error={validationErrors.mailingZipCode}
                      maxLength={15}
                      placeholder="e.g., 90210 or 90210-1234"
                      validationHint="Enter the mailing ZIP code (max 15 characters)"
                    />
                    <ValidatedInput
                      id="mailingCountry"
                      label="Mailing Country"
                      value={formData.mailingCountry}
                      onChange={(value) => setFormData({ ...formData, mailingCountry: value })}
                      error={validationErrors.mailingCountry}
                      placeholder="United States"
                      maxLength={100}
                      validationHint="Enter the mailing country name (max 100 characters)"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Additional Details
                </CardTitle>
              </CardHeader>

              {/* Make it 1 column on mobile, 2 columns from md upwards */}
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Referral Source */}
                <ValidatedSelect
                  id="referral"
                  label="Referral Source"
                  value={formData.referral}
                  onChange={(value) => {
                    setFormData({ ...formData, referral: value });
                    const error = validateField('referral', value);
                    if (error) {
                      setValidationErrors({ ...validationErrors, referral: error });
                    } else {
                      const newErrors = { ...validationErrors };
                      delete newErrors.referral;
                      setValidationErrors(newErrors);
                    }
                  }}
                  error={validationErrors.referral}
                  placeholder="Select referral source"
                  validationHint="Select how the customer found your business"
                >
                  <SelectItem value="Newspaper">Newspaper</SelectItem>
                  <SelectItem value="Billboard">Billboard</SelectItem>
                  <SelectItem value="Restaurant Placemat">Restaurant Placemat</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Friend Referral">Friend Referral</SelectItem>
                  <SelectItem value="Walk in">Walk in</SelectItem>
                  <SelectItem value="Phone Book">Phone Book</SelectItem>
                  <SelectItem value="Internet">Internet</SelectItem>
                  <SelectItem value="Google Search">Google Search</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="List">List</SelectItem>
                  <SelectItem value="Lead card">Lead card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="SCIS Lead">SCIS Lead</SelectItem>
                  <SelectItem value="Kramer Lead">Kramer Lead</SelectItem>
                  <SelectItem value="BFL Lead">BFL Lead</SelectItem>
                  <SelectItem value="PCP or Physician">PCP or Physician</SelectItem>
                  <SelectItem value="DEH">DEH</SelectItem>
                </ValidatedSelect>

                {/* Status */}
                <ValidatedSelect
                  id="status"
                  label="Status"
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value })}
                  error={validationErrors.status}
                  placeholder="Select status"
                  validationHint="Select the customer's current status"
                >
                  {/* When forceClientValidation is true, show only Client option (conversion mode) */}
                  {originalStatus === "Prospect" && forceClientValidation ? (
                    <SelectItem value="Client">Client</SelectItem>
                  ) : originalStatus === "Prospect" && !forceClientValidation ? (
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="Client">Client</SelectItem>
                      {/* Show Former only if already Former or currently Client */}
                      {(originalStatus === "Former" || originalStatus === "Client") && (
                        <SelectItem value="Former">Former</SelectItem>
                      )}
                      {/* Show Deceased only if already Deceased or currently Client/Former */}
                      {(originalStatus === "Deceased" || originalStatus === "Client" || originalStatus === "Former") && (
                        <SelectItem value="Deceased">Deceased</SelectItem>
                      )}
                    </>
                  )}
                </ValidatedSelect>

                {/* Warning message for status change to Former */}
                {formData.status === "Former" && originalStatus !== "Former" && (
                  <div className="md:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
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
                          All existing policies for this customer will be automatically cancelled when the status is changed to "Former".
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning message for status change to Deceased */}
                {formData.status === "Deceased" && originalStatus !== "Deceased" && (
                  <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800 font-medium">
                          Policy Auto-Cancellation Warning
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          All existing policies for this customer will be automatically cancelled when the status is changed to "Deceased".
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Global Book Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Global Book Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isInClientBook"
                    checked={formData.isInClientBook}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isInClientBook: checked as boolean })
                    }
                  />
                  <Label htmlFor="isInClientBook" className="text-sm font-medium cursor-pointer">
                    Include in Client Book
                  </Label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  Add this customer to client book for easy access and management
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isInDontCallList"
                    checked={formData.isInDontCallList}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isInDontCallList: checked as boolean })
                    }
                  />
                  <Label htmlFor="isInDontCallList" className="text-sm font-medium cursor-pointer">
                    Include in Don't Call List
                  </Label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  Mark this customer to do not call list as someone who should not be contacted
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Continue to Review
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <CustomerPreview formData={formData} ssnDisplayValue={ssnDisplayValue} />

            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={handleGoBack}>
                Back to Edit
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleFinalSubmit} disabled={loading}>
                  {loading ? "Updating..." : (forceClientValidation && originalStatus === "Prospect" ? "Convert to Client" : originalStatus === "Prospect" ? "Update Prospect" : "Update Customer")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
