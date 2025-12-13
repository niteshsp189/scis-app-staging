export interface Company {
  id: number;
  name: string;
  industry: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  city: string;
  state: string;
  zipCode: string;
  employeeCount: number;
  annualRevenue: string;
  status: "Active" | "Inactive" | "Prospect";
  contactPerson: string;
  notes: string;
  productsCount: number;
  createdAt: string;
}

export interface PlanTypeField {
  id: number;
  name: string;
  type: string;
  required: boolean;
  enabled: boolean;
  options?: string;
}

export interface PlanType {
  id: number;
  name: string;
  code: string;
  description: string;
  category: string;
  status: "Active" | "Inactive";
  is_active: boolean;
  display_order: number;
  grace_period_days: number;
  color: string;
  icon?: string;
  features?: string[];
  restrictions?: string[];
  requirements?: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  fields?: PlanTypeField[];
  // Computed properties
  total_plans?: number;
  total_active_plans?: number;
  total_fields?: number;
  total_required_fields?: number;
}

export interface InsuranceProduct {
  id: number;
  name: string;
  description: string;
  companyId: number;
  companyName: string;
  category: string;
  status: "Active" | "Inactive" | "Draft";
  planTypeId: number;
  planTypeName?: string;
  monthlyPremium: number;
  fields: ProductField[];
  fieldConfig: {
    [fieldId: string]: {
      enabled: boolean;
      required: boolean;
      defaultValue?: any;
    };
  };
  fieldValues: {
    [fieldId: string]: any;
  };
  eligibilityRules?: EligibilityRule[];
  termLength?: number;
  termUnit?: "days" | "months" | "years";
  paymentFrequencies?: {
    frequency: "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";
    amount: number;
    discount?: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean";
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface EligibilityRule {
  id: string;
  field: string;
  operator: "equals" | "greater_than" | "less_than" | "contains";
  value: string;
  description: string;
}

export interface PlanConflictRule {
  id: string;
  plan_type_id: number;
  conflicting_plan_type_id: number;
  rule_type: 'blocking' | 'warning';
  rule_description: string;
  severity: 'low' | 'medium' | 'high';
  is_active: boolean;
  conditions?: any;
  exceptions?: any;
  metadata?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relationship data
  plan_type?: PlanType;
  conflicting_plan_type?: PlanType;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}
