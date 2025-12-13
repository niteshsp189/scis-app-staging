
export interface FieldTemplate {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean";
  required: boolean;
  enabled: boolean;
  options?: string[];
  defaultValue?: string;
  category: string;
}

export const medicareFieldTemplates: FieldTemplate[] = [
  { id: "medicare_number", name: "medicareNumber", label: "Medicare #", type: "text", required: true, enabled: true, category: "Medicare" },
  { id: "pdp_serial", name: "pdpSerial", label: "PDP Serial", type: "text", required: false, enabled: true, category: "Medicare" },
  { id: "effective_date", name: "effectiveDate", label: "Effective Date", type: "date", required: true, enabled: true, category: "Medicare" },
  { id: "part_a_effective_date", name: "partAEffectiveDate", label: "Part A Effective Date", type: "date", required: false, enabled: true, category: "Medicare" },
  { id: "part_b_effective_date", name: "partBEffectiveDate", label: "Part B Effective Date", type: "date", required: false, enabled: true, category: "Medicare" },
  { id: "premium", name: "premium", label: "Premium", type: "number", required: true, enabled: true, category: "Medicare" },
  { id: "value", name: "value", label: "Value", type: "number", required: false, enabled: true, category: "Medicare" },
  { id: "deductible", name: "deductible", label: "Deductible", type: "number", required: false, enabled: true, category: "Medicare" },
  { id: "out_of_pocket", name: "outOfPocket", label: "Out Of Pocket", type: "number", required: false, enabled: true, category: "Medicare" },
  { id: "payment_mode", name: "paymentMode", label: "Payment Mode", type: "select", required: false, enabled: true, category: "Medicare", options: ["Monthly", "Quarterly", "Semi-Annual", "Annual"] },
  { id: "application_mailed_date", name: "applicationMailedDate", label: "Application Mailed Date", type: "date", required: false, enabled: true, category: "Medicare" },
  { id: "policy_mailed_date", name: "policyMailedDate", label: "Policy Mailed Date", type: "date", required: false, enabled: true, category: "Medicare" },
  { id: "credit", name: "credit", label: "Credit", type: "number", required: false, enabled: true, category: "Medicare" },
  { id: "payment", name: "payment", label: "Payment", type: "number", required: false, enabled: true, category: "Medicare" }
];

export const autoFieldTemplates: FieldTemplate[] = [
  { id: "vehicle_year", name: "vehicleYear", label: "Vehicle Year", type: "number", required: true, enabled: true, category: "Auto" },
  { id: "vehicle_make", name: "vehicleMake", label: "Vehicle Make", type: "text", required: true, enabled: true, category: "Auto" },
  { id: "vehicle_model", name: "vehicleModel", label: "Vehicle Model", type: "text", required: true, enabled: true, category: "Auto" },
  { id: "coverage_type", name: "coverageType", label: "Coverage Type", type: "select", required: true, enabled: true, category: "Auto", options: ["Liability", "Full Coverage", "Comprehensive"] },
  { id: "deductible", name: "deductible", label: "Deductible", type: "number", required: true, enabled: true, category: "Auto" },
  { id: "premium", name: "premium", label: "Premium", type: "number", required: true, enabled: true, category: "Auto" }
];

export const homeFieldTemplates: FieldTemplate[] = [
  { id: "property_address", name: "propertyAddress", label: "Property Address", type: "text", required: true, enabled: true, category: "Home" },
  { id: "property_value", name: "propertyValue", label: "Property Value", type: "number", required: true, enabled: true, category: "Home" },
  { id: "coverage_amount", name: "coverageAmount", label: "Coverage Amount", type: "number", required: true, enabled: true, category: "Home" },
  { id: "deductible", name: "deductible", label: "Deductible", type: "number", required: true, enabled: true, category: "Home" },
  { id: "premium", name: "premium", label: "Premium", type: "number", required: true, enabled: true, category: "Home" }
];

export const lifeFieldTemplates: FieldTemplate[] = [
  { id: "coverage_amount", name: "coverageAmount", label: "Coverage Amount", type: "number", required: true, enabled: true, category: "Life" },
  { id: "beneficiary", name: "beneficiary", label: "Beneficiary", type: "text", required: true, enabled: true, category: "Life" },
  { id: "policy_type", name: "policyType", label: "Policy Type", type: "select", required: true, enabled: true, category: "Life", options: ["Term", "Whole Life", "Universal Life"] },
  { id: "premium", name: "premium", label: "Premium", type: "number", required: true, enabled: true, category: "Life" }
];

export const healthFieldTemplates: FieldTemplate[] = [
  { id: "plan_type", name: "planType", label: "Plan Type", type: "select", required: true, enabled: true, category: "Health", options: ["HMO", "PPO", "EPO", "POS"] },
  { id: "premium", name: "premium", label: "Premium", type: "number", required: true, enabled: true, category: "Health" },
  { id: "deductible", name: "deductible", label: "Deductible", type: "number", required: true, enabled: true, category: "Health" },
  { id: "out_of_pocket_max", name: "outOfPocketMax", label: "Out Of Pocket Max", type: "number", required: false, enabled: true, category: "Health" },
  { id: "copay", name: "copay", label: "Copay", type: "number", required: false, enabled: true, category: "Health" }
];

export const businessFieldTemplates: FieldTemplate[] = [
  { id: "business_type", name: "businessType", label: "Business Type", type: "text", required: true, enabled: true, category: "Business" },
  { id: "employee_count", name: "employeeCount", label: "Employee Count", type: "number", required: true, enabled: true, category: "Business" },
  { id: "annual_revenue", name: "annualRevenue", label: "Annual Revenue", type: "number", required: false, enabled: true, category: "Business" },
  { id: "coverage_type", name: "coverageType", label: "Coverage Type", type: "select", required: true, enabled: true, category: "Business", options: ["General Liability", "Professional Liability", "Workers Compensation", "Property"] },
  { id: "premium", name: "premium", label: "Premium", type: "number", required: true, enabled: true, category: "Business" }
];

export const getFieldTemplatesByCategory = (category: string): FieldTemplate[] => {
  switch (category.toLowerCase()) {
    case "medicare":
      return medicareFieldTemplates;
    case "auto":
      return autoFieldTemplates;
    case "home":
      return homeFieldTemplates;
    case "life":
      return lifeFieldTemplates;
    case "health":
      return healthFieldTemplates;
    case "business":
      return businessFieldTemplates;
    default:
      return [
        { id: "premium", name: "premium", label: "Premium", type: "number", required: true, enabled: true, category: "General" },
        { id: "deductible", name: "deductible", label: "Deductible", type: "number", required: false, enabled: true, category: "General" }
      ];
  }
};

export const getAllFieldTemplates = (): FieldTemplate[] => [
  ...medicareFieldTemplates,
  ...autoFieldTemplates,
  ...homeFieldTemplates,
  ...lifeFieldTemplates,
  ...healthFieldTemplates,
  ...businessFieldTemplates
];
