import { Plan, PlanType } from "@/types/planType";

// Unified Insurance Product interface
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
  fieldValues: Record<string, any>;
  eligibilityRules?: EligibilityRule[];
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
  defaultValue?: string;
}

export interface EligibilityRule {
  id: string;
  field: string;
  operator: "equals" | "greater_than" | "less_than" | "contains";
  value: string;
  description: string;
}

export interface Company {
  id: number;
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
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

// Mock data for companies
export const mockCompanies: Company[] = [
  {
    id: 1,
    name: "Anthem Blue Cross",
    industry: "Health Insurance",
    website: "www.anthem.com",
    phone: "(800) 123-4567",
    email: "contact@anthem.com",
    address: "120 Monument Circle",
    city: "Indianapolis",
    state: "IN",
    zipCode: "46204",
    employeeCount: 70000,
    annualRevenue: "$104.2B",
    status: "Active",
    contactPerson: "Sarah Johnson",
    notes: "Primary health insurance provider",
    productsCount: 12,
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    name: "UnitedHealthcare",
    industry: "Health Insurance",
    website: "www.uhc.com",
    phone: "(800) 987-6543",
    email: "info@uhc.com",
    address: "9900 Bren Road East",
    city: "Minnetonka",
    state: "MN",
    zipCode: "55343",
    employeeCount: 350000,
    annualRevenue: "$324.2B",
    status: "Active",
    contactPerson: "Michael Chen",
    notes: "Largest health insurance provider",
    productsCount: 8,
    createdAt: "2024-01-20"
  },
  {
    id: 3,
    name: "Aetna",
    industry: "Health Insurance",
    website: "www.aetna.com",
    phone: "(800) 555-0123",
    email: "support@aetna.com",
    address: "151 Farmington Avenue",
    city: "Hartford",
    state: "CT",
    zipCode: "06156",
    employeeCount: 50000,
    annualRevenue: "$74.8B",
    status: "Active",
    contactPerson: "Lisa Rodriguez",
    notes: "CVS Health subsidiary",
    productsCount: 6,
    createdAt: "2024-02-01"
  }
];

// Mock data for insurance products with complete Medicare fields
export const mockInsuranceProducts: InsuranceProduct[] = [
  {
    id: 1,
    name: "Medicare Advantage Plus",
    description: "Comprehensive Medicare Advantage plan with prescription coverage and wellness benefits",
    companyId: 1,
    companyName: "Anthem Blue Cross",
    category: "Medicare",
    status: "Active",
    planTypeId: 1,
    planTypeName: "Advantage Plus",
    monthlyPremium: 125.50,
    fields: [
      { id: "medicare_number", name: "medicareNumber", label: "Medicare #", type: "text", required: true },
      { id: "pdp_serial", name: "pdpSerial", label: "PDP Serial", type: "text", required: false },
      { id: "effective_date", name: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "part_a_effective_date", name: "partAEffectiveDate", label: "Part A Effective Date", type: "date", required: false },
      { id: "part_b_effective_date", name: "partBEffectiveDate", label: "Part B Effective Date", type: "date", required: false },
      { id: "premium", name: "premium", label: "Premium", type: "number", required: true },
      { id: "value", name: "value", label: "Value", type: "number", required: false },
      { id: "deductible", name: "deductible", label: "Deductible", type: "number", required: false },
      { id: "out_of_pocket", name: "outOfPocket", label: "Out Of Pocket", type: "number", required: false },
      { id: "payment_mode", name: "paymentMode", label: "Payment Mode", type: "select", required: false, options: ["Monthly", "Quarterly", "Semi-Annual", "Annual"] },
      { id: "application_mailed_date", name: "applicationMailedDate", label: "Application Mailed Date", type: "date", required: false },
      { id: "policy_mailed_date", name: "policyMailedDate", label: "Policy Mailed Date", type: "date", required: false },
      { id: "credit", name: "credit", label: "Credit", type: "number", required: false },
      { id: "payment", name: "payment", label: "Payment", type: "number", required: false }
    ],
    fieldConfig: {
      medicare_number: { enabled: true, required: true },
      pdp_serial: { enabled: true, required: false },
      effective_date: { enabled: true, required: true },
      part_a_effective_date: { enabled: true, required: false },
      part_b_effective_date: { enabled: true, required: false },
      premium: { enabled: true, required: true },
      value: { enabled: true, required: false },
      deductible: { enabled: true, required: false },
      out_of_pocket: { enabled: true, required: false },
      payment_mode: { enabled: true, required: false },
      application_mailed_date: { enabled: true, required: false },
      policy_mailed_date: { enabled: true, required: false },
      credit: { enabled: true, required: false },
      payment: { enabled: true, required: false }
    },
    fieldValues: {
      premium: 125.50,
      value: 2000.00,
      deductible: 500,
      outOfPocket: 3500,
      paymentMode: "Monthly",
      effectiveDate: "2024-01-01",
      partAEffectiveDate: "2024-01-01",
      partBEffectiveDate: "2024-01-01",
      applicationMailedDate: "2023-12-15",
      policyMailedDate: "2023-12-22",
      credit: 0.00,
      payment: 125.50
    },
    eligibilityRules: [
      { id: "age_rule", field: "age", operator: "greater_than", value: "65", description: "Must be 65 or older" }
    ],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15"
  },
  {
    id: 2,
    name: "PDP Standard Coverage",
    description: "Standard prescription drug plan with nationwide pharmacy network",
    companyId: 1,
    companyName: "Anthem Blue Cross",
    category: "Medicare",
    status: "Active",
    planTypeId: 2,
    planTypeName: "Standard Coverage",
    monthlyPremium: 35.00,
    fields: [
      { id: "medicare_number", name: "medicareNumber", label: "Medicare #", type: "text", required: true },
      { id: "pdp_serial", name: "pdpSerial", label: "PDP Serial", type: "text", required: true },
      { id: "effective_date", name: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "part_a_effective_date", name: "partAEffectiveDate", label: "Part A Effective Date", type: "date", required: false },
      { id: "part_b_effective_date", name: "partBEffectiveDate", label: "Part B Effective Date", type: "date", required: false },
      { id: "premium", name: "premium", label: "Premium", type: "number", required: true },
      { id: "value", name: "value", label: "Value", type: "number", required: false },
      { id: "deductible", name: "deductible", label: "Deductible", type: "number", required: false },
      { id: "out_of_pocket", name: "outOfPocket", label: "Out Of Pocket", type: "number", required: false },
      { id: "payment_mode", name: "paymentMode", label: "Payment Mode", type: "select", required: false, options: ["Monthly", "Quarterly", "Semi-Annual", "Annual"] },
      { id: "application_mailed_date", name: "applicationMailedDate", label: "Application Mailed Date", type: "date", required: false },
      { id: "policy_mailed_date", name: "policyMailedDate", label: "Policy Mailed Date", type: "date", required: false },
      { id: "credit", name: "credit", label: "Credit", type: "number", required: false },
      { id: "payment", name: "payment", label: "Payment", type: "number", required: false }
    ],
    fieldConfig: {
      medicare_number: { enabled: true, required: true },
      pdp_serial: { enabled: true, required: true },
      effective_date: { enabled: true, required: true },
      part_a_effective_date: { enabled: true, required: false },
      part_b_effective_date: { enabled: true, required: false },
      premium: { enabled: true, required: true },
      value: { enabled: true, required: false },
      deductible: { enabled: true, required: false },
      out_of_pocket: { enabled: true, required: false },
      payment_mode: { enabled: true, required: false },
      application_mailed_date: { enabled: true, required: false },
      policy_mailed_date: { enabled: true, required: false },
      credit: { enabled: true, required: false },
      payment: { enabled: true, required: false }
    },
    fieldValues: {
      premium: 35.00,
      value: 500.00,
      deductible: 250,
      effectiveDate: "2024-01-01",
      paymentMode: "Monthly",
      applicationMailedDate: "2024-01-10",
      policyMailedDate: "2024-01-18",
      credit: 0.00,
      payment: 35.00
    },
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01"
  },
  {
    id: 3,
    name: "Auto Insurance Comprehensive",
    description: "Full coverage auto insurance with collision and comprehensive",
    companyId: 2,
    companyName: "UnitedHealthcare",
    category: "Auto",
    status: "Active",
    fields: [
      { id: "vehicle_year", name: "vehicleYear", label: "Vehicle Year", type: "number", required: true },
      { id: "vehicle_make", name: "vehicleMake", label: "Vehicle Make", type: "text", required: true },
      { id: "vehicle_model", name: "vehicleModel", label: "Vehicle Model", type: "text", required: true },
      { id: "coverage_type", name: "coverageType", label: "Coverage Type", type: "select", required: true, options: ["Liability", "Full Coverage", "Comprehensive"] },
      { id: "deductible", name: "deductible", label: "Deductible", type: "number", required: true },
      { id: "premium", name: "premium", label: "Premium", type: "number", required: true }
    ],
    fieldValues: {
      coverageType: "Full Coverage",
      deductible: 1000,
      premium: 850.00
    },
    createdAt: "2024-02-05",
    updatedAt: "2024-02-05"
  }
];

// Service functions
export const getActiveCompanies = () => mockCompanies.filter(c => c.status === "Active");
export const getCompanyById = (id: number) => mockCompanies.find(c => c.id === id);
export const getProductsByCompany = (companyId: number) => mockInsuranceProducts.filter(p => p.companyId === companyId);
export const getActiveProducts = () => mockInsuranceProducts.filter(p => p.status === "Active");
export const getProductById = (id: number) => mockInsuranceProducts.find(p => p.id === id);

export const getProductCategories = () => [
  "Medicare",
  "Auto",
  "Home", 
  "Life",
  "Health",
  "Business"
];
