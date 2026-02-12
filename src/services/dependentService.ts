import { api } from "@/lib/axios";
import { FamilyMember } from "@/types/customer";

// ===============================================
// API Service for Dependents (renamed from Family Members)
// ===============================================

interface DependentApiResponse {
  id: number;
  customer_id: number;
  related_customer_id?: number;
  family_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  relationship: string;
  gender?: string;
  date_of_birth?: string;
  marital_status?: string;
  height?: string;
  weight?: string;
  smoker?: string;
  ssn?: string;
  email?: string;
  home_phone?: string;
  cell_phone?: string;
  work_phone?: string;
  fax?: string;
  address?: string;
  apartment?: string;
  apartment_type?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  different_mailing_address?: boolean;
  mailing_address?: string;
  mailing_apartment?: string;
  mailing_apartment_type?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip_code?: string;
  mailing_country?: string;
  company?: string;
  referral?: string;
  notes?: string;
  status?: string;
  policies?: any[]; // Policies associated with this dependent
  related_customer?: {
    id: number;
    first_name: string;
    last_name: string;
    status?: string;
    customer_type?: string;
  };
}

// Type alias for backward compatibility
export type Dependent = FamilyMember;

const transformDependentResponse = (
  apiDependent: DependentApiResponse,
): Dependent => {
  
  const dateOfBirth = apiDependent.date_of_birth ? apiDependent.date_of_birth.split('T')[0] : "";

  const result = {
    id: apiDependent.id,
    customerId: apiDependent.customer_id,
    familyId: apiDependent.family_id,
    firstName: apiDependent.first_name,
    middleName: apiDependent.middle_name || "",
    lastName: apiDependent.last_name,
    name: `${apiDependent.first_name} ${apiDependent.last_name}`.trim(),
    relationship: apiDependent.relationship,
    gender: apiDependent.gender || "",
    dateOfBirth: dateOfBirth,
    ssn: apiDependent.ssn || "", // Now returned by API
    maritalStatus: apiDependent.marital_status || "",
    height: apiDependent.height || "",
    weight: apiDependent.weight || "",
    smoker: apiDependent.smoker || "",
    email: apiDependent.email || "",
    homePhone: apiDependent.home_phone || "",
    cellPhone: apiDependent.cell_phone || "",
    workPhone: apiDependent.work_phone || "",
    fax: apiDependent.fax || "",
    phone: apiDependent.cell_phone || apiDependent.home_phone || "",
    address: apiDependent.address || "",
    apartment: apiDependent.apartment || "",
    apartmentType: apiDependent.apartment_type || "",
    city: apiDependent.city || "",
    state: apiDependent.state || "",
    zipCode: apiDependent.zip_code || "",
    country: apiDependent.country || "",
    differentMailingAddress: apiDependent.different_mailing_address || false,
    mailingAddress: apiDependent.mailing_address || "",
    mailingApartment: apiDependent.mailing_apartment || "",
    mailingApartmentType: apiDependent.mailing_apartment_type || "",
    mailingCity: apiDependent.mailing_city || "",
    mailingState: apiDependent.mailing_state || "",
    mailingZipCode: apiDependent.mailing_zip_code || "",
    mailingCountry: apiDependent.mailing_country || "",
    referral: apiDependent.referral || "",
    status: apiDependent.status || "",
    policies: apiDependent.policies?.map(p => p.policy_number) || [],
    notes: apiDependent.notes || "",
    relatedCustomerId: apiDependent.related_customer_id || undefined,
    relatedCustomerStatus: apiDependent.related_customer?.status || apiDependent.related_customer?.customer_type || undefined,
  };
  
  return result;
};

type DependentApiRequest = Omit<DependentApiResponse, "id" | "family_id" | "policies">;

const transformDependentRequest = (
  dependent: Partial<Dependent>,
): Partial<DependentApiRequest> => {
  return {
    customer_id: dependent.customerId,
    first_name: dependent.firstName,
    middle_name: dependent.middleName,
    last_name: dependent.lastName,
    relationship: dependent.relationship,
    gender: dependent.gender,
    date_of_birth: dependent.dateOfBirth,
    marital_status: dependent.maritalStatus,
    height: dependent.height,
    weight: dependent.weight,
    smoker: dependent.smoker,
    ssn: dependent.ssn,
    email: dependent.email,
    home_phone: dependent.homePhone,
    cell_phone: dependent.cellPhone,
    work_phone: dependent.workPhone,
    fax: dependent.fax,
    address: dependent.address,
    apartment: dependent.apartment,
    apartment_type: dependent.apartmentType,
    city: dependent.city,
    state: dependent.state,
    zip_code: dependent.zipCode,
    country: dependent.country,
    different_mailing_address: dependent.differentMailingAddress,
    mailing_address: dependent.mailingAddress,
    mailing_apartment: dependent.mailingApartment,
    mailing_apartment_type: dependent.mailingApartmentType,
    mailing_city: dependent.mailingCity,
    mailing_state: dependent.mailingState,
    mailing_zip_code: dependent.mailingZipCode,
    mailing_country: dependent.mailingCountry,
    referral: dependent.referral,
    notes: dependent.notes,
  };
};

