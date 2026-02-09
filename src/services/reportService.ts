import { api } from "@/lib/axios";
import { openPrintPage } from "@/services/printService";

// ============ Types ============

export interface ReportPagination {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ReportResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  pagination: ReportPagination;
  message?: string;
}

export interface FilterOptions {
  companies: { id: number; name: string }[];
  plan_types: { id: number; name: string }[];
  agents: { id: string; name: string }[];
  states: string[];
  referral_sources: string[];
  customer_types: string[];
  genders: string[];
  policy_statuses: string[];
  sort_fields: Record<string, string>;
}

export interface LostClientRow {
  id: number;
  full_name: string;
  gender: string;
  date_of_birth: string;
  home_phone: string;
  status: string;
  cancellation_date: string | null;
  premium: number;
  company_name: string;
}

export interface CancelledCustomerRow {
  id: number;
  type: string;
  full_name: string;
  date: string;
  method: string;
  reason: string;
}

export interface CustomReportRow {
  id: number;
  type: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  home_phone: string;
  status: string;
  created_at: string;
}

export interface GeneralReportRow {
  id: number;
  type: string;
  full_name: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  home_phone: string;
  status: string;
  zip_code: string;
  city: string;
  state: string;
  created_at: string;
}

export interface TransferReportRow {
  id: number;
  full_name: string;
  gender: string;
  date_of_birth: string;
  home_phone: string;
  status: string;
  created_at: string;
}

export interface CustomersReportRow {
  id: number;
  customer_number: string;
  type: string;
  full_name: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  home_phone: string;
  cell_phone: string;
  email: string;
  zip_code: string;
  city: string;
  state: string;
  referral: string;
  smoker: string;
  status: string;
  created_at: string;
}

export interface UpcomingBirthdayRow {
  id: number;
  type: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  in_days: number;
  home_phone: string;
  status: string;
  created_at: string;
  age: number;
}

export interface TurningAgeRow {
  id: number;
  type: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  current_age: number;
  turning_age: number;
  turning_date: string;
  in_days: number;
  home_phone: string;
  status: string;
}

export interface EffectiveDateRow {
  id: number;
  policy_number: string;
  customer_id: number | null;
  customer_name: string;
  plan_name: string;
  company_name: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  premium_amount: number;
  status: string;
}

// ============ API Calls ============

export const reportService = {
  // Get filter options for all dropdowns
  async getFilterOptions(): Promise<FilterOptions> {
    const response = await api.get("/reports/filter-options");
    return response.data.data;
  },

  // 1. Lost Clients
  async getLostClients(params: Record<string, any> = {}): Promise<ReportResponse<LostClientRow>> {
    const response = await api.get("/reports/lost-clients", { params });
    return response.data;
  },

  // 2. Cancelled Customers
  async getCancelledCustomers(params: Record<string, any> = {}): Promise<ReportResponse<CancelledCustomerRow>> {
    const response = await api.get("/reports/cancelled-customers", { params });
    return response.data;
  },

  // 3. Custom Report
  async getCustomReport(params: Record<string, any> = {}): Promise<ReportResponse<CustomReportRow>> {
    const response = await api.get("/reports/custom", { params });
    return response.data;
  },

  // 4. General Report
  async getGeneralReport(params: Record<string, any> = {}): Promise<ReportResponse<GeneralReportRow>> {
    const response = await api.get("/reports/general", { params });
    return response.data;
  },

  // 5. Transfers Report
  async getTransfersReport(params: Record<string, any> = {}): Promise<ReportResponse<TransferReportRow>> {
    const response = await api.get("/reports/transfers", { params });
    return response.data;
  },

  // 6. Customers Report (Advanced Search)
  async getCustomersReport(params: Record<string, any> = {}): Promise<ReportResponse<CustomersReportRow>> {
    const response = await api.get("/reports/customers", { params });
    return response.data;
  },

  // 7. Upcoming Birthdays
  async getUpcomingBirthdays(params: Record<string, any> = {}): Promise<ReportResponse<UpcomingBirthdayRow>> {
    const response = await api.get("/reports/upcoming-birthdays", { params });
    return response.data;
  },

  // 8. Turning Age
  async getTurningAge(params: Record<string, any> = {}): Promise<ReportResponse<TurningAgeRow>> {
    const response = await api.get("/reports/turning-age", { params });
    return response.data;
  },

  // 9. Effective Date
  async getEffectiveDate(params: Record<string, any> = {}): Promise<ReportResponse<EffectiveDateRow>> {
    const response = await api.get("/reports/effective-date", { params });
    return response.data;
  },

  // Print report in new tab using the PrintLayout system
  openReportPrint(reportType: string, filters: Record<string, any> = {}): void {
    const params = new URLSearchParams();
    params.set('type', reportType);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, String(v)));
        } else {
          params.set(key, String(value));
        }
      }
    });
    openPrintPage(`/reports/print?${params.toString()}`);
  },

  // Export report as CSV
  async exportCsv(reportType: string, filters: Record<string, any> = {}): Promise<void> {
    const params = { ...filters, report_type: reportType };
    const response = await api.get("/reports/export-csv", {
      params,
      responseType: 'blob',
    });
    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
