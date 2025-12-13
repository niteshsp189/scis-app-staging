import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Insurance Company interfaces
export interface InsuranceCompany {
  id: number;
  name: string;
  industry: string;
  description?: string;
  contact_person: string;
  email: string;
  phone: string;
  work_phone?: string;
  fax?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  tax_id?: string;
  license_number?: string;
  rating?: number;
  status: "Active" | "Inactive";
  contract_terms?: Record<string, any>;
  commission_rate?: number;
  payment_terms?: string;
  notes?: string;
  logo_url?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  productsCount?: number;
}

export interface InsuranceCompanyCreateRequest {
  name: string;
  industry: string;
  description?: string;
  contact_person: string;
  email: string;
  phone: string;
  work_phone?: string;
  fax?: string;
  website?: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  tax_id?: string;
  license_number?: string;
  rating?: number;
  status: "Active" | "Inactive";
  contract_terms?: Record<string, any>;
  commission_rate?: number;
  payment_terms?: string;
  notes?: string;
  logo_url?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  company?: T;
  errors?: Record<string, string[]>;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class InsuranceCompanyService {
  private static baseUrl = `${API_BASE_URL}/insurance-companies`;

  static async getAll(params?: {
    status?: string;
    active?: boolean;
    search?: string;
    min_rating?: number;
    min_commission?: number;
    city?: string;
    state?: string;
    page?: number;
  }): Promise<PaginatedResponse<InsuranceCompany>> {
    try {
      const response = await api.get(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      console.warn("API call failed, using mock data:", error);
      // Fallback to mock data
      let filteredData = [...mockInsuranceCompanies];

      if (params?.status) {
        filteredData = filteredData.filter(
          (item) => item.status === params.status,
        );
      }

      if (params?.active) {
        filteredData = filteredData.filter((item) => item.status === "Active");
      }

      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            item.name.toLowerCase().includes(search) ||
            item.industry.toLowerCase().includes(search) ||
            item.contact_person.toLowerCase().includes(search) ||
            item.email.toLowerCase().includes(search),
        );
      }

      if (params?.min_rating) {
        filteredData = filteredData.filter(
          (item) => (item.rating || 0) >= params.min_rating!,
        );
      }

      if (params?.min_commission) {
        filteredData = filteredData.filter(
          (item) => (item.commission_rate || 0) >= params.min_commission!,
        );
      }

      if (params?.city) {
        filteredData = filteredData.filter((item) =>
          item.city.toLowerCase().includes(params.city!.toLowerCase()),
        );
      }

      if (params?.state) {
        filteredData = filteredData.filter(
          (item) => item.state === params.state,
        );
      }

      return {
        data: filteredData,
        current_page: 1,
        per_page: 20,
        total: filteredData.length,
        last_page: 1,
        from: 1,
        to: filteredData.length,
      };
    }
  }

