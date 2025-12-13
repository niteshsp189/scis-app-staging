import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, RefreshCw, Eye, User, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/axios";
import { format } from "date-fns";

export interface AuditEntry {
  id: string;
  action?: string;
  action_label?: string;
  auditable_type?: string;
  auditable_id?: string | number;
  event?: string;
  description?: string;
  changes_count?: number;
  changes?: Record<string, unknown>;
  time_since?: string;
  user?: {
    id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  created_at: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  tags?: string[];
  ip_address?: string;
  user_agent?: string;
  url?: string;
}

interface AuditTrailProps {
  // For specific model audits (e.g., policy audits)
  modelType?: string;
  modelId?: string | number;
  // For general audit logs with filters
  endpoint?: string;
  // Data can be passed directly for cases where it's already fetched
  data?: AuditEntry[];
  // UI customization
  title?: string;
  showHeader?: boolean;
  showRefresh?: boolean;
  showDetailModal?: boolean;
  compact?: boolean;
  maxHeight?: string;
  // Callbacks
  onEntryClick?: (entry: AuditEntry) => void;
  onRefresh?: () => void;
  // Query options
  enabled?: boolean;
  refetchInterval?: number;
}

export function AuditTrail({
  modelType,
  modelId,
  endpoint,
  data: externalData,
  title = "Audit Trail",
  showHeader = true,
  showRefresh = true,
  showDetailModal = true,
  compact = false,
  maxHeight,
  onEntryClick,
  onRefresh,
  enabled = true,
  refetchInterval,
}: AuditTrailProps) {
  // Determine the API endpoint
  const apiEndpoint = endpoint || (modelType && modelId ? `/${modelType}/${modelId}/audits` : '/audit-logs');

  // Fetch audit data if not provided externally
  const {
    data: auditResponse,
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey: ["audit-trail", apiEndpoint],
    queryFn: async () => {
      if (externalData) return { data: externalData };
      const response = await api.get(apiEndpoint);
      return response.data;
    },
    enabled: enabled && !externalData,
    refetchInterval,
    retry: 2,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const auditLogs = externalData || auditResponse?.data || [];

  // Handle refresh
  const handleRefresh = async () => {
    try {
      if (onRefresh) {
        onRefresh();
      } else {
        await refetch();
      }
      toast({
        title: "Audit Trail Refreshed",
        description: "The audit trail has been successfully updated.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh audit trail. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle entry click
  const handleEntryClick = (entry: AuditEntry) => {
    if (onEntryClick) {
      onEntryClick(entry);
    }
  };

  // Get user display name
  const getUserName = (user: AuditEntry['user']) => {
    if (!user) return "System";
    return user.name ||
           (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '') ||
           user.first_name ||
           user.email?.split('@')[0] ||
           "Unknown User";
  };

  // Get event display name
  const getEventLabel = (entry: AuditEntry) => {
    return entry.action_label ||
           entry.action ||
           (entry.auditable_type && entry.event
             ? `${entry.auditable_type.split("\\").pop()} ${entry.event}`
             : 'Activity'
           );
  };

  // Get event color based on event type
  const getEventColor = (event?: string) => {
    switch (event?.toLowerCase()) {
      case 'created':
        return 'bg-green-500';
      case 'updated':
        return 'bg-blue-500';
      case 'deleted':
        return 'bg-red-500';
      case 'restored':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format changes for display
  const formatChanges = (entry: AuditEntry) => {
    if (!entry.changes || Object.keys(entry.changes).length === 0) {
      return null;
    }
    return Object.keys(entry.changes).join(", ");
  };

  // Loading skeleton
  if (isLoading && !externalData) {
    return (
      <Card className={maxHeight ? `h-${maxHeight} flex flex-col` : ''}>
        {showHeader && (
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={maxHeight ? 'flex-1 overflow-hidden' : ''}>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 pb-4 border-b">
                <Skeleton className="flex-shrink-0 w-3 h-3 rounded-full mt-2" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>Failed to load audit trail</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={maxHeight ? `h-${maxHeight} flex flex-col` : ''}>
      {showHeader && (
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {title}
            </CardTitle>
            {showRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className={`${maxHeight ? 'flex-1 overflow-y-auto' : ''} ${compact ? 'p-4' : ''}`}>
        {auditLogs.length > 0 ? (
          <div className={`space-y-${compact ? '3' : '4'}`}>
            {auditLogs.map((entry: AuditEntry) => (
              <div
                key={entry.id}
                className={`
                  flex gap-${compact ? '3' : '4'} pb-${compact ? '3' : '4'}
                  border-b last:border-b-0
                  ${onEntryClick ? 'cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-md transition-colors' : ''}
                `}
                onClick={() => handleEntryClick(entry)}
              >
                {/* Event Indicator */}
                <div className={`
                  flex-shrink-0 w-${compact ? '2' : '3'} h-${compact ? '2' : '3'}
                  rounded-full mt-2 ${getEventColor(entry.event)}
                `}></div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Event Title */}
                      <div className={`font-medium ${compact ? 'text-sm' : ''} truncate`}>
                        {getEventLabel(entry)}
                      </div>

                      {/* Description */}
                      {entry.description && (
                        <div className={`text-gray-600 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                          {entry.description}
                        </div>
                      )}

                      {/* Changes */}
                      {entry.changes_count > 0 && (
                        <div className={`text-gray-500 mt-1 ${compact ? 'text-xs' : 'text-xs'}`}>
                          <Badge variant="outline" className="text-xs">
                            {entry.changes_count} change{entry.changes_count !== 1 ? 's' : ''}
                          </Badge>
                          {formatChanges(entry) && (
                            <span className="ml-2">
                              Fields: {formatChanges(entry)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && !compact && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {entry.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* User and Time */}
                    <div className={`text-right flex-shrink-0 ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      <div className="flex items-center gap-1 justify-end">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-24">
                          {getUserName(entry.user)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {entry.time_since ||
                           format(new Date(entry.created_at), compact ? 'MMM d' : 'MMM d, HH:mm')
                          }
                        </span>
                      </div>
                    </div>

                    {/* View Detail Button */}
                    {showDetailModal && onEntryClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEntryClick(entry);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className={`h-${compact ? '8' : '12'} w-${compact ? '8' : '12'} mx-auto mb-4 text-gray-300`} />
            <p className={compact ? 'text-sm' : ''}>No audit history available</p>
            {!compact && (
              <p className="text-sm mt-2">
                Activities and changes will appear here.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AuditTrail;
