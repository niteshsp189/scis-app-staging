import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import {
  customerService,
  CustomerListResponse,
  CustomerFilters,
} from "@/services/customerService";
import { CustomerData } from "@/types/customer";
import { toast } from "@/components/ui/use-toast";
import { formatPermissionError, isPermissionError, getErrorData } from "@/utils/permissionErrorHandler";
import { formatErrorMessage, getErrorTitle } from "@/utils/errorMessageFormatter";

export interface UseCustomersResult {
  customers: CustomerData[];
  loading: boolean;
  searchLoading: boolean; // Separate loading state for search operations
  error: string | null;
  pagination: CustomerListResponse["pagination"] | null;
  filters: CustomerFilters;

  // Actions
  fetchCustomers: (filters?: CustomerFilters) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: Partial<CustomerFilters>) => void;
  setSort: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;

  // Pagination
  goToPage: (page: number) => Promise<void>;
  changePerPage: (perPage: number) => Promise<void>;
}

export const useCustomers = (
  initialFilters?: CustomerFilters
): UseCustomersResult => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<
    CustomerListResponse["pagination"] | null
  >(null);
  const [filters, setFiltersState] = useState<CustomerFilters>(
    initialFilters || {
      page: 1,
      per_page: 25,
      search: "",
      status: "all",
      account_status: "all",
      sortBy: "created_at",
      sortDirection: "desc",
    }
  );
  const debouncedSearchTerm = useDebounce(filters.search, 300);

  const fetchCustomers = useCallback(async (filtersToUse: CustomerFilters, isSearchChange = false) => {
    // Set appropriate loading state
    if (isSearchChange) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }
    // For search changes, don't set loading at all to prevent refresh feeling
    setError(null);
    try {
      const response = await customerService.getCustomers(filtersToUse);

      setCustomers(response.data);
      setPagination(response.pagination);
      setFiltersState(filtersToUse);
    } catch (err: any) {
      // Check if it's a permission error (403 Forbidden)
      if (isPermissionError(err)) {
        const errorData = getErrorData(err);
        toast({
          title: "Insufficient Permissions",
          description: formatPermissionError(errorData),
          variant: "default",
          className: "bg-blue-50 border-blue-200",
        });

        setError("You don't have permission to view customer data.");
      } else {
        // Handle other errors with friendly messages
        const errorMessage = formatErrorMessage(err.message || err.response?.data?.message);
        setError(errorMessage);
        
        toast({
          variant: "destructive",
          title: getErrorTitle(err),
          description: errorMessage,
        });
      }
    } finally {
      // Clear appropriate loading state
      if (isSearchChange) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, []);  const setFilters = useCallback(
    (newFilters: Partial<CustomerFilters>) => {
      setFiltersState((prevFilters) => {
        const updatedFilters = { ...prevFilters, ...newFilters, page: 1 };
        return updatedFilters;
      });
    },
    []
  );

  const setSearchTerm = useCallback(
    (term: string) => {
      const normalized = term; // keep original casing for UI; backend handles lower()
      setFiltersState((prevFilters) => ({
        ...prevFilters,
        search: normalized,
        page: 1
      }));
    },
    []
  );

  const setSort = useCallback(
    (sortBy: string, sortDirection: 'asc' | 'desc') => {
      setFilters({ sortBy, sortDirection });
    },
    [setFilters]
  );

  const clearFilters = useCallback(() => {
    const defaultFilters = {
      page: 1,
      per_page: 25,
      search: "",
      status: "",
      account_status: "",
      sortBy: "created_at",
      sortDirection: "desc",
    };
    fetchCustomers(defaultFilters, false);
  }, [fetchCustomers]);

  const goToPage = useCallback(
    (page: number) => {
      setFiltersState((prevFilters) => {
        const newFilters = { ...prevFilters, page };
        fetchCustomers(newFilters, false);
        return newFilters;
      });
    },
    [fetchCustomers]
  );

  const changePerPage = useCallback(
    (perPage: number) => {
      setFilters({ per_page: perPage });
    },
    [setFilters]
  );

  const refresh = useCallback(() => {
    fetchCustomers(filters, false);
  }, [fetchCustomers, filters]);

  useEffect(() => {
    // Fetch customers when debounced search term changes
    const filtersWithDebouncedSearch = {
      ...filters,
      search: debouncedSearchTerm,
      page: 1
    };
    fetchCustomers(filtersWithDebouncedSearch, true); // Mark as search change
  }, [
    debouncedSearchTerm,
    filters.status,
    filters.customer_type,
    filters.account_status,
    filters.sortBy,
    filters.sortDirection,
    filters.per_page,
    fetchCustomers
  ]);

  useEffect(() => {
    // Initial fetch
    fetchCustomers(filters, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    customers,
    loading,
    searchLoading,
    error,
    pagination,
    filters,
    setSearchTerm,
    setFilters,
    setSort,
    clearFilters,
    refresh,
    goToPage,
    changePerPage,
  };
};

export interface UseCustomerResult {
  customer: CustomerData | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchCustomer: (id: number) => Promise<void>;
  createCustomer: (
    customerData: Partial<CustomerData>,
  ) => Promise<CustomerData>;
  updateCustomer: (
    id: number,
    customerData: Partial<CustomerData>,
  ) => Promise<CustomerData>;
  deleteCustomer: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCustomer = (id?: number): UseCustomerResult => {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async (customerId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await customerService.getCustomer(customerId);
      setCustomer(response);
    } catch (err: any) {
      // Check if it's a permission error (403 Forbidden)
      if (isPermissionError(err)) {
        const errorData = getErrorData(err);
        toast({
          title: "Insufficient Permissions",
          description: formatPermissionError(errorData),
          variant: "default",
          className: "bg-blue-50 border-blue-200",
        });
        
        setError("You don't have permission to view this customer's details.");
      } else if (err.response?.status === 404) {
        // Handle 404 - Customer not found
        const friendlyMessage = formatErrorMessage(err.message || err.response?.data?.message);
        setError(friendlyMessage);
        toast({
          variant: "destructive",
          title: "Customer Not Found",
          description: friendlyMessage,
        });
      } else {
        // Handle other errors using the error formatter
        const errorTitle = getErrorTitle(err);
        const errorMessage = formatErrorMessage(err.message || err.response?.data?.message);
        
        setError(errorMessage);
        
        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorMessage,
        });
        
        console.error("Error fetching customer:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(
    async (customerData: Partial<CustomerData>): Promise<CustomerData> => {
      setLoading(true);
      setError(null);

      try {
        const response = await customerService.createCustomer(customerData);
        setCustomer(response);
        return response;
      } catch (err: any) {
        // Check if it's a permission error (403 Forbidden)
        if (isPermissionError(err)) {
          const errorData = getErrorData(err);
          toast({
            title: "Insufficient Permissions",
            description: formatPermissionError(errorData),
            variant: "default",
            className: "bg-blue-50 border-blue-200",
          });
          
          setError("You don't have permission to create customers.");
        } else {
          const errorMessage = formatErrorMessage(err.message || err.response?.data?.message);
          setError(errorMessage);
          
          toast({
            variant: "destructive",
            title: getErrorTitle(err),
            description: errorMessage,
          });
        }
        console.error("Error creating customer:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateCustomer = useCallback(
    async (
      customerId: number,
      customerData: Partial<CustomerData>,
    ): Promise<CustomerData> => {
      setLoading(true);
      setError(null);

      try {
        const response = await customerService.updateCustomer(
          customerId,
          customerData,
        );
        setCustomer(response);
        return response;
      } catch (err: any) {
        // Check if it's a permission error (403 Forbidden)
        if (isPermissionError(err)) {
          const errorData = getErrorData(err);
          toast({
            title: "Insufficient Permissions",
            description: formatPermissionError(errorData),
            variant: "default",
            className: "bg-blue-50 border-blue-200",
          });
          
          setError("You don't have permission to update this customer.");
        } else {
          const errorMessage = formatErrorMessage(err.message || err.response?.data?.message);
          setError(errorMessage);
          
          toast({
            variant: "destructive",
            title: getErrorTitle(err),
            description: errorMessage,
          });
        }
        console.error("Error updating customer:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteCustomer = useCallback(
    async (customerId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await customerService.deleteCustomer(customerId);
        setCustomer(null);
      } catch (err: any) {
        // Check if it's a permission error (403 Forbidden)
        if (isPermissionError(err)) {
          const errorData = getErrorData(err);
          toast({
            title: "Insufficient Permissions",
            description: formatPermissionError(errorData),
            variant: "default",
            className: "bg-blue-50 border-blue-200",
          });
          
          setError("You don't have permission to delete this customer.");
        } else {
          const errorMessage = formatErrorMessage(err.message || err.response?.data?.message);
          setError(errorMessage);
          
          toast({
            variant: "destructive",
            title: getErrorTitle(err),
            description: errorMessage,
          });
        }
        console.error("Error deleting customer:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (id) {
      await fetchCustomer(id);
    }
  }, [id, fetchCustomer]);

  // Initial fetch if ID is provided
  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
  }, [id, fetchCustomer]);

  return {
    customer,
    loading,
    error,

    // Actions
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refresh,
  };
};

export default { useCustomers, useCustomer };
