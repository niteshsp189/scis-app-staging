
import { CustomerSortControls } from "./CustomerSortControls";
import { CustomerSearch } from "@/components/CustomerSearch";
import { CustomerViewControls, CustomerViewType } from "@/components/customer/CustomerViewControls";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface CustomersSearchSectionProps {
  searchTerm: string;
  statusFilter: string;
  accountStatusFilter: string;
  currentView: CustomerViewType;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  viewMode?: "pagination" | "infinite";
  pageStatus?: "Client" | "Former" | "Deceased" | "Prospect"; // NEW: Lock filter to specific status
  onSearch: (term: string) => void;
  onStatusFilter: (status: string) => void;
  onAccountStatusFilter: (status: string) => void;
  onViewChange: (view: CustomerViewType) => void;
  onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  onViewModeChange?: (mode: "pagination" | "infinite") => void;
}

export function CustomersSearchSection({
  searchTerm,
  statusFilter,
  accountStatusFilter,
  currentView,
  sortBy,
  sortDirection,
  viewMode = "pagination",
  pageStatus, // NEW: Lock filter to specific status
  onSearch,
  onStatusFilter,
  onAccountStatusFilter,
  onViewChange,
  onSortChange,
  onViewModeChange,
}: CustomersSearchSectionProps) {
  const isMobile = useIsMobile();
  const isClientPage = pageStatus === "Client";

  if (isMobile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col gap-6">
          <div className="w-full">
            <CustomerSearch
              onSearch={onSearch}
              searchTerm={searchTerm}
              accountStatus={pageStatus}
            />
          </div>

          {/* Row 2: All Controls Stacked for Mobile */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Policy Status</label>
                <Select 
                  value={statusFilter === "" ? "all" : statusFilter} 
                  onValueChange={(value) => onStatusFilter(value)}
                >
                  <SelectTrigger className="h-10 border-gray-300 rounded-lg">
                    <SelectValue placeholder="All Policy Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Policy Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Account Status</label>
                <Select 
                  value={isClientPage ? (accountStatusFilter === "" ? "all" : accountStatusFilter) : pageStatus} 
                  onValueChange={(value) => onAccountStatusFilter(value)}
                >
                  <SelectTrigger className="h-10 border-gray-300 rounded-lg">
                    <SelectValue placeholder={pageStatus || "All Account Status"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isClientPage ? (
                      <>
                        <SelectItem value="all">All Account Status</SelectItem>
                        <SelectItem value="Client">Client</SelectItem>
                        <SelectItem value="Former">Former</SelectItem>
                        <SelectItem value="Deceased">Deceased</SelectItem>
                        <SelectItem value="Prospect">Prospect</SelectItem>
                      </>
                    ) : pageStatus ? (
                      <SelectItem value={pageStatus}>{pageStatus}</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="all">All Account Status</SelectItem>
                        <SelectItem value="Client">Client</SelectItem>
                        <SelectItem value="Former">Former</SelectItem>
                        <SelectItem value="Deceased">Deceased</SelectItem>
                        <SelectItem value="Prospect">Prospect</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {onViewModeChange && (
              <ViewModeToggle
                mode={viewMode}
                onModeChange={onViewModeChange}
              />
            )}
            <CustomerSortControls
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
            <CustomerViewControls
              currentView={currentView}
              onViewChange={onViewChange}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* Row 1 */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Search & Filters</h3>
        </div>

        <div className="flex items-center gap-3">
          {onViewModeChange && (
            <ViewModeToggle
              mode={viewMode}
              onModeChange={onViewModeChange}
            />
          )}

          <CustomerSortControls
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
          />

          <CustomerViewControls
            currentView={currentView}
            onViewChange={onViewChange}
          />
        </div>
      </div>
      {/* Row 2 */}
      <div className="w-full">
        <CustomerSearch
          onSearch={onSearch}
          searchTerm={searchTerm}
          accountStatus={pageStatus}
        />
      </div>

      {/* Row 3 */}
      <div className="w-full flex flex-wrap items-center gap-2">
        {/* Status Filters */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1">
            <Select 
              value={statusFilter === "" ? "all" : statusFilter} 
              onValueChange={(value) => onStatusFilter(value)}
            >
              <SelectTrigger className="h-10 border-gray-300 rounded-lg w-full">
                <SelectValue placeholder="All Policy Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Policy Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select> 
          </div>

          <div className="flex-1">
            <Select 
              value={isClientPage ? (accountStatusFilter === "" ? "all" : accountStatusFilter) : pageStatus} 
              onValueChange={(value) => onAccountStatusFilter(value)}
            >
              <SelectTrigger className="h-10 border-gray-300 rounded-lg w-full">
                <SelectValue placeholder={pageStatus || "All Account Status"} />
              </SelectTrigger>
              <SelectContent>
                {isClientPage ? (
                  <>
                    <SelectItem value="all">All Account Status</SelectItem>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Former">Former</SelectItem>
                    <SelectItem value="Deceased">Deceased</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  </>
                ) : pageStatus ? (
                  <SelectItem value={pageStatus}>{pageStatus}</SelectItem>
                ) : (
                  <>
                    <SelectItem value="all">All Account Status</SelectItem>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Former">Former</SelectItem>
                    <SelectItem value="Deceased">Deceased</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>
    </div>
  );
}
