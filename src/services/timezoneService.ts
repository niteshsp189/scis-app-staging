import { api } from '@/lib/axios';

interface OrganizationInfo {
  timezone?: string;
}

class TimezoneService {
  private organizationTimezone: string | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the timezone service by fetching organization data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Fetch current user's organization info from the backend
      const response = await api.get('/organization');
      const organization: OrganizationInfo = response.data;
      this.organizationTimezone = organization.timezone || 'UTC';
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to fetch organization timezone, defaulting to UTC:', error);
      this.organizationTimezone = 'UTC';
      this.initialized = true;
    }
  }

  /**
   * Get the organization's timezone
   */
  async getOrganizationTimezone(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.organizationTimezone || 'UTC';
  }

  /**
   * Convert a local date/time to the organization's timezone for API submission
   * This prevents the automatic UTC conversion that happens with toISOString()
   * 
   * @param date - The date object in local timezone
   * @param time - Time string in HH:MM format (24-hour)
   * @returns ISO string that represents the correct time in organization timezone
   */
  async toOrganizationTimezoneISO(date: Date, time?: string): Promise<string> {
    const orgTimezone = await this.getOrganizationTimezone();
    
    let targetDate = new Date(date);
    
    // If time is provided, set the specific time
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
    }

    // Create a date string that represents the time in the organization's timezone
    // This prevents JavaScript's automatic UTC conversion
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: orgTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const parts = formatter.formatToParts(targetDate);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    const hour = parts.find(part => part.type === 'hour')?.value;
    const minute = parts.find(part => part.type === 'minute')?.value;
    const second = parts.find(part => part.type === 'second')?.value;

    // Create ISO string without timezone conversion
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  }

  /**
   * Alternative method: Create a datetime that represents the local time
   * as if it were in the organization's timezone
   */
  async createOrganizationDateTime(date: Date, time?: string): Promise<string> {
    let targetDate = new Date(date);
    
    // If time is provided, set the specific time
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
    }

    // Get the timezone offset for the organization
    const orgTimezone = await this.getOrganizationTimezone();
    
    // Format the date as if it's in the organization timezone
    // This ensures the backend receives the correct local time
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const hours = String(targetDate.getHours()).padStart(2, '0');
    const minutes = String(targetDate.getMinutes()).padStart(2, '0');
    const seconds = String(targetDate.getSeconds()).padStart(2, '0');

    // Return ISO string representing the exact time we want
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  }

  /**
   * Format a datetime string for display in local timezone
   */
  formatForDisplay(dateTimeString: string, format?: Intl.DateTimeFormatOptions): string {
    const date = new Date(dateTimeString);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', format || defaultOptions);
  }

  /**
   * Reset the service (useful for testing or when switching organizations)
   */
  reset(): void {
    this.organizationTimezone = null;
    this.initialized = false;
  }
}

export default new TimezoneService();