export const dependentService = {
  /**
   * Get all dependents for a customer
   */
  async getDependents(customerId: number): Promise<Dependent[]> {
    const response = await api.get(`/dependents?customer_id=${customerId}`);
    return response.data.data?.data?.map(transformDependentResponse) || [];
  },

  /**
   * Create a new dependent
   */
  async createDependent(
    dependentData: Partial<Dependent>,
  ): Promise<Dependent> {
    const requestData = transformDependentRequest(dependentData);
    const response = await api.post("/dependents", requestData);
    return transformDependentResponse(response.data.data);
  },

  /**
   * Update an existing dependent
   */
  async updateDependent(
    id: number,
    dependentData: Partial<Dependent>,
  ): Promise<Dependent> {
    const requestData = transformDependentRequest(dependentData);
    const response = await api.put(`/dependents/${id}`, requestData);
    return transformDependentResponse(response.data.data);
  },

  /**
   * Delete a dependent
   */
  async deleteDependent(id: number): Promise<void> {
    await api.delete(`/dependents/${id}`);
  },

  /**
   * Associate a policy with a dependent
   */
  async associatePolicyWithDependent(
    policyId: number,
    dependentId: number,
    options?: {
      isPrimaryBeneficiary?: boolean;
      coveragePercentage?: number;
      notes?: string;
    }
  ): Promise<void> {
    await api.post(`/policies/${policyId}/dependents`, {
      dependent_id: dependentId,
      is_primary_beneficiary: options?.isPrimaryBeneficiary || false,
      coverage_percentage: options?.coveragePercentage,
      notes: options?.notes,
    });
  },

  /**
   * Remove policy association from a dependent
   */
  async disassociatePolicyFromDependent(
    policyId: number,
    dependentId: number,
  ): Promise<void> {
    await api.delete(`/policies/${policyId}/dependents/${dependentId}`);
  },

  /**
   * Get policies associated with a dependent
   */
  async getDependentPolicies(dependentId: number): Promise<any[]> {
    const response = await api.get(`/dependents/${dependentId}/policies`);
    return response.data.data || [];
  },

  /**
   * Update policy associations for multiple dependents
   */
  async updatePolicyDependents(
    policyId: number,
    dependentIds: number[]
  ): Promise<void> {
    await api.put(`/policies/${policyId}/dependents`, {
      dependent_ids: dependentIds,
    });
  },
};

// Backward compatibility - alias for legacy family member service
export const familyMemberService = {
  async getFamilyMembers(customerId: number): Promise<Dependent[]> {
    return dependentService.getDependents(customerId);
  },

  async createFamilyMember(dependentData: Partial<Dependent>): Promise<Dependent> {
    return dependentService.createDependent(dependentData);
  },

  async updateFamilyMember(id: number, dependentData: Partial<Dependent>): Promise<Dependent> {
    return dependentService.updateDependent(id, dependentData);
  },

  async deleteFamilyMember(id: number): Promise<void> {
    return dependentService.deleteDependent(id);
  },
};

// Helper functions for dependent/policy management
export const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check if the date is valid
  if (isNaN(birthDate.getTime())) return 0;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return Math.max(0, age); // Ensure age is never negative
};

export const checkDependentEligibility = (
  dependents: Dependent[],
  policyType: string,
): {
  eligible: Dependent[];
  ineligible: Dependent[];
  warnings: string[];
} => {
  const eligible: Dependent[] = [];
  const ineligible: Dependent[] = [];
  const warnings: string[] = [];

  dependents.forEach((dependent) => {
    const age = dependent.dateOfBirth ? calculateAge(dependent.dateOfBirth) : null;

    // Basic eligibility checks
    if (policyType === "Life Insurance") {
      if (age && (age < 18 || age > 65)) {
        ineligible.push(dependent);
        warnings.push(
          `${dependent.name} age (${age}) outside typical range for life insurance`,
        );
      } else {
        eligible.push(dependent);
      }
    } else if (policyType === "Health Insurance") {
      if (age && age > 64) {
        ineligible.push(dependent);
        warnings.push(
          `${dependent.name} may need Medicare instead of private health insurance`,
        );
      } else {
        eligible.push(dependent);
      }
    } else {
      eligible.push(dependent);
    }
  });

  return { eligible, ineligible, warnings };
};
