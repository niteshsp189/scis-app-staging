
import { CustomerData } from "@/types/customer";

export interface PolicyRestriction {
  policyType: string;
  restrictions: {
    minAge?: number;
    maxAge?: number;
    requiredEmployment?: boolean;
    excludedConditions?: string[];
    incomeRequirement?: {
      min?: number;
      max?: number;
    };
    stateRestrictions?: string[];
    requiresLicense?: boolean;
    healthUnderwriting?: boolean;
  };
  category: "age" | "health" | "employment" | "income" | "state" | "licensing";
}

export const POLICY_RESTRICTIONS: PolicyRestriction[] = [
  {
    policyType: "Medicare Supplement",
    category: "age",
    restrictions: {
      minAge: 65,
      healthUnderwriting: true
    }
  },
  {
    policyType: "Term Life Insurance", 
    category: "age",
    restrictions: {
      minAge: 18,
      maxAge: 75,
      healthUnderwriting: true
    }
  },
  {
    policyType: "Long-Term Care Insurance",
    category: "age", 
    restrictions: {
      maxAge: 84,
      healthUnderwriting: true
    }
  },
  {
    policyType: "Workers' Compensation",
    category: "employment",
    restrictions: {
      requiredEmployment: true
    }
  },
  {
    policyType: "Group Life Insurance",
    category: "employment",
    restrictions: {
      requiredEmployment: true
    }
  },
  {
    policyType: "Professional Liability",
    category: "licensing",
    restrictions: {
      requiresLicense: true
    }
  },
  {
    policyType: "Medicaid",
    category: "income",
    restrictions: {
      incomeRequirement: {
        max: 30000 // Simplified threshold
      }
    }
  },
  {
    policyType: "High-Value Life Insurance",
    category: "income",
    restrictions: {
      incomeRequirement: {
        min: 100000
      }
    }
  }
];

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  warnings: string[];
}

export const checkPolicyEligibility = (
  policyType: string, 
  customer: CustomerData,
  customerAge?: number,
  income?: number,
  employment?: string,
  state?: string
): EligibilityResult => {
  const restriction = POLICY_RESTRICTIONS.find(r => r.policyType === policyType);
  
  if (!restriction) {
    return { eligible: true, reasons: [], warnings: [] };
  }

  const result: EligibilityResult = {
    eligible: true,
    reasons: [],
    warnings: []
  };

  const { restrictions } = restriction;
  const age = customerAge || calculateAge(customer.joinDate);

  // Age restrictions
  if (restrictions.minAge && age < restrictions.minAge) {
    result.eligible = false;
    result.reasons.push(`Minimum age requirement: ${restrictions.minAge} years`);
  }

  if (restrictions.maxAge && age > restrictions.maxAge) {
    result.eligible = false;
    result.reasons.push(`Maximum age limit: ${restrictions.maxAge} years`);
  }

  // Employment restrictions
  if (restrictions.requiredEmployment && (!employment || employment === "Unemployed")) {
    result.eligible = false;
    result.reasons.push("Active employment required");
  }

  // Income restrictions
  if (restrictions.incomeRequirement && income) {
    if (restrictions.incomeRequirement.min && income < restrictions.incomeRequirement.min) {
      result.eligible = false;
      result.reasons.push(`Minimum income requirement: $${restrictions.incomeRequirement.min.toLocaleString()}`);
    }
    if (restrictions.incomeRequirement.max && income > restrictions.incomeRequirement.max) {
      result.eligible = false;
      result.reasons.push(`Income must be below $${restrictions.incomeRequirement.max.toLocaleString()}`);
    }
  }

  // Licensing restrictions
  if (restrictions.requiresLicense) {
    result.warnings.push("Professional license verification required");
  }

  // Health underwriting
  if (restrictions.healthUnderwriting) {
    result.warnings.push("Medical underwriting may be required");
  }

  return result;
};

const calculateAge = (joinDate: string): number => {
  const today = new Date();
  const join = new Date(joinDate);
  return today.getFullYear() - join.getFullYear();
};

export const getEligiblePolicies = (
  customer: CustomerData,
  customerAge?: number,
  income?: number,
  employment?: string,
  state?: string
): string[] => {
  const allPolicyTypes = [
    "Auto Insurance",
    "Home Insurance", 
    "Life Insurance",
    "Health Insurance",
    "Business Insurance",
    "Medicare Supplement",
    "Term Life Insurance",
    "Long-Term Care Insurance",
    "Workers' Compensation",
    "Group Life Insurance",
    "Professional Liability",
    "Medicaid",
    "High-Value Life Insurance"
  ];

  return allPolicyTypes.filter(policyType => {
    const eligibility = checkPolicyEligibility(policyType, customer, customerAge, income, employment, state);
    return eligibility.eligible;
  });
};
