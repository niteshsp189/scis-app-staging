import { z } from "zod";

// Insurance Company validation schema matching backend validation rules
export const insuranceCompanyValidationSchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(255, "Company name cannot exceed 255 characters")
    .regex(
      /^[a-zA-Z0-9\s\-\&\.\,\(\)]+$/,
      "Company name can only contain letters, numbers, spaces, and basic punctuation"
    ),
  
  industry: z.enum([
    "Health", "Life", "Auto", "Property", "Casualty", 
    "Disability", "Travel", "Pet", "Business", "Other"
  ], {
    required_error: "Industry is required",
    invalid_type_error: "Please select a valid industry"
  }),
  
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please provide a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
  
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number cannot exceed 20 characters")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number"),
  
  website: z
    .string()
    .url("Please provide a valid website URL")
    .max(255, "Website URL cannot exceed 255 characters")
    .regex(
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      "Website URL format is invalid"
    )
    .optional()
    .or(z.literal("")),
  
  fax: z
    .string()
    .min(10, "Fax number must be at least 10 digits when provided")
    .max(20, "Fax number cannot exceed 20 characters")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid fax number")
    .optional()
    .or(z.literal("")),
  
  tax_id: z
    .string()
    .min(9, "Tax ID must be at least 9 characters when provided")
    .max(15, "Tax ID cannot exceed 15 characters")
    .regex(/^[0-9\-]+$/, "Tax ID can only contain numbers and hyphens")
    .optional()
    .or(z.literal("")),
  
  license_number: z
    .string()
    .min(5, "License number must be at least 5 characters when provided")
    .max(50, "License number cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\-]+$/, "License number can only contain letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  
  rating: z
    .string()
    .optional()
    .transform((val) => val === "" ? undefined : parseFloat(val || "0"))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), "Rating must be 0 or greater")
    .refine((val) => val === undefined || (!isNaN(val) && val <= 5), "Rating cannot exceed 5.0"),
  
  commission_rate: z
    .string()
    .optional()
    .transform((val) => val === "" ? undefined : parseFloat(val || "0"))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), "Commission rate must be 0 or greater")
    .refine((val) => val === undefined || (!isNaN(val) && val <= 100), "Commission rate cannot exceed 100%"),
  
  payment_terms: z
    .string()
    .min(5, "Payment terms must be at least 5 characters when provided")
    .max(500, "Payment terms cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  
  notes: z
    .string()
    .max(2000, "Notes cannot exceed 2,000 characters")
    .optional()
    .or(z.literal("")),
  
  logo_url: z
    .string()
    .url("Please provide a valid logo URL")
    .max(500, "Logo URL cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  
  status: z.enum(["Active", "Inactive", "Pending", "Suspended"], {
    required_error: "Status is required",
    invalid_type_error: "Please select a valid status"
  }),
  
  street_address: z
    .string()
    .min(5, "Street address must be at least 5 characters")
    .max(255, "Street address cannot exceed 255 characters")
    .regex(/^[a-zA-Z0-9\s\-\#\.\,]+$/, "Street address contains invalid characters"),
  
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s\-\.]+$/, "City can only contain letters, spaces, hyphens, and periods"),
  
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(50, "State cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s\-\.]+$/, "State can only contain letters, spaces, hyphens, and periods"),
  
  zip_code: z
    .string()
    .regex(/^[0-9]{5}(-[0-9]{4})?$/, "ZIP code must be in format 12345 or 12345-6789"),
  
  country: z
    .string()
    .min(2, "Country must be at least 2 characters when provided")
    .max(100, "Country cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s\-\.]+$/, "Country can only contain letters, spaces, hyphens, and periods")
    .optional()
    .or(z.literal("")),
  
  contract_terms: z.array(z.string().max(500, "Each contract term cannot exceed 500 characters")).optional()
});

export type InsuranceCompanyFormData = z.infer<typeof insuranceCompanyValidationSchema>;

// Validation hints for form fields
export const insuranceCompanyValidationHints = {
  name: {
    minLength: 2,
    maxLength: 255,
    pattern: "Letters, numbers, spaces, and basic punctuation only"
  },
  industry: {
    options: ["Health", "Life", "Auto", "Property", "Casualty", "Disability", "Travel", "Pet", "Business", "Other"]
  },
  email: {
    maxLength: 255,
    format: "email"
  },
  phone: {
    minLength: 10,
    maxLength: 20,
    pattern: "Valid phone number format"
  },
  website: {
    maxLength: 255,
    format: "url",
    optional: true
  },
  fax: {
    minLength: 10,
    maxLength: 20,
    pattern: "Valid fax number format",
    optional: true
  },
  tax_id: {
    minLength: 9,
    maxLength: 15,
    pattern: "Numbers and hyphens only",
    optional: true
  },
  license_number: {
    minLength: 5,
    maxLength: 50,
    pattern: "Letters, numbers, and hyphens only",
    optional: true
  },
  rating: {
    min: 0,
    max: 5,
    format: "decimal",
    optional: true
  },
  commission_rate: {
    min: 0,
    max: 100,
    format: "percentage",
    optional: true
  },
  payment_terms: {
    minLength: 5,
    maxLength: 500,
    optional: true
  },
  notes: {
    maxLength: 2000,
    optional: true
  },
  logo_url: {
    maxLength: 500,
    format: "url",
    optional: true
  },
  status: {
    options: ["Active", "Inactive", "Pending", "Suspended"]
  },
  street_address: {
    minLength: 5,
    maxLength: 255,
    pattern: "Letters, numbers, spaces, and address punctuation"
  },
  city: {
    minLength: 2,
    maxLength: 100,
    pattern: "Letters, spaces, hyphens, and periods only"
  },
  state: {
    minLength: 2,
    maxLength: 50,
    pattern: "Letters, spaces, hyphens, and periods only"
  },
  zip_code: {
    pattern: "12345 or 12345-6789 format"
  },
  country: {
    minLength: 2,
    maxLength: 100,
    pattern: "Letters, spaces, hyphens, and periods only",
    optional: true
  }
};