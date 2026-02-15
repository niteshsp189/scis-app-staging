import { api } from "@/lib/axios";

export interface CalendarConnection {
  id: string;
  provider: "google" | "microsoft";
  email: string;
  calendar_name?: string;
  is_active: boolean;
  is_healthy: boolean;
  last_sync_at: string | null;
  error_message: string | null;
  connected: boolean;
}

export interface CalendarProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface SyncStatus {
  id: string;
  provider: string;
  email: string;
  is_healthy: boolean;
  last_sync_at: string | null;
  error_message: string | null;
  sync_settings: {
    sync_direction: "push_only" | "pull_only" | "bidirectional";
    auto_sync: boolean;
    sync_reminders: boolean;
  };
}

export interface SyncResults {
  appointments_pushed: number;
  appointments_pulled: number;
  conflicts_detected: number;
  errors: string[];
}

export interface ConnectionsResponse {
  connections: CalendarConnection[];
  available_providers: CalendarProvider[];
}

export interface SyncStatusResponse {
  status: SyncStatus[];
  total_connections: number;
  healthy_connections: number;
}

class CalendarIntegrationService {
  /**
   * Get all calendar connections for the authenticated user
   */
  async getConnections(): Promise<ConnectionsResponse> {
    try {
      const response = await api.get("/calendar/connections");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch calendar connections:", error);
      throw error;
    }
  }

  /**
   * Get OAuth authorization URL for a provider
   */
  async getAuthUrl(
    provider: "google" | "microsoft",
  ): Promise<{ auth_url: string; provider: string }> {
    try {
      const response = await api.post(`/calendar/auth/${provider}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get auth URL for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback (usually called from a popup window)
   */
  async handleCallback(
    provider: "google" | "microsoft",
    code: string,
    state?: string,
  ): Promise<{ message: string; connection: CalendarConnection }> {
    try {
      const response = await api.post(`/calendar/callback/${provider}`, {
        code,
        state,
      });
      return response.data;
    } catch (error) {
      console.error(`OAuth callback failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect a calendar connection
   */
  async disconnect(connectionId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(
        `/calendar/connections/${connectionId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to disconnect calendar:", error);
      throw error;
    }
  }

  /**
   * Manually sync a calendar connection
   */
  async syncCalendar(
    connectionId: string,
  ): Promise<{
    message: string;
    sync_results: SyncResults;
    last_sync_at: string;
  }> {
    try {
      const response = await api.post(
        `/calendar/connections/${connectionId}/sync`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to sync calendar:", error);
      throw error;
    }
  }

  /**
   * Get sync status for all connections
   */
  async getSyncStatus(): Promise<SyncStatusResponse> {
    try {
      const response = await api.get("/calendar/sync-status");
      return response.data;
    } catch (error) {
      console.error("Failed to get sync status:", error);
      throw error;
    }
  }

  /**
   * Update sync settings for a connection
   */
  async updateSyncSettings(
    connectionId: string,
    settings: {
      sync_direction?: "push_only" | "pull_only" | "bidirectional";
      auto_sync?: boolean;
      sync_reminders?: boolean;
    },
  ): Promise<{ message: string; settings: any }> {
    try {
      const response = await api.put(
        `/calendar/connections/${connectionId}/settings`,
        settings,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update sync settings:", error);
      throw error;
    }
  }

  /**
   * Initiate OAuth flow by redirecting to OAuth URL
   */
  async initiateOAuth(
    provider: "google" | "microsoft",
  ): Promise<CalendarConnection> {
    try {
      // Get the OAuth URL
      const { auth_url } = await this.getAuthUrl(provider);

      // Store the current page in sessionStorage so we can return after OAuth
      sessionStorage.setItem("oauth_return_url", window.location.href);
      sessionStorage.setItem("oauth_provider", provider);

      // Redirect to OAuth URL
      window.location.href = auth_url;

      // This will never resolve since we're redirecting away
      return new Promise(() => {});
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get provider icon component name
   */
  getProviderIcon(provider: string): string {
    switch (provider) {
      case "google":
        return "google";
      case "microsoft":
        return "microsoft";
      default:
        return "calendar";
    }
  }

  /**
   * Get provider display name
   */
  getProviderName(provider: string): string {
    switch (provider) {
      case "google":
        return "Google Calendar";
      case "microsoft":
        return "Microsoft Outlook";
      default:
        return "Unknown Provider";
    }
  }

  /**
   * Get connection status color
   */
  getConnectionStatusColor(connection: CalendarConnection): string {
    if (!connection.connected) return "gray";
    if (!connection.is_healthy) return "red";
    return "green";
  }

  /**
   * Get connection status text
   */
  getConnectionStatusText(connection: CalendarConnection): string {
    if (!connection.connected) return "Disconnected";
    if (!connection.is_healthy) return "Error";
    return "Connected";
  }

  /**
   * Format last sync time
   */
  formatLastSync(lastSyncAt: string | null): string {
    if (!lastSyncAt) return "Never synced";

    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
  }

  /**
   * Check if connection needs attention
   */
  needsAttention(connection: CalendarConnection): boolean {
    return !connection.is_healthy || !!connection.error_message;
  }

  /**
   * Get sync direction display text
   */
  getSyncDirectionText(direction: string): string {
    switch (direction) {
      case "push_only":
        return "Push to external calendar only";
      case "pull_only":
        return "Pull from external calendar only";
      case "bidirectional":
        return "Sync both ways";
      default:
        return "Unknown";
    }
  }
}

export const calendarIntegrationService = new CalendarIntegrationService();
export default calendarIntegrationService;
