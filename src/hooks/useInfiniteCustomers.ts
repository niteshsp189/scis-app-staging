import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import {
  customerService,
  CustomerListResponse,
  CustomerFilters,
} from "@/services/customerService";
import { CustomerData } from "@/types/customer";

export interface UseInfiniteCustomersResult {
  customers: CustomerData[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  filters: CustomerFilters;

  // Actions
  setSearchTerm: (term: string) => void;
  setFilters: (filters: Partial<CustomerFilters>) => void;
  setSort: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useInfiniteCustomers = (
  initialFilters?: CustomerFilters
): UseInfiniteCustomersResult => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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

  const fetchCustomers = useCallback(async (
    filtersToUse: CustomerFilters,
    append: boolean = false
  ) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCustomers([]);
      setCurrentPage(1);
    }
    
    setError(null);
    
    try {
      const response = await customerService.getCustomers(filtersToUse);
      
      if (append) {
        setCustomers(prev => [...prev, ...response.data]);
      } else {
        setCustomers(response.data);
      }
      
      setHasMore(response.pagination.current_page < response.pagination.total_pages);
      setCurrentPage(response.pagination.current_page);
      // Don't update filters to avoid overwriting user's input (e.g., trailing spaces)
      // setFiltersState(filtersToUse);
    } catch (err: any) {
      setError(err.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const setFilters = useCallback(
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
      setFiltersState((prevFilters) => ({
        ...prevFilters,
        search: term,
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
      status: "all",
      account_status: "all",
      sortBy: "created_at",
      sortDirection: "desc",
    };
    setFiltersState(defaultFilters);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = currentPage + 1;
    const filtersWithNextPage = {
      ...filters,
      search: debouncedSearchTerm,
      page: nextPage
    };
    
    await fetchCustomers(filtersWithNextPage, true);
  }, [currentPage, filters, debouncedSearchTerm, hasMore, loadingMore, fetchCustomers]);

  const refresh = useCallback(async () => {
    const refreshFilters = {
      ...filters,
      search: debouncedSearchTerm,
      page: 1
    };
    await fetchCustomers(refreshFilters, false);
  }, [filters, debouncedSearchTerm, fetchCustomers]);

  // Effect for debounced search and filter changes
  useEffect(() => {
    const filtersWithDebouncedSearch = {
      ...filters,
      search: debouncedSearchTerm,
      page: 1
    };
    fetchCustomers(filtersWithDebouncedSearch, false);
  }, [debouncedSearchTerm, filters.status, filters.sortBy, filters.sortDirection, filters.per_page, fetchCustomers]);

  // Initial fetch
  useEffect(() => {
    fetchCustomers(filters, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    customers,
    loading,
    loadingMore,
    error,
    hasMore,
    filters,
    setSearchTerm,
    setFilters,
    setSort,
    clearFilters,
    refresh,
    loadMore,
  };
};