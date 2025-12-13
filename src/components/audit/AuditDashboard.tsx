import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AuditService } from "@/services/auditService";
import { AuditLog, AuditFilters, AuditStats, FilterOptions } from "@/types/audit";
import { AuditHeader } from "./AuditHeader";
import { AuditFilters as AuditFiltersComponent } from "./AuditFilters";
import { AuditStatsCards } from "./AuditStatsCards";
import { AuditDataTable } from "./AuditDataTable";
import { AuditStatsCharts } from "./AuditStatsCharts";
import { AuditDetailModal } from "./AuditDetailModal";
import { StaffActivity } from "./StaffActivity";
import { usePermissions } from "@/contexts/PermissionContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AuditDashboard() {
  const { hasPermission } = usePermissions();
  
  // Permission check
  const canViewAuditLogs = hasPermission("view_audit_logs");

  // State management
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Pagination and filters
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  });

  const [filters, setFilters] = useState<AuditFilters>({
    per_page: 15,
    page: 1,
    sort_by: 'created_at',
    sort_direction: 'desc',
    event: 'created,updated,deleted',
  });

  // Stats and filter options
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [statsPeriod, setStatsPeriod] = useState('month');

  // Check permissions on mount
  if (!canViewAuditLogs) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to view audit logs. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Load audit logs
  const loadAuditLogs = async (newFilters?: Partial<AuditFilters>) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = { ...filters, ...newFilters };
      
      // Ensure we always have the default event filter if no event filter is specified
      if (!currentFilters.event && !newFilters?.event) {
        currentFilters.event = 'created,updated,deleted';
      }
      
      const response = await AuditService.getAuditLogs(currentFilters);
      
      setAuditLogs(response.data);
      setPagination(response.pagination);
      setFilters(currentFilters);
      
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
      let errorMessage = 'Failed to load audit logs';
      
      // Handle specific permission errors
      if (err.message?.includes('Insufficient Privileges') || err.required_roles) {
        errorMessage = 'You need administrator privileges to view audit logs. Please contact your system administrator.';
      } else {
        errorMessage = err.response?.data?.message || err.message || 'Failed to load audit logs';
      }
      
      setError(errorMessage);
      toast({
        title: "Access Restricted",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async (period: string = 'month') => {
    try {
      setStatsLoading(true);
      const response = await AuditService.getAuditStats(period);
      
      // Transform the API response to match the AuditStats interface
      const transformedStats: AuditStats = {
        total_logs: response.data.overview.total_actions,
        active_users: response.data.overview.unique_users,
        failed_logins: response.data.overview.failed_logins,
        activity_rate: response.data.overview.unique_users > 0 
          ? (response.data.overview.total_actions / response.data.overview.unique_users) 
          : 0,
        // Map the API response data to the expected format
        activity_timeline: response.data.daily_activity?.map(item => ({
          date: item.date,
          count: item.total_actions
        })) || [],
        action_distribution: response.data.action_breakdown?.map(item => ({
          event_label: item.action_label || item.action?.charAt(0).toUpperCase() + item.action?.slice(1) || 'Unknown',
          count: item.count
        })) || [],
        top_users: response.data.top_users?.map(user => ({
          name: user.user?.name || user.user?.first_name || user.user?.email?.split('@')[0] || 'Unknown User',
          email: user.user?.email || '',
          activity_count: user.action_count
        })) || [],
        model_distribution: response.data.model_activity?.map(item => ({
          model_type_label: item.model_name,
          count: item.count
        })) || [],
      };
      
      setStats(transformedStats);
      setStatsPeriod(period);
    } catch (err: any) {
      console.error('Error loading audit stats:', err);
      let errorMessage = 'Failed to load audit statistics';
      
      // Handle specific permission errors
      if (err.message?.includes('Insufficient Privileges') || err.required_roles) {
        errorMessage = 'You need administrator privileges to view audit statistics.';
      }
      
      toast({
        title: "Access Restricted",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      const response = await AuditService.getFilterOptions();
      setFilterOptions(response.data);
    } catch (err: any) {
      console.error('Error loading filter options:', err);
    }
  };

  // Handle pagination change
  const handlePageChange = (page: number) => {
    loadAuditLogs({ page });
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<AuditFilters>) => {
    loadAuditLogs({ ...newFilters, page: 1 });
  };

  // Handle export
  const handleExport = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    try {
      toast({
        title: "Export Started",
        description: "Your audit log export is being prepared...",
      });

      const blob = await AuditService.exportAuditLogs(format, filters);
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      AuditService.downloadFile(blob, filename);

      toast({
        title: "Export Complete",
        description: `Audit logs exported successfully as ${filename}`,
      });
    } catch (err: any) {
      console.error('Error exporting audit logs:', err);
      toast({
        title: "Export Failed",
        description: "Failed to export audit logs",
        variant: "destructive",
      });
    }
  };

  // Handle log detail view
  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  // Handle sort
  const handleSort = (sortBy: string, sortDirection: 'asc' | 'desc') => {
    handleFilterChange({ sort_by: sortBy, sort_direction: sortDirection });
  };

  // Load data on mount
  useEffect(() => {
    loadAuditLogs();
    loadStats();
    loadFilterOptions();
  }, []);

  if (loading && auditLogs.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error && auditLogs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AuditHeader 
        totalLogs={pagination.total}
        onExport={handleExport}
        onRefresh={() => {
          loadAuditLogs();
          loadStats(statsPeriod);
        }}
      />

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="staff">Staff Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {filterOptions && (
            <AuditFiltersComponent
              filters={filters}
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              loading={loading}
            />
          )}

          <AuditDataTable
            data={auditLogs}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onViewDetail={handleViewDetail}
            onSort={handleSort}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-lg font-medium">Analytics Dashboard</h3>
            <select
              value={statsPeriod}
              onChange={(e) => loadStats(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <AuditStatsCards 
            stats={stats}
            loading={statsLoading}
          />

          <AuditStatsCharts 
            stats={stats}
            loading={statsLoading}
          />
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <StaffActivity />
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <AuditDetailModal
        log={selectedLog}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
