import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { EmployeePreview } from "./EmployeePreview";
import { ValidatedInput } from "@/components/ui/validated-input";
import { officeLocationService, OfficeLocationOption } from "@/services/officeLocationService";

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  company?: string;
  location?: string;
  is_active: boolean;
  is_agent?: boolean;
  roles: Role[];
}

interface EditEmployeeDialogProps {
  employee: TeamMember;
  roles: Role[];
  open: boolean;
  onClose: () => void;
  onUpdateEmployee: (employee: any) => void;
}

interface ValidationErrors {
  [key: string]: string[];
}

export const EditEmployeeDialog = ({
  employee,
  roles,
  open,
  onClose,
  onUpdateEmployee,
}: EditEmployeeDialogProps) => {
  // Multi-step state
  const [currentStep, setCurrentStep] = useState<'form' | 'preview'>('form');
  
  // Initialize form data with employee data
  const getInitialFormData = (emp: TeamMember | null) => ({
    first_name: emp?.first_name || "",
    last_name: emp?.last_name || "",
    email: emp?.email || "",
    phone: emp?.phone || "",
    position: emp?.position || "",
    company: emp?.company || "",
    location: emp?.location || "no-location",
    roles: emp?.roles?.map((role) => role.id) || [],
    is_active: emp?.is_active !== undefined ? emp.is_active : true,
    is_agent: emp?.is_agent !== undefined ? emp.is_agent : false,
  });

  const [formData, setFormData] = useState(getInitialFormData(employee));

  const [passwordData, setPasswordData] = useState({
    password: "",
    password_confirmation: "",
  });

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [officeLocations, setOfficeLocations] = useState<OfficeLocationOption[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Fetch office locations on component mount
  useEffect(() => {
  const fetchOfficeLocations = async () => {
    try {
      setIsLoadingLocations(true);
      const response = await officeLocationService.getLocationOptions();
      
      if (response && Array.isArray(response)) {
        setOfficeLocations(response);
      } else {
        console.error('Invalid response format:', response);
        setOfficeLocations([]);
      }
    } catch (error) {
      console.error('Failed to fetch office locations:', error);
      setOfficeLocations([]);
      toast({
        title: "Error",
        description: "Failed to load office locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocations(false);
    }
  };    fetchOfficeLocations();
  }, []);

  useEffect(() => {
    if (employee && open) {
      setFormData(getInitialFormData(employee));
      setShowPasswordFields(false);
      setPasswordData({
        password: "",
        password_confirmation: "",
      });
    }
  }, [employee, open]);

  const getFieldError = (field: string) => {
    return validationErrors[field]?.[0];
  };

  // Function to proceed to preview step
  const handleProceedToPreview = () => {
    const errors: ValidationErrors = {};

    // Required field validation
    if (!formData.first_name.trim()) errors.first_name = ["First name is required"];
    if (!formData.last_name.trim()) errors.last_name = ["Last name is required"];
    if (!formData.email.trim()) {
      errors.email = ["Email is required"];
    } else {
      // Basic email validation - more permissive regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = ["Please enter a valid email address"];
      }
    }
    
    if (showPasswordFields) {
      if (passwordData.password && passwordData.password.length < 8) {
        errors.password = ["Password must be at least 8 characters long"];
      }
      if (passwordData.password !== passwordData.password_confirmation) {
        errors.password_confirmation = ["Passwords do not match"];
      }
    }
    
    if (formData.roles.length === 0) {
      errors.roles = ["At least one role must be selected"];
    }

    // Phone validation if provided
    if (formData.phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\(\)\-]+$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = ["Please enter a valid phone number"];
      }
    }

    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Show validation error toast
      const errorCount = Object.keys(errors).length;
      const errorFields = Object.keys(errors).join(', ');
      toast({
        title: "Validation Error",
        description: `Please fix ${errorCount} error(s) in: ${errorFields}`,
        variant: "destructive",
      });
      return;
    }

    setCurrentStep('preview');
  };

  // Function to go back to form from preview
  const handleBackToForm = () => {
    // Don't clear validation errors when going back
    // This ensures that any validation errors from the preview step
    // are still visible when the user returns to the form
    setCurrentStep('form');
  };

  // Updated input change handler with validation f  clearing
  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we're on the form step, proceed to preview instead of submitting
    if (currentStep === 'form') {
      handleProceedToPreview();
      return;
    }

    // If we're on the preview step, we should re-validate before submitting
    // to ensure data is still valid
    const errors: ValidationErrors = {};

    // Re-run validation before submission
    if (!formData.first_name.trim()) errors.first_name = ["First name is required"];
    if (!formData.last_name.trim()) errors.last_name = ["Last name is required"];
    if (!formData.email.trim()) {
      errors.email = ["Email is required"];
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = ["Please enter a valid email address"];
      }
    }
    
    if (showPasswordFields) {
      if (passwordData.password && passwordData.password.length < 8) {
        errors.password = ["Password must be at least 8 characters long"];
      }
      if (passwordData.password !== passwordData.password_confirmation) {
        errors.password_confirmation = ["Passwords do not match"];
      }
    }
    
    if (formData.roles.length === 0) {
      errors.roles = ["At least one role must be selected"];
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\(\)\-]+$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = ["Please enter a valid phone number"];
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setCurrentStep('form'); // Go back to form to show errors
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before submitting",
        variant: "destructive",
      });
      return;
    }

    // Proceed with submission
    setIsSubmitting(true);

    const updateData = {
      ...formData,
      // Convert "no-location" to empty string for backend
      location: formData.location === "no-location" ? "" : formData.location,
      ...(showPasswordFields && passwordData.password
        ? {
            password: passwordData.password,
            password_confirmation: passwordData.password_confirmation,
          }
        : {}),
    };

    await onUpdateEmployee(updateData);
    setIsSubmitting(false);
  };

  return (
    <Dialog key={employee?.id || 'new'} open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        // Reset form data when closing
        setFormData(getInitialFormData(null));
        setValidationErrors({});
        setCurrentStep('form');
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'form' 
              ? "Edit Employee"
              : "Review Employee Information"
            }
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'form'
              ? "Update employee information and settings."
              : "Please review the information below before submitting."
            }
          </DialogDescription>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'form' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                1
              </div>
              <span className={`ml-2 text-sm ${currentStep === 'form' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Employee Details
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
        </DialogHeader>

        {currentStep === 'form' ? (
          <>
            {/* Form content */}
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              id="first_name"
              label="First Name"
              value={formData.first_name}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  first_name: value,
                }))
              }
              placeholder="Enter first name (e.g., John)"
              required
              maxLength={35}
              error={getFieldError('first_name')}
              validationHint="Employee's first name"
            />
            <ValidatedInput
              id="last_name"
              label="Last Name"
              value={formData.last_name}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  last_name: value,
                }))
              }
              placeholder="Enter last name (e.g., Smith)"
              required
              maxLength={35}
              error={getFieldError('last_name')}
              validationHint="Employee's last name"
            />
          </div>

          <ValidatedInput
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, email: value }))
            }
            placeholder="Enter work email (e.g., john.smith@company.com)"
            required
            maxLength={123}
            error={getFieldError('email')}
            validationHint="Work email address for system access"
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
              >
                {showPasswordFields ? "Cancel Password Change" : "Change Password"}
              </Button>
            </div>

            {showPasswordFields && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">New Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={passwordData.password}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                    className={getFieldError('password') ? 'border-red-500' : ''}
                  />
                  {getFieldError('password') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('password')}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password_confirmation">Confirm New Password *</Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={passwordData.password_confirmation}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        password_confirmation: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    className={getFieldError('password_confirmation') ? 'border-red-500' : ''}
                  />
                  {getFieldError('password_confirmation') && (
                    <p className="text-sm text-red-500 mt-1">
                      {getFieldError('password_confirmation')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              id="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, phone: value }))
              }
              placeholder="Enter phone number (e.g., +1 555-123-4567)"
              maxLength={17}
              error={getFieldError('phone')}
              validationHint="Include country code for international numbers"
            />
            <ValidatedInput
              id="position"
              label="Position/Title"
              value={formData.position}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, position: value }))
              }
              placeholder="Enter job title (e.g., Insurance Agent, Claims Manager)"
              maxLength={100}
              error={getFieldError('position')}
              validationHint="Employee's role or job title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              id="company"
              label="Company"
              value={formData.company}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, company: value }))
              }
              placeholder="Enter company name (e.g., ABC Insurance Services)"
              maxLength={100}
              validationHint="Company or organization name"
            />
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => handleInputChange('location', value)}
                disabled={isLoadingLocations}
              >
                <SelectTrigger className={getFieldError('location') ? 'border-red-500' : ''}>
                  <SelectValue placeholder={isLoadingLocations ? "Loading locations..." : "Select work location"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="no-location" value="no-location">No Location</SelectItem>
                  {officeLocations.map((location) => (
                    <SelectItem key={location.id} value={location.display}>
                      {location.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError('location') && (
                <p className="text-sm text-red-500">{getFieldError('location')}</p>
              )}
              <p className="text-xs text-gray-500">Primary work location</p>
            </div>
          </div>

          <div>
            <Label>Roles <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={formData.roles.includes(role.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData((prev) => ({
                          ...prev,
                          roles: [...prev.roles, role.id],
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          roles: prev.roles.filter((r) => r !== role.id),
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={`role-${role.id}`} className="text-sm">
                    {role.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: checked }))
              }
            />
            <Label htmlFor="is_active">
              Active (User can login and access the system)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_agent"
              checked={formData.is_agent}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_agent: checked }))
              }
            />
            <Label htmlFor="is_agent">
              Is Agent (Will appear in Agent of Record and Writing Agent dropdowns)
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Review Information'
              )}
            </Button>
          </div>
        </form>
          </>
        ) : (
          <>
            {/* Preview content */}
            <div className="pt-4">
              <EmployeePreview formData={formData} roles={roles} />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBackToForm}
                disabled={isSubmitting}
              >
                Edit Information
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Employee'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
