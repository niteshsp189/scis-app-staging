import { CustomerCard } from "@/components/CustomerCard";
import { CustomerViewType } from "@/components/customer/CustomerViewControls";
import { CustomerData } from "@/types/customer";
import { CustomerListResponse, CustomerFilters } from "@/services/customerService";
import { CustomerListView } from "@/components/customer/CustomerListView";
import { CustomersTable } from "./CustomersTable";
import { PaginationControls } from "@/components/PaginationControls";

interface CustomersContentProps {
  customers: CustomerData[];
  pagination: CustomerListResponse["pagination"] | null;
  filters: CustomerFilters;
  loading: boolean;
  currentView: CustomerViewType;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export function CustomersContent({
  customers,
  pagination,
  filters,
  loading,
  currentView,
  onPageChange,
  onPerPageChange,
}: CustomersContentProps) {
  if (loading && customers.length === 0) {
    // Skeleton handled by parent
    return null;
  }

  if (customers.length === 0 && !loading) {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {customers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderCurrentView()}
      {pagination && pagination.total_pages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          perPage={filters.per_page}
        />
      )}
    </div>
  );
}
