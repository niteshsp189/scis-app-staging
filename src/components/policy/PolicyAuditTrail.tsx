import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DateInput } from "@/components/ui/date-input";
import {
  Clock,
  RefreshCw,
  Search,
  Filter,
  Download,
  User,
  ChevronDown,
  Eye,
} from "lucide-react";
import {
  AuditService,
  AuditLog,
  AuditLogFilters,
} from "@/services/auditService";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { AuditLogDetailsDialog } from "@/components/dialogs/AuditLogDetailsDialog";
import { api } from "@/lib/axios";

interface PolicyAuditTrailProps {
  policyId: string | number;
  policyNumber?: string;
  refetchTrigger?: number;
  onAuditUpdate?: () => void;
}

export function PolicyAuditTrail({
  policyId,
  policyNumber,
  refetchTrigger,
  onAuditUpdate,
}: PolicyAuditTrailProps) {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AuditLogFilters>({
    per_page: 20,
    page: 1,
    sort_by: "created_at",
    sort_direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(
    null,
  );
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Valid audit actions to show (only created, updated, deleted)
  const validActions = ["created", "updated", "deleted"];

  // Fetch policy audit logs
  const {
    data: auditResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "policy-audit-logs",
      policyId,
      filters,
      searchTerm,
      selectedActions,
      startDate,
      endDate,
      refetchTrigger,
    ],
    queryFn: async () => {
      const queryFilters: AuditLogFilters = {
        ...filters,
        search: searchTerm || undefined,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      };

      const response = await api.get(`/policies/${policyId}/audits`, {
        params: queryFilters,
      });
      return response.data;
    },
    retry: 1,
    select: (data) => {
      // Filter audit logs to only show created, updated, deleted actions and apply selected actions filter
      if (data?.data) {
        let filteredData = data.data.filter((log: AuditLog) =>
          validActions.includes(log.event?.toLowerCase() || ""),
        );

        // Apply selected actions filter if any are selected
        if (selectedActions.length > 0) {
          filteredData = filteredData.filter((log: AuditLog) =>
            selectedActions.includes(log.event?.toLowerCase() || ""),
          );
        }

        return {
          ...data,
          data: filteredData,
        };
      }
      return data;
    },
  });

  const auditLogs = auditResponse?.data || [];
  const pagination = auditResponse?.pagination;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleActionToggle = (action: string, checked: boolean) => {
    if (checked) {
      setSelectedActions((prev) => [...prev, action]);
    } else {
      setSelectedActions((prev) => prev.filter((a) => a !== action));
    }
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePerPageChange = (perPage: number) => {
    setFilters((prev) => ({ ...prev, per_page: perPage, page: 1 }));
  };

  const handleViewDetails = (auditLog: AuditLog) => {
    setSelectedAuditLog(auditLog);
    setIsDetailsDialogOpen(true);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      if (onAuditUpdate) {
        onAuditUpdate();
      }
      toast({
        title: "Audit Trail Refreshed",
        description: "The policy audit trail has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh audit trail. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const queryFilters = {
        ...filters,
        search: searchTerm || undefined,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      };

      toast({
        title: "Export Started",
        description: "Your policy audit log export is being prepared...",
      });

      const blob = await AuditService.exportAuditLogs("xlsx", queryFilters);
      const filename = `policy_${policyId}_audit_logs_${new Date().toISOString().split("T")[0]}.xlsx`;
      AuditService.downloadFile(blob, filename);

      toast({
        title: "Export Complete",
        description: `Policy audit logs exported successfully as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export policy audit logs",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedActions([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setFilters({
      per_page: 20,
      page: 1,
      sort_by: "created_at",
      sort_direction: "desc",
    });
  };

  const hasActiveFilters =
    searchTerm || selectedActions.length > 0 || startDate || endDate;

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
               
                {error?.message || JSON.stringify(error) || "Unknown error"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Policy History{policyNumber ? ` - ${policyNumber}` : ""}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isFiltersVisible ? "rotate-180" : ""}`}
                />
              </Button> */}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button> */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters Section */}
          {isFiltersVisible && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
              {/* Search Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search descriptions, actions..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Action Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <div className="space-y-2">
                  {validActions.map((action) => (
                    <div key={action} className="flex items-center space-x-2">
                      <Checkbox
                        id={`action-${action}`}
                        checked={selectedActions.includes(action)}
                        onCheckedChange={(checked) =>
                          handleActionToggle(action, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`action-${action}`}
                        className="text-sm font-normal cursor-pointer flex items-center gap-1"
                      >
                        {AuditService.getActionIcon(action)}{" "}
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </label>
                    </div>
                  ))}
                  {selectedActions.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedActions([])}
                      className="text-xs h-6 px-2"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <DateInput
                  date={startDate}
                  onDateChange={setStartDate}
                  placeholder="Select start date"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <DateInput
                  date={endDate}
                  onDateChange={setEndDate}
                  placeholder="Select end date"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {searchTerm}
                  <button
                    onClick={() => handleSearch("")}
                    className="ml-1 text-xs hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedActions.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Actions:{" "}
                  {selectedActions
                    .map(
                      (action) =>
                        action.charAt(0).toUpperCase() + action.slice(1),
                    )
                    .join(", ")}
                  <button
                    onClick={() => setSelectedActions([])}
                    className="ml-1 text-xs hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {startDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  From: {format(startDate, "MMM dd, yyyy")}
                  <button
                    onClick={() => setStartDate(undefined)}
                    className="ml-1 text-xs hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {endDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  To: {format(endDate, "MMM dd, yyyy")}
                  <button
                    onClick={() => setEndDate(undefined)}
                    className="ml-1 text-xs hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* History List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 pb-4 border-b">
                  <Skeleton className="flex-shrink-0 w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-72" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="text-right space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : auditLogs.length > 0 ? (
            <div className="space-y-2">
              {auditLogs.map((entry: AuditLog) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewDetails(entry)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${AuditService.getActionColor(entry.event)}`}
                    >
                      {AuditService.getActionIcon(entry.event)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {entry.event_label ||
                            entry.event.charAt(0).toUpperCase() +
                              entry.event.slice(1).replace("_", " ")}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {(() => {
                            // Use AuditService to get accurate changes count
                            if (
                              entry.changes &&
                              typeof entry.changes === "object"
                            ) {
                              const formattedChanges =
                                AuditService.formatAuditChanges(entry.changes);
                              return formattedChanges.length;
                            }
                            return entry.changes_count || 0;
                          })()}{" "}
                          changes
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {entry.description || "No description available"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div className="flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" />
                      {entry.user?.name || entry.user?.email || "System"}
                    </div>
                    <div>
                      {entry.time_since ||
                        (entry.created_at
                          ? format(
                              parseISO(entry.created_at),
                              "MMM dd, yyyy 'at' h:mm a",
                            )
                          : "Unknown")}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {pagination.from} to {pagination.to} of{" "}
                    {pagination.total} entries
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Per Page Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Per page:</span>
                      <Select
                        value={filters.per_page?.toString() || "20"}
                        onValueChange={(value) =>
                          handlePerPageChange(parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.current_page === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(pagination.current_page - 1)
                        }
                        disabled={pagination.current_page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 px-2">
                        Page {pagination.current_page} of {pagination.last_page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(pagination.current_page + 1)
                        }
                        disabled={
                          pagination.current_page === pagination.last_page
                        }
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.last_page)}
                        disabled={
                          pagination.current_page === pagination.last_page
                        }
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No History Found</h3>
              <p className="text-sm">
                {hasActiveFilters
                  ? "No history entries match your current filters. Try adjusting your search criteria."
                  : "No history entries are available for this policy yet."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Dialog */}
      <AuditLogDetailsDialog
        auditLog={selectedAuditLog}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}

export default PolicyAuditTrail;
