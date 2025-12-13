export interface Organization {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  timezone: string;
  logo_url?: string;
  tax_id?: string;
  registration_number?: string;
  established_date?: string;
  subscription_plan?: string;
  subscription_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  is_primary: boolean;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  business_hours?: BusinessHours;
  manager_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  break_start?: string;
  break_end?: string;
}

export interface OrganizationSetting {
  key: string;
  value: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  'company.name': OrganizationSetting;
  'company.industry': OrganizationSetting;
  'company.website': OrganizationSetting;
  'company.phone': OrganizationSetting;
  'company.email': OrganizationSetting;
  'company.address': OrganizationSetting;
  'company.city': OrganizationSetting;
  'company.state': OrganizationSetting;
  'company.postal_code': OrganizationSetting;
  'company.country': OrganizationSetting;
  'company.tax_id': OrganizationSetting;
  'company.registration_number': OrganizationSetting;
  'company.logo_url': OrganizationSetting;
}

export interface Timezone {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
