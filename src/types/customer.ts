export interface CustomerNote {
  id: string;
  customer_id: number;
  content: string;
  color:
    | "black"
    | "red"
    | "blue"
    | "purple"
    | "green"
    | "orange"
    | "yellow"
    | "pink"
    | "brown";
  is_important: boolean;
  is_pinned: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CustomerActivity {
  id: number;
  customer_id: number;
  activity_type: string;
  title: string;
  description?: string;
  activity_date: string;
  activity_time: string;
  duration_minutes: number;
  outcome:
    | "successful"
    | "no_answer"
    | "busy"
    | "voicemail"
    | "scheduled"
    | "completed"
    | "cancelled";
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  notes?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  assigned_to?: string;
  performed_by?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  assignedUser?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  performer?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface FamilyMember {
  id: number;
  // Split name fields
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string; // Keep for backward compatibility

  // Personal information
  gender: "Male" | "Female" | "Other" | "";
  dateOfBirth: string;
  ssn?: string;
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "";

  // Physical details
  height?: string;
  weight?: string;
  smoker: "Yes" | "No" | "";

  // Contact information
  email?: string;
  homePhone?: string;
  cellPhone?: string;
  workPhone?: string;
  fax?: string;
  phone?: string; // Keep for backward compatibility

  // Address information
  address?: string;
  apartment?: string;
  apartmentType: "Apt" | "Unit" | "Suite" | "";
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  // Mailing address (if different)
  mailingAddress?: string;
  mailingApartment?: string;
  mailingApartmentType: "Apt" | "Unit" | "Suite" | "";
  mailingCity?: string;
  mailingState?: string;
  mailingZipCode?: string;
  mailingCountry?: string;
  differentMailingAddress?: boolean;

  // Relationship and additional details
  relationship: string;
  referral?: string;
  status?: "Client" | "Former" | "Deceased" | "Prospect" | string;
  policies: string[];
  notes?: string;

  // Related customer link (if dependent is also a customer)
  relatedCustomerId?: number;
  relatedCustomerStatus?: string;
  relatedCustomerLegacyId?: number;
}

export interface CustomerData {
  id: number;
  // Split name fields
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string; // Keep for backward compatibility

  // Personal information
  gender: "Male" | "Female" | "Other" | "";
  dateOfBirth: string;
  age?: number;
  ssn: string;
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "";

  // Physical details
  height: string;
  weight: string;
  smoker: "Yes" | "No" | "";

  // Contact information
  email: string;
  homePhone: string;
  cellPhone: string;
  workPhone: string;
  fax: string;
  phone: string; // Keep for backward compatibility

  // Address information
  address: string;
  apartment: string;
  apartmentType: "Apt" | "Unit" | "Suite" | "";
  city: string;
  state: string;
  zipCode: string;
  country: string;
  location: string; // Keep for backward compatibility

  // Mailing address (if different)
  mailingAddress: string;
  mailingApartment: string;
  mailingApartmentType: "Apt" | "Unit" | "Suite" | "";
  mailingCity: string;
  mailingState: string;
  mailingZipCode: string;
  mailingCountry: string;
  differentMailingAddress: boolean;

  // Additional details
  company: string;
  referral: string;
  status: "Client" | "Prospect" | "Former" | "Deceased";
  joinDate: string;
  totalPolicies: number;
  activePolicies: number;
  totalPremium: number;
  totalActivePremium: number;
  lastContact: string;
  policies: string[];
  nextRenewal: string;
  relationship: string;
  familyId: string;

  // Global Book settings
  isInClientBook?: boolean;
  isInDontCallList?: boolean;
  dependents: Array<{
    name: string;
    relationship: string;
    policies: string[];
  }>;
  groupPolicy: string | null;
  customerType: string;
  familyMembers: FamilyMember[];
  notes: CustomerNote[];
  documents: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadDate: string;
    category: string;
    uploadedBy: string;
  }>;
  activities: CustomerActivity[];
  // These were added by the transform layer, but not in the original type.
  // Let's add them back for completeness.
  createdAt: string;
  updatedAt: string;
  fullName?: string;
}
