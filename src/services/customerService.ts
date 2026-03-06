import { api } from "@/lib/axios";
import { CustomerData, FamilyMember, CustomerNote } from "@/types/customer";

export interface CustomerListApiResponse {
  data: CustomerResponse[];
  links: {
    first: string;
    last: string;
    next: string | null;
    prev: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    path: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
}

export interface CustomerListResponse {
  data: CustomerData[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    from: number;
    to: number;
  };
}

export interface CustomerFilters {
  search?: string;
  status?: string;
  customer_type?: string;
  account_status?: string;
  created_from?: string;
  created_to?: string;
  updated_from?: string;
  updated_to?: string;
  per_page?: number;
  page?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateCustomerRequest {
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender?: "Male" | "Female" | "Other";
  date_of_birth?: string;
  ssn?: string;
  marital_status?: "Single" | "Married" | "Divorced" | "Widowed";
  height?: string;
  weight?: string;
  smoker?: "Yes" | "No";
  email?: string;
  home_phone?: string;
  cell_phone?: string;
  work_phone?: string;
  fax?: string;
  address?: string;
  apartment?: string;
  apartment_type?: "Apt" | "Unit" | "Suite";
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  mailing_address?: string;
  mailing_apartment?: string;
  mailing_apartment_type?: "Apt" | "Unit" | "Suite";
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip_code?: string;
  mailing_country?: string;
  different_mailing_address?: boolean;
  referral?: string;
  company?: string;
  annual_income?: number;
  employment_status?: string;
  status?: "Client" | "Prospect" | "Former" | "Deceased";
  family_id?: string;
  is_in_client_book?: boolean;
  is_in_dont_call_list?: boolean;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: number;
}

export interface FamilyMemberResponse {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  relationship: string;
  date_of_birth: string;
  gender?: string;
  ssn?: string;
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
  mailing_address?: string;
  mailing_apartment?: string;
  mailing_apartment_type?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip_code?: string;
  mailing_country?: string;
  different_mailing_address?: boolean;
  company?: string;
  referral?: string;
  notes?: string;
  policies?: any[];
  related_customer?: any;
}

export interface NoteResponse {
  id: number;
  note: string;
  created_at: string;
  user: { name: string };
}

export interface DocumentResponse {
  id: number;
  file_name: string;
  url: string;
  uploaded_at: string;
}

export interface CustomerResponse {
  id: number;
  customer_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender?: string;
  date_of_birth?: string;
  ssn?: string;
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
  mailing_address?: string;
  mailing_apartment?: string;
  mailing_apartment_type?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip_code?: string;
  mailing_country?: string;
  different_mailing_address?: boolean;
  referral?: string;
  company?: string;
  annual_income?: number;
  employment_status?: string;
  status: string;
  customer_type: string;
  family_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Computed fields
  full_name: string;
  age?: number;
  total_policies_count: number;
  active_policies_count: number;
  total_premium: number;
  total_active_premium: number;

