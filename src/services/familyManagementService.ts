import { api } from "@/lib/axios";
import { FamilyMember } from "@/types/customer";

// ===============================================
// API Service for Family Members
// ===============================================

interface FamilyMemberApiResponse {
  id: number;
  customer_id: number;
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
}

const transformFamilyMemberResponse = (
  apiFamilyMember: FamilyMemberApiResponse,
): FamilyMember => {
  return {
    id: apiFamilyMember.id,
    customerId: apiFamilyMember.customer_id,
    familyId: apiFamilyMember.family_id,
    firstName: apiFamilyMember.first_name,
    middleName: apiFamilyMember.middle_name || "",
    lastName: apiFamilyMember.last_name,
    name: `${apiFamilyMember.first_name} ${apiFamilyMember.last_name}`.trim(),
    relationship: apiFamilyMember.relationship,
    gender: apiFamilyMember.gender || "",
    dateOfBirth: apiFamilyMember.date_of_birth || "",
    ssn: "", // Not returned by API
    maritalStatus: apiFamilyMember.marital_status || "",
    height: apiFamilyMember.height || "",
    weight: apiFamilyMember.weight || "",
    smoker: apiFamilyMember.smoker || "",
    email: apiFamilyMember.email || "",
    homePhone: apiFamilyMember.home_phone || "",
    cellPhone: apiFamilyMember.cell_phone || "",
    workPhone: apiFamilyMember.work_phone || "",
    fax: apiFamilyMember.fax || "",
    phone: apiFamilyMember.cell_phone || apiFamilyMember.home_phone || "",
    address: apiFamilyMember.address || "",
    apartment: apiFamilyMember.apartment || "",
    apartmentType: apiFamilyMember.apartment_type || "",
    city: apiFamilyMember.city || "",
    state: apiFamilyMember.state || "",
    zipCode: apiFamilyMember.zip_code || "",
    country: apiFamilyMember.country || "",
    differentMailingAddress: apiFamilyMember.different_mailing_address || false,
    mailingAddress: apiFamilyMember.mailing_address || "",
    mailingApartment: apiFamilyMember.mailing_apartment || "",
    mailingApartmentType: apiFamilyMember.mailing_apartment_type || "",
    mailingCity: apiFamilyMember.mailing_city || "",
    mailingState: apiFamilyMember.mailing_state || "",
    mailingZipCode: apiFamilyMember.mailing_zip_code || "",
    mailingCountry: apiFamilyMember.mailing_country || "",
    company: apiFamilyMember.company || "",
    referral: apiFamilyMember.referral || "",
    policies: [], // Not part of family member schema yet
    notes: apiFamilyMember.notes || "",
  };
};

type FamilyMemberApiRequest = Omit<FamilyMemberApiResponse, "id" | "family_id">;

const transformFamilyMemberRequest = (
  familyMember: Partial<FamilyMember>,
): Partial<FamilyMemberApiRequest> => {
  return {
    customer_id: familyMember.customerId,
    first_name: familyMember.firstName,
    middle_name: familyMember.middleName,
    last_name: familyMember.lastName,
    relationship: familyMember.relationship,
    gender: familyMember.gender,
    date_of_birth: familyMember.dateOfBirth,
    marital_status: familyMember.maritalStatus,
    height: familyMember.height,
    weight: familyMember.weight,
    smoker: familyMember.smoker,
    email: familyMember.email,
    home_phone: familyMember.homePhone,
    cell_phone: familyMember.cellPhone,
    work_phone: familyMember.workPhone,
    fax: familyMember.fax,
    address: familyMember.address,
    apartment: familyMember.apartment,
    apartment_type: familyMember.apartmentType,
    city: familyMember.city,
    state: familyMember.state,
    zip_code: familyMember.zipCode,
    country: familyMember.country,
    different_mailing_address: familyMember.differentMailingAddress,
    mailing_address: familyMember.mailingAddress,
    mailing_apartment: familyMember.mailingApartment,
    mailing_apartment_type: familyMember.mailingApartmentType,
    mailing_city: familyMember.mailingCity,
    mailing_state: familyMember.mailingState,
    mailing_zip_code: familyMember.mailingZipCode,
    mailing_country: familyMember.mailingCountry,
    company: familyMember.company,
    referral: familyMember.referral,
    notes: familyMember.notes,
  };
};