  static async getById(id: number): Promise<InsuranceCompany> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  static async create(
    data: InsuranceCompanyCreateRequest,
  ): Promise<ApiResponse<InsuranceCompany>> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error: any) {
      // Check if this is a validation error (422 status)
      if (error.response?.status === 422 && error.response?.data) {
        console.warn("Validation error from backend:", error.response.data);
        return error.response.data; // Return the validation errors
      }

      console.warn("API call failed, simulating creation:", error);
      // Simulate creation for demo
      const newCompany: InsuranceCompany = {
        id: Math.max(...mockInsuranceCompanies.map((c) => c.id)) + 1,
        name: data.name,
        industry: data.industry,
        description: data.description,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        fax: data.fax,
        website: data.website,
        address: data.street_address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        country: data.country,
        tax_id: data.tax_id,
        license_number: data.license_number,
        rating: data.rating,
        status: data.status,
        commission_rate: data.commission_rate,
        payment_terms: data.payment_terms,
        notes: data.notes,
        logo_url: data.logo_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        productsCount: 0,
      };
      mockInsuranceCompanies.push(newCompany);

      return {
        message: "Insurance company created successfully",
        company: newCompany,
      };
    }
  }

  static async update(
    id: number,
    data: Partial<InsuranceCompanyCreateRequest>,
  ): Promise<ApiResponse<InsuranceCompany>> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error: any) {
      // Check if this is a validation error (422 status)
      if (error.response?.status === 422 && error.response?.data) {
        console.warn("Validation error from backend:", error.response.data);
        return error.response.data; // Return the validation errors
      }

      console.warn("API call failed:", error);
      throw error; // Re-throw for other errors
    }
  }

  static async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  static async getStatistics(): Promise<{
    total_companies: number;
    active_companies: number;
    average_rating: number;
    average_commission: number;
    companies_by_status: Record<string, number>;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/statistics`);
      return response.data;
    } catch (error) {
      console.warn("API call failed, using mock statistics:", error);
      return {
        total_companies: mockInsuranceCompanies.length,
        active_companies: mockInsuranceCompanies.filter(
          (c) => c.status === "Active",
        ).length,
        average_rating:
          mockInsuranceCompanies.reduce((sum, c) => sum + (c.rating || 0), 0) /
          mockInsuranceCompanies.length,
        average_commission:
          mockInsuranceCompanies.reduce(
            (sum, c) => sum + (c.commission_rate || 0),
            0,
          ) / mockInsuranceCompanies.length,
        companies_by_status: mockInsuranceCompanies.reduce(
          (acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      };
    }
  }

  static async getActiveCompanies(): Promise<InsuranceCompany[]> {
    try {
      const response = await this.getAll({ active: true });
      return response.data || [];
    } catch (error) {
      console.warn("API call failed, using mock data:", error);
      return mockInsuranceCompanies.filter((c) => c.status === "Active");
    }
  }
}

// Mock data for development
const mockInsuranceCompanies: InsuranceCompany[] = [
  {
    id: 1,
    name: "State Farm",
    industry: "Insurance",
    description: "Leading provider of auto, home, and life insurance",
    contact_person: "John Smith",
    email: "contact@statefarm.com",
    phone: "+1-800-782-8332",
    fax: "+1-800-782-8333",
    website: "https://www.statefarm.com",
    address: "One State Farm Plaza",
    city: "Bloomington",
    state: "Illinois",
    zip_code: "61710",
    country: "United States",
    tax_id: "37-0799258",
    license_number: "SF001",
    rating: 4.5,
    status: "Active",
    commission_rate: 8.5,
    payment_terms: "Net 30",
    notes: "Reliable partner with excellent customer service",
    created_at: "2025-01-15T08:11:32.000000Z",
    updated_at: "2025-01-15T08:11:32.000000Z",
    productsCount: 15,
  },
  {
    id: 2,
    name: "Allstate",
    industry: "Insurance",
    description: "Personal insurance, auto, home, life insurance",
    contact_person: "Sarah Johnson",
    email: "partners@allstate.com",
    phone: "+1-800-255-7828",
    website: "https://www.allstate.com",
    address: "2775 Sanders Road",
    city: "Northbrook",
    state: "Illinois",
    zip_code: "60062",
    country: "United States",
    tax_id: "36-6044130",
    license_number: "AS001",
    rating: 4.2,
    status: "Active",
    commission_rate: 9.0,
    payment_terms: "Net 30",
    notes: "Strong market presence",
    created_at: "2025-01-20T08:11:32.000000Z",
    updated_at: "2025-01-20T08:11:32.000000Z",
    productsCount: 12,
  },
  {
    id: 3,
    name: "Progressive",
    industry: "Insurance",
    description: "Auto insurance and other insurance products",
    contact_person: "Mike Davis",
    email: "agents@progressive.com",
    phone: "+1-800-776-4737",
    website: "https://www.progressive.com",
    address: "6300 Wilson Mills Road",
    city: "Mayfield Village",
    state: "Ohio",
    zip_code: "44143",
    country: "United States",
    tax_id: "34-0963169",
    license_number: "PR001",
    rating: 4.1,
    status: "Active",
    commission_rate: 7.5,
    payment_terms: "Net 45",
    notes: "Innovative technology platform",
    created_at: "2025-02-01T08:11:32.000000Z",
    updated_at: "2025-02-01T08:11:32.000000Z",
    productsCount: 8,
  },
];

// Legacy exports for backward compatibility
export const insuranceCompanyService = {
  getAllCompanies: async () => {
    try {
      const response = await InsuranceCompanyService.getAll();
      return { data: response.data };
    } catch (error) {
      console.warn("API call failed, using mock data:", error);
      return { data: mockInsuranceCompanies };
    }
  },

  createCompany: async (companyData: InsuranceCompanyCreateRequest) => {
    return await InsuranceCompanyService.create(companyData);
  },

  updateCompany: async (
    id: number,
    companyData: Partial<InsuranceCompanyCreateRequest>,
  ) => {
    return await InsuranceCompanyService.update(id, companyData);
  },

  deleteCompany: async (id: number) => {
    return await InsuranceCompanyService.delete(id);
  },
};

export default InsuranceCompanyService;
