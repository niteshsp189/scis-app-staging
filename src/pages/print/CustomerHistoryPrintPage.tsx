/**
 * Customer History Print Page
 * Print view for customer history/audit logs
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { PrintStyles } from '@/components/print/PrintStyles';
import { CustomerHistoryPrint } from '@/components/print/customer';
import { formatFullName } from '@/utils/printUtils';
import { customerService } from '@/services/customerService';
import { AuditService } from '@/services/auditService';

export const CustomerHistoryPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomer(customerId),
    enabled: !!customerId,
  });

  // Fetch history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['customer-history', customerId],
    queryFn: () => AuditService.getCustomerAuditLogs(customerId.toString(), { per_page: 100 }),
    enabled: !!customerId,
  });

  const isLoading = customerLoading || historyLoading;

  // Set page title
  useEffect(() => {
    if (customer) {
      const fullName = formatFullName(
        customer.firstName,
        customer.middleName,
        customer.lastName
      ) || customer.name;
      document.title = `${fullName} - History Report`;
    }
  }, [customer]);

  if (isLoading) {
    return (
      <div className="print-loading">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading history data...</p>
        </div>
        <PrintStyles />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#ef4444', fontSize: '14px' }}>Customer not found</p>
      </div>
    );
  }

  const fullName = formatFullName(
    customer.firstName,
    customer.middleName,
    customer.lastName
  ) || customer.name || 'Unknown';

  const history = Array.isArray(historyData) ? historyData : (historyData?.data || []);

  return (
    <PrintLayout
      title={`${fullName} - History Report`}
      showToolbar={true}
      showHeader={true}
      showFooter={true}
    >
      <CustomerHistoryPrint historyLogs={history} />
    </PrintLayout>
  );
};

export default CustomerHistoryPrintPage;
