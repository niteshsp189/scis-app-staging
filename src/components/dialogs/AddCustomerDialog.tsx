import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, User, Phone, MapPin, Heart, UserCheck, Search, AlertTriangle, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DateInput } from "@/components/ui/date-input";
import { ValidatedInput, ValidatedSelect } from "@/components/ui/validated-input";
import { validateField, validateForm, CustomerFormData } from "@/schemas/customerValidationSchema";
import { formatSSNDisplay, cleanSSNForStorage, formatSSNInput } from "@/utils/ssnFormatter";
import { CustomerPreview } from "@/components/customer/CustomerPreview";
import { duplicateFinderService, type DuplicateGroup, type DuplicateCustomer } from "@/services/duplicateFinderService";
import { settingsService } from "@/services/settingsService";

import { customerService } from "@/services/customerService";

interface AddCustomerDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCustomerAdded?: (customer?: any) => void;
  onAddCustomer?: (customer: any) => void; // Keep for backward compatibility
  preFilledData?: Partial<CustomerFormData>;
  title?: string;
  description?: string;
  mode?: "client" | "prospect"; // NEW: Add mode prop for conditional validation
}

export function AddCustomerDialog({ 
  isOpen, 
  onClose, 
  onCustomerAdded, 
  onAddCustomer, 
  preFilledData,
  title = "Add New Customer",
  description = "Create a new customer record in the system.",
  mode = "client" // Default to client mode
}: AddCustomerDialogProps) {
  const isProspectMode = mode === "prospect";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const isSubmittingRef = useRef(false);
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState<'form' | 'preview'>('form');
  
  // Track SSN display value separately to handle formatting during input
  const [ssnDisplayValue, setSsnDisplayValue] = useState('');
  
  // Duplicate finder state
  const [duplicateResults, setDuplicateResults] = useState<DuplicateGroup[]>([]);
  const [isSearchingDuplicates, setIsSearchingDuplicates] = useState(false);
  const [showDuplicateSection, setShowDuplicateSection] = useState(false);
  const [isDuplicateSectionExpanded, setIsDuplicateSectionExpanded] = useState(false);
  const [isDuplicateFinderEnabled, setIsDuplicateFinderEnabled] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize form data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('addCustomerFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        // Also restore SSN display value if it exists
        if (parsedData.ssn) {
          setSsnDisplayValue(formatSSNDisplay(parsedData.ssn));
        }
      }
    } catch (error) {
    }
  }, []);

  // Sync local state with prop
  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
      if (!isOpen) {
        setIsClosing(false);
        isSubmittingRef.current = false;
        setCurrentStep('form'); // Reset to form step when dialog closes
      }
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    ssn: "",
    maritalStatus: "",

    // Physical Details
    height: "",
    weight: "",
    smoker: "",

    // Contact Information
    email: "",
    homePhone: "",
    cellPhone: "",
    workPhone: "",
    fax: "",

    // Address Information
    address: "",
    apartment: "",
    apartmentType: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",

    // Mailing Address
    differentMailingAddress: false,
    mailingAddress: "",
    mailingApartment: "",
    mailingApartmentType: "",
    mailingCity: "",
    mailingState: "",
    mailingZipCode: "",
    mailingCountry: "",

    // Additional Details
    referral: "",
    status: isProspectMode ? "Prospect" : "Client",
    
    // Global Book Settings
    isInClientBook: false,
    isInDontCallList: false,
  });

  // Apply pre-filled data when provided
  useEffect(() => {
    if (preFilledData && Object.keys(preFilledData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...preFilledData,
        status: preFilledData.status || "Client" // Ensure status defaults to Client
      }));
      
      // Handle SSN display formatting if provided
      if (preFilledData.ssn) {
        setSsnDisplayValue(formatSSNDisplay(preFilledData.ssn));
      }
    }
  }, [preFilledData]);

  // Check duplicate finder setting on component mount
  useEffect(() => {
    const checkDuplicateFinderSetting = async () => {
      try {
        const isEnabled = await settingsService.isDuplicateFinderEnabled();
        setIsDuplicateFinderEnabled(isEnabled);
      } catch (error) {
        setIsDuplicateFinderEnabled(true); // Default to enabled
      }
    };

    checkDuplicateFinderSetting();
  }, []);

  // Sync SSN display value with stored SSN value on form reset
  useEffect(() => {
    if (formData.ssn === '') {
      setSsnDisplayValue('');
    }
  }, [formData.ssn]);

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

  // Debounced duplicate search function
  const searchForDuplicates = useCallback(async (searchData: typeof formData) => {
   

    // Only search if duplicate finder is enabled
    if (!isDuplicateFinderEnabled) {
      setDuplicateResults([]);
      setShowDuplicateSection(false);
      return;
    }

    // Only search if we have meaningful data to search with
    const searchableFields = {
      first_name: searchData.firstName?.trim(),
      last_name: searchData.lastName?.trim(),
      email: searchData.email?.trim(),
      cell_phone: searchData.cellPhone?.trim(),
      ssn: searchData.ssn?.trim()
    };

    // Filter out empty fields
    const availableFields = Object.entries(searchableFields)
      .filter(([_, value]) => value && value.length > 0)
      .map(([key, _]) => key);


    // Only search if we have at least 2 searchable fields with meaningful data
    if (availableFields.length < 2) {
      console.log('Not enough fields to search (need at least 2)');
      setDuplicateResults([]);
      setShowDuplicateSection(false);
      return;
    }

    try {
      setIsSearchingDuplicates(true);
      
      
      const response = await duplicateFinderService.findDuplicates({
        columns: availableFields,
        search_values: searchableFields, // Pass the actual search values
        match_type: 'similar',
        limit: 5
      });


      // Check for groups in the response
      const groups = response?.data?.groups || [];
      
      if (groups.length > 0) {
        setDuplicateResults(groups);
        setShowDuplicateSection(true);
      } else {
        setDuplicateResults([]);
        setShowDuplicateSection(false);
      }
    } catch (error) {
      setDuplicateResults([]);
      setShowDuplicateSection(false);
    } finally {
      setIsSearchingDuplicates(false);
    }
  }, [isDuplicateFinderEnabled]);

  // Debounced effect for duplicate search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchForDuplicates(formData);
    }, 800); // 800ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [formData.firstName, formData.lastName, formData.email, formData.cellPhone, formData.ssn, searchForDuplicates]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleHeightChange = (newFeet: string, newInches: string) => {
    // Validate feet and inches ranges
    const feetNum = parseInt(newFeet) || 0;
    const inchesNum = parseInt(newInches) || 0;
    
    // Create the height string in the expected format - only include values that are actually provided
    let heightString = "";
    if (newFeet || newInches) {
      const feetPart = newFeet || "";
      const inchesPart = newInches || "";
      heightString = feetPart + "'" + inchesPart + '"';
    }
    
    // Clear previous height errors
    const newErrors = { ...validationErrors };
    delete newErrors.height;
    
    // Validate ranges
    if (newFeet && (feetNum < 1 || feetNum > 8)) {
      newErrors.height = "Height must be between 1-8 feet";
    } else if (newInches && (inchesNum < 0 || inchesNum > 11)) {
      newErrors.height = "Inches must be between 0-11";
    } else if (feetNum === 1 && inchesNum === 0 && newFeet && newInches) {
      newErrors.height = "Height too short - minimum 1'1\"";
    }
    
    setValidationErrors(newErrors);
    
    // Use handleInputChange to properly validate with Zod schema
    handleInputChange('height', heightString);
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

  // Function to proceed to preview step
  const handleProceedToPreview = () => {
    // Validate all fields using Zod schema before proceeding
    const errors = validateForm({
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
      status: formData.status as "Client" | "Prospect" | "Former" | "Deceased",
      customerType: formData.status as "Client" | "Prospect" | "Former" | "Deceased",
    }, isProspectMode);

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

    // Clear validation errors and proceed to preview
    setValidationErrors({});
    setCurrentStep('preview');
  };

  // Function to go back to form from preview
  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Save to localStorage for form persistence
    try {
      localStorage.setItem('addCustomerFormData', JSON.stringify(newFormData));
    } catch (error) {
    }
    
    // Validate the field using Zod schema
    const error = validateField(field as keyof CustomerFormData, value, isProspectMode);
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

  const handleManualReset = () => {
    // Reset form data
    setFormData({
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
      status: isProspectMode ? "Prospect" : "Client",
      isInClientBook: false,
      isInDontCallList: false,
    });

    // Clear duplicate finder state
    setDuplicateResults([]);
    setShowDuplicateSection(false);
    setIsDuplicateSectionExpanded(false);
    setIsSearchingDuplicates(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Clear localStorage
    try {
      localStorage.removeItem('addCustomerFormData');
    } catch (error) {
    }

    // Reset SSN display value
    setSsnDisplayValue("");

    // Clear validation errors
    setValidationErrors({});

    // Reset step to form
    setCurrentStep('form');

    // Show success message
    toast({
      title: "Form Reset",
      description: "All form fields have been cleared.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) return; // Prevent double submission

    // If we're on the form step, proceed to preview instead of submitting
    if (currentStep === 'form') {
      handleProceedToPreview();
      return;
    }

    // If we're on the preview step, proceed with actual submission
    setLoading(true);
    isSubmittingRef.current = true;

    try {
      // Create customer via API - filter out empty string values
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
        status: formData.status as "Client" | "Prospect" | "Former" | "Deceased",
        isInClientBook: formData.isInClientBook,
        isInDontCallList: formData.isInDontCallList,
      };

      // Filter out empty string values to avoid sending unnecessary data
      const filteredCustomerData = Object.fromEntries(
        Object.entries(customerData).filter(([key, value]) => {
          // Keep boolean values and non-empty strings
          if (typeof value === 'boolean') return true;
          if (typeof value === 'string') return value.trim() !== '';
          return value != null; // Keep non-null values
        })
      );

      const newCustomer = await customerService.createCustomer(filteredCustomerData);

      // Show success toast first
      toast({
        title: "Success",
        description: `${formData.firstName} ${formData.lastName} has been added successfully.`,
      });

      // Reset form
      setFormData({
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

      // Clear localStorage after successful submission
      try {
        localStorage.removeItem('addCustomerFormData');
      } catch (error) {
      }

      // Reset SSN display value
      setSsnDisplayValue("");

      // Clear duplicate finder state
      setDuplicateResults([]);
      setShowDuplicateSection(false);
      setIsDuplicateSectionExpanded(false);
      setIsSearchingDuplicates(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Clear validation errors
      setValidationErrors({});

      // Reset step to form
      setCurrentStep('form');

      // Call the appropriate callback and close dialog
      if (onCustomerAdded) {
        setIsClosing(true);
        onCustomerAdded(newCustomer); // Pass the customer data to the callback
      } else if (onAddCustomer) {
        onAddCustomer(newCustomer);
        setIsClosing(true);
        // Close dialog for backward compatibility
        if (onClose) {
          onClose();
        } else {
          setOpen(false);
        }
      } else {
        setIsClosing(true);
        // Fallback: just close the dialog
        if (onClose) {
          onClose();
        } else {
          setOpen(false);
        }
      }

    } catch (error: any) {

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
          description: error.message || "Failed to create customer. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <Dialog open={!isClosing && (isOpen !== undefined ? isOpen : open)} onOpenChange={(newOpen) => {
      if (isClosing) return; // Prevent reopening when closing
      if (onClose && !newOpen) {
        onClose();
      } else if (!onClose) {
        setOpen(newOpen);
      }
    }}>

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
            {currentStep === 'form' 
              ? (isProspectMode ? (title === "Add New Customer" ? "Add New Prospect" : title) : title)
              : (isProspectMode ? 'Review Prospect Information' : 'Review Customer Information')
            }
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'form' 
              ? (isProspectMode && description === "Create a new customer record in the system." 
                  ? "Add a potential customer to your prospects list. Only name is required initially."
                  : description)
              : 'Please review the information below before submitting.'
            }
          </DialogDescription>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'form' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  1
                </div>
                <span className={`ml-2 text-sm ${currentStep === 'form' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Customer Details
                </span>
              </div>
              
              <div className={`w-8 h-0.5 ${currentStep === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  2
                </div>
                <span className={`ml-2 text-sm ${currentStep === 'preview' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Review & Submit
                </span>
              </div>
            </div>
            
            {currentStep === 'form' && (
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={handleManualReset}
                disabled={loading}
              >
                Reset Form
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Real-time Duplicate Finder Section - Sticky */}
        {currentStep === 'form' && isDuplicateFinderEnabled && (showDuplicateSection || duplicateResults.length > 0) && (
          <div className="sticky top-0 z-40 mb-4">
            <Card className="border-amber-50 bg-amber-50 shadow-md">
              <CardHeader 
                className="pb-2 cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => setIsDuplicateSectionExpanded(!isDuplicateSectionExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      {isSearchingDuplicates ? (
                        <>Searching for duplicates...</>
                      ) : (
                        <>
                          {duplicateResults.reduce((total, group) => total + (group.duplicate_count || group.customers?.length || 0), 0)} similar customer{duplicateResults.reduce((total, group) => total + (group.duplicate_count || group.customers?.length || 0), 0) > 1 ? 's' : ''} found
                        </>
                      )}
                    </span>
                    {!isSearchingDuplicates && (
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                        Click to {isDuplicateSectionExpanded ? 'collapse' : 'expand'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isSearchingDuplicates ? (
                      <Search className="h-4 w-4 animate-spin text-amber-600" />
                    ) : (
                      isDuplicateSectionExpanded ? (
                        <ChevronUp className="h-4 w-4 text-amber-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-amber-600" />
                      )
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {isDuplicateSectionExpanded && !isSearchingDuplicates && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {duplicateResults.length > 0 ? duplicateResults.map((group, groupIndex) => (
                      <div key={group.id || groupIndex} className="border border-amber-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              {group.duplicate_count || group.customers?.length || 0} similar customer{(group.duplicate_count || group.customers?.length || 0) > 1 ? 's' : ''} found
                            </span>
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                              {Math.round((group.similarity_score || 0) * 100)}% match
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Matching: {(group.matching_fields || []).map(field => field.replace('_', ' ')).join(', ')}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {(group.customers || []).map((customer) => (
                            <div key={customer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="flex-1">
                                <div className="flex items-center gap-4">
                                  <div className="font-medium text-gray-900">
                                    {customer.first_name} {customer.last_name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {customer.email}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {customer.cell_phone || customer.home_phone || customer.work_phone}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {customer.city}, {customer.state}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Status: {customer.status} • Created: {new Date(customer.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="ml-4"
                                onClick={() => {
                                  window.open(`/customers/${customer.id}`, '_blank');
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )) : (
                      <div className="text-sm text-gray-500">No duplicate results to display</div>
                    )}
                    <div className="text-xs text-amber-700 italic">
                       Please review these customers before proceeding. Click "View" to see their full details in a new tab.
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {currentStep === 'form' ? (
            <>
              {/* Form content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <ValidatedInput
                id="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={(value) => handleInputChange('firstName', value)}
                error={validationErrors.firstName}
                required
                maxLength={35}
                placeholder="e.g., Sophia"
                validationHint="First name (max 35 chars)"
              />
              <ValidatedInput
                id="middleName"
                label="Middle Name"
                value={formData.middleName}
                onChange={(value) => handleInputChange('middleName', value)}
                error={validationErrors.middleName}
                maxLength={35}
                placeholder="e.g., Marie (optional)"
                validationHint="Middle name, optional (max 35 chars)"
              />
              <ValidatedInput
                id="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={(value) => handleInputChange('lastName', value)}
                error={validationErrors.lastName}
                required
                maxLength={35}
                placeholder="e.g., Williams"
                validationHint="Last name (max 35 chars)"
              />
              <div>
                <Label htmlFor="gender" className="text-sm font-medium">
                  Gender
                  {!isProspectMode && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger id="gender" className={validationErrors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {renderFieldError('gender')}
              </div>
              <div className=" ">
                <label htmlFor="dateOfBirth" className="text-sm font-medium">
                  Date of Birth {!isProspectMode && <span className="text-red-500">*</span>}
                </label>
                <DateInput
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(value) => handleInputChange('dateOfBirth', value)}
                  placeholder="Select date of birth"
                  maxDate={new Date()}
                  required={!isProspectMode}
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
                required={!isProspectMode}
                maxLength={11} // Account for hyphens in display
                placeholder="XXX-XX-XXXX"
                validationHint="Format: XXX-XX-XXXX"
              />
              <div>
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                  <SelectTrigger className={validationErrors.maritalStatus ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
                {renderFieldError('maritalStatus')}
              </div>
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
                onChange={(value) => {
                  handleHeightChange(value, inches);
                }}
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
                onChange={(value) => {
                  handleHeightChange(feet, value);
                }}
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
              <div>
                <Label htmlFor="smoker">Smoker</Label>
                <Select value={formData.smoker} onValueChange={(value) => handleInputChange('smoker', value)}>
                  <SelectTrigger className={validationErrors.smoker ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select smoking status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
                {renderFieldError('smoker')}
              </div>
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
              {!isProspectMode && !formData.homePhone && !formData.cellPhone && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  At least one phone number (Home Phone or Cell Phone) is required
                </p>
              )}
              {/* Row 1: Email and Home Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  required={!isProspectMode && !formData.homePhone && !formData.cellPhone}
                  maxLength={17}
                  placeholder="e.g., (555) 123-4567"
                  validationHint="Phone number (digits, spaces, (), +, -) max 17 chars"
                />
              </div>
              
              {/* Row 2: Cell Phone, Work Phone, and Fax */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ValidatedInput
                  id="cellPhone"
                  label="Cell Phone"
                  value={formData.cellPhone}
                  onChange={(value) => handleInputChange('cellPhone', value)}
                  error={validationErrors.cellPhone}
                  required={!isProspectMode && !formData.homePhone && !formData.cellPhone}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                  validationHint="Apt/unit number (max 50 chars)"
                />
                <div>
                  <Label htmlFor="apartmentType">Type</Label>
                  <Select value={formData.apartmentType} onValueChange={(value) => handleInputChange('apartmentType', value)}>
                    <SelectTrigger className={validationErrors.apartmentType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apt">Apt</SelectItem>
                      <SelectItem value="Unit">Unit</SelectItem>
                      <SelectItem value="Suite">Suite</SelectItem>
                    </SelectContent>
                  </Select>
                  {renderFieldError('apartmentType')}
                </div>
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
                  label="State"
                  value={formData.state}
                  onChange={(value) => handleInputChange('state', value)}
                  error={validationErrors.state}
                  maxLength={80}
                  placeholder="e.g., New York or NY"
                  validationHint="State (max 80 chars)"
                />
                <ValidatedInput
                  id="zipCode"
                  label="ZIP Code"
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
                  placeholder="United States"
                  maxLength={100}
                  validationHint="Country (max 100 chars)"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1 bg-gray-50 rounded-lg">
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
                  <div>
                    <Label htmlFor="mailingApartmentType">Mailing Type</Label>
                    <Select value={formData.mailingApartmentType} onValueChange={(value) => handleInputChange('mailingApartmentType', value)}>
                      <SelectTrigger className={validationErrors.mailingApartmentType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apt">Apt</SelectItem>
                        <SelectItem value="Unit">Unit</SelectItem>
                        <SelectItem value="Suite">Suite</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderFieldError('mailingApartmentType')}
                  </div>
                  <ValidatedInput
                    id="mailingCity"
                    label="Mailing City"
                    value={formData.mailingCity}
                    onChange={(value) => handleInputChange('mailingCity', value)}
                    error={validationErrors.mailingCity}
                    maxLength={80}
                    placeholder="e.g., Los Angeles"
                    validationHint="Enter mailing city (max 80 characters)"
                  />
                  <ValidatedInput
                    id="mailingState"
                    label="Mailing State"
                    value={formData.mailingState}
                    onChange={(value) => handleInputChange('mailingState', value)}
                    error={validationErrors.mailingState}
                    maxLength={80}
                    placeholder="e.g., California or CA"
                    validationHint="Enter mailing state (max 80 characters)"
                  />
                  <ValidatedInput
                    id="mailingZipCode"
                    label="Mailing ZIP Code"
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
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Referral Source */}
              <ValidatedSelect
                id="referral"
                label="Referral Source"
                value={formData.referral}
                onChange={(value) => handleInputChange('referral', value)}
                error={validationErrors.referral}
                placeholder="Select referral source"
                validationHint="Select how the customer was referred to you"
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

              {/* Status - Hidden for prospects */}
              {!isProspectMode && (
                <ValidatedSelect
                  id="status"
                  label="Status"
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value)}
                  error={validationErrors.status}
                  required
                  placeholder="Select status"
                  validationHint="Select the customer's current status"
                >
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Former" disabled>Former</SelectItem>
                  <SelectItem value="Deceased" disabled>Deceased</SelectItem>
                </ValidatedSelect>
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

          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleManualReset}
              disabled={loading}
            >
              Reset Form
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setValidationErrors({});
                setSsnDisplayValue(""); // Reset SSN display value on cancel
                if (onClose) {
                  onClose();
                } else {
                  setOpen(false);
                }
              }} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Reviewing..." : "Review Information"}
              </Button>
            </div>
          </div>
          </>
          ) : (
            <>
              {/* Preview content */}
              <CustomerPreview formData={formData} ssnDisplayValue={ssnDisplayValue} />
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBackToForm}
                  disabled={loading}
                >
                  Edit Information
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setValidationErrors({});
                    setSsnDisplayValue(""); // Reset SSN display value on cancel
                    if (onClose) {
                      onClose();
                    } else {
                      setOpen(false);
                    }
                  }} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Adding..." : (isProspectMode ? "Add Prospect" : "Add Customer")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
