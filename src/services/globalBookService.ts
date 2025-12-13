import { api } from "@/lib/axios";
import { CustomerData } from "@/types/customer";

export interface GlobalBookFilters {
  search?: string;
  status?: string; // Client, Former, Deceased, Prospect
  per_page?: number;
  page?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface GlobalBookResponse {
  success: boolean;
  data: CustomerData[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface GlobalBookStatistics {
  success: boolean;
  data: {
    clientBook: {
      total: number;
      clients: number;
      former: number;
      deceased: number;
      prospects: number;
    };
    dontCallList: {
      total: number;
      clients: number;
      former: number;
      deceased: number;
      prospects: number;
    };
  };
}

/**
 * Fetch customers in Client Book
 */
export const getClientBook = async (filters: GlobalBookFilters = {}): Promise<GlobalBookResponse> => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);

  const response = await api.get(`/global-book/client-book?${params.toString()}`);
  
  // Transform snake_case to camelCase
  const transformedData = response.data.data.map((customer: any) => ({
    id: customer.id,
    customerNumber: customer.customer_number,
    firstName: customer.first_name,
    middleName: customer.middle_name,
    lastName: customer.last_name,
    name: customer.name,
    email: customer.email,
    cellPhone: customer.cell_phone,
    homePhone: customer.home_phone,
    workPhone: customer.work_phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zipCode: customer.zip_code,
    status: customer.status,
    customerType: customer.customer_type,
    dateOfBirth: customer.date_of_birth,
    gender: customer.gender,
    isInClientBook: customer.is_in_client_book,
    isInDontCallList: customer.is_in_dont_call_list,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
    totalPoliciesCount: customer.total_policies_count,
    activePoliciesCount: customer.active_policies_count,
  }));

  return {
    success: response.data.success,
    data: transformedData,
    pagination: response.data.pagination,
  };
};

/**
 * Fetch customers in Don't Call List
 */
export const getDontCallList = async (filters: GlobalBookFilters = {}): Promise<GlobalBookResponse> => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);

  const response = await api.get(`/global-book/dont-call-list?${params.toString()}`);
  
  // Transform snake_case to camelCase
  const transformedData = response.data.data.map((customer: any) => ({
    id: customer.id,
    customerNumber: customer.customer_number,
    firstName: customer.first_name,
    middleName: customer.middle_name,
    lastName: customer.last_name,
    name: customer.name,
    email: customer.email,
    cellPhone: customer.cell_phone,
    homePhone: customer.home_phone,
    workPhone: customer.work_phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zipCode: customer.zip_code,
    status: customer.status,
    customerType: customer.customer_type,
    dateOfBirth: customer.date_of_birth,
    gender: customer.gender,
    isInClientBook: customer.is_in_client_book,
    isInDontCallList: customer.is_in_dont_call_list,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
    totalPoliciesCount: customer.total_policies_count,
    activePoliciesCount: customer.active_policies_count,
  }));

  return {
    success: response.data.success,
    data: transformedData,
    pagination: response.data.pagination,
  };
};

/**
 * Fetch Global Book statistics
 */
export const getGlobalBookStatistics = async (): Promise<GlobalBookStatistics> => {
  const response = await api.get('/global-book/statistics');
  return response.data;
};

export const globalBookService = {
  getClientBook,
  getDontCallList,
  getGlobalBookStatistics,
};
