import { CustomerCard } from "@/components/CustomerCard";
import { usePermissions } from "@/contexts/PermissionContext";
import { CustomerViewType } from "@/components/customer/CustomerViewControls";
import { CustomerData } from "@/types/customer";
import { CustomerListResponse, CustomerFilters } from "@/services/customerService";
import { CustomerListView } from "@/components/customer/CustomerListView";
import { CustomersTable } from "./CustomersTable";
import { PaginationControls } from "@/components/PaginationControls";
import { InfiniteScrollLoader } from "@/components/InfiniteScrollLoader";

interface CustomersContentWithInfiniteProps {
  customers: CustomerData[];
  pagination?: CustomerListResponse["pagination"] | null;
  filters: CustomerFilters;
  loading: boolean;
  searchLoading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  currentView: CustomerViewType;
  viewMode: "pagination" | "infinite";
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onLoadMore?: () => void;
}

export function CustomersContentWithInfinite({
  customers,
  pagination,
  filters,
  loading,
  searchLoading = false,
  loadingMore = false,
  hasMore = false,
  currentView,
  viewMode,
  onPageChange,
  onPerPageChange,
  onLoadMore,
}: CustomersContentWithInfiniteProps) {
  const { hasRole } = usePermissions();
  const isAdmin = hasRole("Admin") || hasRole("Super Admin");

  if (loading && customers.length === 0) {
    // Skeleton handled by parent
    return null;
  }

  if (customers.length === 0 && !loading && !searchLoading) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800">No customers found</h3>
        <p className="text-gray-500 mt-2">No customers match the current filters.</p>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "list":
        return <CustomerListView customers={customers} />;
      case "table":
        return <CustomersTable customers={customers} />;
      case "cards":
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {customers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} isAdmin={isAdmin} />
            ))}
          </div>
        );
    }
  };

  const shouldShowPagination = viewMode === "pagination" && pagination && pagination.total_pages > 1 && onPageChange && onPerPageChange;
  const shouldShowInfiniteScroll = viewMode === "infinite" && onLoadMore;

  return (
    <div className="space-y-6">
      {searchLoading && customers.length > 0 && (
        <div className="text-center py-2">
          <div className="inline-flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Searching...
          </div>
        </div>
      )}
      
      {renderCurrentView()}
      
      {shouldShowPagination && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          perPage={filters.per_page || 25}
        />
      )}
      
      {shouldShowInfiniteScroll && (
        <InfiniteScrollLoader
          hasMore={hasMore}
          loading={loadingMore}
          onLoadMore={onLoadMore}
        />
      )}
    </div>
  );
}