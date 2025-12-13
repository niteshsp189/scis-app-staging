import { z } from "zod";

// Prospect (Lead) validation schema matching backend validation rules
export const prospectValidationSchema = z.object({
  name: z
    .string()
    .min(2, "Lead name must be at least 2 characters")
    .max(255, "Lead name cannot exceed 255 characters")
    .regex(
      /^[a-zA-Z\s\-\.\']+$/,
      "Prospect name can only contain letters, spaces, hyphens, periods, and apostrophes"
    ),
  
  email: z
    .string()
    .email("Please provide a valid email address")
    .max(255, "Email cannot exceed 255 characters")
    .optional()
    .or(z.literal("")),
  
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number cannot exceed 20 characters")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number")
    .optional()
    .or(z.literal("")),
  
  company: z
    .string()
    .min(2, "Company name must be at least 2 characters when provided")
    .max(255, "Company name cannot exceed 255 characters")
    .regex(/^[a-zA-Z0-9\s\-\&\.\,\(\)]+$/, "Company name contains invalid characters")
    .optional()
    .or(z.literal("")),
  
  source: z.enum([
    "Website", "Referral", "Social Media", "Advertisement", "Cold Call", 
    "Email Campaign", "Trade Show", "Direct Mail", "Other"
  ], {
    invalid_type_error: "Please select a valid source"
  }).optional().or(z.literal("")),
  
  status: z.enum([
    "New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost", "Nurturing"
  ], {
    invalid_type_error: "Please select a valid status"
  }).optional().or(z.literal("")),
  
  value: z
    .string()
    .optional()
    .transform((val) => val === "" ? undefined : parseFloat(val || "0"))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), "Value must be 0 or greater")
    .refine((val) => val === undefined || (!isNaN(val) && val <= 999999999.99), "Value cannot exceed $999,999,999.99"),
  
  score: z
    .string()
    .optional()
    .transform((val) => val === "" ? undefined : parseInt(val || "0"))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), "Score must be 0 or greater")
    .refine((val) => val === undefined || (!isNaN(val) && val <= 100), "Score cannot exceed 100"),
  
  assigned_agent_id: z
    .string()
    .uuid("Please select a valid agent")
    .optional()
    .or(z.literal("")),
  
  policy_type: z.enum([
    "Health", "Life", "Auto", "Property", "Casualty", "Disability", "Travel", "Pet", "Business"
  ], {
    invalid_type_error: "Please select a valid policy type"
  }).optional().or(z.literal("")),
  
  location: z
    .string()
    .min(2, "Location must be at least 2 characters when provided")
    .max(255, "Location cannot exceed 255 characters")
    .regex(/^[a-zA-Z0-9\s\-\.\,]+$/, "Location contains invalid characters")
    .optional()
    .or(z.literal("")),
  
  notes: z
    .string()
    .max(2000, "Notes cannot exceed 2,000 characters")
    .optional()
    .or(z.literal("")),
  
  budget_range: z.enum([
    "Under $500", "$500-$1000", "$1000-$5000", "$5000-$10000", "Over $10000"
  ], {
    invalid_type_error: "Please select a valid budget range"
  }).optional().or(z.literal("")),
  
  timeline: z.enum([
    "Immediate", "Within 1 month", "Within 3 months", "Within 6 months", "Over 6 months"
  ], {
    invalid_type_error: "Please select a valid timeline"
  }).optional().or(z.literal("")),
  
  preferred_contact_method: z.enum([
    "Email", "Phone", "Text", "In-person"
  ], {
    invalid_type_error: "Please select a valid contact method"
  }).optional().or(z.literal("")),
  
  age_range: z.enum([
    "18-25", "26-35", "36-45", "46-55", "56-65", "Over 65"
  ], {
    invalid_type_error: "Please select a valid age range"
  }).optional().or(z.literal("")),
  
  marital_status: z.enum([
    "Single", "Married", "Divorced", "Widowed"
  ], {
    invalid_type_error: "Please select a valid marital status"
  }).optional().or(z.literal("")),
  
  household_income: z.enum([
    "Under $25K", "$25K-$50K", "$50K-$75K", "$75K-$100K", "$100K-$150K", "Over $150K"
  ], {
    invalid_type_error: "Please select a valid household income range"
  }).optional().or(z.literal("")),
  
  follow_up_date: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), "Please provide a valid follow-up date")
    .refine((val) => val === "" || new Date(val) >= new Date(), "Follow-up date cannot be in the past")
    .optional()
    .or(z.literal("")),
  
  referral_source: z
    .string()
    .min(2, "Referral source must be at least 2 characters when provided")
    .max(255, "Referral source cannot exceed 255 characters")
    .optional()
    .or(z.literal(""))
});

export type ProspectFormData = z.infer<typeof prospectValidationSchema>;

// Validation hints for form fields
export const prospectValidationHints = {
  name: {
    minLength: 2,
    maxLength: 255,
    pattern: "Letters, spaces, hyphens, periods, and apostrophes only"
  },
  email: {
    maxLength: 255,
    format: "email",
    optional: true
  },
  phone: {
    minLength: 10,
    maxLength: 20,
    pattern: "Valid phone number format",
    optional: true
  },
  company: {
    minLength: 2,
    maxLength: 255,
    pattern: "Letters, numbers, spaces, and basic punctuation",
    optional: true
  },
  source: {
    options: ["Website", "Referral", "Social Media", "Advertisement", "Cold Call", "Email Campaign", "Trade Show", "Direct Mail", "Other"],
    optional: true
  },
  status: {
    options: ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost", "Nurturing"],
    optional: true
  },
  value: {
    min: 0,
    max: 999999999.99,
    format: "currency",
    optional: true
  },
  score: {
    min: 0,
    max: 100,
    format: "number",
    optional: true
  },
  policy_type: {
    options: ["Health", "Life", "Auto", "Property", "Casualty", "Disability", "Travel", "Pet", "Business"],
    optional: true
  },
  location: {
    minLength: 2,
    maxLength: 255,
    pattern: "Letters, numbers, spaces, and basic punctuation",
    optional: true
  },
  notes: {
    maxLength: 2000,
    optional: true
  },
  budget_range: {
    options: ["Under $500", "$500-$1000", "$1000-$5000", "$5000-$10000", "Over $10000"],
    optional: true
  },
  timeline: {
    options: ["Immediate", "Within 1 month", "Within 3 months", "Within 6 months", "Over 6 months"],
    optional: true
  },
  preferred_contact_method: {
    options: ["Email", "Phone", "Text", "In-person"],
    optional: true
  },
  age_range: {
    options: ["18-25", "26-35", "36-45", "46-55", "56-65", "Over 65"],
    optional: true
  },
  marital_status: {
    options: ["Single", "Married", "Divorced", "Widowed"],
    optional: true
  },
  household_income: {
    options: ["Under $25K", "$25K-$50K", "$50K-$75K", "$75K-$100K", "$100K-$150K", "Over $150K"],
    optional: true
  },
  follow_up_date: {
    format: "date",
    validation: "Cannot be in the past",
    optional: true
  },
  referral_source: {
    minLength: 2,
    maxLength: 255,
    optional: true
  }
};