  // Relationships
  creator?: { id: string; name: string };
  updater?: { id: string; name: string };
  policies?: { policy_number: string }[];
  family_members?: FamilyMemberResponse[];
  dependents?: FamilyMemberResponse[];  // API returns 'dependents' key
  notes?: NoteResponse[];
  documents?: DocumentResponse[];
}

// Transform API response to match frontend types
const transformCustomerResponse = (
  apiCustomer: CustomerResponse,
): CustomerData => {

  const transformedData = {
    id: apiCustomer.id,
    // Name fields
    firstName: apiCustomer.first_name || "",
    middleName: apiCustomer.middle_name || "",
    lastName: apiCustomer.last_name || "",
    name:
      apiCustomer.full_name ||
      [apiCustomer.first_name, apiCustomer.middle_name, apiCustomer.last_name].filter(Boolean).join(' ').trim(),

    // Personal information
    gender: (apiCustomer.gender as "Male" | "Female" | "Other") || "",
    dateOfBirth: apiCustomer.date_of_birth || "",
    age: apiCustomer.age || undefined,
    ssn: apiCustomer.ssn || "", // SSN is now included in API response
    maritalStatus:
      (apiCustomer.marital_status as
        | "Single"
        | "Married"
        | "Divorced"
        | "Widowed") || "",

    // Physical details
    height: apiCustomer.height || "",
    weight: apiCustomer.weight || "",
    smoker: (apiCustomer.smoker as "Yes" | "No") || "",

    // Contact information
    email: apiCustomer.email || "",
    homePhone: apiCustomer.home_phone || "",
    cellPhone: apiCustomer.cell_phone || "",
    workPhone: apiCustomer.work_phone || "",
    fax: apiCustomer.fax || "",
    phone: apiCustomer.cell_phone || apiCustomer.home_phone || "", // Fallback

    // Address information
    address: apiCustomer.address || "",
    apartment: apiCustomer.apartment || "",
    apartmentType:
      (apiCustomer.apartment_type as "Apt" | "Unit" | "Suite") || "",
    city: apiCustomer.city || "",
    state: apiCustomer.state || "",
    zipCode: apiCustomer.zip_code || "",
    country: apiCustomer.country || "",
    location: `${apiCustomer.city || ""}, ${apiCustomer.state || ""}`
      .trim()
      .replace(/^,|,$/, ""),

    // Mailing address
    mailingAddress: apiCustomer.mailing_address || "",
    mailingApartment: apiCustomer.mailing_apartment || "",
    mailingApartmentType:
      (apiCustomer.mailing_apartment_type as "Apt" | "Unit" | "Suite") || "",
    mailingCity: apiCustomer.mailing_city || "",
    mailingState: apiCustomer.mailing_state || "",
    mailingZipCode: apiCustomer.mailing_zip_code || "",
    mailingCountry: apiCustomer.mailing_country || "",
    differentMailingAddress: apiCustomer.different_mailing_address || false,

    // Additional details
    referral: apiCustomer.referral || "",
    company: apiCustomer.company || "",
    annual_income: apiCustomer.annual_income || undefined,
    employment_status: apiCustomer.employment_status || undefined,
    status: apiCustomer.status || "Client",
    
    // Global Book
    isInClientBook: apiCustomer.is_in_client_book || false,
    isInDontCallList: apiCustomer.is_in_dont_call_list || false,
    
    joinDate: apiCustomer.created_at,
    totalPolicies: apiCustomer.total_policies_count || 0,
    activePolicies: apiCustomer.active_policies_count || 0,
    totalPremium: apiCustomer.total_premium || 0,
    totalActivePremium: apiCustomer.total_active_premium || 0,
    lastContact: apiCustomer.updated_at,
    policies: apiCustomer.policies?.map((p) => p.policy_number) || [],
    nextRenewal: "", // Renewal logic removed
    relationship: "", // Not applicable for main customer
    familyId: apiCustomer.family_id || "",
    dependents:
      (apiCustomer.dependents || apiCustomer.family_members)?.map((fm: any) => ({
        name:
          fm.first_name && fm.last_name
            ? `${fm.first_name} ${fm.last_name}`.trim()
            : fm.first_name || fm.last_name || "Unknown Name",
        relationship: fm.relationship || "Unknown Relationship",
        policies: fm.policies || [],
      })) || [],
    groupPolicy: null, // Would need to be determined from policies
    customerType: apiCustomer.customer_type || "Individual",
    familyMembers:
      (apiCustomer.dependents || apiCustomer.family_members)?.map((fm: any) => ({
        id: fm.id,
        firstName: fm.first_name || "",
        middleName: fm.middle_name || "",
        lastName: fm.last_name || "",
        name:
          fm.first_name && fm.last_name
            ? `${fm.first_name} ${fm.last_name}`.trim()
            : fm.first_name || fm.last_name || "Unknown Name",
        gender: (fm.gender as "Male" | "Female" | "Other") || "",
        dateOfBirth: fm.date_of_birth || "",
        ssn: fm.ssn || "",
        maritalStatus:
          (fm.marital_status as
            | "Single"
            | "Married"
            | "Divorced"
            | "Widowed") || "",
        height: fm.height || "",
        weight: fm.weight || "",
        smoker: (fm.smoker as "Yes" | "No") || "",
        email: fm.email || "",
        homePhone: fm.home_phone || "",
        cellPhone: fm.cell_phone || "",
        workPhone: fm.work_phone || "",
        fax: fm.fax || "",
        phone: fm.cell_phone || fm.home_phone || "",
        address: fm.address || "",
        apartment: fm.apartment || "",
        apartmentType: (fm.apartment_type as "Apt" | "Unit" | "Suite") || "",
        city: fm.city || "",
        state: fm.state || "",
        zipCode: fm.zip_code || "",
        country: fm.country || "",
        mailingAddress: fm.mailing_address || "",
        mailingApartment: fm.mailing_apartment || "",
        mailingApartmentType:
          (fm.mailing_apartment_type as "Apt" | "Unit" | "Suite") || "",
        mailingCity: fm.mailing_city || "",
        mailingState: fm.mailing_state || "",
        mailingZipCode: fm.mailing_zip_code || "",
        mailingCountry: fm.mailing_country || "",
        differentMailingAddress: fm.different_mailing_address || false,
        relationship: fm.relationship || "",
        company: fm.company || "",
        referral: fm.referral || "",
        policies: fm.policies || [],
        notes: fm.notes || "",
      })) || [],
    notes:
      apiCustomer.notes?.map((note) => ({
        id: note.id,
        content: note.content || "",
        color:
          (note.color as "red" | "yellow" | "green" | "blue" | "purple") ||
          "blue",
        category: note.category || "General",
        priority_type: note.priority_type || "Normal",
        timestamp: note.created_at,
        createdBy: note.created_by || "Unknown",
      })) || [],
    documents:
      apiCustomer.documents?.map((doc) => ({
        id: doc.id?.toString() || "",
        name: doc.name || "Unknown Document",
        type: doc.type || "application/octet-stream",
        size: doc.size || 0,
        uploadDate:
          doc.upload_date || doc.created_at || new Date().toISOString(),
        category: doc.category || "General",
        uploadedBy: doc.uploaded_by || "Unknown",
      })) || [],
  };

  return transformedData;
};

// Transform frontend data to API request format
const transformCustomerRequest = (
  customerData: Partial<CustomerData>,
): CreateCustomerRequest => {
  return {
    first_name: customerData.firstName || "",
    middle_name: customerData.middleName || undefined,
    last_name: customerData.lastName || "",
    gender: customerData.gender || undefined,
    date_of_birth: customerData.dateOfBirth || undefined,
    ssn: customerData.ssn || undefined,
    marital_status: customerData.maritalStatus || undefined,
    height: customerData.height || undefined,
    weight: customerData.weight || undefined,
    smoker: customerData.smoker || undefined,
    email: customerData.email || undefined,
    home_phone: customerData.homePhone || undefined,
    cell_phone: customerData.cellPhone || undefined,
    work_phone: customerData.workPhone || undefined,
    fax: customerData.fax || undefined,
    address: customerData.address || undefined,
    apartment: customerData.apartment || undefined,
    apartment_type: customerData.apartmentType || undefined,
    city: customerData.city || undefined,
    state: customerData.state || undefined,
    zip_code: customerData.zipCode || undefined,
    country: customerData.country || undefined,
    mailing_address: customerData.mailingAddress || undefined,
    mailing_apartment: customerData.mailingApartment || undefined,
    mailing_apartment_type: customerData.mailingApartmentType || undefined,
    mailing_city: customerData.mailingCity || undefined,
    mailing_state: customerData.mailingState || undefined,
    mailing_zip_code: customerData.mailingZipCode || undefined,
    mailing_country: customerData.mailingCountry || undefined,
    different_mailing_address:
      customerData.differentMailingAddress || undefined,
    referral: customerData.referral || undefined,
    company: customerData.company || undefined,
    annual_income: customerData.annual_income || undefined,
    employment_status: customerData.employment_status || undefined,
    status:
      (customerData.status as "Client" | "Prospect" | "Former" | "Deceased") || undefined,
    family_id: customerData.familyId || undefined,
    is_in_client_book: customerData.isInClientBook,
    is_in_dont_call_list: customerData.isInDontCallList,
  };
};

export const customerService = {
  /**
   * Get all customers with optional filtering and pagination
   */
  async getCustomers(filters?: CustomerFilters): Promise<CustomerListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (key === 'search') {
            // backend expects 'search' already; just trim and send
            const trimmed = (value as string).trim();
            if (trimmed !== '') {
              params.append('search', trimmed);
            }
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await api.get<CustomerListApiResponse>(
      `/customers?${params.toString()}`,
    );

    // Transform Laravel pagination format to our expected format
    const pagination = {
      current_page: response.data.meta.current_page,
      per_page: response.data.meta.per_page,
      total: response.data.meta.total,
      total_pages: response.data.meta.last_page,
      from: response.data.meta.from,
      to: response.data.meta.to
    };

    const result = {
      data: response.data.data.map(transformCustomerResponse),
      pagination: pagination
    };

    return result;
  },

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: number): Promise<CustomerData> {
    const response = await api.get<CustomerResponse>(`/customers/${id}`);
    return transformCustomerResponse(response.data);
  },

