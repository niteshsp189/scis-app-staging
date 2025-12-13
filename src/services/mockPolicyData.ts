
export const mockCompanies = [
  { id: 1, name: "Anthem Blue Cross", status: "Active", plansCount: 3 },
  { id: 2, name: "UnitedHealthcare", status: "Active", plansCount: 2 },
  { id: 3, name: "Aetna", status: "Active", plansCount: 1 }
];

export const mockInsurancePlans = [
  { 
    id: 1, 
    name: "Medicare Advantage Plus", 
    companyId: 1, 
    planType: "Medicare Advantage", 
    premium: 125.50, 
    status: "Active",
    description: "Comprehensive Medicare Advantage plan with prescription coverage"
  },
  { 
    id: 2, 
    name: "PDP Standard", 
    companyId: 1, 
    planType: "Medicare PDP", 
    premium: 35.00, 
    status: "Active",
    description: "Standard prescription drug plan"
  },
  { 
    id: 3, 
    name: "Supplement Plan F", 
    companyId: 2, 
    planType: "Medicare Supplement", 
    premium: 185.75, 
    status: "Active",
    description: "Comprehensive Medicare Supplement coverage"
  }
];
