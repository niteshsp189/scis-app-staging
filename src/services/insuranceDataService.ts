
import { Plan, PlanType } from "@/types/planType";

interface Company {
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
  clientsCount: number;
  totalPolicies: number;
  plansCount: number;
  createdAt: string;
}

// Mock data - in a real app, this would come from an API
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
    clientsCount: 45,
    totalPolicies: 89,
    plansCount: 12,
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
    clientsCount: 67,
    totalPolicies: 134,
    plansCount: 8,
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
    clientsCount: 23,
    totalPolicies: 45,
    plansCount: 6,
    createdAt: "2024-02-01"
  }
];

export const mockPlanTypes: PlanType[] = [
  {
    id: 1,
    name: "Medicare Advantage",
    description: "Comprehensive Medicare Advantage plan configuration",
    category: "Medicare",
    status: "Active",
    fields: [
      { id: "medicare_number", name: "medicareNumber", label: "Medicare #", type: "text", included: true, required: true },
      { id: "premium", name: "premium", label: "Premium", type: "number", included: true, required: true },
      { id: "deductible", name: "deductible", label: "Deductible", type: "number", included: true, required: false },
      { id: "out_of_pocket", name: "outOfPocket", label: "Out Of Pocket", type: "number", included: true, required: false },
      { id: "payment_mode", name: "paymentMode", label: "Payment Mode", type: "select", included: true, required: false, options: ["Monthly", "Quarterly", "Annually"] }
    ],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15"
  },
  {
    id: 2,
    name: "Medicare PDP",
    description: "Prescription Drug Plan configuration",
    category: "Medicare",
    status: "Active",
    fields: [
      { id: "medicare_number", name: "medicareNumber", label: "Medicare #", type: "text", included: true, required: true },
      { id: "pdp_serial", name: "pdpSerial", label: "PDP Serial", type: "text", included: true, required: true },
      { id: "premium", name: "premium", label: "Premium", type: "number", included: true, required: true },
      { id: "deductible", name: "deductible", label: "Deductible", type: "number", included: true, required: false }
    ],
    conflictRules: [1],
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20"
  }
];

export const mockPlans: Plan[] = [
  {
    id: 1,
    name: "Medicare Advantage Plus",
    description: "Comprehensive Medicare Advantage plan with prescription coverage and wellness benefits",
    companyId: 1,
    companyName: "Anthem Blue Cross",
    planTypeId: 1,
    planTypeName: "Medicare Advantage",
    status: "Active",
    fieldValues: {
      premium: 125.50,
      deductible: 500,
      outOfPocket: 3500,
      paymentMode: "Monthly"
    },
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15"
  },
  {
    id: 2,
    name: "PDP Standard Coverage",
    description: "Standard prescription drug plan with nationwide pharmacy network",
    companyId: 1,
    companyName: "Anthem Blue Cross",
    planTypeId: 2,
    planTypeName: "Medicare PDP",
    status: "Active",
    fieldValues: {
      premium: 35.00,
      deductible: 250
    },
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01"
  }
];

// Service functions
export const getActiveCompanies = () => mockCompanies.filter(c => c.status === "Active");
export const getActivePlanTypes = () => mockPlanTypes.filter(pt => pt.status === "Active");
export const getCompanyById = (id: number) => mockCompanies.find(c => c.id === id);
export const getPlanTypeById = (id: number) => mockPlanTypes.find(pt => pt.id === id);
export const getPlansByCompany = (companyId: number) => mockPlans.filter(p => p.companyId === companyId);

export type { Company };
