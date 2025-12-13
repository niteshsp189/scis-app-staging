import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  calendarIntegrationService,
  type CalendarConnection,
  type CalendarProvider,
} from "@/services/calendarIntegrationService";
import { useIsMobile } from "@/hooks/use-mobile";

export const CalendarIntegration = () => {
  const isMobile = useIsMobile();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null,
  );
  const [syncingConnection, setSyncingConnection] = useState<string | null>(
    null,
  );

  // Load connections on mount
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await calendarIntegrationService.getConnections();
      setConnections(response.connections);
      setProviders(response.available_providers);
    } catch (error) {
      console.error("Failed to load connections:", error);
      toast({
        title: "Error",
        description: "Failed to load calendar connections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: "google" | "microsoft") => {
    try {
      setConnectingProvider(provider);

      // Initiate OAuth flow
      const connection =
        await calendarIntegrationService.initiateOAuth(provider);

      // Reload connections to get updated status
      await loadConnections();

      toast({
        title: "Calendar Connected",
        description: `Successfully connected to ${calendarIntegrationService.getProviderName(provider)}.`,
      });
    } catch (error: any) {
      console.error(`Failed to connect ${provider}:`, error);
      toast({
        title: "Connection Failed",
        description:
          error.message ||
          `Failed to connect to ${calendarIntegrationService.getProviderName(provider)}.`,
        variant: "destructive",
      });
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (connection: CalendarConnection) => {
    try {
      await calendarIntegrationService.disconnect(connection.id);
      await loadConnections();

      toast({
        title: "Calendar Disconnected",
        description: `Disconnected from ${calendarIntegrationService.getProviderName(connection.provider)}.`,
      });
    } catch (error: any) {
      console.error("Failed to disconnect:", error);
      toast({
        title: "Disconnect Failed",
        description:
          error.message || "Failed to disconnect calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (connection: CalendarConnection) => {
    try {
      setSyncingConnection(connection.id);
      const result = await calendarIntegrationService.syncCalendar(
        connection.id,
      );
      await loadConnections();

      toast({
        title: "Calendar Synced",
        description: `Successfully synced ${result.sync_results.appointments_pushed} appointments.`,
      });
    } catch (error: any) {
      console.error("Failed to sync:", error);
      toast({
        title: "Sync Failed",
        description:
          error.message || "Failed to sync calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncingConnection(null);
    }
  };

  // Get available providers that aren't connected
  const getAvailableProviders = () => {
    const connectedProviders = connections.map((conn) => conn.provider);
    return providers.filter(
      (provider) => !connectedProviders.includes(provider.id as any),
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading calendar connections...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your external calendars to sync appointments and check
            availability across platforms.
          </p>

          {/* Connected Calendars */}
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 border rounded-lg space-y-3 md:space-y-0"
            >
              <div className="flex items-center gap-2 md:gap-3 flex-1">
                <div className="w-10 h-10 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {connection.provider === "google" ? (
                    <span className="text-blue-600 font-bold text-sm md:text-base">G</span>
                  ) : (
                    <span className="text-blue-800 font-bold text-sm md:text-base">M</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm md:text-base">
                      {calendarIntegrationService.getProviderName(
                        connection.provider,
                      )}
                    </h3>
                    {calendarIntegrationService.needsAttention(connection) && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  {connection.connected ? (
                    <div className="space-y-0.5 md:space-y-1">
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {connection.email}
                      </p>
                      {connection.last_sync_at && (
                        <p className="text-xs text-gray-500">
                          Last synced:{" "}
                          {calendarIntegrationService.formatLastSync(
                            connection.last_sync_at,
                          )}
                        </p>
                      )}
                      {connection.error_message && (
                        <p className="text-xs text-red-500">
                          Error: {connection.error_message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not connected</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap md:flex-nowrap">
                <Badge
                  variant={
                    connection.connected && connection.is_healthy
                      ? "default"
                      : connection.connected
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-[10px] md:text-xs"
                >
                  {calendarIntegrationService.getConnectionStatusText(
                    connection,
                  )}
                </Badge>
                {connection.connected ? (
                  <div className="flex gap-1.5 md:gap-2 flex-1 md:flex-none">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(connection)}
                      disabled={syncingConnection === connection.id}
                      className="flex-1 md:flex-none text-xs md:text-sm"
                    >
                      {syncingConnection === connection.id ? (
                        <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                      )}
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(connection)}
                      className="flex-1 md:flex-none text-xs md:text-sm"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect(connection.provider)}
                    size="sm"
                    disabled={connectingProvider === connection.provider}
                  >
                    {connectingProvider === connection.provider ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-1" />
                    )}
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Available Providers to Connect */}
          {getAvailableProviders().map((provider) => (
            <div
              key={provider.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 border rounded-lg border-dashed space-y-3 md:space-y-0"
            >
              <div className="flex items-center gap-2 md:gap-3 flex-1">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {provider.id === "google" ? (
                    <span className="text-blue-600 font-bold text-sm md:text-base">G</span>
                  ) : (
                    <span className="text-blue-800 font-bold text-sm md:text-base">M</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base">{provider.name}</h3>
                  <p className="text-xs md:text-sm text-gray-500">
                    {provider.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 w-full md:w-auto">
                <Badge variant="secondary" className="text-[10px] md:text-xs">Available</Badge>
                <Button
                  onClick={() =>
                    handleConnect(provider.id as "google" | "microsoft")
                  }
                  size="sm"
                  disabled={connectingProvider === provider.id}
                  className="flex-1 md:flex-none text-xs md:text-sm"
                >
                  {connectingProvider === provider.id ? (
                    <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                  )}
                  Connect
                </Button>
              </div>
            </div>
          ))}

          <div className="bg-amber-100 border p-3 md:p-4 rounded-lg">
            <h4 className="font-medium text-sm md:text-base text-gray-800 mb-2 md:mb-3">Calendar Sync Overview</h4>
            <ul className="text-xs md:text-sm text-gray-700 space-y-1.5 md:space-y-2">
              <li>• <strong>Two-way sync:</strong> Changes in SCIS and your external calendars synchronize both ways in (near) real time.</li>
              <li>• <strong>External calendar import:</strong> Events from Google and Microsoft calendars are imported into system so you see all appointments in one place.</li>
              <li>• <strong>Availability & conflict prevention:</strong> Automatic availability checks help prevent double bookings and alert you to overlapping time slots.</li>
              <li>• <strong>Sync control:</strong> Automatic synchronization runs every 15 minutes, and you can trigger an immediate manual sync with the "Sync" button.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
