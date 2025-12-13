import { api } from "@/lib/axios";

export interface State {
  id: number;
  name: string;
  abbreviation: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ZipLookup {
  id: number;
  zipCode: string;
  city: string;
  state_abbr: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  state?: State;
}

export interface PaymentMode {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApartmentType {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralSource {
  id: number;
  name: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}

export class LookupService {
  /**
   * States API
   */
  static async getStates(params?: {
    activeOnly?: boolean;
    search?: string;
  }): Promise<State[]> {
    const searchParams = new URLSearchParams();
    if (params?.activeOnly) searchParams.append('active_only', 'true');
    if (params?.search) searchParams.append('search', params.search);

    const url = `/states${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<State[]>>(url);
    return response.data.data;
  }

  static async getState(id: number): Promise<State> {
    const response = await api.get<ApiResponse<State>>(`/states/${id}`);
    return response.data.data;
  }

  static async getStateZipCodes(id: number): Promise<ZipLookup[]> {
    const response = await api.get<ApiResponse<ZipLookup[]>>(`/states/${id}/zip-codes`);
    return response.data.data;
  }

  /**
   * ZIP Lookup API
   */
  static async getZipCodes(params?: {
    activeOnly?: boolean;
    state?: string;
    search?: string;
    perPage?: number;
    page?: number;
  }): Promise<{ data: ZipLookup[]; meta: any }> {
    const searchParams = new URLSearchParams();
    if (params?.activeOnly) searchParams.append('active_only', 'true');
    if (params?.state) searchParams.append('state', params.state);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.perPage) searchParams.append('per_page', params.perPage.toString());
    if (params?.page) searchParams.append('page', params.page.toString());

    const url = `/zip-lookup${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<ZipLookup[]>>(url);
    return {
      data: response.data.data,
      meta: response.data.meta || {}
    };
  }

  static async getZipCode(id: number): Promise<ZipLookup> {
    const response = await api.get<ApiResponse<ZipLookup>>(`/zip-lookup/${id}`);
    return response.data.data;
  }

  static async searchZipByCode(zipCode: string): Promise<ZipLookup[]> {
    const response = await api.get<ApiResponse<ZipLookup[]>>(`/zip-lookup/search/by-zip?zip=${zipCode}`);
    return response.data.data;
  }

  /**
   * Payment Modes API
   */
  static async getPaymentModes(params?: {
    activeOnly?: boolean;
    search?: string;
  }): Promise<PaymentMode[]> {
    const searchParams = new URLSearchParams();
    if (params?.activeOnly) searchParams.append('active_only', 'true');
    if (params?.search) searchParams.append('search', params.search);

    const url = `/payment-modes${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<PaymentMode[]>>(url);
    return response.data.data;
  }

  static async getPaymentMode(id: number): Promise<PaymentMode> {
    const response = await api.get<ApiResponse<PaymentMode>>(`/payment-modes/${id}`);
    return response.data.data;
  }

  static async createPaymentMode(data: {
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<PaymentMode> {
    const response = await api.post<ApiResponse<PaymentMode>>('/payment-modes', data);
    return response.data.data;
  }

  static async updatePaymentMode(id: number, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<PaymentMode> {
    const response = await api.put<ApiResponse<PaymentMode>>(`/payment-modes/${id}`, data);
    return response.data.data;
  }

  /**
   * Apartment Types API
   */
  static async getApartmentTypes(params?: {
    search?: string;
  }): Promise<ApartmentType[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);

    const url = `/apartment-types${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<ApartmentType[]>>(url);
    return response.data.data;
  }

  static async getApartmentType(id: number): Promise<ApartmentType> {
    const response = await api.get<ApiResponse<ApartmentType>>(`/apartment-types/${id}`);
    return response.data.data;
  }

  static async createApartmentType(data: {
    name: string;
    description?: string;
  }): Promise<ApartmentType> {
    const response = await api.post<ApiResponse<ApartmentType>>('/apartment-types', data);
    return response.data.data;
  }

  static async updateApartmentType(id: number, data: {
    name?: string;
    description?: string;
  }): Promise<ApartmentType> {
    const response = await api.put<ApiResponse<ApartmentType>>(`/apartment-types/${id}`, data);
    return response.data.data;
  }

  /**
   * Referral Sources API
   */
  static async getReferralSources(params?: {
    activeOnly?: boolean;
    category?: string;
    search?: string;
  }): Promise<ReferralSource[]> {
    const searchParams = new URLSearchParams();
    if (params?.activeOnly) searchParams.append('active_only', 'true');
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);

    const url = `/referral-sources${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<ReferralSource[]>>(url);
    return response.data.data;
  }

  static async getReferralSource(id: number): Promise<ReferralSource> {
    const response = await api.get<ApiResponse<ReferralSource>>(`/referral-sources/${id}`);
    return response.data.data;
  }

  static async getReferralSourceCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/referral-sources/categories/list');
    return response.data.data;
  }

  static async createReferralSource(data: {
    name: string;
    category: string;
    isActive?: boolean;
  }): Promise<ReferralSource> {
    const response = await api.post<ApiResponse<ReferralSource>>('/referral-sources', data);
    return response.data.data;
  }

  static async updateReferralSource(id: number, data: {
    name?: string;
    category?: string;
    isActive?: boolean;
  }): Promise<ReferralSource> {
    const response = await api.put<ApiResponse<ReferralSource>>(`/referral-sources/${id}`, data);
    return response.data.data;
  }
}

export default LookupService;