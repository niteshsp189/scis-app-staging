/**
 * Lookup Print Page
 * Opens in new tab with filtered lookup results (Global Search, Duplicates, or Missing Info)
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PrintLayout } from '@/components/print/PrintLayout';
import { 
  GlobalSearchTablePrint, 
  DuplicateFinderPrint, 
  MissingInfoPrint 
} from '@/components/print/lookup';
import globalSearchService, { SearchResult, SearchFilters } from '@/services/globalSearchService';
import duplicateFinderService, { 
  DuplicateGroup, 
  DuplicateSearchFilters,
  CustomerColumn 
} from '@/services/duplicateFinderService';
import missingInfoService, { 
  MissingInfoCustomer, 
  MissingInfoSearchFilters 
} from '@/services/missingInfoService';

type TabType = 'search' | 'duplicates' | 'missing';

export const LookupPrintPage = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for different tab data
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [missingInfoCustomers, setMissingInfoCustomers] = useState<MissingInfoCustomer[]>([]);
  const [availableColumns, setAvailableColumns] = useState<CustomerColumn[]>([]);

  // Parse tab type from URL params
  const tabType = (searchParams.get('tab') || 'search') as TabType;
  
  // Parse Global Search filters
  const query = searchParams.get('q') || '';
  const searchType = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || '';
  const dateFrom = searchParams.get('date_from') || '';
  
  // Parse Duplicate Finder filters
  const duplicateColumns = searchParams.get('columns')?.split(',').filter(Boolean) || [];
  const duplicateCustomerType = searchParams.get('customerType') || '';
  const matchType = (searchParams.get('matchType') || 'exact') as 'exact' | 'similar';
  
  // Parse Missing Info filters
  const missingColumns = searchParams.get('missingColumns')?.split(',').filter(Boolean) || [];
  const missingCustomerType = searchParams.get('missingCustomerType') || '';
  
  // Create stable string representations for dependency tracking
  const duplicateColumnsStr = duplicateColumns.join(',');
  const missingColumnsStr = missingColumns.join(',');

  useEffect(() => {
    // Load available columns for label display
    const columns = duplicateFinderService.getAvailableColumns();
    setAvailableColumns(columns);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (tabType === 'search') {
          // Fetch Global Search results
          if (!query) {
            setSearchResults([]);
            setIsLoading(false);
            return;
          }

          const filters: SearchFilters = {
            type: searchType as SearchFilters['type'],
            status: status || undefined,
            date_from: dateFrom || undefined,
            limit: 500, // Get more for printing
          };

          const response = await globalSearchService.search(query, filters);
          setSearchResults(response.data?.results || []);

        } else if (tabType === 'duplicates') {
          // Fetch Duplicate Finder results
          if (duplicateColumns.length === 0) {
            setDuplicateGroups([]);
            setIsLoading(false);
            return;
          }

          const filters: DuplicateSearchFilters = {
            columns: duplicateColumns,
            customer_type: duplicateCustomerType && duplicateCustomerType !== 'all' 
              ? duplicateCustomerType as DuplicateSearchFilters['customer_type']
              : undefined,
            match_type: matchType,
            limit: 100,
          };

          const response = await duplicateFinderService.findDuplicates(filters);
          setDuplicateGroups(response.data?.groups || []);

        } else if (tabType === 'missing') {
          // Fetch Missing Info results
          if (missingColumns.length === 0) {
            setMissingInfoCustomers([]);
            setIsLoading(false);
            return;
          }

          const filters: MissingInfoSearchFilters = {
            columns: missingColumns,
            customer_type: missingCustomerType && missingCustomerType !== 'all'
              ? missingCustomerType as MissingInfoSearchFilters['customer_type']
              : undefined,
            limit: 500,
          };

          const response = await missingInfoService.findMissingInformation(filters);
          setMissingInfoCustomers(response.data?.customers || []);
        }
      } catch (err) {
        console.error('Error fetching lookup data for print:', err);
        setError('An error occurred while loading data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabType, query, searchType, status, dateFrom, duplicateColumnsStr, duplicateCustomerType, matchType, missingColumnsStr, missingCustomerType]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#6b7280',
      }}>
        Loading lookup data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#ef4444',
      }}>
        {error}
      </div>
    );
  }

  // Render based on tab type
  if (tabType === 'search') {
    return (
      <PrintLayout
        title="Global Search Results"
        subtitle={`${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${query}"`}
      >
        <GlobalSearchTablePrint
          results={searchResults}
          query={query}
          filters={{
            type: searchType,
            status,
            dateFrom,
          }}
        />
      </PrintLayout>
    );
  }

  if (tabType === 'duplicates') {
    const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.duplicate_count, 0);
    return (
      <PrintLayout
        title="Duplicate Finder Results"
        subtitle={`${duplicateGroups.length} group${duplicateGroups.length !== 1 ? 's' : ''} with ${totalDuplicates} duplicate${totalDuplicates !== 1 ? 's' : ''}`}
      >
        <DuplicateFinderPrint
          groups={duplicateGroups}
          filters={{
            columns: duplicateColumns,
            customerType: duplicateCustomerType,
            matchType,
          }}
          availableColumns={availableColumns}
        />
      </PrintLayout>
    );
  }

  if (tabType === 'missing') {
    return (
      <PrintLayout
        title="Missing Information Report"
        subtitle={`${missingInfoCustomers.length} customer${missingInfoCustomers.length !== 1 ? 's' : ''} with incomplete data`}
      >
        <MissingInfoPrint
          customers={missingInfoCustomers}
          filters={{
            columns: missingColumns,
            customerType: missingCustomerType,
          }}
          availableColumns={availableColumns}
        />
      </PrintLayout>
    );
  }

  return null;
};

export default LookupPrintPage;