export const familyMemberService = {
  async getFamilyMembers(customerId: number): Promise<FamilyMember[]> {
    const response = await api.get(`/dependents?customer_id=${customerId}`);
    return response.data.data?.data?.map(transformFamilyMemberResponse) || [];
  },

  async createFamilyMember(
    familyMemberData: Partial<FamilyMember>,
  ): Promise<FamilyMember> {
    const requestData = transformFamilyMemberRequest(familyMemberData);
    const response = await api.post("/dependents", requestData);
    return transformFamilyMemberResponse(response.data);
  },

  async updateFamilyMember(
    id: number,
    familyMemberData: Partial<FamilyMember>,
  ): Promise<FamilyMember> {
    const requestData = transformFamilyMemberRequest(familyMemberData);
    const response = await api.put(`/dependents/${id}`, requestData);
    return transformFamilyMemberResponse(response.data);
  },

  async deleteFamilyMember(id: number): Promise<void> {
    await api.delete(`/dependents/${id}`);
  },
};

export interface Dependent {
  name: string;
  relationship: string;
  policies: string[];
}

export interface FamilyMigrationResult {
  migratedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface FamilyMergeResult {
  mergedCount: number;
  duplicatesFound: number;
  conflicts: string[];
}

// Convert dependents to full family members
export const migrateDependentsToFamilyMembers = (
  dependents: Dependent[],
  existingFamilyMembers: FamilyMember[],
): FamilyMigrationResult => {
  const result: FamilyMigrationResult = {
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const existingNames = existingFamilyMembers.map((member) =>
    member.name.toLowerCase(),
  );

  dependents.forEach((dependent) => {
    // Skip if already exists in family members
    if (existingNames.includes(dependent.name.toLowerCase())) {
      result.skippedCount++;
      return;
    }

    try {
      const newFamilyMember: FamilyMember = {
        id: Date.now() + Math.random(),
        firstName: dependent.name.split(" ")[0] || "",
        middleName: "",
        lastName: dependent.name.split(" ").slice(1).join(" ") || "",
        name: dependent.name,
        relationship: dependent.relationship,
        gender: "",
        dateOfBirth: "",
        ssn: "",
        maritalStatus: "",
        height: "",
        weight: "",
        smoker: "",
        email: "",
        homePhone: "",
        cellPhone: "",
        workPhone: "",
        fax: "",
        phone: "",
        address: "",
        apartment: "",
        apartmentType: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        differentMailingAddress: false,
        mailingAddress: "",
        mailingApartment: "",
        mailingApartmentType: "",
        mailingCity: "",
        mailingState: "",
        mailingZipCode: "",
        mailingCountry: "",
        company: "",
        referral: "",
        policies: dependent.policies,
        notes: "Migrated from legacy dependent record",
      };

      existingFamilyMembers.push(newFamilyMember);
      result.migratedCount++;
    } catch (error) {
      result.errors.push(`Failed to migrate ${dependent.name}: ${error}`);
    }
  });

  return result;
};

// Merge duplicate family members based on name similarity
export const mergeDuplicateFamilyMembers = (
  familyMembers: FamilyMember[],
): FamilyMergeResult => {
  const result: FamilyMergeResult = {
    mergedCount: 0,
    duplicatesFound: 0,
    conflicts: [],
  };

  const nameGroups: { [key: string]: FamilyMember[] } = {};

  // Group by similar names
  familyMembers.forEach((member) => {
    const normalizedName = member.name.toLowerCase().trim();
    if (!nameGroups[normalizedName]) {
      nameGroups[normalizedName] = [];
    }
    nameGroups[normalizedName].push(member);
  });

  // Find and merge duplicates
  Object.entries(nameGroups).forEach(([name, members]) => {
    if (members.length > 1) {
      result.duplicatesFound += members.length - 1;

      // Merge data from all duplicates into the first member
      const primary = members[0];
      for (let i = 1; i < members.length; i++) {
        const duplicate = members[i];

        // Merge policies
        const combinedPolicies = [
          ...new Set([...primary.policies, ...duplicate.policies]),
        ];
        primary.policies = combinedPolicies;

        // Keep most complete information
        if (!primary.phone && duplicate.phone) primary.phone = duplicate.phone;
        if (!primary.email && duplicate.email) primary.email = duplicate.email;
        if (!primary.dateOfBirth && duplicate.dateOfBirth)
          primary.dateOfBirth = duplicate.dateOfBirth;

        // Combine notes
        if (duplicate.notes && duplicate.notes !== primary.notes) {
          primary.notes = primary.notes
            ? `${primary.notes}; Merged: ${duplicate.notes}`
            : duplicate.notes;
        }

        result.mergedCount++;
      }
    }
  });

  return result;
};

// Check family policy eligibility
export const checkFamilyEligibility = (
  familyMembers: FamilyMember[],
  policyType: string,
): {
  eligible: FamilyMember[];
  ineligible: FamilyMember[];
  warnings: string[];
} => {
  const eligible: FamilyMember[] = [];
  const ineligible: FamilyMember[] = [];
  const warnings: string[] = [];

  familyMembers.forEach((member) => {
    const age = member.dateOfBirth ? calculateAge(member.dateOfBirth) : null;

    // Basic eligibility checks
    if (policyType === "Life Insurance") {
      if (age && (age < 18 || age > 65)) {
        ineligible.push(member);
        warnings.push(
          `${member.name} age (${age}) outside typical range for life insurance`,
        );
      } else {
        eligible.push(member);
      }
    } else if (policyType === "Health Insurance") {
      if (age && age > 64) {
        ineligible.push(member);
        warnings.push(
          `${member.name} may need Medicare instead of private health insurance`,
        );
      } else {
        eligible.push(member);
      }
    } else {
      eligible.push(member);
    }
  });

  return { eligible, ineligible, warnings };
};

// Policy inheritance based on family relationships
export const inheritPoliciesFromPrimary = (
  primaryMember: FamilyMember,
  familyMembers: FamilyMember[],
): FamilyMember[] => {
  const inheritablePolicies = [
    "Health Insurance",
    "Life Insurance",
    "Auto Insurance",
  ];

  return familyMembers.map((member) => {
    if (member.id === primaryMember.id) return member;

    const shouldInherit = ["Spouse", "Child"].includes(member.relationship);

    if (shouldInherit) {
      const policiesToAdd = primaryMember.policies.filter(
        (policy) =>
          inheritablePolicies.includes(policy) &&
          !member.policies.includes(policy),
      );

      return {
        ...member,
        policies: [...member.policies, ...policiesToAdd],
      };
    }

    return member;
  });
};

// Generate family tree structure
export const generateFamilyTree = (familyMembers: FamilyMember[]) => {
  const tree = {
    primary:
      familyMembers.find((m) => m.relationship === "Primary") ||
      familyMembers[0],
    spouse: familyMembers.filter((m) => m.relationship === "Spouse"),
    children: familyMembers.filter((m) => m.relationship === "Child"),
    parents: familyMembers.filter((m) => m.relationship === "Parent"),
    siblings: familyMembers.filter((m) => m.relationship === "Sibling"),
    others: familyMembers.filter(
      (m) =>
        !["Primary", "Spouse", "Child", "Parent", "Sibling"].includes(
          m.relationship,
        ),
    ),
  };

  return tree;
};

// Calculate age helper
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};
