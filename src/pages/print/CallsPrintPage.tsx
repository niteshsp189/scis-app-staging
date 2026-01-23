/**
 * Global Calls Print Page
 * Opens in new tab with all filtered call logs
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PrintLayout } from '@/components/print/PrintLayout';
import { CallTablePrint } from '@/components/print/calls';
import { CustomerActivity } from '@/services/customerActivitiesService';
import { api } from '@/lib/axios';

export const CallsPrintPage = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [calls, setCalls] = useState<CustomerActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Parse filters from URL params
  const customerType = searchParams.get('customerType') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params: Record<string, string | number> = {
          per_page: 500, // Get all for printing
        };

        if (customerType && customerType !== 'all') {
          params.customer_status = customerType;
        }
        if (startDate) {
          params.start_date = startDate;
        }
        if (endDate) {
          params.end_date = endDate;
        }

        const response = await api.get('/activities/global', { params });

        if (response.data.success) {
          setCalls(response.data.data || []);
        } else {
          setError('Failed to load call logs');
        }
      } catch (err) {
        console.error('Error fetching calls for print:', err);
        setError('An error occurred while loading call logs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalls();
  }, [customerType, startDate, endDate]);

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
        Loading call logs...
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

  // Build filter display for print component
  const filterDisplay = {
    customerType,
    startDate,
    endDate,
  };

  return (
    <PrintLayout
      title="Global Call Logs"
      subtitle={`${calls.length} call${calls.length !== 1 ? 's' : ''}`}
    >
      <CallTablePrint
        calls={calls}
        filters={filterDisplay}
      />
    </PrintLayout>
  );
};

export default CallsPrintPage;
