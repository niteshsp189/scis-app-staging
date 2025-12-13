import { z } from "zod";

// Phone number validation regex - supports +, spaces, hyphens, parentheses
const phoneRegex = /^[\+]?[\d\s\(\)\-]+$/;

// Address validation regex - allows letters, numbers, spaces, and special characters: -, ', ., ,, /, &, :
const addressRegex = /^[a-zA-Z0-9\s\-'.,\/&:]+$/;

const baseCustomerSchema = z.object({
  // Personal Information
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(35, "First name must not exceed 35 characters"),
  
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(35, "Last name must not exceed 35 characters"),
  
  middleName: z
    .string()
    .max(35, "Middle name must not exceed 35 characters")
    .optional()
    .or(z.literal("")),
  
  email: z
    .string()
    .max(123, "Email must not exceed 123 characters")
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  
  gender: z
    .enum(["Male", "Female", "Other"], {
      errorMap: () => ({ message: "Gender is required" }),
    }),
  
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      if (!date) return false; // Required field
      const selectedDate = new Date(date);
      const today = new Date();
      return selectedDate < today;
    }, "Date of birth must be before today"),
  
  ssn: z
    .string()
    .min(1, "SSN is required")
    .max(14, "SSN must not exceed 14 characters"),
  
  maritalStatus: z
    .enum(["Single", "Married", "Divorced", "Widowed"], {
      errorMap: () => ({ message: "Please select a valid marital status" }),
    })
    .optional()
    .or(z.literal("")),

  // Physical Details
  height: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      
      // Check if height follows the format "X'Y\"" (feet'inches")
      const heightRegex = /^(\d+)'(\d+)"$/;
      const match = val.match(heightRegex);
      
      if (!match) {
        // If not in feet'inches" format, try to parse as a simple number (backward compatibility)
        const num = parseFloat(val);
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
    }, "Height must be in valid format (1-8 feet, 0-11 inches, not both zero)")
    .or(z.literal("")),
  
  weight: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const num = parseFloat(val);
      return !isNaN(num) && num <= 300;
    }, "Weight must be a number not exceeding 300")
    .or(z.literal("")),
  
  smoker: z
    .enum(["Yes", "No"], {
      errorMap: () => ({ message: "Please select Yes or No" }),
    })
    .optional()
    .or(z.literal("")),

  // Contact Information
  homePhone: z
    .string()
    .max(17, "Home phone must not exceed 17 characters")
    .refine((val) => {
      if (!val || val === "") return true; // Allow empty
      return phoneRegex.test(val);
    }, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  
  cellPhone: z
    .string()
    .max(17, "Cell phone must not exceed 17 characters")
    .refine((val) => {
      if (!val || val === "") return true; // Allow empty
      return phoneRegex.test(val);
    }, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  
  workPhone: z
    .string()
    .max(17, "Work phone must not exceed 17 characters")
    .regex(phoneRegex, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  
  fax: z
    .string()
    .max(17, "Fax must not exceed 17 characters")
    .regex(phoneRegex, "Please enter a valid fax number")
    .optional()
    .or(z.literal("")),

  // Address Information
  address: z
    .string()
    .max(255, "Address must not exceed 255 characters")
    .regex(addressRegex, "Address contains invalid characters")
    .optional()
    .or(z.literal("")),
  
  apartment: z
    .string()
    .max(50, "Apartment must not exceed 50 characters")
    .optional()
    .or(z.literal("")),
  
  apartmentType: z
    .enum(["Apt", "Unit", "Suite"], {
      errorMap: () => ({ message: "Please select a valid apartment type" }),
    })
    .optional()
    .or(z.literal("")),
  
  city: z
    .string()
    .max(80, "City must not exceed 80 characters")
    .optional()
    .or(z.literal("")),
  
  state: z
    .string()
    .max(80, "State must not exceed 80 characters")
    .optional()
    .or(z.literal("")),
  
  zipCode: z
    .string()
    .max(15, "ZIP code must not exceed 15 characters")
    .optional()
    .or(z.literal("")),
  
  country: z
    .string()
    .max(100, "Country must not exceed 100 characters")
    .optional()
    .or(z.literal("")),

  // Mailing Address Information
  differentMailingAddress: z.boolean().optional(),
  
  mailingAddress: z
    .string()
    .max(255, "Mailing address must not exceed 255 characters")
    .regex(addressRegex, "Mailing address contains invalid characters")
    .optional()
    .or(z.literal("")),
  
  mailingApartment: z
    .string()
    .max(50, "Mailing apartment must not exceed 50 characters")
    .optional()
    .or(z.literal("")),
  
  mailingApartmentType: z
    .enum(["Apt", "Unit", "Suite"], {
      errorMap: () => ({ message: "Please select a valid apartment type" }),
    })
    .optional()
    .or(z.literal("")),
  
  mailingCity: z
    .string()
    .max(80, "Mailing city must not exceed 80 characters")
    .optional()
    .or(z.literal("")),
  
  mailingState: z
    .string()
    .max(80, "Mailing state must not exceed 80 characters")
    .optional()
    .or(z.literal("")),
  
  mailingZipCode: z
    .string()
    .max(15, "Mailing ZIP code must not exceed 15 characters")
    .optional()
    .or(z.literal("")),
  
  mailingCountry: z
    .string()
    .max(100, "Mailing country must not exceed 100 characters")
    .optional()
    .or(z.literal("")),

  // Additional Details
  referral: z
    .string()
    .max(255, "Referral source must not exceed 255 characters")
    .optional()
    .or(z.literal("")),
  
  status: z.enum(["Client", "Prospect", "Former", "Deceased"], {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
  
  customerType: z
    .enum(["Client", "Prospect", "Former", "Deceased"], {
      errorMap: () => ({ message: "Please select a valid customer type" }),
    })
    .optional()
    .or(z.literal("")),
});

// Add refinement to require at least one phone number for clients
export const customerValidationSchema = baseCustomerSchema.refine(
  (data) => {
    // At least one phone number must be provided
    return !!(data.homePhone && data.homePhone.trim()) || !!(data.cellPhone && data.cellPhone.trim());
  },
  {
    message: "At least one phone number (Home Phone or Cell Phone) is required",
    path: ["cellPhone"], // Show error on cellPhone field
  }
);

// Relaxed validation schema for prospects (only name required)
export const prospectValidationSchema = baseCustomerSchema.extend({
  gender: z
    .enum(["Male", "Female", "Other"], {
      errorMap: () => ({ message: "Please select a valid gender" }),
    })
    .optional()
    .or(z.literal("")),
  
  dateOfBirth: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true; // Optional field for prospects
      const selectedDate = new Date(date);
      const today = new Date();
      return selectedDate < today;
    }, "Date of birth must be before today")
    .or(z.literal("")),
  
  ssn: z
    .string()
    .max(14, "SSN must not exceed 14 characters")
    .optional()
    .or(z.literal("")),
  
  homePhone: z
    .string()
    .max(17, "Home phone must not exceed 17 characters")
    .regex(phoneRegex, "Phone number format is invalid")
    .optional()
    .or(z.literal("")),
  
  cellPhone: z
    .string()
    .max(17, "Cell phone must not exceed 17 characters")
    .regex(phoneRegex, "Phone number format is invalid")
    .optional()
    .or(z.literal("")),
  
  workPhone: z
    .string()
    .max(17, "Work phone must not exceed 17 characters")
    .regex(phoneRegex, "Phone number format is invalid")
    .optional()
    .or(z.literal("")),
});

export type CustomerFormData = z.infer<typeof customerValidationSchema>;

// Helper function to validate a single field
export const validateField = (
  field: keyof CustomerFormData, 
  value: any, 
  isProspect: boolean = false
): string | null => {
  try {
    const fieldSchema = baseCustomerSchema.shape[field];
    fieldSchema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid value";
    }
    return "Invalid value";
  }
};

// Helper function to validate all fields
export const validateForm = (
  formData: Partial<CustomerFormData>, 
  isProspect: boolean = false
): Record<string, string> => {
  try {
    const schema = isProspect ? prospectValidationSchema : customerValidationSchema;
    schema.parse(formData);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return errors;
    }
    return {};
  }
};