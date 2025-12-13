import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { CustomerStats } from "@/components/CustomerStats";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { CustomerViewType } from "@/components/customer/CustomerViewControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddCustomerDialog } from "@/components/dialogs/AddCustomerDialog";
import { CustomersHeader } from "@/components/customers/CustomersHeader";
import { CustomersSearchSection } from "@/components/customers/CustomersSearchSection";
import { CustomersContent } from "@/components/customers/CustomersContent";
import { CustomersContentWithInfinite } from "@/components/customers/CustomersContentWithInfinite";
import { useCustomers } from "@/hooks/useCustomers";
import { useInfiniteCustomers } from "@/hooks/useInfiniteCustomers";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermissions } from "@/contexts/PermissionContext";
import { usePreferences } from "@/contexts/PreferenceContext";

interface CustomersByStatusProps {
  status: "Client" | "Former" | "Deceased" | "Prospect";
  title: string;
  description: string;
  showAddButton?: boolean;
}

const CustomersByStatus = ({ status, title, description, showAddButton = false }: CustomersByStatusProps) => {
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();
  const { getViewMode, setViewMode: setViewModePreference, getPaginationSettings } = usePreferences();
  const location = useLocation();
  const hasHandledRefresh = useRef(false);
  
  // Determine section name for preferences
  const section = status.toLowerCase(); // 'client', 'former', 'deceased'
  
  // Initialize view mode from preferences
  const [currentView, setCurrentView] = useState<CustomerViewType>(() => 
    getViewMode(section) as CustomerViewType
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"pagination" | "infinite">("pagination");

  // Update view mode when preferences change
  useEffect(() => {
    const preferredView = getViewMode(section) as CustomerViewType;
    if (preferredView !== currentView) {
      setCurrentView(preferredView);
    }
  }, [getViewMode, section]);

  // Handle view change with preference persistence
  const handleViewChange = async (view: CustomerViewType) => {
    setCurrentView(view);
    try {
      await setViewModePreference(section, view);
    } catch (error) {
      console.error('Failed to save view preference:', error);
    }
  };

  // Check permissions
  const isProspectPage = status === "Prospect";
  const canCreate = isProspectPage 
    ? hasPermission("create_prospects") 
    : hasPermission("create_customers");
  const canViewCustomers = hasPermission("view_customers");
  const hasViewClients = hasPermission("view_clients");
  const hasViewFormer = hasPermission("view_former_customers");
  const hasViewDeceased = hasPermission("view_deceased_customers");
  const hasViewProspects = hasPermission("view_prospects");

  // Pagination hook with status filter
  const paginationHook = useCustomers({
    page: 1,
    per_page: 10,
    search: "",
    status: "", // Policy Status should be empty (all policies)
    account_status: status, // Set account_status to match the page status
    sortBy: "created_at",
    sortDirection: "desc",
  });
  
  // Infinite scroll hook with status filter
  const infiniteHook = useInfiniteCustomers({
    page: 1,
    per_page: 10,
    search: "",
    status: "", // Policy Status should be empty (all policies)
    account_status: status, // Set account_status to match the page status
    sortBy: "created_at",
    sortDirection: "desc",
  });

  // Permission check with detailed messaging
  if (!canViewCustomers) {
    // Determine which specific permission they might have
    const hasSpecificPermission = 
      (status === "Client" && hasViewClients) ||
      (status === "Former" && hasViewFormer) ||
      (status === "Deceased" && hasViewDeceased);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <Alert className="bg-blue-50 border-blue-200 max-w-3xl mx-auto">
          <AlertDescription className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Insufficient Permissions</h3>
              <p className="text-gray-700">
                You need the <strong>View Customers</strong> permission to access this page.
              </p>
            </div>

            {hasSpecificPermission && (
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Note:</strong> You have permission to view <strong>{status}</strong> customers specifically, 
                  but you also need the master <strong>View Customers</strong> permission to access this page.
                </p>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-sm mb-2 text-gray-900">Permission Hierarchy:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>View Customers</strong> (Master Permission) - Required to access any customer pages</span>
                </li>
                <li className="flex items-start gap-2 ml-4">
                  <span className="text-blue-600">↳</span>
                  <span><strong>View Clients</strong> - Filter to see active client customers</span>
                </li>
                <li className="flex items-start gap-2 ml-4">
                  <span className="text-blue-600">↳</span>
                  <span><strong>View Former Customers</strong> - Filter to see former customers</span>
                </li>
                <li className="flex items-start gap-2 ml-4">
                  <span className="text-blue-600">↳</span>
                  <span><strong>View Deceased Customers</strong> - Filter to see deceased customers</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-gray-600">
              Please contact your administrator to request the <strong>View Customers</strong> permission.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hook = viewMode === "pagination" ? paginationHook : infiniteHook;

  // Check if we need to refresh the data (e.g., after customer deletion)
  useEffect(() => {
    if (location.state?.refresh && !hasHandledRefresh.current) {
      hasHandledRefresh.current = true;
      // Clear the state to prevent repeated refreshes
      window.history.replaceState({}, document.title);
      // Force a refresh of the customer list
      setTimeout(() => {
        if (viewMode === "pagination") {
          paginationHook.refresh();
        } else {
          infiniteHook.refresh();
        }
      }, 100);
    }
  }, [location.state?.refresh, viewMode, paginationHook, infiniteHook]);

  // Reset the refresh flag when location changes
  useEffect(() => {
    hasHandledRefresh.current = false;
  }, [location.pathname]);

  // Get the total count for the title
  const totalCount = viewMode === "pagination" 
    ? paginationHook.pagination?.total || 0 
    : hook.customers.length;
  
  // Add count to title
  const titleWithCount = `${title} (${totalCount})`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <CustomersHeader 
        title={titleWithCount}
        description={description}
        currentView={currentView}
        onViewChange={handleViewChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isAddDialogOpen={isAddDialogOpen}
        onAddDialogToggle={() => setIsAddDialogOpen(!isAddDialogOpen)}
        showAddButton={showAddButton && canCreate}
        buttonText={status === "Prospect" ? "Add Prospect" : "Add Customer"}
        status={status}
        onUploadCustomers={(customers) => {
          hook.refresh();
        }}
      />

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          <div className="space-y-6">
            {/* Stats */}
            <CustomerStats 
              totalCustomers={viewMode === "pagination" ? paginationHook.pagination?.total || 0 : hook.customers.length}
              loading={hook.loading}
              status={status}
            />

            {/* Search */}
            <CustomersSearchSection 
              searchTerm={hook.filters.search || ""}
              statusFilter={hook.filters.status}
              accountStatusFilter={hook.filters.account_status}
              currentView={currentView}
              viewMode={viewMode}
              sortBy={hook.filters.sortBy || 'created_at'}
              sortDirection={hook.filters.sortDirection || 'desc'}
              pageStatus={status} // Lock filter to current page status
              onSearch={hook.setSearchTerm}
              onStatusFilter={(status) => hook.setFilters({ status: status === "all" ? "" : status })}
              onAccountStatusFilter={(status) => hook.setFilters({ account_status: status === "all" ? "" : status })}
              onViewChange={handleViewChange}
              onSortChange={hook.setSort}
              onViewModeChange={setViewMode}
            />

            {/* Main Content */}
            <CustomersContentWithInfinite
              customers={hook.customers}
              pagination={viewMode === "pagination" ? paginationHook.pagination : null}
              filters={hook.filters}
              loading={hook.loading}
              searchLoading={hook.searchLoading}
              loadingMore={viewMode === "infinite" ? infiniteHook.loadingMore : false}
              hasMore={viewMode === "infinite" ? infiniteHook.hasMore : false}
              currentView={currentView}
              viewMode={viewMode}
              onPageChange={viewMode === "pagination" ? paginationHook.goToPage : undefined}
              onPerPageChange={viewMode === "pagination" ? paginationHook.changePerPage : undefined}
              onLoadMore={viewMode === "infinite" ? infiniteHook.loadMore : undefined}
            />
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      {isMobile && showAddButton && canCreate && (
        <FloatingActionButton onClick={() => setIsAddDialogOpen(true)} />
      )}

      {/* Add Customer Dialog */}
      {showAddButton && (
        <AddCustomerDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onCustomerAdded={hook.refresh}
          mode={status === "Prospect" ? "prospect" : "client"}
        />
      )}
    </div>
  );
};

export default CustomersByStatus;