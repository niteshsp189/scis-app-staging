import { z } from "zod";

// Plan Type validation schema matching backend validation rules
export const planTypeValidationSchema = z.object({
  name: z
    .string()
    .min(2, "Plan type name must be at least 2 characters")
    .max(100, "Plan type name cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z0-9\s\-\&\.]+$/,
      "Plan type name can only contain letters, numbers, spaces, hyphens, ampersands, and periods"
    ),
  
  description: z
    .string()
    .min(10, "Description must be at least 10 characters when provided")
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  
  coverage_type: z.enum(["Individual", "Family", "Group", "Corporate"], {
    required_error: "Coverage type is required",
    invalid_type_error: "Coverage type must be Individual, Family, Group, or Corporate"
  }),
  
  base_premium: z
    .string()
    .min(1, "Base premium amount is required")
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= 0.01, "Base premium must be at least $0.01")
    .refine((val) => !isNaN(val) && val <= 999999.99, "Base premium cannot exceed $999,999.99"),
  
  deductible_amount: z
    .string()
    .optional()
    .transform((val) => val === "" ? undefined : parseFloat(val || "0"))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), "Deductible amount must be 0 or greater")
    .refine((val) => val === undefined || (!isNaN(val) && val <= 999999.99), "Deductible amount cannot exceed $999,999.99"),
  
  max_coverage: z
    .string()
    .optional()
    .transform((val) => val === "" ? undefined : parseFloat(val || "0"))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 1000), "Maximum coverage must be at least $1,000")
    .refine((val) => val === undefined || (!isNaN(val) && val <= 99999999.99), "Maximum coverage cannot exceed $99,999,999.99"),
  
  waiting_period_days: z
    .string()
    .optional()
    .transform((val) => val === "" ? undefined : parseInt(val || "0"))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), "Waiting period must be 0 or greater")
    .refine((val) => val === undefined || (!isNaN(val) && val <= 365), "Waiting period cannot exceed 365 days"),
  
  policy_term_months: z
    .string()
    .min(1, "Policy term is required")
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val) && val >= 1, "Policy term must be at least 1 month")
    .refine((val) => !isNaN(val) && val <= 120, "Policy term cannot exceed 120 months (10 years)"),
  
  is_active: z.boolean().default(true),
  
  benefits: z
    .string()
    .max(2000, "Benefits description cannot exceed 2,000 characters")
    .optional()
    .or(z.literal("")),
  
  exclusions: z
    .string()
    .max(2000, "Exclusions description cannot exceed 2,000 characters")
    .optional()
    .or(z.literal("")),
  
  eligibility_criteria: z
    .string()
    .max(1000, "Eligibility criteria cannot exceed 1,000 characters")
    .optional()
    .or(z.literal("")),
  
  slug: z
    .string()
    .max(255, "Slug cannot exceed 255 characters")
    .optional(),
  
  conflicting_plan_types: z.array(z.string()).optional(),
  
  extra_fields: z.record(z.any()).optional()
});

export type PlanTypeFormData = z.infer<typeof planTypeValidationSchema>;

// Validation hints for form fields
export const planTypeValidationHints = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: "Letters, numbers, spaces, hyphens, ampersands, and periods only"
  },
  description: {
    minLength: 10,
    maxLength: 500,
    optional: true
  },
  coverage_type: {
    options: ["Individual", "Family", "Group", "Corporate"]
  },
  base_premium: {
    min: 0.01,
    max: 999999.99,
    format: "currency"
  },
  deductible_amount: {
    min: 0,
    max: 999999.99,
    format: "currency",
    optional: true
  },
  max_coverage: {
    min: 1000,
    max: 99999999.99,
    format: "currency",
    optional: true
  },
  waiting_period_days: {
    min: 0,
    max: 365,
    format: "number",
    optional: true
  },
  policy_term_months: {
    min: 1,
    max: 120,
    format: "number"
  },
  benefits: {
    maxLength: 2000,
    optional: true
  },
  exclusions: {
    maxLength: 2000,
    optional: true
  },
  eligibility_criteria: {
    maxLength: 1000,
    optional: true
  }
};