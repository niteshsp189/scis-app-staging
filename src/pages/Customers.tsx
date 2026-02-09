import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const Customers = () => {
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<CustomerViewType>("cards");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"pagination" | "infinite">(
    "pagination",
  );
  const hasHandledRefresh = useRef(false);

  // Redirect to /clients as the default customer view
  useEffect(() => {
    navigate("/clients", { replace: true });
  }, [navigate]);

  // Handle add customer success
  const handleAddCustomerSuccess = () => {
    setIsAddDialogOpen(false);
    currentHook.refresh(); // Refresh the customer list
  };

  // Check permissions
  const canCreateCustomers = hasPermission("create_customers");
  const canViewCustomers = hasPermission("view_customers");

  // Pagination hook
  const paginationHook = useCustomers({
    page: 1,
    per_page: 10,
    search: "",
    status: "all",
    account_status: "all",
    sortBy: "created_at",
    sortDirection: "desc",
  });

  // Infinite scroll hook
  const infiniteHook = useInfiniteCustomers({
    page: 1,
    per_page: 10,
    search: "",
    status: "all",
    account_status: "all",
    sortBy: "created_at",
    sortDirection: "desc",
  });

  // Use the appropriate hook based on view mode
  const currentHook = viewMode === "pagination" ? paginationHook : infiniteHook;

  // Check if we need to refresh the data (e.g., after customer deletion)
  useEffect(() => {
    if (location.state?.refresh && !hasHandledRefresh.current) {
      hasHandledRefresh.current = true;
      // Clear the state to prevent repeated refreshes
      window.history.replaceState({}, document.title);
      // Force a refresh of the customer list
      setTimeout(() => {
        currentHook.refresh();
      }, 100);
    }
  }, [location.state?.refresh]); // Only depend on the refresh flag, not currentHook

  // Reset the refresh flag when location changes
  useEffect(() => {
    hasHandledRefresh.current = false;
  }, [location.pathname]);

  const handleViewModeChange = (mode: "pagination" | "infinite") => {
    setViewMode(mode);
  };

  // Loading state
  if (currentHook.loading && currentHook.customers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div
          className={`${isMobile ? "p-3" : "p-4 sm:p-8"} max-w-7xl mx-auto space-y-6`}
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (currentHook.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div
          className={`${isMobile ? "p-3" : "p-4 sm:p-8"} max-w-7xl mx-auto space-y-6`}
        >
          <Alert variant="destructive">
            <AlertDescription>{currentHook.error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div
        className={`${isMobile ? "pt-20 px-3 pb-3" : "p-4 sm:p-8"} max-w-7xl mx-auto space-y-6`}
      >
        <CustomersHeader
          onAddCustomer={() => setIsAddDialogOpen(true)}
          onUploadCustomers={(customers) => {
            setTimeout(() => {
              currentHook.refresh();
            }, 200);
          }}
        />

        <div className="mb-6">
          <CustomerStats />
        </div>

        <CustomersSearchSection
          searchTerm={currentHook.filters.search || ""}
          statusFilter={currentHook.filters.status}
          accountStatusFilter={currentHook.filters.account_status}
          currentView={currentView}
          viewMode={viewMode}
          sortBy={currentHook.filters.sortBy || "created_at"}
          sortDirection={currentHook.filters.sortDirection || "desc"}
          onSearch={currentHook.setSearchTerm}
          onStatusFilter={(status) =>
            currentHook.setFilters({ status: status === "all" ? "" : status })
          }
          onAccountStatusFilter={(status) =>
            currentHook.setFilters({
              account_status: status === "all" ? "" : status,
            })
          }
          onViewChange={setCurrentView}
          onSortChange={currentHook.setSort}
          onViewModeChange={handleViewModeChange}
        />

        <CustomersContentWithInfinite
          customers={currentHook.customers}
          pagination={
            viewMode === "pagination" ? paginationHook.pagination : null
          }
          filters={currentHook.filters}
          loading={currentHook.loading}
          searchLoading={currentHook.searchLoading}
          loadingMore={
            viewMode === "infinite" ? infiniteHook.loadingMore : false
          }
          hasMore={viewMode === "infinite" ? infiniteHook.hasMore : false}
          currentView={currentView}
          viewMode={viewMode}
          onPageChange={
            viewMode === "pagination" ? paginationHook.goToPage : undefined
          }
          onPerPageChange={
            viewMode === "pagination" ? paginationHook.changePerPage : undefined
          }
          onLoadMore={
            viewMode === "infinite" ? infiniteHook.loadMore : undefined
          }
        />

        <AddCustomerDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onCustomerAdded={handleAddCustomerSuccess}
        />

        {isMobile && canCreateCustomers && (
          <FloatingActionButton
            onClick={() => setIsAddDialogOpen(true)}
            icon="+"
            label="Add Customer"
          />
        )}
      </div>
    </div>
  );
};

export default Customers;
