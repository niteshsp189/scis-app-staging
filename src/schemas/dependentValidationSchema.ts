import { z } from 'zod';

// Phone number validation regex - matches backend pattern
const phoneRegex = /^[\+]?[\d\s\(\)\-]+$/;

// Address validation regex - matches backend pattern
const addressRegex = /^[a-zA-Z0-9\s\-\'\.,\/&:]+$/;

// SSN validation function
const validateSSN = (ssn: string): boolean => {
  if (!ssn) return true; // Optional field
  // Remove any formatting and check if it's 9 digits
  const cleanSSN = ssn.replace(/[-\s]/g, '');
  return /^\d{9}$/.test(cleanSSN);
};

// Height validation function
const validateHeight = (height: string): boolean => {
  if (!height) return true; // Optional field
  
  // Check if height follows the format "X'Y\"" (feet'inches")
  const heightRegex = /^(\d+)'(\d+)"$/;
  const match = height.match(heightRegex);
  
  if (!match) {
    // If not in feet'inches" format, try to parse as a simple number (backward compatibility)
    const num = parseFloat(height);
    return !isNaN(num) && num <= 300 && num > 0;
  }
  
  const feet = parseInt(match[1]);
  const inches = parseInt(match[2]);
  
  // Validate feet (1-8) and inches (0-11)
  if (feet < 1 || feet > 8) return false;
  if (inches < 0 || inches > 11) return false;
  
  // Prevent both feet and inches being invalid combinations (like 0'0")
  if (feet === 1 && inches === 0) return false; // Too short for a human
  
  // Convert to total inches and check against max (300 inches = 25 feet, which is reasonable)
  const totalInches = feet * 12 + inches;
  return totalInches <= 300;
};

// Weight validation function  
const validateWeight = (weight: string): boolean => {
  if (!weight) return true; // Optional field
  const numericValue = parseFloat(weight);
  return !isNaN(numericValue) && numericValue > 0 && numericValue <= 300;
};

// Date of birth validation function
const validateDateOfBirth = (dateOfBirth: string): boolean => {
  if (!dateOfBirth) return true; // Optional field
  const selectedDate = new Date(dateOfBirth);
  const today = new Date();
  return selectedDate < today; // Must be before today
};

const baseDependentSchema = z.object({
  // Personal Information - matching backend validation exactly
  firstName: z.string()
    .min(1, 'First name is required')
    .max(35, 'First name must not exceed 35 characters'),
  
  middleName: z.string()
    .max(35, 'Middle name must not exceed 35 characters')
    .optional(),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(35, 'Last name must not exceed 35 characters'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .max(123, 'Email must not exceed 123 characters')
    .optional()
    .or(z.literal('')),
  
  gender: z.enum(['Male', 'Female', 'Other', '']).optional(),
  
  dateOfBirth: z.string()
    .refine(validateDateOfBirth, 'Date of birth must be before today')
    .optional()
    .or(z.literal('')),
  
  ssn: z.string()
    .max(14, 'SSN must not exceed 14 characters')
    .refine(validateSSN, 'SSN must be in format XXX-XX-XXXX')
    .optional()
    .or(z.literal('')),
  
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed', '']).optional(),
  
  // Physical Details - matching backend numeric validation
  height: z.string()
    .refine(validateHeight, 'Height must be in valid format (1-8 feet, 0-11 inches, not both zero)')
    .optional()
    .or(z.literal('')),
  
  weight: z.string()
    .refine(validateWeight, 'Weight must be a valid number (max 300)')
    .optional()
    .or(z.literal('')),
  
  smoker: z.enum(['Yes', 'No', '']).optional(),
  
  // Contact Information - matching backend phone validation
  homePhone: z.string()
    .max(17, 'Home phone must not exceed 17 characters')
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  
  cellPhone: z.string()
    .max(17, 'Cell phone must not exceed 17 characters')
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  
  workPhone: z.string()
    .max(17, 'Work phone must not exceed 17 characters')
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  
  fax: z.string()
    .max(17, 'Fax must not exceed 17 characters')
    .regex(phoneRegex, 'Please enter a valid fax number')
    .optional()
    .or(z.literal('')),
  
  // Address Information - matching backend validation
  address: z.string()
    .max(255, 'Address must not exceed 255 characters')
    .regex(addressRegex, 'Address contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  apartment: z.string()
    .max(50, 'Apartment must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  
  apartmentType: z.enum(['Apt', 'Unit', 'Suite', '']).optional(),
  
  city: z.string()
    .max(80, 'City must not exceed 80 characters')
    .optional()
    .or(z.literal('')),
  
  state: z.string()
    .max(80, 'State must not exceed 80 characters')
    .optional()
    .or(z.literal('')),
  
  zipCode: z.string()
    .max(15, 'ZIP code must not exceed 15 characters')
    .optional()
    .or(z.literal('')),
  
  country: z.string()
    .max(100, 'Country must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  
  // Mailing Address Information
  differentMailingAddress: z.boolean().optional(),
  
  mailingAddress: z.string()
    .max(255, 'Mailing address must not exceed 255 characters')
    .regex(addressRegex, 'Mailing address contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  mailingApartment: z.string()
    .max(50, 'Mailing apartment must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  
  mailingApartmentType: z.enum(['Apt', 'Unit', 'Suite', '']).optional(),
  
  mailingCity: z.string()
    .max(80, 'Mailing city must not exceed 80 characters')
    .optional()
    .or(z.literal('')),
  
  mailingState: z.string()
    .max(80, 'Mailing state must not exceed 80 characters')
    .optional()
    .or(z.literal('')),
  
  mailingZipCode: z.string()
    .max(15, 'Mailing ZIP code must not exceed 15 characters')
    .optional()
    .or(z.literal('')),
  
  mailingCountry: z.string()
    .max(100, 'Mailing country must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  
  // Additional Information
  referral: z.string()
    .max(255, 'Referral must not exceed 255 characters')
    .optional()
    .or(z.literal('')),
  
  status: z.enum(['Client', 'Former', 'Deceased', '']).optional(),
  
  relationship: z.string()
    .min(1, 'Relationship is required')
    .max(255, 'Relationship must not exceed 255 characters'),
  
  notes: z.string().optional().or(z.literal('')),
});

// Add refinement to require at least one phone number for dependents
export const dependentValidationSchema = baseDependentSchema.refine(
  (data) => {
    // At least one phone number must be provided
    return !!(data.homePhone && data.homePhone.trim()) || !!(data.cellPhone && data.cellPhone.trim());
  },
  {
    message: "At least one phone number (Home Phone or Cell Phone) is required",
    path: ["cellPhone"], // Show error on cellPhone field
  }
);

export type DependentFormData = z.infer<typeof dependentValidationSchema>;

// Individual field validation function
export const validateField = (field: keyof DependentFormData, value: any): string => {
  try {
    const fieldSchema = baseDependentSchema.shape[field];
    fieldSchema.parse(value);
    return '';
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value';
    }
    return 'Invalid value';
  }
};

// Full form validation function
export const validateForm = (data: Partial<DependentFormData>): { [key: string]: string } => {
  try {
    dependentValidationSchema.parse(data);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: { [key: string]: string } = {};
      error.errors.forEach((err) => {
        if (err.path) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return errors;
    }
    return {};
  }
};