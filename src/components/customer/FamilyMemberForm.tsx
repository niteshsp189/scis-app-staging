import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { FamilyMember } from "@/types/customer";
import { PersonalInfoSection } from "../family/form-sections/PersonalInfoSection";
import { ContactInfoSection } from "../family/form-sections/ContactInfoSection";
import { AddressInfoSection } from "../family/form-sections/AddressInfoSection";
import { AdditionalInfoSection } from "../family/form-sections/AdditionalInfoSection";
import { Checkbox } from "@/components/ui/checkbox";
import { Policy } from "@/types/policy";
import { toast } from "@/hooks/use-toast";
import { PolicyService } from "@/services/policyService";
import { dependentService } from "@/services/dependentService";
import { FileText } from "lucide-react";
import { FamilyMemberPreview } from "./FamilyMemberPreview";
import { validateField, validateForm, DependentFormData } from "@/schemas/dependentValidationSchema";
import { formatSSNDisplay, cleanSSNForStorage, formatSSNInput } from "@/utils/ssnFormatter";

interface FamilyMemberFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingMember: FamilyMember | null;
  onSubmit: (formData: any) => Promise<void>;
  onReset: () => void;
  customerId: number;
  customerData?: any; // Add customer data prop to copy referral/status
}

export const FamilyMemberForm = ({
  isOpen,
  onOpenChange,
  editingMember,
  onSubmit,
  onReset,
  customerId,
  customerData,
}: FamilyMemberFormProps) => {
  // Multi-step state
  const [currentStep, setCurrentStep] = useState<'form' | 'preview'>('form');
  
  // SSN display value for formatting
  const [ssnDisplayValue, setSsnDisplayValue] = useState('');
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    name: "",
    gender: "" as "Male" | "Female" | "Other" | "",
    dateOfBirth: "",
    ssn: "",
    maritalStatus: "" as "Single" | "Married" | "Divorced" | "Widowed" | "",

    // Physical Details
    height: "",
    weight: "",
    smoker: "" as "Yes" | "No" | "",

    // Contact Information
    email: "",
    homePhone: "",
    cellPhone: "",
    workPhone: "",
    fax: "",
    phone: "",

    // Address Information
    address: "",
    apartment: "",
    apartmentType: "" as "Apt" | "Unit" | "Suite" | "",
    city: "",
    state: "",
    zipCode: "",
    country: "",

    // Mailing Address
    differentMailingAddress: false,
    mailingAddress: "",
    mailingApartment: "",
    mailingApartmentType: "" as "Apt" | "Unit" | "Suite" | "",
    mailingCity: "",
    mailingState: "",
    mailingZipCode: "",
    mailingCountry: "",

    // Additional Details
    referral: "",
    policies: [] as string[],
    notes: "",
    relationship: "",
    status: "Client",
  });
  const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState<boolean>(false);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<number[]>([]);

  // Initialize form data from localStorage on component mount (only for new dependents)
  useEffect(() => {
    if (!editingMember) {
      try {
        const savedData = localStorage.getItem('addDependentFormData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setFormData(parsedData);
          // Also restore SSN display value if it exists
          if (parsedData.ssn) {
            setSsnDisplayValue(formatSSNDisplay(parsedData.ssn));
          }
        }
      } catch (error) {
        console.warn('Failed to load saved dependent form data:', error);
      }
    }
  }, [editingMember]);

  // Sync SSN display value with stored SSN value on form reset
  useEffect(() => {
    if (formData.ssn === '') {
      setSsnDisplayValue('');
    }
  }, [formData.ssn]);

  const handleUpdate = (updates: Partial<typeof formData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    
    // Save to localStorage for form persistence (if not editing existing member)
    if (!editingMember) {
      try {
        localStorage.setItem('addDependentFormData', JSON.stringify(newFormData));
      } catch (error) {
        console.warn('Failed to save dependent form data:', error);
      }
    }
  };

  const togglePolicy = (policyId: number, checked: boolean) => {
    setSelectedPolicyIds((prev) =>
      checked ? [...new Set([...prev, policyId])] : prev.filter((id) => id !== policyId),
    );
  };

  const handleManualReset = () => {
    // Reset form data
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      name: "",
      gender: "" as "Male" | "Female" | "Other" | "",
      dateOfBirth: "",
      ssn: "",
      maritalStatus: "" as "Single" | "Married" | "Divorced" | "Widowed" | "",
      height: "",
      weight: "",
      smoker: "" as "Yes" | "No" | "",
      email: "",
      homePhone: "",
      cellPhone: "",
      workPhone: "",
      fax: "",
      phone: "",
      address: "",
      apartment: "",
      apartmentType: "" as "Apt" | "Unit" | "Suite" | "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      differentMailingAddress: false,
      mailingAddress: "",
      mailingApartment: "",
      mailingApartmentType: "" as "Apt" | "Unit" | "Suite" | "",
      mailingCity: "",
      mailingState: "",
      mailingZipCode: "",
      mailingCountry: "",
      referral: "",
      policies: [] as string[],
      notes: "",
      relationship: "",
      status: "Client",
    });

    // Clear localStorage
    try {
      localStorage.removeItem('addDependentFormData');
    } catch (error) {
      console.warn('Failed to clear saved form data:', error);
    }

    // Reset SSN display value
    setSsnDisplayValue("");

    // Reset selected policies
    setSelectedPolicyIds([]);

    // Reset step to form
    setCurrentStep('form');

    // Show success message
    toast({
      title: "Form Reset",
      description: "All form fields have been cleared.",
    });
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName) {
      return;
    }

    const fullName =
      `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`.trim();

    onSubmit({
      ...formData,
      name: fullName,
      phone: formData.phone || formData.cellPhone || formData.homePhone || "",
      selectedPolicyIds,
    });

    // Clear localStorage data after successful submission
    localStorage.removeItem('addDependentFormData');

    // Reset form
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      name: "",
      gender: "" as "Male" | "Female" | "Other" | "",
      dateOfBirth: "",
      ssn: "",
      maritalStatus: "" as "Single" | "Married" | "Divorced" | "Widowed" | "",
      height: "",
      weight: "",
      smoker: "" as "Yes" | "No" | "",
      email: "",
      homePhone: "",
      cellPhone: "",
      workPhone: "",
      fax: "",
      phone: "",
      address: "",
      apartment: "",
      apartmentType: "" as "Apt" | "Unit" | "Suite" | "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      differentMailingAddress: false,
      mailingAddress: "",
      mailingApartment: "",
      mailingApartmentType: "" as "Apt" | "Unit" | "Suite" | "",
      mailingCity: "",
      mailingState: "",
      mailingZipCode: "",
      mailingCountry: "",
      referral: "",
      policies: [] as string[],
      notes: "",
      relationship: "",
      status: "Client",
    });
    setSelectedPolicyIds([]);
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
      status: formData.status as "Client" | "Former" | "Deceased",
      relationship: formData.relationship,
      notes: formData.notes,
    });

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

  // Function to handle final form submission
  const handleFinalSubmit = async () => {
    if (!formData.firstName || !formData.lastName) {
      return;
    }

    const fullName =
      `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`.trim();

    try {
      await onSubmit({
        ...formData,
        name: fullName,
        phone: formData.phone || formData.cellPhone || formData.homePhone || "",
        selectedPolicyIds,
      });

      // Only reset form and clear localStorage if submission was successful
      localStorage.removeItem('addDependentFormData');

      // Reset form and step
      setCurrentStep('form');
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        name: "",
        gender: "" as "Male" | "Female" | "Other" | "",
        dateOfBirth: "",
        ssn: "",
        maritalStatus: "" as "Single" | "Married" | "Divorced" | "Widowed" | "",
        height: "",
        weight: "",
        smoker: "" as "Yes" | "No" | "",
        email: "",
        homePhone: "",
        cellPhone: "",
        workPhone: "",
        fax: "",
        phone: "",
        address: "",
        apartment: "",
        apartmentType: "" as "Apt" | "Unit" | "Suite" | "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        differentMailingAddress: false,
        mailingAddress: "",
        mailingApartment: "",
        mailingApartmentType: "" as "Apt" | "Unit" | "Suite" | "",
        mailingCity: "",
        mailingState: "",
        mailingZipCode: "",
        mailingCountry: "",
        referral: "",
        policies: [] as string[],
        notes: "",
        relationship: "",
        status: "Client",
      });
      setSelectedPolicyIds([]);
      setSsnDisplayValue("");
    } catch (error) {
      // Don't reset form on error - let the parent component handle the error display
      console.error('Form submission failed:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onReset();
      setCurrentStep('form'); // Reset to form step when dialog closes
      setSsnDisplayValue(""); // Reset SSN display value
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        name: "",
        gender: "" as "Male" | "Female" | "Other" | "",
        dateOfBirth: "",
        ssn: "",
        maritalStatus: "" as "Single" | "Married" | "Divorced" | "Widowed" | "",
        height: "",
        weight: "",
        smoker: "" as "Yes" | "No" | "",
        email: "",
        homePhone: "",
        cellPhone: "",
        workPhone: "",
        fax: "",
        phone: "",
        address: "",
        apartment: "",
        apartmentType: "" as "Apt" | "Unit" | "Suite" | "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        differentMailingAddress: false,
        mailingAddress: "",
        mailingApartment: "",
        mailingApartmentType: "" as "Apt" | "Unit" | "Suite" | "",
        mailingCity: "",
        mailingState: "",
        mailingZipCode: "",
        mailingCountry: "",
        referral: "",
        policies: [] as string[],
        notes: "",
        relationship: "",
        status: "Client",
      });
      setSelectedPolicyIds([]);
      setAvailablePolicies([]);
    }
    onOpenChange(open);
  };

  // Load form data from localStorage when dialog opens (only for new dependents)
  useEffect(() => {
    if (isOpen && !editingMember) {
      try {
        const savedData = localStorage.getItem('addDependentFormData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Type-safe merging of saved data
          setFormData(prev => ({
            ...prev,
            firstName: parsedData.firstName || "",
            middleName: parsedData.middleName || "",
            lastName: parsedData.lastName || "",
            gender: (parsedData.gender && ["Male", "Female", "Other"].includes(parsedData.gender)) 
              ? parsedData.gender as "Male" | "Female" | "Other" 
              : "",
            dateOfBirth: parsedData.dateOfBirth || "",
            ssn: parsedData.ssn || "",
            maritalStatus: (parsedData.maritalStatus && ["Single", "Married", "Divorced", "Widowed"].includes(parsedData.maritalStatus))
              ? parsedData.maritalStatus as "Single" | "Married" | "Divorced" | "Widowed"
              : "",
            height: parsedData.height || "",
            weight: parsedData.weight || "",
            smoker: (parsedData.smoker && ["Yes", "No"].includes(parsedData.smoker))
              ? parsedData.smoker as "Yes" | "No"
              : "",
            email: parsedData.email || "",
            homePhone: parsedData.homePhone || "",
            cellPhone: parsedData.cellPhone || "",
            workPhone: parsedData.workPhone || "",
            fax: parsedData.fax || "",
            address: parsedData.address || "",
            apartment: parsedData.apartment || "",
            apartmentType: (parsedData.apartmentType && ["Apt", "Unit", "Suite"].includes(parsedData.apartmentType))
              ? parsedData.apartmentType as "Apt" | "Unit" | "Suite"
              : "",
            city: parsedData.city || "",
            state: parsedData.state || "",
            zipCode: parsedData.zipCode || "",
            country: parsedData.country || "",
            differentMailingAddress: parsedData.differentMailingAddress || false,
            mailingAddress: parsedData.mailingAddress || "",
            mailingApartment: parsedData.mailingApartment || "",
            mailingApartmentType: (parsedData.mailingApartmentType && ["Apt", "Unit", "Suite"].includes(parsedData.mailingApartmentType))
              ? parsedData.mailingApartmentType as "Apt" | "Unit" | "Suite"
              : "",
            mailingCity: parsedData.mailingCity || "",
            mailingState: parsedData.mailingState || "",
            mailingZipCode: parsedData.mailingZipCode || "",
            mailingCountry: parsedData.mailingCountry || "",
            referral: parsedData.referral || "",
            notes: parsedData.notes || "",
          }));
        }
      } catch (error) {
        console.warn('Failed to load saved dependent form data:', error);
      }
    }
  }, [isOpen, editingMember]);

  useEffect(() => {
    if (editingMember) {
      const newFormData = {
        firstName: editingMember.firstName || "",
        middleName: editingMember.middleName || "",
        lastName: editingMember.lastName || "",
        name: editingMember.name || "",
        gender: (editingMember.gender && ["Male", "Female", "Other"].includes(editingMember.gender)) 
          ? editingMember.gender as "Male" | "Female" | "Other" 
          : "" as "Male" | "Female" | "Other" | "",
        dateOfBirth: editingMember.dateOfBirth ? editingMember.dateOfBirth.split('T')[0] : "",
        ssn: editingMember.ssn || "",
        maritalStatus: (editingMember.maritalStatus && ["Single", "Married", "Divorced", "Widowed"].includes(editingMember.maritalStatus))
          ? editingMember.maritalStatus as "Single" | "Married" | "Divorced" | "Widowed"
          : "" as "Single" | "Married" | "Divorced" | "Widowed" | "",
        height: editingMember.height || "",
        weight: editingMember.weight || "",
        smoker: (editingMember.smoker && ["Yes", "No"].includes(editingMember.smoker))
          ? editingMember.smoker as "Yes" | "No"
          : "" as "Yes" | "No" | "",
        email: editingMember.email || "",
        homePhone: editingMember.homePhone || "",
        cellPhone: editingMember.cellPhone || "",
        workPhone: editingMember.workPhone || "",
        fax: editingMember.fax || "",
        phone: editingMember.phone || "",
        address: editingMember.address || "",
        apartment: editingMember.apartment || "",
        apartmentType: (editingMember.apartmentType && ["Apt", "Unit", "Suite"].includes(editingMember.apartmentType))
          ? editingMember.apartmentType as "Apt" | "Unit" | "Suite"
          : "" as "Apt" | "Unit" | "Suite" | "",
        city: editingMember.city || "",
        state: editingMember.state || "",
        zipCode: editingMember.zipCode || "",
        country: editingMember.country || "",
        differentMailingAddress: editingMember.differentMailingAddress || false,
        mailingAddress: editingMember.mailingAddress || "",
        mailingApartment: editingMember.mailingApartment || "",
        mailingApartmentType: (editingMember.mailingApartmentType && ["Apt", "Unit", "Suite"].includes(editingMember.mailingApartmentType))
          ? editingMember.mailingApartmentType as "Apt" | "Unit" | "Suite"
          : "" as "Apt" | "Unit" | "Suite" | "",
        mailingCity: editingMember.mailingCity || "",
        mailingState: editingMember.mailingState || "",
        mailingZipCode: editingMember.mailingZipCode || "",
        mailingCountry: editingMember.mailingCountry || "",
        referral: editingMember.referral || "",
        policies: editingMember.policies || [] as string[],
        notes: editingMember.notes || "",
        relationship: editingMember.relationship || "",
        status: (editingMember.status && ["Client", "Former", "Deceased"].includes(editingMember.status))
          ? editingMember.status as "Client" | "Former" | "Deceased"
          : "Client",
      };
      setFormData(newFormData);
    }
  }, [editingMember]);

  // Load customer's policies and current assignments when dialog opens
  useEffect(() => {
    if (!isOpen || !customerId) return;

    let isMounted = true;
    setLoadingPolicies(true);

    const loadPolicies = async () => {
      try {
        // First, get all customer policies
        const customerPoliciesRes = await PolicyService.getPolicies(1, 100, { customer_id: customerId });
        if (!isMounted) return;
        
        setAvailablePolicies(customerPoliciesRes.data || []);
        
        // If editing a member, get their currently assigned policies using the new dependent API
        if (editingMember?.id) {
          try {
            const assignedPolicies = await dependentService.getDependentPolicies(editingMember.id);
            if (!isMounted) return;
            
            const assignedIds = (assignedPolicies || []).map((p) => p.id);
            setSelectedPolicyIds(assignedIds);
          } catch (error) {
            console.error("Failed to load assigned policies for dependent:", error);
            if (isMounted) setSelectedPolicyIds([]);
          }
        } else {
          setSelectedPolicyIds([]);
          
          // If adding a new dependent and we have customer data, copy referral and status
          if (customerData && !editingMember) {
            setFormData(prev => ({
              ...prev,
              referral: customerData.referral || "",
              status: (customerData.status && ["Client", "Former", "Deceased"].includes(customerData.status))
                ? customerData.status as "Client" | "Former" | "Deceased"
                : "Client"
            }));
          }
        }
      } catch (e) {
        console.error("Failed to load policies for customer/family member", e);
        if (isMounted) {
          setAvailablePolicies([]);
          setSelectedPolicyIds([]);
        }
      } finally {
        if (isMounted) setLoadingPolicies(false);
      }
    };

    loadPolicies();

    return () => {
      isMounted = false;
    };
  }, [isOpen, customerId, editingMember?.id, customerData]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'form' 
              ? (editingMember ? "Edit Dependent" : "Add Dependent")
              : "Review Dependent Information"
            }
          </DialogTitle>
          
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
                  Dependent Details
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
            
            {currentStep === 'form' && !editingMember && (
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={handleManualReset}
              >
                Reset Form
              </Button>
            )}
          </div>
        </DialogHeader>

        {currentStep === 'form' ? (
          <div className="space-y-6">
          <PersonalInfoSection formData={formData} onUpdate={handleUpdate} />
          <ContactInfoSection formData={formData} onUpdate={handleUpdate} />
          <AddressInfoSection formData={formData} onUpdate={handleUpdate} />
          <AdditionalInfoSection 
            formData={formData} 
            onUpdate={handleUpdate}
            isEditMode={!!editingMember}
            originalStatus={editingMember?.status}
          />
          
          {/* Assign Policies Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assign Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPolicies ? (
                <p className="text-sm text-gray-500">Loading policies...</p>
              ) : availablePolicies.length === 0 ? (
                <p className="text-sm text-gray-500">This customer has no policies.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availablePolicies.map((policy) => (
                    <label key={policy.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        id={`policy-${policy.id}`}
                        checked={selectedPolicyIds.includes(policy.id)}
                        onCheckedChange={(checked) => togglePolicy(policy.id, Boolean(checked))}
                      />
                      <span className="text-sm flex-1">
                        <span className="font-medium">{policy.policy_number}</span>
                        {policy.plan?.name && (
                          <span className="text-gray-600"> - {policy.plan.name}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            {!editingMember && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleManualReset}
              >
                Reset Form
              </Button>
            )}
            {editingMember && <div></div>}
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleProceedToPreview}>
                Continue to Review
              </Button>
            </div>
          </div>
        </div>
        ) : (
          <div className="space-y-6">
            <FamilyMemberPreview
              data={{
                id: editingMember?.id || 0,
                firstName: formData.firstName,
                middleName: formData.middleName || '',
                lastName: formData.lastName,
                name: [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' '),
                relationship: formData.relationship,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender as FamilyMember['gender'],
                ssn: formatSSNDisplay(formData.ssn),
                maritalStatus: formData.maritalStatus as FamilyMember['maritalStatus'],
                height: formData.height,
                weight: formData.weight || '',
                smoker: formData.smoker as FamilyMember['smoker'],
                phone: formData.cellPhone || '',
                cellPhone: formData.cellPhone || '',
                homePhone: formData.homePhone || '',
                workPhone: formData.workPhone || '',
                email: formData.email || '',
                address: formData.address || '',
                apartment: formData.apartment || '',
                apartmentType: formData.apartmentType as FamilyMember['apartmentType'],
                city: formData.city || '',
                state: formData.state || '',
                zipCode: formData.zipCode || '',
                country: formData.country || 'United States',
                mailingAddress: formData.mailingAddress || '',
                mailingApartment: formData.mailingApartment || '',
                mailingApartmentType: formData.mailingApartmentType as FamilyMember['mailingApartmentType'],
                mailingCity: formData.mailingCity || '',
                mailingState: formData.mailingState || '',
                mailingZipCode: formData.mailingZipCode || '',
                mailingCountry: formData.mailingCountry || '',
                differentMailingAddress: formData.differentMailingAddress || false,
                referral: formData.referral || '',
                status: formData.status || 'Client',
                policies: selectedPolicyIds.map(String),
                notes: formData.notes || '',
                selectedPolicies: availablePolicies.filter(policy => selectedPolicyIds.includes(policy.id))
              }}
            />
            
            <div className="flex justify-between gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBackToForm}
              >
                Back to Edit
              </Button>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleFinalSubmit}>
                  {editingMember ? "Update Dependent" : "Add Dependent"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};