  /**
   * Create a new customer
   */
  async createCustomer(
    customerData: Partial<CustomerData>,
  ): Promise<CustomerData> {
    const requestData = transformCustomerRequest(customerData);
    const response = await api.post<CustomerResponse>(
      "/customers",
      requestData,
    );
    return transformCustomerResponse(response.data);
  },

  /**
   * Update an existing customer
   */
  async updateCustomer(
    id: number,
    customerData: Partial<CustomerData>,
  ): Promise<CustomerData> {
    const requestData = transformCustomerRequest(customerData);
    const response = await api.put<CustomerResponse>(
      `/customers/${id}`,
      requestData,
    );
    return transformCustomerResponse(response.data);
  },

  /**
   * Delete a customer (soft delete)
   */
  async deleteCustomer(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  /**
   * Search customers by query
   */
  async searchCustomers(
    query: string,
    page = 1,
    perPage = 15,
  ): Promise<CustomerListResponse> {
    return this.getCustomers({
      search: query,
      page,
      per_page: perPage,
    });
  },

  /**
   * Get customers by status
   */
  async getCustomersByStatus(
    status: string,
    page = 1,
    perPage = 15,
  ): Promise<CustomerListResponse> {
    return this.getCustomers({
      status,
      page,
      per_page: perPage,
    });
  },

  /**
   * Get customers by type
   */
  async getCustomersByType(
    customerType: string,
    page = 1,
    perPage = 15,
  ): Promise<CustomerListResponse> {
    return this.getCustomers({
      customer_type: customerType,
      page,
      per_page: perPage,
    });
  },

  /**
   * Convert a prospect-status customer to client status
   */
  async convertProspectToClient(customerId: number): Promise<CustomerData> {
    const response = await api.post<CustomerResponse>(
      `/customers/${customerId}/convert-to-client`
    );
    return transformCustomerResponse(response.data);
  },
};

export default customerService;
