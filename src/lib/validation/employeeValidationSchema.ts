import { z } from "zod";

// Employee validation schema matching backend validation rules
export const employeeValidationSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(100, "First name cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z\s\-\.\']+$/,
      "First name can only contain letters, spaces, hyphens, periods, and apostrophes"
    ),
  
  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(100, "Last name cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z\s\-\.\']+$/,
      "Last name can only contain letters, spaces, hyphens, periods, and apostrophes"
    ),
  
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please provide a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
  
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password cannot exceed 255 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  
  password_confirmation: z
    .string()
    .min(8, "Password confirmation is required"),
  
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number cannot exceed 20 characters")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number")
    .optional()
    .or(z.literal("")),
  
  position: z
    .string()
    .min(2, "Position must be at least 2 characters when provided")
    .max(100, "Position cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-\.\,]+$/, "Position contains invalid characters")
    .optional()
    .or(z.literal("")),
  
  company: z
    .string()
    .min(2, "Company name must be at least 2 characters when provided")
    .max(255, "Company name cannot exceed 255 characters")
    .regex(/^[a-zA-Z0-9\s\-\&\.\,\(\)]+$/, "Company name contains invalid characters")
    .optional()
    .or(z.literal("")),
  
  location: z
    .string()
    .min(2, "Location must be at least 2 characters when provided")
    .max(255, "Location cannot exceed 255 characters")
    .regex(/^[a-zA-Z0-9\s\-\.\,]+$/, "Location contains invalid characters")
    .optional()
    .or(z.literal("")),
  
  date_of_birth: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), "Please provide a valid date of birth")
    .refine((val) => val === "" || new Date(val) < new Date(), "Date of birth must be before today")
    .refine((val) => val === "" || new Date(val) > new Date("1900-01-01"), "Date of birth must be after 1900")
    .optional()
    .or(z.literal("")),
  
  employee_id: z
    .string()
    .min(3, "Employee ID must be at least 3 characters when provided")
    .max(20, "Employee ID cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9\-]+$/, "Employee ID can only contain letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  
  department: z.enum([
    "Sales", "Marketing", "Customer Service", "Claims", "Underwriting", 
    "Finance", "IT", "HR", "Administration", "Management"
  ], {
    invalid_type_error: "Please select a valid department"
  }).optional().or(z.literal("")),
  
  hire_date: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), "Please provide a valid hire date")
    .refine((val) => val === "" || new Date(val) <= new Date(), "Hire date cannot be in the future")
    .refine((val) => val === "" || new Date(val) > new Date("1900-01-01"), "Hire date must be after 1900")
    .optional()
    .or(z.literal("")),
  
  salary: z
    .string()
    .optional()
    .transform((val) => val === "" ? undefined : parseFloat(val || "0"))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), "Salary must be 0 or greater")
    .refine((val) => val === undefined || (!isNaN(val) && val <= 9999999.99), "Salary cannot exceed $9,999,999.99"),
  
  commission_rate: z
    .string()
    .optional()
    .transform((val) => val === "" ? undefined : parseFloat(val || "0"))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), "Commission rate must be 0 or greater")
    .refine((val) => val === undefined || (!isNaN(val) && val <= 100), "Commission rate cannot exceed 100%"),
  
  manager_id: z
    .string()
    .uuid("Please select a valid manager")
    .optional()
    .or(z.literal("")),
  
  emergency_contact_name: z
    .string()
    .min(2, "Emergency contact name must be at least 2 characters when provided")
    .max(100, "Emergency contact name cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z\s\-\.\']+$/,
      "Emergency contact name can only contain letters, spaces, hyphens, periods, and apostrophes"
    )
    .optional()
    .or(z.literal("")),
  
  emergency_contact_phone: z
    .string()
    .min(10, "Emergency contact phone must be at least 10 digits when provided")
    .max(20, "Emergency contact phone cannot exceed 20 characters")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid emergency contact phone number")
    .optional()
    .or(z.literal("")),
  
  emergency_contact_relationship: z.enum([
    "Spouse", "Parent", "Child", "Sibling", "Friend", "Other"
  ], {
    invalid_type_error: "Please select a valid relationship"
  }).optional().or(z.literal(""))
}).refine((data) => data.password === data.password_confirmation, {
  message: "Password confirmation does not match",
  path: ["password_confirmation"],
});

export type EmployeeFormData = z.infer<typeof employeeValidationSchema>;

// Validation hints for form fields
export const employeeValidationHints = {
  first_name: {
    minLength: 2,
    maxLength: 100,
    pattern: "Letters, spaces, hyphens, periods, and apostrophes only"
  },
  last_name: {
    minLength: 2,
    maxLength: 100,
    pattern: "Letters, spaces, hyphens, periods, and apostrophes only"
  },
  email: {
    maxLength: 255,
    format: "email"
  },
  password: {
    minLength: 8,
    maxLength: 255,
    pattern: "Must contain uppercase, lowercase, number, and special character"
  },
  phone: {
    minLength: 10,
    maxLength: 20,
    pattern: "Valid phone number format",
    optional: true
  },
  position: {
    minLength: 2,
    maxLength: 100,
    pattern: "Letters, numbers, spaces, and basic punctuation",
    optional: true
  },
  company: {
    minLength: 2,
    maxLength: 255,
    pattern: "Letters, numbers, spaces, and basic punctuation",
    optional: true
  },
  location: {
    minLength: 2,
    maxLength: 255,
    pattern: "Letters, numbers, spaces, and basic punctuation",
    optional: true
  },
  date_of_birth: {
    format: "date",
    validation: "Must be before today and after 1900",
    optional: true
  },
  employee_id: {
    minLength: 3,
    maxLength: 20,
    pattern: "Letters, numbers, and hyphens only",
    optional: true
  },
  department: {
    options: ["Sales", "Marketing", "Customer Service", "Claims", "Underwriting", "Finance", "IT", "HR", "Administration", "Management"],
    optional: true
  },
  hire_date: {
    format: "date",
    validation: "Cannot be in the future",
    optional: true
  },
  salary: {
    min: 0,
    max: 9999999.99,
    format: "currency",
    optional: true
  },
  commission_rate: {
    min: 0,
    max: 100,
    format: "percentage",
    optional: true
  },
  emergency_contact_name: {
    minLength: 2,
    maxLength: 100,
    pattern: "Letters, spaces, hyphens, periods, and apostrophes only",
    optional: true
  },
  emergency_contact_phone: {
    minLength: 10,
    maxLength: 20,
    pattern: "Valid phone number format",
    optional: true
  },
  emergency_contact_relationship: {
    options: ["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"],
    optional: true
  }
};