import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { EmployeePreview } from "./EmployeePreview";
import { ValidatedInput } from "@/components/ui/validated-input";
import { officeLocationService, OfficeLocationOption } from "@/services/officeLocationService";

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface ValidationErrors {
  [key: string]: string[];
}

interface AddEmployeeDialogProps {
  onAddEmployee: (employee: any, setValidationErrors: (errors: ValidationErrors) => void) => Promise<boolean>;
  roles: Role[];
}

export const AddEmployeeDialog = ({
  onAddEmployee,
  roles,
}: AddEmployeeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState<'form' | 'preview'>('form');
  
  // Default form data
  const defaultFormData = {
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    position: "",
    company: "",
    location: "",
    roles: [] as number[],
    is_active: true,
  };
  
  const [formData, setFormData] = useState(defaultFormData);
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
    };

    fetchOfficeLocations();
  }, []);

  // Initialize form data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('employeeFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData({ ...defaultFormData, ...parsedData });
      }
    } catch (error) {
      console.warn('Failed to load saved employee form data:', error);
    }
  }, []);

  // Comprehensive password validation
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    return errors;
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
    
    if (!formData.password.trim()) {
      errors.password = ["Password is required"];
    } else {
      // Validate password strength
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors;
      }
    }
    
    if (!formData.password_confirmation.trim()) {
      errors.password_confirmation = ["Password confirmation is required"];
    } else if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = ["Passwords do not match"];
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

  // Updated input change handler with localStorage persistence and validation clearing
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
    
    // Save to localStorage for form persistence
    try {
      localStorage.setItem('employeeFormData', JSON.stringify(newFormData));
    } catch (error) {
      console.warn('Failed to save employee form data:', error);
    }
  };

  const handleManualReset = () => {
    // Reset form data
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      password_confirmation: "",
      phone: "",
      position: "",
      company: "",
      location: "",
      roles: [],
      is_active: true,
    });

    // Clear localStorage
    try {
      localStorage.removeItem('employeeFormData');
    } catch (error) {
      console.warn('Failed to clear saved employee form data:', error);
    }

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
    
    if (!formData.password.trim()) {
      errors.password = ["Password is required"];
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors;
      }
    }
    
    if (!formData.password_confirmation.trim()) {
      errors.password_confirmation = ["Password confirmation is required"];
    } else if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = ["Passwords do not match"];
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

    const success = await onAddEmployee(formData, setValidationErrors);
    setIsSubmitting(false);
    
    if (success) {
      setOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        password_confirmation: "",
        phone: "",
        position: "",
        company: "",
        location: "",
        roles: [],
        is_active: true,
      });
      
      // Clear localStorage after successful submission
      try {
        localStorage.removeItem('employeeFormData');
      } catch (error) {
        console.warn('Failed to clear saved employee form data:', error);
      }
      
      // Reset step and clear errors
      setCurrentStep('form');
      setValidationErrors({});
    } else {
      // If submission failed, go back to form to show errors
      setCurrentStep('form');
    }
  };

  const getFieldError = (field: string) => {
    return validationErrors[field]?.[0];
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Only clear validation errors when completely closing the dialog
        // Don't clear them when switching between steps
        setValidationErrors({});
        setCurrentStep('form');
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'form' 
              ? "Add New Employee"
              : "Review Employee Information"
            }
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'form'
              ? "Add a new team member to your organization."
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
                  onChange={(value) => handleInputChange('first_name', value)}
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
                  onChange={(value) => handleInputChange('last_name', value)}
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
                onChange={(value) => handleInputChange('email', value)}
                placeholder="Enter work email (e.g., john.smith@company.com)"
                required
                maxLength={123}
                error={getFieldError('email')}
                validationHint="Work email address for system access"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className={getFieldError('password') ? 'border-red-500' : ''}
                  />
                  {getFieldError('password') && (
                    <div className="text-sm text-red-500 mt-1">
                      {validationErrors.password?.map((error, index) => (
                        <p key={index}>{error}</p>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <p>Password must contain:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                        At least 8 characters {formData.password.length > 0 && `(${formData.password.length})`}
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                        One uppercase letter (A-Z)
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
                        One lowercase letter (a-z)
                      </li>
                      <li className={/\d/.test(formData.password) ? 'text-green-600' : ''}>
                        One number (0-9)
                      </li>
                      <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : ''}>
                        One special character (!@#$%^&*)
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password_confirmation">Confirm Password <span className="text-red-500">*</span></Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                    placeholder="Re-enter the same password"
                    required
                    className={getFieldError('password_confirmation') ? 'border-red-500' : ''}
                  />
                  {getFieldError('password_confirmation') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('password_confirmation')}</p>
                  )}
                  <div className="text-xs mt-1">
                    {formData.password && formData.password_confirmation && (
                      <span className={formData.password === formData.password_confirmation ? 'text-green-600' : 'text-red-500'}>
                        {formData.password === formData.password_confirmation ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </span>
                    )}
                    {!formData.password_confirmation && (
                      <span className="text-gray-500">Must match the password above</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ValidatedInput
                  id="phone"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  placeholder="Enter phone number (e.g., +1 555-123-4567)"
                  maxLength={17}
                  error={getFieldError('phone')}
                  validationHint="Include country code for international numbers"
                />
                <ValidatedInput
                  id="position"
                  label="Position/Title"
                  value={formData.position}
                  onChange={(value) => handleInputChange('position', value)}
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
                  onChange={(value) => handleInputChange('company', value)}
                  placeholder="Enter company name (e.g., ABC Insurance Services)"
                  maxLength={100}
                  error={getFieldError('company')}
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
                <p className="text-xs text-gray-500 mb-2">Select one or more roles that define the employee's permissions and access level</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={formData.roles.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleInputChange('roles', [...formData.roles, role.id]);
                          } else {
                            handleInputChange('roles', formData.roles.filter((r) => r !== role.id));
                          }
                        }}
                      />
                      <Label htmlFor={`role-${role.id}`} className="text-sm cursor-pointer">
                        {role.name}
                        {role.description && (
                          <span className="block text-xs text-gray-500 font-normal">
                            {role.description}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
                {getFieldError('roles') && (
                  <p className="text-sm text-red-500 mt-2">{getFieldError('roles')}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">
                  Active (User can login and access the system)
                </Label>
              </div>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleManualReset}
                >
                  Reset Form
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setValidationErrors({});
                    }}
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
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Preview content */}
            <div className="pt-4">
              <EmployeePreview formData={formData} roles={roles} />
            </div>
            
            <div className="flex justify-between pt-4">
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
                  onClick={() => {
                    setOpen(false);
                    setValidationErrors({});
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Employee'
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
